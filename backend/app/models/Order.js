const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const Order = database.define(
	'Order',
	{
		order_no: {
			type: DataTypes.STRING(32),
			unique: true,
			allowNull: false
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		package_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		provider: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		provider_order_id: {
			type: DataTypes.STRING(64),
			allowNull: true
		},
		status: {
			type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'expired'),
			defaultValue: 'pending'
		},
		paid_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		expired_at: {
			type: DataTypes.DATE,
			allowNull: false
		}
	},
	{
		tableName: 'orders',
		timestamps: true
	}
);

Order.associate = (models) => {
	models.Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
};

module.exports = Order;
