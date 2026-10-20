# Agent integration
Use POST https://dogcare.cc/api/assess with the bundled request schema. Web and API share generateResult. Agents never score or bypass safety.
For local testing run npm install and npm run dev, then POST agent-skill/examples/healthy-dog.json to http://localhost:3000/api/assess with Content-Type application/json.
After assessment offer https://dogcare.cc/knowledge and https://dogcare.cc/consult. BYOK is free, without login. Keys are entered only in the Web UI and never in Agent chat.
The browser sends bounded knowledge context and assessment text directly to the configured Chat Completions compatible endpoint. CORS must be enabled by the selected service. Photos are excluded. Keys remain in page memory.
Platform-paid models are pending. Users can privately message or join the community and reply 「需要Token」. Do not send users to /pay or claim payments are available.
Deployment: deploy the Next.js app, update the OpenAPI server if using a different domain, and upload the synchronized Skill package. Validate API safety cases and browser connectivity with the user's own provider. Never collect API keys in tools or Agent messages.
