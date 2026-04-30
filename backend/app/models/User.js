// ORM:
const { DataTypes } = require('sequelize');
const database = require('#services/db.service');


const User = database.define(
	'User',
	{
		phone: {
			type: DataTypes.STRING(11),
			unique: true,
			allowNull: false
		},
		password_hash: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		nickname: {
			type: DataTypes.STRING(50),
			allowNull: true
		},
		avatar: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		points: {
			type: DataTypes.BIGINT,
			defaultValue: 0
		},
		total_recharged: {
			type: DataTypes.BIGINT,
			defaultValue: 0
		},
		total_consumed: {
			type: DataTypes.BIGINT,
			defaultValue: 0
		},
		last_checkin_date: {
			type: DataTypes.STRING(10),
			allowNull: true
		},
		last_checkin_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		last_checkin_reward: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		invite_code: {
			type: DataTypes.STRING(20),
			unique: true,
			allowNull: false
		},
		inviter_id: {
			type: DataTypes.BIGINT,
			allowNull: true
		},
		status: {
			type: DataTypes.ENUM('normal', 'banned'),
			defaultValue: 'normal'
		},
		role: {
			type: DataTypes.ENUM('user', 'admin'),
			defaultValue: 'user'
		}
	},
	{
		tableName: 'users',
		timestamps: true,
		paranoid: false
	}
);

// Static methods:
User.associate = (models) => {
	models.User.hasMany(models.DisabledRefreshToken, {
		foreignKey: 'UserId',
		as: 'disabledRefreshTokens'
	});
	models.User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
	models.User.hasMany(models.Invite, { foreignKey: 'inviter_id', as: 'sentInvites' });
	models.User.hasOne(models.Invite, { foreignKey: 'invitee_id', as: 'receivedInvite' });
}

User.findById = function(id) {
	return this.findByPk(id);
}

User.findOneByPhone = function(phone) {
	return this.findOne({ where: { phone } });
}

User.findOneByInviteCode = function(invite_code) {
	return this.findOne({ where: { invite_code } });
}
// Static methods\

// Instance methods:
User.prototype.toJSON = function() {
	const values = { ...this.get() };
	delete values.password_hash;
	return values;
}
// Instance methods\

module.exports = User;
