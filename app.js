/* ── State ─────────────────────────────────────────────── */
let currentUser    = null;
let selectedRole   = null;
let selectedAge    = null;
let selectedAgeVal = null;
let currentTab     = 'dash';
let enrollModal    = null;   // { courseId, courseName }

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  setupNavScroll();
  setupScrollFade();
  await checkSession();
});

function setupNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}

function setupScrollFade() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}

async function checkSession() {
  try {
    const res = await api('/api/auth/me');
    if (res.id) enterApp(res);
  } catch (_) { /* not logged in */ }
}

/* ══════════════════════════════════════════════════════════
   AUTH MODAL
══════════════════════════════════════════════════════════ */
function openAuth(tab = 'login') {
  document.getElementById('auth-modal').classList.add('open');
  switchAuthTab(tab);
  clearAuthAlert();
}
function closeAuth() {
  document.getElementById('auth-modal').classList.remove('open');
}
function closeAuthOnBg(e) {
  if (e.target.id === 'auth-modal') closeAuth();
}

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
  clearAuthAlert();
  if (tab === 'register') { goRegStep1(); }
}

function showAuthAlert(msg, type = 'error') {
  const el = document.getElementById('auth-alert');
  el.textContent = msg;
  el.className = `alert alert-${type}`;
  el.classList.remove('hidden');
}
function clearAuthAlert() {
  document.getElementById('auth-alert').classList.add('hidden');
}

/* ── Register multi-step ── */
function goRegStep1() {
  show('reg-step-1'); hide('reg-step-2'); hide('reg-step-3');
  selectedRole = null; selectedAge = null; selectedAgeVal = null;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
}
function selectRole(r) {
  selectedRole = r;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
  document.getElementById(`role-${r}`).classList.add('active');
}
function goRegStep2() {
  if (!selectedRole) { showAuthAlert('Please choose a role'); return; }
  clearAuthAlert();
  if (selectedRole === 'parent') { goRegStep3(); return; }
  hide('reg-step-1'); show('reg-step-2'); hide('reg-step-3');
}
function selectAge(group, val) {
  selectedAge = group; selectedAgeVal = val;
  document.querySelectorAll('.age-option').forEach(c => c.classList.remove('active'));
  event.currentTarget.classList.add('active');
}
function goRegStep3() {
  if (selectedRole === 'child' && !selectedAge) { showAuthAlert('Please pick your age group'); return; }
  clearAuthAlert();
  hide('reg-step-1'); hide('reg-step-2'); show('reg-step-3');
}
function goRegBack() {
  if (selectedRole === 'parent') goRegStep1();
  else { hide('reg-step-3'); show('reg-step-2'); }
}

async function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-password').value;

  if (!name || !email || !pass) { showAuthAlert('All fields are required'); return; }
  if (pass.length < 6) { showAuthAlert('Password must be at least 6 characters'); return; }

  const payload = { name, email, password: pass, role: selectedRole };
  if (selectedRole === 'child') payload.age = selectedAgeVal;

  const res = await api('/api/auth/register', 'POST', payload);
  if (res.error) { showAuthAlert(res.error); return; }

  enterApp(res.user);
  closeAuth();
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  if (!email || !pass) { showAuthAlert('Email and password required'); return; }

  const res = await api('/api/auth/login', 'POST', { email, password: pass });
  if (res.error) { showAuthAlert(res.error); return; }

  enterApp(res.user);
  closeAuth();
}

async function doLogout() {
  await api('/api/auth/logout', 'POST');
  currentUser = null;
  hide('app-shell');
  show('landing');
  document.getElementById('landing').style.display = '';
  document.getElementById('app-shell').classList.remove('visible');
}

/* ══════════════════════════════════════════════════════════
   APP ENTRY
══════════════════════════════════════════════════════════ */
function enterApp(user) {
  currentUser = user;
  hide('landing');
  const shell = document.getElementById('app-shell');
  shell.style.display = 'flex';
  shell.classList.add('visible');

  // Update nav
  document.getElementById('app-avatar').textContent = user.avatar || (user.role === 'parent' ? '👨' : '🧒');
  document.getElementById('app-name').textContent  = user.name;
  document.getElementById('app-xp').textContent    = user.role === 'child' ? `${user.xp} XP` : 'Parent';

  // Show correct tabs
  if (user.role === 'child') { show('child-tabs'); hide('parent-tabs'); }
  else                       { show('parent-tabs'); hide('child-tabs'); }

  currentTab = 'dash';
  setActiveTab('dash');
  renderDashboard();
}

