const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const SmsCode = database.define(
	'SmsCode',
	{
		phone: {
			type: DataTypes.STRING(11),
			allowNull: false
		},
		code: {
			type: DataTypes.STRING(6),
			allowNull: false
		},
		type: {
			type: DataTypes.ENUM('register', 'reset_password'),
			allowNull: false
		},
		used: {
			type: DataTypes.TINYINT,
			defaultValue: 0
		},
		expires_at: {
			type: DataTypes.DATE,
			allowNull: false
		}
	},
	{
		tableName: 'smscodes',
		timestamps: true,
		updatedAt: false
	}
);

module.exports = SmsCode;
