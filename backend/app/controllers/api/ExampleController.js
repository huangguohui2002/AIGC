/**
 * ExampleController - 示例展示模块接口
 * GET    /examples/categories              公开 - 分类列表（仅激活）
 * GET    /examples                         公开 - 示例分页列表（仅激活）
 * GET    /examples/:id                     公开 - 示例详情（仅激活）
 * POST   /examples/categories              管理员 - 创建分类
 * PUT    /examples/categories/:id          管理员 - 更新分类
 * DELETE /examples/categories/:id          管理员 - 删除分类
 * POST   /examples                         管理员 - 创建示例
 * PUT    /examples/:id                     管理员 - 更新示例
 * DELETE /examples/:id                     管理员 - 删除示例（?permanent=true 硬删除）
 * GET    /admin/examples                   管理员 - 全量示例列表（含未激活）
 * GET    /admin/examples/categories        管理员 - 全量分类列表（含未激活）
 */
const { Op } = require('sequelize');
const ExampleCategory = require('#models/ExampleCategory');
const ExampleItem = require('#models/ExampleItem');
const ExampleImage = require('#models/ExampleImage');
const db = require('#services/db.service');
const { success, fail, serverError } = require('#factories/responses/aigc');

module.exports = ExampleController;

function ExampleController() {

	/** 校验 URL 是否为合法 http/https 地址 */
	function _isValidUrl(url) {
		try {
			const u = new URL(url);
			return ['http:', 'https:'].includes(u.protocol);
		} catch {
			return false;
		}
	}

	/** 规范化图片数组，过滤非法条目 */
	function _normalizeImages(images) {
		if (!Array.isArray(images)) return [];
		return images.map((img, idx) => ({
			url: String(img.url || '').trim(),
			label: img.label ? String(img.label).trim().slice(0, 50) : null,
			order: Number.isInteger(img.order) ? img.order : idx,
			metadata: img.metadata || null
		}));
	}

	/** LIKE 查询特殊字符转义，防止通配符滥用 */
	function _escapeLike(str) {
		return String(str).replace(/[%_\\]/g, '\\$&');
	}

	// ───────────────────────── 公开接口 ─────────────────────────

	// GET /examples/categories
	const getCategories = async (req, res) => {
		try {
			const categories = await ExampleCategory.findAll({
				where: { is_active: true },
				order: [['sort', 'ASC'], ['createdAt', 'ASC']],
				attributes: ['id', 'name', 'description', 'sort']
			});
			return success(res, '获取成功', { categories });
		} catch (error) {
			console.error('[ExampleController.getCategories]', error);
			return serverError(res);
		}
	};

	// GET /examples
	const getList = async (req, res) => {
		const page = Math.max(1, parseInt(req.query.page) || 1);
		const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
		const { categoryId, q, sort } = req.query;

		const where = { is_active: true };
		if (categoryId) where.category_id = parseInt(categoryId);
		if (q) {
			const keyword = _escapeLike(q);
			where[Op.or] = [
				{ title: { [Op.like]: `%${keyword}%` } },
				{ prompt: { [Op.like]: `%${keyword}%` } }
			];
		}

		const orderField = sort === 'createdAt' ? 'createdAt' : 'sort';
		const orderDir = sort === 'createdAt' ? 'DESC' : 'ASC';

		try {
			const { count, rows } = await ExampleItem.findAndCountAll({
				where,
				order: [[orderField, orderDir]],
				limit: pageSize,
				offset: (page - 1) * pageSize,
				include: [
					{ model: ExampleCategory, as: 'category', attributes: ['id', 'name'] },
					{ model: ExampleImage, as: 'images', separate: true, order: [['order', 'ASC']] }
				]
			});
			return success(res, '获取成功', { list: rows, total: count });
		} catch (error) {
			console.error('[ExampleController.getList]', error);
			return serverError(res);
		}
	};

	// GET /examples/:id
	const getDetail = async (req, res) => {
		const id = parseInt(req.params.id);
		if (!id) return fail(res, '参数错误');

		try {
			const item = await ExampleItem.findOne({
				where: { id, is_active: true },
				include: [
					{ model: ExampleCategory, as: 'category', attributes: ['id', 'name'] },
					{ model: ExampleImage, as: 'images', separate: true, order: [['order', 'ASC']] }
				]
			});
			if (!item) return fail(res, '示例不存在', 'NOT_FOUND', 404);
			return success(res, '获取成功', item);
		} catch (error) {
			console.error('[ExampleController.getDetail]', error);
			return serverError(res);
		}
	};

	// ───────────────────────── 管理员 - 分类管理 ─────────────────────────

	// POST /examples/categories
	const createCategory = async (req, res) => {
		const { name, description, sort = 0, is_active = true } = req.body;
		if (!name || !String(name).trim()) return fail(res, '分类名称不能为空');

		try {
			const category = await ExampleCategory.create({
				name: String(name).trim(),
				description: description ? String(description).trim() : null,
				sort: parseInt(sort) || 0,
				is_active: Boolean(is_active)
			});
			return success(res, '分类创建成功', { id: category.id });
		} catch (error) {
			console.error('[ExampleController.createCategory]', error);
			return serverError(res);
		}
	};

	// PUT /examples/categories/:id
	const updateCategory = async (req, res) => {
		const id = parseInt(req.params.id);
		if (!id) return fail(res, '参数错误');

		const { name, description, sort, is_active } = req.body;
		if (name !== undefined && !String(name).trim()) return fail(res, '分类名称不能为空');

		try {
			const category = await ExampleCategory.findByPk(id);
			if (!category) return fail(res, '分类不存在', 'NOT_FOUND', 404);

			const updates = {};
			if (name !== undefined) updates.name = String(name).trim();
			if (description !== undefined) updates.description = description ? String(description).trim() : null;
			if (sort !== undefined) updates.sort = parseInt(sort) || 0;
			if (is_active !== undefined) updates.is_active = Boolean(is_active);

			await category.update(updates);
			return success(res, '分类更新成功');
		} catch (error) {
			console.error('[ExampleController.updateCategory]', error);
			return serverError(res);
		}
	};

	// DELETE /examples/categories/:id
	const deleteCategory = async (req, res) => {
		const id = parseInt(req.params.id);
		if (!id) return fail(res, '参数错误');

		try {
			const category = await ExampleCategory.findByPk(id);
			if (!category) return fail(res, '分类不存在', 'NOT_FOUND', 404);

			const itemCount = await ExampleItem.count({ where: { category_id: id } });
			if (itemCount > 0) return fail(res, `该分类下有 ${itemCount} 个示例，请先删除或移动示例`);

			await category.destroy();
			return success(res, '分类删除成功');
		} catch (error) {
			console.error('[ExampleController.deleteCategory]', error);
			return serverError(res);
		}
	};

	// ───────────────────────── 管理员 - 示例管理 ─────────────────────────

	// POST /examples
	const createExample = async (req, res) => {
		const { category_id, title, display_type, prompt, sort = 0, is_active = true, images = [] } = req.body;

		if (!category_id) return fail(res, 'category_id 不能为空');
		if (!title || !String(title).trim()) return fail(res, '标题不能为空');
		if (!['single', 'comparison'].includes(display_type)) return fail(res, 'display_type 只能为 single 或 comparison');
		if (!prompt || !String(prompt).trim()) return fail(res, 'prompt 不能为空');
		if (String(prompt).length > 1000) return fail(res, 'prompt 最多 1000 字');

		const normalizedImages = _normalizeImages(images);
		for (const img of normalizedImages) {
			if (!img.url || !_isValidUrl(img.url)) return fail(res, `图片 URL 格式不合法: ${img.url}`);
		}

		try {
			const category = await ExampleCategory.findByPk(parseInt(category_id));
			if (!category) return fail(res, '分类不存在');

			const t = await db.transaction();
			let example;
			try {
				example = await ExampleItem.create({
					category_id: parseInt(category_id),
					title: String(title).trim(),
					display_type,
					prompt: String(prompt).trim(),
					sort: parseInt(sort) || 0,
					is_active: Boolean(is_active)
				}, { transaction: t });

				if (normalizedImages.length > 0) {
					await ExampleImage.bulkCreate(
						normalizedImages.map(img => ({ ...img, example_id: example.id })),
						{ transaction: t }
					);
				}
				await t.commit();
			} catch (err) {
				await t.rollback();
				throw err;
			}

			return success(res, '示例创建成功', { id: example.id });
		} catch (error) {
			console.error('[ExampleController.createExample]', error);
			return serverError(res);
		}
	};

	// PUT /examples/:id
	const updateExample = async (req, res) => {
		const id = parseInt(req.params.id);
		if (!id) return fail(res, '参数错误');

		const { category_id, title, display_type, prompt, sort, is_active, images } = req.body;

		if (title !== undefined && !String(title).trim()) return fail(res, '标题不能为空');
		if (display_type !== undefined && !['single', 'comparison'].includes(display_type)) {
			return fail(res, 'display_type 只能为 single 或 comparison');
		}
		if (prompt !== undefined) {
			if (!String(prompt).trim()) return fail(res, 'prompt 不能为空');
			if (String(prompt).length > 1000) return fail(res, 'prompt 最多 1000 字');
		}

		let normalizedImages;
		if (images !== undefined) {
			normalizedImages = _normalizeImages(images);
			for (const img of normalizedImages) {
				if (!img.url || !_isValidUrl(img.url)) return fail(res, `图片 URL 格式不合法: ${img.url}`);
			}
		}

		try {
			const example = await ExampleItem.findByPk(id);
			if (!example) return fail(res, '示例不存在', 'NOT_FOUND', 404);

			const updates = {};
			if (category_id !== undefined) {
				const category = await ExampleCategory.findByPk(parseInt(category_id));
				if (!category) return fail(res, '分类不存在');
				updates.category_id = parseInt(category_id);
			}
			if (title !== undefined) updates.title = String(title).trim();
			if (display_type !== undefined) updates.display_type = display_type;
			if (prompt !== undefined) updates.prompt = String(prompt).trim();
			if (sort !== undefined) updates.sort = parseInt(sort) || 0;
			if (is_active !== undefined) updates.is_active = Boolean(is_active);

			const t = await db.transaction();
			try {
				await example.update(updates, { transaction: t });

				// 若传入 images 字段则整体替换
				if (normalizedImages !== undefined) {
					await ExampleImage.destroy({ where: { example_id: id }, transaction: t });
					if (normalizedImages.length > 0) {
						await ExampleImage.bulkCreate(
							normalizedImages.map(img => ({ ...img, example_id: id })),
							{ transaction: t }
						);
					}
				}
				await t.commit();
			} catch (err) {
				await t.rollback();
				throw err;
			}

			return success(res, '示例更新成功');
		} catch (error) {
			console.error('[ExampleController.updateExample]', error);
			return serverError(res);
		}
	};

	// DELETE /examples/:id  (?permanent=true 硬删除，默认软删除)
	const deleteExample = async (req, res) => {
		const id = parseInt(req.params.id);
		if (!id) return fail(res, '参数错误');

		try {
			const example = await ExampleItem.findByPk(id);
			if (!example) return fail(res, '示例不存在', 'NOT_FOUND', 404);

			if (req.query.permanent === 'true') {
				// 硬删除：同时删除关联图片
				const t = await db.transaction();
				try {
					await ExampleImage.destroy({ where: { example_id: id }, transaction: t });
					await example.destroy({ transaction: t });
					await t.commit();
				} catch (err) {
					await t.rollback();
					throw err;
				}
				return success(res, '示例已彻底删除');
			}

			// 软删除：下架
			await example.update({ is_active: false });
			return success(res, '示例已下架');
		} catch (error) {
			console.error('[ExampleController.deleteExample]', error);
			return serverError(res);
		}
	};

	// ───────────────────────── 管理员 - 查看全量数据 ─────────────────────────

	// GET /admin/examples/categories
	const adminGetCategories = async (req, res) => {
		try {
			const categories = await ExampleCategory.findAll({
				order: [['sort', 'ASC'], ['createdAt', 'ASC']]
			});
			return success(res, '获取成功', { categories });
		} catch (error) {
			console.error('[ExampleController.adminGetCategories]', error);
			return serverError(res);
		}
	};

	// GET /admin/examples
	const adminGetList = async (req, res) => {
		const page = Math.max(1, parseInt(req.query.page) || 1);
		const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
		const { categoryId, q, sort, is_active } = req.query;

		const where = {};
		if (categoryId) where.category_id = parseInt(categoryId);
		if (is_active !== undefined) where.is_active = is_active === 'true';
		if (q) {
			const keyword = _escapeLike(q);
			where[Op.or] = [
				{ title: { [Op.like]: `%${keyword}%` } },
				{ prompt: { [Op.like]: `%${keyword}%` } }
			];
		}

		const orderField = sort === 'sort' ? 'sort' : 'createdAt';

		try {
			const { count, rows } = await ExampleItem.findAndCountAll({
				where,
				order: [[orderField, 'DESC']],
				limit: pageSize,
				offset: (page - 1) * pageSize,
				include: [
					{ model: ExampleCategory, as: 'category', attributes: ['id', 'name'] },
					{ model: ExampleImage, as: 'images', separate: true, order: [['order', 'ASC']] }
				]
			});
			return success(res, '获取成功', { list: rows, total: count });
		} catch (error) {
			console.error('[ExampleController.adminGetList]', error);
			return serverError(res);
		}
	};

	return {
		getCategories,
		getList,
		getDetail,
		createCategory,
		updateCategory,
		deleteCategory,
		createExample,
		updateExample,
		deleteExample,
		adminGetCategories,
		adminGetList
	};
}
