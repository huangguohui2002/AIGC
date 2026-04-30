// ORM:
const { DataTypes } = require('sequelize');
const database = require('#services/db.service');


const DisabledRefreshToken = database.define(
	'DisabledRefreshToken',
	{
		token: {
			type: DataTypes.STRING,
			required: true,
			allowNull: false,
			unique: true
		},
		UserId: {
			type: DataTypes.INTEGER,
			required: true,
			allowNull: false
		}
	},
	{
		tableName: 'disabledrefreshtokens',
		// Enable automatic 'createdAt' and 'updatedAt' fields.
		timestamps: true,
		// Only allow 'soft delete'
		// (set of 'deletedAt' field, insted of the real deletion).
		paranoid: true
	}
);

// Static methods:
DisabledRefreshToken.associate = models => {
	models.DisabledRefreshToken.belongsTo(models.User, {
		foreignKey: 'UserId',
		as: 'user'
	});
}

DisabledRefreshToken.createOrFind = function({ token, userId }) {
	const where = {
		token
	};

	const defaults = {
		token: token,
		UserId: userId
	};

	const query = {
		where,
		defaults
	};
	return this.findOrCreate(query);
}

DisabledRefreshToken.selectAll = function({ token }) {
	const where = {
		token
	};
	const query = { where };
	return this.findAll(query);
}
// Static methods\

// Instance methods:
DisabledRefreshToken.prototype.toJSON = function() {
	const values = Object.assign({}, this.get());
	return values;
}
// Instance methods\

module.exports = DisabledRefreshToken;
