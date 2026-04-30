const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const ExampleCategory = database.define(
	'ExampleCategory',
	{
		name: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		description: {
			type: DataTypes.STRING(500),
			allowNull: true
		},
		sort: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		}
	},
	{
		tableName: 'examplecategories',
		timestamps: true,
		indexes: [
			{ fields: ['is_active', 'sort'] }
		]
	}
);

module.exports = ExampleCategory;
