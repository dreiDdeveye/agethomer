/**
 * Homer Simpson Agent — Main Chat Logic
 * OpenClaw-style dark UI with Simpsons personality.
 */

const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const typingIndicator = document.getElementById("typing-indicator");
const skeletonLoader = document.getElementById("skeleton-loader");

let isStreaming = false;
let currentConversationId = null;
let currentMode = "classic";

// ─── Sound Effects (Web Audio API) ──────────────────────

let soundEnabled = false;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, duration, type, volume) {
  if (!soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume || 0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playSendSound() {
  playTone(880, 0.12, "sine", 0.06);
  setTimeout(() => playTone(1100, 0.1, "sine", 0.04), 60);
}

function playReceiveSound() {
  playTone(660, 0.15, "sine", 0.06);
  setTimeout(() => playTone(520, 0.12, "sine", 0.05), 80);
}

function playToolSound() {
  playTone(440, 0.08, "triangle", 0.05);
  setTimeout(() => playTone(660, 0.08, "triangle", 0.04), 50);
  setTimeout(() => playTone(880, 0.1, "triangle", 0.03), 100);
}

function playErrorSound() {
  playTone(300, 0.2, "sawtooth", 0.04);
  setTimeout(() => playTone(200, 0.3, "sawtooth", 0.03), 100);
}

// Sound toggle button
const soundToggle = document.getElementById("sound-toggle");
if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    initAudio();
    soundEnabled = !soundEnabled;
    soundToggle.classList.toggle("muted", !soundEnabled);
    if (soundEnabled) playTone(880, 0.1, "sine", 0.05);
  });
}

// ─── SVG Homer Avatar ───────────────────────────────────

function getHomerExpression(text) {
  const lower = text.toLowerCase();
  if (lower.includes("d'oh") || lower.includes("\u2019oh") || lower.includes("stupid")) return "homer-doh";
  if (lower.includes("woohoo") || lower.includes("woo-hoo") || lower.includes("awesome") || lower.includes("great")) return "homer-happy";
  if (lower.includes("mmm") || lower.includes("think") || lower.includes("let me")) return "homer-thinking";
  if (lower.includes("why you little") || lower.includes("angry") || lower.includes("hate")) return "homer-angry";
  if (lower.includes("zzz") || lower.includes("sleep") || lower.includes("tired") || lower.includes("boring")) return "homer-sleepy";
  if (lower.includes("beer") || lower.includes("duff") || lower.includes("drink") || lower.includes("moe")) return "homer-beer";
  return "homer-default";
}

function createHomerAvatarSVG(expressionId) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("width", "32");
  svg.setAttribute("height", "32");

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + expressionId);
  svg.appendChild(use);
  return svg;
}

function updateAvatarExpression(avatarEl, text) {
  const expressionId = getHomerExpression(text);
  avatarEl.innerHTML = "";
  avatarEl.appendChild(createHomerAvatarSVG(expressionId));
}

// ─── Typing Personality ─────────────────────────────────

const typingPhrases = [
  "Homer is thinking...",
  "Mmm... brain is loading...",
  "D'oh! Let me think...",
  "Consulting the donut oracle...",
  "Homer's brain: *elevator music*",
  "Checking with Sector 7-G...",
  "Asking the magic donut...",
  "*Homer scratches head*",
  "Brain cells assembling...",
  "One moment... almost got it...",
];

let typingPhraseInterval = null;

function startTypingPhrases() {
  const phraseEl = document.getElementById("typing-phrase");
  if (!phraseEl) return;
  phraseEl.textContent = typingPhrases[Math.floor(Math.random() * typingPhrases.length)];
  typingPhraseInterval = setInterval(() => {
    phraseEl.textContent = typingPhrases[Math.floor(Math.random() * typingPhrases.length)];
  }, 2500);
}

function stopTypingPhrases() {
  if (typingPhraseInterval) {
    clearInterval(typingPhraseInterval);
    typingPhraseInterval = null;
  }
}

// ─── Loading skeleton ───────────────────────────────────

function hideSkeleton() {
  if (skeletonLoader) skeletonLoader.classList.add("hidden");
}

// ─── Initialization ─────────────────────────────────────

