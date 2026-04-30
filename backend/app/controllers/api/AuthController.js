/**
 * AuthController - 处理用户认证相关接口
 * POST /auth/send-sms
 * POST /auth/register
 * POST /auth/login
 * POST /auth/reset-password
 * POST /auth/change-password (需要 JWT)
 */
const authFacade = require('#facades/auth.facade');
const { success, fail, serverError } = require('#factories/responses/aigc');
const { isValidPhone, isValidPassword } = require('#utils/validators');

module.exports = AuthController;

function AuthController() {

	// POST /auth/send-sms
	const sendSms = async (req, res) => {
		const { phone, type } = req.body;

		if (!isValidPhone(phone)) {
			return fail(res, '手机号格式错误', 'INVALID_PHONE');
		}
		if (!['register', 'reset_password'].includes(type)) {
			return fail(res, '参数错误');
		}

		try {
			await authFacade.sendSmsCode({ phone, type });
			return success(res, '验证码已发送');
		} catch (error) {
			if (error.name === 'SmsTooFrequent') return fail(res, error.message, 'SMS_SEND_TOO_FREQUENT');
			console.error('[AuthController.sendSms]', error);
			return serverError(res, '短信发送失败');
		}
	};

	// POST /auth/register
	const register = async (req, res) => {
		const { phone, code, password, invite_code } = req.body;

		if (!isValidPhone(phone)) return fail(res, '手机号格式错误', 'INVALID_PHONE');
		if (!code) return fail(res, '验证码不能为空');
		if (!isValidPassword(password)) return fail(res, '密码至少6位');

		try {
			const data = await authFacade.register({ phone, code, password, invite_code });
			return success(res, '注册成功', data);
		} catch (error) {
			if (error.name === 'InvalidCode') return fail(res, error.message, 'INVALID_CODE');
			if (error.name === 'PhoneExists') return fail(res, error.message, 'PHONE_EXISTS');
			console.error('[AuthController.register]', error);
			return serverError(res);
		}
	};

	// POST /auth/login
	const login = async (req, res) => {
		const { phone, password } = req.body;

		if (!isValidPhone(phone)) return fail(res, '手机号格式错误', 'INVALID_PHONE');
		if (!password) return fail(res, '密码不能为空');

		try {
			const data = await authFacade.login({ phone, password });
			return success(res, '登录成功', data);
		} catch (error) {
			if (error.name === 'UserNotFound') return fail(res, '用户不存在', 'USER_NOT_FOUND');
			if (error.name === 'InvalidPassword') return fail(res, '密码错误', 'INVALID_PASSWORD');
			if (error.name === 'UserBanned') return fail(res, '账号已被封禁', 'USER_BANNED', 403);
			console.error('[AuthController.login]', error);
			return serverError(res);
		}
	};

	// POST /auth/reset-password
	const resetPassword = async (req, res) => {
		const { phone, code, new_password } = req.body;

		if (!isValidPhone(phone)) return fail(res, '手机号格式错误', 'INVALID_PHONE');
		if (!code) return fail(res, '验证码不能为空');
		if (!isValidPassword(new_password)) return fail(res, '密码至少6位');

		try {
			await authFacade.resetPassword({ phone, code, new_password });
			return success(res, '密码重置成功');
		} catch (error) {
			if (error.name === 'InvalidCode') return fail(res, error.message, 'INVALID_CODE');
			if (error.name === 'UserNotFound') return fail(res, '用户不存在', 'USER_NOT_FOUND');
			console.error('[AuthController.resetPassword]', error);
			return serverError(res);
		}
	};

	// POST /auth/change-password（需要 JWT）
	const changePassword = async (req, res) => {
		const { old_password, new_password } = req.body;
		const userId = req.token?.id;

		if (!isValidPassword(new_password)) return fail(res, '新密码至少6位');

		try {
			await authFacade.changePassword({ userId, old_password, new_password });
			return success(res, '密码修改成功');
		} catch (error) {
			if (error.name === 'InvalidPassword') return fail(res, '旧密码错误', 'INVALID_PASSWORD');
			console.error('[AuthController.changePassword]', error);
			return serverError(res);
		}
	};

	return {
		sendSms,
		register,
		login,
		resetPassword,
		changePassword
	};
}
