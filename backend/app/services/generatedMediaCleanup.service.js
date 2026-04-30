const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Generation = require('#models/Generation');

const IMAGE_RETENTION_DAYS = 30;
const IMAGE_RETENTION_MS = IMAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const GENERATED_PUBLIC_PREFIX = '/uploads/generated/images/';
const IMAGE_DIR = path.resolve(path.join(__dirname, '../../public/uploads/generated/images'));
const CLEANUP_BATCH_SIZE = 200;

function toPlainGeneration(generation) {
	if (!generation) return null;
	return typeof generation.toJSON === 'function' ? generation.toJSON() : generation;
}

function getGenerationCreatedAt(generation) {
	const value = generation?.createdAt || generation?.created_at;
	if (!value) return null;

	const createdAt = new Date(value);
	return Number.isNaN(createdAt.getTime()) ? null : createdAt;
}

function getImageAssetExpiresAt(generation) {
	if (!generation || generation.type !== 'image' || generation.status !== 'success') {
		return null;
	}

	const createdAt = getGenerationCreatedAt(generation);
	if (!createdAt) return null;

	return new Date(createdAt.getTime() + IMAGE_RETENTION_MS);
}

function isImageAssetExpired(generation, now = Date.now()) {
	const expiresAt = getImageAssetExpiresAt(generation);
	return Boolean(expiresAt && expiresAt.getTime() <= now);
}

function getAssetNotice(generation) {
	if (!generation || generation.type !== 'image') return null;
	if (generation.status !== 'success') return '生成图片将保留 30 天，请及时下载保存。';
	if (isImageAssetExpired(generation)) return '生成图片已超过 30 天，资源已自动清理，仅保留生成记录。';
	return '生成图片将保留 30 天，到期后会自动清理，请及时下载保存。';
}

function getLocalGeneratedImagePath(resultUrl = '') {
	if (typeof resultUrl !== 'string' || !resultUrl.trim()) return null;

	try {
		const pathname = path.posix.normalize(
			decodeURIComponent(new URL(resultUrl, 'http://localhost').pathname || '')
		);

		if (!pathname.startsWith(GENERATED_PUBLIC_PREFIX)) {
			return null;
		}

		const filename = path.posix.basename(pathname);
		if (!filename || filename === '.' || filename === 'images') {
			return null;
		}

		const absolutePath = path.resolve(path.join(IMAGE_DIR, filename));
		if (path.dirname(absolutePath) !== IMAGE_DIR) {
			return null;
		}

		return absolutePath;
	} catch (error) {
		return null;
	}
}

function serializeGenerationRecord(generation) {
	const record = toPlainGeneration(generation);
	if (!record) return null;

	const expired = isImageAssetExpired(record);
	const resultUrl = expired && record.type === 'image' ? null : record.result_url;
	const expiresAt = getImageAssetExpiresAt(record);
	const deletedAt = record.asset_deleted_at ? new Date(record.asset_deleted_at) : null;

	return {
		...record,
		result_url: resultUrl,
		expired,
		asset_expires_at: expiresAt ? expiresAt.toISOString() : null,
		asset_deleted_at: deletedAt && !Number.isNaN(deletedAt.getTime())
			? deletedAt.toISOString()
			: null,
		asset_notice: getAssetNotice(record)
	};
}

async function cleanupExpiredGeneratedImages() {
	const threshold = new Date(Date.now() - IMAGE_RETENTION_MS);
	const summary = {
		scanned: 0,
		marked: 0,
		deleted: 0,
		missing: 0,
		errors: 0
	};

	while (true) {
		const expiredRows = await Generation.findAll({
			where: {
				type: 'image',
				status: 'success',
				createdAt: { [Op.lt]: threshold },
				asset_deleted_at: { [Op.is]: null }
			},
			order: [['createdAt', 'ASC']],
			limit: CLEANUP_BATCH_SIZE,
			attributes: ['id', 'type', 'status', 'result_url', 'createdAt', 'asset_deleted_at']
		});

		if (expiredRows.length === 0) {
			break;
		}

		for (const generation of expiredRows) {
			summary.scanned += 1;

			try {
				const localPath = getLocalGeneratedImagePath(generation.result_url);
				let fileHandled = false;

				if (localPath) {
					try {
						const stat = fs.statSync(localPath);
						if (stat.isFile()) {
							fs.unlinkSync(localPath);
							summary.deleted += 1;
							fileHandled = true;
						}
					} catch (error) {
						if (error.code === 'ENOENT') {
							summary.missing += 1;
							fileHandled = true;
						} else {
							throw error;
						}
					}
				}

				const [updated] = await Generation.update(
					{ asset_deleted_at: new Date() },
					{ where: { id: generation.id, asset_deleted_at: { [Op.is]: null } } }
				);

				if (updated > 0) {
					summary.marked += 1;
					if (!fileHandled) {
						summary.missing += 1;
					}
				}
			} catch (error) {
				summary.errors += 1;
				console.error(`[GeneratedMediaCleanup] failed to process generation ${generation.id}:`, error);
			}
		}

		if (expiredRows.length < CLEANUP_BATCH_SIZE) {
			break;
		}
	}

	return summary;
}

module.exports = {
	IMAGE_RETENTION_DAYS,
	IMAGE_RETENTION_MS,
	getImageAssetExpiresAt,
	isImageAssetExpired,
	serializeGenerationRecord,
	cleanupExpiredGeneratedImages
};
