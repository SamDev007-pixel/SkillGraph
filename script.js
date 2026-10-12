let currentUser = null;
let csrfToken = '';


function showToast(message, type = 'info') {
  let box = document.getElementById('toast-container');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-container';
    document.body.appendChild(box);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-msg ' + type;
  toast.innerHTML = '<span>' + escapeHtml(message) + '</span>';
  box.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function diffBadge(diff) {
  const d = String(diff || 'Easy').toLowerCase();
  const cls = d === 'easy' ? 'badge-easy' : d === 'medium' ? 'badge-medium' : 'badge-hard';
  return '<span class="badge ' + cls + '">' + escapeHtml(diff) + '</span>';
}

function statusBadge(status) {
  const s = String(status || 'Unstarted').toLowerCase();
  const cls = s === 'solved' ? 'badge-solved' : s === 'attempted' ? 'badge-attempted' : 'badge-notstarted';
  return '<span class="badge ' + cls + '">' + escapeHtml(status) + '</span>';
}

function getApiUrl(action) {
  let base = 'api.php';
  if (window.location.protocol === 'file:') {
    base = 'http://localhost/skillgraph/api.php';
  }
  return base + '?action=' + encodeURIComponent(action);
}

async function api(action, method = 'GET', data = null) {
  let url = getApiUrl(action);
  const opts = {
    method: method,
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  };
  if (csrfToken) {
    opts.headers['X-CSRF-Token'] = csrfToken;
  }
  if (method === 'POST') {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data || {});
  } else if (data) {
    const params = new URLSearchParams();
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) params.append(key, data[key]);
    }
    const q = params.toString();
    if (q) url += '&' + q;
  }
  try {
    const res = await fetch(url, opts);
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Server communication error. Make sure XAMPP Apache is running.' };
  }
}

async function checkAuth() {
  if (window.location.protocol === 'file:') {
    const currentFile = window.location.pathname.split('/').pop() || 'login.html';
    window.location.href = 'http://localhost/skillgraph/' + currentFile;
    return;
  }

  const res = await api('me');
  const path = window.location.pathname.toLowerCase();
  const isAuthPage = path.endsWith('login.html') || path.endsWith('register.html');

  if (res.success && res.data && res.data.user) {
    currentUser = res.data.user;
    csrfToken = res.data.csrf_token || '';
    document.querySelectorAll('.user-display-name').forEach(el => el.textContent = currentUser.name);
    if (isAuthPage) {
      window.location.href = 'index.html';
      return;
    }
  } else {
    currentUser = null;
    if (!isAuthPage) {
      window.location.href = 'login.html';
      return;
    }
  }

  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.preventDefault();
      await api('logout', 'POST');
      window.location.href = 'login.html';
    };
  });

  const toggle = document.querySelector('.mobile-nav-toggle');
  const nav = document.querySelector('.header-nav');
  if (toggle && nav) {
    toggle.onclick = () => nav.classList.toggle('show-mobile');
  }

  initPage();
}

function initPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith('login.html') || path.endsWith('register.html')) {
    initAuthForms();
  } else if (path.endsWith('roadmap.html')) {
    loadRoadmap();
    initRoadmapModals();
  } else if (path.endsWith('flashcards.html')) {
    loadFlashcards();
    initFlashcardEvents();
  } else if (path.endsWith('practice.html')) {
    loadPractice();
    initPracticeEvents();
  } else if (path.endsWith('mistakes.html')) {
    loadMistakes();
    initMistakeEvents();
  } else if (path.endsWith('progress.html')) {
    loadProgress();
  } else {
    loadDashboard();
  }
}

function initAuthForms() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const res = await api('login', 'POST', { email, password });
      if (res.success) {
        window.location.href = 'index.html';
      } else {
        showToast(res.message, 'error');
      }
    };
    const demoBtn = document.getElementById('demo-fill-btn') || document.getElementById('btn-demo-login');
    if (demoBtn) {
      demoBtn.onclick = async () => {
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');
        if (emailInput) emailInput.value = 'demo@skillgraph.local';
        if (passInput) passInput.value = 'password123';
        showToast('Signing in demo account...', 'info');
        const res = await api('login', 'POST', { email: 'demo@skillgraph.local', password: 'password123' });
        if (res.success) {
          window.location.href = 'index.html';
        } else {
          showToast(res.message, 'error');
        }
      };
    }
  }

  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirm-password')?.value;
      if (confirm && password !== confirm) {
        return showToast('Passwords do not match.', 'error');
      }
      const res = await api('register', 'POST', { name, email, password });
      if (res.success) {
        window.location.href = 'index.html';
      } else {
        showToast(res.message, 'error');
      }
    };
  }
}