async function init() {
  try {
    const statusRes = await fetch("/api/status");
    const status = await statusRes.json();
    currentMode = status.mode;
    currentConversationId = status.conversationId;

    const greetRes = await fetch("/api/greet");
    const greetData = await greetRes.json();
    hideSkeleton();
    appendHomerMessage(greetData.greeting);
    playReceiveSound();
  } catch {
    hideSkeleton();
    appendHomerMessage(
      "D'oh! Something went wrong loading Homer's brain... Try refreshing!"
    );
  }
  inputEl.focus();
}

// ─── Tool helpers ───────────────────────────────────────

function getToolIcon(name) {
  const icons = {
    calculator: "\uD83E\uDDEE",
    memory_save: "\uD83D\uDCBE",
    memory_recall: "\uD83D\uDD0D",
    memory_list: "\uD83D\uDCDA",
    reminder_set: "\u23F0",
    reminder_list: "\uD83D\uDCCB",
  };
  return icons[name] || "\u2699\uFE0F";
}

function getToolLabel(name) {
  const labels = {
    calculator: "Calculator",
    memory_save: "Saving Memory",
    memory_recall: "Recalling Memory",
    memory_list: "Listing Memories",
    reminder_set: "Setting Reminder",
    reminder_list: "Listing Reminders",
  };
  return labels[name] || name;
}

// ─── Message rendering ──────────────────────────────────

function appendHomerMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-homer";

  const avatar = document.createElement("div");
  avatar.className = "homer-avatar";
  avatar.appendChild(createHomerAvatarSVG(getHomerExpression(text)));

  const bubble = document.createElement("div");
  bubble.className = "bubble-homer";
  bubble.textContent = text;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);
  scrollToBottom();

  return { bubble, avatar };
}

function appendUserMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-user";

  const bubble = document.createElement("div");
  bubble.className = "bubble-user";
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);
  scrollToBottom();
}

function scrollToBottom() {
  const container = document.getElementById("chat-container");
  container.scrollTop = container.scrollHeight;
}

// ─── Thinking block ─────────────────────────────────────

function createThinkingBlock() {
  const block = document.createElement("div");
  block.className = "thinking-block";
  block.innerHTML = `
    <div class="thinking-header">
      <span>\uD83E\uDDE0</span>
      <span>Homer's Brain</span>
      <span class="thinking-toggle">\u25BC</span>
    </div>
    <div class="thinking-content"></div>
  `;

  block.querySelector(".thinking-header").addEventListener("click", () => {
    block.classList.toggle("collapsed");
  });

  messagesEl.appendChild(block);
  scrollToBottom();

  return {
    block,
    content: block.querySelector(".thinking-content"),
  };
}

// ─── Tool log ───────────────────────────────────────────

function addToolLogEntry(name, status) {
  const entries = document.getElementById("tool-log-entries");
  const entry = document.createElement("div");
  entry.className = "tool-entry";

  const statusClass = status === "pending" ? "pending" : status === "error" ? "error" : "success";
  const statusText = status === "pending" ? "Running" : status === "error" ? "Error" : "Done";

  entry.innerHTML = `
    <span class="tool-icon">${getToolIcon(name)}</span>
    <span class="tool-name">${getToolLabel(name)}</span>
    <span class="tool-status ${statusClass}">${statusText}</span>
  `;

  entries.appendChild(entry);
  return entry;
}

