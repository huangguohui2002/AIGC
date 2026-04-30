/**
 * 手机号格式验证
 */
function isValidPhone(phone) {
	return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 密码格式验证（最少6位）
 */
function isValidPassword(password) {
	return typeof password === 'string' && password.length >= 6;
}

/**
 * MD5 签名（用于支付回调验签）
 */
const crypto = require('crypto');

function md5(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * 对象按 key 排序后拼接签名字符串
 */
function buildSignStr(params, excludeKeys = ['sign']) {
	return Object.keys(params)
		.filter(k => !excludeKeys.includes(k) && params[k] !== '' && params[k] !== undefined)
		.sort()
		.map(k => `${k}=${params[k]}`)
		.join('&');
}

module.exports = {
	isValidPhone,
	isValidPassword,
	md5,
	buildSignStr
};