function showTab(tab) {
  currentTab = tab;
  setActiveTab(tab);
  const content = document.getElementById('app-content');
  content.innerHTML = '<div style="text-align:center;padding:48px"><div style="font-size:32px;margin-bottom:8px">⏳</div><div style="color:var(--txt3);font-size:14px;font-weight:600">Loading…</div></div>';

  if (tab === 'dash')        renderDashboard();
  else if (tab === 'courses')    renderCourses();
  else if (tab === 'children')   renderChildren();
  else if (tab === 'allcourses') renderAllCourses();
}

function setActiveTab(tab) {
  const tabEls = document.querySelectorAll('.app-tab');
  tabEls.forEach(t => t.classList.remove('active'));
  const map = { dash:0, courses:1, children:1, allcourses:2 };
  const idx = map[tab] ?? 0;
  const activeTabs = document.querySelector(`#${currentUser.role === 'child' ? 'child' : 'parent'}-tabs`);
  if (activeTabs) {
    const tabs = activeTabs.querySelectorAll('.app-tab');
    if (tabs[idx]) tabs[idx].classList.add('active');
  }
}

/* ══════════════════════════════════════════════════════════
   CHILD — DASHBOARD
══════════════════════════════════════════════════════════ */
async function renderDashboard() {
  const data = await api('/api/dashboard');
  const content = document.getElementById('app-content');

  if (currentUser.role === 'child') {
    const xpNext = Math.ceil((data.user.xp + 1) / 100) * 100;
    const xpPct  = Math.min(((data.user.xp % 100) / 100) * 100, 100);

    content.innerHTML = `
      <!-- XP bar -->
      <div class="xp-section">
        <div class="xp-top">
          <div>
            <div class="xp-label">Your XP</div>
            <div class="xp-amount">${data.user.xp} XP</div>
          </div>
          <div class="xp-next">Next level: ${xpNext} XP</div>
        </div>
        <div class="xp-track"><div class="xp-fill" id="xp-fill" style="width:0%"></div></div>
      </div>

      <!-- Stats -->
      <div class="dash-stats">
        <div class="stat-card">
          <div class="stat-label">Enrolled</div>
          <div class="stat-val">${data.enrolled}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Completed</div>
          <div class="stat-val" style="color:var(--acc)">${data.completed}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Lessons done</div>
          <div class="stat-val" style="color:var(--gold)">${data.lessonsDone}</div>
        </div>
      </div>

      <!-- Recent activity -->
      ${data.recentLessons.length > 0 ? `
        <div style="margin-top:24px">
          <div style="font-size:14px;font-weight:900;color:var(--txt);margin-bottom:12px">Recent activity</div>
          <div class="activity-list">
            ${data.recentLessons.map(l => `
              <div class="activity-item">
                <div class="activity-icon">✅</div>
                <div>
                  <div class="activity-text">${l.title}</div>
                  <div class="activity-sub">${l.course_title}</div>
                </div>
                <div class="activity-time">${timeAgo(l.completed_at)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div style="text-align:center;padding:48px 0">
          <div style="font-size:48px;margin-bottom:12px">📚</div>
          <div style="font-size:15px;font-weight:700;color:var(--txt2)">No lessons completed yet</div>
          <div style="font-size:13px;color:var(--txt3);margin-top:6px;margin-bottom:20px">Head to Courses to get started!</div>
          <button class="btn btn-primary" onclick="showTab('courses')">Browse courses →</button>
        </div>
      `}
    `;
    setTimeout(() => {
      const fill = document.getElementById('xp-fill');
      if (fill) fill.style.width = xpPct + '%';
    }, 100);

  } else {
    // Parent dashboard
    content.innerHTML = `
      <div style="margin-bottom:24px">
        <div style="font-size:22px;font-weight:900;color:var(--txt)">Welcome back, ${data.user.name} 👋</div>
        <div style="font-size:14px;color:var(--txt2);margin-top:4px">Here's how your children are doing</div>
      </div>
      <div class="dash-stats" style="grid-template-columns:repeat(2,1fr)">
        <div class="stat-card">
          <div class="stat-label">Children linked</div>
          <div class="stat-val">${data.children.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total courses enrolled</div>
          <div class="stat-val" style="color:var(--p)">${data.children.reduce((a,c) => a + c.enrolled, 0)}</div>
        </div>
      </div>
      ${data.children.length === 0 ? `
        <div style="text-align:center;padding:48px 0">
          <div style="font-size:48px;margin-bottom:12px">👨‍👩‍👧</div>
          <div style="font-size:15px;font-weight:700;color:var(--txt2)">No children linked yet</div>
          <div style="font-size:13px;color:var(--txt3);margin:8px 0 20px">Go to My Children to add a child by their email.</div>
          <button class="btn btn-primary" onclick="showTab('children')">Add a child →</button>
        </div>
      ` : `
        <div style="margin-top:24px">
          <div style="font-size:14px;font-weight:900;color:var(--txt);margin-bottom:12px">Your children</div>
          <div class="children-grid">
            ${data.children.map(c => `
              <div class="child-card" onclick="viewChild(${c.id})">
                <div class="child-card-top">
                  <div class="child-avatar">${c.avatar}</div>
                  <div>
                    <div class="child-name">${c.name}</div>
                    <div class="child-group">${c.age_group ? `Age group ${c.age_group}` : 'Parent account'}</div>
                  </div>
                </div>
                <div class="child-stats">
                  <div class="child-stat">
                    <div class="child-stat-val">${c.xp}</div>
                    <div class="child-stat-label">XP</div>
                  </div>
                  <div class="child-stat">
                    <div class="child-stat-val">${c.enrolled}</div>
                    <div class="child-stat-label">Enrolled</div>
                  </div>
                  <div class="child-stat">
                    <div class="child-stat-val">${c.completed}</div>
                    <div class="child-stat-label">Done</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `}
    `;
  }
}

/* ══════════════════════════════════════════════════════════
   CHILD — COURSES LIST
══════════════════════════════════════════════════════════ */
async function renderCourses() {
  const courses = await api('/api/courses');
  const content = document.getElementById('app-content');

  if (!courses.length) {
    content.innerHTML = `<div style="text-align:center;padding:48px 0"><div style="font-size:40px">📭</div><div style="margin-top:12px;color:var(--txt2)">No courses available yet.</div></div>`;
    return;
  }

  content.innerHTML = `
    <div style="margin-bottom:20px">
      <div style="font-size:20px;font-weight:900;color:var(--txt)">Your courses</div>
      <div style="font-size:13px;color:var(--txt2);margin-top:4px">Age group: ${currentUser.age_group}</div>
    </div>
    <div class="courses-grid">
      ${courses.map(c => courseTile(c)).join('')}
    </div>
  `;
}

function courseTile(c) {
  const pct = c.total_lessons > 0 ? Math.round(((c.done_lessons || 0) / c.total_lessons) * 100) : 0;
  const statusBadge = c.completed ? '<span class="completed-badge">✓ Complete</span>'
                    : c.enrolled  ? '<span class="enrolled-badge">In progress</span>'
                    : '';
  return `
    <div class="course-card" onclick="openCourse(${c.id})">
      <div class="course-card-top" style="background:${c.color}">
        <div class="course-card-icon">${c.icon}</div>
        <div class="course-card-title">${c.title}</div>
        <div class="course-card-desc">${c.description}</div>
        ${c.enrolled ? `
          <div class="progress-track" style="margin-top:12px;background:rgba(255,255,255,.3)">
            <div class="progress-fill" style="width:${pct}%;background:#fff"></div>
          </div>
        ` : ''}
      </div>
      <div class="course-card-bottom">
        <span class="course-meta">📖 ${c.total_lessons} lessons · ⭐ ${c.xp_reward} XP</span>
        ${statusBadge}
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════
   CHILD — COURSE DETAIL
══════════════════════════════════════════════════════════ */
async function openCourse(id) {
  const course = await api(`/api/courses/${id}`);
  const content = document.getElementById('app-content');

  const doneLessons = course.lessons.filter(l => l.done).length;
  const pct = course.total_lessons > 0 ? Math.round((doneLessons / course.total_lessons) * 100) : 0;

  let enrollBtn = '';
  if (currentUser.role === 'child') {
    const enrolled = course.lessons.some(l => 'done' in l);
    enrollBtn = !course.lessons[0]?.done && doneLessons === 0
      ? `<button class="btn btn-primary" onclick="enrollSelf(${course.id})">Enroll in this course</button>`
      : '';
  }

  content.innerHTML = `
    <button class="btn-back" onclick="showTab('courses')">← Back to courses</button>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <div style="width:60px;height:60px;border-radius:18px;background:${course.color};display:flex;align-items:center;justify-content:center;font-size:28px">${course.icon}</div>
      <div>
        <div style="font-size:22px;font-weight:900;color:var(--txt)">${course.title}</div>
        <div style="font-size:13px;color:var(--txt2);margin-top:2px">${course.description}</div>
      </div>
    </div>
    ${doneLessons > 0 ? `
      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--txt3);font-weight:600;margin-bottom:6px">
          <span>Progress</span><span>${doneLessons} / ${course.total_lessons}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    ` : ''}
    ${enrollBtn ? `<div style="margin-bottom:20px">${enrollBtn}</div>` : ''}
    <div style="font-size:14px;font-weight:900;color:var(--txt);margin-bottom:10px">Lessons</div>
    <div class="lesson-list">
      ${course.lessons.map((l, i) => `
        <div class="lesson-item${l.done ? ' done' : ''}" onclick="openLesson(${l.id}, ${course.id})">
          <div class="lesson-num${l.done ? ' done'  : ''}">${l.done ? '✓' : i + 1}</div>
          <div class="lesson-title">${l.title}</div>
          <span class="lesson-xp">+${l.xp_reward} XP</span>
          <span class="lesson-check">${l.done ? '✅' : '›'}</span>
        </div>
      `).join('')}
    </div>
  `;
}

async function enrollSelf(courseId) {
  const res = await api('/api/enroll', 'POST', { course_id: courseId });
  if (!res.error) openCourse(courseId);
}

/* ══════════════════════════════════════════════════════════
   CHILD — LESSON READER
══════════════════════════════════════════════════════════ */
async function openLesson(lessonId, courseId) {
  const course = await api(`/api/courses/${courseId}`);
  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  const content = document.getElementById('app-content');
  content.innerHTML = `
    <button class="btn-back" onclick="openCourse(${courseId})">← Back to course</button>
    <div class="lesson-reader">
      <div class="lesson-reader-title">${lesson.title}</div>
      <div class="lesson-reader-meta">⏱ ${lesson.duration_min} min · ⭐ +${lesson.xp_reward} XP</div>
      <div class="lesson-reader-body">${lesson.content}</div>
      ${!lesson.done ? `
        <div class="lesson-complete-btn">
          <button class="btn btn-primary btn-lg" onclick="completeLesson(${lesson.id}, ${courseId})">
            ✅ Mark as complete (+${lesson.xp_reward} XP)
          </button>
        </div>
      ` : `
        <div style="margin-top:24px">
          <span class="badge badge-acc">✓ Completed</span>
        </div>
      `}
    </div>
  `;
}

async function completeLesson(lessonId, courseId) {
  const res = await api(`/api/lessons/${lessonId}/complete`, 'POST');
  if (res.error) { alert(res.error); return; }

  // Update XP in nav
  document.getElementById('app-xp').textContent = `${res.xp} XP`;
  currentUser.xp = res.xp;

  // Show mini celebration
  const btn = document.querySelector('.lesson-complete-btn');
  if (btn) {
    btn.innerHTML = `<div style="background:rgba(52,211,153,.1);border-radius:12px;padding:14px;text-align:center"><div style="font-size:24px">🎉</div><div style="font-size:14px;font-weight:800;color:#059669;margin-top:6px">Lesson complete! +${res.xpEarned} XP</div></div>`;
    setTimeout(() => openCourse(courseId), 1500);
  }
}

/* ══════════════════════════════════════════════════════════
   PARENT — CHILDREN LIST
══════════════════════════════════════════════════════════ */
async function renderChildren() {
  const children = await api('/api/parent/children');
  const content  = document.getElementById('app-content');

  content.innerHTML = `
    <!-- Add child -->
    <div class="add-child-form">
      <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:12px">➕ Add a child</div>
      <p style="font-size:13px;color:var(--txt2);margin-bottom:14px">Enter your child's registered email to link them to your account.</p>
      <div style="display:flex;gap:10px">
        <input class="input" type="email" id="child-email" placeholder="child@example.com" style="flex:1">
        <button class="btn btn-primary" onclick="addChild()">Add</button>
      </div>
      <div id="add-child-msg" style="font-size:12px;font-weight:700;margin-top:8px"></div>
    </div>

    <!-- Children list -->
    <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:14px">
      ${children.length} ${children.length === 1 ? 'child' : 'children'} linked
    </div>
    ${children.length === 0 ? `
      <div style="text-align:center;padding:40px 0;color:var(--txt3)">
        <div style="font-size:40px;margin-bottom:10px">👶</div>
        <div style="font-size:14px;font-weight:600">No children linked yet</div>
      </div>
    ` : `
      <div class="children-grid">
        ${children.map(c => `
          <div class="child-card" onclick="viewChild(${c.id})">
            <div class="child-card-top">
              <div class="child-avatar">${c.avatar}</div>
              <div>
                <div class="child-name">${c.name}</div>
                <div class="child-group">Age ${c.age} · Group ${c.age_group}</div>
              </div>
            </div>
            <div class="child-stats">
              <div class="child-stat">
                <div class="child-stat-val">${c.xp}</div>
                <div class="child-stat-label">XP</div>
              </div>
              <div class="child-stat">
                <div class="child-stat-val">${c.enrolled_courses}</div>
                <div class="child-stat-label">Enrolled</div>
              </div>
              <div class="child-stat">
                <div class="child-stat-val">${c.completed_courses}</div>
                <div class="child-stat-label">Done</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

async function addChild() {
  const email = document.getElementById('child-email').value.trim();
  const msg   = document.getElementById('add-child-msg');
  if (!email) { msg.style.color = '#ef4444'; msg.textContent = 'Please enter an email.'; return; }

  const res = await api('/api/parent/add-child', 'POST', { email });
  if (res.error) {
    msg.style.color = '#ef4444';
    msg.textContent = res.error;
  } else {
    msg.style.color = '#059669';
    msg.textContent = `✓ ${res.child.name} added successfully!`;
    document.getElementById('child-email').value = '';
    setTimeout(renderChildren, 1000);
  }
}

/* ══════════════════════════════════════════════════════════
   PARENT — CHILD DETAIL
══════════════════════════════════════════════════════════ */
async function viewChild(childId) {
  const data    = await api(`/api/parent/children/${childId}`);
  const content = document.getElementById('app-content');
  const { child, enrollments } = data;

  content.innerHTML = `
    <button class="btn-back" onclick="showTab('children')">← Back to children</button>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px">
      <div class="child-avatar" style="width:56px;height:56px;font-size:32px;border-radius:16px;background:rgba(91,110,248,.08);display:flex;align-items:center;justify-content:center">${child.avatar}</div>
      <div>
        <div style="font-size:22px;font-weight:900;color:var(--txt)">${child.name}</div>
        <div style="font-size:13px;color:var(--txt2);margin-top:2px">Age ${child.age} · Group ${child.age_group} · ${child.xp} XP</div>
      </div>
    </div>

    <!-- Enroll in course button -->
    <div style="margin-bottom:20px">
      <button class="btn btn-outline" onclick="openEnrollModal(${child.id}, '${child.name}')">
        + Enroll in a course
      </button>
    </div>

    <!-- Enrolled courses -->
    <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:14px">
      Enrolled courses (${enrollments.length})
    </div>
    ${enrollments.length === 0 ? `
      <div style="text-align:center;padding:32px;background:var(--card);border-radius:var(--r);border:1px dashed #dde4ff">
        <div style="font-size:32px;margin-bottom:8px">📭</div>
        <div style="font-size:13px;color:var(--txt3);font-weight:600">Not enrolled in any courses yet</div>
      </div>
    ` : enrollments.map(e => {
        const pct = e.total_lessons > 0 ? Math.round((e.done_lessons / e.total_lessons) * 100) : 0;
        return `
          <div class="enrollment-card">
            <div class="enrollment-top">
              <div class="enrollment-icon" style="background:${e.color}20">${e.icon}</div>
              <div>
                <div class="enrollment-name">${e.title}</div>
                <div class="enrollment-group">Group ${e.age_group} · ${e.total_lessons} lessons</div>
              </div>
              ${e.course_completed ? '<span class="completed-badge">✓ Done</span>' : ''}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txt3);font-weight:600;margin-bottom:6px">
              <span>${e.done_lessons} / ${e.total_lessons} lessons</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('')}
  `;
}

/* Enroll child modal */
async function openEnrollModal(childId, childName) {
  const courses = await api('/api/courses');
  const content = document.getElementById('app-content');

  // Render a simple inline panel
  const panel = document.createElement('div');
  panel.id = 'enroll-panel';
  panel.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px';
  panel.innerHTML = `
    <div style="background:var(--card);border-radius:24px;padding:28px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-size:18px;font-weight:900;color:var(--txt)">Enroll ${childName}</div>
        <button onclick="document.getElementById('enroll-panel').remove()" style="background:var(--bg);border:none;width:30px;height:30px;border-radius:9px;cursor:pointer;font-size:14px">✕</button>
      </div>
      <div class="age-filter">
        ${['7-9','9-12','12-16','16-18'].map(g => `<button class="filter-btn${g==='7-9'?' active':''}" onclick="filterEnrollCourses(this,'${g}')">${g} yrs</button>`).join('')}
      </div>
      <div id="enroll-course-list" class="courses-grid" style="grid-template-columns:1fr">
        ${courses.map(c => `
          <div class="course-card" style="cursor:pointer" onclick="enrollChildIn(${childId},${c.id},'${c.title}')">
            <div class="course-card-top" style="background:${c.color};padding:14px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="font-size:24px">${c.icon}</div>
                <div>
                  <div class="course-card-title" style="font-size:14px">${c.title}</div>
                  <div class="course-card-desc" style="font-size:11px">${c.age_group} yrs · ${c.total_lessons} lessons</div>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(panel);
}

async function enrollChildIn(childId, courseId, courseTitle) {
  const res = await api('/api/parent/enroll', 'POST', { child_id: childId, course_id: courseId });
  document.getElementById('enroll-panel')?.remove();
  if (!res.error) viewChild(childId);
  else alert(res.error);
}

/* ══════════════════════════════════════════════════════════
   PARENT — ALL COURSES
══════════════════════════════════════════════════════════ */
async function renderAllCourses(group = '7-9') {
  const courses = await api('/api/courses');
  const content = document.getElementById('app-content');
  const groups  = ['7-9','9-12','12-16','16-18'];

  content.innerHTML = `
    <div style="font-size:20px;font-weight:900;color:var(--txt);margin-bottom:16px">All courses</div>
    <div class="age-filter" id="age-filter-btns">
      ${groups.map(g => `<button class="filter-btn${g===group?' active':''}" onclick="filterCourses(this,'${g}')">${g} years</button>`).join('')}
    </div>
    <div class="courses-grid" id="courses-filtered">
      ${courses.filter(c => c.age_group === group).map(c => `
        <div class="course-card">
          <div class="course-card-top" style="background:${c.color}">
            <div class="course-card-icon">${c.icon}</div>
            <div class="course-card-title">${c.title}</div>
            <div class="course-card-desc">${c.description}</div>
          </div>
          <div class="course-card-bottom">
            <span class="course-meta">📖 ${c.total_lessons} lessons · ⭐ ${c.xp_reward} XP</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function filterCourses(btn, group) {
  document.querySelectorAll('#age-filter-btns .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const courses = await api('/api/courses');
  const el = document.getElementById('courses-filtered');
  el.innerHTML = courses.filter(c => c.age_group === group).map(c => `
    <div class="course-card">
      <div class="course-card-top" style="background:${c.color}">
        <div class="course-card-icon">${c.icon}</div>
        <div class="course-card-title">${c.title}</div>
        <div class="course-card-desc">${c.description}</div>
      </div>
      <div class="course-card-bottom">
        <span class="course-meta">📖 ${c.total_lessons} lessons · ⭐ ${c.xp_reward} XP</span>
      </div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
async function api(url, method = 'GET', body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(url, opts);
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

// Seed demo accounts on first visit hint
async function createDemoAccounts() {
  const demos = [
    { name:'Demo Parent', email:'parent@demo.com', password:'demo123', role:'parent' },
    { name:'Demo Child',  email:'child@demo.com',  password:'demo123', role:'child', age:'10' },
  ];
  for (const d of demos) {
    await api('/api/auth/register', 'POST', d).catch(() => {});
  }
}
createDemoAccounts();