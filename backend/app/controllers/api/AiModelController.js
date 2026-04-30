const { Op } = require('sequelize');
const AiModel = require('#models/AiModel');
const AIProvider = require('#models/AIProvider');
const GenerationGateway = require('#services/generation.gateway');
const { success, fail, serverError } = require('#factories/responses/aigc');

module.exports = AiModelController;

function AiModelController() {
	function parseJsonField(value, fieldName) {
		if (value === undefined) return undefined;
		if (value === null || value === '') return null;
		if (typeof value === 'object') return value;

		try {
			return JSON.parse(value);
		} catch (error) {
			void error;
			throw new Error(`${fieldName} must be valid JSON`);
		}
	}

	function normalizeProviderBaseUrl(baseUrl) {
		let normalized = String(baseUrl || '').trim().replace(/\/+$/, '');
		if (!normalized) return '';

		const knownSuffixes = [
			'/chat/completions',
			'/responses',
			'/images/generations',
			'/images/edits',
			'/videos'
		];

		for (const suffix of knownSuffixes) {
			if (normalized.toLowerCase().endsWith(suffix)) {
				normalized = normalized.slice(0, -suffix.length);
				break;
			}
		}

		return normalized.replace(/\/+$/, '');
	}

	function buildProviderIdentitySeed(baseUrl = '') {
		return String(baseUrl)
			.toLowerCase()
			.replace(/^https?:\/\//, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 40) || 'openai-provider';
	}

	async function buildUniqueProviderCode(baseSeed) {
		const seed = buildProviderIdentitySeed(baseSeed);
		let attempt = 0;

		while (attempt < 20) {
			const candidate = attempt === 0
				? seed
				: `${seed}-${Date.now().toString(36)}-${attempt}`;
			const exists = await AIProvider.findOne({ where: { code: candidate } });
			if (!exists) return candidate;
			attempt += 1;
		}

		return `${seed}-${Date.now().toString(36)}`;
	}

	async function loadEnabledProvider(providerId) {
		return AIProvider.findOne({
			where: {
				id: providerId,
				enabled: 1
			}
		});
	}

	async function resolveProviderFromPayload(payload = {}) {
		if (payload.provider_id) {
			return loadEnabledProvider(payload.provider_id);
		}

		const legacyEndpoint = normalizeProviderBaseUrl(payload.api_endpoint);
		const legacyApiKey = String(payload.api_key || '').trim();
		if (!legacyEndpoint || !legacyApiKey) {
			return null;
		}

		const existingProvider = await AIProvider.findOne({
			where: {
				protocol: 'openai_compatible',
				base_url: legacyEndpoint,
				api_key: legacyApiKey
			}
		});
		if (existingProvider) {
			if (!existingProvider.enabled) {
				existingProvider.enabled = 1;
				await existingProvider.save();
			}
			return existingProvider;
		}

		const providerName = String(payload.provider_name || '').trim() || buildProviderIdentitySeed(legacyEndpoint);
		const providerCode = String(payload.provider_code || '').trim() || await buildUniqueProviderCode(legacyEndpoint);

		return AIProvider.create({
			name: providerName,
			code: providerCode,
			protocol: 'openai_compatible',
			base_url: legacyEndpoint,
			api_key: legacyApiKey,
			enabled: 1,
			timeout_ms: 90000,
			extra_config: null
		});
	}

	async function getPublicModels(req, res) {
		try {
			const where = { is_active: 1 };
			if (req.query.type && ['image', 'video'].includes(req.query.type)) {
				where.type = { [Op.in]: [req.query.type, 'both'] };
			}

			const models = await AiModel.findAll({
				where,
				order: [['sort_order', 'ASC'], ['createdAt', 'ASC']],
				attributes: [
					'id',
					'name',
					'subtitle',
					'type',
					'model_name',
					'sort_order',
					'points_cost',
					'capabilities',
					'default_params'
				],
				include: [
					{
						model: AIProvider,
						as: 'provider',
						attributes: ['id', 'name', 'code', 'protocol'],
						where: { enabled: 1 },
						required: true
					}
				]
			});

			const result = models.map((model) => ({
				...model.toJSON(),
				capabilities: GenerationGateway.getModelCapabilities(model)
			}));

			return success(res, '获取成功', { models: result });
		} catch (error) {
			console.error('[AiModelController.getPublicModels]', error);
			return serverError(res);
		}
	}

	async function getModels(req, res) {
		try {
			const models = await AiModel.findAll({
				order: [['sort_order', 'ASC'], ['createdAt', 'ASC']],
				include: [
					{
						model: AIProvider,
						as: 'provider',
						attributes: ['id', 'name', 'code', 'protocol', 'base_url', 'enabled', 'timeout_ms']
					}
				]
			});

			return success(res, '获取成功', { models });
		} catch (error) {
			console.error('[AiModelController.getModels]', error);
			return serverError(res);
		}
	}

	async function createModel(req, res) {
		const {
			name,
			subtitle,
			type,
			provider_id,
			provider_name,
			provider_code,
			api_endpoint,
			api_key,
			model_name,
			sort_order = 0,
			is_active = 1,
			points_cost = 0,
			capabilities,
			default_params
		} = req.body;

		if (!name || !String(name).trim()) return fail(res, '模型显示名称不能为空');
		if (!['image', 'video', 'both'].includes(type)) return fail(res, 'type 只能是 image / video / both');
		if (!provider_id && !(api_endpoint && api_key)) return fail(res, 'provider_id 不能为空');
		if (!model_name || !String(model_name).trim()) return fail(res, '模型标识符 model_name 不能为空');
		if (Number.isNaN(parseInt(points_cost, 10)) || parseInt(points_cost, 10) < 0) {
			return fail(res, '积分额度必须为非负整数');
		}

		let parsedCapabilities;
		let parsedDefaultParams;
		try {
			parsedCapabilities = parseJsonField(capabilities, 'capabilities');
			parsedDefaultParams = parseJsonField(default_params, 'default_params');
		} catch (error) {
			return fail(res, error.message);
		}

		try {
			const provider = await resolveProviderFromPayload({
				provider_id,
				provider_name,
				provider_code,
				api_endpoint,
				api_key
			});
			if (!provider) return fail(res, 'provider 不存在或未启用', 'PROVIDER_NOT_FOUND');

			const model = await AiModel.create({
				name: String(name).trim(),
				subtitle: subtitle ? String(subtitle).trim() : null,
				type,
				provider_id: provider.id,
				model_name: String(model_name).trim(),
				sort_order: parseInt(sort_order, 10) || 0,
				is_active: is_active ? 1 : 0,
				points_cost: parseInt(points_cost, 10),
				capabilities: parsedCapabilities === undefined ? null : parsedCapabilities,
				default_params: parsedDefaultParams === undefined ? null : parsedDefaultParams
			});

			return success(res, '模型创建成功', { id: model.id, provider_id: provider.id });
		} catch (error) {
			console.error('[AiModelController.createModel]', error);
			return serverError(res);
		}
	}

	async function updateModel(req, res) {
		const { id } = req.params;
		const {
			name,
			subtitle,
			type,
			provider_id,
			provider_name,
			provider_code,
			api_endpoint,
			api_key,
			model_name,
			sort_order,
			is_active,
			points_cost,
			capabilities,
			default_params
		} = req.body;

		if (type !== undefined && !['image', 'video', 'both'].includes(type)) {
			return fail(res, 'type 只能是 image / video / both');
		}
		if (points_cost !== undefined && (Number.isNaN(parseInt(points_cost, 10)) || parseInt(points_cost, 10) < 0)) {
			return fail(res, '积分额度必须为非负整数');
		}

		let parsedCapabilities;
		let parsedDefaultParams;
		try {
			parsedCapabilities = parseJsonField(capabilities, 'capabilities');
			parsedDefaultParams = parseJsonField(default_params, 'default_params');
		} catch (error) {
			return fail(res, error.message);
		}

		try {
			const model = await AiModel.findByPk(id);
			if (!model) return fail(res, '模型不存在', 'NOT_FOUND', 404);

			if (provider_id !== undefined || api_endpoint !== undefined || api_key !== undefined) {
				const provider = await resolveProviderFromPayload({
					provider_id,
					provider_name,
					provider_code,
					api_endpoint,
					api_key
				});
				if (!provider) return fail(res, 'provider 不存在或未启用', 'PROVIDER_NOT_FOUND');
				model.provider_id = provider.id;
			}

			if (name !== undefined) model.name = String(name || '').trim();
			if (subtitle !== undefined) model.subtitle = subtitle ? String(subtitle).trim() : null;
			if (type !== undefined) model.type = type;
			if (model_name !== undefined) model.model_name = String(model_name || '').trim();
			if (sort_order !== undefined) model.sort_order = parseInt(sort_order, 10) || 0;
			if (is_active !== undefined) model.is_active = is_active ? 1 : 0;
			if (points_cost !== undefined) model.points_cost = parseInt(points_cost, 10);
			if (capabilities !== undefined) model.capabilities = parsedCapabilities;
			if (default_params !== undefined) model.default_params = parsedDefaultParams;

			await model.save();
			return success(res, '模型更新成功', { provider_id: model.provider_id });
		} catch (error) {
			console.error('[AiModelController.updateModel]', error);
			return serverError(res);
		}
	}

	async function deleteModel(req, res) {
		const { id } = req.params;
		try {
			const model = await AiModel.findByPk(id);
			if (!model) return fail(res, '模型不存在', 'NOT_FOUND', 404);

			await model.destroy();
			return success(res, '模型已删除');
		} catch (error) {
			console.error('[AiModelController.deleteModel]', error);
			return serverError(res);
		}
	}

	return {
		getPublicModels,
		getModels,
		createModel,
		updateModel,
		deleteModel
	};
}
