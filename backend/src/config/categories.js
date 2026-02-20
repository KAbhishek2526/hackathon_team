/**
 * Category & Subcategory master config.
 * Numeric IDs are used as ML model features.
 */

const CATEGORIES = {
    Design: {
        id: 0,
        baseRate: 250,
        subcategories: {
            Poster: { id: 0, multiplier: 1.0 },
            Meme: { id: 1, multiplier: 0.8 },
            Reel: { id: 2, multiplier: 1.3 },
            Logo: { id: 3, multiplier: 1.2 },
            Banner: { id: 4, multiplier: 1.1 },
        },
    },
    Coding: {
        id: 1,
        baseRate: 400,
        subcategories: {
            Debugging: { id: 0, multiplier: 1.4 },
            Frontend: { id: 1, multiplier: 1.2 },
            Backend: { id: 2, multiplier: 1.3 },
            Assignment: { id: 3, multiplier: 1.1 },
            DSA: { id: 4, multiplier: 1.5 },
        },
    },
    Writing: {
        id: 2,
        baseRate: 200,
        subcategories: {
            Notes: { id: 0, multiplier: 1.0 },
            Assignment: { id: 1, multiplier: 1.1 },
            Resume: { id: 2, multiplier: 1.3 },
            Report: { id: 3, multiplier: 1.2 },
        },
    },
    Editing: {
        id: 3,
        baseRate: 220,
        subcategories: {
            Video: { id: 0, multiplier: 1.4 },
            Photo: { id: 1, multiplier: 1.0 },
            Audio: { id: 2, multiplier: 1.2 },
        },
    },
    Delivery: {
        id: 4,
        baseRate: 150,
        subcategories: {
            Campus: { id: 0, multiplier: 1.0 },
            Nearby: { id: 1, multiplier: 1.2 },
            Errand: { id: 2, multiplier: 1.1 },
        },
    },
    Marketing: {
        id: 5,
        baseRate: 300,
        subcategories: {
            SocialMedia: { id: 0, multiplier: 1.2 },
            Campaign: { id: 1, multiplier: 1.4 },
            Analytics: { id: 2, multiplier: 1.3 },
        },
    },
    Tutoring: {
        id: 6,
        baseRate: 350,
        subcategories: {
            Math: { id: 0, multiplier: 1.0 },
            Programming: { id: 1, multiplier: 1.3 },
            Physics: { id: 2, multiplier: 1.2 },
            ExamPrep: { id: 3, multiplier: 1.4 },
        },
    },
};

/**
 * Returns category config or null if invalid.
 */
function getCategoryConfig(category) {
    return CATEGORIES[category] || null;
}

/**
 * Returns subcategory config or null if invalid.
 */
function getSubcategoryConfig(category, subcategory) {
    const cat = CATEGORIES[category];
    if (!cat) return null;
    return cat.subcategories[subcategory] || null;
}

/**
 * Validate category + subcategory combo.
 */
function validateCategoryCombo(category, subcategory) {
    const cat = getCategoryConfig(category);
    if (!cat) return { valid: false, error: `Invalid category: ${category}` };
    const sub = getSubcategoryConfig(category, subcategory);
    if (!sub) return { valid: false, error: `Invalid subcategory "${subcategory}" for category "${category}"` };
    return { valid: true };
}

module.exports = { CATEGORIES, getCategoryConfig, getSubcategoryConfig, validateCategoryCombo };
