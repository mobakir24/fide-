/* ============================================================
   dashboard.js — Handles Child and Parent dashboard logic
   ============================================================ */

// ── Constants ──────────────────────────────────────────────────
const STORAGE_KEYS = {
  userName:             'userName',
  userType:             'userType',
  childXP:              'childXP',
  childProgress:        'childProgress',
  completedLessons:     'completedLessonsCount',
  completedLessonIds:   'completedLessonIds',
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
let completedLessonIds    = [];

// ── Init Child Dashboard ───────────────────────────────────────
function initChildDashboard() {
  const nameEl = document.getElementById('childName');
  if (!nameEl) return;

  // Display saved child name
  const savedName = localStorage.getItem(STORAGE_KEYS.userName) || 'Explorer';
  nameEl.innerText = savedName;

  // Load saved XP and progress
  currentXP             = parseInt(localStorage.getItem(STORAGE_KEYS.childXP))       || 0;
  completedLessonsCount = parseInt(localStorage.getItem(STORAGE_KEYS.completedLessons)) || 0;
  completedLessonIds    = JSON.parse(localStorage.getItem(STORAGE_KEYS.completedLessonIds) || '[]');

  // Restore completed lesson buttons
  restoreCompletedLessons();

  // Update UI
  updateXPDisplay();
  updateProgressDisplay();
}

// ── Restore Completed Lessons UI ──────────────────────────────
function restoreCompletedLessons() {
  completedLessonIds.forEach(id => {
    const btn = document.querySelector(`#lesson${id} .btn-lesson`);
    if (btn) markButtonCompleted(btn);
  });
}

// ── Complete a Lesson ──────────────────────────────────────────
function completeLesson(lessonId, xpReward) {
  // Prevent double completion
  if (completedLessonIds.includes(lessonId)) return;

  const cardButton = document.querySelector(`#lesson${lessonId} .btn-lesson`);
  if (!cardButton) return;

  // Mark lesson as completed
  markButtonCompleted(cardButton);

  // Update state
  currentXP += xpReward;
  completedLessonsCount++;
  completedLessonIds.push(lessonId);

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.childXP,            currentXP);
  localStorage.setItem(STORAGE_KEYS.completedLessons,   completedLessonsCount);
  localStorage.setItem(STORAGE_KEYS.completedLessonIds, JSON.stringify(completedLessonIds));

  // Update UI
  updateXPDisplay();
  updateProgressDisplay();

  // Show celebration
  showCelebration(xpReward);
}

// ── Mark Button as Completed ───────────────────────────────────
function markButtonCompleted(btn) {
  btn.innerHTML   = '<span>✓ Completed</span><span></span>';
  btn.classList.add('completed');
  btn.disabled    = true;
  btn.onclick     = null;
}

// ── Show Celebration Toast ─────────────────────────────────────
function showCelebration(xpReward) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    right: 32px;
    background: var(--fide-hero-bg);
    color: white;
    padding: 16px 24px;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 999;
    border-left: 3px solid var(--fide-teal);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  toast.innerHTML = `⭐ +${xpReward} XP earned! Keep going!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ── Update XP Display ──────────────────────────────────────────
function updateXPDisplay() {
  setElementText('xpCount',   currentXP);
  setElementText('xpDisplay', currentXP);
  setElementText('statXP',    currentXP);
}

// ── Update Progress Bar ────────────────────────────────────────
function updateProgressDisplay() {
  const percentage = Math.round((completedLessonsCount / TOTAL_LESSONS) * 100);

  // Progress bar
  const progressBar = document.getElementById('mainProgress');
  if (progressBar) progressBar.style.width = percentage + '%';

  // Text displays
  setElementText('progressText',  percentage + '% Completed');
  setElementText('statLessons',   completedLessonsCount + ' / ' + TOTAL_LESSONS);

  // Save to localStorage
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
  const childName     = localStorage.getItem(STORAGE_KEYS.userName)      || 'Your Child';
  const childXP       = localStorage.getItem(STORAGE_KEYS.childXP)       || '0';
  const childProgress = localStorage.getItem(STORAGE_KEYS.childProgress)  || '0';
  const childLessons  = localStorage.getItem(STORAGE_KEYS.completedLessons) || '0';

  // Update parent dashboard UI
  setElementText('displayChildName',     childName);
  setElementText('totalFamilyXP',        childXP);
  setElementText('displayChildProgress', childProgress + '%');
  setElementText('displayChildLessons',  childLessons + ' / ' + TOTAL_LESSONS);

  // Progress bar
  const progressFill = document.getElementById('parentChildProgressFill');
  if (progressFill) progressFill.style.width = childProgress + '%';
}

// ── Generate Report ────────────────────────────────────────────
function generateReport() {
  const childName     = localStorage.getItem(STORAGE_KEYS.userName)       || 'Your Child';
  const childXP       = localStorage.getItem(STORAGE_KEYS.childXP)        || '0';
  const childProgress = localStorage.getItem(STORAGE_KEYS.childProgress)  || '0';
  const childLessons  = localStorage.getItem(STORAGE_KEYS.completedLessons) || '0';

  alert(
    `Fide Learning Report\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Student: ${childName}\n` +
    `Lessons Completed: ${childLessons} / ${TOTAL_LESSONS}\n` +
    `Progress: ${childProgress}%\n` +
    `Total XP Earned: ${childXP} XP\n\n` +
    `Report generated successfully! 📄`
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