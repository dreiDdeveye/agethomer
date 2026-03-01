#!/usr/bin/env node
/**
 * Homer Agent CLI — run from anywhere with npx homer-agent
 *
 *   homer-agent          → Terminal chat mode
 *   homer-agent --serve   → Web dashboard (http://localhost:3000)
 *   homer-agent --help    → Show usage
 */

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

if (args.includes("--serve") || args.includes("-s")) {
  startWeb();
} else {
  startCli();
}

function printUsage(): void {
  const Y = "\x1b[33m";
  const C = "\x1b[36m";
  const D = "\x1b[2m";
  const R = "\x1b[0m";
  const B = "\x1b[1m";

  console.log(`
${Y}${B}  HOMER SIMPSON AI AGENT${R}
${D}  "D'oh! I mean... Welcome to my brain"${R}

  ${B}Usage:${R}
    ${C}homer-agent${R}            Start terminal chat
    ${C}homer-agent --serve${R}    Start web dashboard
    ${C}homer-agent --help${R}     Show this help

  ${B}Environment:${R}
    ${C}OPENAI_API_KEY${R}         Your OpenAI API key ${D}(required)${R}
    ${C}PORT${R}                   Web server port ${D}(default: 3000)${R}
    ${C}MODEL${R}                  Model override ${D}(default: gpt-4o-mini)${R}

  ${B}Get your API key:${R}
    ${C}https://platform.openai.com/api-keys${R}
  `);
}

async function startCli(): Promise<void> {
  const readline = await import("readline");
  const { HomerAgent } = await import("./homer.js");
  const { validateConfig } = await import("./config.js");
  validateConfig(true);

  const YELLOW = "\x1b[33m";
  const CYAN = "\x1b[36m";
  const DIM = "\x1b[2m";
  const RESET = "\x1b[0m";
  const BOLD = "\x1b[1m";

  console.log(YELLOW);
  console.log(`  ╔══════════════════════════════════════════╗`);
  console.log(`  ║        ${BOLD}HOMER SIMPSON AI AGENT${RESET}${YELLOW}           ║`);
  console.log(`  ║    "D'oh! I mean... Welcome to my brain" ║`);
  console.log(`  ╚══════════════════════════════════════════╝`);
  console.log(RESET);
  console.log(`${DIM}  Type your message to talk to Homer.${RESET}`);
  console.log(`${DIM}  Type "quit" or "exit" to leave Moe's Tavern.${RESET}`);
  console.log(`${DIM}  Type "reset" to start a new conversation.${RESET}`);
  console.log();

  const homer = new HomerAgent();
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
        await homer.chat(trimmed, {
          onChunk: (text) => process.stdout.write(text),
        });
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

async function startWeb(): Promise<void> {
  // Dynamically import server — it self-starts on import
  await import("./server.js");
}
