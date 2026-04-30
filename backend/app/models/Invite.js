const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const Invite = database.define(
	'Invite',
	{
		inviter_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		invitee_id: {
			type: DataTypes.INTEGER,
			unique: true,
			allowNull: false
		},
		reward_points: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		status: {
			type: DataTypes.ENUM('pending', 'completed'),
			defaultValue: 'pending'
		},
		completed_at: {
			type: DataTypes.DATE,
			allowNull: true
		}
	},
	{
		tableName: 'invites',
		timestamps: true,
		updatedAt: false
	}
);

Invite.associate = (models) => {
	models.Invite.belongsTo(models.User, { foreignKey: 'inviter_id', as: 'inviter' });
	models.Invite.belongsTo(models.User, { foreignKey: 'invitee_id', as: 'invitee' });
};

module.exports = Invite;
