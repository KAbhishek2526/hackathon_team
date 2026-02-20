const express = require('express');
const Task = require('../models/Task');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const { awardBadges, calculateTier } = require('../services/badgeService');
const { calculateDeterministicPrice, combinePrice, getDemandMultiplier, getInflationFactor } = require('../services/pricingEngine');
const { getMlPrediction } = require('../services/mlService');
const { getCategoryConfig, getSubcategoryConfig, validateCategoryCombo } = require('../config/categories');

const router = express.Router();

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function getIo(req) { return req.app.get('io'); }

async function createAndEmitNotification(io, { userId, type, message, relatedTaskId }) {
    const notification = await Notification.create({ userId, type, message, relatedTaskId, isRead: false });
    if (io) io.to(`user_${userId}`).emit('new_notification', notification);
    return notification;
}

async function runPricingPipeline({ category, subcategory, hours, tier }) {
    const { deterministicPrice, demandMultiplier, inflationFactor } = await calculateDeterministicPrice({
        category, subcategory, hours: Number(hours), tier: Number(tier) || 1,
    });
    const catConfig = getCategoryConfig(category);
    const subConfig = getSubcategoryConfig(category, subcategory);
    const mlPrediction = await getMlPrediction({
        categoryId: catConfig.id, subcategoryId: subConfig.id,
        hours: Number(hours), tier: Number(tier) || 1,
        demandScore: demandMultiplier, inflationFactor, deterministicPrice,
    });
    const aiSuggestedPrice = combinePrice(deterministicPrice, mlPrediction);
    return { aiSuggestedPrice, deterministicPrice, mlPrediction, demandScore: demandMultiplier, inflationFactor };
}

/* ─── GET /api/tasks/:id — Single task ────────────────────────────────────── */

router.get('/my', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [posted, assigned] = await Promise.all([
            Task.find({ posted_by: userId })
                .populate('posted_by', 'name')
                .populate('assigned_to', 'name')
                .sort({ created_at: -1 }),
            Task.find({ assigned_to: userId })
                .populate('posted_by', 'name')
                .populate('assigned_to', 'name')
                .sort({ created_at: -1 }),
        ]);
        res.json({ posted, assigned });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('posted_by', 'name email')
            .populate('assigned_to', 'name email');
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── GET /api/tasks — Available tasks ────────────────────────────────────── */

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Global clients cannot see/accept tasks
        if (userRole === 'global_client') {
            return res.json([]);
        }

        // Students: show digital tasks + physical tasks from same college
        const user = await User.findById(userId).select('college_domain');
        const collegeDomain = user?.college_domain;

        const query = {
            status: 'open',
            posted_by: { $ne: userId },
            $or: [
                { digital_or_physical: 'digital' },
                ...(collegeDomain
                    ? [{ digital_or_physical: 'physical', collegeDomain }]
                    : [{ digital_or_physical: 'physical', collegeDomain: null }]
                ),
            ],
        };

        const tasks = await Task.find(query)
            .populate('posted_by', 'name college_domain')
            .sort({ created_at: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── POST /api/tasks — Create task ───────────────────────────────────────── */

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, digital_or_physical, category, subcategory, estimatedHours, userPrice } = req.body;
        const userId = req.user.id;

        if (!title || !description) {
            return res.status(400).json({ error: 'title and description are required' });
        }

        const poster = await User.findById(userId);
        if (!poster) return res.status(404).json({ error: 'User not found' });

        // Global client minimum deposit check
        const MIN_GLOBAL_DEPOSIT = 2000;
        if (poster.role === 'global_client' && poster.wallet_balance < MIN_GLOBAL_DEPOSIT) {
            return res.status(400).json({
                error: `Professional accounts must maintain a minimum wallet balance of ₹${MIN_GLOBAL_DEPOSIT} to post tasks. Current balance: ₹${poster.wallet_balance}.`,
            });
        }

        let aiSuggestedPrice = 0, deterministicPrice = 0, mlPredictionVal = null;
        let demandScore = 1.0, inflationFactorVal = 1.0;
        let resolvedHours = Number(estimatedHours) || 1;

        const hasValidCategory = category && subcategory && validateCategoryCombo(category, subcategory).valid;
        if (hasValidCategory) {
            const pricing = await runPricingPipeline({
                category, subcategory, hours: resolvedHours, tier: poster.skill_tier || 1,
            });
            ({ aiSuggestedPrice, deterministicPrice, mlPrediction: mlPredictionVal, demandScore, inflationFactor: inflationFactorVal } = pricing);
        } else {
            aiSuggestedPrice = Math.round(resolvedHours * 200);
            deterministicPrice = aiSuggestedPrice;
        }

        const finalPrice = (userPrice !== undefined && userPrice !== null)
            ? Math.round(Number(userPrice)) : aiSuggestedPrice;
        const isPriceEdited = finalPrice !== aiSuggestedPrice;

        if (poster.wallet_balance < finalPrice) {
            return res.status(400).json({ error: `Insufficient wallet balance. Need ₹${finalPrice}, have ₹${poster.wallet_balance}` });
        }

        const task = await Task.create({
            title, description,
            category: category || 'General',
            subcategory: subcategory || '',
            complexity_level: 'Low',
            estimated_time_hours: resolvedHours,
            estimatedHours: resolvedHours,
            price: finalPrice,
            aiSuggestedPrice, deterministicPrice,
            mlPrediction: mlPredictionVal,
            finalPrice, isPriceEdited, demandScore,
            inflationFactor: inflationFactorVal,
            posted_by: userId,
            assigned_to: null,
            status: 'open',
            digital_or_physical: digital_or_physical || 'digital',
            postedByRole: poster.role || 'student',
            collegeDomain: poster.role === 'student' ? poster.college_domain : null,
        });

        await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: -finalPrice } });
        await Transaction.create({ task_id: task._id, payer_id: userId, receiver_id: null, amount: finalPrice, status: 'escrow' });

        console.log(`[TASK CREATED] id=${task._id} final=${finalPrice}`);
        res.status(201).json({ task, aiSuggestedPrice, deterministicPrice, mlPrediction: mlPredictionVal, finalPrice, price: finalPrice, isPriceEdited, assigned_to: null });
    } catch (err) {
        console.error('Task creation error:', err);
        res.status(500).json({ error: 'Server error during task creation' });
    }
});

