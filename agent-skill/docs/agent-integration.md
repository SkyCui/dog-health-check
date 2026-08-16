# Agent integration

## Local test

From the project root:

```bash
npm install
npm run dev
```

In another terminal:

```bash
curl -X POST http://localhost:3000/api/assess \
  -H 'Content-Type: application/json' \
  --data @agent-skill/examples/healthy-dog.json
```

Run contract and safety scenarios with:

```bash
npm run test:knowledge
npm run test:api
```

## Deploy and connect

1. Deploy the Next.js project to Vercel or another Node-compatible host.
2. Confirm `POST https://YOUR-DOMAIN/api/assess` returns JSON.
3. Replace the `servers[0].url` in `tools/assess_dog_health.openapi.yaml` if the production domain differs.
4. Import that single YAML file into GPT Builder Actions. It contains no external schema references.
5. Add `agent/system-prompt.md` to the Agent instructions and keep tool output authoritative.

The Agent must send `mentalState`, must not calculate scores or replace `unknown`, and must not override `insufficient`, `red_vet`, `behavior_support`, `allowShare`, or `shareCopy`. Read `assessmentConfidence` and `answeredCoverage` before presenting any score; `happinessScore` is null when coverage is insufficient.

## Red Skill phase one

Upload `red-skill/SKILL.md` as the standalone Red Skill file. It prefers the production Web assessment because Markdown-only runtimes cannot render custom option cards. Chat collection is allowed only when the runtime can POST to `/api/assess`; otherwise the Skill must not collect ten groups it cannot score.

No quota, account, payment, or membership claim is included in phase one.
