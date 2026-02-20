require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const pricingRoutes = require('./routes/pricing');
const notificationRoutes = require('./routes/notifications');

const Config = require('./models/Config');
const { registerSocketHandlers } = require('./socket/socketHandler');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api', adminRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
});

// Export io so routes can use it for emitting
app.set('io', io);

// Register socket event handlers
registerSocketHandlers(io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/micro_task_db';

mongoose
    .connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Seed default inflationFactor if not already set
        await Config.findOneAndUpdate(
            { key: 'inflationFactor' },
            { key: 'inflationFactor', value: 1.00, updatedAt: new Date() },
            { upsert: true }
        );
        console.log('✅ Inflation factor seeded (default: 1.00)');

        httpServer.listen(PORT, () => {
            console.log(`🚀 Backend running on http://localhost:${PORT}`);
            console.log(`🔌 Socket.IO ready on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
