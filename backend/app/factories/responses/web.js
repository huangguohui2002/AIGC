module.exports = {
	createOKResponse: _createOKResponse,
	createErrorResponse: _createErrorResponse
}

/**
 * Sends rendererd HTML view with status code 200.
 * Should be called on all successful respones.
 *
 * @param <Object> res
 * @param <String> viewName
 * @param <Object> params
 */
function _createOKResponse(res=null, viewName=null, viewParams={}) {
	return res.render(viewName, viewParams);
}

/**
 * Sends response with provided error code.
 * Should be called on all failed respones.
 *
 * @param <Object> res
 * @param <Object> error
 * @param <Int>		 code
 */
function _createErrorResponse(res, error={}, code=500) {
	const statusCode = error?.status ?? code;
	const viewParams = {
		title: `${statusCode} error`,
		heading: `${statusCode} | ${error.message}.`
	};
	return res.render('error', viewParams);
}