// JWT service.
const JWT = require('#services/jwt.service');
// JWT facade.
const { isRefreshTokenActive } = require('#facades/jwt.facade');
// Response protocol.
const { createErrorResponse } = require("#factories/responses/api");
// Custom error.
const { Err } = require('#factories/errors');


const REFRESH_TOKEN_NAME = 'x-refresh-token';

module.exports = async (req, res, next) => {
	try {
		let tokenToVerify;

		// Check token in Header:
		if (req.header(REFRESH_TOKEN_NAME)) {
			tokenToVerify = req.header(REFRESH_TOKEN_NAME);
		}
		else {
			const err = new Err(`No ${REFRESH_TOKEN_NAME} was found`);
			err.status = 401;
			throw err;
		}

		// Check token against local seed.
		const [ parsedToken ] = await JWT.verifyRefreshToken(tokenToVerify);

		// Construct full refresh token.
		const refreshToken = { ...parsedToken, token:tokenToVerify };

		// If token is not in active tokens, then it has been disabled:
		const [ isActive ] = await isRefreshTokenActive({ refreshToken });
		if (!isActive) {
			const err = new Err("Token is disabled");
			err.status = 401;
			throw err;
		}

		// Everything's good, procceed:
		req.refreshToken = refreshToken;
		return next();
	}
	catch(error) {
		// If error is not our custom error, log it.
		if (error.name !== Err.name)
			console.error("refreshToken.policy error:", error);
		else
			error.name = 'ValidationError';

		return createErrorResponse({
			res, 
			error,
			status: error?.status ?? 401
		});
	}
}
