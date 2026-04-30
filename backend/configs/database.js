const CHARSET = 'utf8';
const COLLATE = 'utf8_general_ci';

module.exports = {
	database: process.env.DB_NAME,
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST ?? 'localhost',
	port: process.env.DB_PORT ?? '3306',
	dialect: process.env.DB_DIALECT ?? 'mysql', // or: 'postgres'

	pool: {
		max: 5,
		min: 0,
		idle: 10000,
	},
	charset: CHARSET,
	collate: COLLATE, 
	timestamps: true,
	logging:false
}