const express = require('express');
const Task = require('../models/Task');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { awardBadges, calculateTier } = require('../services/badgeService');
const { calculateDeterministicPrice, combinePrice, getDemandMultiplier, getInflationFactor } = require('../services/pricingEngine');
const { getMlPrediction } = require('../services/mlService');
const { getCategoryConfig, getSubcategoryConfig, validateCategoryCombo } = require('../config/categories');

const router = express.Router();

/**
 * Helper: run full hybrid pricing pipeline.
 * Returns { aiSuggestedPrice, deterministicPrice, mlPrediction, demandScore, inflationFactor }
 */
async function runPricingPipeline({ category, subcategory, hours, tier }) {
    const { deterministicPrice, demandMultiplier, inflationFactor } = await calculateDeterministicPrice({
        category, subcategory, hours: Number(hours), tier: Number(tier) || 1,
    });

    const catConfig = getCategoryConfig(category);
    const subConfig = getSubcategoryConfig(category, subcategory);

    const mlPrediction = await getMlPrediction({
        categoryId: catConfig.id,
        subcategoryId: subConfig.id,
        hours: Number(hours),
        tier: Number(tier) || 1,
        demandScore: demandMultiplier,
        inflationFactor,
        deterministicPrice,
    });

    const aiSuggestedPrice = combinePrice(deterministicPrice, mlPrediction);

    return { aiSuggestedPrice, deterministicPrice, mlPrediction, demandScore: demandMultiplier, inflationFactor };
}

// POST /api/tasks — Create a task with hybrid AI pricing. No price restrictions.
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, digital_or_physical, category, subcategory, estimatedHours, userPrice } = req.body;
        const userId = req.user.id;

        if (!title || !description) {
            return res.status(400).json({ error: 'title and description are required' });
        }

        const poster = await User.findById(userId);
        if (!poster) return res.status(404).json({ error: 'User not found' });

        // --- Pricing ---
        let aiSuggestedPrice = 0;
        let deterministicPrice = 0;
        let mlPredictionVal = null;
        let demandScore = 1.0;
        let inflationFactorVal = 1.0;
        let resolvedCategory = category || 'General';
        let resolvedSubcategory = subcategory || '';
        let resolvedHours = Number(estimatedHours) || 1;
        let complexity_level = 'Low';

        // Use hybrid pricing if category/subcategory provided and valid
        const hasValidCategory = category && subcategory && validateCategoryCombo(category, subcategory).valid;
        if (hasValidCategory) {
            const pricing = await runPricingPipeline({
                category,
                subcategory,
                hours: resolvedHours,
                tier: poster.skill_tier || 1,
            });
            aiSuggestedPrice = pricing.aiSuggestedPrice;
            deterministicPrice = pricing.deterministicPrice;
            mlPredictionVal = pricing.mlPrediction;
            demandScore = pricing.demandScore;
            inflationFactorVal = pricing.inflationFactor;
        } else {
            // Fallback: simple formula for backward compat / old clients
            aiSuggestedPrice = Math.round(resolvedHours * 200);
            deterministicPrice = aiSuggestedPrice;
        }

        // finalPrice: user's chosen price — no restriction, purely advisory
        const finalPrice = (userPrice !== undefined && userPrice !== null)
            ? Math.round(Number(userPrice))
            : aiSuggestedPrice;

        const isPriceEdited = finalPrice !== aiSuggestedPrice;

        // Check wallet balance
        if (poster.wallet_balance < finalPrice) {
            return res.status(400).json({
                error: `Insufficient wallet balance. Need ₹${finalPrice}, have ₹${poster.wallet_balance}`,
            });
        }

        // Create task
        const task = await Task.create({
            title,
            description,
            category: resolvedCategory,
            subcategory: resolvedSubcategory,
            complexity_level,
            estimated_time_hours: resolvedHours,
            estimatedHours: resolvedHours,
            price: finalPrice,
            aiSuggestedPrice,
            deterministicPrice,
            mlPrediction: mlPredictionVal,
            finalPrice,
            isPriceEdited,
            demandScore,
            inflationFactor: inflationFactorVal,
            posted_by: userId,
            assigned_to: null,
            status: 'open',
            digital_or_physical: digital_or_physical || 'digital',
        });

        // Deduct from poster wallet & hold in escrow
        await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: -finalPrice } });
        await Transaction.create({
            task_id: task._id,
            payer_id: userId,
            receiver_id: null,
            amount: finalPrice,
            status: 'escrow',
        });

        console.log(`[TASK CREATED] id=${task._id} by=${userId} det=${deterministicPrice} ml=${mlPredictionVal} ai=${aiSuggestedPrice} final=${finalPrice}`);

        res.status(201).json({
            task,
            aiSuggestedPrice,
            deterministicPrice,
            mlPrediction: mlPredictionVal,
            finalPrice,
            price: finalPrice,
            isPriceEdited,
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
        const tasks = await Task.find({
            status: 'open',
            posted_by: { $ne: userId },
        })
            .populate('posted_by', 'name college_domain')
            .sort({ created_at: -1 });

        res.json(tasks);
    } catch (err) {
        console.error('Available tasks error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/tasks/my — Tasks posted by or assigned to current user
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

// PATCH /api/tasks/:id/update-price — Update price (open + unassigned only, no restriction)
router.patch('/:id/update-price', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { price: newPrice } = req.body;

        if (newPrice === undefined || newPrice === null) {
            return res.status(400).json({ error: 'price is required' });
        }

        const parsedPrice = Math.round(Number(newPrice));
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ error: 'price must be a positive number' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        if (String(task.posted_by) !== String(userId)) {
            return res.status(403).json({ error: 'Only the task poster can update the price' });
        }
        if (task.status !== 'open') {
            return res.status(400).json({ error: 'Price can only be updated while the task is open' });
        }
        if (task.assigned_to) {
            return res.status(400).json({ error: 'Price is locked — task has already been assigned' });
        }

        // No range restriction — adjust escrow delta
        const oldPrice = task.finalPrice || task.price;
        const delta = parsedPrice - oldPrice;

        const poster = await User.findById(userId);
        if (!poster) return res.status(404).json({ error: 'User not found' });

        if (delta > 0 && poster.wallet_balance < delta) {
            return res.status(400).json({
                error: `Insufficient wallet balance to increase price. Need ₹${delta} more, have ₹${poster.wallet_balance}`,
            });
        }

        if (delta > 0) {
            await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: -delta } });
        } else if (delta < 0) {
            await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: Math.abs(delta) } });
        }

        await Transaction.findOneAndUpdate(
            { task_id: task._id, status: 'escrow' },
            { amount: parsedPrice }
        );

        task.finalPrice = parsedPrice;
        task.price = parsedPrice;
        task.isPriceEdited = true;
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('posted_by', 'name')
            .populate('assigned_to', 'name');

        console.log(`[PRICE UPDATED] id=${task._id} old=${oldPrice} new=${parsedPrice} delta=${delta}`);
        res.json({ message: 'Price updated successfully', task: populated, finalPrice: parsedPrice, delta });
    } catch (err) {
        console.error('Update price error:', err);
        res.status(500).json({ error: 'Server error during price update' });
    }
});

