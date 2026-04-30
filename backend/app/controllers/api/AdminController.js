/**
 * AdminController - 管理员后台接口
 * POST   /admin/login                        管理员登录
 * GET    /admin/stats                        仪表盘统计
 * GET    /admin/users                        用户列表
 * POST   /admin/users                        新建普通用户
 * GET    /admin/users/:id                    用户详情
 * PUT    /admin/users/:id                    编辑用户基础信息（昵称、密码）
 * PUT    /admin/users/:id/points             调整用户积分
 * PUT    /admin/users/:id/status             封禁/解禁用户
 * DELETE /admin/users/:id                    删除用户及其关联数据
 * GET    /admin/orders                       订单列表
 * GET    /admin/generations                  生成记录列表
 * GET    /admin/announcements                公告列表（含草稿）
 * POST   /admin/announcements                创建公告
 * PUT    /admin/announcements/:id            更新公告
 * DELETE /admin/announcements/:id            删除公告
 * GET    /admin/points-packages              套餐列表
 * POST   /admin/points-packages              创建套餐
 * PUT    /admin/points-packages/:id          更新套餐
 * DELETE /admin/points-packages/:id          下架套餐（软删除）
 * DELETE /admin/points-packages/:id/permanent 彻底删除套餐（硬删除）
 * GET    /admin/configs                      获取系统配置
 * PUT    /admin/configs                      更新系统配置
 */
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const User = require('#models/User');
const Order = require('#models/Order');
const Transaction = require('#models/Transaction');
const Generation = require('#models/Generation');
const Invite = require('#models/Invite');
const Announcement = require('#models/Announcement');
const PointsPackage = require('#models/PointsPackage');
const Config = require('#models/Config');
const JWT = require('#services/jwt.service');
const db = require('#services/db.service');
const { success, fail, serverError } = require('#factories/responses/aigc');
const { isValidPhone, isValidPassword } = require('#utils/validators');
const { generateInviteCode } = require('#utils/random');

module.exports = AdminController;

