const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const Task = require('../models/Task');

/**
 * Create a notification in DB and emit it on the user's socket room.
 */
async function createAndEmitNotification(io, { userId, type, message, relatedTaskId }) {
    const notification = await Notification.create({ userId, type, message, relatedTaskId, isRead: false });
    io.to(`user_${userId}`).emit('new_notification', notification);
    return notification;
}

/**
 * Register all socket event handlers.
 */
function registerSocketHandlers(io) {
    // JWT auth middleware for sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        // Each user joins their personal room for notifications
        socket.join(`user_${userId}`);
        console.log(`[SOCKET] User ${userId} connected, joined room user_${userId}`);

        // join_task_chat — user joins the chat room for a specific task
        socket.on('join_task_chat', async ({ taskId }) => {
            try {
                const task = await Task.findById(taskId);
                if (!task) return socket.emit('error', { message: 'Task not found' });

                const isParticipant =
                    String(task.posted_by) === String(userId) ||
                    String(task.assigned_to) === String(userId);

                if (!isParticipant) return socket.emit('error', { message: 'Not a participant of this task' });

                socket.join(`task_${taskId}`);
                console.log(`[SOCKET] User ${userId} joined chat room task_${taskId}`);

                // Ensure chat document exists
                const existingChat = await Chat.findOne({ taskId });
                if (!existingChat) {
                    await Chat.create({
                        taskId,
                        participants: [task.posted_by, task.assigned_to].filter(Boolean),
                        messages: [],
                    });
                }

                socket.emit('joined_chat', { taskId });
            } catch (err) {
                console.error('[SOCKET] join_task_chat error:', err);
                socket.emit('error', { message: 'Failed to join chat' });
            }
        });

        // send_message — persist + broadcast + notify other participant
        socket.on('send_message', async ({ taskId, message }) => {
            try {
                if (!message || !message.trim()) return;

                const task = await Task.findById(taskId);
                if (!task) return socket.emit('error', { message: 'Task not found' });

                const isParticipant =
                    String(task.posted_by) === String(userId) ||
                    String(task.assigned_to) === String(userId);

                if (!isParticipant) return socket.emit('error', { message: 'Not a participant of this task' });

                const msgDoc = { senderId: userId, message: message.trim(), timestamp: new Date() };

                // Upsert chat document and push message
                const chat = await Chat.findOneAndUpdate(
                    { taskId },
                    {
                        $push: { messages: msgDoc },
                        $setOnInsert: {
                            taskId,
                            participants: [task.posted_by, task.assigned_to].filter(Boolean),
                        },
                    },
                    { upsert: true, new: true }
                );

                const savedMsg = chat.messages[chat.messages.length - 1];

                // Broadcast to all in task room
                io.to(`task_${taskId}`).emit('receive_message', {
                    taskId,
                    senderId: userId,
                    message: savedMsg.message,
                    timestamp: savedMsg.timestamp,
                    _id: savedMsg._id,
                });

                // Notify the other participant
                const otherUserId = String(task.posted_by) === String(userId)
                    ? task.assigned_to
                    : task.posted_by;

                if (otherUserId) {
                    await createAndEmitNotification(io, {
                        userId: otherUserId,
                        type: 'new_message',
                        message: 'New message in your task chat.',
                        relatedTaskId: taskId,
                    });
                }
            } catch (err) {
                console.error('[SOCKET] send_message error:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[SOCKET] User ${userId} disconnected`);
        });
    });
}

module.exports = { registerSocketHandlers, createAndEmitNotification };
