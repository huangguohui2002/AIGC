// JWT Service.
const JWT = require('#services/jwt.service');
// Reponse protocols.
const { createErrorResponse } = require('#factories/responses/api');
// Custom error.
const { Err } = require('#factories/errors');


// Format of token: "Authorization: Bearer [token]"
const ACCESS_TOKEN_NAME = 'Authorization';

module.exports = async (req, res, next) => {
	try {
		let tokenToVerify;

		// Check token in Header:
		if (req.header(ACCESS_TOKEN_NAME)) {
			const parts = req.header(ACCESS_TOKEN_NAME).split(' ');

			if (parts.length === 2 && /^Bearer$/.test(parts[0])) {
				tokenToVerify = parts[1];
			} 
			else {
				const err = new Err(`Format for ${ACCESS_TOKEN_NAME}: Bearer [token]`);
				err.status = 401;
				throw err;
			}
		}
		// Check token in query:
		else if (req.query.token) {
			tokenToVerify = req.query.token;
			delete req.body.token;
		}
		// Check token in body:
		else if (req.body.token) {
			tokenToVerify = req.body.token;
			delete req.query.token;
		} 
		else {
			const err = new Err(`No ${ACCESS_TOKEN_NAME} was found`);
			err.status = 401;
			throw err;
		}

		const [ parsedToken ] = await JWT.verifyAccessToken(tokenToVerify);

		// Everything's good, procceed:
		req.token = parsedToken;
		return next();
	}
	catch(error) {
		// If error is not our custom error, log it.
		if (error.name !== Err.name)
			console.error('refreshToken.policy error:', error);
		else
			error.name = 'ValidationError';

		return createErrorResponse({
			res, 
			error,
			status: error?.statusCode ?? 401
		});
	}
}
