const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const ExampleImage = database.define(
	'ExampleImage',
	{
		example_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		url: {
			type: DataTypes.STRING(500),
			allowNull: false
		},
		label: {
			type: DataTypes.STRING(50),
			allowNull: true
		},
		order: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		metadata: {
			type: DataTypes.JSON,
			allowNull: true
		}
	},
	{
		tableName: 'exampleimages',
		timestamps: false,
		indexes: [
			{ fields: ['example_id'] }
		]
	}
);

module.exports = ExampleImage;
