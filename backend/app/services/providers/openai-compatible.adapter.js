const axios = require('axios');
const https = require('https');

function createResultQueryError(message) {
	const error = new Error(message);
	error.name = 'ResultQueryFailed';
	return error;
}

function trimTrailingSlash(value = '') {
	return String(value).replace(/\/+$/, '');
}

function joinUrl(baseUrl, pathname = '') {
	const normalizedBaseUrl = trimTrailingSlash(baseUrl);
	const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return `${normalizedBaseUrl}${normalizedPath}`;
}

function applyTemplate(pathTemplate = '', upstreamId = '') {
	return String(pathTemplate).replace(/\{id\}/g, encodeURIComponent(String(upstreamId)));
}

function getProviderConfig(provider) {
	const extraConfig = provider?.extra_config && typeof provider.extra_config === 'object'
		? provider.extra_config
		: {};

	return {
		imageGenerationPath: extraConfig.image_generation_path || '/images/generations',
		imageEditPath: extraConfig.image_edit_path || '/images/edits',
		videoGenerationPath: extraConfig.video_generation_path || '/videos',
		videoStatusPathTemplate: extraConfig.video_status_path_template || '/videos/{id}',
		videoContentPathTemplate: extraConfig.video_content_path_template || '/videos/{id}/content',
		imageApiMode: extraConfig.image_api_mode || 'images',
		headers: extraConfig.headers && typeof extraConfig.headers === 'object' ? extraConfig.headers : {},
		imageResponseFormat: extraConfig.image_response_format || '',
		imageOutputFormat: extraConfig.image_output_format || '',
		organization: extraConfig.organization || '',
		project: extraConfig.project || '',
		insecureTls: extraConfig.insecure_tls === true || extraConfig.reject_unauthorized === false,
		disableSni: extraConfig.disable_sni === true,
		tlsServername: typeof extraConfig.tls_servername === 'string' ? extraConfig.tls_servername.trim() : ''
	};
}

function createHttpsAgent(provider) {
	const config = getProviderConfig(provider);
	const baseUrl = String(provider?.base_url || '').trim();
	if (!baseUrl.toLowerCase().startsWith('https://')) {
		return undefined;
	}

	const agentOptions = {
		rejectUnauthorized: !config.insecureTls
	};

	if (config.disableSni) {
		agentOptions.servername = '';
	} else if (config.tlsServername) {
		agentOptions.servername = config.tlsServername;
	}

	return new https.Agent(agentOptions);
}

function buildHeaders(provider, additionalHeaders = {}) {
	const config = getProviderConfig(provider);
	const headers = {
		Authorization: `Bearer ${provider.api_key}`,
		...config.headers,
		...additionalHeaders
	};

	if (config.organization) {
		headers['OpenAI-Organization'] = config.organization;
	}

	if (config.project) {
		headers['OpenAI-Project'] = config.project;
	}

	return headers;
}

function getRequestConfig(provider, additionalConfig = {}) {
	return {
		timeout: provider.timeout_ms || 90000,
		httpsAgent: createHttpsAgent(provider),
		...additionalConfig
	};
}

function getRequestId(response) {
	return response?.headers?.['x-request-id']
		|| response?.headers?.['request-id']
		|| '';
}

function getErrorMessage(error, fallbackMessage) {
	if (error?.response?.data) {
		const payload = error.response.data;
		if (typeof payload === 'string' && payload.trim()) return payload.trim();
		if (typeof payload?.error?.message === 'string' && payload.error.message.trim()) return payload.error.message.trim();
		if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message.trim();
	}

	return error?.message || fallbackMessage;
}

function collectImageAssets(payload, fallbackMimeType = 'image/png') {
	const items = Array.isArray(payload?.data) ? payload.data : [];
	const assets = [];

	for (const item of items) {
		if (typeof item?.b64_json === 'string' && item.b64_json.trim()) {
			assets.push({
				type: 'image',
				mime_type: fallbackMimeType,
				source: 'base64',
				data: item.b64_json.trim()
			});
			continue;
		}

		if (typeof item?.url === 'string' && item.url.trim()) {
			assets.push({
				type: 'image',
				mime_type: fallbackMimeType,
				source: 'url',
				data: item.url.trim()
			});
		}
	}

	return assets;
}

