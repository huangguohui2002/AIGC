const bcrypt = require('bcrypt');
const User = require('#models/User');
const SmsCode = require('#models/SmsCode');
const Invite = require('#models/Invite');
const Transaction = require('#models/Transaction');
const Config = require('#models/Config');
const JWT = require('#services/jwt.service');
const db = require('#services/db.service');
const SmsService = require('#services/sms.service');
const { generateSmsCode, generateInviteCode } = require('#utils/random');
const { Err } = require('#factories/errors');

const SALT_ROUNDS = 10;

async function sendSmsCode({ phone, type }) {
	const lastSent = await SmsCode.findOne({
		where: { phone, type },
		order: [['createdAt', 'DESC']]
	});

	if (lastSent) {
		const elapsed = Date.now() - new Date(lastSent.createdAt).getTime();
		if (elapsed < 60 * 1000) {
			const err = new Err('发送过于频繁，请稍后再试');
			err.name = 'SmsTooFrequent';
			throw err;
		}
	}

	const code = generateSmsCode();
	const expires_at = new Date(Date.now() + 10 * 60 * 1000);

	await SmsCode.create({ phone, code, type, expires_at });
	await SmsService.sendVerifyCode(phone, code);
}

async function verifySmsCode({ phone, code, type }) {
	const record = await SmsCode.findOne({
		where: { phone, code, type, used: 0 },
		order: [['createdAt', 'DESC']]
	});

	if (!record || new Date() > new Date(record.expires_at)) {
		const err = new Err('验证码错误或已过期');
		err.name = 'InvalidCode';
		throw err;
	}

	record.used = 1;
	await record.save();
}

async function register({ phone, code, password, invite_code }) {
	await verifySmsCode({ phone, code, type: 'register' });

	const exists = await User.findOneByPhone(phone);
	if (exists) {
		const err = new Err('手机号已注册');
		err.name = 'PhoneExists';
		throw err;
	}

	let newInviteCode;
	do {
		newInviteCode = generateInviteCode();
	} while (await User.findOneByInviteCode(newInviteCode));

	const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
	const [registerRewardRaw, inviteRewardRaw, inviteeRewardRaw] = await Promise.all([
		Config.getValue('user.register_reward_points', 0),
		Config.getValue('invite.reward_points', 1000),
		Config.getValue('invite.invitee_reward_points', 0)
	]);
	const registerRewardPoints = Math.max(parseInt(registerRewardRaw, 10) || 0, 0);
	const inviteRewardPoints = Math.max(parseInt(inviteRewardRaw, 10) || 0, 0);
	const inviteeRewardPoints = Math.max(parseInt(inviteeRewardRaw, 10) || 0, 0);
	const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

	const t = await db.transaction();
	let user;

	try {
		let inviter = null;
		if (invite_code) {
			inviter = await User.findOne({
				where: { invite_code },
				transaction: t,
				lock: t.LOCK.UPDATE
			});
		}

		const inviteeBonusPoints = inviter ? inviteeRewardPoints : 0;
		const initialPoints = registerRewardPoints + inviteeBonusPoints;

		user = await User.create({
			phone,
			password_hash,
			points: initialPoints,
			invite_code: newInviteCode,
			inviter_id: inviter ? inviter.id : null
		}, { transaction: t });

		if (registerRewardPoints > 0) {
			await Transaction.create({
				user_id: user.id,
				type: 'admin_adjust',
				amount: registerRewardPoints,
				balance_after: registerRewardPoints,
				related_id: user.id,
				related_type: 'register',
				description: '新用户注册赠送积分'
			}, { transaction: t });
		}

		if (inviter) {
			if (inviteeBonusPoints > 0) {
				await Transaction.create({
					user_id: user.id,
					type: 'invite_reward',
					amount: inviteeBonusPoints,
					balance_after: initialPoints,
					related_id: inviter.id,
					related_type: 'invite',
					description: '\u586b\u5199\u9080\u8bf7\u7801\u6ce8\u518c\u5956\u52b1'
				}, { transaction: t });
			}

			await Invite.create({
				inviter_id: inviter.id,
				invitee_id: user.id,
				reward_points: inviteRewardPoints,
				status: 'completed',
				completed_at: new Date()
			}, { transaction: t });

			if (inviteRewardPoints > 0) {
				inviter.points += inviteRewardPoints;
				await inviter.save({ transaction: t });

				await Transaction.create({
					user_id: inviter.id,
					type: 'invite_reward',
					amount: inviteRewardPoints,
					balance_after: inviter.points,
					related_id: user.id,
					related_type: 'invite',
					description: `邀请用户 ${maskedPhone} 注册奖励`
				}, { transaction: t });
			}
		}

		await t.commit();
	} catch (error) {
		if (t && !t.finished) await t.rollback();
		throw error;
	}

	const [tokenData] = await JWT.issueAccessToken({ id: user.id, role: user.role });

	return {
		token: tokenData.token,
		user: {
			id: user.id,
			phone: user.phone,
			points: user.points,
			invite_code: user.invite_code
		}
	};
}

async function login({ phone, password }) {
	const user = await User.findOneByPhone(phone);
	if (!user) {
		const err = new Err('用户不存在');
		err.name = 'UserNotFound';
		throw err;
	}

	const match = await bcrypt.compare(password, user.password_hash);
	if (!match) {
		const err = new Err('密码错误');
		err.name = 'InvalidPassword';
		throw err;
	}

	if (user.status === 'banned') {
		const err = new Err('账号已被封禁');
		err.name = 'UserBanned';
		throw err;
	}

	const [tokenData] = await JWT.issueAccessToken({ id: user.id, role: user.role });

	return {
		token: tokenData.token,
		user: {
			id: user.id,
			phone: user.phone,
			nickname: user.nickname,
			avatar: user.avatar,
			points: user.points,
			role: user.role
		}
	};
}

async function resetPassword({ phone, code, new_password }) {
	await verifySmsCode({ phone, code, type: 'reset_password' });

	const user = await User.findOneByPhone(phone);
	if (!user) {
		const err = new Err('用户不存在');
		err.name = 'UserNotFound';
		throw err;
	}

	user.password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
	await user.save();
}

async function changePassword({ userId, old_password, new_password }) {
	const user = await User.findByPk(userId);
	if (!user) {
		const err = new Err('用户不存在');
		err.name = 'UserNotFound';
		throw err;
	}

	const match = await bcrypt.compare(old_password, user.password_hash);
	if (!match) {
		const err = new Err('旧密码错误');
		err.name = 'InvalidPassword';
		throw err;
	}

	user.password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
	await user.save();
}

module.exports = {
	sendSmsCode,
	register,
	login,
	resetPassword,
	changePassword
};