async function loadDashboard() {
  const res = await api('dashboard');
  if (!res.success) return;
  const d = res.data;

  setText('user-name-hero', d.user.name);
  document.querySelectorAll('.user-display-name').forEach(el => el.textContent = d.user.name);
  setText('stat-completed-tasks', d.stats.completed_tasks ?? d.stats.tasks?.completed ?? 0);
  setText('stat-remaining-tasks', d.stats.tasks?.remaining ?? 0);
  setText('stat-problems-solved', d.stats.solved_problems ?? d.stats.practice?.solved ?? 0);
  setText('stat-solved-problems', d.stats.solved_problems ?? d.stats.practice?.solved ?? 0);
  setText('stat-pending-mistakes', d.stats.mistakes?.pending ?? 0);
  setText('stat-logged-mistakes', d.stats.total_mistakes ?? d.stats.mistakes?.total ?? 0);
  setText('stat-reviewed-cards', d.stats.reviewed_flashcards ?? d.stats.flashcards?.reviewed ?? 0);

  const pct = d.stats.tasks?.percentage || 0;
  setText('stat-completion-pct', pct + '%');
  const pBar = document.getElementById('stat-progress-bar');
  if (pBar) pBar.style.width = pct + '%';

  const tracksBox = document.getElementById('dashboard-tracks-list');
  if (tracksBox && d.tracks) {
    tracksBox.innerHTML = d.tracks.map(t => `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="fw-semibold">${escapeHtml(t.title)}</span>
          <span class="text-secondary small">${t.completed_tasks}/${t.total_tasks} (${t.percentage}%)</span>
        </div>
        <div class="progress"><div class="progress-bar" style="width: ${t.percentage}%"></div></div>
      </div>
    `).join('');
  }

  const pEl = document.getElementById('dashboard-recent-practice');
  if (pEl && d.recent_practice) {
    pEl.innerHTML = d.recent_practice.length ? d.recent_practice.map(p => `
      <div class="d-flex justify-content-between align-items-center p-2 mb-2 bg-card-subtle border border-subtle">
        <div class="overflow-hidden me-2">
          <div class="fw-semibold text-main text-truncate">${escapeHtml(p.title)}</div>
          <small class="text-secondary">${escapeHtml(p.platform)}${p.topic_title ? ' &bull; ' + escapeHtml(p.topic_title) : ''}</small>
        </div>
        <div class="d-flex gap-1 align-items-center flex-shrink-0">
          ${diffBadge(p.difficulty)}
          ${statusBadge(p.status)}
        </div>
      </div>
    `).join('') : '<p class="text-secondary small py-2 mb-0">No practice problems recorded yet.</p>';
  }

  const mEl = document.getElementById('dashboard-recent-mistakes');
  if (mEl && d.recent_mistakes) {
    mEl.innerHTML = d.recent_mistakes.length ? d.recent_mistakes.map(m => `
      <div class="d-flex justify-content-between align-items-center p-2 mb-2 bg-card-subtle border border-subtle">
        <div class="overflow-hidden me-2">
          <div class="fw-semibold text-main text-truncate">${escapeHtml(m.title)}</div>
          <small class="text-secondary">${escapeHtml(m.language)}</small>
        </div>
        <span class="badge ${m.is_revised ? 'badge-easy' : 'badge-hard'} flex-shrink-0">${m.is_revised ? 'Revised' : 'Pending'}</span>
      </div>
    `).join('') : '<p class="text-secondary small py-2 mb-0">No mistakes logged yet.</p>';
  }
}

let roadmapTracks = [];

function getTopicVideos(topic) {
  const query = encodeURIComponent((topic.title || 'DSA') + ' Java tutorial');
  return [
    {
      title: (topic.title || 'Topic') + ' - Core Concepts & Code',
      channel: 'YouTube Learning',
      url: 'https://www.youtube.com/results?search_query=' + query
    },
    {
      title: (topic.title || 'Topic') + ' - Problems & Interview Patterns',
      channel: 'DSA Practice',
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent((topic.title || '') + ' interview problems Java')
    }
  ];
}

async function loadRoadmap() {
  const res = await api('tracks');
  if (!res.success) return showToast(res.message, 'error');
  roadmapTracks = res.data.tracks;
  renderRoadmap();
}

