module.exports = {
	addSeconds: _addSeconds,
	addDays: _addDays
}

function _addSeconds(date=null, seconds=0) {
	const newDate = new Date(date.valueOf());
	newDate.setSeconds(newDate.getSeconds() + seconds);
	return newDate;
}

function _addDays(date=null, days=0) {
	const newDate = new Date(date.valueOf());
	newDate.setDate(newDate.getDate() + days);
	return newDate;
}

