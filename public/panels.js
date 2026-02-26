/**
 * Status Panel & Tool Activity Logic — OpenClaw style
 */

const activeToolCard = document.getElementById("active-tool-card");
const noToolMsg = document.getElementById("no-tool-msg");
const activeToolName = document.getElementById("active-tool-name");
const statusMemoryCount = document.getElementById("status-memory-count");
const statusModel = document.getElementById("status-model");
const topbarModel = document.getElementById("topbar-model");
const panelEl = document.getElementById("panel");
const panelToggle = document.getElementById("panel-toggle");
const panelClose = document.getElementById("panel-close");

// ─── Status refresh ──────────────────────────────────────

async function refreshStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();

    if (statusModel) statusModel.textContent = data.model;
    if (topbarModel) topbarModel.textContent = data.model;
    if (statusMemoryCount) statusMemoryCount.textContent = data.memoryCount;
    currentMode = data.mode;
    setActiveMode(data.mode);

    if (data.conversationId && !currentConversationId) {
      currentConversationId = data.conversationId;
    }
  } catch {
    // fail silently
  }
}

async function refreshMemoryCount() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    if (statusMemoryCount) statusMemoryCount.textContent = data.memoryCount;
  } catch {
    // fail silently
  }
}

// ─── Active tool indicator ───────────────────────────────

function showActiveTool(name) {
  if (activeToolCard && activeToolName) {
    activeToolCard.style.display = "";
    activeToolName.textContent = getToolLabel(name);
    if (noToolMsg) noToolMsg.style.display = "none";
  }
}

function hideActiveTool() {
  if (activeToolCard) {
    activeToolCard.style.display = "none";
  }
  if (noToolMsg) {
    noToolMsg.style.display = "";
  }
}

// ─── Mode toggle ─────────────────────────────────────────

function setActiveMode(mode) {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const mode = btn.dataset.mode;
    try {
      const res = await fetch("/api/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      currentMode = data.mode;
      setActiveMode(data.mode);
    } catch {
      // fail silently
    }
  });
});

// ─── Panel toggle ────────────────────────────────────────

if (panelToggle) {
  panelToggle.addEventListener("click", () => {
    if (panelEl) panelEl.classList.toggle("panel-open");
  });
}

if (panelClose) {
  panelClose.addEventListener("click", () => {
    if (panelEl) panelEl.classList.remove("panel-open");
  });
}

// Initial load
refreshStatus();
