import OpenAI from 'openai';

const apiKey = process.env.NEBIUS_API_KEY;
if (!apiKey) {
  throw new Error('NEBIUS_API_KEY is required for live inference');
}

const client = new OpenAI({
  apiKey,
  baseURL: process.env.NEBIUS_BASE_URL ?? 'https://api.tokenfactory.us-central1.nebius.com/v1/',
});

const model = process.env.NEBIUS_MODEL ?? 'nvidia/nemotron-3-super-120b-a12b';
const issue = process.argv.slice(2).join(' ').trim();
if (!issue) {
  throw new Error('Pass a software issue description as the command argument');
}

const system = `You are BountyForge, a senior software-engineering planning agent.
Turn one software issue into an implementation plan that is specific, testable and honest about uncertainty.
Return JSON only with this exact shape:
{
  "goal": string,
  "acceptanceCriteria": string[],
  "implementationSteps": string[],
  "tests": string[],
  "risks": string[],
  "estimatedComplexity": "low" | "medium" | "high"
}
Never invent repository facts that were not supplied. Put unknowns in risks.`;

const response = await client.chat.completions.create({
  model,
  temperature: 0.2,
  response_format: { type: 'json_object' },
  messages: [
    { role: 'system', content: system },
    { role: 'user', content: issue },
  ],
});

const content = response.choices[0]?.message?.content;
if (!content) throw new Error('Nebius returned an empty response');

const parsed = JSON.parse(content);
console.log(JSON.stringify({ provider: 'Nebius Token Factory', model, plan: parsed }, null, 2));