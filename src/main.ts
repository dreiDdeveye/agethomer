/**
 * Entry point — fire up Homer and start chatting.
 * Run with: npm run dev
 */

import * as readline from "readline";
import { HomerAgent } from "./homer.js";
import { validateConfig } from "./config.js";

const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function printBanner(): void {
  console.log(YELLOW);
  console.log(`  ╔══════════════════════════════════════════╗`);
  console.log(`  ║        ${BOLD}HOMER SIMPSON AI AGENT${RESET}${YELLOW}           ║`);
  console.log(`  ║    "D'oh! I mean... Welcome to my brain" ║`);
  console.log(`  ╚══════════════════════════════════════════╝`);
  console.log(RESET);
  console.log(
    `${DIM}  Type your message to talk to Homer.${RESET}`
  );
  console.log(
    `${DIM}  Type "quit" or "exit" to leave Moe's Tavern.${RESET}`
  );
  console.log(
    `${DIM}  Type "reset" to start a new conversation.${RESET}`
  );
  console.log();
}

async function main(): Promise<void> {
  validateConfig();
  printBanner();

  const homer = new HomerAgent();

  // Homer greets you
  console.log(`${YELLOW}Homer:${RESET} ${homer.greet()}`);
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (): void => {
    rl.question(`${CYAN}You:${RESET} `, async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === "quit" || trimmed.toLowerCase() === "exit") {
        console.log(
          `\n${YELLOW}Homer:${RESET} Aww, you're leaving? But I was just about to tell you about the time I... *falls asleep* Zzzzz...\n`
        );
        rl.close();
        return;
      }

      if (trimmed.toLowerCase() === "reset") {
        homer.reset();
        console.log(
          `\n${DIM}[Conversation reset — Homer bumped his head and forgot everything]${RESET}\n`
        );
        console.log(`${YELLOW}Homer:${RESET} ${homer.greet()}`);
        console.log();
        prompt();
        return;
      }

      process.stdout.write(`\n${YELLOW}Homer:${RESET} `);

      try {
        await homer.chat(trimmed);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\n${DIM}[D'oh! Error: ${message}]${RESET}`);
      }

      console.log("\n");
      prompt();
    });
  };

  prompt();
}

main();
