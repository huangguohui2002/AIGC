// ORM.
const Sequelize = require('sequelize');
// Connection configs.
const Configs = require('#configs/database');


// Make first database connection.
const connection = new Sequelize(
	Configs.database,
	Configs.username,
	Configs.password,
	{
		host: Configs.host,
		port: Configs.port,
		dialect: Configs.dialect,
		pool: Configs.pool,
		charset: Configs.charset,
		collate: Configs.collate, 
		timestamps: Configs.timestamps,
		logging: Configs.logging
	}
);

module.exports = connection;
module.exports.service = DBService;
module.exports.migrate = _migrate;

function DBService() {

	const _authenticateDB = () => (
		connection.authenticate()
	);

	const _start = async () => {
		try{
			// Test database connection.
			await _authenticateDB();

			// Include all models for associations.
			require('#models/');

			// Get newly included models from db connection.
			const models = connection.models;

			// Associate all models with each other.
			await _associateModels(models);

			console.info(`Database info: ${Object.keys(models).length} models associated.`);
			console.info('\x1b[1m', 'Connection to the database is fully operational', '\x1b[0m');

			return Promise.resolve(connection);
		}
		catch(error) {
			console.error('Unable to connect to the database:', error)
			return Promise.reject(error);
		}
	};

	return {
		start:_start
	};
};

async function _migrate(environment, force=false) {
	// Validation of NODE_ENV.
	if (environment !== 'development'){
		throw new Error(`Could not migrate in env ${environment}`);
	}
	// Validation of 'force' parameter.
	else if (typeof force !== 'boolean'){
		throw new Error("Wrong force parameter; must be boolean");
	}

	const _successfulDBMigration = () => (
		console.log('Successful migration')
	)

	await connection.authenticate();
	console.log('Models to sync:', connection.models);
	await _associateModels(connection.models);
	await connection.sync({ force });
	_successfulDBMigration();
}

async function _associateModels(models) {
	return new Promise((resolve, reject) => {
		try{
			Object.keys(models).map(modelName => {
				if (typeof models[modelName].associate === 'function') {
					models[modelName].associate(models);
				}
			});

			return resolve(models);
		}
		catch(error){
			reject(error);
		}
	});
}
