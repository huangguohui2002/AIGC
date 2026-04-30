const axios = require('axios');
const { md5 } = require('#utils/validators');

const zhifuFmConfig = {
	apiUrl: (process.env.ZHIFU_FM_API_URL || '').replace(/\/+$/, ''),
	merchantNum: process.env.ZHIFU_FM_MERCHANT_NUM || '',
	secret: process.env.ZHIFU_FM_SECRET || ''
};

const SUPPORTED_PAY_TYPES = ['alipay', 'wechat'];

function normalizeAmount(amount) {
	const num = Number(amount);
	if (!Number.isFinite(num) || num <= 0) {
		throw new Error('支付金额无效');
	}

	return num.toFixed(2);
}

function normalizePayType(payType) {
	return typeof payType === 'string' ? payType.trim().toLowerCase() : '';
}

function createOrderSign({ orderNo, amount, notifyUrl = '' }) {
	return md5(`${zhifuFmConfig.merchantNum}${orderNo}${amount}${notifyUrl}${zhifuFmConfig.secret}`);
}

function createNotifySign({ merchantNum, orderNo, amount }) {
	return md5(`1${merchantNum}${orderNo}${amount}${zhifuFmConfig.secret}`);
}

async function createOrder({
	orderNo,
	amount,
	payType,
	subject,
	body,
	notifyUrl = '',
	returnUrl = '',
	attach = '',
	payDuration = 5
}) {
	const normalizedPayType = normalizePayType(payType);
	if (!SUPPORTED_PAY_TYPES.includes(normalizedPayType)) {
		throw new Error('不支持的支付方式');
	}

	const normalizedAmount = normalizeAmount(amount);
	const form = new URLSearchParams({
		merchantNum: zhifuFmConfig.merchantNum,
		orderNo,
		amount: normalizedAmount,
		notifyUrl,
		payType: normalizedPayType,
		sign: createOrderSign({ orderNo, amount: normalizedAmount, notifyUrl }),
		returnType: 'json',
		apiMode: 'post_form',
		payDuration: String(Math.max(1, Math.min(Number(payDuration) || 5, 15)))
	});

	if (returnUrl) form.append('returnUrl', returnUrl);
	if (attach) form.append('attch', attach);
	if (subject) form.append('subject', subject);
	if (body) form.append('body', body);

	try {
		const { data } = await axios.post(`${zhifuFmConfig.apiUrl}/startOrder`, form.toString(), {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			timeout: 15000
		});

		if (!data?.success || !data?.data?.payUrl) {
			throw new Error(data?.msg || '支付平台下单失败');
		}

		return {
			platformOrderId: data.data.id || null,
			payUrl: data.data.payUrl
		};
	} catch (error) {
		if (error instanceof Error && !error.response) {
			throw error;
		}

		const upstreamMessage = error.response?.data?.msg || error.response?.data?.message;
		throw new Error(upstreamMessage || '支付平台下单失败');
	}
}

function verifyCallback(callbackParams = {}) {
	const merchantNum = String(callbackParams.merchantNum ?? '');
	const orderNo = String(callbackParams.orderNo ?? '');
	const amount = String(callbackParams.amount ?? '');
	const state = String(callbackParams.state ?? '');
	const sign = String(callbackParams.sign ?? '').toLowerCase();

	if (!merchantNum || !orderNo || !amount || !sign) {
		return false;
	}

	if (state !== '1') {
		return false;
	}

	if (merchantNum !== zhifuFmConfig.merchantNum) {
		return false;
	}

	const expectedSign = createNotifySign({ merchantNum, orderNo, amount });
	return sign === expectedSign;
}

module.exports = {
	SUPPORTED_PAY_TYPES,
	createOrder,
	createNotifySign,
	verifyCallback
};
