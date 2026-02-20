const express = require('express');
const User = require('../models/User');

const router = express.Router();

// POST /api/reset-week — Reset weekly_hours_completed for all users
router.post('/reset-week', async (req, res) => {
    try {
        const result = await User.updateMany({}, { $set: { weekly_hours_completed: 0 } });
        res.json({ message: 'Weekly hours reset for all users', modifiedCount: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