function renderRoadmap() {
  const container = document.getElementById('roadmap-accordion');
  if (!container) return;

  container.innerHTML = roadmapTracks.map((track, idx) => {
    const collapseId = 'collapse-track-' + track.id;
    return `
      <div class="track-card" id="track-item-${track.id}">
        <div class="track-header" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
          <div class="track-title-wrap">
            <div class="track-num">${idx + 1}</div>
            <div>
              <h5 class="mb-0 fw-bold text-main">${escapeHtml(track.title)}</h5>
              <small class="text-secondary">${escapeHtml(track.description || '')}</small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-3">
            <div class="text-end d-none d-sm-block" style="min-width: 120px;">
              <small class="fw-semibold text-main">${track.completed_tasks}/${track.total_tasks} done</small>
              <div class="progress mt-1" style="width: 120px;"><div class="progress-bar" style="width: ${track.percentage}%"></div></div>
            </div>
            <span class="badge badge-starter">${track.percentage}%</span>
            <i class="bi bi-chevron-down text-secondary fs-6"></i>
          </div>
        </div>

        <div id="${collapseId}" class="collapse ${idx === 0 ? 'show' : ''}">
          <div class="p-3 border-top border-subtle">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-bold text-secondary text-uppercase fs-7">Topics & Subtasks</span>
              <button class="btn btn-outline btn-sm" onclick="openAddTopicModal(${track.id})">
                <i class="bi bi-plus-lg"></i> Add Custom Topic
              </button>
            </div>

            ${track.topics.map((topic) => {
              const videos = getTopicVideos(topic);
              return `
              <div class="topic-box" id="topic-box-${topic.id}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <span class="fw-bold text-main fs-6">${escapeHtml(topic.title)}</span>
                    <span class="badge ${topic.is_starter ? 'badge-starter' : 'badge-custom'} ms-2">${topic.is_starter ? 'Core' : 'Custom'}</span>
                    <p class="text-secondary small mb-0">${escapeHtml(topic.description || '')}</p>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-card text-secondary border border-subtle">${topic.completed_tasks}/${topic.total_tasks} (${topic.percentage}%)</span>
                    <button class="btn btn-outline btn-sm py-0 px-2" onclick="openAddTaskModal(${topic.id})"><i class="bi bi-plus"></i> Task</button>
                    ${!topic.is_starter ? `
                      <button class="btn btn-sm text-secondary p-0" onclick="openEditTopicModal(${topic.id})"><i class="bi bi-pencil"></i></button>
                      <button class="btn btn-sm text-danger p-0" onclick="deleteRoadmapItem('delete_topic', ${topic.id})"><i class="bi bi-trash"></i></button>
                    ` : ''}
                  </div>
                </div>

                <div class="task-list mt-2">
                  ${topic.tasks.map((task) => `
                    <div class="task-checklist-item ${task.is_completed ? 'task-completed' : ''}" id="task-item-${task.id}">
                      <label class="task-check-label">
                        <input type="checkbox" class="task-checkbox" ${task.is_completed ? 'checked' : ''} onchange="toggleTask(${task.id}, this.checked)">
                        <span class="task-text text-main">${escapeHtml(task.title)}</span>
                      </label>
                      ${!task.is_starter ? `
                        <div class="task-actions ms-2">
                          <button class="btn btn-sm text-secondary p-0 me-1" onclick="openEditTaskModal(${task.id})"><i class="bi bi-pencil" style="font-size:0.75rem;"></i></button>
                          <button class="btn btn-sm text-danger p-0" onclick="deleteRoadmapItem('delete_task', ${task.id})"><i class="bi bi-trash" style="font-size:0.75rem;"></i></button>
                        </div>
                      ` : ''}
                    </div>`).join('')}
                </div>

                <details class="topic-resources mt-2 pt-2 border-top border-subtle">
                  <summary class="topic-resources-summary py-1 text-secondary fs-7 fw-semibold">
                    <span><i class="bi bi-youtube text-danger me-1"></i> Learning Resources (${videos.length})</span>
                  </summary>
                  <div class="d-flex flex-column gap-2 mt-2">
                    ${videos.map((v) => `
                      <div class="topic-resource-row">
                        <div class="d-flex align-items-center gap-2 overflow-hidden">
                          <i class="bi bi-play-circle text-danger flex-shrink-0 fs-6"></i>
                          <div class="text-truncate">
                            <span class="fw-semibold text-main fs-7 text-truncate d-block">${escapeHtml(v.title)}</span>
                            <small class="text-secondary fs-8">${escapeHtml(v.channel)}</small>
                          </div>
                        </div>
                        <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm py-0 px-2 flex-shrink-0 text-decoration-none">
                          Watch Video <i class="bi bi-box-arrow-up-right ms-1" style="font-size:0.72rem;"></i>
                        </a>
                      </div>
                    `).join('')}
                  </div>
                </details>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  }).join('');
}

async function toggleTask(taskId, isCompleted) {
  const res = await api('toggle_task', 'POST', { task_id: taskId, is_completed: isCompleted ? 1 : 0 });
  if (res.success) {
    loadRoadmap();
  } else {
    showToast(res.message, 'error');
  }
}

async function deleteRoadmapItem(action, id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  const res = await api(action, 'POST', { id: id });
  if (res.success) {
    showToast('Deleted successfully', 'success');
    loadRoadmap();
  } else {
    showToast(res.message, 'error');
  }
}

