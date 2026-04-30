const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const PointsPackage = database.define(
	'PointsPackage',
	{
		name: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		bonus_points: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		price: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false
		},
		bonus_rate: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		sort_order: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		is_active: {
			type: DataTypes.TINYINT,
			defaultValue: 1
		}
	},
	{
		tableName: 'pointspackages',
		timestamps: true
	}
);

module.exports = PointsPackage;
