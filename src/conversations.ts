/**
 * Conversation persistence — CRUD for saved conversations.
 * Stored in data/conversations.json.
 */

import OpenAI from "openai";
import { readJSON, writeJSON } from "./storage.js";
import crypto from "crypto";

interface ConversationRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mode: string;
  messages: OpenAI.ChatCompletionMessageParam[];
}

interface ConversationStore {
  conversations: ConversationRecord[];
}

const FILE = "conversations.json";
const DEFAULT: ConversationStore = { conversations: [] };

async function load(): Promise<ConversationStore> {
  return readJSON<ConversationStore>(FILE, DEFAULT);
}

async function save(store: ConversationStore): Promise<void> {
  await writeJSON(FILE, store);
}

/** Create a new conversation */
export async function createConversation(mode: string): Promise<ConversationRecord> {
  const store = await load();
  const record: ConversationRecord = {
    id: crypto.randomUUID(),
    title: "New Conversation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode,
    messages: [],
  };
  store.conversations.unshift(record);
  await save(store);
  return record;
}

/** Get a conversation by ID */
export async function getConversation(
  id: string,
): Promise<ConversationRecord | null> {
  const store = await load();
  return store.conversations.find((c) => c.id === id) || null;
}

/** List all conversations (summary only) */
export async function listConversations(): Promise<
  Array<{ id: string; title: string; updatedAt: string; mode: string }>
> {
  const store = await load();
  return store.conversations.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt,
    mode: c.mode,
  }));
}

/** Update a conversation's messages */
export async function updateConversation(
  id: string,
  messages: OpenAI.ChatCompletionMessageParam[],
  mode: string,
): Promise<void> {
  const store = await load();
  const conv = store.conversations.find((c) => c.id === id);
  if (!conv) return;

  conv.messages = messages;
  conv.mode = mode;
  conv.updatedAt = new Date().toISOString();

  // Auto-generate title from first user message
  if (conv.title === "New Conversation" && messages.length > 0) {
    const firstMsg = messages[0];
    if (firstMsg.role === "user" && typeof firstMsg.content === "string") {
      conv.title =
        firstMsg.content.length > 50
          ? firstMsg.content.slice(0, 50) + "..."
          : firstMsg.content;
    }
  }

  await save(store);
}

/** Delete a conversation */
export async function deleteConversation(id: string): Promise<void> {
  const store = await load();
  store.conversations = store.conversations.filter((c) => c.id !== id);
  await save(store);
}