function openAddTopicModal(trackId) {
  document.getElementById('add-topic-track-id').value = trackId;
  document.getElementById('form-add-topic').reset();
  bootstrap.Modal.getOrCreateInstance(document.getElementById('addTopicModal')).show();
}

function openEditTopicModal(topicId) {
  let topic = null;
  for (const tr of roadmapTracks) {
    const found = tr.topics.find(t => t.id === topicId);
    if (found) { topic = found; break; }
  }
  if (!topic) return;
  document.getElementById('edit-topic-id').value = topic.id;
  document.getElementById('edit-topic-title').value = topic.title;
  document.getElementById('edit-topic-desc').value = topic.description || '';
  bootstrap.Modal.getOrCreateInstance(document.getElementById('editTopicModal')).show();
}

function openAddTaskModal(topicId) {
  document.getElementById('add-task-topic-id').value = topicId;
  document.getElementById('form-add-task').reset();
  bootstrap.Modal.getOrCreateInstance(document.getElementById('addTaskModal')).show();
}

function openEditTaskModal(taskId) {
  let task = null;
  for (const tr of roadmapTracks) {
    for (const top of tr.topics) {
      const found = top.tasks.find(t => t.id === taskId);
      if (found) { task = found; break; }
    }
    if (task) break;
  }
  if (!task) return;
  document.getElementById('edit-task-id').value = task.id;
  document.getElementById('edit-task-title').value = task.title;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('editTaskModal')).show();
}

function initRoadmapModals() {
  const fAddTop = document.getElementById('form-add-topic');
  if (fAddTop) {
    fAddTop.onsubmit = async (e) => {
      e.preventDefault();
      const track_id = document.getElementById('add-topic-track-id').value;
      const title = document.getElementById('add-topic-title').value.trim();
      const description = document.getElementById('add-topic-desc').value.trim();
      const res = await api('add_topic', 'POST', { track_id, title, description });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('addTopicModal'))?.hide();
        loadRoadmap();
      } else showToast(res.message, 'error');
    };
  }

  const fEditTop = document.getElementById('form-edit-topic');
  if (fEditTop) {
    fEditTop.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-topic-id').value;
      const title = document.getElementById('edit-topic-title').value.trim();
      const description = document.getElementById('edit-topic-desc').value.trim();
      const res = await api('edit_topic', 'POST', { id, title, description });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('editTopicModal'))?.hide();
        loadRoadmap();
      } else showToast(res.message, 'error');
    };
  }

  const fAddTsk = document.getElementById('form-add-task');
  if (fAddTsk) {
    fAddTsk.onsubmit = async (e) => {
      e.preventDefault();
      const topic_id = document.getElementById('add-task-topic-id').value;
      const title = document.getElementById('add-task-title').value.trim();
      const res = await api('add_task', 'POST', { topic_id, title });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('addTaskModal'))?.hide();
        loadRoadmap();
      } else showToast(res.message, 'error');
    };
  }

  const fEditTsk = document.getElementById('form-edit-task');
  if (fEditTsk) {
    fEditTsk.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-task-id').value;
      const title = document.getElementById('edit-task-title').value.trim();
      const res = await api('edit_task', 'POST', { id, title });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('editTaskModal'))?.hide();
        loadRoadmap();
      } else showToast(res.message, 'error');
    };
  }
}

let flashcardsList = [];
let currentCardIdx = 0;
let isFlipped = false;

async function loadFlashcards() {
  const cat = document.getElementById('flashcard-cat-filter')?.value || '';
  const status = document.getElementById('flashcard-status-filter')?.value || 'all';
  const res = await api('flashcards', 'GET', { category: cat, status: status });
  if (!res.success) return showToast(res.message, 'error');

  flashcardsList = res.data.flashcards;
  currentCardIdx = 0;
  isFlipped = false;

  setText('cards-total-count', res.data.summary.total);
  setText('cards-reviewed-count', res.data.summary.reviewed);
  setText('cards-remaining-count', res.data.summary.remaining);

  const sel = document.getElementById('flashcard-cat-filter');
  if (sel && sel.options.length <= 1 && res.data.categories) {
    res.data.categories.forEach(c => sel.appendChild(new Option(c, c)));
  }

  renderFlashcard();
}

