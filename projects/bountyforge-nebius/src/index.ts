import OpenAI from 'openai';
import { resolve } from 'node:path';
import { collectRepositoryContext } from './context.js';
import { verifyPlan } from './verify.js';
import { validateRepository } from './validation.js';

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

const resolvedRepoPath = repoPath ? resolve(repoPath) : undefined;
const repositoryContext = resolvedRepoPath
  ? await collectRepositoryContext(resolvedRepoPath)
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

const plan = JSON.parse(content);
const verification = await verifyPlan(client, model, issue, repositoryContext, plan);
const validation = resolvedRepoPath && verification.verdict === 'pass'
  ? await validateRepository(resolvedRepoPath)
  : null;

const readyForExecution = verification.verdict === 'pass';
const repositoryValidated = validation?.passed ?? false;

console.log(JSON.stringify({
  provider: 'Nebius Token Factory',
  model,
  repositoryContextIncluded: Boolean(resolvedRepoPath),
  plan,
  verification,
  validation,
  readyForExecution,
  repositoryValidated,
}, null, 2));

if (!readyForExecution || (resolvedRepoPath && !repositoryValidated)) {
  process.exitCode = 2;
}
