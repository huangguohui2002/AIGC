/**
 * upload.service.js - 图片上传服务
 *
 * 提供两种存储策略：
 *   - exampleUpload : 存 public/uploads/examples/（永久保留）
 *   - tempUpload    : 存 public/uploads/temp/（30 分钟后自动删除）
 *
 * cleanTempFiles() 由 app.js 定时调用，每 5 分钟执行一次。
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// ─── 目录常量 ────────────────────────────────────────────────────────────────
const EXAMPLES_DIR = path.join(__dirname, '../../public/uploads/examples');
const TEMP_DIR     = path.join(__dirname, '../../public/uploads/temp');

// 启动时确保目录存在
[EXAMPLES_DIR, TEMP_DIR].forEach(dir => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
});

// ─── 配置常量 ─────────────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE      = 10 * 1024 * 1024; // 10 MB
const TEMP_TTL_MS        = 30 * 60 * 1000;   // 30 分钟

// ─── 内部工具 ─────────────────────────────────────────────────────────────────

/** 仅允许 jpg / png / webp */
function _fileFilter(req, file, cb) {
	if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
		return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', '只允许上传 JPG、PNG、WebP 格式图片'));
	}
	cb(null, true);
}

/** 生成随机安全文件名，保留原始扩展名 */
function _createStorage(destDir) {
	return multer.diskStorage({
		destination: (req, file, cb) => cb(null, destDir),
		filename: (req, file, cb) => {
			// 只取合法小写扩展名，防止路径穿越
			const extMap = {
				'image/jpeg': '.jpg',
				'image/png':  '.png',
				'image/webp': '.webp',
			};
			const ext  = extMap[file.mimetype] || '.jpg';
			const name = crypto.randomBytes(16).toString('hex');
			cb(null, `${Date.now()}-${name}${ext}`);
		}
	});
}

// ─── 导出的 multer 实例 ───────────────────────────────────────────────────────

/** 管理员专用：上传示例图片（永久存储） */
const exampleUpload = multer({
	storage: _createStorage(EXAMPLES_DIR),
	fileFilter: _fileFilter,
	limits: { fileSize: MAX_FILE_SIZE },
});

/** 普通用户专用：上传临时图片（图生图 / 图生视频，30 分钟后清除） */
const tempUpload = multer({
	storage: _createStorage(TEMP_DIR),
	fileFilter: _fileFilter,
	limits: { fileSize: MAX_FILE_SIZE },
});

// ─── 定时清理 ─────────────────────────────────────────────────────────────────

/**
 * 删除 temp 目录中超过 30 分钟的图片文件。
 * 由 app.js 中的 setInterval 每 5 分钟调用一次。
 */
function cleanTempFiles() {
	const now = Date.now();
	try {
		const files = fs.readdirSync(TEMP_DIR);
		files.forEach(file => {
			const filepath = path.join(TEMP_DIR, file);
			try {
				const stat = fs.statSync(filepath);
				if (stat.isFile() && now - stat.mtimeMs > TEMP_TTL_MS) {
					fs.unlinkSync(filepath);
				}
			} catch (e) {
				// 文件可能在读取间隙被删除，忽略单文件错误
			}
		});
	} catch (error) {
		console.error('[Upload] 清理临时文件失败:', error.message);
	}
}

module.exports = { exampleUpload, tempUpload, cleanTempFiles, EXAMPLES_DIR, TEMP_DIR };
