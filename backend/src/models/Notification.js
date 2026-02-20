const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['task_accepted', 'task_completed', 'task_approved', 'dispute_raised',
            'price_increased', 'new_message', 'general'],
        default: 'general',
    },
    message: { type: String, required: true },
    relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
