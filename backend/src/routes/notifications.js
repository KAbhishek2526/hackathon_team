const express = require('express');
const authMiddleware = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// Helper: get io instance
function getIo(req) { return req.app.get('io'); }

/**
 * GET /api/notifications — List notifications for the logged-in user (newest first)
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('relatedTaskId', 'title');
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PATCH /api/notifications/:id/read — Mark one notification as read
 */
router.patch('/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ error: 'Notification not found' });
        res.json(notification);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PATCH /api/notifications/read-all — Mark all as read
 */
router.patch('/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