/* ─── POST /api/tasks/:id/accept ──────────────────────────────────────────── */

router.post('/:id/accept', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Global clients cannot accept tasks
        if (req.user.role === 'global_client') {
            return res.status(403).json({ error: 'Professional accounts cannot accept tasks. Only students can work on tasks.' });
        }
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (task.status !== 'open') return res.status(400).json({ error: 'Task is no longer available' });
        if (String(task.posted_by) === String(userId)) return res.status(403).json({ error: 'You cannot accept your own task' });

        const acceptee = await User.findById(userId);
        if (!acceptee) return res.status(404).json({ error: 'User not found' });
        if (acceptee.weekly_hours_completed >= 6) return res.status(403).json({ error: 'Weekly hours cap reached (6h).' });

        task.assigned_to = userId;
        task.status = 'assigned';
        await task.save();

        await Transaction.findOneAndUpdate({ task_id: task._id, status: 'escrow' }, { receiver_id: userId });

        // ── Inquiry → Active lifecycle ──────────────────────────────────────
        // Find or create the accepting worker's inquiry chat and set to active
        await Chat.findOneAndUpdate(
            { taskId: task._id, participantId: userId },
            {
                taskId: task._id,
                clientId: task.posted_by,
                participantId: userId,
                status: 'active',
            },
            { upsert: true, new: true }
        );

        // Close all other inquiry chats for this task
        await Chat.updateMany(
            { taskId: task._id, participantId: { $ne: userId }, status: 'inquiry' },
            { status: 'closed' }
        );

        // Emit chat_closed to the task room for closed participants
        const io = getIo(req);
        const closedChats = await Chat.find({ taskId: task._id, status: 'closed' });
        for (const closedChat of closedChats) {
            io.to(`chat_${closedChat._id}`).emit('chat_closed', {
                chatId: closedChat._id,
                message: 'Another worker has been assigned to this task. This inquiry is now closed.',
            });
        }

        await createAndEmitNotification(io, {
            userId: task.posted_by,
            type: 'task_accepted',
            message: `${acceptee.name} accepted your task "${task.title}".`,
            relatedTaskId: task._id,
        });

        const populated = await Task.findById(task._id).populate('posted_by', 'name').populate('assigned_to', 'name');
        res.json({ message: 'Task accepted successfully', task: populated });
    } catch (err) {
        console.error('Accept task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── POST /api/tasks/:id/complete — Worker marks done (awaiting_approval) ── */

router.post('/:id/complete', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (!['assigned', 'in_progress'].includes(task.status)) return res.status(400).json({ error: 'Task must be assigned or in_progress to mark complete' });
        if (String(task.assigned_to) !== String(userId)) return res.status(403).json({ error: 'Only the assigned worker can mark complete' });

        task.status = 'awaiting_approval';
        await task.save();

        // DO NOT release escrow — awaiting client approval

        const worker = await User.findById(userId).select('name');
        const io = getIo(req);
        await createAndEmitNotification(io, {
            userId: task.posted_by,
            type: 'task_completed',
            message: `${worker.name} marked your task "${task.title}" as completed. Please review and approve.`,
            relatedTaskId: task._id,
        });

        res.json({ message: 'Task marked as awaiting approval. Client will be notified.', task });
    } catch (err) {
        console.error('Complete task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── POST /api/tasks/:id/approve — Client approves + releases escrow ──────── */

router.post('/:id/approve', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (String(task.posted_by) !== String(userId)) return res.status(403).json({ error: 'Only the client can approve this task' });
        if (task.status !== 'awaiting_approval') return res.status(400).json({ error: 'Task is not awaiting approval' });

        task.status = 'completed';
        await task.save();

        // Release escrow → pay worker
        const payoutAmount = task.finalPrice || task.price;
        await Transaction.findOneAndUpdate({ task_id: task._id, status: 'escrow' }, { status: 'released' });
        await User.findByIdAndUpdate(task.assigned_to, { $inc: { wallet_balance: payoutAmount } });

        // Update worker reputation
        const assignee = await User.findById(task.assigned_to);
        const newReliability = (assignee.reliability_score || 0) + 2;
        const newWeeklyHours = (assignee.weekly_hours_completed || 0) + (task.estimatedHours || task.estimated_time_hours || 1);
        const newTier = calculateTier(newReliability);
        const weeklyCapRespected = newWeeklyHours <= 6;

        await User.findByIdAndUpdate(task.assigned_to, {
            reliability_score: newReliability,
            weekly_hours_completed: newWeeklyHours,
            skill_tier: newTier,
        });

        const completedCount = await Task.countDocuments({ assigned_to: task.assigned_to, status: 'completed' });
        await awardBadges(task.assigned_to, completedCount, weeklyCapRespected);

        const io = getIo(req);
        await createAndEmitNotification(io, {
            userId: task.assigned_to,
            type: 'task_approved',
            message: `Your work on "${task.title}" has been approved! ₹${payoutAmount} credited to your wallet.`,
            relatedTaskId: task._id,
        });

        const updatedAssignee = await User.findById(task.assigned_to).select('-password_hash');
        res.json({ message: 'Task approved and payment released.', task, payout: payoutAmount, worker: updatedAssignee });
    } catch (err) {
        console.error('Approve task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── POST /api/tasks/:id/dispute ─────────────────────────────────────────── */

router.post('/:id/dispute', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const isClient = String(task.posted_by) === String(userId);
        const isWorker = String(task.assigned_to) === String(userId);
        if (!isClient && !isWorker) return res.status(403).json({ error: 'Only task participants can raise a dispute' });

        const allowedStatuses = ['assigned', 'in_progress', 'awaiting_approval'];
        if (!allowedStatuses.includes(task.status)) {
            return res.status(400).json({ error: `Cannot dispute a task with status "${task.status}"` });
        }

        task.status = 'disputed';
        await task.save();

        // Escrow is frozen — do NOT release or refund

        const raiser = await User.findById(userId).select('name');
        const otherUserId = isClient ? task.assigned_to : task.posted_by;
        const io = getIo(req);

        await createAndEmitNotification(io, {
            userId: otherUserId,
            type: 'dispute_raised',
            message: `${raiser.name} raised a dispute on task "${task.title}". The task is frozen pending admin review.`,
            relatedTaskId: task._id,
        });

        res.json({ message: 'Dispute raised. Task is frozen pending admin review.', task });
    } catch (err) {
        console.error('Dispute task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── PATCH /api/tasks/:id/increase-price — Client increases price post-assign */

router.patch('/:id/increase-price', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { newPrice } = req.body;

        if (newPrice === undefined) return res.status(400).json({ error: 'newPrice is required' });
        const parsedNew = Math.round(Number(newPrice));
        if (isNaN(parsedNew) || parsedNew <= 0) return res.status(400).json({ error: 'Invalid price' });

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (String(task.posted_by) !== String(userId)) return res.status(403).json({ error: 'Only the client can increase price' });

        const allowedStatuses = ['assigned', 'in_progress', 'awaiting_approval'];
        if (!allowedStatuses.includes(task.status)) {
            return res.status(400).json({ error: `Cannot increase price when task status is "${task.status}"` });
        }

        const currentPrice = task.finalPrice || task.price;
        if (parsedNew <= currentPrice) {
            return res.status(400).json({ error: `New price (₹${parsedNew}) must be greater than current price (₹${currentPrice})` });
        }

        const difference = parsedNew - currentPrice;
        const poster = await User.findById(userId);
        if (poster.wallet_balance < difference) {
            return res.status(400).json({ error: `Insufficient wallet balance. Need ₹${difference} more, have ₹${poster.wallet_balance}` });
        }

        // Deduct difference from client wallet, add to escrow
        await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: -difference } });
        await Transaction.findOneAndUpdate({ task_id: task._id, status: 'escrow' }, { amount: parsedNew });

        task.finalPrice = parsedNew;
        task.price = parsedNew;
        task.isPriceEdited = true;
        await task.save();

        const worker = task.assigned_to;
        const io = getIo(req);
        await createAndEmitNotification(io, {
            userId: worker,
            type: 'price_increased',
            message: `The client increased the price for "${task.title}" from ₹${currentPrice} to ₹${parsedNew}. Extra ₹${difference} added to escrow.`,
            relatedTaskId: task._id,
        });

        res.json({ message: 'Price increased successfully', task, previousPrice: currentPrice, newPrice: parsedNew, difference });
    } catch (err) {
        console.error('Increase price error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── POST /api/tasks/:id/cancel — Client cancels open task + refunds escrow ─ */

router.post('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (String(task.posted_by) !== String(userId)) {
            return res.status(403).json({ error: 'Only the client can cancel this task' });
        }
        if (task.status !== 'open') {
            return res.status(400).json({ error: `Cannot cancel a task with status "${task.status}". Only open tasks can be cancelled.` });
        }

        const refundAmount = task.finalPrice || task.price || 0;

        // Check for active escrow (prevent double refund)
        const escrowTx = await Transaction.findOne({ task_id: task._id, status: 'escrow' });
        if (escrowTx) {
            await Transaction.findByIdAndUpdate(escrowTx._id, { status: 'refunded' });
            if (refundAmount > 0) {
                await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: refundAmount } });
            }
        }

        task.status = 'cancelled';
        await task.save();

        const io = getIo(req);
        await createAndEmitNotification(io, {
            userId: task.posted_by,
            type: 'general',
            message: `Your task "${task.title}" has been cancelled. ₹${refundAmount} has been refunded to your wallet.`,
            relatedTaskId: task._id,
        });

        res.json({ message: 'Task cancelled and escrow refunded.', task, refundAmount });
    } catch (err) {
        console.error('Cancel task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── PATCH /api/tasks/:id/update-price — Pre-assignment price edit ────────── */

router.patch('/:id/update-price', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { price: newPrice } = req.body;

        if (newPrice === undefined) return res.status(400).json({ error: 'price is required' });
        const parsedPrice = Math.round(Number(newPrice));
        if (isNaN(parsedPrice) || parsedPrice <= 0) return res.status(400).json({ error: 'price must be a positive number' });

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (String(task.posted_by) !== String(userId)) return res.status(403).json({ error: 'Only the task poster can update the price' });
        if (task.status !== 'open') return res.status(400).json({ error: 'Price can only be updated while the task is open' });
        if (task.assigned_to) return res.status(400).json({ error: 'Price is locked — task has already been assigned' });

        const oldPrice = task.finalPrice || task.price;
        const delta = parsedPrice - oldPrice;

        const poster = await User.findById(userId);
        if (delta > 0 && poster.wallet_balance < delta) {
            return res.status(400).json({ error: `Insufficient wallet balance. Need ₹${delta} more, have ₹${poster.wallet_balance}` });
        }

        if (delta > 0) await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: -delta } });
        else if (delta < 0) await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: Math.abs(delta) } });

        await Transaction.findOneAndUpdate({ task_id: task._id, status: 'escrow' }, { amount: parsedPrice });
        task.finalPrice = parsedPrice;
        task.price = parsedPrice;
        task.isPriceEdited = true;
        await task.save();

        const populated = await Task.findById(task._id).populate('posted_by', 'name').populate('assigned_to', 'name');
        res.json({ message: 'Price updated successfully', task: populated, finalPrice: parsedPrice, delta });
    } catch (err) {
        console.error('Update price error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── POST /api/tasks/:id/cancel ─────────────────────────────────────────── */

router.post('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (task.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed task' });
        if (String(task.posted_by) !== String(userId)) return res.status(403).json({ error: 'Only the poster can cancel this task' });

        task.status = 'cancelled';
        await task.save();

        const refundAmount = task.finalPrice || task.price;
        await Transaction.findOneAndUpdate({ task_id: task._id, status: 'escrow' }, { status: 'refunded' });
        await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: refundAmount } });

        if (task.assigned_to) {
            const assignee = await User.findById(task.assigned_to);
            if (assignee) {
                const newReliability = assignee.reliability_score - 3;
                const newTier = calculateTier(newReliability);
                await User.findByIdAndUpdate(task.assigned_to, { reliability_score: newReliability, skill_tier: newTier });
            }
        }

        res.json({ message: 'Task cancelled and funds refunded', task });
    } catch (err) {
        console.error('Cancel task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── GET /api/tasks/:id/chat — Fetch chat history ───────────────────────── */

router.get('/:id/chat', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const isParticipant = String(task.posted_by) === String(userId) || String(task.assigned_to) === String(userId);
        if (!isParticipant) return res.status(403).json({ error: 'Not a participant of this task' });

        const chat = await Chat.findOne({ taskId: req.params.id });
        res.json(chat || { taskId: req.params.id, messages: [] });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
