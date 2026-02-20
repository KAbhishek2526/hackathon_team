const Task = require('../models/Task');
const Config = require('../models/Config');
const { CATEGORIES, getCategoryConfig, getSubcategoryConfig } = require('../config/categories');

// Tier multipliers
const TIER_MULTIPLIER = { 1: 1.0, 2: 1.15, 3: 1.3 };

/**
 * Get inflation factor from DB (defaults to 1.00).
 */
async function getInflationFactor() {
    try {
        const cfg = await Config.findOne({ key: 'inflationFactor' });
        return cfg ? Number(cfg.value) : 1.0;
    } catch {
        return 1.0;
    }
}

/**
 * Compute demand multiplier by querying live task counts per category.
 */
async function getDemandMultiplier(category) {
    try {
        const [categoryCount, totalCount] = await Promise.all([
            Task.countDocuments({ status: 'open', category }),
            Task.countDocuments({ status: 'open' }),
        ]);

        if (totalCount === 0) return 1.0;
        const ratio = categoryCount / totalCount;

        if (ratio > 0.7) return 1.1;
        if (ratio >= 0.4) return 1.0;
        return 0.9;
    } catch {
        return 1.0;
    }
}

/**
 * Calculate deterministic price using the formula:
 *   baseRate × subcategoryMultiplier × tierMultiplier × demandMultiplier × inflationFactor × hours
 */
async function calculateDeterministicPrice({ category, subcategory, hours, tier }) {
    const catConfig = getCategoryConfig(category);
    const subConfig = getSubcategoryConfig(category, subcategory);

    if (!catConfig || !subConfig) {
        throw new Error(`Invalid category/subcategory: ${category}/${subcategory}`);
    }

    const baseRate = catConfig.baseRate;
    const subcategoryMultiplier = subConfig.multiplier;
    const tierMultiplier = TIER_MULTIPLIER[tier] || 1.0;
    const demandMultiplier = await getDemandMultiplier(category);
    const inflationFactor = await getInflationFactor();

    const deterministicPrice = Math.round(
        baseRate * subcategoryMultiplier * tierMultiplier * demandMultiplier * inflationFactor * hours
    );

    return { deterministicPrice, demandMultiplier, inflationFactor };
}

/**
 * Hybrid blending: 60% deterministic + 40% ML prediction.
 * Falls back to 100% deterministic if ml is null.
 */
function combinePrice(deterministicPrice, mlPrediction) {
    if (mlPrediction === null || mlPrediction === undefined || isNaN(mlPrediction)) {
        return Math.round(deterministicPrice);
    }
    return Math.round(0.6 * deterministicPrice + 0.4 * mlPrediction);
}

module.exports = { calculateDeterministicPrice, combinePrice, getInflationFactor, getDemandMultiplier, TIER_MULTIPLIER };
