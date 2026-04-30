/**
 * 示例管理写操作路由（管理员权限）
 * 挂载于 /api，与公开 GET 路由共享路径前缀，通过 HTTP 方法区分权限
 */
module.exports = {
	// 分类管理
	'POST /examples/categories': 'ExampleController.createCategory',
	'PUT /examples/categories/:id': 'ExampleController.updateCategory',
	'DELETE /examples/categories/:id': 'ExampleController.deleteCategory',

	// 示例管理
	'POST /examples': 'ExampleController.createExample',
	'PUT /examples/:id': 'ExampleController.updateExample',
	'DELETE /examples/:id': 'ExampleController.deleteExample',
};
