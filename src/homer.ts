/**
 * The Homer Simpson agent — a real AI agent with tools and modes.
 * Uses Ollama's native API for reliable local inference.
 */

import { CONFIG } from "./config.js";
import { Conversation } from "./conversation.js";
import { getSystemPrompt, type AgentMode } from "./modes.js";
import { getRandomGreeting } from "./personality.js";
import { TOOL_DEFINITIONS, executeTool } from "./tools/index.js";
import type OpenAI from "openai";

/** Callbacks for streaming events to the UI */
export interface AgentCallbacks {
  onChunk: (text: string) => void;
  onThinking: (text: string) => void;
  onToolUse: (toolName: string, toolId: string) => void;
  onToolResult: (toolName: string, toolId: string, result: string, isError: boolean) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

const NO_OP_CALLBACKS: AgentCallbacks = {
  onChunk: () => {},
  onThinking: () => {},
  onToolUse: () => {},
  onToolResult: () => {},
  onDone: () => {},
  onError: () => {},
};

/** Convert our OpenAI-format tools to Ollama's native tool format */
function toOllamaTools(): object[] {
  return TOOL_DEFINITIONS.map((t) => {
    const tool = t as { type: string; function: { name: string; description: string; parameters: unknown } };
    return {
      type: "function",
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    };
  });
}

/** Call Ollama's native /api/chat endpoint */
async function ollamaChat(
  messages: Array<{ role: string; content: string; tool_calls?: unknown[]; }>,
  tools?: object[],
): Promise<{ content: string; toolCalls: Array<{ id: string; name: string; arguments: string }> }> {
  const body: Record<string, unknown> = {
    model: CONFIG.model,
    messages,
    stream: false,
    options: { num_predict: CONFIG.maxTokens },
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const res = await fetch(`${CONFIG.baseUrl.replace("/v1", "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const data = await res.json() as {
    message?: {
      content?: string;
      tool_calls?: Array<{
        function: { name: string; arguments: Record<string, unknown> };
      }>;
    };
  };

  const msg = data.message || {};
  const toolCalls = (msg.tool_calls || []).map((tc, i) => ({
    id: `call_${Date.now()}_${i}`,
    name: tc.function.name,
    arguments: JSON.stringify(tc.function.arguments),
  }));

  return {
    content: msg.content || "",
    toolCalls,
  };
}

export class HomerAgent {
  private conversation: Conversation;
  private mode: AgentMode = "classic";

  constructor() {
    this.conversation = new Conversation();
  }

  /** Get Homer's opening greeting */
  greet(): string {
    return getRandomGreeting();
  }

  setMode(mode: AgentMode): void {
    this.mode = mode;
  }

  getMode(): AgentMode {
    return this.mode;
  }

  /** Get the conversation for serialization */
  getConversation(): Conversation {
    return this.conversation;
  }

  /** Load a saved conversation */
  loadConversation(messages: OpenAI.ChatCompletionMessageParam[]): void {
    this.conversation.setMessages(messages);
  }

  /**
   * Send a message to Homer with the full agentic loop.
   * Loops until the model stops calling tools.
   */
  async chat(
    userMessage: string,
    callbacks: Partial<AgentCallbacks> = {},
  ): Promise<string> {
    const cb: AgentCallbacks = { ...NO_OP_CALLBACKS, ...callbacks };

    this.conversation.addUserMessage(userMessage);

    let fullTextResponse = "";
    const tools = toOllamaTools();

    for (let iteration = 0; iteration < CONFIG.maxIterations; iteration++) {
      // Build messages with system prompt at the front
      const msgs = [
        { role: "system", content: getSystemPrompt(this.mode) },
        ...this.conversation.getMessages().map((m) => ({
          role: m.role as string,
          content: typeof m.content === "string" ? m.content : "",
        })),
      ];

      // --- Call Ollama native API (tools disabled for small models) ---
      const result = await ollamaChat(msgs);

      // Send text to UI
      if (result.content) {
        fullTextResponse += result.content;
        cb.onChunk(result.content);
      }

      // --- Store the assistant message ---
      if (result.toolCalls.length > 0) {
        const toolCallArray: OpenAI.ChatCompletionMessageToolCall[] =
          result.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          }));
        this.conversation.addAssistantToolCalls(
          result.content || null,
          toolCallArray,
        );
      } else {
        this.conversation.addAssistantMessage(result.content);
      }

      // --- If no tool calls, we're done ---
      if (result.toolCalls.length === 0) {
        break;
      }

      // --- Execute tools ---
      for (const tc of result.toolCalls) {
        cb.onToolUse(tc.name, tc.id);

        let input: unknown;
        try {
          input = JSON.parse(tc.arguments);
        } catch {
          input = {};
        }

        try {
          const execResult = await executeTool(tc.name, input);
          cb.onToolResult(tc.name, tc.id, execResult, false);
          this.conversation.addToolResult(tc.id, execResult);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          cb.onToolResult(tc.name, tc.id, errMsg, true);
          this.conversation.addToolResult(tc.id, errMsg);
        }
      }
    }

    cb.onDone();
    return fullTextResponse;
  }

  /** Reset the conversation */
  reset(): void {
    this.conversation.clear();
  }
}
