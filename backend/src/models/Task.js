const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: '' },
    subcategory: { type: String, default: '' },
    complexity_level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    estimated_time_hours: { type: Number, default: 1 },
    estimatedHours: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    aiSuggestedPrice: { type: Number, default: 0 },
    deterministicPrice: { type: Number, default: 0 },
    mlPrediction: { type: Number, default: null },
    finalPrice: { type: Number, default: 0 },
    isPriceEdited: { type: Boolean, default: false },
    demandScore: { type: Number, default: 1.0 },
    inflationFactor: { type: Number, default: 1.0 },
    posted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['open', 'assigned', 'in_progress', 'awaiting_approval', 'completed', 'disputed', 'cancelled', 'expired'], default: 'open' },
    digital_or_physical: { type: String, enum: ['digital', 'physical'], default: 'digital' },
    postedByRole: { type: String, enum: ['student', 'global_client'], default: 'student' },
    collegeDomain: { type: String, default: null },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 72 * 60 * 60 * 1000) }, // 72h from creation
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
