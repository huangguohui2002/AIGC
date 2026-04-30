const { DataTypes } = require('sequelize');
const database = require('#services/db.service');

const AIProvider = database.define(
	'AIProvider',
	{
		name: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		code: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true
		},
		protocol: {
			type: DataTypes.ENUM('openai_compatible'),
			allowNull: false,
			defaultValue: 'openai_compatible'
		},
		base_url: {
			type: DataTypes.STRING(500),
			allowNull: false
		},
		api_key: {
			type: DataTypes.STRING(1000),
			allowNull: false
		},
		enabled: {
			type: DataTypes.TINYINT,
			allowNull: false,
			defaultValue: 1
		},
		timeout_ms: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 90000
		},
		extra_config: {
			type: DataTypes.JSON,
			allowNull: true
		}
	},
	{
		tableName: 'aiproviders',
		timestamps: true,
		paranoid: false
	}
);

AIProvider.associate = (models) => {
	models.AIProvider.hasMany(models.AiModel, { foreignKey: 'provider_id', as: 'models' });
	models.AIProvider.hasMany(models.Generation, { foreignKey: 'provider_id', as: 'generations' });
};

module.exports = AIProvider;