function renderFlashcard() {
  const cardObj = document.getElementById('flashcard-object');
  const emptyState = document.getElementById('flashcard-empty-state');
  const activeView = document.getElementById('flashcard-active-view');
  if (!cardObj || !emptyState || !activeView) return;

  if (flashcardsList.length === 0) {
    activeView.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  activeView.style.display = 'block';
  emptyState.style.display = 'none';
  if (currentCardIdx >= flashcardsList.length) currentCardIdx = 0;

  const card = flashcardsList[currentCardIdx];
  cardObj.classList.remove('is-flipped');
  isFlipped = false;

  setText('flashcard-front-text', card.question);
  setText('flashcard-category-badge', card.category || 'General');
  setText('flashcard-back-text', card.answer);
  setText('flashcard-back-category', card.category || 'General');
  setText('flashcard-counter', 'Card ' + (currentCardIdx + 1) + ' of ' + flashcardsList.length);

  const badge = document.getElementById('flashcard-status-badge');
  if (badge) {
    badge.className = 'badge ' + (card.is_reviewed ? 'badge-easy' : 'badge-attempted');
    badge.innerHTML = card.is_reviewed ? '<i class="bi bi-check2-circle"></i> Reviewed' : '<i class="bi bi-clock"></i> Not Reviewed';
  }

  const rBtn = document.getElementById('flashcard-review-btn');
  if (rBtn) {
    rBtn.innerHTML = card.is_reviewed ? '<i class="bi bi-arrow-counterclockwise"></i> Mark as Unreviewed' : '<i class="bi bi-check2"></i> Mark as Reviewed';
    rBtn.className = 'btn btn-sm ' + (card.is_reviewed ? 'btn-outline' : 'btn-primary');
  }

  const actions = document.getElementById('flashcard-card-actions');
  if (actions) {
    actions.innerHTML = !card.is_starter
      ? `<button class="btn btn-outline btn-sm me-1" onclick="openEditFlashcardModal(${card.id})"><i class="bi bi-pencil"></i> Edit</button>
         <button class="btn btn-outline-danger btn-sm" onclick="deleteFlashcardItem(${card.id})"><i class="bi bi-trash"></i> Delete</button>`
      : '<span class="badge badge-starter">Core Card</span>';
  }
}

function flipCard() {
  const cardObj = document.getElementById('flashcard-object');
  if (!cardObj) return;
  isFlipped = !isFlipped;
  cardObj.classList.toggle('is-flipped', isFlipped);
}

function nextCard(dir) {
  if (flashcardsList.length === 0) return;
  currentCardIdx = (currentCardIdx + dir + flashcardsList.length) % flashcardsList.length;
  renderFlashcard();
}

async function toggleReviewCurrentCard() {
  if (flashcardsList.length === 0) return;
  const card = flashcardsList[currentCardIdx];
  const next = card.is_reviewed ? 0 : 1;
  const res = await api('toggle_flashcard_review', 'POST', { flashcard_id: card.id, is_reviewed: next });
  if (res.success) {
    card.is_reviewed = Boolean(next);
    loadFlashcards();
  } else {
    showToast(res.message, 'error');
  }
}

function openEditFlashcardModal(cardId) {
  const card = flashcardsList.find(c => c.id === cardId);
  if (!card) return;
  document.getElementById('edit-card-id').value = card.id;
  document.getElementById('edit-card-category').value = card.category;
  document.getElementById('edit-card-question').value = card.question;
  document.getElementById('edit-card-answer').value = card.answer;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('editFlashcardModal')).show();
}

async function deleteFlashcardItem(id) {
  if (!confirm('Delete this flashcard?')) return;
  const res = await api('delete_flashcard', 'POST', { id: id });
  if (res.success) {
    showToast('Flashcard deleted', 'success');
    loadFlashcards();
  } else showToast(res.message, 'error');
}

function initFlashcardEvents() {
  document.getElementById('flashcard-object')?.addEventListener('click', flipCard);
  document.getElementById('flashcard-flip-btn')?.addEventListener('click', flipCard);
  document.getElementById('flashcard-next-btn')?.addEventListener('click', () => nextCard(1));
  document.getElementById('flashcard-prev-btn')?.addEventListener('click', () => nextCard(-1));
  document.getElementById('flashcard-review-btn')?.addEventListener('click', toggleReviewCurrentCard);

  document.getElementById('flashcard-cat-filter')?.addEventListener('change', loadFlashcards);
  document.getElementById('flashcard-status-filter')?.addEventListener('change', loadFlashcards);

  const fAdd = document.getElementById('form-add-flashcard');
  if (fAdd) {
    fAdd.onsubmit = async (e) => {
      e.preventDefault();
      const category = document.getElementById('add-card-category').value.trim() || 'General';
      const question = document.getElementById('add-card-question').value.trim();
      const answer = document.getElementById('add-card-answer').value.trim();
      const res = await api('add_flashcard', 'POST', { category, question, answer });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('addFlashcardModal'))?.hide();
        fAdd.reset();
        loadFlashcards();
      } else showToast(res.message, 'error');
    };
  }

  const fEdit = document.getElementById('form-edit-flashcard');
  if (fEdit) {
    fEdit.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-card-id').value;
      const category = document.getElementById('edit-card-category').value.trim();
      const question = document.getElementById('edit-card-question').value.trim();
      const answer = document.getElementById('edit-card-answer').value.trim();
      const res = await api('edit_flashcard', 'POST', { id, category, question, answer });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('editFlashcardModal'))?.hide();
        loadFlashcards();
      } else showToast(res.message, 'error');
    };
  }
}

