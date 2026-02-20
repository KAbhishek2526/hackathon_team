const express = require('express');
const authMiddleware = require('../middleware/auth');
const { calculateDeterministicPrice, combinePrice, getDemandMultiplier, getInflationFactor } = require('../services/pricingEngine');
const { getMlPrediction } = require('../services/mlService');
const { getCategoryConfig, getSubcategoryConfig, validateCategoryCombo } = require('../config/categories');

const router = express.Router();

/**
 * POST /api/pricing/suggest
 * Returns: { aiSuggestedPrice, deterministicPrice, mlPrediction }
 */
router.post('/suggest', authMiddleware, async (req, res) => {
    try {
        const { category, subcategory, hours, tier } = req.body;

        if (!category || !subcategory || !hours) {
            return res.status(400).json({ error: 'category, subcategory, and hours are required' });
        }

        const validation = validateCategoryCombo(category, subcategory);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const parsedHours = Number(hours);
        const parsedTier = Number(tier) || 1;

        if (isNaN(parsedHours) || parsedHours <= 0) {
            return res.status(400).json({ error: 'hours must be a positive number' });
        }

        // Step 1: Deterministic price
        const { deterministicPrice, demandMultiplier, inflationFactor } = await calculateDeterministicPrice({
            category,
            subcategory,
            hours: parsedHours,
            tier: parsedTier,
        });

        // Step 2: ML prediction
        const catConfig = getCategoryConfig(category);
        const subConfig = getSubcategoryConfig(category, subcategory);

        const mlPrediction = await getMlPrediction({
            categoryId: catConfig.id,
            subcategoryId: subConfig.id,
            hours: parsedHours,
            tier: parsedTier,
            demandScore: demandMultiplier,
            inflationFactor,
            deterministicPrice,
        });

        // Step 3: Hybrid blend
        const aiSuggestedPrice = combinePrice(deterministicPrice, mlPrediction);

        console.log(`[PRICING] ${category}/${subcategory} ${parsedHours}h tier=${parsedTier} | det=${deterministicPrice} ml=${mlPrediction} final=${aiSuggestedPrice}`);

        res.json({
            aiSuggestedPrice,
            deterministicPrice,
            mlPrediction,
            demandScore: demandMultiplier,
            inflationFactor,
        });
    } catch (err) {
        console.error('Pricing suggest error:', err);
        res.status(500).json({ error: 'Server error during price suggestion' });
    }
});

module.exports = router;
