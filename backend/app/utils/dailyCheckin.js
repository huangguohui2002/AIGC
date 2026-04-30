const DAILY_CHECKIN_MIN_REWARD = 10;
const DAILY_CHECKIN_MAX_REWARD = 50;
const DAILY_CHECKIN_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Shanghai';

module.exports = {
	DAILY_CHECKIN_MIN_REWARD,
	DAILY_CHECKIN_MAX_REWARD,
	DAILY_CHECKIN_TIMEZONE,
	getDailyCheckinDateKey,
	generateDailyCheckinReward,
	buildDailyCheckinState
};

function getDailyCheckinDateKey(date = new Date(), timeZone = DAILY_CHECKIN_TIMEZONE) {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	const parts = formatter.formatToParts(date);
	const year = parts.find((part) => part.type === 'year')?.value;
	const month = parts.find((part) => part.type === 'month')?.value;
	const day = parts.find((part) => part.type === 'day')?.value;
	return `${year}-${month}-${day}`;
}

function generateDailyCheckinReward() {
	const rewardSpan = DAILY_CHECKIN_MAX_REWARD - DAILY_CHECKIN_MIN_REWARD + 1;
	return Math.floor(Math.random() * rewardSpan) + DAILY_CHECKIN_MIN_REWARD;
}

function buildDailyCheckinState(user, now = new Date()) {
	const today = getDailyCheckinDateKey(now);
	const checkedInToday = Boolean(user?.last_checkin_date) && user.last_checkin_date === today;

	return {
		checked_in_today: checkedInToday,
		can_check_in: !checkedInToday,
		last_checkin_date: user?.last_checkin_date || null,
		last_checkin_at: user?.last_checkin_at || null,
		last_checkin_reward: checkedInToday ? Number(user?.last_checkin_reward || 0) : 0,
		reward_range: {
			min: DAILY_CHECKIN_MIN_REWARD,
			max: DAILY_CHECKIN_MAX_REWARD
		},
		time_zone: DAILY_CHECKIN_TIMEZONE
	};
}
