const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const AiModel = database.define(
	'AiModel',
	{
		name: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		subtitle: {
			type: DataTypes.STRING(100),
			allowNull: true
		},
		type: {
			type: DataTypes.ENUM('image', 'video', 'both'),
			allowNull: false
		},
		provider_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		model_name: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		sort_order: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		is_active: {
			type: DataTypes.TINYINT,
			defaultValue: 1
		},
		points_cost: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		capabilities: {
			type: DataTypes.JSON,
			allowNull: true
		},
		default_params: {
			type: DataTypes.JSON,
			allowNull: true
		}
	},
	{
		tableName: 'aimodels',
		timestamps: true,
		paranoid: false
	}
);

AiModel.associate = (models) => {
	models.AiModel.belongsTo(models.AIProvider, { foreignKey: 'provider_id', as: 'provider' });
	models.AiModel.hasMany(models.Generation, { foreignKey: 'ai_model_id', as: 'generations' });
};

module.exports = AiModel;
