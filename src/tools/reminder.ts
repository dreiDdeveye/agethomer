/**
 * Reminder tools — Homer sets alarms (and probably forgets them).
 * Persists to data/reminders.json.
 */

import OpenAI from "openai";
import { readJSON, writeJSON } from "../storage.js";
import crypto from "crypto";

interface ReminderItem {
  id: string;
  message: string;
  remindAt: string;
  createdAt: string;
  triggered: boolean;
}

interface ReminderStore {
  reminders: ReminderItem[];
}

const FILE = "reminders.json";
const DEFAULT: ReminderStore = { reminders: [] };

async function load(): Promise<ReminderStore> {
  return readJSON<ReminderStore>(FILE, DEFAULT);
}

async function save(store: ReminderStore): Promise<void> {
  await writeJSON(FILE, store);
}

// --- Tool definitions ---

export const REMINDER_SET_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "reminder_set",
    description:
      "Set a reminder for the user. Homer says: 'I'll remember this... probably. Better write it down!'",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "What to remind the user about",
        },
        remind_at: {
          type: "string",
          description:
            "When to remind, as an ISO 8601 timestamp (e.g. '2026-02-26T09:00:00Z') or a relative description like 'tomorrow at 9am'",
        },
      },
      required: ["message", "remind_at"],
    },
  },
};

export const REMINDER_LIST_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "reminder_list",
    description: "List all active (untriggered) reminders.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
};

// --- Tool executors ---

export async function executeReminderSet(input: {
  message: string;
  remind_at: string;
}): Promise<string> {
  const store = await load();

  store.reminders.push({
    id: crypto.randomUUID(),
    message: input.message,
    remindAt: input.remind_at,
    createdAt: new Date().toISOString(),
    triggered: false,
  });

  await save(store);
  return `Reminder set: "${input.message}" at ${input.remind_at}`;
}

export async function executeReminderList(): Promise<string> {
  const store = await load();
  const active = store.reminders.filter((r) => !r.triggered);

  if (active.length === 0) {
    return "No active reminders. Homer's schedule is wide open (as usual).";
  }

  return active
    .map((r) => `- "${r.message}" at ${r.remindAt}`)
    .join("\n");
}
