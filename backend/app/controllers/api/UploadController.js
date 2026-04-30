/**
 * UploadController
 */
const { success, fail } = require('#factories/responses/aigc');
const { buildAbsoluteUrl } = require('#utils/url');

module.exports = UploadController;

function UploadController() {
	const uploadTempImage = (req, res) => {
		if (!req.file) {
			return fail(res, '请选择要上传的图片');
		}

		const url = buildAbsoluteUrl(req, `/uploads/temp/${req.file.filename}`);
		return success(res, '上传成功', { url });
	};

	const uploadExampleImage = (req, res) => {
		if (!req.file) {
			return fail(res, '请选择要上传的图片');
		}

		const url = buildAbsoluteUrl(req, `/uploads/examples/${req.file.filename}`);
		return success(res, '上传成功', { url });
	};

	return { uploadTempImage, uploadExampleImage };
}
