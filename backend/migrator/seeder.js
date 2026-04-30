// Load environment variables the same way as the main app.
const environments = require('#configs/envinorments');

// Data to seed:
const users = require('./seeds/users');
// Import your seeders here...

// Connection to database.
const db = require('#services/db.service');


async function _main () {
	try {
		if (environments.current !== 'development'){
			const error = new Error("Can not make any actions in non-dev env.");
		  throw error;
		};

		// Make database connection active.
		const DB = await db.service(environments.current).start();

		await users.run();
		// Run seeders here...

		console.warn("All seeds inserted");
		process.exit(0);
	}
	catch(error) {
		console.error('Seeder error:', error);
		process.exit(1);
	}
}

// Start.
_main();
