module.exports = {
	'GET /status': 'APIController.getStatus',

	'POST /auth/send-sms': 'AuthController.sendSms',
	'POST /auth/register': 'AuthController.register',
	'POST /auth/login': 'AuthController.login',
	'POST /auth/reset-password': 'AuthController.resetPassword',

	'GET /pay/callback': 'PayController.callback',
	'POST /pay/callback': 'PayController.callback',
	'GET /pay/notify': 'PayController.notify',
	'POST /pay/notify': 'PayController.notify',
	'GET /zhifuxpay/notify': 'PayController.notify',
	'POST /zhifuxpay/notify': 'PayController.notify',

	'GET /announcements': 'AnnouncementController.getList',
	'GET /points/packages': 'PointsController.getPackages',
	'GET /configs': 'AdminController.getConfigs',
	'GET /ai-models': 'AiModelController.getPublicModels',
	'GET /examples/categories': 'ExampleController.getCategories',
	'GET /examples': 'ExampleController.getList',
	'GET /examples/:id': 'ExampleController.getDetail',
	'POST /admin/login': 'AdminController.login',
};
