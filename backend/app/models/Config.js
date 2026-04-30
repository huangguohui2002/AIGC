const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const Config = database.define(
	'Config',
	{
		key: {
			type: DataTypes.STRING(50),
			unique: true,
			allowNull: false
		},
		value: {
			type: DataTypes.JSON,
			allowNull: false
		},
		description: {
			type: DataTypes.STRING(255),
			allowNull: true
		}
	},
	{
		tableName: 'configs',
		timestamps: true,
		createdAt: false
	}
);

const DEFAULT_CONFIGS = Object.freeze({
	'generation.image.cost': 100,
	'generation.video.cost': 500,
	'invite.reward_points': 1000,
	'invite.invitee_reward_points': 0,
	'user.register_reward_points': 0,
	'order.expire_minutes': 30,
	'sms.send_interval_seconds': 60,
	'sms.code_expire_minutes': 10
});

// 获取配置值（带默认值）
Config.getValue = async function(key, defaultValue = null) {
	const record = await this.findOne({ where: { key } });
	return record ? record.value : defaultValue;
};

// 批量获取配置
Config.getMultiple = async function(keys) {
	const records = await this.findAll({ where: { key: keys } });
	return records.reduce((acc, r) => {
		acc[r.key] = r.value;
		return acc;
	}, {});
};

Config.DEFAULT_CONFIGS = DEFAULT_CONFIGS;

Config.getAllWithDefaults = async function() {
	const records = await this.findAll({ attributes: ['key', 'value'] });
	return records.reduce((acc, r) => {
		acc[r.key] = r.value;
		return acc;
	}, { ...DEFAULT_CONFIGS });
};

module.exports = Config;
