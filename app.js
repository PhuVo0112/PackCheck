/* ==========================================
   PackCheck — App Logic (app.js)
   ========================================== */

'use strict';

// ==========================================
// i18n — STRING DEFINITIONS
// ==========================================
const STRINGS = {
  en: {
    // Tabs
    tab_today:    'Today',
    tab_items:    'Items',
    tab_history:  'History',
    tab_settings: 'Settings',
    // Groups
    group_all:   'All',
    group_hoc:   '🏫 School',
    group_lam:   '💼 Work',
    group_gym:   '🏋️ Gym',
    group_ngoai: '🌿 Outdoors',
    group_choi:  '🎉 Hangout',
    // Progress
    progress_packed: 'packed',
    // Form
    form_photo:   '📷 Photo',
    form_name:    '📝 Item Name *',
    form_note:    '💬 Note (optional)',
    form_group:   '🏷️ Group Tag',
    form_required:'⭐ Required Item',
    form_name_ph: 'e.g. Water bottle',
    form_note_ph: 'e.g. Fill before leaving',
    add_header:   'Add New Item',
    btn_add:      'Add Item 🎉',
    btn_cancel:   'Cancel',
    btn_delete:   'Delete',
    btn_save_day: "📦 Save Today's Pack",
    save_hint:    'Logs your checked items and flags missed required ones.',
    upload_text:  'Tap to upload photo',
    required_badge: '⭐ Must',
    // Empty states
    empty_today_title:   "Your bag is empty!",
    empty_today_sub:     "Go to the <strong>Items</strong> tab to add things you carry.",
    empty_items_title:   "No items yet!",
    empty_items_sub:     "Click <strong>Add New Item</strong> above to get started.",
    empty_group:         "No items in this group",
    empty_history_title: "No history yet!",
    empty_history_sub:   "Save your first daily pack from the <strong>Today</strong> tab.",
    // History
    history_title:   '📔 Pack History',
    history_sub:     'Last 30 days of your daily packs',
    history_packed:  'Packed items',
    history_missed:  '⚠️ Missed required items',
    history_nothing: 'Nothing checked this day.',
    history_items:   'items',
    history_missed_badge: (n) => `⚠️ ${n} missed`,
    history_pct_badge:    (p) => `✅ ${p}% packed`,
    // Toast
    toast_photo_large:  '📸 Photo too large (max 5MB)',
    toast_name_required:'📝 Please enter an item name',
    toast_added:        (name) => `🎉 "${name}" added!`,
    toast_deleted:      '🗑️ Item deleted',
    toast_saved:        (c, t) => `✅ Day saved! ${c}/${t} packed.`,
    toast_missed_msg:   (n) => ` ⚠️ ${n} required item(s) missed!`,
    toast_cleared:      '🗑️ All data cleared.',
    // Modal
    modal_delete_title: 'Delete Item?',
    modal_delete_body:  (name) => `"${name}" will be removed from your list permanently.`,
    // Settings
    settings_title:       '⚙️ Settings',
    settings_lang:        'Language',
    settings_clear_label: 'Clear All Data',
    settings_clear_btn:   'Reset',
    settings_clear_hint:  'Erases all items, history, and settings permanently.',
    settings_clear_confirm: 'This will erase ALL items, history, and settings. This cannot be undone. Continue?',
    about_desc: 'Your cozy daily carry checklist planner.',
  },

  vi: {
    // Tabs
    tab_today:    'Hôm nay',
    tab_items:    'Đồ vật',
    tab_history:  'Lịch sử',
    tab_settings: 'Cài đặt',
    // Groups
    group_all:   'Tất cả',
    group_hoc:   '🏫 Đi học',
    group_lam:   '💼 Đi làm',
    group_gym:   '🏋️ Đi gym',
    group_ngoai: '🌿 Ra ngoài',
    group_choi:  '🎉 Đi chơi',
    // Progress
    progress_packed: 'đã xếp',
    // Form
    form_photo:   '📷 Ảnh',
    form_name:    '📝 Tên đồ vật *',
    form_note:    '💬 Ghi chú (tuỳ chọn)',
    form_group:   '🏷️ Nhóm',
    form_required:'⭐ Bắt buộc mang',
    form_name_ph: 'vd: Bình nước',
    form_note_ph: 'vd: Đổ đầy trước khi đi',
    add_header:   'Thêm đồ vật mới',
    btn_add:      'Thêm 🎉',
    btn_cancel:   'Huỷ',
    btn_delete:   'Xoá',
    btn_save_day: '📦 Lưu hôm nay',
    save_hint:    'Lưu danh sách đã check và đánh dấu đồ bắt buộc bị bỏ quên.',
    upload_text:  'Bấm để tải ảnh lên',
    required_badge: '⭐ Bắt buộc',
    // Empty states
    empty_today_title:   "Túi xách trống!",
    empty_today_sub:     "Vào tab <strong>Đồ vật</strong> để thêm đồ mang theo.",
    empty_items_title:   "Chưa có đồ vật nào!",
    empty_items_sub:     "Bấm <strong>Thêm đồ vật mới</strong> phía trên để bắt đầu.",
    empty_group:         "Không có đồ vật trong nhóm này",
    empty_history_title: "Chưa có lịch sử!",
    empty_history_sub:   "Lưu ngày hôm nay từ tab <strong>Hôm nay</strong>.",
    // History
    history_title:   '📔 Lịch sử xếp đồ',
    history_sub:     '30 ngày gần nhất',
    history_packed:  'Đồ đã xếp',
    history_missed:  '⚠️ Đồ bắt buộc bị bỏ quên',
    history_nothing: 'Hôm đó không check gì cả.',
    history_items:   'đồ vật',
    history_missed_badge: (n) => `⚠️ ${n} bị quên`,
    history_pct_badge:    (p) => `✅ ${p}% đã xếp`,
    // Toast
    toast_photo_large:  '📸 Ảnh quá lớn (tối đa 5MB)',
    toast_name_required:'📝 Vui lòng nhập tên đồ vật',
    toast_added:        (name) => `🎉 Đã thêm "${name}"!`,
    toast_deleted:      '🗑️ Đã xoá đồ vật',
    toast_saved:        (c, total) => `✅ Đã lưu! ${c}/${total} đã xếp.`,
    toast_missed_msg:   (n) => ` ⚠️ ${n} đồ bắt buộc bị bỏ quên!`,
    toast_cleared:      '🗑️ Đã xoá toàn bộ dữ liệu.',
    // Modal
    modal_delete_title: 'Xoá đồ vật?',
    modal_delete_body:  (name) => `"${name}" sẽ bị xoá vĩnh viễn.`,
    // Settings
    settings_title:       '⚙️ Cài đặt',
    settings_lang:        'Ngôn ngữ',
    settings_clear_label: 'Xoá toàn bộ dữ liệu',
    settings_clear_btn:   'Reset',
    settings_clear_hint:  'Xoá hết đồ vật, lịch sử và cài đặt vĩnh viễn.',
    settings_clear_confirm: 'Thao tác này sẽ xoá TOÀN BỘ đồ vật, lịch sử và cài đặt và không thể hoàn tác. Tiếp tục?',
    about_desc: 'Ứng dụng nhắc nhở đồ mang theo hằng ngày.',
  }
};

