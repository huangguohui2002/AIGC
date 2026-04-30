/**
 * AIGC 项目统一响应格式工厂
 * 格式: { success, message, data }
 */

/**
 * 成功响应
 * @param {object} res Express response
 * @param {string} message 提示信息
 * @param {any} data 响应数据
 * @param {number} status HTTP 状态码，默认 200
 */
function success(res, message = '操作成功', data = null, status = 200) {
	const body = { success: true, message };
	if (data !== null) body.data = data;
	return res.status(status).json(body);
}

/**
 * 失败响应
 * @param {object} res Express response
 * @param {string} message 错误信息
 * @param {string} code 错误码（可选）
 * @param {number} status HTTP 状态码，默认 400
 */
function fail(res, message = '操作失败', code = null, status = 400) {
	const body = { success: false, message };
	if (code) body.code = code;
	return res.status(status).json(body);
}

/**
 * 服务器内部错误响应
 */
function serverError(res, message = '服务器内部错误') {
	return res.status(500).json({ success: false, message });
}

module.exports = { success, fail, serverError };