function AdminController() {

	// POST /admin/login
	const login = async (req, res) => {
		const { username, password } = req.body;
		if (!username || !password) return fail(res, '用户名和密码不能为空');

		try {
			// 通过 role=admin 查找管理员账号（phone 字段存储 username）
			const admin = await User.findOne({ where: { phone: username, role: 'admin' } });
			if (!admin) return fail(res, '管理员账号不存在', 'ADMIN_NOT_FOUND');

			const match = await bcrypt.compare(password, admin.password_hash);
			if (!match) return fail(res, '密码错误', 'INVALID_PASSWORD');

			if (admin.status === 'banned') return fail(res, '账号已被封禁', 'USER_BANNED', 403);

			const [tokenData] = await JWT.issueAccessToken({ id: admin.id, role: admin.role });

			return success(res, '登录成功', {
				token: tokenData.token,
				admin: { id: admin.id, username: admin.phone, role: admin.role }
			});
		} catch (error) {
			console.error('[AdminController.login]', error);
			return serverError(res);
		}
	};

	// POST /admin/users - 管理员新建普通用户
	const createUser = async (req, res) => {
		const { phone, password, nickname, initial_points = 0 } = req.body;

		if (!isValidPhone(phone)) return fail(res, '手机号格式错误', 'INVALID_PHONE');
		if (!isValidPassword(password)) return fail(res, '密码至少6位', 'INVALID_PASSWORD');
		if (isNaN(initial_points) || initial_points < 0) return fail(res, '初始积分不能为负数');

		try {
			// 检查手机号是否已注册
			const exists = await User.findOne({ where: { phone } });
			if (exists) return fail(res, '该手机号已被注册', 'PHONE_EXISTS');

			// 生成唯一邀请码（最多重试5次）
			let invite_code;
			for (let i = 0; i < 5; i++) {
				const code = generateInviteCode();
				const codeExists = await User.findOne({ where: { invite_code: code } });
				if (!codeExists) { invite_code = code; break; }
			}
			if (!invite_code) return serverError(res, '生成邀请码失败，请重试');

			const password_hash = await bcrypt.hash(password, 10);
			const points = parseInt(initial_points);

			const user = await User.create({
				phone,
				password_hash,
				nickname: nickname ? String(nickname).trim() : null,
				points,
				total_recharged: points,
				invite_code,
				status: 'normal',
				role: 'user'
			});

			return success(res, '用户创建成功', {
				id: user.id,
				phone: user.phone,
				nickname: user.nickname,
				points: user.points,
				invite_code: user.invite_code,
				status: user.status
			});
		} catch (error) {
			console.error('[AdminController.createUser]', error);
			return serverError(res);
		}
	};

	// GET /admin/stats - 仪表盘统计
	const getStats = async (req, res) => {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const [
				totalUsers, bannedUsers,
				totalOrders, paidOrders,
				totalGenerations, successGenerations,
				todayUsers, todayPaidOrders, todayGenerations
			] = await Promise.all([
				User.count({ where: { role: 'user' } }),
				User.count({ where: { status: 'banned' } }),
				Order.count(),
				Order.count({ where: { status: 'paid' } }),
				Generation.count(),
				Generation.count({ where: { status: 'success' } }),
				User.count({ where: { role: 'user', createdAt: { [Op.gte]: today } } }),
				Order.count({ where: { status: 'paid', paid_at: { [Op.gte]: today } } }),
				Generation.count({ where: { createdAt: { [Op.gte]: today } } })
			]);

			const totalRevenue = (await Order.sum('amount', { where: { status: 'paid' } })) || 0;

			return success(res, '获取成功', {
				total_users: totalUsers,
				banned_users: bannedUsers,
				total_orders: totalOrders,
				paid_orders: paidOrders,
				total_revenue: parseFloat(totalRevenue),
				total_generations: totalGenerations,
				success_generations: successGenerations,
				today: {
					new_users: todayUsers,
					paid_orders: todayPaidOrders,
					generations: todayGenerations
				}
			});
		} catch (error) {
			console.error('[AdminController.getStats]', error);
			return serverError(res);
		}
	};

	// GET /admin/users
	const getUsers = async (req, res) => {
		try {
			const page = Math.max(parseInt(req.query.page) || 1, 1);
			const limit = Math.min(parseInt(req.query.limit) || 20, 100);
			const offset = (page - 1) * limit;

			const where = {};
			if (req.query.phone) where.phone = { [Op.like]: `%${req.query.phone}%` };
			if (req.query.status) where.status = req.query.status;
			// 管理员列表只显示普通用户
			where.role = 'user';

			const { count, rows } = await User.findAndCountAll({
				where,
				order: [['createdAt', 'DESC']],
				limit,
				offset,
				attributes: ['id', 'phone', 'nickname', 'points', 'total_recharged', 'total_consumed', 'status', 'createdAt']
			});

			return success(res, '获取成功', { list: rows, total: count });
		} catch (error) {
			console.error('[AdminController.getUsers]', error);
			return serverError(res);
		}
	};

	// GET /admin/users/:id - 用户详情
	const getUserDetail = async (req, res) => {
		const { id } = req.params;
		try {
			const user = await User.findByPk(id, {
				attributes: ['id', 'phone', 'nickname', 'avatar', 'points', 'total_recharged', 'total_consumed', 'status', 'role', 'invite_code', 'inviter_id', 'createdAt']
			});
			if (!user) return fail(res, '用户不存在', 'USER_NOT_FOUND', 404);

			const [invite_count, generation_count] = await Promise.all([
				Invite.count({ where: { inviter_id: id } }),
				Generation.count({ where: { user_id: id } })
			]);

			return success(res, '获取成功', {
				id: user.id,
				phone: user.phone,
				nickname: user.nickname,
				avatar: user.avatar,
				points: user.points,
				total_recharged: user.total_recharged,
				total_consumed: user.total_consumed,
				status: user.status,
				role: user.role,
				invite_code: user.invite_code,
				inviter_id: user.inviter_id,
				invite_count,
				generation_count,
				created_at: user.createdAt
			});
		} catch (error) {
			console.error('[AdminController.getUserDetail]', error);
			return serverError(res);
		}
	};

	// PUT /admin/users/:id/points - 调整用户积分（事务保障）
	const adjustPoints = async (req, res) => {
		const { id } = req.params;
		const { amount, description } = req.body;

		if (!amount || isNaN(amount)) return fail(res, '积分变动值不能为空');
		if (!description) return fail(res, '调整原因不能为空');

		const delta = parseInt(amount);
		const t = await db.transaction();

		try {
			const user = await User.findByPk(id, { transaction: t, lock: true });
			if (!user) {
				await t.rollback();
				return fail(res, '用户不存在', 'USER_NOT_FOUND', 404);
			}

			const newPoints = user.points + delta;
			if (newPoints < 0) {
				await t.rollback();
				return fail(res, '操作后积分将为负数，不允许');
			}

			user.points = newPoints;
			await user.save({ transaction: t });

			await Transaction.create({
				user_id: user.id,
				type: 'admin_adjust',
				amount: delta,
				balance_after: newPoints,
				description
			}, { transaction: t });

			await t.commit();
			return success(res, '积分调整成功');
		} catch (error) {
			if (t && !t.finished) await t.rollback();
			console.error('[AdminController.adjustPoints]', error);
			return serverError(res);
		}
	};

	// PUT /admin/users/:id - 编辑用户基础信息（昵称、密码，手机号不可修改）
	const updateUser = async (req, res) => {
		const { id } = req.params;
		const { nickname, password } = req.body;

		// 至少提供一个可编辑字段
		if (nickname === undefined && password === undefined) {
			return fail(res, '请提供至少一个需要修改的字段');
		}

		if (password !== undefined && !isValidPassword(password)) {
			return fail(res, '密码至少6位', 'INVALID_PASSWORD');
		}

		try {
			const user = await User.findByPk(id);
			if (!user) return fail(res, '用户不存在', 'USER_NOT_FOUND', 404);
			// 仅允许编辑普通用户，不允许通过此接口修改管理员信息
			if (user.role !== 'user') return fail(res, '不允许编辑管理员账号', 'FORBIDDEN', 403);

			if (nickname !== undefined) user.nickname = nickname ? String(nickname).trim() : null;
			if (password !== undefined) user.password_hash = await bcrypt.hash(password, 10);

			await user.save();
			return success(res, '用户信息更新成功', {
				id: user.id,
				phone: user.phone,
				nickname: user.nickname
			});
		} catch (error) {
			console.error('[AdminController.updateUser]', error);
			return serverError(res);
		}
	};

	// PUT /admin/users/:id/status - 封禁/解禁用户
	const updateUserStatus = async (req, res) => {
		const { id } = req.params;
		const { status } = req.body;

		if (!['normal', 'banned'].includes(status)) return fail(res, '状态值无效');

		try {
			const user = await User.findByPk(id);
			if (!user) return fail(res, '用户不存在', 'USER_NOT_FOUND', 404);

			// 防止管理员封禁自己
			if (user.id === req.token?.id) return fail(res, '不能对自己的账号执行此操作');

			user.status = status;
			await user.save();
			return success(res, status === 'banned' ? '用户已封禁' : '用户已解禁');
		} catch (error) {
			console.error('[AdminController.updateUserStatus]', error);
			return serverError(res);
		}
	};

	// DELETE /admin/users/:id - 删除用户及其关联数据
	const deleteUser = async (req, res) => {
		const { id } = req.params;
		const t = await db.transaction();

		try {
			const user = await User.findByPk(id, { transaction: t, lock: true });
			if (!user) {
				await t.rollback();
				return fail(res, '用户不存在', 'USER_NOT_FOUND', 404);
			}

			if (user.role !== 'user') {
				await t.rollback();
				return fail(res, '不允许删除管理员账号', 'FORBIDDEN', 403);
			}

			if (user.id === req.token?.id) {
				await t.rollback();
				return fail(res, '不能删除当前登录账号');
			}

			await User.update(
				{ inviter_id: null },
				{ where: { inviter_id: user.id }, transaction: t }
			);

			await Promise.all([
				Invite.destroy({ where: { inviter_id: user.id }, transaction: t }),
				Invite.destroy({ where: { invitee_id: user.id }, transaction: t }),
				Transaction.destroy({ where: { user_id: user.id }, transaction: t }),
				Order.destroy({ where: { user_id: user.id }, transaction: t }),
				Generation.destroy({ where: { user_id: user.id }, transaction: t })
			]);

			await user.destroy({ transaction: t });

			await t.commit();
			return success(res, '用户及其关联数据已删除');
		} catch (error) {
			if (t && !t.finished) await t.rollback();
			console.error('[AdminController.deleteUser]', error);
			return serverError(res);
		}
	};

	// GET /admin/orders - 订单列表
	const getOrders = async (req, res) => {
		try {
			const page = Math.max(parseInt(req.query.page) || 1, 1);
			const limit = Math.min(parseInt(req.query.limit) || 20, 100);
			const offset = (page - 1) * limit;

			const where = {};
			if (req.query.status) where.status = req.query.status;
			if (req.query.user_id) where.user_id = req.query.user_id;

			const { count, rows } = await Order.findAndCountAll({
				where,
				order: [['createdAt', 'DESC']],
				limit,
				offset,
				include: [{ model: User, as: 'user', attributes: ['phone'] }],
				attributes: ['id', 'order_no', 'user_id', 'amount', 'points', 'status', 'paid_at', 'createdAt']
			});

			const list = rows.map(r => ({
				id: r.id,
				order_no: r.order_no,
				user_id: r.user_id,
				user_phone: r.user?.phone,
				amount: r.amount,
				points: r.points,
				status: r.status,
				paid_at: r.paid_at,
				created_at: r.createdAt
			}));

			return success(res, '获取成功', { list, total: count });
		} catch (error) {
			console.error('[AdminController.getOrders]', error);
			return serverError(res);
		}
	};

	// GET /admin/generations - 全量生成记录
	const getGenerations = async (req, res) => {
		try {
			const page = Math.max(parseInt(req.query.page) || 1, 1);
			const limit = Math.min(parseInt(req.query.limit) || 20, 100);
			const offset = (page - 1) * limit;

			const where = {};
			if (req.query.type) where.type = req.query.type;
			if (req.query.status) where.status = req.query.status;
			if (req.query.user_id) where.user_id = req.query.user_id;

			const { count, rows } = await Generation.findAndCountAll({
				where,
				order: [['createdAt', 'DESC']],
				limit,
				offset,
				include: [{ model: User, as: 'user', attributes: ['phone'] }],
				attributes: ['id', 'user_id', 'type', 'model', 'prompt', 'status', 'result_url', 'cost_points', 'error_message', 'createdAt']
			});

			const list = rows.map(r => ({
				id: r.id,
				user_id: r.user_id,
				user_phone: r.user?.phone,
				type: r.type,
				model: r.model,
				prompt: r.prompt,
				status: r.status,
				result_url: r.result_url,
				cost_points: r.cost_points,
				error_message: r.error_message,
				created_at: r.createdAt
			}));

			return success(res, '获取成功', { list, total: count });
		} catch (error) {
			console.error('[AdminController.getGenerations]', error);
			return serverError(res);
		}
	};

	// GET /admin/announcements
	const getAnnouncements = async (req, res) => {
		try {
			const page = Math.max(parseInt(req.query.page) || 1, 1);
			const limit = Math.min(parseInt(req.query.limit) || 20, 100);
			const offset = (page - 1) * limit;

			const where = {};
			if (req.query.status) where.status = req.query.status;

			const { count, rows } = await Announcement.findAndCountAll({
				where,
				order: [['createdAt', 'DESC']],
				limit,
				offset
			});

			return success(res, '获取成功', { list: rows, total: count });
		} catch (error) {
			console.error('[AdminController.getAnnouncements]', error);
			return serverError(res);
		}
	};

	// POST /admin/announcements
	const createAnnouncement = async (req, res) => {
		const { title, content, level = 'normal' } = req.body;
		if (!title || !content) return fail(res, '标题和内容不能为空');

		try {
			const item = await Announcement.create({ title, content, level });
			return success(res, '公告创建成功', { id: item.id });
		} catch (error) {
			console.error('[AdminController.createAnnouncement]', error);
			return serverError(res);
		}
	};

	// PUT /admin/announcements/:id
	const updateAnnouncement = async (req, res) => {
		const { id } = req.params;
		const { title, content, level, status } = req.body;

		try {
			const item = await Announcement.findByPk(id);
			if (!item) return fail(res, '公告不存在', null, 404);

			if (title !== undefined) item.title = title;
			if (content !== undefined) item.content = content;
			if (level !== undefined) item.level = level;
			if (status !== undefined) {
				item.status = status;
				if (status === 'published' && !item.published_at) {
					item.published_at = new Date();
				}
			}

			await item.save();
			return success(res, '公告更新成功');
		} catch (error) {
			console.error('[AdminController.updateAnnouncement]', error);
			return serverError(res);
		}
	};

	// DELETE /admin/announcements/:id
	const deleteAnnouncement = async (req, res) => {
		const { id } = req.params;
		try {
			const item = await Announcement.findByPk(id);
			if (!item) return fail(res, '公告不存在', null, 404);

			await item.destroy();
			return success(res, '公告删除成功');
		} catch (error) {
			console.error('[AdminController.deleteAnnouncement]', error);
			return serverError(res);
		}
	};

	// GET /admin/points-packages - 套餐列表（含下架）
	const getPackages = async (req, res) => {
		try {
			const packages = await PointsPackage.findAll({
				order: [['sort_order', 'ASC'], ['createdAt', 'ASC']]
			});
			return success(res, '获取成功', { packages });
		} catch (error) {
			console.error('[AdminController.getPackages]', error);
			return serverError(res);
		}
	};

	// POST /admin/points-packages - 创建套餐
	const createPackage = async (req, res) => {
		const { name, points, bonus_points = 0, price, bonus_rate = 0, sort_order = 0 } = req.body;

		if (!name || !points || !price) return fail(res, '套餐名称、积分和价格不能为空');
		if (isNaN(points) || points <= 0) return fail(res, '积分必须为正整数');
		if (isNaN(price) || price <= 0) return fail(res, '价格必须为正数');

		try {
			const pkg = await PointsPackage.create({
				name,
				points: parseInt(points),
				bonus_points: parseInt(bonus_points),
				price: parseFloat(price),
				bonus_rate: parseInt(bonus_rate),
				sort_order: parseInt(sort_order),
				is_active: 1
			});
			return success(res, '套餐创建成功', { id: pkg.id });
		} catch (error) {
			console.error('[AdminController.createPackage]', error);
			return serverError(res);
		}
	};

	// PUT /admin/points-packages/:id - 更新套餐
	const updatePackage = async (req, res) => {
		const { id } = req.params;
		const { name, points, bonus_points, price, bonus_rate, sort_order, is_active } = req.body;

		try {
			const pkg = await PointsPackage.findByPk(id);
			if (!pkg) return fail(res, '套餐不存在', null, 404);

			if (name !== undefined) pkg.name = name;
			if (points !== undefined) pkg.points = parseInt(points);
			if (bonus_points !== undefined) pkg.bonus_points = parseInt(bonus_points);
			if (price !== undefined) pkg.price = parseFloat(price);
			if (bonus_rate !== undefined) pkg.bonus_rate = parseInt(bonus_rate);
			if (sort_order !== undefined) pkg.sort_order = parseInt(sort_order);
			if (is_active !== undefined) pkg.is_active = is_active ? 1 : 0;

			await pkg.save();
			return success(res, '套餐更新成功');
		} catch (error) {
			console.error('[AdminController.updatePackage]', error);
			return serverError(res);
		}
	};

	// DELETE /admin/points-packages/:id - 下架套餐（软删除，设为不可用）
	const deletePackage = async (req, res) => {
		const { id } = req.params;
		try {
			const pkg = await PointsPackage.findByPk(id);
			if (!pkg) return fail(res, '套餐不存在', null, 404);

			pkg.is_active = 0;
			await pkg.save();
			return success(res, '套餐已下架');
		} catch (error) {
			console.error('[AdminController.deletePackage]', error);
			return serverError(res);
		}
	};

	// DELETE /admin/points-packages/:id/permanent - 硬删除套餐（彻底删除记录）
	const hardDeletePackage = async (req, res) => {
		const { id } = req.params;
		try {
			const pkg = await PointsPackage.findByPk(id);
			if (!pkg) return fail(res, '套餐不存在', null, 404);

			await pkg.destroy();
			return success(res, '套餐已彻底删除');
		} catch (error) {
			console.error('[AdminController.hardDeletePackage]', error);
			return serverError(res);
		}
	};

	// GET /admin/configs
	const getConfigs = async (req, res) => {
		try {
			const configs = await Config.getAllWithDefaults();
			return success(res, '获取成功', { configs });
		} catch (error) {
			console.error('[AdminController.getConfigs]', error);
			return serverError(res);
		}
	};

	// PUT /admin/configs
	const updateConfigs = async (req, res) => {
		const { configs } = req.body;
		if (!configs || typeof configs !== 'object') return fail(res, '参数格式错误');

		try {
			for (const [key, value] of Object.entries(configs)) {
				// 将纯数字字符串转为数字存储，避免后续逻辑读取到字符串类型
				const parsed = (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim()))
					? Number(value)
					: value;
				await Config.upsert({ key, value: parsed });
			}
			return success(res, '配置更新成功');
		} catch (error) {
			console.error('[AdminController.updateConfigs]', error);
			return serverError(res);
		}
	};

	return {
		login,
		getStats,
		getUsers,
		createUser,
		getUserDetail,
		updateUser,
		adjustPoints,
		updateUserStatus,
		deleteUser,
		getOrders,
		getGenerations,
		getAnnouncements,
		createAnnouncement,
		updateAnnouncement,
		deleteAnnouncement,
		getPackages,
		createPackage,
		updatePackage,
		deletePackage,
		hardDeletePackage,
		getConfigs,
		updateConfigs
	};
}
