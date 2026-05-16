/* ============================================================
   auth.js — Handles login, user type selection, and routing
   ============================================================ */

// ── Constants ─────────────────────────────────────────────────
const ROUTES = {
  child:  '../pages/child-dashboard.html',
  parent: '../pages/parent-dashboard.html',
};

const STORAGE_KEYS = {
  userName: 'userName',
  userType: 'userType',
};

// ── State ──────────────────────────────────────────────────────
let selectedUserType = 'child'; // default user type

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupLoginForm();
  selectType('child'); // highlight default button on load
});

// ── User Type Selection ────────────────────────────────────────
function selectType(type) {
  selectedUserType = type;

  // Update active button styles
  document.getElementById('childBtn').classList.toggle('active', type === 'child');
  document.getElementById('parentBtn').classList.toggle('active', type === 'parent');

  // Update name label based on selected type
  const label = document.getElementById('nameLabel');
  if (label) {
    label.innerText = type === 'child' ? "Child's Name" : "Parent's Name";
  }
}

// ── Login Form Setup ───────────────────────────────────────────
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', handleLogin);
}

// ── Handle Login ───────────────────────────────────────────────
function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();

  // Validate input
  if (!username) {
    showError('Please enter your name.');
    return;
  }

  // Save user data to localStorage
  localStorage.setItem(STORAGE_KEYS.userName, username);
  localStorage.setItem(STORAGE_KEYS.userType, selectedUserType);

  // Redirect based on user type
  window.location.href = ROUTES[selectedUserType];
}

// ── Show Error Message ─────────────────────────────────────────
function showError(message) {
  const errorEl = document.getElementById('errorMsg');
  if (!errorEl) return;
  errorEl.innerText = message;
  errorEl.style.display = 'block';
}