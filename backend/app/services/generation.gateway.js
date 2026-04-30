const { Op } = require('sequelize');
const AiModel = require('#models/AiModel');
const AIProvider = require('#models/AIProvider');
const OpenAICompatibleAdapter = require('#services/providers/openai-compatible.adapter');

const ADAPTERS = {
	openai_compatible: OpenAICompatibleAdapter
};

const VIDEO_SIZE_BY_ASPECT_RATIO = {
	'16:9': '1280x720',
	'9:16': '720x1280'
};

function sanitizeOptions(value) {
	return Array.isArray(value) ? value.filter((item) => item !== undefined && item !== null && item !== '') : [];
}

function normalizeReferenceUrls(...candidates) {
	return candidates
		.flatMap((candidate) => (Array.isArray(candidate) ? candidate : [candidate]))
		.filter((item) => typeof item === 'string' && item.trim())
		.map((item) => item.trim());
}

function getAdapter(provider) {
	const adapter = ADAPTERS[provider?.protocol];
	if (!adapter) {
		throw new Error(`Unsupported provider protocol: ${provider?.protocol || 'unknown'}`);
	}
	return adapter;
}

function getModelCapabilities(aiModel) {
	if (!aiModel) return {};
	return aiModel.capabilities && typeof aiModel.capabilities === 'object'
		? aiModel.capabilities
		: {};
}

function getDefaultParams(aiModel) {
	if (!aiModel) return {};
	return aiModel.default_params && typeof aiModel.default_params === 'object'
		? aiModel.default_params
		: {};
}

function pickOption(value, options = [], fallbackValue) {
	const normalizedOptions = sanitizeOptions(options);
	if (value !== undefined && value !== null && value !== '' && normalizedOptions.includes(value)) {
		return value;
	}

	if (fallbackValue !== undefined && fallbackValue !== null && fallbackValue !== '' && normalizedOptions.includes(fallbackValue)) {
		return fallbackValue;
	}

	return normalizedOptions[0] !== undefined ? normalizedOptions[0] : fallbackValue;
}

function pickIntegerOption(value, options = [], fallbackValue) {
	const normalizedOptions = sanitizeOptions(options)
		.map((item) => parseInt(item, 10))
		.filter((item) => !Number.isNaN(item));
	const parsedValue = parseInt(value, 10);
	if (!Number.isNaN(parsedValue) && normalizedOptions.includes(parsedValue)) {
		return parsedValue;
	}

	const parsedFallback = parseInt(fallbackValue, 10);
	if (!Number.isNaN(parsedFallback) && normalizedOptions.includes(parsedFallback)) {
		return parsedFallback;
	}

	return normalizedOptions[0] !== undefined ? normalizedOptions[0] : (Number.isNaN(parsedFallback) ? undefined : parsedFallback);
}

function resolveImageParams(aiModel, params = {}) {
	const capabilities = getModelCapabilities(aiModel);
	const defaults = getDefaultParams(aiModel);
	const sizeOptions = capabilities.sizeOptions || capabilities.imageSizeOptions || [];

	return {
		aspectRatio: pickOption(params.aspectRatio, capabilities.aspectRatioOptions || [], defaults.aspectRatio),
		size: pickOption(params.imageSize || params.size, sizeOptions, defaults.size || defaults.imageSize),
		quality: pickOption(params.quality, capabilities.qualityOptions || [], defaults.quality),
		background: pickOption(params.background, capabilities.backgroundOptions || [], defaults.background),
		outputFormat: pickOption(params.outputFormat, capabilities.outputFormatOptions || [], defaults.outputFormat),
		moderation: params.moderation || defaults.moderation,
		user: params.user || defaults.user,
		n: params.n || defaults.n || 1,
		urls: normalizeReferenceUrls(params.urls, params.reference_images, params.reference_image)
	};
}

function resolveVideoParams(aiModel, params = {}) {
	const capabilities = getModelCapabilities(aiModel);
	const defaults = getDefaultParams(aiModel);
	const sizeOptions = capabilities.sizeOptions || [];
	const resolvedAspectRatio = pickOption(params.aspectRatio, capabilities.aspectRatioOptions || [], defaults.aspectRatio);
	const resolvedSize = pickOption(
		params.size,
		sizeOptions,
		defaults.size || VIDEO_SIZE_BY_ASPECT_RATIO[resolvedAspectRatio || '16:9']
	);

	return {
		aspectRatio: resolvedAspectRatio,
		size: resolvedSize,
		seconds: pickIntegerOption(
			params.duration || params.seconds,
			capabilities.durationOptions || capabilities.secondsOptions || [],
			defaults.seconds || defaults.duration || 8
		),
		user: params.user || defaults.user,
		url: params.url,
		firstFrameUrl: params.firstFrameUrl,
		lastFrameUrl: params.lastFrameUrl,
		urls: normalizeReferenceUrls(params.urls, params.reference_images, params.reference_image)
	};
}

function validateProvider(aiModel) {
	if (!aiModel?.provider) {
		throw new Error('AI provider is not configured for this model');
	}

	if (!aiModel.provider.enabled) {
		throw new Error('AI provider is disabled');
	}

	return aiModel.provider;
}

async function getActiveModelByName(modelName, type) {
	return AiModel.findOne({
		where: {
			model_name: modelName,
			is_active: 1,
			type: { [Op.in]: [type, 'both'] }
		},
		include: [
			{
				model: AIProvider,
				as: 'provider',
				required: true
			}
		]
	});
}

async function getModelForGeneration(generation) {
	const where = generation?.ai_model_id
		? { id: generation.ai_model_id }
		: { model_name: generation?.model };

	return AiModel.findOne({
		where,
		include: [
			{
				model: AIProvider,
				as: 'provider',
				required: false
			}
		]
	});
}

async function submitImageGeneration({ aiModel, prompt, params }) {
	validateProvider(aiModel);
	const adapter = getAdapter(aiModel.provider);
	return adapter.generateImage({
		provider: aiModel.provider,
		aiModel,
		prompt,
		params: resolveImageParams(aiModel, params)
	});
}

async function submitVideoGeneration({ aiModel, prompt, params }) {
	validateProvider(aiModel);
	const adapter = getAdapter(aiModel.provider);
	return adapter.generateVideo({
		provider: aiModel.provider,
		aiModel,
		prompt,
		params: resolveVideoParams(aiModel, params)
	});
}

async function getGenerationResult({ aiModel, generation }) {
	validateProvider(aiModel);
	const adapter = getAdapter(aiModel.provider);

	if (generation.type === 'video') {
		return adapter.getVideoResult({
			provider: aiModel.provider,
			aiModel,
			generation
		});
	}

	return {
		status: generation.status,
		upstream_job_id: generation.work_id || null,
		progress: generation.status === 'success' ? 100 : 0,
		assets: [],
		error_message: generation.error_message || null
	};
}

module.exports = {
	getActiveModelByName,
	getModelForGeneration,
	getModelCapabilities,
	getDefaultParams,
	submitImageGeneration,
	submitVideoGeneration,
	getGenerationResult
};
