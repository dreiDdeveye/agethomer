/**
 * Tool registry — all tools Homer can use, and a dispatcher.
 */

import OpenAI from "openai";
import { CALCULATOR_TOOL, executeCalculator } from "./calculator.js";
import {
  MEMORY_SAVE_TOOL,
  MEMORY_RECALL_TOOL,
  MEMORY_LIST_TOOL,
  executeMemorySave,
  executeMemoryRecall,
  executeMemoryList,
} from "./memory.js";
import {
  REMINDER_SET_TOOL,
  REMINDER_LIST_TOOL,
  executeReminderSet,
  executeReminderList,
} from "./reminder.js";

/** All tool definitions for the Kimi API (OpenAI format) */
export const TOOL_DEFINITIONS: OpenAI.ChatCompletionTool[] = [
  CALCULATOR_TOOL,
  MEMORY_SAVE_TOOL,
  MEMORY_RECALL_TOOL,
  MEMORY_LIST_TOOL,
  REMINDER_SET_TOOL,
  REMINDER_LIST_TOOL,
];

/** Execute a tool by name and return the result string */
export async function executeTool(
  name: string,
  input: unknown,
): Promise<string> {
  switch (name) {
    case "calculator":
      return executeCalculator(input as { expression: string });
    case "memory_save":
      return executeMemorySave(
        input as { key: string; value: string; category?: string },
      );
    case "memory_recall":
      return executeMemoryRecall(input as { query: string });
    case "memory_list":
      return executeMemoryList();
    case "reminder_set":
      return executeReminderSet(
        input as { message: string; remind_at: string },
      );
    case "reminder_list":
      return executeReminderList();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
