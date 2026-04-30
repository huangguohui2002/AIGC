const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const Generation = database.define(
	'Generation',
	{
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		ai_model_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		provider_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		type: {
			type: DataTypes.ENUM('image', 'video'),
			allowNull: false
		},
		model: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		prompt: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		reference_image: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		params: {
			type: DataTypes.JSON,
			allowNull: true
		},
		work_id: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: 'Upstream async job id'
		},
		status: {
			type: DataTypes.ENUM('pending', 'success', 'failed'),
			defaultValue: 'pending'
		},
		result_url: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		asset_deleted_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		cost_points: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		error_message: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	},
	{
		tableName: 'generations',
		timestamps: true
	}
);

Generation.associate = (models) => {
	models.Generation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
	models.Generation.belongsTo(models.AiModel, { foreignKey: 'ai_model_id', as: 'aiModel' });
	models.Generation.belongsTo(models.AIProvider, { foreignKey: 'provider_id', as: 'provider' });
};

module.exports = Generation;
