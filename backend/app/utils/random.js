/**
 * 随机字符串工具函数
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * 生成指定长度的随机字符串（大写字母 + 数字）
 */
function generateRandomString(length = 8) {
	let result = '';
	for (let i = 0; i < length; i++) {
		result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}
	return result;
}

/**
 * 生成6位数字验证码
 */
function generateSmsCode() {
	return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 生成唯一邀请码（8位）
 */
function generateInviteCode() {
	return generateRandomString(8);
}

/**
 * 生成订单号（ORDER + 时间戳 + 随机6位）
 */
function generateOrderNo() {
	const timestamp = Date.now();
	const random = generateRandomString(6);
	return `ORDER${timestamp}${random}`;
}

module.exports = {
	generateRandomString,
	generateSmsCode,
	generateInviteCode,
	generateOrderNo
};
