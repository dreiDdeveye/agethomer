/**
 * Web server — Homer's agent dashboard goes online!
 * Run with: npm run dev:web
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { HomerAgent } from "./homer.js";
import { validateConfig, CONFIG } from "./config.js";
import { getMemoryCount } from "./tools/memory.js";
import {
  createConversation,
  getConversation,
  listConversations,
  updateConversation,
  deleteConversation,
} from "./conversations.js";
import type { AgentMode } from "./modes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

validateConfig();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Landing page at /, dashboard at /chat
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "landing.html"));
});

app.get("/chat", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use(express.static(path.join(__dirname, "..", "public")));

// Single-user Homer instance
const homer = new HomerAgent();
let currentConversationId: string | null = null;

// ── Greet ────────────────────────────────────────────────

app.get("/api/greet", (_req, res) => {
  res.json({ greeting: homer.greet() });
});

// ── Agent Status ─────────────────────────────────────────

app.get("/api/status", async (_req, res) => {
  const memoryCount = await getMemoryCount();
  res.json({
    online: true,
    mode: homer.getMode(),
    memoryCount,
    model: CONFIG.model,
    conversationId: currentConversationId,
  });
});

// ── Mode Switch ──────────────────────────────────────────

app.post("/api/mode", (req, res) => {
  const { mode } = req.body;
  if (!["classic", "serious", "dev"].includes(mode)) {
    res.status(400).json({ error: "Invalid mode" });
    return;
  }
  homer.setMode(mode as AgentMode);
  res.json({ mode: homer.getMode() });
});

// ── Chat (SSE streaming with agentic loop) ───────────────

app.post("/api/chat", async (req, res) => {
  const { message, conversationId } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "D'oh! Send a message, will ya?" });
    return;
  }

  // Load conversation if switching
  if (conversationId && conversationId !== currentConversationId) {
    const conv = await getConversation(conversationId);
    if (conv) {
      homer.loadConversation(conv.messages);
      homer.setMode(conv.mode as AgentMode);
      currentConversationId = conversationId;
    }
  }

  // Auto-create conversation if none active
  if (!currentConversationId) {
    const conv = await createConversation(homer.getMode());
    currentConversationId = conv.id;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  const send = (data: object) => {
    if (!aborted) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  try {
    await homer.chat(message, {
      onChunk: (text) => send({ type: "chunk", text }),
      onThinking: (text) => send({ type: "thinking", text }),
      onToolUse: (name, id) => send({ type: "tool_use", name, id }),
      onToolResult: (name, id, result, isError) =>
        send({ type: "tool_result", name, id, result, isError }),
      onDone: () => send({ type: "done" }),
      onError: (error) => send({ type: "error", error }),
    });

    // Auto-save conversation
    if (currentConversationId) {
      await updateConversation(
        currentConversationId,
        homer.getConversation().toJSON(),
        homer.getMode(),
      );
    }

    if (!aborted) {
      res.end();
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    send({ type: "error", error: errMsg });
    if (!aborted) {
      res.end();
    }
  }
});

// ── Reset ────────────────────────────────────────────────

app.post("/api/reset", async (_req, res) => {
  homer.reset();
  const conv = await createConversation(homer.getMode());
  currentConversationId = conv.id;
  res.json({ status: "reset", greeting: homer.greet(), conversationId: conv.id });
});

// ── Conversations CRUD ───────────────────────────────────

app.get("/api/conversations", async (_req, res) => {
  const list = await listConversations();
  res.json({ conversations: list });
});

app.get("/api/conversations/:id", async (req, res) => {
  const conv = await getConversation(req.params.id);
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json(conv);
});

app.post("/api/conversations", async (_req, res) => {
  homer.reset();
  const conv = await createConversation(homer.getMode());
  currentConversationId = conv.id;
  res.json({ id: conv.id, title: conv.title, greeting: homer.greet() });
});

app.delete("/api/conversations/:id", async (req, res) => {
  await deleteConversation(req.params.id);
  if (currentConversationId === req.params.id) {
    currentConversationId = null;
    homer.reset();
  }
  res.json({ deleted: true });
});

// ── Start ────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(
    `\n  Homer's Agent Dashboard is running at http://localhost:${PORT}`,
  );
  console.log(
    `  "Woo-hoo! The internet! Is that thing still around?"\n`,
  );
});
