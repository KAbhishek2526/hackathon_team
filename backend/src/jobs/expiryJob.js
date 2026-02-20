/**
 * Escrow Expiry Cron Job
 * Runs every 15 minutes.
 * Finds open tasks past their expiresAt time, refunds escrow to client, marks 'expired'.
 */

const Task = require('../models/Task');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

async function runExpiryJob() {
    try {
        const now = new Date();

        // Find open tasks whose expiresAt has passed
        const expiredTasks = await Task.find({
            status: 'open',
            expiresAt: { $lte: now },
        }).select('_id title posted_by finalPrice price');

        if (expiredTasks.length === 0) return;

        console.log(`[EXPIRY JOB] Processing ${expiredTasks.length} expired task(s)`);

        for (const task of expiredTasks) {
            try {
                const refundAmount = task.finalPrice || task.price || 0;

                // Only refund if there's an active escrow transaction (prevent double refund)
                const escrowTx = await Transaction.findOne({ task_id: task._id, status: 'escrow' });
                if (!escrowTx) {
                    // Already processed — just update status
                    await Task.findByIdAndUpdate(task._id, { status: 'expired' });
                    continue;
                }

                // Mark transaction as refunded
                await Transaction.findByIdAndUpdate(escrowTx._id, { status: 'refunded' });

                // Refund client wallet
                if (refundAmount > 0) {
                    await User.findByIdAndUpdate(task.posted_by, { $inc: { wallet_balance: refundAmount } });
                }

                // Mark task expired
                await Task.findByIdAndUpdate(task._id, { status: 'expired' });

                // Notify client
                await Notification.create({
                    userId: task.posted_by,
                    type: 'task_expired',
                    message: `Your task "${task.title}" expired without being accepted. ₹${refundAmount} has been refunded to your wallet.`,
                    relatedTaskId: task._id,
                    isRead: false,
                });

                console.log(`[EXPIRY JOB] Task ${task._id} expired — ₹${refundAmount} refunded to client ${task.posted_by}`);
            } catch (err) {
                console.error(`[EXPIRY JOB] Error processing task ${task._id}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[EXPIRY JOB] Fatal error:', err.message);
    }
}

function startExpiryJob() {
    // Run immediately on startup
    runExpiryJob();
    // Then every 15 minutes
    setInterval(runExpiryJob, 15 * 60 * 1000);
    console.log('[EXPIRY JOB] Escrow expiry job started (runs every 15 min)');
}

module.exports = { startExpiryJob, runExpiryJob };
