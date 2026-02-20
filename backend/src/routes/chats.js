const express = require('express');
const authMiddleware = require('../middleware/auth');
const Chat = require('../models/Chat');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

const router = express.Router();

function getIo(req) { return req.app.get('io'); }

async function createAndEmitNotification(io, { userId, type, message, relatedTaskId }) {
    const notification = await Notification.create({ userId, type, message, relatedTaskId, isRead: false });
    if (io) io.to(`user_${userId}`).emit('new_notification', notification);
    return notification;
}

/**
 * POST /api/chats/task/:taskId/inquiry
 * Any non-owner user creates or retrieves their inquiry chat for an open task.
 */
router.post('/task/:taskId/inquiry', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Owner cannot chat with themselves
        if (String(task.posted_by) === String(userId)) {
            return res.status(403).json({ error: 'You cannot chat on your own task' });
        }

        // If task is assigned, only the assigned worker can access
        if (task.assigned_to && String(task.assigned_to) !== String(userId)) {
            return res.status(403).json({ error: 'Task has already been assigned to another worker' });
        }

        // If task is closed/completed/disputed/cancelled, no new inquiries
        const allowedStatuses = ['open', 'assigned', 'in_progress', 'awaiting_approval'];
        if (!allowedStatuses.includes(task.status)) {
            return res.status(400).json({ error: `Cannot open chat for a task with status "${task.status}"` });
        }

        // Find or create inquiry chat for this task+participant pair
        let chat = await Chat.findOne({ taskId, participantId: userId });

        if (!chat) {
            chat = await Chat.create({
                taskId,
                clientId: task.posted_by,
                participantId: userId,
                status: task.assigned_to ? 'active' : 'inquiry',
                messages: [],
            });
            console.log(`[CHAT] New inquiry chat created: ${chat._id} task=${taskId} participant=${userId}`);

            // Notify client about new inquiry
            const io = getIo(req);
            await createAndEmitNotification(io, {
                userId: task.posted_by,
                type: 'new_message',
                message: 'A worker started a chat inquiry on your task.',
                relatedTaskId: taskId,
            });
        }

        res.json({ chatId: chat._id, status: chat.status, messages: chat.messages });
    } catch (err) {
        console.error('Open inquiry chat error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/chats/:chatId
 * Get a specific chat by ID (participants only).
 */
router.get('/:chatId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const chat = await Chat.findById(req.params.chatId)
            .populate('clientId', 'name')
            .populate('participantId', 'name')
            .populate('taskId', 'title status');

        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        const isParticipant =
            String(chat.clientId._id || chat.clientId) === String(userId) ||
            String(chat.participantId._id || chat.participantId) === String(userId);

        if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

        res.json(chat);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/chats/task/:taskId
 * For client: all chats on this task. For worker: their own chat.
 */
router.get('/task/:taskId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        let chats;
        if (String(task.posted_by) === String(userId)) {
            // Client sees all inquiry chats for their task
            chats = await Chat.find({ taskId })
                .populate('participantId', 'name')
                .sort({ updatedAt: -1 });
        } else {
            // Worker sees only their own chat
            chats = await Chat.find({ taskId, participantId: userId })
                .populate('clientId', 'name');
        }

        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
