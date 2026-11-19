// Ahmad Content Tools - MCP server as a single Cloudflare Worker.
// Endpoint: https://<worker>.<account>.workers.dev/mcp
// Stateless streamable-HTTP MCP (JSON responses). No auth, no private data.

const SERVER_INFO = { name: "Ahmad Content Tools", version: "1.0.0" };
const PROTOCOL_VERSION = "2025-03-26";

const TOOLS = [
  {
    name: "get_current_time",
    description: "Get the current date and time in a timezone, e.g. Asia/Karachi, America/New_York, UTC.",
    inputSchema: {
      type: "object",
      properties: { timezone_name: { type: "string", default: "Asia/Karachi" } },
    },
  },
  {
    name: "script_timing",
    description: "Estimate voiceover duration for a script. Returns word count and timing at the given speaking speed.",
    inputSchema: {
      type: "object",
      properties: {
        script_text: { type: "string" },
        words_per_minute: { type: "integer", default: 130 },
      },
      required: ["script_text"],
    },
  },
  {
    name: "youtube_title_ideas",
    description: "Generate practical, non-clickbait YouTube title ideas for a topic and audience.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string" },
        audience: { type: "string", default: "students and small business owners" },
        count: { type: "integer", default: 5 },
      },
      required: ["topic"],
    },
  },
  {
    name: "instagram_hooks",
    description: "Generate scroll-stopping first-line hooks for an Instagram reel or carousel about a topic.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string" },
        count: { type: "integer", default: 5 },
      },
      required: ["topic"],
    },
  },
  {
    name: "instagram_caption",
    description: "Draft a short Instagram caption with hashtags for a topic, aimed at founders and operators.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string" },
        tone: { type: "string", default: "professional" },
        call_to_action: { type: "string", default: "Save this post and follow for one tested system every day." },
      },
      required: ["topic"],
    },
  },
  {
    name: "fiverr_pricing",
    description: "Suggest Basic / Standard / Premium package prices from a Basic price (Standard = 2x, Premium = ~3.8x).",
    inputSchema: {
      type: "object",
      properties: { base_price_usd: { type: "number", default: 25 } },
    },
  },
];

