const User = require('#models/User');
const PointsPackage = require('#models/PointsPackage');
const Order = require('#models/Order');
const Transaction = require('#models/Transaction');
const Config = require('#models/Config');
const PayService = require('#services/pay.service');
const db = require('#services/db.service');
const { generateOrderNo } = require('#utils/random');
const { getAppBaseUrl } = require('#utils/url');
const { success, fail, serverError } = require('#factories/responses/aigc');

const NOTIFY_SUCCESS_RESPONSE = 'success';
const NOTIFY_FAIL_RESPONSE = 'fail';

module.exports = PayController;

function getNotifyParams(req) {
	return { ...req.query, ...req.body };
}

function parsePaidAt(payTime) {
	const paidAt = payTime ? new Date(payTime) : new Date();
	return Number.isNaN(paidAt.getTime()) ? new Date() : paidAt;
}

function PayController() {

	const createOrder = async (req, res) => {
		const { package_id, pay_type } = req.body;
		const userId = req.token?.id;
		const normalizedPayType = typeof pay_type === 'string' ? pay_type.trim().toLowerCase() : 'alipay';

		if (!package_id) return fail(res, '请选择套餐');
		if (!PayService.SUPPORTED_PAY_TYPES.includes(normalizedPayType)) {
			return fail(res, '请选择有效的支付方式');
		}

		try {
			const pkg = await PointsPackage.findOne({ where: { id: package_id, is_active: 1 } });
			if (!pkg) return fail(res, '套餐不存在或已下架');

			const rawExpireMinutes = parseInt(await Config.getValue('order.expire_minutes', 15), 10) || 15;
			const expireMinutes = Math.max(1, Math.min(rawExpireMinutes, 15));
			const expired_at = new Date(Date.now() + expireMinutes * 60 * 1000);
			const order_no = generateOrderNo();
			const totalPoints = pkg.points + pkg.bonus_points;
			const baseUrl = getAppBaseUrl(req);
			const notifyUrl = process.env.ZHIFU_FM_NOTIFY_URL || `${baseUrl}/api/pay/notify`;
			const returnUrl = process.env.ZHIFU_FM_RETURN_URL || '';

			const order = await Order.create({
				order_no,
				user_id: userId,
				package_id: pkg.id,
				amount: pkg.price,
				points: totalPoints,
				provider: normalizedPayType,
				expired_at
			});

			const payResult = await PayService.createOrder({
				orderNo: order_no,
				amount: pkg.price,
				payType: normalizedPayType,
				subject: pkg.name,
				body: `${pkg.name} 积分充值`,
				notifyUrl,
				returnUrl,
				attach: JSON.stringify({
					orderNo: order_no,
					userId,
					packageId: pkg.id,
					payType: normalizedPayType
				}),
				payDuration: expireMinutes
			});

			if (payResult.platformOrderId) {
				order.provider_order_id = payResult.platformOrderId;
				await order.save();
			}

			return success(res, '订单创建成功', {
				order_no,
				pay_url: payResult.payUrl,
				platform_order_id: payResult.platformOrderId,
				pay_type: normalizedPayType,
				amount: Number(pkg.price),
				expired_at
			});
		} catch (error) {
			console.error('[PayController.createOrder]', error);
			if (error.message) {
				return fail(res, error.message);
			}
			return serverError(res);
		}
	};

	const handleNotify = async (req, res) => {
		const params = getNotifyParams(req);

		if (!PayService.verifyCallback(params)) {
			return res.send(NOTIFY_FAIL_RESPONSE);
		}

		const {
			orderNo,
			platformOrderNo,
			amount,
			type,
			payTime
		} = params;
		const callbackPayType = typeof type === 'string' ? type.trim().toLowerCase() : '';
		const transaction = await db.transaction();

		try {
			const order = await Order.findOne({
				where: { order_no: orderNo },
				transaction,
				lock: true
			});

			if (!order) {
				await transaction.rollback();
				return res.send(NOTIFY_FAIL_RESPONSE);
			}

			if (order.status === 'paid') {
				await transaction.rollback();
				return res.send(NOTIFY_SUCCESS_RESPONSE);
			}

			if (Number(order.amount).toFixed(2) !== Number(amount).toFixed(2)) {
				await transaction.rollback();
				return res.send(NOTIFY_FAIL_RESPONSE);
			}

			order.status = 'paid';
			order.provider = PayService.SUPPORTED_PAY_TYPES.includes(callbackPayType) ? callbackPayType : order.provider;
			order.provider_order_id = platformOrderNo || order.provider_order_id;
			order.paid_at = parsePaidAt(payTime);
			await order.save({ transaction });

			const user = await User.findByPk(order.user_id, { transaction, lock: true });
			if (!user) {
				await transaction.rollback();
				return res.send(NOTIFY_FAIL_RESPONSE);
			}

			user.points += order.points;
			user.total_recharged += order.points;
			await user.save({ transaction });

			await Transaction.create({
				user_id: user.id,
				type: 'recharge',
				amount: order.points,
				balance_after: user.points,
				related_id: order.id,
				related_type: 'order',
				description: `充值订单 ${orderNo}`
			}, { transaction });

			await transaction.commit();
			return res.send(NOTIFY_SUCCESS_RESPONSE);
		} catch (error) {
			if (!transaction.finished) {
				await transaction.rollback();
			}
			console.error('[PayController.handleNotify]', error);
			return res.send(NOTIFY_FAIL_RESPONSE);
		}
	};

	const callback = handleNotify;
	const notify = handleNotify;

	const getOrders = async (req, res) => {
		try {
			const userId = req.token?.id;
			const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
			const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
			const offset = (page - 1) * limit;
			const where = { user_id: userId };
			if (req.query.status) where.status = req.query.status;

			const { count, rows } = await Order.findAndCountAll({
				where,
				order: [['createdAt', 'DESC']],
				limit,
				offset,
				attributes: ['id', 'order_no', 'amount', 'points', 'status', 'paid_at', 'createdAt']
			});

			return success(res, '获取成功', { list: rows, total: count });
		} catch (error) {
			console.error('[PayController.getOrders]', error);
			return serverError(res);
		}
	};

	return { createOrder, callback, notify, getOrders };
}