let practiceProblems = [];

async function loadPractice() {
  const platform = document.getElementById('filter-practice-platform')?.value || 'All';
  const difficulty = document.getElementById('filter-practice-difficulty')?.value || 'All';
  const status = document.getElementById('filter-practice-status')?.value || 'All';
  const search = document.getElementById('filter-practice-search')?.value.trim() || '';

  const res = await api('practice_problems', 'GET', { platform, difficulty, status, search });
  if (!res.success) return showToast(res.message, 'error');

  practiceProblems = res.data.problems;
  const s = res.data.summary;
  setText('practice-total-count', s.total);
  setText('practice-solved-count', s.solved);
  setText('practice-attempted-count', s.attempted);
  setText('practice-unstarted-count', s.not_started);

  const tbody = document.getElementById('practice-records-tbody');
  const emptyState = document.getElementById('practice-empty-state');
  if (!tbody || !emptyState) return;

  if (practiceProblems.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  tbody.innerHTML = practiceProblems.map(p => `
    <tr>
      <td>
        <div class="fw-bold text-main">${escapeHtml(p.title)}</div>
        ${p.notes ? `<small class="text-secondary d-block mt-1">${escapeHtml(p.notes)}</small>` : ''}
      </td>
      <td><span class="badge bg-card-subtle text-main border border-subtle">${escapeHtml(p.platform)}</span></td>
      <td>${diffBadge(p.difficulty)}</td>
      <td>
        <select class="form-select practice-status-select status-${p.status.toLowerCase()}" onchange="changeProblemStatus(${p.id}, this.value)">
          <option value="Solved" ${p.status === 'Solved' ? 'selected' : ''}>Solved</option>
          <option value="Attempted" ${p.status === 'Attempted' ? 'selected' : ''}>Attempted</option>
          <option value="Unstarted" ${p.status === 'Unstarted' ? 'selected' : ''}>Unstarted</option>
        </select>
      </td>
      <td>
        ${p.problem_url ? `<a href="${p.problem_url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm me-1"><i class="bi bi-box-arrow-up-right"></i> Open</a>` : ''}
        <button class="btn btn-outline btn-sm me-1" onclick="openEditProblemModal(${p.id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-outline-danger btn-sm" onclick="deletePracticeItem(${p.id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function changeProblemStatus(id, newStatus) {
  const p = practiceProblems.find(item => item.id === id);
  if (!p) return;
  const res = await api('edit_practice_problem', 'POST', {
    id: id,
    title: p.title,
    platform: p.platform,
    problem_url: p.problem_url,
    difficulty: p.difficulty,
    status: newStatus,
    notes: p.notes,
    topic_id: p.topic_id
  });
  if (res.success) {
    loadPractice();
  } else showToast(res.message, 'error');
}

function openEditProblemModal(id) {
  const p = practiceProblems.find(item => item.id === id);
  if (!p) return;
  document.getElementById('edit-problem-id').value = p.id;
  document.getElementById('edit-problem-title').value = p.title;
  document.getElementById('edit-problem-platform').value = p.platform;
  document.getElementById('edit-problem-url').value = p.problem_url || '';
  document.getElementById('edit-problem-difficulty').value = p.difficulty;
  document.getElementById('edit-problem-status').value = p.status;
  document.getElementById('edit-problem-notes').value = p.notes || '';
  bootstrap.Modal.getOrCreateInstance(document.getElementById('editProblemModal')).show();
}

async function deletePracticeItem(id) {
  if (!confirm('Delete this practice problem?')) return;
  const res = await api('delete_practice_problem', 'POST', { id: id });
  if (res.success) {
    showToast('Problem deleted', 'success');
    loadPractice();
  } else showToast(res.message, 'error');
}

function initPracticeEvents() {
  ['filter-practice-platform', 'filter-practice-difficulty', 'filter-practice-status'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', loadPractice);
  });
  document.getElementById('filter-practice-search')?.addEventListener('input', loadPractice);

  const fAdd = document.getElementById('form-add-problem');
  if (fAdd) {
    fAdd.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('add-problem-title').value.trim();
      const platform = document.getElementById('add-problem-platform').value;
      const problem_url = document.getElementById('add-problem-url').value.trim();
      const difficulty = document.getElementById('add-problem-difficulty').value;
      const status = document.getElementById('add-problem-status').value;
      const notes = document.getElementById('add-problem-notes').value.trim();
      const res = await api('add_practice_problem', 'POST', { title, platform, problem_url, difficulty, status, notes });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('addProblemModal'))?.hide();
        fAdd.reset();
        loadPractice();
      } else showToast(res.message, 'error');
    };
  }

  const fEdit = document.getElementById('form-edit-problem');
  if (fEdit) {
    fEdit.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-problem-id').value;
      const title = document.getElementById('edit-problem-title').value.trim();
      const platform = document.getElementById('edit-problem-platform').value;
      const problem_url = document.getElementById('edit-problem-url').value.trim();
      const difficulty = document.getElementById('edit-problem-difficulty').value;
      const status = document.getElementById('edit-problem-status').value;
      const notes = document.getElementById('edit-problem-notes').value.trim();
      const res = await api('edit_practice_problem', 'POST', { id, title, platform, problem_url, difficulty, status, notes });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('editProblemModal'))?.hide();
        loadPractice();
      } else showToast(res.message, 'error');
    };
  }
}

let mistakesList = [];

async function loadMistakes() {
  const status = document.getElementById('filter-mistakes-status')?.value || 'all';
  const search = document.getElementById('filter-mistakes-search')?.value.trim() || '';
  const res = await api('mistakes', 'GET', { is_revised: status, search: search });
  if (!res.success) return showToast(res.message, 'error');

  mistakesList = res.data.mistakes;
  const s = res.data.summary;
  setText('mistakes-total-count', s.total);
  setText('mistakes-revised-count', s.revised);
  setText('mistakes-pending-count', s.pending);

  const container = document.getElementById('mistakes-container');
  const emptyState = document.getElementById('mistakes-empty-state');
  if (!container || !emptyState) return;

  if (mistakesList.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  container.innerHTML = mistakesList.map(m => `
    <div class="mistake-card ${m.is_revised ? 'revised' : 'pending'}" id="mistake-card-${m.id}">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <h5 class="fw-bold text-main mb-1">${escapeHtml(m.title)}</h5>
          <span class="badge">${escapeHtml(m.language)}</span>
          ${m.topic_title ? `<span class="badge bg-card-subtle text-secondary ms-1">${escapeHtml(m.topic_title)}</span>` : ''}
          <span class="badge ${m.is_revised ? 'badge-easy' : 'badge-hard'} ms-1">${m.is_revised ? 'Revised' : 'Pending'}</span>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm ${m.is_revised ? 'btn-outline' : 'btn-primary'}" onclick="toggleMistakeRevisedStatus(${m.id}, ${m.is_revised ? 0 : 1})">
            ${m.is_revised ? '<i class="bi bi-arrow-counterclockwise"></i> Pending' : '<i class="bi bi-check2"></i> Mark Revised'}
          </button>
          <button class="btn btn-outline btn-sm" onclick="openEditMistakeModal(${m.id})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteMistakeItem(${m.id})"><i class="bi bi-trash"></i></button>
        </div>
      </div>

      <div class="row g-2 mt-2">
        <div class="col-md-6">
          <div class="mistake-section h-100">
            <div class="mistake-section-label label-wrong"><i class="bi bi-x-circle-fill"></i> What Went Wrong</div>
            <p class="mistake-section-text">${escapeHtml(m.mistake_description)}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mistake-section h-100">
            <div class="mistake-section-label label-correct"><i class="bi bi-check-circle-fill"></i> Correct Logic / Solution</div>
            <p class="mistake-section-text">${escapeHtml(m.correct_approach)}</p>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function toggleMistakeRevisedStatus(id, newStatus) {
  const res = await api('toggle_mistake_revised', 'POST', { id: id, is_revised: newStatus });
  if (res.success) {
    loadMistakes();
  } else showToast(res.message, 'error');
}

function openEditMistakeModal(id) {
  const m = mistakesList.find(item => item.id === id);
  if (!m) return;
  document.getElementById('edit-mistake-id').value = m.id;
  document.getElementById('edit-mistake-title').value = m.title;
  document.getElementById('edit-mistake-lang').value = m.language;
  document.getElementById('edit-mistake-desc').value = m.mistake_description;
  document.getElementById('edit-mistake-correct').value = m.correct_approach;
  document.getElementById('edit-mistake-revised').value = m.is_revised ? '1' : '0';
  bootstrap.Modal.getOrCreateInstance(document.getElementById('editMistakeModal')).show();
}

async function deleteMistakeItem(id) {
  if (!confirm('Delete this mistake note?')) return;
  const res = await api('delete_mistake', 'POST', { id: id });
  if (res.success) {
    showToast('Mistake deleted', 'success');
    loadMistakes();
  } else showToast(res.message, 'error');
}

function initMistakeEvents() {
  document.getElementById('filter-mistakes-status')?.addEventListener('change', loadMistakes);
  document.getElementById('filter-mistakes-search')?.addEventListener('input', loadMistakes);

  const fAdd = document.getElementById('form-add-mistake');
  if (fAdd) {
    fAdd.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('add-mistake-title').value.trim();
      const language = document.getElementById('add-mistake-lang').value.trim() || 'Java';
      const mistake_description = document.getElementById('add-mistake-desc').value.trim();
      const correct_approach = document.getElementById('add-mistake-correct').value.trim();
      const is_revised = parseInt(document.getElementById('add-mistake-revised')?.value || '0', 10);
      const res = await api('add_mistake', 'POST', { title, language, mistake_description, correct_approach, is_revised });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('addMistakeModal'))?.hide();
        fAdd.reset();
        loadMistakes();
      } else showToast(res.message, 'error');
    };
  }

  const fEdit = document.getElementById('form-edit-mistake');
  if (fEdit) {
    fEdit.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-mistake-id').value;
      const title = document.getElementById('edit-mistake-title').value.trim();
      const language = document.getElementById('edit-mistake-lang').value.trim();
      const mistake_description = document.getElementById('edit-mistake-desc').value.trim();
      const correct_approach = document.getElementById('edit-mistake-correct').value.trim();
      const is_revised = parseInt(document.getElementById('edit-mistake-revised').value, 10);
      const res = await api('edit_mistake', 'POST', { id, title, language, mistake_description, correct_approach, is_revised });
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('editMistakeModal'))?.hide();
        loadMistakes();
      } else showToast(res.message, 'error');
    };
  }
}

