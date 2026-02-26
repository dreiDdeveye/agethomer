/**
 * Conversation Sidebar Logic — OpenClaw style
 */

const convList = document.getElementById("conv-list");
const newConvBtn = document.getElementById("new-conv-btn");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.getElementById("sidebar");

// ─── Refresh conversation list ───────────────────────────

async function refreshConversations() {
  try {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    renderConversationList(data.conversations);
  } catch {
    // Silently fail
  }
}

function renderConversationList(conversations) {
  convList.innerHTML = "";

  if (conversations.length === 0) {
    const empty = document.createElement("div");
    empty.className = "sidebar-empty";
    empty.innerHTML = `
      <div class="sidebar-empty-icon">\uD83C\uDF69</div>
      <div>No conversations yet.<br>Say hi to Homer!</div>
    `;
    convList.appendChild(empty);
    return;
  }

  for (const conv of conversations) {
    const item = document.createElement("div");
    item.className = "conv-item" + (conv.id === currentConversationId ? " active" : "");
    item.dataset.id = conv.id;

    const icon = document.createElement("div");
    icon.className = "conv-icon";
    icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 4h12M3 8h9M3 12h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

    const title = document.createElement("span");
    title.className = "conv-title";
    title.textContent = conv.title;

    const date = document.createElement("span");
    date.className = "conv-date";
    date.textContent = formatDate(conv.updatedAt);

    const del = document.createElement("button");
    del.className = "conv-delete";
    del.textContent = "\u00D7";
    del.title = "Delete";
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteConversation(conv.id);
    });

    item.appendChild(icon);
    item.appendChild(title);
    item.appendChild(date);
    item.appendChild(del);

    item.addEventListener("click", () => {
      loadConversation(conv.id);
      setActiveConv(conv.id);
      closeSidebar();
    });

    convList.appendChild(item);
  }
}

function setActiveConv(id) {
  document.querySelectorAll(".conv-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === id);
  });
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

async function deleteConversation(id) {
  try {
    await fetch("/api/conversations/" + id, { method: "DELETE" });
    if (id === currentConversationId) {
      await newConversation();
    }
    refreshConversations();
  } catch {
    // fail silently
  }
}

async function newConversation() {
  try {
    const res = await fetch("/api/conversations", { method: "POST" });
    const data = await res.json();
    currentConversationId = data.id;
    document.getElementById("messages").innerHTML = "";
    document.getElementById("tool-log-entries").innerHTML = "";
    appendHomerMessage(data.greeting);
    refreshConversations();
  } catch {
    // fail silently
  }
}

// ─── Sidebar toggle ──────────────────────────────────────

function closeSidebar() {
  sidebar.classList.remove("open");
}

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

if (newConvBtn) {
  newConvBtn.addEventListener("click", async () => {
    await newConversation();
    closeSidebar();
  });
}

// Initial load
refreshConversations();
