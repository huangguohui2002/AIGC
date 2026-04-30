module.exports = {
	// 用户信息
	'GET /user/profile': 'UserController.getProfile',
	'PUT /user/profile': 'UserController.updateProfile',
	'POST /user/daily-checkin': 'UserController.dailyCheckIn',

	// 认证（需要 JWT）
	'POST /auth/change-password': 'AuthController.changePassword',

	// 积分
	'GET /points/balance': 'PointsController.getBalance',
	'GET /points/transactions': 'PointsController.getTransactions',

	// 支付
	'POST /pay/create-order': 'PayController.createOrder',
	'GET /pay/orders': 'PayController.getOrders',

	// 生成
	'POST /generate/image': 'GenerateController.generateImage',
	'POST /generate/video': 'GenerateController.generateVideo',
	'POST /generate/result': 'GenerateController.getResult',
	'GET /generate/records': 'GenerateController.getRecords',

	// 邀请
	'GET /invite/info': 'InviteController.getInfo',
	'GET /invite/records': 'InviteController.getRecords',
};
