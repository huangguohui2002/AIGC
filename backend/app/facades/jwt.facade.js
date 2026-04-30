// Reference models.
const DisabledRefreshToken = require('#models/DisabledRefreshToken');
// JWT service.
const JWT = require('#services/jwt.service');
// Custom error.
const { Err } = require('#factories/errors');


module.exports = {
	issueAccessToken: _issueAccessToken,
	issueTokens: _issueTokens,

	isRefreshTokenActive: _isRefreshTokenActive,
	refreshAccessToken: _refreshAccessToken,

	disableRefreshToken: _disableRefreshToken,

	// Add your methods here...
}

async function _issueAccessToken({ refreshToken, user }){
	try {
		let newAccessToken = null;

		// If refresh token was provided:
		if (refreshToken) {
			const payload = {
				id:refreshToken?.id,
				roles:refreshToken?.roles ?? []
			};
			newAccessToken = await JWT.issueAccessToken(payload);
		}
		// If user was provided:
		else if (user) {
			const payload = { id:user?.id };
			newAccessToken = await JWT.issueAccessToken(payload);
		}
		else {
			const err = new Err('No "user" or "refreshToken" provided for JWT issue.');
			err.name = "ValidationError";
			err.status = 403;
			throw err;
		}

		// Check if issue was successful.
		if (!newAccessToken){
			const err = new Err("Could not issue new access token.");
			err.status = 401;
			throw err;
		}

		// Send output.
		return Promise.resolve([
			newAccessToken
		]);
	}
	catch(error) {
		return Promise.reject(error);
	}
}

async function _issueTokens({ user }) {
	try {
		// Prepare payload container.
		let payload = {};

		if (user) {
			payload = { id:user?.id };
		}
		else {
			const err = new Err('No "user" provided for JWT issue.');
			err.name = "ValidationError";
			err.status = 403;
			throw err;
		}

		const [ accessToken ] = await JWT.issueAccessToken(payload);
		const [ refreshToken ] = await JWT.issueRefreshToken(payload);

		// Prepare output,
		const tokens = {
			accessToken,
			refreshToken
		};
		// Send output.
		return Promise.resolve([
			tokens
		]);
	}
	catch(error) {
		return Promise.reject(error);
	}
}

async function _refreshAccessToken({ refreshToken }) {
	try {
		// Issue new access token, based on refresh token.
		const [ accessToken ] = await _issueAccessToken({ refreshToken });

		// Send output.
		return Promise.resolve([
			accessToken
		]);	
	}
	catch(error){
		return Promise.reject(error);
	}
}

async function _isRefreshTokenActive({ refreshToken }) {
	try {
		// Unwrap nessessary data.
		const { token } = refreshToken;

		const foundTokens = await DisabledRefreshToken.selectAll({ token });

		// Prepare output. Check if provided token was not disabled.
		const isActive = foundTokens.length === 0;

		// Send output.
		return Promise.resolve([ isActive ]);
	}
	catch(error) {
		return Promise.reject(error);
	}
}

async function _disableRefreshToken({ refreshToken }) {
	try {
		// Unwrap nessessary data.
		const { id, token } = refreshToken;

		// Find or create.
		const [ disabledRefreshToken, created ] = await DisabledRefreshToken.createOrFind({
			userId:id,
			token
		});

		// Check result,
		const createdStatus = created === true || !!disabledRefreshToken;

		// Send output.
		return Promise.resolve([ createdStatus ]);
	}
	catch(error) {
		return Promise.reject(error);
	}
}