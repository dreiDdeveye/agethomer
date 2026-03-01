/**
 * Configuration for the Homer Simpson agent.
 * Uses xAI's Grok API (OpenAI-compatible).
 */

import "dotenv/config";

export const CONFIG = {
  /** Model to use (xAI Grok) */
  model: process.env.MODEL || "grok-3-mini-fast-beta",

  /** Max output tokens per response */
  maxTokens: 1024,

  /** Max agentic loop iterations (safety cap) */
  maxIterations: 10,

  /** xAI API key from environment */
  apiKey: process.env.XAI_API_KEY || "",

  /** xAI API (OpenAI-compatible) */
  baseUrl: "https://api.x.ai/v1",
} as const;

export function validateConfig(strict = false): void {
  if (!CONFIG.apiKey || CONFIG.apiKey === "your-xai-api-key-here") {
    const msg =
      "\n  D'oh! Missing XAI_API_KEY in your .env file.\n" +
      "  Get your key at: https://console.x.ai/\n";
    if (strict) {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(msg + "  Chat will not work until you add it.\n");
    }
  }
}
