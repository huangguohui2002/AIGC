/**
 * UserController - 用户信息接口
 * GET /user/profile        获取当前用户信息
 * PUT /user/profile        更新个人资料（昵称）
 * POST /user/daily-checkin 每日签到领取积分
 */
const User = require('#models/User');
const Transaction = require('#models/Transaction');
const db = require('#services/db.service');
const { success, fail, serverError } = require('#factories/responses/aigc');
const {
	buildDailyCheckinState,
	generateDailyCheckinReward,
	getDailyCheckinDateKey
} = require('#utils/dailyCheckin');

module.exports = UserController;

function UserController() {

	const getProfile = async (req, res) => {
		try {
			const userId = req.token?.id;
			const user = await User.findByPk(userId, {
				attributes: [
					'id',
					'phone',
					'nickname',
					'avatar',
					'points',
					'status',
					'role',
					'invite_code',
					'last_checkin_date',
					'last_checkin_at',
					'last_checkin_reward'
				]
			});

			if (!user) return fail(res, '用户不存在', 'USER_NOT_FOUND', 404);

			return success(res, '获取成功', {
				id: user.id,
				phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
				nickname: user.nickname,
				avatar: user.avatar,
				points: user.points,
				status: user.status,
				role: user.role,
				invite_code: user.invite_code,
				daily_checkin: buildDailyCheckinState(user)
			});
		} catch (error) {
			console.error('[UserController.getProfile]', error);
			return serverError(res);
		}
	};

	const updateProfile = async (req, res) => {
		const userId = req.token?.id;
		const { nickname } = req.body;

		if (nickname !== undefined) {
			const trimmed = String(nickname).trim();
			if (trimmed.length === 0 || trimmed.length > 50) {
				return fail(res, '昵称长度必须在 1-50 个字符之间');
			}
		}

		try {
			const user = await User.findByPk(userId);
			if (!user) return fail(res, '用户不存在', 'USER_NOT_FOUND', 404);

			if (nickname !== undefined) user.nickname = String(nickname).trim();
			await user.save();

			return success(res, '资料更新成功', {
				nickname: user.nickname
			});
		} catch (error) {
			console.error('[UserController.updateProfile]', error);
			return serverError(res);
		}
	};

	const dailyCheckIn = async (req, res) => {
		const userId = req.token?.id;
		const transaction = await db.transaction();

		try {
			const user = await User.findByPk(userId, {
				transaction,
				lock: true
			});

			if (!user) {
				await transaction.rollback();
				return fail(res, '用户不存在', 'USER_NOT_FOUND', 404);
			}

			const today = getDailyCheckinDateKey();
			if (user.last_checkin_date === today) {
				await transaction.rollback();
				return fail(res, '今日已签到，请明天再来', 'ALREADY_CHECKED_IN');
			}

			const reward = generateDailyCheckinReward();
			user.points += reward;
			user.last_checkin_date = today;
			user.last_checkin_at = new Date();
			user.last_checkin_reward = reward;
			await user.save({ transaction });

			await Transaction.create({
				user_id: user.id,
				type: 'admin_adjust',
				amount: reward,
				balance_after: user.points,
				related_id: user.id,
				related_type: 'daily_checkin',
				description: `每日签到奖励 +${reward} 积分`
			}, { transaction });

			await transaction.commit();

			return success(res, '签到成功', {
				reward,
				points: user.points,
				daily_checkin: buildDailyCheckinState(user)
			});
		} catch (error) {
			if (transaction && !transaction.finished) {
				await transaction.rollback();
			}
			console.error('[UserController.dailyCheckIn]', error);
			return serverError(res);
		}
	};

	return { getProfile, updateProfile, dailyCheckIn };
}
