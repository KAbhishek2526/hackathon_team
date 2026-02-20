const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me — Current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/users/wallet — Wallet balance + transaction history
router.get('/wallet', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('wallet_balance name');
        const transactions = await Transaction.find({
            $or: [{ payer_id: req.user.id }, { receiver_id: req.user.id }],
        })
            .populate('task_id', 'title')
            .populate('payer_id', 'name')
            .populate('receiver_id', 'name')
            .sort({ created_at: -1 });

        res.json({ wallet_balance: user.wallet_balance, transactions });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
