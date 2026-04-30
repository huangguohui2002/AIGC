// Load environment variables the same way as the main app.
const environments = require('#configs/envinorments');
// Models to migrate.
require('./models');
// Connection to database
const db = require('#services/db.service');


async function _main() {
	try {
		if (environments.current !== 'development') {
			const error = new Error("Can not make any actions in non-dev env.");
			throw error;
		}

		// Set 'force' to true if you want to rewrite database.
		// WARNING: force=true 会删除所有表并重建，生产环境慎用
		const force = false;
		await db.migrate(environments.current, force);
		
		console.info('All models migrated.');
		process.exit(0);
	}
	catch(error) {
		console.error('Migrator error:', error);
		process.exit(1);
	}
}

// Start.
_main();
