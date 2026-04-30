const accessToken = {
	secret: process.env.JWT_ACCESS_SECRET,
	expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days
}
const refreshToken = {
	secret: process.env.JWT_REFRESH_SECRET,
	expiresIn: 14 * 24 * 60 * 60 * 1000 // 14 days
}

module.exports = {
	accessToken,
	refreshToken
}