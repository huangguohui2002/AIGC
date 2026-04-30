const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { buildAbsoluteUrl } = require('#utils/url');

const GENERATED_ROOT_DIR = path.join(__dirname, '../../public/uploads/generated');
const IMAGE_DIR = path.join(GENERATED_ROOT_DIR, 'images');
const VIDEO_DIR = path.join(GENERATED_ROOT_DIR, 'videos');

[GENERATED_ROOT_DIR, IMAGE_DIR, VIDEO_DIR].forEach((dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
});

const EXTENSION_BY_MIME = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp',
	'image/gif': '.gif',
	'video/mp4': '.mp4',
	'video/webm': '.webm',
	'video/quicktime': '.mov'
};

function createFilename(extension = '.bin') {
	return `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${extension}`;
}

function getDirectoryByAssetType(type) {
	return type === 'video' ? VIDEO_DIR : IMAGE_DIR;
}

function getPublicPathByAssetType(type, filename) {
	return `/uploads/generated/${type === 'video' ? 'videos' : 'images'}/${filename}`;
}

function getMimeExtension(mimeType, fallbackType = 'image') {
	if (mimeType && EXTENSION_BY_MIME[mimeType]) {
		return EXTENSION_BY_MIME[mimeType];
	}

	return fallbackType === 'video' ? '.mp4' : '.png';
}

function getExtensionFromUrl(sourceUrl = '', fallbackType = 'image') {
	try {
		const pathname = new URL(sourceUrl).pathname || '';
		const ext = path.extname(pathname).toLowerCase();
		if (ext) return ext;
	} catch (error) {
		void error;
	}

	return fallbackType === 'video' ? '.mp4' : '.png';
}

function decodeBase64Asset(data = '') {
	const trimmed = String(data).trim();
	const matched = trimmed.match(/^data:([^;]+);base64,(.+)$/);
	if (matched) {
		return {
			mimeType: matched[1],
			buffer: Buffer.from(matched[2], 'base64')
		};
	}

	return {
		mimeType: '',
		buffer: Buffer.from(trimmed, 'base64')
	};
}

async function downloadAsset(sourceUrl) {
	const response = await axios.get(sourceUrl, {
		responseType: 'arraybuffer',
		timeout: 120000,
		maxRedirects: 5
	});

	return {
		buffer: Buffer.from(response.data),
		mimeType: response.headers['content-type'] || ''
	};
}

async function persistAsset({ req, asset }) {
	if (!asset || typeof asset !== 'object') {
		throw new Error('Invalid generated asset');
	}

	const fallbackType = asset.type === 'video' ? 'video' : 'image';
	let buffer;
	let mimeType = asset.mime_type || '';
	let extension = '';

	if (asset.source === 'base64') {
		const decoded = decodeBase64Asset(asset.data);
		buffer = decoded.buffer;
		mimeType = mimeType || decoded.mimeType;
		extension = getMimeExtension(mimeType, fallbackType);
	} else if (asset.source === 'binary') {
		buffer = Buffer.isBuffer(asset.data) ? asset.data : Buffer.from(asset.data);
		extension = getMimeExtension(mimeType, fallbackType);
	} else if (asset.source === 'url') {
		const downloaded = await downloadAsset(asset.data);
		buffer = downloaded.buffer;
		mimeType = mimeType || downloaded.mimeType;
		extension = mimeType
			? getMimeExtension(mimeType, fallbackType)
			: getExtensionFromUrl(asset.data, fallbackType);
	} else {
		throw new Error(`Unsupported asset source: ${asset.source || 'unknown'}`);
	}

	if (!buffer || buffer.length === 0) {
		throw new Error('Generated asset is empty');
	}

	const filename = createFilename(extension || getMimeExtension(mimeType, fallbackType));
	const dir = getDirectoryByAssetType(fallbackType);
	const publicPath = getPublicPathByAssetType(fallbackType, filename);
	const absolutePath = path.join(dir, filename);

	fs.writeFileSync(absolutePath, buffer);

	return {
		path: absolutePath,
		url: buildAbsoluteUrl(req, publicPath),
		mime_type: mimeType || undefined
	};
}

async function persistAssets({ req, assets = [] }) {
	const persisted = [];

	for (const asset of assets) {
		persisted.push(await persistAsset({ req, asset }));
	}

	return persisted;
}

module.exports = {
	persistAssets
};