// ==========================================
// GROUPS — single source of truth
// ==========================================
const GROUPS = [
  { key: 'Đi học',   emoji: '🏫', i18nKey: 'group_hoc',   cls: 'tag-hoc'   },
  { key: 'Đi làm',   emoji: '💼', i18nKey: 'group_lam',   cls: 'tag-lam'   },
  { key: 'Đi gym',   emoji: '🏋️', i18nKey: 'group_gym',   cls: 'tag-gym'   },
  { key: 'Ra ngoài', emoji: '🌿', i18nKey: 'group_ngoai', cls: 'tag-ngoai' },
  { key: 'Đi chơi',  emoji: '🎉', i18nKey: 'group_choi',  cls: 'tag-choi'  },
];

function getGroup(key) { return GROUPS.find(g => g.key === key); }

// ==========================================
// STATE & STORAGE
// ==========================================
const STORAGE_KEYS = {
  ITEMS:   'packcheck_items',
  HISTORY: 'packcheck_history',
  TODAY:   'packcheck_today_state',
  LANG:    'packcheck_lang'
};

let state = {
  items: [],
  history: [],
  todayChecked: {},
  todayFilter: 'all',
  itemsFilter: 'all',
  activeTab: 'today',
  deleteTargetId: null,
  selectedGroup: null,
  formOpen: true,
  lang: 'en'
};

