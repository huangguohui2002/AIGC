// 种子数据：初始化管理员账号 + 积分套餐 + 系统配置
const bcrypt = require('bcrypt');
const User = require('#models/User');
const PointsPackage = require('#models/PointsPackage');
const Config = require('#models/Config');
const { generateInviteCode } = require('#utils/random');

const SALT_ROUNDS = 10;

module.exports = {
	run: _run
};

async function _run() {
	try {
		// 创建管理员账号（phone 字段存储管理员用户名）
		const adminPhone = 'admin';
		const existingAdmin = await User.findOne({ where: { phone: adminPhone } });
		if (!existingAdmin) {
			const password_hash = await bcrypt.hash('admin123456', SALT_ROUNDS);
			await User.create({
				phone: adminPhone,
				password_hash,
				nickname: '超级管理员',
				invite_code: 'ADMIN0001',
				role: 'admin'
			});
			console.info('[Seed] 管理员账号创建成功');
		} else {
			console.info('[Seed] 管理员账号已存在，跳过');
		}

		// 创建积分套餐
		const packages = [
			{ name: '新手套餐', points: 10000, bonus_points: 0, price: 10.00, bonus_rate: 0, sort_order: 1 },
			{ name: '基础套餐', points: 50000, bonus_points: 10000, price: 45.00, bonus_rate: 20, sort_order: 2 },
			{ name: '进阶套餐', points: 100000, bonus_points: 30000, price: 80.00, bonus_rate: 30, sort_order: 3 },
			{ name: '专业套餐', points: 300000, bonus_points: 120000, price: 200.00, bonus_rate: 40, sort_order: 4 },
		];

		for (const pkg of packages) {
			const exists = await PointsPackage.findOne({ where: { name: pkg.name } });
			if (!exists) {
				await PointsPackage.create(pkg);
				console.info(`[Seed] 套餐 "${pkg.name}" 创建成功`);
			}
		}

		// 初始化系统配置
		const defaultConfigs = [
			{ key: 'generation.image.cost', value: 100, description: '图片生成消耗积分' },
			{ key: 'generation.video.cost', value: 500, description: '视频生成消耗积分' },
			{ key: 'invite.reward_points', value: 1000, description: '邀请奖励积分' },
			{ key: 'invite.invitee_reward_points', value: 0, description: '\u53d7\u9080\u65b9\u5956\u52b1\u79ef\u5206' },
			{ key: 'order.expire_minutes', value: 30, description: '订单有效期（分钟）' },
			{ key: 'sms.send_interval_seconds', value: 60, description: '短信发送间隔（秒）' },
			{ key: 'sms.code_expire_minutes', value: 10, description: '短信验证码有效期（分钟）' },
		];

		for (const cfg of defaultConfigs) {
			const exists = await Config.findOne({ where: { key: cfg.key } });
			if (!exists) {
				await Config.create(cfg);
				console.info(`[Seed] 配置项 "${cfg.key}" 创建成功`);
			}
		}

		return Promise.resolve();
	} catch (error) {
		return Promise.reject(error);
	}
}