// POST /api/tasks/:id/accept — Accept an open task
router.post('/:id/accept', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (task.status !== 'open') return res.status(400).json({ error: 'Task is no longer available' });
        if (String(task.posted_by) === String(userId)) {
            return res.status(403).json({ error: 'You cannot accept your own task' });
        }

        const acceptee = await User.findById(userId);
        if (!acceptee) return res.status(404).json({ error: 'User not found' });
        if (acceptee.weekly_hours_completed >= 6) {
            return res.status(403).json({ error: 'Weekly hours cap reached (6h). Cannot accept new tasks.' });
        }

        task.assigned_to = userId;
        task.status = 'assigned';
        await task.save();

        await Transaction.findOneAndUpdate(
            { task_id: task._id, status: 'escrow' },
            { receiver_id: userId }
        );

        const populated = await Task.findById(task._id)
            .populate('posted_by', 'name')
            .populate('assigned_to', 'name');

        console.log(`[TASK ACCEPTED] id=${task._id} by=${userId}`);
        res.json({ message: 'Task accepted successfully', task: populated });
    } catch (err) {
        console.error('Accept task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/tasks/:id/complete — Mark task complete
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

        const payoutAmount = task.finalPrice || task.price;
        await Transaction.findOneAndUpdate({ task_id: task._id, status: 'escrow' }, { status: 'released' });
        await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: payoutAmount } });

        const assignee = await User.findById(userId);
        const newReliability = assignee.reliability_score + 2;
        const newWeeklyHours = assignee.weekly_hours_completed + (task.estimatedHours || task.estimated_time_hours || 1);
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

        const refundAmount = task.finalPrice || task.price;
        await Transaction.findOneAndUpdate({ task_id: task._id, status: 'escrow' }, { status: 'refunded' });
        await User.findByIdAndUpdate(userId, { $inc: { wallet_balance: refundAmount } });

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
