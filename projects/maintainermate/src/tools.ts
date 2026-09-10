import fs from 'node:fs/promises';
import path from 'node:path';
import { tool } from '@strands-agents/sdk';
import { z } from 'zod';

export type Ticket = {
  id: string;
  subject: string;
  body: string;
  customer?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
};

const dataDir = path.resolve(process.cwd(), 'data');

export function urgencyScore(ticket: Ticket): number {
  const text = `${ticket.subject} ${ticket.body}`.toLowerCase();
  let score = ticket.severity === 'critical' ? 100 : ticket.severity === 'high' ? 70 : ticket.severity === 'medium' ? 40 : 20;
  if (/security|breach|leak|down|outage|payment|data loss/.test(text)) score += 20;
  if (/blocked|cannot|can't|urgent|production/.test(text)) score += 10;
  return Math.min(score, 100);
}

export const loadTicket = tool({
  name: 'load_ticket',
  description: 'Load a support or maintenance ticket from the local inbox by id.',
  inputSchema: z.object({ id: z.string() }),
  callback: async ({ id }) => {
    const raw = await fs.readFile(path.join(dataDir, 'inbox.json'), 'utf8');
    const tickets = JSON.parse(raw) as Ticket[];
    const ticket = tickets.find((item) => item.id === id);
    if (!ticket) throw new Error(`Ticket ${id} not found`);
    return JSON.stringify({ ...ticket, urgencyScore: urgencyScore(ticket) });
  },
});

export const writeCustomerDraft = tool({
  name: 'write_customer_draft',
  description: 'Save a customer-response draft to the local outbox. This never sends email automatically.',
  inputSchema: z.object({ ticketId: z.string(), response: z.string().min(1) }),
  callback: async ({ ticketId, response }) => {
    await fs.mkdir(path.join(dataDir, 'outbox'), { recursive: true });
    const target = path.join(dataDir, 'outbox', `${ticketId}.md`);
    await fs.writeFile(target, response, 'utf8');
    return `Draft saved to ${target}`;
  },
});

export const logFollowUp = tool({
  name: 'log_follow_up',
  description: 'Record a concrete follow-up action in the local action log.',
  inputSchema: z.object({ ticketId: z.string(), action: z.string(), due: z.string() }),
  callback: async ({ ticketId, action, due }) => {
    const line = JSON.stringify({ ticketId, action, due, createdAt: new Date().toISOString() });
    await fs.mkdir(dataDir, { recursive: true });
    await fs.appendFile(path.join(dataDir, 'followups.jsonl'), `${line}\n`, 'utf8');
    return 'Follow-up recorded';
  },
});

export const createGitHubIssue = tool({
  name: 'create_github_issue',
  description: 'Create a GitHub issue for engineering work only when GITHUB_TOKEN and GITHUB_REPOSITORY are configured; otherwise return a safe dry-run preview.',
  inputSchema: z.object({ title: z.string(), body: z.string() }),
  callback: async ({ title, body }) => {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY;
    if (!token || !repo) return JSON.stringify({ mode: 'dry-run', repo: repo ?? '<owner/repo>', title, body });

    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ title, body }),
    });
    if (!response.ok) throw new Error(`GitHub issue creation failed: ${response.status}`);
    const payload = (await response.json()) as { html_url: string; number: number };
    return JSON.stringify({ mode: 'live', issueNumber: payload.number, url: payload.html_url });
  },
});
