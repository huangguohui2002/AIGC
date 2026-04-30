module.exports = {
	'GET /stats': 'AdminController.getStats',

	'GET /users': 'AdminController.getUsers',
	'POST /users': 'AdminController.createUser',
	'GET /users/:id': 'AdminController.getUserDetail',
	'PUT /users/:id': 'AdminController.updateUser',
	'PUT /users/:id/points': 'AdminController.adjustPoints',
	'PUT /users/:id/status': 'AdminController.updateUserStatus',
	'DELETE /users/:id': 'AdminController.deleteUser',

	'GET /orders': 'AdminController.getOrders',
	'GET /generations': 'AdminController.getGenerations',

	'GET /announcements': 'AdminController.getAnnouncements',
	'POST /announcements': 'AdminController.createAnnouncement',
	'PUT /announcements/:id': 'AdminController.updateAnnouncement',
	'DELETE /announcements/:id': 'AdminController.deleteAnnouncement',

	'GET /points-packages': 'AdminController.getPackages',
	'POST /points-packages': 'AdminController.createPackage',
	'PUT /points-packages/:id': 'AdminController.updatePackage',
	'DELETE /points-packages/:id': 'AdminController.deletePackage',
	'DELETE /points-packages/:id/permanent': 'AdminController.hardDeletePackage',

	'GET /configs': 'AdminController.getConfigs',
	'PUT /configs': 'AdminController.updateConfigs',

	'GET /ai-providers': 'AiProviderController.getProviders',
	'POST /ai-providers': 'AiProviderController.createProvider',
	'PUT /ai-providers/:id': 'AiProviderController.updateProvider',
	'DELETE /ai-providers/:id': 'AiProviderController.deleteProvider',

	'GET /ai-models': 'AiModelController.getModels',
	'POST /ai-models': 'AiModelController.createModel',
	'PUT /ai-models/:id': 'AiModelController.updateModel',
	'DELETE /ai-models/:id': 'AiModelController.deleteModel',

	'GET /examples/categories': 'ExampleController.adminGetCategories',
	'GET /examples': 'ExampleController.adminGetList',
};
