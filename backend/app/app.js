/**
 * Main application file:
 */

// Info about current and allowed environments.
const environments = require('#configs/envinorments');
// Middleware for parsing requests bodies.
const bodyParser = require('body-parser');
// Express.
const express = require('express');
const http = require('http');
const path = require('path');
// Mild security.
const helmet = require('helmet');
// Cross-origin requests middleware.
const cors = require('cors');

// Server configuration:
// ORM.
const DB = require('#services/db.service');
const { ensureAppSchema } = require('#services/schema.service');
// Port info.
const serverConfig = require('#configs/server');
// 图片上传服务（含定时清理临时文件）
const { cleanTempFiles } = require('#services/upload.service');
const { cleanupExpiredGeneratedImages } = require('#services/generatedMediaCleanup.service');
// Server configuration\

// Express application.
const app = express();
// HTTP server (Do not use HTTPS, manage TLS with some proxy, like Nginx).
const server = http.Server(app);
const publicDir = path.join(__dirname, '../public');
const distDir = path.join(publicDir, 'dist');
// Routes.
const routes = require('#routes/');


// Allow cross origin requests
// (configure to only allow requests from certain origins).
app.use(cors());

// Set views path.
app.set('views', __dirname+'/views');
// Set template engine (Pug by default).
app.set('view engine', 'pug');
// Serve built frontend assets first, then other public files such as uploads.
app.use(express.static(distDir));
app.use(express.static(publicDir));

// Secure express app.
app.use(helmet({
	dnsPrefetchControl: false,
	frameguard: false,
	ieNoOpen: false,
}));

// Parsing the request bodies.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Setup routes.
app.use(routes({ app }));

// SPA fallback: non-API GET requests should return the built frontend entry.
app.get('*', (req, res, next) => {
	if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
		return next();
	}

	return res.sendFile(path.join(distDir, 'index.html'), (error) => {
		if (error) {
			return next();
		}
	});
});


// Reference to the active database connection.
let db;

async function runGeneratedImageCleanup() {
	try {
		const result = await cleanupExpiredGeneratedImages();
		if (result.marked > 0 || result.errors > 0) {
			console.info('[GeneratedMediaCleanup] completed:', result);
		}
	} catch (error) {
		console.error('[GeneratedMediaCleanup] failed:', error);
	}
}

async function _beforeStart() {
	if (environments.allowed.indexOf(environments.current) === -1) {
		console.error(`NODE_ENV is set to ${environments.current}, but only ${environments.allowed.toString()} are valid.`);
		process.exit(1);
	}

	// Start ORM.
	db = await DB.service(environments.current);
	await db.start();
	await ensureAppSchema();

	return Promise.resolve();
}

// Initialize server:
_beforeStart()
.then(() => {
	server.listen(serverConfig.port, () => {
		// Server is up!
		console.info(`Server is running on port: ${serverConfig.port}`);
		// 每 5 分钟清理一次临时上传图片（超过 30 分钟的文件）
		setInterval(cleanTempFiles, 5 * 60 * 1000);
		runGeneratedImageCleanup();
		setInterval(() => {
			runGeneratedImageCleanup();
		}, 24 * 60 * 60 * 1000);
	});
})
.catch((error) => {
	console.error('Could not start server:', error);
});
// Initialize server\

// Handle process errors:
process.on('unhandledRejection', (reason, p) => {
	console.error(reason, 'Unhandled Rejection at Promise', p);
});
	
process.on('uncaughtException', (error) => {
	console.error(error, 'Uncaught Exception thrown');
	
	_gracefulShutdown(true);
});

function _gracefulShutdown(exit=false) {
	console.warn('Received SIGINT or SIGTERM. Shutting down gracefully...');
	const exitCode = exit ? 1 : 0;

	server.close(() => {
		console.info('Closed out remaining connections.');
		process.exit(exitCode);
	});

	// Force stop after 5 seconds:
	setTimeout(() => {
		console.warn('Could not close HTTP connections in time, forcefully shutting down');
		process.exit(exitCode);
	}, 5*1000);
}
// Handle process errors\
