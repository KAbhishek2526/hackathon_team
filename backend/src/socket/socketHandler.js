const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const Task = require('../models/Task');

/**
 * Persist a notification and emit to the user's personal room.
 */
async function createAndEmitNotification(io, { userId, type, message, relatedTaskId }) {
    const notification = await Notification.create({ userId, type, message, relatedTaskId, isRead: false });
    io.to(`user_${userId}`).emit('new_notification', notification);
    return notification;
}

/**
 * Register all Socket.IO event handlers.
 */
function registerSocketHandlers(io) {
    // ── JWT auth middleware for every socket connection ─────────────────────
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
        // Every user gets a personal notification room
        socket.join(`user_${userId}`);
        console.log(`[SOCKET] User ${userId} connected → room user_${userId}`);

        // ── join_chat(chatId) ────────────────────────────────────────────────
        // Joins a specific chat room identified by chatId.
        // Works for inquiry, active, and task-detail chats.
        socket.on('join_chat', async ({ chatId }) => {
            try {
                const chat = await Chat.findById(chatId);
                if (!chat) return socket.emit('error', { message: 'Chat not found' });

                const isParticipant =
                    String(chat.clientId) === String(userId) ||
                    String(chat.participantId) === String(userId);

                if (!isParticipant) return socket.emit('error', { message: 'Not a participant of this chat' });

                if (chat.status === 'closed') {
                    return socket.emit('chat_closed', { chatId, message: 'This inquiry has been closed after another worker accepted the task.' });
                }

                socket.join(`chat_${chatId}`);
                console.log(`[SOCKET] User ${userId} joined chat_${chatId} (status: ${chat.status})`);
                socket.emit('joined_chat', { chatId, status: chat.status });
            } catch (err) {
                console.error('[SOCKET] join_chat error:', err);
                socket.emit('error', { message: 'Failed to join chat' });
            }
        });

        // ── send_message({chatId, message}) ─────────────────────────────────
        socket.on('send_message', async ({ chatId, message }) => {
            try {
                if (!message || !message.trim()) return;

                const chat = await Chat.findById(chatId);
                if (!chat) return socket.emit('error', { message: 'Chat not found' });

                const isParticipant =
                    String(chat.clientId) === String(userId) ||
                    String(chat.participantId) === String(userId);

                if (!isParticipant) return socket.emit('error', { message: 'Not a participant' });

                if (chat.status === 'closed') {
                    return socket.emit('error', { message: 'Cannot send messages to a closed chat' });
                }

                const msgDoc = { senderId: userId, message: message.trim(), timestamp: new Date() };

                // Push message and get updated document
                const updated = await Chat.findByIdAndUpdate(
                    chatId,
                    { $push: { messages: msgDoc } },
                    { new: true }
                );
                const savedMsg = updated.messages[updated.messages.length - 1];

                // Broadcast to everyone in the chat room
                io.to(`chat_${chatId}`).emit('receive_message', {
                    chatId,
                    senderId: userId,
                    message: savedMsg.message,
                    timestamp: savedMsg.timestamp,
                    _id: savedMsg._id,
                });

                // Notify the other participant
                const otherUserId = String(chat.clientId) === String(userId)
                    ? chat.participantId
                    : chat.clientId;

                if (otherUserId) {
                    await createAndEmitNotification(io, {
                        userId: otherUserId,
                        type: 'new_message',
                        message: 'You have a new chat message.',
                        relatedTaskId: chat.taskId,
                    });
                }
            } catch (err) {
                console.error('[SOCKET] send_message error:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // ── Backward-compat: join_task_chat(taskId) ──────────────────────────
        // Finds the active chat for this task and joins its room.
        socket.on('join_task_chat', async ({ taskId }) => {
            try {
                const task = await Task.findById(taskId);
                if (!task) return socket.emit('error', { message: 'Task not found' });

                // Build query: client sees any active chat, worker sees their own
                const isClient = String(task.posted_by) === String(userId);
                let chat;
                if (isClient) {
                    chat = await Chat.findOne({ taskId, status: 'active' });
                } else {
                    chat = await Chat.findOne({ taskId, participantId: userId });
                }

                if (!chat) return socket.emit('error', { message: 'No active chat found for this task' });
                if (chat.status === 'closed') return socket.emit('chat_closed', { chatId: chat._id });

                socket.join(`chat_${chat._id}`);
                socket.emit('joined_chat', { chatId: chat._id, status: chat.status });
            } catch (err) {
                console.error('[SOCKET] join_task_chat error:', err);
                socket.emit('error', { message: 'Failed to join task chat' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[SOCKET] User ${userId} disconnected`);
        });
    });
}

module.exports = { registerSocketHandlers, createAndEmitNotification };
