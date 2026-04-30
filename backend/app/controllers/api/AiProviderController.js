const AIProvider = require('#models/AIProvider');
const AiModel = require('#models/AiModel');
const { success, fail, serverError } = require('#factories/responses/aigc');

module.exports = AiProviderController;

function AiProviderController() {
	function normalizeBaseUrl(baseUrl) {
		return String(baseUrl || '').trim().replace(/\/+$/, '');
	}

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

	async function getProviders(req, res) {
		try {
			const providers = await AIProvider.findAll({
				order: [['createdAt', 'ASC']]
			});

			return success(res, '获取成功', { providers });
		} catch (error) {
			console.error('[AiProviderController.getProviders]', error);
			return serverError(res);
		}
	}

	async function createProvider(req, res) {
		const {
			name,
			code,
			protocol = 'openai_compatible',
			base_url,
			api_key,
			enabled = 1,
			timeout_ms = 90000,
			extra_config
		} = req.body;

		if (!name || !String(name).trim()) return fail(res, 'provider name 不能为空');
		if (!code || !String(code).trim()) return fail(res, 'provider code 不能为空');
		if (protocol !== 'openai_compatible') return fail(res, '当前仅支持 openai_compatible 协议');
		if (!base_url || !normalizeBaseUrl(base_url)) return fail(res, 'provider base_url 不能为空');
		if (!api_key || !String(api_key).trim()) return fail(res, 'provider api_key 不能为空');

		let parsedExtraConfig;
		try {
			parsedExtraConfig = parseJsonField(extra_config, 'extra_config');
		} catch (error) {
			return fail(res, error.message);
		}

		try {
			const provider = await AIProvider.create({
				name: String(name).trim(),
				code: String(code).trim(),
				protocol,
				base_url: normalizeBaseUrl(base_url),
				api_key: String(api_key).trim(),
				enabled: enabled ? 1 : 0,
				timeout_ms: Math.max(parseInt(timeout_ms, 10) || 90000, 1000),
				extra_config: parsedExtraConfig === undefined ? null : parsedExtraConfig
			});

			return success(res, 'Provider 创建成功', { id: provider.id });
		} catch (error) {
			console.error('[AiProviderController.createProvider]', error);
			if (error?.name === 'SequelizeUniqueConstraintError') {
				return fail(res, 'provider code 已存在', 'PROVIDER_CODE_EXISTS');
			}
			return serverError(res);
		}
	}

	async function updateProvider(req, res) {
		const { id } = req.params;
		const {
			name,
			code,
			protocol,
			base_url,
			api_key,
			enabled,
			timeout_ms,
			extra_config
		} = req.body;

		if (protocol !== undefined && protocol !== 'openai_compatible') {
			return fail(res, '当前仅支持 openai_compatible 协议');
		}

		let parsedExtraConfig;
		try {
			parsedExtraConfig = parseJsonField(extra_config, 'extra_config');
		} catch (error) {
			return fail(res, error.message);
		}

		try {
			const provider = await AIProvider.findByPk(id);
			if (!provider) return fail(res, 'Provider 不存在', 'NOT_FOUND', 404);

			if (name !== undefined) provider.name = String(name || '').trim();
			if (code !== undefined) provider.code = String(code || '').trim();
			if (protocol !== undefined) provider.protocol = protocol;
			if (base_url !== undefined) provider.base_url = normalizeBaseUrl(base_url);
			if (api_key !== undefined) provider.api_key = String(api_key || '').trim();
			if (enabled !== undefined) provider.enabled = enabled ? 1 : 0;
			if (timeout_ms !== undefined) provider.timeout_ms = Math.max(parseInt(timeout_ms, 10) || 90000, 1000);
			if (extra_config !== undefined) provider.extra_config = parsedExtraConfig;

			await provider.save();
			return success(res, 'Provider 更新成功');
		} catch (error) {
			console.error('[AiProviderController.updateProvider]', error);
			if (error?.name === 'SequelizeUniqueConstraintError') {
				return fail(res, 'provider code 已存在', 'PROVIDER_CODE_EXISTS');
			}
			return serverError(res);
		}
	}

	async function deleteProvider(req, res) {
		const { id } = req.params;

		try {
			const provider = await AIProvider.findByPk(id);
			if (!provider) return fail(res, 'Provider 不存在', 'NOT_FOUND', 404);

			const boundModels = await AiModel.count({ where: { provider_id: id } });
			if (boundModels > 0) {
				return fail(res, '该 Provider 仍有关联模型，无法删除', 'PROVIDER_IN_USE');
			}

			await provider.destroy();
			return success(res, 'Provider 已删除');
		} catch (error) {
			console.error('[AiProviderController.deleteProvider]', error);
			return serverError(res);
		}
	}

	return {
		getProviders,
		createProvider,
		updateProvider,
		deleteProvider
	};
}
