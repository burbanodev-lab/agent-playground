# BountyForge — Nebius + NVIDIA

BountyForge is a coding-agent prototype for the **Nebius x NVIDIA Global AI Hackathon**, targeting the **Coding and Agentic Engineering** track.

It uses NVIDIA Nemotron on Nebius Token Factory to turn a software issue into a structured execution plan: clarify acceptance criteria, identify risky assumptions, propose files/tests, and produce a machine-readable implementation checklist.

## Why this project

Software bounties and maintenance issues often waste time before coding begins: unclear scope, hidden acceptance criteria, and weak verification plans. BountyForge focuses the model on producing an auditable plan that another coding worker can execute and verify.

## Run

```bash
cd projects/bountyforge-nebius
npm install
export NEBIUS_API_KEY=...
npm run dev -- "Add rate limiting to an Express API with PostgreSQL-backed configuration"
```

The integration uses Nebius Token Factory's OpenAI-compatible endpoint and NVIDIA Nemotron 3 Super by default.

## Environment

- `NEBIUS_API_KEY` — required for live inference.
- `NEBIUS_MODEL` — optional, defaults to `nvidia/nemotron-3-super-120b-a12b`.
- `NEBIUS_BASE_URL` — optional, defaults to `https://api.tokenfactory.us-central1.nebius.com/v1/`.

## Output contract

The agent returns JSON with:

- `goal`
- `acceptanceCriteria[]`
- `implementationSteps[]`
- `tests[]`
- `risks[]`
- `estimatedComplexity`

## Hackathon fit

- Runs on **Nebius Token Factory**.
- Uses an **NVIDIA open model (Nemotron)**.
- Direct fit for **Coding and Agentic Engineering**.
- Designed to become a complete product demo rather than a prompt-only proof of concept.

## Next milestones

1. Add repository-context ingestion.
2. Add sandboxed code/test execution.
3. Add a verifier pass using a second Nemotron call.
4. Build a small Vue dashboard showing plan → execution → verification.
5. Record a <=3 minute public demo and deploy a working demo URL before submission.

## License

MIT (repository license).