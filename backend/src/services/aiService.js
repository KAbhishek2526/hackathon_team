const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function classifyTask(title, description) {
    // If no API key, return a sensible mock response
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        return {
            category: 'General',
            complexity_level: 'Medium',
            estimated_time_hours: 2,
        };
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

    const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
    });

    const text = response.choices[0].message.content.trim();
    const result = JSON.parse(text);

    // Validate and normalise
    const validComplexity = ['Low', 'Medium', 'High'];
    if (!validComplexity.includes(result.complexity_level)) {
        result.complexity_level = 'Medium';
    }
    if (typeof result.estimated_time_hours !== 'number' || result.estimated_time_hours <= 0) {
        result.estimated_time_hours = 1;
    }

    return result;
}

module.exports = { classifyTask };
