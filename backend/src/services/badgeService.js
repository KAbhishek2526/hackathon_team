const User = require('../models/User');

const BADGES = {
    CONSISTENT_CONTRIBUTOR: 'Consistent Contributor',
    ON_TIME_PRO: 'On-Time Pro',
    ACADEMIC_SAFE_WORKER: 'Academic Safe Worker',
};

async function awardBadges(userId, completedTasksCount, weeklyCapRespected) {
    const user = await User.findById(userId);
    if (!user) return;

    const newBadges = [];

    if (completedTasksCount >= 5 && !user.badges.includes(BADGES.CONSISTENT_CONTRIBUTOR)) {
        newBadges.push(BADGES.CONSISTENT_CONTRIBUTOR);
    }
    if (user.reliability_score >= 10 && !user.badges.includes(BADGES.ON_TIME_PRO)) {
        newBadges.push(BADGES.ON_TIME_PRO);
    }
    if (weeklyCapRespected && !user.badges.includes(BADGES.ACADEMIC_SAFE_WORKER)) {
        newBadges.push(BADGES.ACADEMIC_SAFE_WORKER);
    }

    if (newBadges.length > 0) {
        await User.findByIdAndUpdate(userId, { $push: { badges: { $each: newBadges } } });
    }
}

function calculateTier(reliabilityScore) {
    if (reliabilityScore >= 50) return 3;
    if (reliabilityScore >= 20) return 2;
    return 1;
}

module.exports = { awardBadges, calculateTier };
