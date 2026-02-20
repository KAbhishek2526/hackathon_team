const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: '' },
    complexity_level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    estimated_time_hours: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    posted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['open', 'assigned', 'completed', 'cancelled'], default: 'open' },
    digital_or_physical: { type: String, enum: ['digital', 'physical'], required: true },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
