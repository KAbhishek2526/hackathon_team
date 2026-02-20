const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Heuristic mock classification based on keywords — used as fallback
function mockClassify(title, description) {
    const text = (title + ' ' + description).toLowerCase();

    let complexity_level = 'Medium';
    if (text.includes('simple') || text.includes('basic') || text.includes('small')) complexity_level = 'Low';
    if (text.includes('complex') || text.includes('advanced') || text.includes('full') || text.includes('complete')) complexity_level = 'High';

    let category = 'General';
    if (text.match(/design|logo|poster|graphic|ui|ux|figma|canva/)) category = 'Design';
    else if (text.match(/code|develop|app|website|program|script|api|bug|fix/)) category = 'Development';
    else if (text.match(/write|content|article|blog|essay|copy|translate/)) category = 'Writing';
    else if (text.match(/research|data|survey|analyse|analyze|report/)) category = 'Research';
    else if (text.match(/teach|tutor|explain|learn|study/)) category = 'Tutoring';
    else if (text.match(/video|edit|photo|audio|record|shoot/)) category = 'Media';

    const estimated_time_hours = complexity_level === 'Low' ? 1 : complexity_level === 'High' ? 4 : 2;

    return { category, complexity_level, estimated_time_hours };
}

async function classifyTask(title, description) {
    // No key set — use mock
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        return mockClassify(title, description);
    }

    const prompt = `You are a task classification assistant for a student micro-task platform.
Given the following task, respond ONLY with a valid JSON object — no markdown, no explanation.

Task Title: ${title}
Task Description: ${description}

Respond with exactly this JSON structure:
{
  "category": "<string describing the task category>",
  "complexity_level": "<Low | Medium | High>",
  "estimated_time_hours": <number>
}`;

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
        });

        const text = response.choices[0].message.content.trim();
        const result = JSON.parse(text);

        // Validate and normalise
        const validComplexity = ['Low', 'Medium', 'High'];
        if (!validComplexity.includes(result.complexity_level)) result.complexity_level = 'Medium';
        if (typeof result.estimated_time_hours !== 'number' || result.estimated_time_hours <= 0) result.estimated_time_hours = 1;

        return result;
    } catch (err) {
        // Graceful fallback on quota / rate-limit / network errors
        console.warn(`OpenAI classification failed (${err.code || err.message}) — using heuristic fallback`);
        return mockClassify(title, description);
    }
}

module.exports = { classifyTask };