function loadState() {
  try {
    state.items       = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS)   || '[]');
    state.history     = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
    state.lang        = localStorage.getItem(STORAGE_KEYS.LANG) || 'en';
    const todayKey    = getTodayKey();
    const todayRaw    = JSON.parse(localStorage.getItem(STORAGE_KEYS.TODAY) || '{}');
    state.todayChecked = (todayRaw.date === todayKey) ? (todayRaw.checked || {}) : {};
  } catch (e) {
    state.items = []; state.history = []; state.todayChecked = {};
  }
}

function saveItems()        { localStorage.setItem(STORAGE_KEYS.ITEMS,   JSON.stringify(state.items)); }
function saveHistory()      { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history)); }
function saveLang()         { localStorage.setItem(STORAGE_KEYS.LANG, state.lang); }
function saveTodayChecked() {
  localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify({ date: getTodayKey(), checked: state.todayChecked }));
}

function getTodayKey() { return new Date().toISOString().slice(0, 10); }

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const locale = state.lang === 'vi' ? 'vi-VN' : 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ==========================================
// i18n HELPERS
// ==========================================
function t(key) {
  const val = STRINGS[state.lang]?.[key] ?? STRINGS.en[key] ?? key;
  return typeof val === 'function' ? val : val;
}

function tf(key, ...args) {
  const val = STRINGS[state.lang]?.[key] ?? STRINGS.en[key];
  return typeof val === 'function' ? val(...args) : val;
}

/** Update all data-i18n / data-i18n-html / data-i18n-placeholder elements */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Update lang buttons active state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });
  // Update html lang attribute
  document.documentElement.lang = state.lang === 'vi' ? 'vi' : 'en';
}

// ==========================================
// UTILS
// ==========================================
function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function getItemEmoji(item) {
  const g = getGroup(item.group);
  return g ? g.emoji : '📦';
}

function getGroupCls(key) {
  const g = getGroup(key);
  return g ? g.cls : 'tag-default';
}

function getGroupLabel(key) {
  const g = getGroup(key);
  return g ? t(g.i18nKey) : key;
}

let toastTimer = null;
function showToast(msg, type = 'info', duration = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, duration);
}

// ==========================================
// TAB NAVIGATION
// ==========================================
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tab}`);
  });
  if (tab === 'today')    renderToday();
  if (tab === 'items')    renderItems();
  if (tab === 'history')  renderHistory();
  if (tab === 'settings') renderSettings();
}

// ==========================================
// HEADER DATE
// ==========================================
function renderHeaderDate() {
  const now = new Date();
  const locale = state.lang === 'vi' ? 'vi-VN' : 'en-US';
  document.getElementById('header-date').textContent =
    now.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

// ==========================================
// TODAY TAB
// ==========================================
function getFilteredTodayItems() {
  return state.todayFilter === 'all'
    ? state.items
    : state.items.filter(i => i.group === state.todayFilter);
}

function renderToday() {
  const grid      = document.getElementById('today-grid');
  const emptyEl   = document.getElementById('today-empty');
  const saveDayBar = document.getElementById('save-day-bar');

  updateProgressBar();

  if (state.items.length === 0) {
    grid.innerHTML = '';
    emptyEl.classList.remove('hidden');
    saveDayBar.style.opacity = '0.4';
    saveDayBar.style.pointerEvents = 'none';
    return;
  }

  emptyEl.classList.add('hidden');
  saveDayBar.style.opacity = '1';
  saveDayBar.style.pointerEvents = 'auto';

  const items = getFilteredTodayItems();
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:span 2;padding:30px 10px;">
      <div class="empty-illustration" style="font-size:2.5rem">🔍</div>
      <p class="empty-title" style="font-size:1rem">${t('empty_group')}</p>
    </div>`;
    return;
  }

  items.forEach(item => grid.appendChild(buildTodayCard(item, !!state.todayChecked[item.id])));
}