async function loadProgress() {
  const res = await api('progress');
  if (!res.success) return showToast(res.message, 'error');
  const d = res.data;

  setText('prog-tasks-total', d.tasks.total);
  setText('prog-tasks-comp', d.tasks.completed);
  setText('prog-tasks-pct', d.tasks.percentage + '%');
  const barTasks = document.getElementById('prog-tasks-bar');
  if (barTasks) barTasks.style.width = d.tasks.percentage + '%';

  setText('prog-practice-total', d.practice.total);
  setText('prog-practice-solved', d.practice.solved);
  setText('prog-practice-pct', d.practice.solved_percent + '%');
  const barPractice = document.getElementById('prog-practice-bar');
  if (barPractice) barPractice.style.width = d.practice.solved_percent + '%';

  setText('prog-cards-total', d.flashcards.total);
  setText('prog-cards-rev', d.flashcards.reviewed);
  setText('prog-cards-pct', d.flashcards.percentage + '%');
  const barCards = document.getElementById('prog-cards-bar');
  if (barCards) barCards.style.width = d.flashcards.percentage + '%';

  setText('prog-mistakes-total', d.mistakes.total);
  setText('prog-mistakes-rev', d.mistakes.revised);
  setText('prog-mistakes-pct', d.mistakes.percentage + '%');
  const barMistakes = document.getElementById('prog-mistakes-bar');
  if (barMistakes) barMistakes.style.width = d.mistakes.percentage + '%';

  const diff = d.practice.difficulty;
  if (diff) {
    const eTot = diff.easy.total || 0;
    const eSolv = diff.easy.solved || 0;
    const ePct = eTot > 0 ? Math.round((eSolv / eTot) * 100) : 0;
    setText('diff-easy-solved', eSolv);
    setText('diff-easy-total', eTot);
    const bE = document.getElementById('diff-easy-bar');
    if (bE) bE.style.width = ePct + '%';

    const mTot = diff.medium.total || 0;
    const mSolv = diff.medium.solved || 0;
    const mPct = mTot > 0 ? Math.round((mSolv / mTot) * 100) : 0;
    setText('diff-medium-solved', mSolv);
    setText('diff-medium-total', mTot);
    const bM = document.getElementById('diff-medium-bar');
    if (bM) bM.style.width = mPct + '%';

    const hTot = diff.hard.total || 0;
    const hSolv = diff.hard.solved || 0;
    const hPct = hTot > 0 ? Math.round((hSolv / hTot) * 100) : 0;
    setText('diff-hard-solved', hSolv);
    setText('diff-hard-total', hTot);
    const bH = document.getElementById('diff-hard-bar');
    if (bH) bH.style.width = hPct + '%';
  }

  const tracksBox = document.getElementById('progress-tracks-container');
  if (tracksBox && d.tracks) {
    tracksBox.innerHTML = d.tracks.map(t => `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="fw-semibold">${escapeHtml(t.title)}</span>
          <span class="text-secondary small">${t.completed_tasks}/${t.total_tasks} (${t.percentage}%)</span>
        </div>
        <div class="progress"><div class="progress-bar" style="width: ${t.percentage}%"></div></div>
      </div>
    `).join('');
  }

  const topicsBox = document.getElementById('progress-topics-container');
  if (topicsBox && d.topics) {
    topicsBox.innerHTML = d.topics.map(top => `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="fw-semibold">${escapeHtml(top.title)}</span>
          <span class="text-secondary small">${top.completed_tasks}/${top.total_tasks} (${top.percentage}%)</span>
        </div>
        <div class="progress"><div class="progress-bar" style="width: ${top.percentage}%"></div></div>
      </div>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', checkAuth);
