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

Consultation after assessment:

```bash
curl -X POST http://localhost:3000/api/consult \
  -H 'Content-Type: application/json' \
  --data @agent-skill/examples/care-consultation.json
```

Run contract and safety scenarios with:

```bash
npm run test:knowledge
npm run test:api
npm run test:consult
```

## Deploy and connect

1. Deploy the Next.js project to Vercel or another Node-compatible host.
2. Confirm both `POST https://YOUR-DOMAIN/api/assess` and `POST https://YOUR-DOMAIN/api/consult` return JSON.
3. Replace the `servers[0].url` in `tools/assess_dog_health.openapi.yaml` if the production domain differs.
4. Import that single YAML file into GPT Builder Actions. It contains no external schema references.
5. Add `agent/system-prompt.md` to the Agent instructions and keep tool output authoritative.

The Agent must send `mentalState`, must not calculate scores or replace `unknown`, and must not override `insufficient`, `red_vet`, `behavior_support`, `allowShare`, or `shareCopy`. Read `assessmentConfidence` and `answeredCoverage` before presenting any score; `happinessScore` is null when coverage is insufficient.

## Red Skill phase one

Upload `red-skill/SKILL.md` as the standalone Red Skill file. It prefers the production Web assessment because Markdown-only runtimes cannot render custom option cards. Chat collection is allowed only when the runtime can POST to `/api/assess`; otherwise the Skill must not collect ten groups it cannot score.

## Consultation and payment configuration

`/api/consult` is deterministic and does not require an OpenAI API key. The Web stores the free five-turn consultation entitlement in local storage for MVP validation. Set `NEXT_PUBLIC_PLUS_CHECKOUT_URL` to an externally created verified checkout page to activate the ¥9.99 button.

Before treating payment as production-grade, add user identity, a server-side entitlement table, order creation, signed payment callbacks, idempotency checks, refunds, and cross-device entitlement recovery. The current local record can be cleared by a user and is not a security boundary. Plus provides personalized knowledge guidance only; it does not include human veterinary or nutritionist consultation.
