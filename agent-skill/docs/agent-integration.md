# Agent Integration

## Local Test

From the project root:

```bash
npm install
npm run dev
```

The local API server runs at:

```text
http://localhost:3000
```

Test with curl:

```bash
curl -X POST http://localhost:3000/api/assess \
  -H "Content-Type: application/json" \
  --data @agent-skill/examples/healthy-dog.json
```

Safety boundary test:

```bash
curl -X POST http://localhost:3000/api/assess \
  -H "Content-Type: application/json" \
  --data @agent-skill/examples/vet-boundary-dog.json
```

Expected safety-boundary response includes:

```json
{
  "status": "red_vet",
  "allowShare": false,
  "shareCopy": ""
}
```

## Agent Tool Setup

Use:

```text
agent-skill/tools/assess_dog_health.openapi.yaml
```

The OpenAPI server URL is currently:

```text
http://localhost:3000
```

After deployment, replace it with the production domain:

```yaml
servers:
  - url: https://your-production-domain.com
```

## Deployment Notes

Deploy the Next.js app to any platform that supports App Router route handlers, such as Vercel or a Node.js server.

The Agent only needs access to:

```text
POST /api/assess
```

No database, login, payment, RAG service, or image export service is required for this API.

## Integration Rule

The Agent must call the API for every assessment. It must not copy the rules and score locally, because the Web app and Agent API need to stay aligned through `generateResult`.
