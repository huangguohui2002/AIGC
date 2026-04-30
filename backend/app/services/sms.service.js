/**
 * 短信服务（push.spug.cc 推送平台）
 * 生产环境需在 .env 中配置 SMS_API_URL 和 SMS_API_KEY
 */
const axios = require('axios');

/**
 * 发送短信验证码
 * @param {string} phone 手机号
 * @param {string} code 验证码
 */
async function sendVerifyCode(phone, code) {
	// 开发环境同样调用接口，方便真实测试
	console.info(`[SMS] 手机号: ${phone}, 验证码: ${code}`);
	return _sendSms(phone, code);
}

/**
 * 调用 push.spug.cc 短信推送 API
 * 接口文档：https://push.spug.cc
 * 请求地址：POST https://push.spug.cc/send/{PUSH_TOKEN}
 * 请求体：{ name, code, targets }
 */
async function _sendSms(phone, code) {
	const apiUrl = process.env.SMS_API_URL;
	const pushToken = process.env.SMS_API_KEY;

	if (!pushToken) {
		throw new Error('SMS_API_KEY 未配置（push.spug.cc 推送 Token）');
	}

	try {
		const response = await axios.post(
			`${apiUrl}${pushToken}`,
			{ name: 'Nano 云端', code, targets: phone },
			{ timeout: 10000 }
		);

		// push.spug.cc 成功时 code 为 200
		if (response.data?.code !== 200) {
			throw new Error(response.data?.msg || '短信发送失败');
		}
	} catch (error) {
		throw new Error(`短信发送失败: ${error.message}`);
	}
}

module.exports = {
	sendVerifyCode
};