// ─── Streaming chat ─────────────────────────────────────

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || isStreaming) return;

  isStreaming = true;
  inputEl.value = "";
  inputEl.style.height = "auto";
  sendBtn.disabled = true;
  sendBtn.classList.add("loading");

  appendUserMessage(text);
  playSendSound();
  typingIndicator.classList.remove("hidden");
  startTypingPhrases();
  scrollToBottom();

  let thinkingBlock = null;
  let thinkingContent = null;
  let thinkingText = "";
  let homerBubble = null;
  let homerAvatar = null;
  let fullText = "";
  let currentToolEntry = null;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        conversationId: currentConversationId,
      }),
    });

    typingIndicator.classList.add("hidden");
    stopTypingPhrases();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        let data;
        try {
          data = JSON.parse(line.slice(6));
        } catch {
          continue;
        }

        switch (data.type) {
          case "thinking":
            if (!thinkingBlock) {
              const tb = createThinkingBlock();
              thinkingBlock = tb.block;
              thinkingContent = tb.content;
            }
            thinkingText += data.text;
            thinkingContent.textContent = thinkingText;
            scrollToBottom();
            break;

          case "tool_use":
            showActiveTool(data.name);
            currentToolEntry = addToolLogEntry(data.name, "pending");
            playToolSound();
            break;

          case "tool_result":
            hideActiveTool();
            if (currentToolEntry) {
              const statusEl = currentToolEntry.querySelector(".tool-status");
              if (data.isError) {
                statusEl.className = "tool-status error";
                statusEl.textContent = "Error";
                playErrorSound();
              } else {
                statusEl.className = "tool-status success";
                statusEl.textContent = "Done";
              }
            }
            if (data.name && data.name.startsWith("memory_")) {
              refreshMemoryCount();
            }
            if (currentMode === "dev" && thinkingContent) {
              const debugLine = document.createElement("div");
              debugLine.style.color = data.isError ? "#EF5350" : "#66BB6A";
              debugLine.style.marginTop = "4px";
              debugLine.textContent = `[${data.name}] ${data.result}`;
              thinkingContent.appendChild(debugLine);
            }
            thinkingText = "";
            thinkingBlock = null;
            thinkingContent = null;
            break;

          case "chunk":
            if (!homerBubble) {
              const msg = appendHomerMessage("");
              homerBubble = msg.bubble;
              homerAvatar = msg.avatar;
            }
            fullText += data.text;
            homerBubble.textContent = fullText;
            scrollToBottom();
            break;

          case "done":
            hideActiveTool();
            if (homerAvatar && fullText) {
              updateAvatarExpression(homerAvatar, fullText);
            }
            playReceiveSound();
            if (typeof refreshConversations === "function") {
              refreshConversations();
            }
            break;

          case "error":
            typingIndicator.classList.add("hidden");
            stopTypingPhrases();
            if (!homerBubble) {
              const msg = appendHomerMessage("");
              homerBubble = msg.bubble;
            }
            homerBubble.textContent = "D'oh! Error: " + data.error;
            playErrorSound();
            break;
        }
      }
    }
  } catch {
    typingIndicator.classList.add("hidden");
    stopTypingPhrases();
    appendHomerMessage(
      "*Homer stares blankly at his computer* ...Stupid internet! D'oh!"
    );
    playErrorSound();
  }

  isStreaming = false;
  sendBtn.disabled = false;
  sendBtn.classList.remove("loading");
  inputEl.focus();
}

// ─── Reset ──────────────────────────────────────────────

async function resetConversation() {
  if (isStreaming) return;
  try {
    const res = await fetch("/api/reset", { method: "POST" });
    const data = await res.json();
    messagesEl.innerHTML = "";
    document.getElementById("tool-log-entries").innerHTML = "";
    currentConversationId = data.conversationId;
    appendHomerMessage(data.greeting);
    if (typeof refreshConversations === "function") {
      refreshConversations();
    }
  } catch {
    appendHomerMessage("*Homer hits head on keyboard* D'oh! Can't reset!");
  }
}

// ─── Load a conversation ────────────────────────────────

async function loadConversation(id) {
  if (isStreaming) return;
  try {
    const res = await fetch("/api/conversations/" + id);
    const conv = await res.json();

    currentConversationId = conv.id;
    messagesEl.innerHTML = "";
    document.getElementById("tool-log-entries").innerHTML = "";

    for (const msg of conv.messages) {
      if (msg.role === "user" && typeof msg.content === "string") {
        appendUserMessage(msg.content);
      } else if (msg.role === "assistant") {
        const content = Array.isArray(msg.content) ? msg.content : [{ type: "text", text: msg.content }];
        for (const block of content) {
          if (block.type === "text" && block.text) {
            appendHomerMessage(block.text);
          }
        }
      }
    }

    if (conv.mode) {
      currentMode = conv.mode;
      if (typeof setActiveMode === "function") {
        setActiveMode(conv.mode);
      }
    }
  } catch {
    appendHomerMessage("D'oh! Couldn't load that conversation!");
  }
}

// ─── Auto-resize textarea ───────────────────────────────

inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 150) + "px";
});

// ─── Event listeners ────────────────────────────────────

sendBtn.addEventListener("click", sendMessage);

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Boot!
init();
