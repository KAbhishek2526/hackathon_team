const BASE_HOURLY_RATE = 200;

const COMPLEXITY_BONUS = {
    Low: 0,
    Medium: 50,
    High: 100,
};

function calculatePrice(estimated_time_hours, complexity_level) {
    const bonus = COMPLEXITY_BONUS[complexity_level] ?? 0;
    return Math.round(estimated_time_hours * BASE_HOURLY_RATE + bonus);
}

module.exports = { calculatePrice };