function resolveImageMimeType(params, provider) {
	const config = getProviderConfig(provider);
	const outputFormat = params?.outputFormat || config.imageOutputFormat || 'png';
	const normalized = String(outputFormat).toLowerCase();

	if (normalized === 'jpg' || normalized === 'jpeg') return 'image/jpeg';
	if (normalized === 'webp') return 'image/webp';
	if (normalized === 'gif') return 'image/gif';
	return 'image/png';
}

function buildImageBody({ aiModel, prompt, params, provider }) {
	const config = getProviderConfig(provider);
	const body = {
		model: aiModel.model_name,
		prompt
	};

	if (params?.size) body.size = params.size;
	if (params?.quality) body.quality = params.quality;
	if (params?.background) body.background = params.background;
	if (params?.n) body.n = params.n;
	if (params?.moderation) body.moderation = params.moderation;
	if (params?.user) body.user = params.user;
	if (params?.outputFormat || config.imageOutputFormat) {
		body.output_format = params?.outputFormat || config.imageOutputFormat;
	}
	if (config.imageResponseFormat) {
		body.response_format = config.imageResponseFormat;
	}

	return body;
}

async function buildImageEditFormData({ provider, aiModel, prompt, params, inputUrl }) {
	const form = new FormData();
	const imageResponse = await axios.get(inputUrl, {
		responseType: 'arraybuffer',
		timeout: provider.timeout_ms || 90000,
		maxRedirects: 5
	});
	const contentType = imageResponse.headers['content-type'] || 'image/png';
	const inputBlob = new Blob([Buffer.from(imageResponse.data)], { type: contentType });

	form.append('model', aiModel.model_name);
	form.append('prompt', prompt);
	form.append('image', inputBlob, 'reference-image');

	if (params?.size) form.append('size', params.size);
	if (params?.quality) form.append('quality', params.quality);
	if (params?.background) form.append('background', params.background);
	if (params?.n) form.append('n', String(params.n));
	if (params?.moderation) form.append('moderation', params.moderation);
	if (params?.user) form.append('user', params.user);

	const config = getProviderConfig(provider);
	if (params?.outputFormat || config.imageOutputFormat) {
		form.append('output_format', params?.outputFormat || config.imageOutputFormat);
	}
	if (config.imageResponseFormat) {
		form.append('response_format', config.imageResponseFormat);
	}

	return form;
}

async function generateImage({ provider, aiModel, prompt, params }) {
	const config = getProviderConfig(provider);
	const inputUrl = Array.isArray(params?.urls) && params.urls.length > 0 ? params.urls[0] : '';
	const mimeType = resolveImageMimeType(params, provider);
	const requestUrl = joinUrl(
		provider.base_url,
		inputUrl && config.imageApiMode === 'images' ? config.imageEditPath : config.imageGenerationPath
	);

	try {
		const response = inputUrl && config.imageApiMode === 'images'
			? await axios.post(
				requestUrl,
				await buildImageEditFormData({ provider, aiModel, prompt, params, inputUrl }),
				{
					headers: buildHeaders(provider),
					...getRequestConfig(provider)
				}
			)
			: await axios.post(
				requestUrl,
				buildImageBody({ aiModel, prompt, params, provider }),
				{
					headers: buildHeaders(provider, { 'Content-Type': 'application/json' }),
					...getRequestConfig(provider)
				}
			);

		const assets = collectImageAssets(response.data, mimeType);
		if (assets.length === 0) {
			throw new Error('Provider did not return generated images');
		}

		return {
			status: 'success',
			upstream_job_id: null,
			progress: 100,
			assets,
			error_message: null,
			upstream_request_id: getRequestId(response)
		};
	} catch (error) {
		throw new Error(getErrorMessage(error, 'Image generation failed'));
	}
}

function mapVideoReference(params) {
	const candidate = params?.firstFrameUrl
		|| params?.url
		|| (Array.isArray(params?.urls) && params.urls[0])
		|| '';

	if (!candidate) return undefined;

	return { image_url: candidate };
}

