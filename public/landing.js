/**
 * Landing Page Interactions — Homer Agent Funnel
 * Scroll effects, terminal animation, counter animation, CTA transition
 */

// ─── Navbar scroll: blur on scroll + hide/show on direction ─────

const navbar = document.getElementById("navbar");
let lastScrollY = 0;
let ticking = false;

function updateNavbar() {
  const scrollY = window.scrollY;

  // Blur background when scrolled
  if (scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }

  // Hide/show on scroll direction (only after 300px)
  if (scrollY > 300) {
    if (scrollY > lastScrollY + 5) {
      navbar.classList.add("hidden");
    } else if (scrollY < lastScrollY - 5) {
      navbar.classList.remove("hidden");
    }
  } else {
    navbar.classList.remove("hidden");
  }

  lastScrollY = scrollY;
  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(updateNavbar);
    ticking = true;
  }
});

// ─── Scroll-triggered fade-ins ──────────────────────────

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
);

document.querySelectorAll(".fade-in").forEach((el) => fadeObserver.observe(el));

// ─── Animated number counters ───────────────────────────

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll(".counter").forEach((el) => counterObserver.observe(el));

function animateCounter(el, target) {
  let current = 0;
  const step = Math.max(1, Math.floor(target / 15));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 60);
}

// ─── Terminal sequenced animation ───────────────────────

const termLine1 = document.getElementById("term-line-1");
const termLine2 = document.getElementById("term-line-2");
const termLine3 = document.getElementById("term-line-3");
const typingTarget = document.getElementById("typing-target");
const terminalCursor = document.getElementById("terminal-cursor");
const heroTerminal = document.getElementById("hero-terminal");

const typingText =
  "Mmm... let me use my brain calculator thingy... 847 divided by 3 is 282.333! See? I'm practically a mathlete! *takes bite of donut*";

let charIndex = 0;
let terminalAnimStarted = false;

function typeNextChar() {
  if (charIndex < typingText.length) {
    typingTarget.textContent += typingText[charIndex];
    charIndex++;
    // Variable speed: faster for spaces, slower for punctuation
    let delay = 35;
    const ch = typingText[charIndex - 1];
    if (ch === " ") delay = 20;
    else if (ch === "." || ch === "!" || ch === "?") delay = 120;
    else if (ch === ",") delay = 80;
    else if (ch === "*") delay = 60;
    setTimeout(typeNextChar, delay);
  } else {
    // Done typing — cursor blinks then fades
    setTimeout(() => {
      if (terminalCursor) terminalCursor.style.opacity = "0";
    }, 2500);
  }
}

function startTerminalSequence() {
  if (terminalAnimStarted) return;
  terminalAnimStarted = true;

  // Step 1: User message appears
  setTimeout(() => {
    if (termLine1) termLine1.classList.add("visible");
  }, 400);

  // Step 2: Tool chip appears
  setTimeout(() => {
    if (termLine2) termLine2.classList.add("visible");
  }, 1200);

  // Step 3: Homer starts typing
  setTimeout(() => {
    if (termLine3) termLine3.classList.add("visible");
    setTimeout(typeNextChar, 300);
  }, 2000);
}

// Trigger terminal animation when visible
const terminalObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        startTerminalSequence();
        terminalObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

if (heroTerminal) {
  terminalObserver.observe(heroTerminal);
}

// ─── CTA transition overlay ────────────────────────────

const overlay = document.getElementById("transition-overlay");

function triggerTransition(e) {
  e.preventDefault();
  document.body.classList.add("transitioning");
  overlay.classList.add("active");

  setTimeout(() => {
    window.location.href = "/chat";
  }, 900);
}

// Attach to all CTA buttons
document.getElementById("hero-cta")?.addEventListener("click", triggerTransition);
document.getElementById("final-cta")?.addEventListener("click", triggerTransition);
document.getElementById("nav-cta")?.addEventListener("click", triggerTransition);

// ─── Smooth scroll for anchor links ─────────────────────

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const href = anchor.getAttribute("href");
    if (href === "#") return; // CTAs handled above
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      // Offset for fixed navbar
      const offset = navbar.offsetHeight + 20;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  });
});

// ─── Parallax-lite: hero glow follows scroll ────────────

const heroGlow = document.querySelector(".hero-glow");

if (heroGlow) {
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      heroGlow.style.transform = `translateX(-50%) translateY(${scrollY * 0.15}px)`;
    }
  });
}
