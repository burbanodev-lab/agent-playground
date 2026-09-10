import OpenAI from 'openai';

export type PlanVerification = {
  verdict: 'pass' | 'needs_changes';
  score: number;
  missingAcceptanceCriteria: string[];
  riskyAssumptions: string[];
  testGaps: string[];
  requiredChanges: string[];
};

export async function verifyPlan(
  client: OpenAI,
  model: string,
  issue: string,
  repositoryContext: string,
  plan: unknown,
): Promise<PlanVerification> {
  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are BountyForge Verifier, an independent senior reviewer. Evaluate whether a proposed software implementation plan is grounded in the supplied issue and repository context, testable, and safe to execute. Do not invent repository facts. Return JSON only with this exact shape: {"verdict":"pass"|"needs_changes","score":number,"missingAcceptanceCriteria":string[],"riskyAssumptions":string[],"testGaps":string[],"requiredChanges":string[]}. Score from 0 to 100. A pass requires score >= 85 and no material ungrounded assumptions.`,
      },
      {
        role: 'user',
        content: `ISSUE:\n${issue}\n\nREPOSITORY CONTEXT:\n${repositoryContext}\n\nPROPOSED PLAN:\n${JSON.stringify(plan, null, 2)}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Nebius verifier returned an empty response');

  const parsed = JSON.parse(content) as PlanVerification;
  if (!['pass', 'needs_changes'].includes(parsed.verdict) || typeof parsed.score !== 'number') {
    throw new Error('Nebius verifier returned an invalid verification contract');
  }
  return parsed;
}