function buildVideoBody({ aiModel, prompt, params }) {
	const body = {
		model: aiModel.model_name,
		prompt
	};

	if (params?.size) body.size = params.size;
	if (params?.seconds) body.seconds = String(params.seconds);
	if (params?.user) body.user = params.user;

	const inputReference = mapVideoReference(params);
	if (inputReference) {
		body.input_reference = inputReference;
	}

	return body;
}

function normalizeVideoStatus(status = '') {
	switch (String(status).toLowerCase()) {
	case 'completed':
		return 'success';
	case 'failed':
		return 'failed';
	case 'queued':
	case 'in_progress':
	default:
		return 'pending';
	}
}

async function generateVideo({ provider, aiModel, prompt, params }) {
	const config = getProviderConfig(provider);
	const requestUrl = joinUrl(provider.base_url, config.videoGenerationPath);

	try {
		const response = await axios.post(
			requestUrl,
			buildVideoBody({ aiModel, prompt, params }),
			{
				headers: buildHeaders(provider, { 'Content-Type': 'application/json' }),
				...getRequestConfig(provider)
			}
		);

		const payload = response.data?.data || response.data || {};
		const upstreamJobId = payload.id || payload.video_id || payload.job_id || null;
		const status = normalizeVideoStatus(payload.status);

		if (!upstreamJobId && status !== 'success') {
			throw new Error('Provider did not return a video job id');
		}

		if (status === 'failed') {
			return {
				status: 'failed',
				upstream_job_id: upstreamJobId,
				progress: payload.progress || 0,
				assets: [],
				error_message: payload?.error?.message || payload?.message || 'Video generation failed',
				upstream_request_id: getRequestId(response)
			};
		}

		return {
			status,
			upstream_job_id: upstreamJobId,
			progress: payload.progress || 0,
			assets: [],
			error_message: null,
			upstream_request_id: getRequestId(response)
		};
	} catch (error) {
		throw new Error(getErrorMessage(error, 'Video generation failed'));
	}
}

async function downloadVideoAsset({ provider, upstreamJobId }) {
	const config = getProviderConfig(provider);
	const contentUrl = joinUrl(provider.base_url, applyTemplate(config.videoContentPathTemplate, upstreamJobId));
	const response = await axios.get(contentUrl, {
		responseType: 'arraybuffer',
		headers: buildHeaders(provider),
		...getRequestConfig(provider)
	});

	return {
		type: 'video',
		mime_type: response.headers['content-type'] || 'video/mp4',
		source: 'binary',
		data: Buffer.from(response.data)
	};
}

async function getVideoResult({ provider, generation }) {
	const config = getProviderConfig(provider);
	const statusUrl = joinUrl(provider.base_url, applyTemplate(config.videoStatusPathTemplate, generation.work_id));

	let response;
	try {
		response = await axios.get(statusUrl, {
			headers: buildHeaders(provider),
			...getRequestConfig(provider)
		});
	} catch (error) {
		throw createResultQueryError(getErrorMessage(error, 'Video result query failed'));
	}

	const payload = response.data?.data || response.data || {};
	const status = normalizeVideoStatus(payload.status);
	if (status === 'failed') {
		return {
			status: 'failed',
			upstream_job_id: generation.work_id,
			progress: payload.progress || 0,
			assets: [],
			error_message: payload?.error?.message || payload?.message || 'Video generation failed',
			upstream_request_id: getRequestId(response)
		};
	}

	if (status !== 'success') {
		return {
			status: 'pending',
			upstream_job_id: generation.work_id,
			progress: payload.progress || 0,
			assets: [],
			error_message: null,
			upstream_request_id: getRequestId(response)
		};
	}

	try {
		const asset = await downloadVideoAsset({ provider, upstreamJobId: generation.work_id });
		return {
			status: 'success',
			upstream_job_id: generation.work_id,
			progress: 100,
			assets: [asset],
			error_message: null,
			upstream_request_id: getRequestId(response)
		};
	} catch (error) {
		throw createResultQueryError(getErrorMessage(error, 'Video asset download failed'));
	}
}

module.exports = {
	generateImage,
	generateVideo,
	getVideoResult
};
