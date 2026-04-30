const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const ExampleItem = database.define(
	'ExampleItem',
	{
		category_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		title: {
			type: DataTypes.STRING(200),
			allowNull: false
		},
		display_type: {
			type: DataTypes.ENUM('single', 'comparison'),
			allowNull: false
		},
		prompt: {
			type: DataTypes.TEXT,
			allowNull: false
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
		tableName: 'exampleitems',
		timestamps: true,
		indexes: [
			{ fields: ['category_id'] },
			{ fields: ['is_active', 'sort', 'createdAt'] }
		]
	}
);

module.exports = ExampleItem;