function buildTodayCard(item, checked) {
  const div = document.createElement('div');
  div.className = `today-card${checked ? ' checked' : ''}`;
  div.dataset.id = item.id;
  div.setAttribute('role', 'button');
  div.setAttribute('tabindex', '0');
  div.setAttribute('aria-pressed', checked ? 'true' : 'false');
  div.setAttribute('aria-label', item.name);

  const photoHTML = item.photo
    ? `<img class="card-photo" src="${item.photo}" alt="${escapeHtml(item.name)}" loading="lazy" />`
    : `<div class="card-photo-placeholder">${getItemEmoji(item)}</div>`;

  const noteHTML = item.note
    ? `<div class="card-note" title="${escapeHtml(item.note)}">${escapeHtml(item.note)}</div>` : '';

  const groupLabel = item.group ? getGroupLabel(item.group) : '';
  const groupHTML  = item.group
    ? `<span class="card-group-tag ${getGroupCls(item.group)}">${escapeHtml(groupLabel)}</span>` : '';

  const requiredHTML = item.required
    ? `<span class="required-badge">${t('required_badge')}</span>` : '';

  div.innerHTML = `
    <div class="card-photo-wrap">${photoHTML}</div>
    <div class="check-overlay">
      <div class="check-stamp">
        <div class="check-stamp-inner">
          <svg class="check-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path class="check-path" d="M4 12.5 L9 18 L20 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="card-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
      ${noteHTML}
      <div class="card-footer">${groupHTML}${requiredHTML}</div>
    </div>`;

  div.addEventListener('click', () => toggleCheck(item.id, div));
  div.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCheck(item.id, div); }
  });
  return div;
}

function toggleCheck(itemId, cardEl) {
  state.todayChecked[itemId] = !state.todayChecked[itemId];
  saveTodayChecked();
  cardEl.classList.toggle('checked', !!state.todayChecked[itemId]);
  cardEl.setAttribute('aria-pressed', state.todayChecked[itemId] ? 'true' : 'false');
  updateProgressBar();
}

function updateProgressBar() {
  const total   = state.items.length;
  const checked = Object.values(state.todayChecked).filter(Boolean).length;
  const pct     = total === 0 ? 0 : Math.round((checked / total) * 100);

  document.getElementById('progress-text').textContent = `${checked} / ${total} ${t('progress_packed')}`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('progress-bar-container').setAttribute('aria-valuenow', pct);

  const emoji = ['🌱','🐣','🌸','🌟','⚡','🎉'];
  const idx = pct === 0 ? 0 : pct < 30 ? 1 : pct < 60 ? 2 : pct < 90 ? 3 : pct < 100 ? 4 : 5;
  document.getElementById('progress-emoji').textContent = emoji[idx];
}

function saveDay() {
  const todayKey    = getTodayKey();
  const checkedIds  = Object.keys(state.todayChecked).filter(id => state.todayChecked[id]);
  const checkedItems = checkedIds.map(id => state.items.find(i => i.id === id)).filter(Boolean);
  const missed = state.items.filter(i => i.required && !state.todayChecked[i.id]);

  const entry = {
    date: todayKey,
    checkedCount: checkedItems.length,
    totalCount: state.items.length,
    checked: checkedItems.map(i => ({ id: i.id, name: i.name, group: i.group })),
    missed:  missed.map(i => ({ id: i.id, name: i.name, group: i.group }))
  };

  state.history = state.history.filter(h => h.date !== todayKey);
  state.history.unshift(entry);
  if (state.history.length > 30) state.history = state.history.slice(0, 30);
  saveHistory();

  const missedMsg = missed.length > 0 ? tf('toast_missed_msg', missed.length) : '';
  showToast(tf('toast_saved', checkedItems.length, state.items.length) + missedMsg,
    missed.length > 0 ? 'error' : 'success', 3500);
}

