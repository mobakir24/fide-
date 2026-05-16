/* ============================================================
   app.js — Main entry point, runs on every page
   Handles: navbar scroll effect, scroll fade animations
   ============================================================ */

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupNavbarScroll();
  setupScrollFadeIn();
  setupActiveNavLinks();
});

/* ============================================================
   NAVBAR
   ============================================================ */

// ── Add shadow to navbar on scroll ────────────────────────────
function setupNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ── Highlight active nav link based on current page ───────────
function setupActiveNavLinks() {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks    = document.querySelectorAll('.nav-links a');

  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });
}

/* ============================================================
   ANIMATIONS
   ============================================================ */

// ── Fade in elements when they enter the viewport ─────────────
function setupScrollFadeIn() {
  const fadeElements = document.querySelectorAll('.fade-in');
  if (!fadeElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Stop observing once visible
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  fadeElements.forEach(el => observer.observe(el));
}

/* ============================================================
   HELPERS
   ============================================================ */

// ── Get value from localStorage safely ────────────────────────
function getStorageItem(key, fallback = '') {
  return localStorage.getItem(key) || fallback;
}

// ── Set value in localStorage safely ──────────────────────────
function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Storage error:', error);
  }
}