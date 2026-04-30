const jwt = require('jsonwebtoken');
const { 
	accessToken,
	refreshToken
} = require('#configs/jwt');
const { addSeconds } = require('#utils/dates');


module.exports = {
	issueAccessToken: (payload) => _issueToken({ payload, secret:accessToken.secret, expiresIn:accessToken.expiresIn }),
	issueRefreshToken: (payload) => _issueToken({ payload, secret:refreshToken.secret, expiresIn:refreshToken.expiresIn }),
	verifyAccessToken: (token) => _verifyToken({ token, secret:accessToken.secret }),
	verifyRefreshToken: (token) => _verifyToken({ token, secret:refreshToken.secret })
};

async function _issueToken({ payload, secret, expiresIn }) {
	try {
		const token = jwt.sign(payload, secret, { expiresIn });
		const expirationDateValue = (addSeconds(new Date(), expiresIn/1000)).valueOf();

		const fullToken = { token, expiresIn, expirationDateValue };
		return Promise.resolve([ fullToken ]);
	}
	catch(error) {
		return Promise.reject(error);
	}
}

async function _verifyToken({ token, secret }) {
	try {
		const parsedToken = await jwt.verify(token, secret, {});
		return Promise.resolve([ parsedToken ]);
	}
	catch(error) {
		return Promise.reject(error);
	}
}
