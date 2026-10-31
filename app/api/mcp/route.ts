import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createWorkbuddyMcp } from "@/lib/server/workbuddyMcp";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set(["https://dogcare.cc", "https://www.dogcare.cc", "https://dog-health-check.vercel.app"]);
  if (process.env.NODE_ENV !== "production") allowed.add(new URL(request.url).origin);
  if (origin && !allowed.has(origin)) return new Response("Forbidden origin", { status: 403 });
  const server = createWorkbuddyMcp();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 64 * 1024 });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    return new Response(await response.arrayBuffer(), { status: response.status, headers: { ...Object.fromEntries(response.headers), "Cache-Control": "no-store" } });
  } finally {
    await server.close();
  }
}

// This stateless endpoint does not expose a persistent SSE stream or retain sessions.
export function GET() { return new Response("Use Streamable HTTP POST for MCP.", { status: 405, headers: { Allow: "POST" } }); }
export const DELETE = GET;
