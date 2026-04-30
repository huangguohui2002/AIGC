/**
 * PointsController - 积分管理接口
 * GET /points/balance       查询积分余额
 * GET /points/packages      获取积分套餐列表
 * GET /points/transactions  积分流水列表
 */
const User = require('#models/User');
const PointsPackage = require('#models/PointsPackage');
const Transaction = require('#models/Transaction');
const { success, fail, serverError } = require('#factories/responses/aigc');

module.exports = PointsController;

function PointsController() {

	const getBalance = async (req, res) => {
		try {
			const userId = req.token?.id;
			const user = await User.findByPk(userId, {
				attributes: ['id', 'points', 'total_recharged', 'total_consumed']
			});

			if (!user) return fail(res, '用户不存在', 'USER_NOT_FOUND', 404);

			const transaction_count = await Transaction.count({ where: { user_id: userId } });

			return success(res, '获取成功', {
				points: user.points,
				total_recharged: user.total_recharged,
				total_consumed: user.total_consumed,
				transaction_count
			});
		} catch (error) {
			console.error('[PointsController.getBalance]', error);
			return serverError(res);
		}
	};

	const getPackages = async (req, res) => {
		try {
			const packages = await PointsPackage.findAll({
				where: { is_active: 1 },
				order: [['sort_order', 'ASC']],
				attributes: ['id', 'name', 'points', 'bonus_points', 'price', 'bonus_rate']
			});
			return success(res, '获取成功', { packages });
		} catch (error) {
			console.error('[PointsController.getPackages]', error);
			return serverError(res);
		}
	};

	const VALID_TYPES = ['recharge', 'consume', 'invite_reward', 'refund', 'admin_adjust', 'daily_checkin'];

	const getTransactions = async (req, res) => {
		try {
			const userId = req.token?.id;
			const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
			const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
			const offset = (page - 1) * limit;

			const where = { user_id: userId };
			if (req.query.type && VALID_TYPES.includes(req.query.type)) {
				if (req.query.type === 'daily_checkin') {
					where.type = 'admin_adjust';
					where.related_type = 'daily_checkin';
				} else {
					where.type = req.query.type;
				}
			}

			const { count, rows } = await Transaction.findAndCountAll({
				where,
				order: [['createdAt', 'DESC']],
				limit,
				offset,
				attributes: ['id', 'type', 'amount', 'balance_after', 'related_type', 'description', 'createdAt']
			});

			const list = rows.map((row) => ({
				id: row.id,
				type: row.type,
				amount: row.amount,
				balance_after: row.balance_after,
				related_type: row.related_type,
				description: row.description,
				created_at: row.createdAt
			}));

			return success(res, '获取成功', {
				list,
				total: count,
				page,
				limit
			});
		} catch (error) {
			console.error('[PointsController.getTransactions]', error);
			return serverError(res);
		}
	};

	return { getBalance, getPackages, getTransactions };
}
