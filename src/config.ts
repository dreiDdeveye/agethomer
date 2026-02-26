/**
 * Configuration for the Homer Simpson agent.
 */

import "dotenv/config";

export const CONFIG = {
  /** Ollama model to use */
  model: "llama3.2",

  /** Max output tokens per response */
  maxTokens: 512,

  /** Max agentic loop iterations (safety cap) */
  maxIterations: 10,

  /** Ollama needs no API key — use a dummy value for OpenAI SDK */
  apiKey: "ollama",

  /** Ollama local API (OpenAI-compatible) */
  baseUrl: "http://localhost:11434/v1",
} as const;

export function validateConfig(): void {
  // No API key needed for Ollama — just check the server is reachable
}
