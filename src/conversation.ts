/**
 * Manages the conversation history between the user and Homer.
 * Uses OpenAI-compatible message format (for Kimi/Moonshot API).
 */

import OpenAI from "openai";

type ChatMessage = OpenAI.ChatCompletionMessageParam;

export class Conversation {
  private messages: ChatMessage[] = [];

  /** Add a user text message */
  addUserMessage(content: string): void {
    this.messages.push({ role: "user", content });
  }

  /** Add Homer's (assistant) response as a plain string */
  addAssistantMessage(content: string): void {
    this.messages.push({ role: "assistant", content });
  }

  /** Add assistant response with tool calls */
  addAssistantToolCalls(
    content: string | null,
    toolCalls: OpenAI.ChatCompletionMessageToolCall[],
  ): void {
    this.messages.push({
      role: "assistant",
      content,
      tool_calls: toolCalls,
    });
  }

  /** Add a single tool result */
  addToolResult(toolCallId: string, result: string): void {
    this.messages.push({
      role: "tool",
      tool_call_id: toolCallId,
      content: result,
    });
  }

  /** Get the full conversation history for the API */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /** Set messages from a loaded conversation */
  setMessages(messages: ChatMessage[]): void {
    this.messages = [...messages];
  }

  /** Get raw messages for serialization */
  toJSON(): ChatMessage[] {
    return this.messages;
  }

  /** Get the number of messages */
  get length(): number {
    return this.messages.length;
  }

  /** Clear conversation history */
  clear(): void {
    this.messages = [];
  }
}
