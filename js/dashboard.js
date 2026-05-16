/* ============================================================
   dashboard.js — Handles Child and Parent dashboard logic
   ============================================================ */

// ── Constants ──────────────────────────────────────────────────
const STORAGE_KEYS = {
  userName:      'userName',
  userType:      'userType',
  childXP:       'childXP',
  childProgress: 'childProgress',
};

const TOTAL_LESSONS = 4;

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const userType = localStorage.getItem(STORAGE_KEYS.userType);

  // Redirect to login if no session found
  if (!userType) {
    window.location.href = '../pages/login.html';
    return;
  }

  if (userType === 'child') {
    initChildDashboard();
  } else {
    initParentDashboard();
  }
});

/* ============================================================
   CHILD DASHBOARD
   ============================================================ */

// ── State ──────────────────────────────────────────────────────
let currentXP             = 0;
let completedLessonsCount = 0;

// ── Init Child Dashboard ───────────────────────────────────────
function initChildDashboard() {
  const nameEl = document.getElementById('childName');
  if (!nameEl) return;

  // Display saved child name
  const savedName = localStorage.getItem(STORAGE_KEYS.userName) || 'Explorer';
  nameEl.innerText = savedName;

  // Load saved XP and progress
  currentXP             = parseInt(localStorage.getItem(STORAGE_KEYS.childXP)) || 0;
  completedLessonsCount = parseInt(localStorage.getItem('completedLessonsCount')) || 0;

  updateXPDisplay();
  updateProgressDisplay();
}

// ── Complete a Lesson ──────────────────────────────────────────
function completeLesson(lessonId, xpReward) {
  const cardButton = document.querySelector(`#lesson${lessonId} .btn-action`);
  if (!cardButton || cardButton.classList.contains('completed')) return;

  // Mark lesson as completed
  cardButton.innerText = 'Completed 🎉';
  cardButton.classList.add('completed');
  cardButton.disabled = true;

  // Update XP
  currentXP += xpReward;
  completedLessonsCount++;

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.childXP, currentXP);
  localStorage.setItem('completedLessonsCount', completedLessonsCount);

  // Update UI
  updateXPDisplay();
  updateProgressDisplay();
}

// ── Update XP Display ──────────────────────────────────────────
function updateXPDisplay() {
  const xpEl = document.getElementById('xpCount');
  if (xpEl) xpEl.innerText = currentXP;
}

// ── Update Progress Bar ────────────────────────────────────────
function updateProgressDisplay() {
  const percentage = Math.round((completedLessonsCount / TOTAL_LESSONS) * 100);

  const progressBar  = document.getElementById('mainProgress');
  const progressText = document.getElementById('progressText');

  if (progressBar)  progressBar.style.width   = percentage + '%';
  if (progressText) progressText.innerText     = percentage + '% Completed';

  // Save overall progress
  localStorage.setItem(STORAGE_KEYS.childProgress, percentage);
}

/* ============================================================
   PARENT DASHBOARD
   ============================================================ */

// ── Init Parent Dashboard ──────────────────────────────────────
function initParentDashboard() {
  const nameEl = document.getElementById('parentName');
  if (!nameEl) return;

  // Display saved parent name
  const savedParentName = localStorage.getItem(STORAGE_KEYS.userName) || 'Parent';
  nameEl.innerText = savedParentName;

  // Load child data from localStorage
  const childName     = localStorage.getItem(STORAGE_KEYS.userName) || 'Your Child';
  const childXP       = localStorage.getItem(STORAGE_KEYS.childXP)       || '0';
  const childProgress = localStorage.getItem(STORAGE_KEYS.childProgress)  || '0';

  // Update parent dashboard UI
  setElementText('displayChildName',       childName);
  setElementText('totalFamilyXP',          childXP);
  setElementText('displayChildProgress',   childProgress + '%');

  const progressFill = document.getElementById('parentChildProgressFill');
  if (progressFill) progressFill.style.width = childProgress + '%';
}

// ── Generate Report ────────────────────────────────────────────
function generateReport() {
  const childName     = localStorage.getItem(STORAGE_KEYS.userName)       || 'Your Child';
  const childXP       = localStorage.getItem(STORAGE_KEYS.childXP)        || '0';
  const childProgress = localStorage.getItem(STORAGE_KEYS.childProgress)  || '0';

  alert(
    `Fide Report:\n\n` +
    `${childName} has completed ${childProgress}% of the financial literacy courses ` +
    `with a total of ${childXP} XP.\n\n` +
    `Report downloaded successfully! 📄`
  );
}

// ── Logout ─────────────────────────────────────────────────────
function logout() {
  localStorage.clear();
  window.location.href = '../pages/login.html';
}

/* ============================================================
   HELPERS
   ============================================================ */

// ── Set element text safely ────────────────────────────────────
function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}