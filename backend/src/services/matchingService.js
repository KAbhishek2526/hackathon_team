const User = require('../models/User');

/**
 * Find the best eligible user to assign a task to.
 * Criteria:
 *  - Not the poster
 *  - Has not hit weekly cap (weekly_hours_completed < 6)
 * Sorted by: reliability_score desc, skill_tier desc
 */
async function findBestMatch(postedById) {
    const match = await User.findOne({
        _id: { $ne: postedById },
        weekly_hours_completed: { $lt: 6 },
    })
        .sort({ reliability_score: -1, skill_tier: -1 })
        .exec();

    return match || null;
}

module.exports = { findBestMatch };
