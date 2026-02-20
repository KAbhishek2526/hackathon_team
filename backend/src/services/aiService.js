/**
 * Mock AI Classifier — fully local, zero external dependencies.
 * Analyzes task title + description using rule-based logic.
 * Returns: { category, complexity_level, estimated_time_hours }
 */

console.log('AI running in MOCK mode');

// Keyword banks per category
const CATEGORY_RULES = [
    {
        category: 'Design',
        keywords: ['design', 'logo', 'poster', 'graphic', 'banner', 'ui', 'ux',
            'figma', 'canva', 'illustrate', 'creative', 'visual', 'icon',
            'branding', 'colour', 'color', 'layout', 'mockup', 'wireframe', 'flyer'],
    },
    {
        category: 'Development',
        keywords: ['code', 'coding', 'program', 'script', 'debug', 'bug', 'fix',
            'develop', 'app', 'api', 'website', 'web', 'frontend', 'backend',
            'database', 'python', 'javascript', 'html', 'css', 'react',
            'node', 'java', 'cpp', 'automate', 'automation', 'bot', 'function'],
    },
    {
        category: 'Academic',
        keywords: ['notes', 'assignment', 'essay', 'report', 'study', 'summarize',
            'summary', 'tutor', 'teach', 'explain', 'lecture', 'homework',
            'thesis', 'paper', 'research', 'review', 'subject', 'topic',
            'exam', 'quiz', 'syllabus', 'translate', 'transcribe'],
    },
    {
        category: 'Writing',
        keywords: ['write', 'writing', 'content', 'article', 'blog', 'copy',
            'draft', 'proofread', 'edit', 'story', 'description', 'bio',
            'proposal', 'letter', 'email', 'caption', 'post', 'social media'],
    },
    {
        category: 'Media',
        keywords: ['video', 'edit', 'photo', 'photography', 'shoot', 'record',
            'audio', 'podcast', 'reel', 'clip', 'thumbnail', 'animation',
            'motion', 'after effects', 'premiere', 'youtube'],
    },
    {
        category: 'Research',
        keywords: ['research', 'survey', 'data', 'analyse', 'analyze', 'analysis',
            'collect', 'gather', 'find', 'information', 'compare', 'spreadsheet',
            'excel', 'form', 'questionnaire'],
    },
];

// Complexity keywords
const HIGH_COMPLEXITY = [
    'complex', 'advanced', 'full', 'complete', 'entire', 'large', 'professional',
    'detailed', 'comprehensive', 'multiple', 'many', 'several', 'production',
    'automate', 'automation', 'extensive', 'robust', 'scalable',
];
const LOW_COMPLEXITY = [
    'simple', 'basic', 'quick', 'small', 'short', 'easy', 'minor', 'brief',
    'single', 'one', 'fast', 'straightforward', 'tiny',
];

const TIME_MAP = {
    Low: 1,
    Medium: 1.5,
    High: 2,
};

function classifyTask(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const words = text.split(/\s+/);

    // --- Category detection ---
    let detectedCategory = 'General';
    let maxMatches = 0;

    for (const rule of CATEGORY_RULES) {
        const matches = rule.keywords.filter((kw) => text.includes(kw)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedCategory = rule.category;
        }
    }

    // --- Complexity detection ---
    const highHits = HIGH_COMPLEXITY.filter((kw) => text.includes(kw)).length;
    const lowHits = LOW_COMPLEXITY.filter((kw) => text.includes(kw)).length;

    let complexity_level;
    if (highHits > lowHits) {
        complexity_level = 'High';
    } else if (lowHits > highHits) {
        complexity_level = 'Low';
    } else {
        // Neutral — guess from description length
        const wordCount = words.length;
        if (wordCount > 60) complexity_level = 'High';
        else if (wordCount > 25) complexity_level = 'Medium';
        else complexity_level = 'Low';
    }

    const estimated_time_hours = TIME_MAP[complexity_level];

    return {
        category: detectedCategory,
        complexity_level,
        estimated_time_hours,
    };
}

module.exports = { classifyTask };
