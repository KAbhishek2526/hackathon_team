const express = require('express');
const Task = require('../models/Task');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { classifyTask } = require('../services/aiService');
const { calculatePrice } = require('../services/pricingService');
const { awardBadges, calculateTier } = require('../services/badgeService');

const router = express.Router();

// POST /api/tasks — Create task: AI classify + price + escrow. Status stays "open" for others to accept.
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, digital_or_physical } = req.body;
        const userId = req.user.id;

        if (!title || !description || !digital_or_physical) {
            return res.status(400).json({ error: 'title, description, and digital_or_physical are required' });
        }

        const poster = await User.findById(userId);
        if (!poster) return res.status(404).json({ error: 'User not found' });

        // AI Classification
        const classification = classifyTask(title, description);
        const { category, complexity_level, estimated_time_hours } = classification;

        // Calculate price
        const price = calculatePrice(estimated_time_hours, complexity_level);

        // Check wallet balance
        if (poster.wallet_balance < price) {
            return res.status(400).json({
                error: `Insufficient wallet balance. Need ₹${price}, have ₹${poster.wallet_balance}`,
            });
        }

        // Create task — always starts as "open" so others can see and accept it
        const task = await Task.create({
            title,
            description,
            category,
            complexity_level,
            estimated_time_hours,
            price,
            posted_by: userId,
            assigned_to: null,
            status: 'open',
            digital_or_physical,
        });

        // Deduct from poster wallet & hold in escrow
        await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: -price } });
        await Transaction.create({
            task_id: task._id,
            payer_id: userId,
            receiver_id: null,
            amount: price,
            status: 'escrow',
        });

        console.log(`[TASK CREATED] id=${task._id} by=${userId} status=open price=${price}`);

        res.status(201).json({
            task,
            classified: { category, complexity_level, estimated_time_hours },
            price,
            assigned_to: null,
        });
    } catch (err) {
        console.error('Task creation error:', err);
        res.status(500).json({ error: 'Server error during task creation' });
    }
});

// GET /api/tasks — List open tasks NOT posted by the current user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`[AVAILABLE TASKS] Requested by user: ${userId}`);

        const tasks = await Task.find({
            status: 'open',
            posted_by: { $ne: userId },
        })
            .populate('posted_by', 'name college_domain')
            .sort({ created_at: -1 });

        console.log(`[AVAILABLE TASKS] Found ${tasks.length} open tasks for user ${userId}`);
        res.json(tasks);
    } catch (err) {
        console.error('Available tasks error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/tasks/my — Tasks posted by or assigned to the current user
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const tasks = await Task.find({
            $or: [{ posted_by: userId }, { assigned_to: userId }],
        })
            .populate('posted_by', 'name')
            .populate('assigned_to', 'name')
            .sort({ created_at: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/tasks/:id/accept — Accept an open task (cannot accept own task)
router.post('/:id/accept', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (task.status !== 'open') return res.status(400).json({ error: 'Task is no longer available' });
        if (String(task.posted_by) === String(userId)) {
            return res.status(403).json({ error: 'You cannot accept your own task' });
        }

        // Check weekly hours cap
        const acceptee = await User.findById(userId);
        if (!acceptee) return res.status(404).json({ error: 'User not found' });
        if (acceptee.weekly_hours_completed >= 6) {
            return res.status(403).json({ error: 'Weekly hours cap reached (6h). Cannot accept new tasks.' });
        }

        // Assign task
        task.assigned_to = userId;
        task.status = 'assigned';
        await task.save();

        // Update escrow transaction with receiver
        await Transaction.findOneAndUpdate(
            { task_id: task._id, status: 'escrow' },
            { receiver_id: userId }
        );

        console.log(`[TASK ACCEPTED] id=${task._id} by=${userId}`);

        const populated = await Task.findById(task._id)
            .populate('posted_by', 'name')
            .populate('assigned_to', 'name');

        res.json({ message: 'Task accepted successfully', task: populated });
    } catch (err) {
        console.error('Accept task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/tasks/:id/complete — Mark task complete (only assigned user)
router.post('/:id/complete', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (task.status !== 'assigned') return res.status(400).json({ error: 'Task is not in assigned state' });
        if (String(task.assigned_to) !== String(userId)) {
            return res.status(403).json({ error: 'Only the assigned user can mark this task complete' });
        }

        task.status = 'completed';
        await task.save();

        // Release escrow → pay assignee
        await Transaction.findOneAndUpdate({ task_id: task._id, status: 'escrow' }, { status: 'released' });
        await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: task.price } });

        // Update reliability, weekly hours, tier
        const assignee = await User.findById(userId);
        const newReliability = assignee.reliability_score + 2;
        const newWeeklyHours = assignee.weekly_hours_completed + task.estimated_time_hours;
        const newTier = calculateTier(newReliability);
        const weeklyCapRespected = newWeeklyHours <= 6;

        await User.findByIdAndUpdate(userId, {
            reliability_score: newReliability,
            weekly_hours_completed: newWeeklyHours,
            skill_tier: newTier,
        });

        const completedCount = await Task.countDocuments({ assigned_to: userId, status: 'completed' });
        await awardBadges(userId, completedCount, weeklyCapRespected);

        const updatedAssignee = await User.findById(userId).select('-password_hash');
        res.json({ message: 'Task completed successfully', task, user: updatedAssignee });
    } catch (err) {
        console.error('Complete task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/tasks/:id/cancel — Cancel task (only poster)
router.post('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (task.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed task' });
        if (String(task.posted_by) !== String(userId)) {
            return res.status(403).json({ error: 'Only the poster can cancel this task' });
        }

        task.status = 'cancelled';
        await task.save();

        // Refund poster
        await Transaction.findOneAndUpdate({ task_id: task._id, status: 'escrow' }, { status: 'refunded' });
        await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: task.price } });

        // Penalise assignee reliability if task was already assigned
        if (task.assigned_to) {
            const assignee = await User.findById(task.assigned_to);
            if (assignee) {
                const newReliability = assignee.reliability_score - 3;
                const newTier = calculateTier(newReliability);
                await User.findByIdAndUpdate(task.assigned_to, {
                    reliability_score: newReliability,
                    skill_tier: newTier,
                });
            }
        }

        res.json({ message: 'Task cancelled and funds refunded', task });
    } catch (err) {
        console.error('Cancel task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
