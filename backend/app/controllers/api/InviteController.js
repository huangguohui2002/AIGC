/**
 * InviteController
 */
const User = require('#models/User');
const Invite = require('#models/Invite');
const { success, serverError } = require('#factories/responses/aigc');
const { buildAbsoluteUrl } = require('#utils/url');

module.exports = InviteController;

function InviteController() {
	const getInfo = async (req, res) => {
		try {
			const userId = req.token?.id;
			const user = await User.findByPk(userId, {
				attributes: ['id', 'invite_code']
			});

			const invite_count = await Invite.count({ where: { inviter_id: userId } });
			const completed_count = await Invite.count({ where: { inviter_id: userId, status: 'completed' } });

			const rewardRows = await Invite.findAll({
				where: { inviter_id: userId, status: 'completed' },
				attributes: ['reward_points']
			});
			const total_reward = rewardRows.reduce((sum, r) => sum + r.reward_points, 0);

			return success(res, '获取成功', {
				invite_code: user.invite_code,
				invite_url: buildAbsoluteUrl(req, `/register?code=${encodeURIComponent(user.invite_code)}`),
				invite_count,
				completed_count,
				total_reward
			});
		} catch (error) {
			console.error('[InviteController.getInfo]', error);
			return serverError(res);
		}
	};

	const getRecords = async (req, res) => {
		try {
			const userId = req.token?.id;
			const page = Math.max(parseInt(req.query.page) || 1, 1);
			const limit = Math.min(parseInt(req.query.limit) || 20, 100);
			const offset = (page - 1) * limit;

			const { count, rows } = await Invite.findAndCountAll({
				where: { inviter_id: userId },
				order: [['createdAt', 'DESC']],
				limit,
				offset,
				include: [{
					model: User,
					as: 'invitee',
					attributes: ['phone']
				}],
				attributes: ['id', 'reward_points', 'status', 'createdAt']
			});

			const list = rows.map(r => ({
				id: r.id,
				invitee_phone: r.invitee?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '***',
				reward_points: r.reward_points,
				status: r.status,
				created_at: r.createdAt
			}));

			return success(res, '获取成功', { list, total: count });
		} catch (error) {
			console.error('[InviteController.getRecords]', error);
			return serverError(res);
		}
	};

	return { getInfo, getRecords };
}
