/**
 * Configuration for the Homer Simpson agent.
 * Uses the OpenAI API.
 */

import "dotenv/config";

export const CONFIG = {
  /** Model to use */
  model: process.env.MODEL || "gpt-4o-mini",

  /** Max output tokens per response */
  maxTokens: 1024,

  /** Max agentic loop iterations (safety cap) */
  maxIterations: 10,

  /** OpenAI API key from environment */
  apiKey: process.env.OPENAI_API_KEY || "",

  /** OpenAI API */
  baseUrl: "https://api.openai.com/v1",
} as const;

export function validateConfig(strict = false): void {
  if (!CONFIG.apiKey || CONFIG.apiKey === "your-openai-api-key-here") {
    const msg =
      "\n  D'oh! Missing OPENAI_API_KEY in your .env file.\n" +
      "  Get your key at: https://platform.openai.com/api-keys\n";
    if (strict) {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(msg + "  Chat will not work until you add it.\n");
    }
  }
}
