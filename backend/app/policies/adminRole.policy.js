/**
 * 管理员角色鉴权中间件
 * 在 accessToken.policy 之后执行，确认 role === 'admin'
 */
const { fail } = require('#factories/responses/aigc');

module.exports = (req, res, next) => {
	if (req.token?.role !== 'admin') {
		return fail(res, '无权限，仅管理员可访问', 'FORBIDDEN', 403);
	}
	return next();
};
