/**
 * AnnouncementController - 公告模块接口（用户端）
 * GET /announcements 获取已发布公告列表
 */
const Announcement = require('#models/Announcement');
const { success, serverError } = require('#factories/responses/aigc');

module.exports = AnnouncementController;

function AnnouncementController() {

	// GET /announcements
	const getList = async (req, res) => {
		try {
			const page = Math.max(parseInt(req.query.page) || 1, 1);
			const limit = Math.min(parseInt(req.query.limit) || 20, 100);
			const offset = (page - 1) * limit;

			const { count, rows } = await Announcement.findAndCountAll({
				where: { status: 'published' },
				order: [['published_at', 'DESC']],
				limit,
				offset,
				attributes: ['id', 'title', 'content', 'level', 'published_at']
			});

			return success(res, '获取成功', { list: rows, total: count });
		} catch (error) {
			console.error('[AnnouncementController.getList]', error);
			return serverError(res);
		}
	};

	return { getList };
}
