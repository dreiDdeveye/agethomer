/**
 * Landing Page — Scroll Storytelling
 * Scene-aware navigation, terminal animation, feature drag scroll,
 * interactive dashboard mock, CTA transitions
 */

// ─── Elements ───────────────────────────────────
const scenes = document.getElementById("scenes");
const dots = document.querySelectorAll(".dot-nav .dot");
const sceneNav = document.getElementById("scene-nav");
const scrollHint = document.getElementById("scroll-hint");
const heroTerminal = document.getElementById("hero-terminal");
const overlay = document.getElementById("transition-overlay");

// ─── Dot Navigation — track active scene ────────

const sceneEls = document.querySelectorAll(".scene");
let currentScene = 0;

const sceneObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = Array.from(sceneEls).indexOf(entry.target);
        if (idx >= 0) {
          currentScene = idx;
          updateDots(idx);
          updateNavbar(idx);
          fadeScrollHint(idx);
        }
      }
    });
  },
  {
    root: scenes,
    threshold: 0.6,
  }
);

sceneEls.forEach((el) => sceneObserver.observe(el));

function updateDots(activeIdx) {
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === activeIdx);
  });
}

// Dot click → scroll to scene
dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const idx = parseInt(dot.dataset.scene, 10);
    const target = document.getElementById(`scene-${idx}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ─── Navbar hide on scene 0, show on others ─────

function updateNavbar(idx) {
  if (idx === 0) {
    sceneNav.classList.add("hidden");
  } else {
    sceneNav.classList.remove("hidden");
  }
}

// Initially hidden (scene 0 is showing)
sceneNav.classList.add("hidden");

// ─── Scroll hint fade after first scroll ────────

function fadeScrollHint(idx) {
  if (idx > 0 && scrollHint) {
    scrollHint.classList.add("faded");
  }
}

// ─── Scene Enter Animations ─────────────────────
// Reveal .scene-enter elements when their parent scene scrolls into view

function revealSceneElements(sceneEl) {
  const els = sceneEl.querySelectorAll(".scene-enter:not(.visible)");
  els.forEach((el) => el.classList.add("visible"));
}

// Scene 0 (intro) — reveal immediately on load
setTimeout(() => revealSceneElements(document.getElementById("scene-0")), 100);

// For other scenes, reveal when they come into view
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        revealSceneElements(entry.target);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    root: scenes,
    threshold: 0.2,
  }
);

document.querySelectorAll(".scene").forEach((el, i) => {
  if (i > 0) revealObserver.observe(el);
});

// ─── Terminal Typing Animation ──────────────────

const termLine1 = document.getElementById("term-line-1");
const termLine2 = document.getElementById("term-line-2");
const termLine3 = document.getElementById("term-line-3");
const typingTarget = document.getElementById("typing-target");
const terminalCursor = document.getElementById("terminal-cursor");

const typingText =
  "Mmm... let me use my brain calculator thingy... 847 divided by 3 is 282.333! See? I'm practically a mathlete! *takes bite of donut*";

let charIndex = 0;
let terminalAnimStarted = false;

function typeNextChar() {
  if (charIndex < typingText.length) {
    typingTarget.textContent += typingText[charIndex];
    charIndex++;
    let delay = 35;
    const ch = typingText[charIndex - 1];
    if (ch === " ") delay = 20;
    else if (ch === "." || ch === "!" || ch === "?") delay = 120;
    else if (ch === ",") delay = 80;
    else if (ch === "*") delay = 60;
    setTimeout(typeNextChar, delay);
  } else {
    setTimeout(() => {
      if (terminalCursor) terminalCursor.style.opacity = "0";
    }, 2500);
  }
}

function startTerminalSequence() {
  if (terminalAnimStarted) return;
  terminalAnimStarted = true;

  setTimeout(() => {
    if (termLine1) termLine1.classList.add("visible");
  }, 400);

  setTimeout(() => {
    if (termLine2) termLine2.classList.add("visible");
  }, 1200);

  setTimeout(() => {
    if (termLine3) termLine3.classList.add("visible");
    setTimeout(typeNextChar, 300);
  }, 2000);
}

// Trigger terminal animation when Scene 2 is visible
if (heroTerminal) {
  const terminalObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startTerminalSequence();
          terminalObserver.unobserve(entry.target);
        }
      });
    },
    {
      root: scenes,
      threshold: 0.3,
    }
  );
  terminalObserver.observe(heroTerminal);
}

// ─── Feature Cards — Horizontal Drag Scroll ─────

const featuresTrack = document.getElementById("features-track");

if (featuresTrack) {
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;

  featuresTrack.addEventListener("mousedown", (e) => {
    isDragging = true;
    featuresTrack.style.cursor = "grabbing";
    startX = e.pageX - featuresTrack.offsetLeft;
    scrollLeft = featuresTrack.scrollLeft;
  });

  featuresTrack.addEventListener("mouseleave", () => {
    isDragging = false;
    featuresTrack.style.cursor = "grab";
  });

  featuresTrack.addEventListener("mouseup", () => {
    isDragging = false;
    featuresTrack.style.cursor = "grab";
  });

  featuresTrack.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - featuresTrack.offsetLeft;
    const walk = (x - startX) * 1.5;
    featuresTrack.scrollLeft = scrollLeft - walk;
  });
}

// ─── CTA Transition Overlay ─────────────────────

function triggerTransition(e) {
  e.preventDefault();
  document.body.classList.add("transitioning");
  overlay.classList.add("active");

  setTimeout(() => {
    window.location.href = "/chat";
  }, 900);
}

document.getElementById("hero-cta")?.addEventListener("click", triggerTransition);
document.getElementById("final-cta")?.addEventListener("click", triggerTransition);
document.getElementById("nav-cta")?.addEventListener("click", triggerTransition);

// ─── Install Block — Tab Switch + Copy ───────────

const installCommands = {
  npx: "npx homer-agent",
  npm: "npm install -g homer-agent",
  git: "git clone https://github.com/user/homer-agent.git",
};

const installTabs = document.querySelectorAll(".install-tab");
const installCmd = document.getElementById("install-cmd");
const installCopy = document.getElementById("install-copy");

installTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    installTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const key = tab.dataset.cmd;
    if (installCmd && installCommands[key]) {
      installCmd.textContent = installCommands[key];
    }
  });
});

if (installCopy && installCmd) {
  installCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(installCmd.textContent).then(() => {
      installCopy.classList.add("copied");
      installCopy.innerHTML = '<i class="icon-check"></i>';
      setTimeout(() => {
        installCopy.classList.remove("copied");
        installCopy.innerHTML = '<i class="icon-copy"></i>';
      }, 2000);
    });
  });
}

// ─── Smooth scroll for anchor links ─────────────

document.querySelectorAll('a[href^="#scene-"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    e.preventDefault();
    const href = anchor.getAttribute("href");
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ─── Interactive Dashboard Preview ──────────────

const mockInput = document.getElementById("mock-input-field");
const mockSendBtn = document.getElementById("mock-send-btn");
const mockChat = document.getElementById("mock-chat");

const homerResponses = [
  "Mmm... that's a great question! Let me think about it while I eat this donut... *chomp* ...what were we talking about?",
  "D'oh! I knew the answer to that once, but I think the beer washed it away.",
  "Woo-hoo! You're talking to the smartest guy at the Springfield Nuclear Power Plant! ...okay, maybe second smartest. After the inanimate carbon rod.",
  "Let me use my calculator thingy... *presses random buttons* ...the answer is donut! Wait, that can't be right.",
  "Marge always says I should listen more carefully. What? Sorry, I was thinking about pork chops.",
  "Ooh, that reminds me of the time I... actually, I forget. But it involved a monkey and a barrel of Duff!",
  "As safety inspector of Sector 7-G, I can confidently say: I have no idea. But here's a fun fact — donuts have zero calories if nobody sees you eat them!",
  "*scratches head* Hmm, that's above my pay grade. And my pay grade is pretty low. Like, really low.",
];

function addMockMessage(text, isUser) {
  if (!mockChat) return;
  const msg = document.createElement("div");
  msg.className = `mock-msg ${isUser ? "mock-msg-user" : "mock-msg-homer"}`;

  if (isUser) {
    msg.innerHTML = `<div class="mock-bubble">${escapeHtml(text)}</div>`;
  } else {
    msg.innerHTML = `
      <div class="mock-avatar"><i class="icon-bot" style="font-size:0.6rem"></i></div>
      <div class="mock-msg-text">${escapeHtml(text)}</div>
    `;
  }

  msg.style.animation = "msg-in 0.3s ease-out";
  mockChat.appendChild(msg);
  mockChat.scrollTop = mockChat.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showMockTyping() {
  const typing = document.createElement("div");
  typing.className = "mock-msg mock-msg-homer";
  typing.id = "mock-typing-indicator";
  typing.innerHTML = `
    <div class="mock-avatar"><i class="icon-bot" style="font-size:0.6rem"></i></div>
    <div class="mock-typing">
      <div class="mock-typing-dots"><span></span><span></span><span></span></div>
      <span>Homer is thinking...</span>
    </div>
  `;
  mockChat.appendChild(typing);
  mockChat.scrollTop = mockChat.scrollHeight;
}

function hideMockTyping() {
  const typing = document.getElementById("mock-typing-indicator");
  if (typing) typing.remove();
}

function handleMockSend() {
  if (!mockInput) return;
  const text = mockInput.value.trim();
  if (!text) return;

  mockInput.value = "";
  addMockMessage(text, true);
  showMockTyping();

  const delay = 1200 + Math.random() * 1500;
  setTimeout(() => {
    hideMockTyping();
    const response = homerResponses[Math.floor(Math.random() * homerResponses.length)];
    addMockMessage(response, false);
  }, delay);
}

if (mockSendBtn) {
  mockSendBtn.addEventListener("click", handleMockSend);
}
if (mockInput) {
  mockInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMockSend();
    }
  });
}
