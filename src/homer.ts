/**
 * The Homer Simpson agent — a real AI agent with tools and modes.
 * Uses the OpenAI API.
 */

import OpenAI from "openai";
import { CONFIG } from "./config.js";
import { Conversation } from "./conversation.js";
import { getSystemPrompt, type AgentMode } from "./modes.js";
import { getRandomGreeting } from "./personality.js";
import { TOOL_DEFINITIONS, executeTool } from "./tools/index.js";

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

/** Lazy-initialized OpenAI client */
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    if (!CONFIG.apiKey || CONFIG.apiKey === "your-openai-api-key-here") {
      throw new Error("Missing OPENAI_API_KEY — add it to your .env file. Get your key at https://platform.openai.com/api-keys");
    }
    _client = new OpenAI({
      apiKey: CONFIG.apiKey,
      baseURL: CONFIG.baseUrl,
    });
  }
  return _client;
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

    for (let iteration = 0; iteration < CONFIG.maxIterations; iteration++) {
      // Build messages with system prompt at the front
      const msgs: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: getSystemPrompt(this.mode) },
        ...this.conversation.getMessages(),
      ];

      // --- Call OpenAI API ---
      const response = await getClient().chat.completions.create({
        model: CONFIG.model,
        messages: msgs,
        tools: TOOL_DEFINITIONS as OpenAI.ChatCompletionTool[],
        max_tokens: CONFIG.maxTokens,
      });

      const choice = response.choices[0];
      const message = choice.message;
      const content = message.content || "";
      // Extract function tool calls only
      const rawToolCalls = message.tool_calls || [];
      const toolCalls = rawToolCalls.filter(
        (tc): tc is OpenAI.ChatCompletionMessageToolCall & { type: "function" } =>
          tc.type === "function",
      );

      // Send text to UI
      if (content) {
        fullTextResponse += content;
        cb.onChunk(content);
      }

      // --- Store the assistant message ---
      if (toolCalls.length > 0) {
        this.conversation.addAssistantToolCalls(
          content || null,
          toolCalls,
        );
      } else {
        this.conversation.addAssistantMessage(content);
      }

      // --- If no tool calls, we're done ---
      if (toolCalls.length === 0) {
        break;
      }

      // --- Execute tools ---
      for (const tc of toolCalls) {
        const fnName = tc.function.name;
        const fnArgs = tc.function.arguments;

        cb.onToolUse(fnName, tc.id);

        let input: unknown;
        try {
          input = JSON.parse(fnArgs);
        } catch {
          input = {};
        }

        try {
          const execResult = await executeTool(fnName, input);
          cb.onToolResult(fnName, tc.id, execResult, false);
          this.conversation.addToolResult(tc.id, execResult);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          cb.onToolResult(fnName, tc.id, errMsg, true);
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