function initTodayFilters() {
  const row = document.getElementById('today-filter-row');
  row.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.todayFilter = chip.dataset.group;
      row.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderToday();
    });
  });
}

// ==========================================
// ITEMS TAB
// ==========================================
function getFilteredItems() {
  return state.itemsFilter === 'all'
    ? state.items
    : state.items.filter(i => i.group === state.itemsFilter);
}

function renderItems() {
  const grid    = document.getElementById('items-grid');
  const emptyEl = document.getElementById('items-empty');
  const items   = getFilteredItems();

  if (state.items.length === 0) {
    grid.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:span 2;padding:30px 10px;">
      <div class="empty-illustration" style="font-size:2.5rem">🔍</div>
      <p class="empty-title" style="font-size:1rem">${t('empty_group')}</p>
    </div>`;
    return;
  }

  items.forEach(item => grid.appendChild(buildItemManageCard(item)));
}

function buildItemManageCard(item) {
  const div = document.createElement('div');
  div.className = 'item-manage-card';
  div.dataset.id = item.id;

  const photoHTML = item.photo
    ? `<img class="item-manage-photo" src="${item.photo}" alt="${escapeHtml(item.name)}" loading="lazy" />`
    : `<div class="item-manage-placeholder">${getItemEmoji(item)}</div>`;

  const noteHTML = item.note
    ? `<div class="item-manage-note" title="${escapeHtml(item.note)}">${escapeHtml(item.note)}</div>`
    : `<div class="item-manage-note" style="opacity:0.3">—</div>`;

  const groupLabel = item.group ? getGroupLabel(item.group) : '—';
  const groupHTML  = item.group
    ? `<span class="card-group-tag ${getGroupCls(item.group)}">${escapeHtml(groupLabel)}</span>`
    : `<span class="card-group-tag tag-default">—</span>`;

  const requiredHTML = item.required ? `<span class="required-badge">⭐</span>` : '';

  div.innerHTML = `
    ${photoHTML}
    <div class="item-manage-body">
      <div class="item-manage-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
      ${noteHTML}
      <div class="item-manage-footer">
        ${groupHTML}
        <div style="display:flex;align-items:center;gap:4px">
          ${requiredHTML}
          <button class="btn-delete-item" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.name)}" title="Delete">🗑️</button>
        </div>
      </div>
    </div>`;

  div.querySelector('.btn-delete-item').addEventListener('click', e => {
    e.stopPropagation();
    openDeleteModal(item.id, item.name);
  });
  return div;
}

function openDeleteModal(id, name) {
  state.deleteTargetId = id;
  document.getElementById('modal-title').textContent = t('modal_delete_title');
  document.getElementById('modal-body').textContent  = tf('modal_delete_body', name);
  document.getElementById('modal-confirm').textContent = t('btn_delete');
  document.getElementById('modal-cancel').textContent  = t('btn_cancel');
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  state.deleteTargetId = null;
  document.getElementById('modal-overlay').classList.add('hidden');
}

function confirmDelete() {
  if (!state.deleteTargetId) return;
  state.items = state.items.filter(i => i.id !== state.deleteTargetId);
  delete state.todayChecked[state.deleteTargetId];
  saveItems(); saveTodayChecked(); closeModal();
  renderItems(); updateProgressBar();
  showToast(t('toast_deleted'), 'info');
}

function initItemsFilters() {
  const row = document.getElementById('items-filter-row');
  row.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.itemsFilter = chip.dataset.group;
      row.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderItems();
    });
  });
}

// ==========================================
// ADD ITEM FORM
// ==========================================
function initAddItemForm() {
  const toggle      = document.getElementById('add-item-toggle');
  const form        = document.getElementById('add-item-form');
  const chevron     = document.getElementById('add-chevron');
  const photoInput  = document.getElementById('item-photo');
  const photoPreview = document.getElementById('photo-preview');
  const photoPlaceholder = document.getElementById('photo-placeholder');
  const groupSelector    = document.getElementById('group-selector');
  const cancelBtn   = document.getElementById('btn-cancel-edit');

  let currentPhoto = null;

  toggle.addEventListener('click', () => {
    state.formOpen = !state.formOpen;
    form.classList.toggle('hidden', !state.formOpen);
    chevron.classList.toggle('open', state.formOpen);
    if (state.formOpen) setTimeout(() => document.getElementById('item-name').focus(), 150);
  });

  cancelBtn.addEventListener('click', () => {
    state.formOpen = false;
    form.classList.add('hidden');
    chevron.classList.remove('open');
    resetAddForm(photoPreview, photoPlaceholder, groupSelector);
    currentPhoto = null;
  });

  photoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast(t('toast_photo_large'), 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      currentPhoto = ev.target.result;
      photoPreview.src = currentPhoto;
      photoPreview.classList.remove('hidden');
      photoPlaceholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  });

  groupSelector.querySelectorAll('.group-option').forEach(btn => {
    btn.addEventListener('click', () => {
      groupSelector.querySelectorAll('.group-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedGroup = btn.dataset.group;
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('item-name').value.trim();
    if (!name) { showToast(t('toast_name_required'), 'error'); document.getElementById('item-name').focus(); return; }

    const newItem = {
      id: genId(),
      name,
      photo: currentPhoto || null,
      note:  document.getElementById('item-note').value.trim() || null,
      group: state.selectedGroup || null,
      required: document.getElementById('item-required').checked
    };

    state.items.push(newItem);
    saveItems();

    state.formOpen = false;
    form.classList.add('hidden');
    chevron.classList.remove('open');
    resetAddForm(photoPreview, photoPlaceholder, groupSelector);
    currentPhoto = null; state.selectedGroup = null;

    renderItems();
    showToast(tf('toast_added', name), 'success');
  });
}

function resetAddForm(photoPreview, photoPlaceholder, groupSelector) {
  document.getElementById('item-name').value  = '';
  document.getElementById('item-note').value  = '';
  document.getElementById('item-required').checked = false;
  document.getElementById('item-photo').value = '';
  photoPreview.classList.add('hidden'); photoPreview.src = '';
  photoPlaceholder.classList.remove('hidden');
  groupSelector.querySelectorAll('.group-option').forEach(b => b.classList.remove('selected'));
}

// ==========================================
// HISTORY TAB
// ==========================================
function renderHistory() {
  const list    = document.getElementById('history-list');
  const emptyEl = document.getElementById('history-empty');

  // Update static i18n text in this panel
  document.getElementById('panel-history').querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.getElementById('panel-history').querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  if (state.history.length === 0) {
    list.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  list.innerHTML = '';
  state.history.forEach((entry, idx) => list.appendChild(buildHistoryEntry(entry, idx)));
}

function buildHistoryEntry(entry, idx) {
  const div = document.createElement('div');
  div.className = 'history-entry';

  const pct         = entry.totalCount > 0 ? Math.round((entry.checkedCount / entry.totalCount) * 100) : 0;
  const missedCount = entry.missed ? entry.missed.length : 0;
  const badgeHTML   = missedCount > 0
    ? `<span class="history-badge badge-warn">${tf('history_missed_badge', missedCount)}</span>`
    : `<span class="history-badge badge-success">${tf('history_pct_badge', pct)}</span>`;

  div.innerHTML = `
    <div class="history-entry-header">
      <div>
        <div class="history-date">${formatDate(entry.date)}</div>
        <div style="font-size:0.72rem;color:var(--text-light);margin-top:2px">${entry.checkedCount} / ${entry.totalCount} ${t('history_items')}</div>
      </div>
      <div class="history-stats">${badgeHTML}<span class="history-chevron">▼</span></div>
    </div>
    <div class="history-entry-body">${buildHistoryBody(entry)}</div>`;

  const header  = div.querySelector('.history-entry-header');
  const body    = div.querySelector('.history-entry-body');
  const chevron = div.querySelector('.history-chevron');
  header.addEventListener('click', () => {
    body.classList.toggle('open');
    chevron.classList.toggle('open', body.classList.contains('open'));
  });
  return div;
}

function buildHistoryBody(entry) {
  let html = '';
  if (entry.checked && entry.checked.length > 0) {
    html += `<div class="history-section-title">${t('history_packed')}</div><div>`;
    entry.checked.forEach(item => {
      const g = getGroup(item.group);
      html += `<span class="history-item-chip">${g ? g.emoji : '📦'} ${escapeHtml(item.name)}</span>`;
    });
    html += '</div>';
  }
  if (entry.missed && entry.missed.length > 0) {
    html += `<div class="history-section-title" style="color:#C0392B;margin-top:12px">${t('history_missed')}</div><div>`;
    entry.missed.forEach(item => {
      const g = getGroup(item.group);
      html += `<span class="history-item-chip missed">${g ? g.emoji : '⭐'} ${escapeHtml(item.name)}</span>`;
    });
    html += '</div>';
  }
  if (!html) html = `<p style="font-size:0.82rem;color:var(--text-light);font-style:italic">${t('history_nothing')}</p>`;
  return html;
}

// ==========================================
// SETTINGS TAB
// ==========================================
function renderSettings() {
  // i18n already applied globally, just update lang button states
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });
}

function initSettings() {
  // Language toggle
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lang === state.lang) return;
      state.lang = btn.dataset.lang;
      saveLang();
      applyI18n();
      renderHeaderDate();
      // Re-render active tab content so dynamic strings update
      if (state.activeTab === 'today')   renderToday();
      if (state.activeTab === 'items')   renderItems();
      if (state.activeTab === 'history') renderHistory();
    });
  });

  // Clear all data
  document.getElementById('btn-clear-data').addEventListener('click', () => {
    if (!confirm(t('settings_clear_confirm'))) return;
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.TODAY);
    state.items = []; state.history = []; state.todayChecked = {};
    updateProgressBar();
    showToast(t('toast_cleared'), 'info');
  });
}

// ==========================================
// DEMO SEED DATA
// ==========================================
function maybeSeedDemo() {
  if (state.items.length > 0) return;
  state.items = [
    { id: genId(), name: 'Water Bottle', photo: null, note: 'Fill before leaving!', group: 'Ra ngoài', required: true  },
    { id: genId(), name: 'Keys',         photo: null, note: null,                    group: 'Ra ngoài', required: true  },
    { id: genId(), name: 'Notebook',     photo: null, note: 'Blue spiral one',       group: 'Đi học',   required: false },
    { id: genId(), name: 'Gym Gloves',   photo: null, note: null,                    group: 'Đi gym',   required: false },
    { id: genId(), name: 'Earphones',    photo: null, note: 'Check battery!',        group: 'Đi chơi',  required: false },
    { id: genId(), name: 'Work Badge',   photo: null, note: null,                    group: 'Đi làm',   required: true  },
  ];
  saveItems();
}

// ==========================================
// INIT
// ==========================================
function init() {
  loadState();
  maybeSeedDemo();

  // Apply i18n to all static elements
  applyI18n();
  renderHeaderDate();

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  initTodayFilters();
  initItemsFilters();
  initAddItemForm();
  initSettings();

  // Save day
  document.getElementById('btn-save-day').addEventListener('click', saveDay);

  // Modal
  document.getElementById('modal-confirm').addEventListener('click', confirmDelete);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Initial render
  renderToday();
}

document.addEventListener('DOMContentLoaded', init);
