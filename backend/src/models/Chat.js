const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema(
    {
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // task poster
        participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // inquiring / assigned worker
        status: { type: String, enum: ['inquiry', 'active', 'closed'], default: 'inquiry' },
        messages: [messageSchema],
    },
    { timestamps: true }
);

// One inquiry chat per task+participant pair
chatSchema.index({ taskId: 1, participantId: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);
