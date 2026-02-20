const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema(
    {
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, unique: true },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        messages: [messageSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
