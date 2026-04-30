const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const Announcement = database.define(
	'Announcement',
	{
		title: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		level: {
			type: DataTypes.ENUM('normal', 'important'),
			defaultValue: 'normal'
		},
		status: {
			type: DataTypes.ENUM('draft', 'published', 'archived'),
			defaultValue: 'draft'
		},
		published_at: {
			type: DataTypes.DATE,
			allowNull: true
		}
	},
	{
		tableName: 'announcements',
		timestamps: true
	}
);

module.exports = Announcement;
