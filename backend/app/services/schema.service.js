const { DataTypes } = require('sequelize');
const database = require('#services/db.service');
const AIProvider = require('#models/AIProvider');

module.exports = {
	ensureAppSchema
};

async function ensureAppSchema() {
	await ensureUserDailyCheckinColumns();
	await ensureAiProviderSchema();
	await ensureAiModelSchema();
	await ensureGenerationSchema();
}

async function ensureUserDailyCheckinColumns() {
	const queryInterface = database.getQueryInterface();
	const table = await queryInterface.describeTable('users');
	let changed = false;

	if (!table.last_checkin_date) {
		await queryInterface.addColumn('users', 'last_checkin_date', {
			type: DataTypes.STRING(10),
			allowNull: true
		});
		changed = true;
	}

	if (!table.last_checkin_at) {
		await queryInterface.addColumn('users', 'last_checkin_at', {
			type: DataTypes.DATE,
			allowNull: true
		});
		changed = true;
	}

	if (!table.last_checkin_reward) {
		await queryInterface.addColumn('users', 'last_checkin_reward', {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		});
		changed = true;
	}

	if (changed) {
		console.info('[schema] daily check-in columns ensured');
	}
}

async function ensureAiProviderSchema() {
	await AIProvider.sync();
}

async function ensureAiModelSchema() {
	const queryInterface = database.getQueryInterface();
	const table = await queryInterface.describeTable('aimodels');
	let changed = false;

	if (!table.provider_id) {
		await queryInterface.addColumn('aimodels', 'provider_id', {
			type: DataTypes.INTEGER,
			allowNull: true
		});
		changed = true;
	}

	if (!table.capabilities) {
		await queryInterface.addColumn('aimodels', 'capabilities', {
			type: DataTypes.JSON,
			allowNull: true
		});
		changed = true;
	}

	if (!table.default_params) {
		await queryInterface.addColumn('aimodels', 'default_params', {
			type: DataTypes.JSON,
			allowNull: true
		});
		changed = true;
	}

	if (changed) {
		console.info('[schema] ai model provider columns ensured');
	}
}

async function ensureGenerationSchema() {
	const queryInterface = database.getQueryInterface();
	const table = await queryInterface.describeTable('generations');
	let changed = false;

	if (!table.ai_model_id) {
		await queryInterface.addColumn('generations', 'ai_model_id', {
			type: DataTypes.INTEGER,
			allowNull: true
		});
		changed = true;
	}

	if (!table.provider_id) {
		await queryInterface.addColumn('generations', 'provider_id', {
			type: DataTypes.INTEGER,
			allowNull: true
		});
		changed = true;
	}

	if (!table.asset_deleted_at) {
		await queryInterface.addColumn('generations', 'asset_deleted_at', {
			type: DataTypes.DATE,
			allowNull: true
		});
		changed = true;
	}

	if (changed) {
		console.info('[schema] generation columns ensured');
	}
}
