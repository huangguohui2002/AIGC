const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const backendRoot = path.resolve(__dirname, '..');
const baseEnvPath = path.join(backendRoot, '.env');

dotenv.config({ path: baseEnvPath });

const currentEnv = process.env.NODE_ENV || 'development';
const scopedEnvPath = path.join(backendRoot, `.env.${currentEnv}`);

process.env.NODE_ENV = currentEnv;

if (fs.existsSync(scopedEnvPath)) {
	dotenv.config({
		path: scopedEnvPath,
		override: true
	});
}

module.exports = {
	current: process.env.NODE_ENV,
	allowed: [
		'development',
		'testing',
		'staging',
		'production'
	]
}
