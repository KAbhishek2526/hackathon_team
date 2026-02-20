const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call the Python FastAPI ML microservice to get a price prediction.
 * Returns ml_price (number) or null if the service is unavailable.
 */
async function getMlPrediction({ categoryId, subcategoryId, hours, tier, demandScore, inflationFactor, deterministicPrice }) {
    try {
        const response = await axios.post(
            `${ML_SERVICE_URL}/predict`,
            {
                category_id: categoryId,
                subcategory_id: subcategoryId,
                hours,
                tier,
                demand_score: demandScore,
                inflation_factor: inflationFactor,
                deterministic_price: deterministicPrice,
            },
            { timeout: 3000 }  // 3s timeout — don't block requests if ML is down
        );
        const mlPrice = response.data?.ml_price;
        return typeof mlPrice === 'number' ? Math.round(mlPrice) : null;
    } catch (err) {
        console.warn('[ML SERVICE] Unavailable — falling back to deterministic only:', err.message);
        return null;
    }
}

module.exports = { getMlPrediction };
