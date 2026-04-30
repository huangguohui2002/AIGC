const DEFAULT_PROTOCOL = 'http';
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = process.env.APP_PORT || process.env.PORT || '8080';

function trimTrailingSlash(value = '') {
	return String(value).replace(/\/+$/, '');
}

function getConfiguredBaseUrl() {
	const candidates = [
		process.env.BASE_URL,
		process.env.PUBLIC_BASE_URL
	];

	for (const candidate of candidates) {
		const normalized = trimTrailingSlash(candidate || '');
		if (normalized) {
			return normalized;
		}
	}

	return '';
}

function getRequestBaseUrl(req) {
	if (!req) {
		return '';
	}

	const forwardedProto = req.headers['x-forwarded-proto'];
	const forwardedHost = req.headers['x-forwarded-host'];
	const protocol = String(forwardedProto || req.protocol || DEFAULT_PROTOCOL).split(',')[0].trim();
	const host = String(forwardedHost || req.get('host') || '').split(',')[0].trim();

	if (!host) {
		return '';
	}

	return `${protocol || DEFAULT_PROTOCOL}://${host}`;
}

function getAppBaseUrl(req) {
	return getConfiguredBaseUrl()
		|| getRequestBaseUrl(req)
		|| `${DEFAULT_PROTOCOL}://${DEFAULT_HOST}:${DEFAULT_PORT}`;
}

function buildAbsoluteUrl(req, pathname = '/') {
	const baseUrl = getAppBaseUrl(req);
	const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

	return `${trimTrailingSlash(baseUrl)}${normalizedPath}`;
}

module.exports = {
	buildAbsoluteUrl,
	getAppBaseUrl
};
