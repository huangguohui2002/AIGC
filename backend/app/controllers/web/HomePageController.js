const fs = require('fs');
const path = require('path');
// Reponse protocols.
const {
	createOKResponse,
	createErrorResponse
} = require('#factories/responses/web');


module.exports = HomePageController;

function HomePageController() {
	const distIndexPath = path.join(__dirname, '../../../public/dist/index.html');

	const _getHomePage = (req, res) =>{
		try {
			if (fs.existsSync(distIndexPath)) {
				return res.sendFile(distIndexPath);
			}

			return createOKResponse(res, 'home');
		}
		catch(error) {
			console.error("HomePageController._getHomePage error:", error);
			return createErrorResponse(res, error);
		}
	}

	return {
		getHomePage: _getHomePage
	}
}
