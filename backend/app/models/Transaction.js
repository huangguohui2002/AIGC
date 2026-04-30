const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const Transaction = database.define(
	'Transaction',
	{
		user_id: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		type: {
			type: DataTypes.ENUM('recharge', 'consume', 'invite_reward', 'refund', 'admin_adjust'),
			allowNull: false
		},
		amount: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		balance_after: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		related_id: {
			type: DataTypes.BIGINT,
			allowNull: true
		},
		related_type: {
			type: DataTypes.STRING(20),
			allowNull: true
		},
		description: {
			type: DataTypes.STRING(255),
			allowNull: false
		}
	},
	{
		tableName: 'transactions',
		timestamps: true,
		updatedAt: false
	}
);

module.exports = Transaction;
