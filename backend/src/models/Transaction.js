const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    payer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['escrow', 'released', 'refunded'], default: 'escrow' },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
