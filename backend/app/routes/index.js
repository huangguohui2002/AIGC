/**
 * Middleware for app routes initialization.
 */

// Routes:
const apiRoutes = require('#routes/api');
const webRoutes = require('#routes/web');
// Policies:
const accessTokenMiddleware = require('#policies/accessToken.policy');
const adminRoleMiddleware = require('#policies/adminRole.policy');
// Mapper of routes to controllers.
const mapRoutes = require('express-routes-mapper');
// 图片上传（multer 需手动挂载，不能通过 express-routes-mapper 注入）
const { tempUpload, exampleUpload } = require('#services/upload.service');
const UploadController = require('#controllers/api/UploadController');


module.exports = _setUpRoutes;

function _setUpRoutes(options = {}) {
	try {
		const app = options?.app;

		// 1. 公共路由，无需鉴权（含 POST /api/admin/login）
		app.use('/api', mapRoutes(apiRoutes.public, 'app/controllers/api/'));

		// 2. 普通用户私有路由，每条路由内联 JWT 鉴权中间件
		//    前端直接调用 /api/points/balance、/api/generate/records 等，无 /private/ 前缀
		app.use('/api', mapRoutes(apiRoutes.private, 'app/controllers/api/', [accessTokenMiddleware]));

		// 3. 管理员路由，每条路由内联 JWT + admin 角色鉴权中间件
		//    POST /api/admin/login 已在步骤 1 完成，不会到达此处
		app.use('/api/admin', mapRoutes(apiRoutes.admin, 'app/controllers/api/', [accessTokenMiddleware, adminRoleMiddleware]));

		// 4. 示例模块写操作（POST/PUT/DELETE /api/examples/...），需管理员权限
		//    GET 读取操作挂在公开路由（步骤 1），通过 HTTP 方法区分权限
		app.use('/api', mapRoutes(apiRoutes.exampleAdmin, 'app/controllers/api/', [accessTokenMiddleware, adminRoleMiddleware]));

		// 5. 图片上传路由（multer 需单独挂载）
		//    普通用户：上传临时图片（用于图生图 / 图生视频参考图）
		app.post(
			'/api/upload/temp-image',
			accessTokenMiddleware,
			tempUpload.single('image'),
			UploadController().uploadTempImage
		);
		//    管理员：上传示例图片（永久存储）
		app.post(
			'/api/admin/upload/example-image',
			accessTokenMiddleware,
			adminRoleMiddleware,
			exampleUpload.single('image'),
			UploadController().uploadExampleImage
		);

		// Web 页面路由
		app.use('/', mapRoutes(webRoutes.public, 'app/controllers/web/'));

		return (req, res, next) => next();
	}
	catch (error) {
		const err = new Error(`Could not setup routes: ${error.message}`);
		err.name = error?.name;
		err.code = error?.code;
		throw err;
	}
}
