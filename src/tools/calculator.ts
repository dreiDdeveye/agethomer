/**
 * Calculator tool — safe math evaluation for Homer's deficient brain.
 */

import OpenAI from "openai";

export const CALCULATOR_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "calculator",
    description:
      "Perform math calculations. Homer's brain can't do math, but this tool can! Supports +, -, *, /, parentheses, exponents (**), and modulo (%).",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Math expression to evaluate, e.g. '(42 + 8) * 3'",
        },
      },
      required: ["expression"],
    },
  },
};

export function executeCalculator(input: { expression: string }): string {
  const expr = input.expression.replace(/\s/g, "");

  // Whitelist: only digits, operators, parens, decimal points
  if (!/^[\d+\-*/().%e]+$/i.test(expr)) {
    throw new Error(
      `D'oh! Invalid math expression. Only numbers and +, -, *, /, (, ), %, ** are allowed.`,
    );
  }

  // Replace ** with Math.pow for safety
  const safeExpr = expr.replace(/\*\*/g, "**");

  try {
    const result = new Function(`"use strict"; return (${safeExpr})`)() as number;
    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error("Result is not a valid number");
    }
    return `${input.expression} = ${result}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Math error: ${msg}`);
  }
}
