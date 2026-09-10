# MaintainerMate — Devpost Submission Draft

## Track
Professional Agents

## One-line pitch
MaintainerMate turns repetitive software-maintenance tickets into auditable engineering work: triage, GitHub issue creation, customer-response drafting, follow-up scheduling, and an action ledger that distinguishes real side effects from dry runs.

## Problem
Small software teams lose time every day converting support incidents into engineering tasks, customer updates, and follow-up reminders. The work is repetitive but risky to automate blindly because external actions must be traceable and truthful.

## Solution
MaintainerMate is a Strands Agents-powered maintainer agent that handles the workflow end-to-end. It loads a support ticket, computes urgency, reasons over the incident, creates a focused GitHub issue when authorized, drafts the customer response, records a follow-up action, and returns an audit summary of what actually happened.

## Who it is for
Small engineering teams, maintainers, SaaS operators, and support engineers who need to move incidents from inbox to action without losing accountability.

## Why it matters
The value is not another chatbot. MaintainerMate reduces coordination overhead while keeping external actions explicit, auditable, and safe. It never claims a side effect succeeded unless the tool confirms it.

## Key features
- Strands Agents SDK as the orchestration layer.
- Deterministic urgency scoring separated from LLM reasoning.
- GitHub issue creation with explicit authorization and safe dry-run fallback.
- Customer-response drafting without automatic sending.
- Follow-up scheduling and audit logging.
- Clear distinction between live actions and simulated/dry-run actions.
- TypeScript implementation with tests and reproducible local run instructions.

## Technical implementation
MaintainerMate is written in TypeScript and uses `@strands-agents/sdk` for agent orchestration. External side effects are isolated behind tools. GitHub mutation only runs when credentials and a target repository are explicitly configured; otherwise the system produces a deterministic preview. The final agent response enumerates live versus dry-run actions so the operator can verify execution.

## Reliability and safety
- No fabricated success claims.
- External mutation requires explicit credentials.
- Customer communication remains draft-only.
- Deterministic scoring is testable independently.
- Audit output records the action path.
- Dry-run behavior is the default when authorization is absent.

## Architecture
Support Ticket → Strands Agent → Ticket Loader / Urgency Scorer / GitHub Issue Tool / Customer Draft Tool / Follow-up Tool → Audit Summary.

## Judging-criteria mapping
### Technical Implementation
Non-trivial Strands Agents workflow with multiple tools, controlled side effects, tests, and a functioning end-to-end execution path.

### Design
A coherent maintainer workflow rather than a single prompt or proof of concept.

### Potential Impact
Targets a recurring operational bottleneck for small software teams: converting incidents into accountable engineering and communication work.

### Creativity & Originality
Treats truthful action reporting and auditable side effects as first-class product behavior instead of merely generating text.

### Presentation
The demo should show one ticket moving end-to-end through triage, issue creation or dry-run preview, customer draft, follow-up creation, and final audit summary.

## Demo video storyboard (target: 2.5–3.5 minutes)
1. 0:00–0:20 — State the problem: repetitive maintenance coordination drains engineering time.
2. 0:20–0:40 — Show the repository and architecture diagram.
3. 0:40–1:40 — Run MaintainerMate on a sample high-priority ticket.
4. 1:40–2:20 — Show the resulting GitHub issue or dry-run preview, customer draft, follow-up action, and audit ledger.
5. 2:20–2:50 — Explain safety: explicit authorization, no fabricated success, draft-only customer communication.
6. 2:50–3:10 — Close with impact: one agent moves maintenance work from inbox to accountable action.

## Submission checklist
- [x] New project created during the submission period.
- [x] Uses Strands Agents SDK.
- [x] Public GitHub code path available.
- [x] README included.
- [x] Architecture diagram included in README.
- [x] MIT license added to repository root.
- [ ] Confirm repository is public at submission time.
- [ ] Record working demo video, maximum 5 minutes.
- [ ] Upload demo publicly to YouTube or Vimeo.
- [ ] Add AWS Builder ID to Devpost submission.
- [ ] Complete Devpost text fields from this draft.
- [ ] Optional: deploy a live demo and/or AgentCore version to strengthen Technical Implementation score.

## Suggested Devpost title
MaintainerMate — An Auditable Strands Agent for Software Maintenance

## Suggested tagline
From support ticket to accountable engineering action, without pretending a side effect happened.
