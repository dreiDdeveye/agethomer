/**
 * Memory tools — Homer's long-term brain filing cabinet.
 * Persists to data/memory.json.
 */

import OpenAI from "openai";
import { readJSON, writeJSON } from "../storage.js";
import crypto from "crypto";

interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: string;
  createdAt: string;
}

interface MemoryStore {
  memories: MemoryItem[];
}

const FILE = "memory.json";
const DEFAULT: MemoryStore = { memories: [] };

async function load(): Promise<MemoryStore> {
  return readJSON<MemoryStore>(FILE, DEFAULT);
}

async function save(store: MemoryStore): Promise<void> {
  await writeJSON(FILE, store);
}

// --- Tool definitions ---

export const MEMORY_SAVE_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "memory_save",
    description:
      "Save a fact to Homer's long-term memory. Use when the user shares something worth remembering (name, preferences, facts).",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Short label for this memory, e.g. 'user_name', 'favorite_food'",
        },
        value: {
          type: "string",
          description: "The fact to remember",
        },
        category: {
          type: "string",
          enum: ["personal", "preference", "fact", "other"],
          description: "Category of memory",
        },
      },
      required: ["key", "value"],
    },
  },
};

export const MEMORY_RECALL_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "memory_recall",
    description:
      "Search Homer's long-term memory for previously saved facts. Use when the user asks 'do you remember...?' or you need context.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term or key to look up",
        },
      },
      required: ["query"],
    },
  },
};

export const MEMORY_LIST_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "memory_list",
    description: "List all saved memories. Use when the user asks what you remember.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
};

// --- Tool executors ---

export async function executeMemorySave(input: {
  key: string;
  value: string;
  category?: string;
}): Promise<string> {
  const store = await load();

  // Update existing or create new
  const existing = store.memories.find((m) => m.key === input.key);
  if (existing) {
    existing.value = input.value;
    existing.category = input.category || existing.category;
  } else {
    store.memories.push({
      id: crypto.randomUUID(),
      key: input.key,
      value: input.value,
      category: input.category || "other",
      createdAt: new Date().toISOString(),
    });
  }

  await save(store);
  return `Saved memory: ${input.key} = "${input.value}"`;
}

export async function executeMemoryRecall(input: {
  query: string;
}): Promise<string> {
  const store = await load();
  const q = input.query.toLowerCase();

  const matches = store.memories.filter(
    (m) =>
      m.key.toLowerCase().includes(q) ||
      m.value.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q),
  );

  if (matches.length === 0) {
    return `No memories found matching "${input.query}". Homer's brain is empty on this one.`;
  }

  return matches
    .map((m) => `[${m.category}] ${m.key}: ${m.value}`)
    .join("\n");
}

export async function executeMemoryList(): Promise<string> {
  const store = await load();

  if (store.memories.length === 0) {
    return "No memories saved yet. Homer's brain is a clean slate!";
  }

  return store.memories
    .map((m) => `[${m.category}] ${m.key}: ${m.value}`)
    .join("\n");
}

export async function getMemoryCount(): Promise<number> {
  const store = await load();
  return store.memories.length;
}