function callTool(name, args = {}) {
  switch (name) {
    case "get_current_time": {
      const tz = args.timezone_name || "Asia/Karachi";
      try {
        const s = new Intl.DateTimeFormat("en-GB", {
          timeZone: tz, weekday: "long", day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit", hour12: true, timeZoneName: "short",
        }).format(new Date());
        return s;
      } catch {
        return `Unknown timezone '${tz}'. Use a name like Asia/Karachi, America/New_York or UTC.`;
      }
    }
    case "script_timing": {
      const text = (args.script_text || "").trim();
      const wpm = Math.max(args.words_per_minute || 130, 1);
      const words = text ? text.split(/\s+/).length : 0;
      if (!words) return "Script is empty - 0 words, 0 seconds.";
      const seconds = (words / wpm) * 60;
      const m = Math.floor(seconds / 60);
      const r = Math.round(seconds % 60);
      return `Words: ${words}\nSpeaking speed: ${wpm} wpm\nEstimated duration: ${m} min ${r} sec (${Math.round(seconds)} seconds total)\nTip: a 60-second Short needs about ${wpm} words at this speed.`;
    }
    case "youtube_title_ideas": {
      const t = (args.topic || "").trim();
      const a = (args.audience || "students and small business owners").trim();
      const count = Math.max(1, Math.min(args.count || 5, 10));
      const templates = [
        `I Tested ${t} for a Real Task - Honest Result`,
        `${t} in 10 Minutes: Step-by-Step for ${a}`,
        `Stop Doing It Manually: ${t} Does It Faster`,
        `${t} - What Works, What Fails, What It Costs`,
        `Beginner's First Win With ${t} (No Hype)`,
        `I Replaced My Old Workflow With ${t} for 7 Days`,
        `${t} Mistakes Beginners Make (and the Fix)`,
        `${t} vs Doing It Yourself: Time and Cost Compared`,
        `One ${t} Workflow That Saves an Hour a Week`,
        `${t}: Watch This Before You Pay for It`,
      ];
      return "YouTube title ideas:\n" + templates.slice(0, count).map((x, i) => `${i + 1}. ${x}`).join("\n");
    }
    case "instagram_hooks": {
      const t = (args.topic || "").trim();
      const count = Math.max(1, Math.min(args.count || 5, 10));
      const hooks = [
        `You don't need more tools. You need this ${t} system.`,
        `Stop wasting an hour on what ${t} does in 10 minutes.`,
        `3 ${t} mistakes costing you time every week.`,
        `I tested ${t} on a real task. Here's the honest result.`,
        `The ${t} workflow nobody shows beginners.`,
        `If you run a business, ${t} is leverage - not a toy.`,
        `Before you pay for ${t}, check this one limit.`,
        `${t}, explained in 30 seconds - no hype.`,
        `One prompt, one system: ${t} done right.`,
        `Save this: my exact ${t} checklist.`,
      ];
      return "Instagram hooks:\n" + hooks.slice(0, count).map((x, i) => `${i + 1}. ${x}`).join("\n");
    }
    case "instagram_caption": {
      const t = (args.topic || "").trim();
      const tone = args.tone || "professional";
      const cta = args.call_to_action || "Save this post and follow for one tested system every day.";
      const topicTag = "#" + t.replace(/-/g, " ").split(/\s+/).filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
      const tags = [topicTag, "#AISystems", "#Founders", "#Operators", "#SmallBusiness", "#Productivity", "#Freelancer"];
      return `${t} - tested on a real task, not a demo.\n\nWhat worked, what failed, and what it actually costs. Tone: ${tone}. No hype, no fake results.\n\n${cta}\n\n${tags.join(" ")}`;
    }
    case "fiverr_pricing": {
      const base = Number(args.base_price_usd ?? 25);
      if (!(base > 0)) return "Base price must be more than 0.";
      const standard = base * 2;
      const premium = Math.round(base * 3.8);
      return `Basic: $${base} - 1 tool, 1 task, script + copy-paste prompt, 1 revision, 3 days\nStandard: $${standard} - script + step-by-step SOP + caption pack, 2 revisions, 3 days (recommended)\nPremium: $${premium} - 2 tools compared on the same task, script + SOP + caption pack, 2 revisions, 5 days\nNote: starting prices only, not a market guarantee.`;
    }
    default:
      return null;
  }
}

function rpcResult(id, result) {
  return Response.json({ jsonrpc: "2.0", id, result });
}
function rpcError(id, code, message) {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } });
}

async function handleRpc(msg) {
  const { id, method, params } = msg || {};
  if (id === undefined || id === null) {
    // Notification - acknowledge with 202, no body.
    return new Response(null, { status: 202 });
  }
  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: (params && params.protocolVersion) || PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: "Practical content tools for a creator/freelancer: script timing, YouTube title ideas, Instagram hooks and captions, and Fiverr package pricing.",
      });
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS });
    case "tools/call": {
      const out = callTool(params && params.name, (params && params.arguments) || {});
      if (out === null) return rpcError(id, -32602, `Unknown tool: ${params && params.name}`);
      return rpcResult(id, { content: [{ type: "text", text: out }], isError: false });
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/mcp" && url.pathname !== "/mcp/") {
      return Response.json({
        name: SERVER_INFO.name,
        status: "ok",
        mcp_endpoint: "/mcp",
        tools: TOOLS.map((t) => t.name),
      });
    }
    if (request.method === "GET") {
      return Response.json({ status: "ok", transport: "streamable-http", note: "POST JSON-RPC to this endpoint." });
    }
    if (request.method === "DELETE") return new Response(null, { status: 200 });
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    let body;
    try {
      body = await request.json();
    } catch {
      return rpcError(null, -32700, "Parse error");
    }
    if (Array.isArray(body)) {
      const responses = [];
      for (const msg of body) {
        const r = await handleRpc(msg);
        if (r.status !== 202) responses.push(await r.json());
      }
      return responses.length ? Response.json(responses) : new Response(null, { status: 202 });
    }
    return handleRpc(body);
  },
};
