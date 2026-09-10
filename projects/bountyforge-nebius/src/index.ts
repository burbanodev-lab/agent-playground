import OpenAI from 'openai';
import { resolve } from 'node:path';
import { collectRepositoryContext } from './context.js';

const apiKey = process.env.NEBIUS_API_KEY;
if (!apiKey) {
  throw new Error('NEBIUS_API_KEY is required for live inference');
}

const client = new OpenAI({
  apiKey,
  baseURL: process.env.NEBIUS_BASE_URL ?? 'https://api.tokenfactory.us-central1.nebius.com/v1/',
});

const model = process.env.NEBIUS_MODEL ?? 'nvidia/nemotron-3-super-120b-a12b';
const args = process.argv.slice(2);
const repoFlag = args.indexOf('--repo');
const repoPath = repoFlag >= 0 ? args[repoFlag + 1] : undefined;
const issue = args.filter((_, index) => index !== repoFlag && index !== repoFlag + 1).join(' ').trim();
if (!issue) {
  throw new Error('Pass a software issue description; optionally add --repo <path>');
}

const repositoryContext = repoPath
  ? await collectRepositoryContext(resolve(repoPath))
  : 'No repository context supplied.';

const system = `You are BountyForge, a senior software-engineering planning agent.
Turn one software issue plus bounded repository context into an implementation plan that is specific, testable and honest about uncertainty.
Return JSON only with this exact shape:
{
  "goal": string,
  "acceptanceCriteria": string[],
  "implementationSteps": string[],
  "tests": string[],
  "risks": string[],
  "estimatedComplexity": "low" | "medium" | "high"
}
Never invent repository facts that were not supplied. Cite relevant repository file paths inside implementation steps when context supports them. Put unknowns in risks.`;

const response = await client.chat.completions.create({
  model,
  temperature: 0.2,
  response_format: { type: 'json_object' },
  messages: [
    { role: 'system', content: system },
    {
      role: 'user',
      content: `ISSUE:\n${issue}\n\nREPOSITORY CONTEXT:\n${repositoryContext}`,
    },
  ],
});

const content = response.choices[0]?.message?.content;
if (!content) throw new Error('Nebius returned an empty response');

const parsed = JSON.parse(content);
console.log(JSON.stringify({
  provider: 'Nebius Token Factory',
  model,
  repositoryContextIncluded: Boolean(repoPath),
  plan: parsed,
}, null, 2));
