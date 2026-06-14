/* ==========================================
   PackCheck — App Logic (app.js)
   Storage: @capacitor/preferences (native)
            localStorage (browser fallback)
   ========================================== */

'use strict';

// ==========================================
// STORAGE ADAPTER
// Works without a bundler — uses the global
// window.Capacitor object injected by Capacitor.
// Falls back to localStorage in browser/devtools.
// ==========================================
const Storage = {
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('[PackCheck] Storage.set failed:', key, e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        showToast(t('toast_storage_full'), 'error', 4000);
      } else {
        showToast('Error saving data.', 'error');
      }
    }
  },

  async get(key) {
    try {
      return localStorage.getItem(key) ?? null;
    } catch (e) {
      console.error('[PackCheck] Storage.get failed:', key, e);
      return null;
    }
  },

  async remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('[PackCheck] Storage.remove failed:', key, e);
    }
  }
};

// ==========================================
// NOTIFICATIONS ADAPTER (Web Notification API)
// Uses native browser Notifications and absolute targets
// to schedule reminders dynamically (avoiding high CPU/RAM usage).
// ==========================================
let dynamicSchedulerTimer = null;

function showWebNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(t('notif_return_title'), {
      body: t('notif_return_body'),
      icon: 'icon-192.png'
    });
  }
}

function runDynamicScheduler() {
  if (dynamicSchedulerTimer) {
    clearTimeout(dynamicSchedulerTimer);
    dynamicSchedulerTimer = null;
  }

  const targetTimeStr = state.settings.reminderTargetTime;
  if (!targetTimeStr || !state.settings.reminderEnabled) {
    return;
  }

  const targetTime = new Date(targetTimeStr);
  const now = new Date();
  const diff = targetTime.getTime() - now.getTime();

  if (diff <= 0) {
    showWebNotification();
    if (state.settings.reminderMode === 'interval') {
      // Reschedule for next interval
      const hoursVal = Number(state.settings.reminderInterval || 3);
      const nextTarget = new Date(now.getTime() + hoursVal * 3600 * 1000);
      state.settings.reminderTargetTime = nextTarget.toISOString();
      saveSettings().catch(console.error);
      runDynamicScheduler();
    } else {
      state.settings.reminderTargetTime = null;
      saveSettings().catch(console.error);
    }
    return;
  }

  // Optimize timer interval depending on distance to target to save CPU and RAM resources
  let nextCheckMs = 30 * 60 * 1000; // Check in 30 mins by default
  if (diff <= 60 * 1000) {
    // Less than 1 minute, check every 5 seconds for precision
    nextCheckMs = 5 * 1000;
  } else if (diff <= 30 * 60 * 1000) {
    // Less than 30 minutes, check every 1 minute
    nextCheckMs = 60 * 1000;
  }

  console.log(`[PackCheck] Reminder triggers in ${Math.round(diff / 1000)}s. Next check in ${Math.round(nextCheckMs / 1000)}s.`);
  dynamicSchedulerTimer = setTimeout(runDynamicScheduler, nextCheckMs);
}

const Notifications = {
  async isAvailable() {
    return 'Notification' in window;
  },

  async requestPermission() {
    if (!(await this.isAvailable())) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.error('[PackCheck] Web Notification permission request failed:', e);
      return false;
    }
  },

  async cancelAll() {
    if (dynamicSchedulerTimer) {
      clearTimeout(dynamicSchedulerTimer);
      dynamicSchedulerTimer = null;
    }
    state.settings.reminderTargetTime = null;
    await saveSettings();
    console.log('[PackCheck] All web notifications cancelled and target cleared.');
  },

  async scheduleReturnReminders() {
    const settings = state.settings;
    if (dynamicSchedulerTimer) {
      clearTimeout(dynamicSchedulerTimer);
      dynamicSchedulerTimer = null;
    }

    if (!settings.reminderEnabled) {
      state.settings.reminderTargetTime = null;
      await saveSettings();
      return;
    }

    if (!(await this.isAvailable())) {
      console.warn('[PackCheck] Web Notifications not supported in this browser.');
      return;
    }

    // Ask for permission if default
    if (Notification.permission === 'default') {
      const granted = await this.requestPermission();
      if (!granted) return;
    } else if (Notification.permission !== 'granted') {
      console.warn('[PackCheck] Notification permission is denied.');
      return;
    }

    try {
      const now = new Date();
      let triggerDate = new Date();

      if (settings.reminderMode === 'time') {
        const [hours, minutes] = settings.reminderTime.split(':').map(Number);
        triggerDate.setHours(hours, minutes, 0, 0);

        if (triggerDate <= now) {
          triggerDate.setDate(triggerDate.getDate() + 1);
        }
      } else if (settings.reminderMode === 'interval') {
        const hoursVal = Number(settings.reminderInterval || 3);
        triggerDate = new Date(now.getTime() + hoursVal * 3600 * 1000);
      }

      state.settings.reminderTargetTime = triggerDate.toISOString();
      await saveSettings();

      console.log(`[PackCheck] Reminder scheduled target set to: ${state.settings.reminderTargetTime}`);
      runDynamicScheduler();
    } catch (e) {
      console.error('[PackCheck] Web Notification scheduling failed:', e);
    }
  }
};

// ==========================================
// SAFE JSON PARSE
// Each key is parsed independently — a corrupt
// key only resets that key, not everything else.
// ==========================================
function safeParse(str, fallback) {
  if (!str) return fallback;
  try {
    const parsed = JSON.parse(str);
    return parsed ?? fallback;
  } catch (e) {
    console.warn('[PackCheck] safeParse failed, using fallback:', e);
    return fallback;
  }
}

// ==========================================
// i18n — STRING DEFINITIONS
// ==========================================
const STRINGS = {
  en: {
    tab_today: 'Today', tab_items: 'Items', tab_history: 'History', tab_settings: 'Settings',
    group_all: 'All', group_hoc: 'School', group_lam: 'Work', group_gym: 'Gym',
    group_ngoai: 'Outdoors', group_choi: 'Hangout',
    progress_packed: 'packed',
    form_photo: 'Photo', form_name: 'Item Name *', form_note: 'Note (optional)',
    form_group: 'Group Tag', form_required: 'Required Item',
    form_name_ph: 'e.g. Water bottle', form_note_ph: 'e.g. Fill before leaving',
    add_header: 'Add New Item', edit_header: 'Edit Item', btn_add: 'Add Item', btn_save_changes: 'Save Changes', btn_cancel: 'Cancel',
    btn_delete: 'Delete', btn_save_day: "Save Today's Pack",
    save_hint: 'Logs your checked items and flags missed required ones.',
    upload_text: 'Tap to upload photo', required_badge: '⭐ Must',
    empty_today_title: "Your bag is empty!",
    empty_today_sub: "Go to the <strong>Items</strong> tab to add things you carry.",
    empty_items_title: "No items yet!",
    empty_items_sub: "Click <strong>Add New Item</strong> above to get started.",
    empty_group: "No items in this group",
    empty_history_title: "No history yet!",
    empty_history_sub: "Save your first daily pack from the <strong>Today</strong> tab.",
    history_title: 'Pack History', history_sub: 'Last 30 days of your daily packs',
    history_packed: 'Packed items', history_missed: '⚠️ Missed required items',
    history_nothing: 'Nothing checked this day.', history_items: 'items',
    history_missed_badge: (n) => `⚠️ ${n} missed`,
    history_pct_badge: (p) => `✅ ${p}% packed`,
    toast_photo_large: '📸 Photo too large (max 5MB)',
    toast_storage_full: '💾 Storage quota exceeded! Try using a smaller photo.',
    toast_name_required: '📝 Please enter an item name',
    toast_added: (name) => `🎉 "${name}" added!`,
    toast_updated: (name) => `🎉 "${name}" updated!`,
    toast_deleted: '🗑️ Item deleted',
    toast_saved: (c, t) => `✅ Day saved! ${c}/${t} packed.`,
    toast_missed_msg: (n) => ` ⚠️ ${n} required item(s) missed!`,
    toast_cleared: '🗑️ All data cleared.',
    modal_delete_title: 'Delete Item?',
    modal_delete_body: (name) => `"${name}" will be removed from your list permanently.`,
    settings_title: 'Settings', settings_lang: 'Language',
    settings_clear_label: 'Clear All Data', settings_clear_btn: 'Reset',
    settings_clear_hint: 'Erases all items, history, and settings permanently.',
    settings_clear_confirm: 'This will erase ALL items, history, and settings. This cannot be undone. Continue?',
    about_desc: 'Your cozy daily carry checklist planner.',
    settings_groups_title: 'Group Tags',
    group_name_placeholder: 'Group name',
    btn_add_group: 'Add',
    settings_backup_title: 'Data Backup',
    settings_backup_hint: 'Export your daily items and history or restore from a backup file.',
    btn_export_backup: 'Export Backup',
    btn_import_backup: 'Import Backup',
    toast_backup_exported: '🎉 Backup file downloaded successfully!',
    toast_backup_imported: '✅ Backup restored successfully!',
    toast_backup_invalid: '❌ Invalid backup file format.',
    confirm_import_backup: '⚠️ Importing a backup will overwrite ALL your current items, history, and settings. Do you want to continue?',
    confirm_delete_group: (name) => `Are you sure you want to delete the group "${name}"? Items using this group will be uncategorized.`,
    toast_group_added: (name) => `🎉 Group "${name}" added!`,
    toast_group_deleted: '🗑️ Group deleted',
    toast_group_exists: '⚠️ Group name already exists!',
    toast_group_name_empty: '⚠️ Please enter a group name',

    // Pack & Return
    phase_packing: 'Morning Packing',
    phase_returning: 'Evening Return',
    btn_switch_returning: 'Switch to Return',
    btn_switch_packing: 'Switch to Packing',
    step_select: '1. Select Items',
    step_pack: '2. Pack Bag',
    btn_next_pack: 'Continue to Packing',
    btn_start_carry: 'Start Carrying',
    btn_finish_day: 'Finish Day & Return',
    save_hint_select: 'Select items you want to carry today.',
    save_hint_packing: 'Pack the selected items into your bag.',
    save_hint_returning: 'Check off items as you put them back in your bag.',
    settings_reminder_title: 'Return Reminder',
    reminder_enable: 'Enable Reminder',
    reminder_mode: 'Reminder Mode',
    mode_time: 'Time',
    mode_interval: 'Interval',
    reminder_time_label: 'Set Time',
    reminder_interval_label: 'Every X hours',
    notif_return_title: 'PackCheck 🎒',
    notif_return_body: 'Time to go home! Double check your bag so you do not leave anything behind.',
    streak_days: 'days',
    quick_templates: 'Quick Templates',
    quick_templates_hint: 'Select all items in a group instantly',
    toast_template_applied: (name, count) => `Applied "${name}" template! ${count} items selected.`,
    streak_title_active: (n) => `${n}-Day Streak! 🔥`,
    streak_title_zero: 'Start Your Streak! 🌱',
    streak_desc_active: 'Amazing! You checked 100% of your items. Keep the fire burning! ⚡',
    streak_desc_zero: 'Pack and return 100% of your items today to start your streak! 🎒'
  },
  vi: {
    tab_today: 'Hôm nay', tab_items: 'Đồ vật', tab_history: 'Lịch sử', tab_settings: 'Cài đặt',
    group_all: 'Tất cả', group_hoc: 'Đi học', group_lam: 'Đi làm', group_gym: 'Đi gym',
    group_ngoai: 'Ra ngoài', group_choi: 'Đi chơi',
    progress_packed: 'đã xếp',
    form_photo: 'Ảnh', form_name: 'Tên đồ vật *', form_note: 'Ghi chú (tuỳ chọn)',
    form_group: 'Nhóm', form_required: 'Bắt buộc mang',
    form_name_ph: 'vd: Bình nước', form_note_ph: 'vd: Đổ đầy trước khi đi',
    add_header: 'Thêm đồ vật mới', edit_header: 'Chỉnh sửa đồ vật', btn_add: 'Thêm', btn_save_changes: 'Lưu thay đổi', btn_cancel: 'Huỷ',
    btn_delete: 'Xoá', btn_save_day: 'Lưu hôm nay',
    save_hint: 'Lưu danh sách đã check và đánh dấu đồ bắt buộc bị bỏ quên.',
    upload_text: 'Bấm để tải ảnh lên', required_badge: '⭐ Bắt buộc',
    empty_today_title: "Túi xách trống!",
    empty_today_sub: "Vào tab <strong>Đồ vật</strong> để thêm đồ mang theo.",
    empty_items_title: "Chưa có đồ vật nào!",
    empty_items_sub: "Bấm <strong>Thêm đồ vật mới</strong> phía trên để bắt đầu.",
    empty_group: "Không có đồ vật trong nhóm này",
    empty_history_title: "Chưa có lịch sử!",
    empty_history_sub: "Lưu ngày hôm nay từ tab <strong>Hôm nay</strong>.",
    history_title: 'Lịch sử xếp đồ', history_sub: '30 ngày gần nhất',
    history_packed: 'Đồ đã xếp', history_missed: '⚠️ Đồ bắt buộc bị bỏ quên',
    history_nothing: 'Hôm đó không check gì cả.', history_items: 'đồ vật',
    history_missed_badge: (n) => `⚠️ ${n} bị quên`,
    history_pct_badge: (p) => `✅ ${p}% đã xếp`,
    toast_photo_large: '📸 Ảnh quá lớn (tối đa 5MB)',
    toast_storage_full: '💾 Bộ nhớ đầy! Vui lòng thử dùng ảnh kích thước nhỏ hơn.',
    toast_name_required: '📝 Vui lòng nhập tên đồ vật',
    toast_added: (name) => `🎉 Đã thêm "${name}"!`,
    toast_updated: (name) => `🎉 Đã cập nhật "${name}"!`,
    toast_deleted: '🗑️ Đã xoá đồ vật',
    toast_saved: (c, total) => `✅ Đã lưu! ${c}/${total} đã xếp.`,
    toast_missed_msg: (n) => ` ⚠️ ${n} đồ bắt buộc bị bỏ quên!`,
    toast_cleared: '🗑️ Đã xoá toàn bộ dữ liệu.',
    modal_delete_title: 'Xoá đồ vật?',
    modal_delete_body: (name) => `"${name}" sẽ bị xoá vĩnh viễn.`,
    settings_title: 'Cài đặt', settings_lang: 'Ngôn ngữ',
    settings_clear_label: 'Xoá toàn bộ dữ liệu', settings_clear_btn: 'Reset',
    settings_clear_hint: 'Xoá hết đồ vật, lịch sử và cài đặt vĩnh viễn.',
    settings_clear_confirm: 'Thao tác này sẽ xoá TOÀN BỘ đồ vật, lịch sử và cài đặt và không thể hoàn tác. Tiếp tục?',
    about_desc: 'Ứng dụng nhắc nhở đồ mang theo hằng ngày.',
    settings_groups_title: 'Nhóm đồ vật',
    group_name_placeholder: 'Tên nhóm',
    btn_add_group: 'Thêm',
    settings_backup_title: 'Sao lưu dữ liệu',
    settings_backup_hint: 'Xuất dữ liệu đồ vật và lịch sử hằng ngày hoặc khôi phục từ file sao lưu.',
    btn_export_backup: 'Xuất sao lưu',
    btn_import_backup: 'Nhập sao lưu',
    toast_backup_exported: '🎉 Đã tải file sao lưu thành công!',
    toast_backup_imported: '✅ Đã khôi phục dữ liệu từ file sao lưu!',
    toast_backup_invalid: '❌ File sao lưu không hợp lệ.',
    confirm_import_backup: '⚠️ Việc nhập file sao lưu sẽ GHI ĐÈ toàn bộ đồ vật, lịch sử và cài đặt hiện tại của bạn. Bạn có chắc chắn muốn tiếp tục?',
    confirm_delete_group: (name) => `Bạn có chắc chắn muốn xoá nhóm "${name}"? Các đồ dùng thuộc nhóm này sẽ không còn phân nhóm.`,
    toast_group_added: (name) => `🎉 Đã thêm nhóm "${name}"!`,
    toast_group_deleted: '🗑️ Đã xoá nhóm',
    toast_group_exists: '⚠️ Tên nhóm đã tồn tại!',
    toast_group_name_empty: '⚠️ Vui lòng nhập tên nhóm',

    // Pack & Return
    phase_packing: 'Buổi sáng: Đi',
    phase_returning: 'Buổi chiều: Về',
    btn_switch_returning: 'Chuyển sang Pha Về',
    btn_switch_packing: 'Chuyển sang Pha Đi',
    step_select: '1. Chọn đồ mang',
    step_pack: '2. Xếp đồ vào balo',
    btn_next_pack: 'Tiếp tục xếp đồ',
    btn_start_carry: 'Bắt đầu đi thôi!',
    btn_finish_day: 'Hoàn thành ngày & Về',
    save_hint_select: 'Chọn các món đồ bạn muốn mang theo hôm nay.',
    save_hint_packing: 'Hãy xếp các món đồ đã chọn vào balo của bạn.',
    save_hint_returning: 'Tích chọn đồ khi bạn xếp chúng lại vào balo để đi về.',
    settings_reminder_title: 'Nhắc nhở lúc về',
    reminder_enable: 'Bật nhắc nhở',
    reminder_mode: 'Chế độ nhắc',
    mode_time: 'Hẹn giờ',
    mode_interval: 'Định kỳ',
    reminder_time_label: 'Chọn giờ',
    reminder_interval_label: 'Nhắc mỗi X giờ',
    notif_return_title: 'PackCheck 🎒',
    notif_return_body: 'Đến giờ ra về rồi! Hãy kiểm tra túi xách để không bỏ quên món đồ nào nhé.',
    streak_days: 'ngày',
    quick_templates: 'Chọn nhanh mẫu',
    quick_templates_hint: 'Chọn nhanh toàn bộ đồ dùng trong nhóm',
    toast_template_applied: (name, count) => `Đã áp dụng mẫu "${name}"! Đã chọn ${count} món đồ.`,
    streak_title_active: (n) => `Chuỗi ${n} ngày liên tục! 🔥`,
    streak_title_zero: 'Bắt đầu chuỗi mới! 🌱',
    streak_desc_active: 'Tuyệt vời! Bạn đã mang về đủ 100% đồ vật nhiều ngày liên tiếp. Tiếp tục duy trì nhé! ⚡',
    streak_desc_zero: 'Kiểm đủ 100% hành lý ra về hôm nay để bắt đầu chuỗi tích luỹ! 🎒'
  }
};

// ==========================================
// GROUPS — single source of truth
// Internal keys stay Vietnamese for localStorage
// backward compatibility. Only display labels
// are translated via i18n.
// ==========================================
const DEFAULT_GROUPS = [
  { key: 'Đi học', emoji: '🏫', i18nKey: 'group_hoc', cls: 'tag-hoc', name: 'School' },
  { key: 'Đi làm', emoji: '💼', i18nKey: 'group_lam', cls: 'tag-lam', name: 'Work' },
  { key: 'Đi gym', emoji: '🏋️', i18nKey: 'group_gym', cls: 'tag-gym', name: 'Gym' },
  { key: 'Ra ngoài', emoji: '🌿', i18nKey: 'group_ngoai', cls: 'tag-ngoai', name: 'Outdoors' },
  { key: 'Đi chơi', emoji: '🎉', i18nKey: 'group_choi', cls: 'tag-choi', name: 'Hangout' },
];

function getGroup(key) { return state.groups.find(g => g.key === key); }

// ==========================================
// STATE & STORAGE KEYS
// ==========================================
const STORAGE_KEYS = {
  ITEMS: 'packcheck_items',
  HISTORY: 'packcheck_history',
  TODAY: 'packcheck_today_state',
  LANG: 'packcheck_lang',
  SETTINGS: 'packcheck_settings',
  GROUPS: 'packcheck_groups'
};

let state = {
  items: [],
  history: [],
  groups: [],
  todayFilter: 'all',
  itemsFilter: 'all',
  activeTab: 'today',
  deleteTargetId: null,
  editItemId: null,
  selectedGroup: null,
  formOpen: true,
  lang: 'en',
  todayState: {
    date: '',
    phase: 'packing', // 'packing' | 'returning'
    step: 'select',   // 'select' | 'pack'
    carry: {},        // { [itemId]: boolean }
    packed: {},       // { [itemId]: boolean }
    returned: {}      // { [itemId]: boolean }
  },
  settings: {
    reminderEnabled: false,
    reminderMode: 'time', // 'time' | 'interval'
    reminderTime: '17:00',
    reminderInterval: '3',
    reminderTargetTime: null
  }
};

// Migration no longer required for pure web builds.

// ==========================================
// LOAD — async, each key parsed independently
// ==========================================
async function loadState() {
  const [itemsStr, historyStr, langVal, todayStr, settingsStr, groupsStr] = await Promise.all([
    Storage.get(STORAGE_KEYS.ITEMS),
    Storage.get(STORAGE_KEYS.HISTORY),
    Storage.get(STORAGE_KEYS.LANG),
    Storage.get(STORAGE_KEYS.TODAY),
    Storage.get(STORAGE_KEYS.SETTINGS),
    Storage.get(STORAGE_KEYS.GROUPS)
  ]);

  // Each key parsed independently — one corrupt key won't wipe the rest
  const parsedItems = safeParse(itemsStr, []);
  state.items = Array.isArray(parsedItems) ? parsedItems : [];

  const parsedHistory = safeParse(historyStr, []);
  state.history = Array.isArray(parsedHistory) ? parsedHistory : [];

  const parsedGroups = safeParse(groupsStr, []);
  state.groups = Array.isArray(parsedGroups) && parsedGroups.length > 0 ? parsedGroups : [...DEFAULT_GROUPS];

  state.lang = langVal || 'en';

  // Load Settings
  const loadedSettings = safeParse(settingsStr, {});
  state.settings = {
    reminderEnabled: loadedSettings.reminderEnabled ?? false,
    reminderMode: loadedSettings.reminderMode ?? 'time',
    reminderTime: loadedSettings.reminderTime ?? '17:00',
    reminderInterval: loadedSettings.reminderInterval ?? '3',
    reminderTargetTime: loadedSettings.reminderTargetTime ?? null
  };

  // Load Today Phase State
  const todayKey = getTodayKey();
  const todayRaw = safeParse(todayStr, {});

  if (todayRaw.date === todayKey) {
    state.todayState = {
      date: todayKey,
      phase: todayRaw.phase || 'packing',
      step: todayRaw.step || 'select',
      carry: todayRaw.carry || {},
      packed: todayRaw.packed || {},
      returned: todayRaw.returned || {}
    };
  } else {
    // Start of a brand new day!
    state.todayState = {
      date: todayKey,
      phase: 'packing',
      step: 'select',
      carry: {},
      packed: {},
      returned: {}
    };
    // Auto-select required items to be carried today
    state.items.forEach(item => {
      if (item.required) {
        state.todayState.carry[item.id] = true;
      }
    });
  }
}

// ==========================================
// SAVE — all async, call sites are fire-and-forget
// ==========================================
async function saveItems() {
  await Storage.set(STORAGE_KEYS.ITEMS, JSON.stringify(state.items));
}

async function saveHistory() {
  await Storage.set(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
}

async function saveLang() {
  await Storage.set(STORAGE_KEYS.LANG, state.lang);
}

async function saveTodayState() {
  await Storage.set(STORAGE_KEYS.TODAY, JSON.stringify({
    date: state.todayState.date || getTodayKey(),
    phase: state.todayState.phase,
    step: state.todayState.step,
    carry: state.todayState.carry,
    packed: state.todayState.packed,
    returned: state.todayState.returned
  }));
}

async function saveSettings() {
  await Storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
}

async function saveGroups() {
  await Storage.set(STORAGE_KEYS.GROUPS, JSON.stringify(state.groups));
}

// ==========================================
// UTILS
// ==========================================
function getTodayKey() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1; // 0-indexed month
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const dateObj = new Date(y, m, d);
      if (!isNaN(dateObj.getTime())) {
        const locale = state.lang === 'vi' ? 'vi-VN' : 'en-US';
        return dateObj.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }
    }
  }
  return dateStr; // Fallback to raw string if parsing fails
}

function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getItemEmoji(item) { const g = getGroup(item.group); return g ? g.emoji : '📦'; }
function getGroupCls(key) { const g = getGroup(key); return g ? g.cls : 'tag-default'; }
function getGroupLabel(key) {
  const g = getGroup(key);
  if (!g) return key;
  const labelText = g.i18nKey ? t(g.i18nKey) : g.name;
  return `${g.emoji} ${labelText}`;
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

function updateFormTexts() {
  const titleEl = document.querySelector('#add-item-card .add-title');
  const submitBtn = document.getElementById('btn-add-item');
  if (!submitBtn) return;
  const submitSpan = submitBtn.querySelector('span') || submitBtn;
  if (state.editItemId !== null) {
    if (titleEl) titleEl.textContent = t('edit_header');
    if (submitSpan) submitSpan.textContent = t('btn_save_changes');
  } else {
    if (titleEl) titleEl.textContent = t('add_header');
    if (submitSpan) submitSpan.textContent = t('btn_add');
  }
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });
  document.documentElement.lang = state.lang === 'vi' ? 'vi' : 'en';
  updateFormTexts();
  renderGroupFilters();
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
  if (tab === 'today') renderToday();
  if (tab === 'items') renderItems();
  if (tab === 'history') renderHistory();
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
  let list = [];
  if (state.todayState.phase === 'packing') {
    if (state.todayState.step === 'select') {
      list = state.items;
    } else {
      list = state.items.filter(i => state.todayState.carry[i.id]);
    }
  } else {
    // Returning phase
    list = state.items.filter(i => state.todayState.carry[i.id]);
  }

  if (state.todayFilter !== 'all') {
    list = list.filter(i => i.group === state.todayFilter);
  }
  return list;
}

function renderToday() {
  const banner = document.getElementById('phase-banner');
  const emojiEl = document.getElementById('phase-emoji');
  const textEl = document.getElementById('phase-text');
  const toggleBtn = document.getElementById('btn-toggle-phase');
  const stepNav = document.getElementById('step-nav');
  const grid = document.getElementById('today-grid');
  const emptyEl = document.getElementById('today-empty');
  const emptyTitle = document.getElementById('today-empty-title');
  const emptySub = document.getElementById('today-empty-sub');
  const filterRow = document.getElementById('today-filter-row');

  const nextBtn = document.getElementById('btn-action-next');
  const startBtn = document.getElementById('btn-action-start');
  const finishBtn = document.getElementById('btn-action-finish');
  const hintEl = document.getElementById('save-hint');

  updateProgressBar();

  // Update Banner based on phase
  if (state.todayState.phase === 'packing') {
    banner.className = 'phase-banner packing';
    emojiEl.textContent = '🌅';
    textEl.textContent = t('phase_packing');
    toggleBtn.textContent = t('btn_switch_returning');
    stepNav.style.display = 'flex';
    filterRow.style.display = 'flex';

    // Update step tabs active state
    document.getElementById('step-btn-select').classList.toggle('active', state.todayState.step === 'select');
    document.getElementById('step-btn-pack').classList.toggle('active', state.todayState.step === 'pack');
  } else {
    banner.className = 'phase-banner returning';
    emojiEl.textContent = '🏡';
    textEl.textContent = t('phase_returning');
    toggleBtn.textContent = t('btn_switch_packing');
    stepNav.style.display = 'none';
    filterRow.style.display = 'flex';
  }

  const templatesSection = document.getElementById('templates-section');
  if (templatesSection) {
    const showTemplates = state.todayState.phase === 'packing' && state.todayState.step === 'select' && state.items.length > 0;
    templatesSection.style.display = showTemplates ? 'block' : 'none';
    if (showTemplates) {
      renderTemplates();
    }
  }

  if (state.items.length === 0) {
    grid.innerHTML = '';
    emptyEl.classList.remove('hidden');
    emptyTitle.textContent = t('empty_today_title');
    emptySub.innerHTML = t('empty_today_sub');

    nextBtn.style.display = 'none';
    startBtn.style.display = 'none';
    finishBtn.style.display = 'none';
    return;
  }

  emptyEl.classList.add('hidden');
  const items = getFilteredTodayItems();
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:span 2;padding:30px 10px;">
      <div class="empty-illustration" style="font-size:2.5rem">🔍</div>
      <p class="empty-title" style="font-size:1rem">${t('empty_group')}</p>
    </div>`;
  } else {
    items.forEach(item => {
      grid.appendChild(buildTodayCard(item));
    });
  }

  // Update action buttons and hints at the bottom
  nextBtn.style.display = 'none';
  startBtn.style.display = 'none';
  finishBtn.style.display = 'none';

  if (state.todayState.phase === 'packing') {
    if (state.todayState.step === 'select') {
      nextBtn.style.display = 'block';
      hintEl.textContent = t('save_hint_select');
    } else {
      startBtn.style.display = 'block';
      hintEl.textContent = t('save_hint_packing');

      // Enable "Start Carrying" button only when all carried items are packed
      const totalToPack = state.items.filter(i => state.todayState.carry[i.id]).length;
      const packedCount = state.items.filter(i => state.todayState.carry[i.id] && state.todayState.packed[i.id]).length;

      startBtn.disabled = (totalToPack === 0 || packedCount < totalToPack);
      startBtn.style.opacity = startBtn.disabled ? '0.5' : '1';
    }
  } else {
    finishBtn.style.display = 'block';
    hintEl.textContent = t('save_hint_returning');
  }
}

function buildTodayCard(item) {
  const phase = state.todayState.phase;
  const step = state.todayState.step;

  if (phase === 'packing' && step === 'select') {
    return buildTodaySelectCard(item);
  } else {
    // Packing step 2 or Returning phase: list is checkable cards
    const isChecked = (phase === 'packing')
      ? !!state.todayState.packed[item.id]
      : !!state.todayState.returned[item.id];
    return buildTodayChecklistCard(item, isChecked);
  }
}

function buildTodaySelectCard(item) {
  const div = document.createElement('div');
  const isSelected = !!state.todayState.carry[item.id];

  div.className = `select-card${isSelected ? ' selected' : ''}${item.required ? ' required' : ''}`;
  div.dataset.id = item.id;
  div.setAttribute('role', 'checkbox');
  div.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  div.setAttribute('tabindex', '0');

  const photoHTML = item.photo
    ? `<img class="card-photo" src="${item.photo}" alt="${escapeHtml(item.name)}" loading="lazy" style="height: 100px; width: 100%; object-fit: cover; border-radius: var(--radius-sm);" />`
    : `<div class="card-photo-placeholder" style="height: 100px; display: flex; align-items: center; justify-content: center; background: var(--cream); font-size: 2rem; border-radius: var(--radius-sm);">${getItemEmoji(item)}</div>`;

  const noteHTML = item.note
    ? `<div class="card-note" style="font-size: 0.75rem; color: var(--text-mid); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.note)}">${escapeHtml(item.note)}</div>` : '';

  const groupHTML = item.group
    ? `<span class="card-group-tag ${getGroupCls(item.group)}" style="font-size: 0.65rem; padding: 2px 6px; border-radius: 10px;">${escapeHtml(getGroupLabel(item.group))}</span>` : '';

  const indicatorText = item.required
    ? t('required_badge')
    : isSelected ? (state.lang === 'vi' ? 'Mang đi' : 'Carry') : (state.lang === 'vi' ? 'Để nhà' : 'Leave');

  div.innerHTML = `
    <div style="position: relative;">
      ${photoHTML}
    </div>
    <div class="card-body" style="padding: 4px 0 0; display: flex; flex-direction: column; gap: 4px;">
      <div class="card-name" style="font-weight: 700; font-size: 0.9rem; color: var(--text-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
      ${noteHTML}
      <div class="select-card-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        ${groupHTML}
        <span class="select-indicator" style="font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 12px; background: ${item.required ? 'var(--peach-light)' : isSelected ? 'var(--sage-light)' : 'var(--cream-dark)'}; color: ${item.required ? 'var(--peach-dark)' : isSelected ? 'var(--sage-dark)' : 'var(--text-mid)'};">${indicatorText}</span>
      </div>
    </div>`;

  const toggleSelect = () => {
    if (item.required) {
      showToast(state.lang === 'vi' ? '⭐ Món đồ này bắt buộc mang!' : '⭐ This item is required!', 'info');
      return;
    }
    state.todayState.carry[item.id] = !state.todayState.carry[item.id];
    saveTodayState().catch(console.error);
    renderToday();
  };

  div.addEventListener('click', toggleSelect);
  div.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSelect();
    }
  });

  return div;
}

function buildTodayChecklistCard(item, checked) {
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
  const groupHTML = item.group
    ? `<span class="card-group-tag ${getGroupCls(item.group)}">${escapeHtml(getGroupLabel(item.group))}</span>` : '';
  const requiredHTML = item.required
    ? `<span class="required-badge">${t('required_badge')}</span>` : '';

  const checkPathColor = state.todayState.phase === 'packing' ? '#E74C3C' : '#5DADE2';
  const stampStyle = state.todayState.phase === 'packing' ? '' : 'border-color: #5DADE2; color: #5DADE2;';

  div.innerHTML = `
    <div class="card-photo-wrap">${photoHTML}</div>
    <div class="check-overlay">
      <div class="check-stamp" style="${stampStyle}">
        <div class="check-stamp-inner">
          <svg class="check-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path class="check-path" d="M4 12.5 L9 18 L20 7" stroke="${checkPathColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="card-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
      ${noteHTML}
      <div class="card-footer">${groupHTML}${requiredHTML}</div>
    </div>`;

  const handleCheck = () => {
    const phase = state.todayState.phase;
    if (phase === 'packing') {
      state.todayState.packed[item.id] = !state.todayState.packed[item.id];
    } else {
      state.todayState.returned[item.id] = !state.todayState.returned[item.id];
    }

    saveTodayState().catch(console.error);

    const isNowChecked = phase === 'packing'
      ? !!state.todayState.packed[item.id]
      : !!state.todayState.returned[item.id];

    div.classList.toggle('checked', isNowChecked);
    div.setAttribute('aria-pressed', isNowChecked ? 'true' : 'false');

    renderToday();
  };

  div.addEventListener('click', handleCheck);
  div.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCheck(); }
  });
  return div;
}

function updateProgressBar() {
  const phase = state.todayState.phase;
  const step = state.todayState.step;

  let total = 0;
  let checked = 0;
  let label = '';

  if (phase === 'packing') {
    if (step === 'select') {
      total = state.items.length;
      checked = state.items.filter(i => state.todayState.carry[i.id]).length;
      label = state.lang === 'vi' ? 'chọn mang' : 'selected';
    } else {
      total = state.items.filter(i => state.todayState.carry[i.id]).length;
      checked = state.items.filter(i => state.todayState.carry[i.id] && state.todayState.packed[i.id]).length;
      label = t('progress_packed');
    }
  } else {
    total = state.items.filter(i => state.todayState.carry[i.id]).length;
    checked = state.items.filter(i => state.todayState.carry[i.id] && state.todayState.returned[i.id]).length;
    label = state.lang === 'vi' ? 'đã mang về' : 'returned';
  }

  const pct = total === 0 ? 0 : Math.round((checked / total) * 100);

  document.getElementById('progress-text').textContent = `${checked} / ${total} ${label}`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('progress-bar-container').setAttribute('aria-valuenow', pct);

  const emojis = ['🌱', '🐣', '🌸', '🌟', '⚡', '🎉'];
  const idx = pct === 0 ? 0 : pct < 30 ? 1 : pct < 60 ? 2 : pct < 90 ? 3 : pct < 100 ? 4 : 5;
  document.getElementById('progress-emoji').textContent = emojis[idx];
}

async function saveDay() {
  const todayKey = getTodayKey();

  // Carried items
  const carryItems = state.items.filter(i => state.todayState.carry[i.id]);
  // Successfully returned items
  const returnedItems = carryItems.filter(i => state.todayState.returned[i.id]);
  // Missed items
  const missedItems = carryItems.filter(i => !state.todayState.returned[i.id]);

  const entry = {
    date: todayKey,
    checkedCount: returnedItems.length,
    totalCount: carryItems.length,
    checked: returnedItems.map(i => ({ id: i.id, name: i.name, group: i.group })),
    missed: missedItems.map(i => ({ id: i.id, name: i.name, group: i.group }))
  };

  // Save in history
  state.history = state.history.filter(h => h.date !== todayKey);
  state.history.unshift(entry);
  if (state.history.length > 30) state.history = state.history.slice(0, 30);

  await saveHistory();

  // Clean up today state
  state.todayState = {
    date: todayKey,
    phase: 'packing',
    step: 'select',
    carry: {},
    packed: {},
    returned: {}
  };

  // Auto-select required items for next packing cycle
  state.items.forEach(item => {
    if (item.required) {
      state.todayState.carry[item.id] = true;
    }
  });

  await saveTodayState();
  await Notifications.cancelAll();
  updateStreak();

  const missedCount = missedItems.length;
  const missedMsg = missedCount > 0 ? tf('toast_missed_msg', missedCount) : '';
  showToast(tf('toast_saved', returnedItems.length, carryItems.length) + missedMsg,
    missedCount > 0 ? 'error' : 'success', 3500);

  renderToday();
}

function renderGroupFilters() {
  const todayRow = document.getElementById('today-filter-row');
  const itemsRow = document.getElementById('items-filter-row');
  const groupSel = document.getElementById('group-selector');

  if (!todayRow || !itemsRow) return;

  // 1. Render Today Filters
  let todayHTML = `<button class="filter-chip${state.todayFilter === 'all' ? ' active' : ''}" data-group="all">${t('group_all')}</button>`;
  state.groups.forEach(g => {
    const label = g.i18nKey ? t(g.i18nKey) : g.name;
    const active = state.todayFilter === g.key;
    todayHTML += `<button class="filter-chip${active ? ' active' : ''}" data-group="${escapeHtml(g.key)}">${g.emoji} <span>${escapeHtml(label)}</span></button>`;
  });
  todayRow.innerHTML = todayHTML;

  // Re-wire click events for today filters
  todayRow.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.todayFilter = chip.dataset.group;
      todayRow.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderToday();
    });
  });

  // 2. Render Items Filters
  let itemsHTML = `<button class="filter-chip${state.itemsFilter === 'all' ? ' active' : ''}" data-group="all">${t('group_all')}</button>`;
  state.groups.forEach(g => {
    const label = g.i18nKey ? t(g.i18nKey) : g.name;
    const active = state.itemsFilter === g.key;
    itemsHTML += `<button class="filter-chip${active ? ' active' : ''}" data-group="${escapeHtml(g.key)}">${g.emoji} <span>${escapeHtml(label)}</span></button>`;
  });
  itemsRow.innerHTML = itemsHTML;

  // Re-wire click events for items filters
  itemsRow.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.itemsFilter = chip.dataset.group;
      itemsRow.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderItems();
    });
  });

  // 3. Render Group Selector Options in Add Item Form
  if (groupSel) {
    let selHTML = '';
    state.groups.forEach(g => {
      const label = g.i18nKey ? t(g.i18nKey) : g.name;
      const selected = state.selectedGroup === g.key;
      selHTML += `<button type="button" class="group-option${selected ? ' selected' : ''}" data-group="${escapeHtml(g.key)}">${g.emoji} <span>${escapeHtml(label)}</span></button>`;
    });
    groupSel.innerHTML = selHTML;

    // Re-wire click events for group selector
    groupSel.querySelectorAll('.group-option').forEach(btn => {
      btn.addEventListener('click', () => {
        groupSel.querySelectorAll('.group-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.selectedGroup = btn.dataset.group;
      });
    });
  }
}

// ==========================================
/* QUICK TEMPLATES & STREAK LOGIC */
// ==========================================
function renderTemplates() {
  const rowEl = document.getElementById('today-templates-row');
  if (!rowEl) return;

  rowEl.innerHTML = '';
  
  state.groups.forEach(g => {
    const label = g.i18nKey ? t(g.i18nKey) : g.name;
    const btn = document.createElement('button');
    btn.className = `template-btn ${g.cls || 'tag-default'}`;
    btn.innerHTML = `${g.emoji} <span>${escapeHtml(label)}</span>`;
    
    btn.addEventListener('click', () => {
      applyTemplate(g.key);
    });
    
    rowEl.appendChild(btn);
  });
}

function applyTemplate(groupKey) {
  let selectedCount = 0;
  state.items.forEach(item => {
    if (item.group === groupKey || item.required) {
      state.todayState.carry[item.id] = true;
      if (item.group === groupKey) {
        selectedCount++;
      }
    } else {
      state.todayState.carry[item.id] = false;
    }
  });

  saveTodayState().catch(console.error);
  renderToday();
  
  const group = getGroup(groupKey);
  const label = group ? (group.i18nKey ? t(group.i18nKey) : group.name) : groupKey;
  showToast(tf('toast_template_applied', label, selectedCount), 'success');
}

function updateStreak() {
  const perfectDates = new Set();
  state.history.forEach(entry => {
    const isPerfect = entry.totalCount > 0 && entry.checkedCount === entry.totalCount;
    if (isPerfect) {
      perfectDates.add(entry.date);
    }
  });

  let streak = 0;
  const today = new Date();
  
  const formatDateStr = (d) => {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 10);
  };

  let checkDate = new Date(today);
  let checkDateStr = formatDateStr(checkDate);

  if (perfectDates.has(checkDateStr)) {
    while (perfectDates.has(checkDateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = formatDateStr(checkDate);
    }
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    checkDateStr = formatDateStr(checkDate);
    if (perfectDates.has(checkDateStr)) {
      while (perfectDates.has(checkDateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        checkDateStr = formatDateStr(checkDate);
      }
    }
  }

  const countEl = document.getElementById('streak-count');
  const badgeEl = document.getElementById('streak-badge');
  if (countEl && badgeEl) {
    countEl.textContent = streak;
    if (streak > 0) {
      badgeEl.className = 'streak-badge active';
    } else {
      badgeEl.className = 'streak-badge zero';
    }
  }

  const historyCard = document.getElementById('history-streak-card');
  const historyTitle = document.getElementById('streak-motivation-title');
  const historyDesc = document.getElementById('streak-motivation-desc');
  const historyIcon = historyCard ? historyCard.querySelector('.streak-motivation-icon') : null;

  if (historyCard && historyTitle && historyDesc) {
    if (streak > 0) {
      historyCard.className = 'streak-motivation-card';
      historyTitle.textContent = tf('streak_title_active', streak);
      historyDesc.textContent = t('streak_desc_active');
      if (historyIcon) historyIcon.textContent = '🔥';
    } else {
      historyCard.className = 'streak-motivation-card zero';
      historyTitle.textContent = t('streak_title_zero');
      historyDesc.textContent = t('streak_desc_zero');
      if (historyIcon) historyIcon.textContent = '🌱';
    }
  }
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
  const grid = document.getElementById('items-grid');
  const emptyEl = document.getElementById('items-empty');
  const items = getFilteredItems();

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
  const groupHTML = item.group
    ? `<span class="card-group-tag ${getGroupCls(item.group)}">${escapeHtml(getGroupLabel(item.group))}</span>`
    : `<span class="card-group-tag tag-default">—</span>`;
  const requiredHTML = item.required ? `<span class="required-badge">⭐</span>` : '';

  div.innerHTML = `
    ${photoHTML}
    <div class="item-manage-body">
      <div class="item-manage-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
      ${noteHTML}
      <div class="item-manage-footer">
        ${groupHTML}
        <div style="display:flex;align-items:center;gap:6px">
          ${requiredHTML}
          <button class="btn-edit-item" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}" title="Edit">✏️</button>
          <button class="btn-delete-item" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.name)}" title="Delete">🗑️</button>
        </div>
      </div>
    </div>`;

  div.querySelector('.btn-edit-item').addEventListener('click', e => {
    e.stopPropagation();
    window.startEditItem(item.id);
  });

  div.querySelector('.btn-delete-item').addEventListener('click', e => {
    e.stopPropagation();
    openDeleteModal(item.id, item.name);
  });
  return div;
}

function openDeleteModal(id, name) {
  state.deleteTargetId = id;
  document.getElementById('modal-title').textContent = t('modal_delete_title');
  document.getElementById('modal-body').textContent = tf('modal_delete_body', name);
  document.getElementById('modal-confirm').textContent = t('btn_delete');
  document.getElementById('modal-cancel').textContent = t('btn_cancel');
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  state.deleteTargetId = null;
  document.getElementById('modal-overlay').classList.add('hidden');
}
function confirmDelete() {
  if (!state.deleteTargetId) return;
  state.items = state.items.filter(i => i.id !== state.deleteTargetId);

  // Clean up from today's state
  delete state.todayState.carry[state.deleteTargetId];
  delete state.todayState.packed[state.deleteTargetId];
  delete state.todayState.returned[state.deleteTargetId];

  // fire-and-forget
  saveItems().catch(console.error);
  saveTodayState().catch(console.error);

  closeModal();
  renderItems();
  updateProgressBar();
  showToast(t('toast_deleted'), 'info');
}

function renderGroupManageList() {
  const listEl = document.getElementById('group-manage-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  state.groups.forEach(g => {
    const label = g.i18nKey ? t(g.i18nKey) : g.name;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'group-manage-item';
    itemDiv.innerHTML = `
      <div class="group-manage-info">
        <span class="group-manage-emoji">${escapeHtml(g.emoji)}</span>
        <span class="group-manage-name">${escapeHtml(label)}</span>
      </div>
      <button class="btn-delete-group" data-key="${escapeHtml(g.key)}" title="Delete Group">🗑️</button>
    `;

    itemDiv.querySelector('.btn-delete-group').addEventListener('click', () => {
      deleteGroup(g.key, label);
    });

    listEl.appendChild(itemDiv);
  });
}

async function deleteGroup(key, label) {
  if (!confirm(tf('confirm_delete_group', label))) return;

  // 1. Remove group from state.groups
  state.groups = state.groups.filter(g => g.key !== key);
  await saveGroups();

  // 2. Clear items using this group
  state.items = state.items.map(item => {
    if (item.group === key) {
      return { ...item, group: null };
    }
    return item;
  });
  await saveItems();

  // 3. Clear from today filter / items filter if active
  if (state.todayFilter === key) state.todayFilter = 'all';
  if (state.itemsFilter === key) state.itemsFilter = 'all';
  if (state.selectedGroup === key) state.selectedGroup = null;

  // 4. Update UI
  renderGroupFilters();
  renderGroupManageList();
  renderItems();
  renderToday();
  showToast(t('toast_group_deleted'), 'info');
}

function initGroupManageForm() {
  const form = document.getElementById('add-group-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const emojiInput = document.getElementById('add-group-emoji');
    const nameInput = document.getElementById('add-group-name');

    const emoji = emojiInput.value.trim() || '🎒';
    const name = nameInput.value.trim();

    if (!name) {
      showToast(t('toast_group_name_empty'), 'error');
      return;
    }

    // Check duplicate
    const exists = state.groups.some(g => {
      const label = g.i18nKey ? t(g.i18nKey) : g.name;
      return label.toLowerCase() === name.toLowerCase() || g.key.toLowerCase() === name.toLowerCase();
    });

    if (exists) {
      showToast(t('toast_group_exists'), 'error');
      return;
    }

    // Choose style color class rotating
    const clsList = ['tag-hoc', 'tag-lam', 'tag-gym', 'tag-ngoai', 'tag-choi'];
    const cls = clsList[state.groups.length % clsList.length];

    const newGroup = {
      key: name, // Using name as key for simplicity
      emoji,
      name,
      cls
    };

    state.groups.push(newGroup);
    await saveGroups();

    emojiInput.value = '';
    nameInput.value = '';

    renderGroupFilters();
    renderGroupManageList();
    showToast(tf('toast_group_added', name), 'success');
  });
}

function initBackupHandlers() {
  const exportBtn = document.getElementById('btn-export-backup');
  const importBtn = document.getElementById('btn-import-backup');
  const fileInput = document.getElementById('backup-file-input');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      try {
        const backupData = {
          version: '1.0',
          app: 'PackCheck',
          items: state.items,
          history: state.history,
          groups: state.groups,
          settings: state.settings
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const dateStr = getTodayKey();
        a.download = `packcheck_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);

        showToast(t('toast_backup_exported'), 'success');
      } catch (err) {
        console.error('[PackCheck] Export backup failed:', err);
        showToast('Error exporting backup.', 'error');
      }
    });
  }

  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async ev => {
        try {
          const content = ev.target.result;
          const parsed = JSON.parse(content);

          // Validate backup format
          if (!parsed || !Array.isArray(parsed.items) || !Array.isArray(parsed.history)) {
            showToast(t('toast_backup_invalid'), 'error');
            fileInput.value = '';
            return;
          }

          if (!confirm(t('confirm_import_backup'))) {
            fileInput.value = '';
            return;
          }

          // Import items
          state.items = parsed.items;
          await saveItems();

          // Import history
          state.history = parsed.history;
          await saveHistory();

          // Import groups
          if (Array.isArray(parsed.groups)) {
            state.groups = parsed.groups;
          } else {
            state.groups = [...DEFAULT_GROUPS];
          }
          await saveGroups();

          // Import settings
          if (parsed.settings) {
            state.settings = {
              reminderEnabled: parsed.settings.reminderEnabled ?? false,
              reminderMode: parsed.settings.reminderMode ?? 'time',
              reminderTime: parsed.settings.reminderTime ?? '17:00',
              reminderInterval: parsed.settings.reminderInterval ?? '3'
            };
            await saveSettings();
          }

          // Reset todayState
          state.todayState = {
            date: getTodayKey(),
            phase: 'packing',
            step: 'select',
            carry: {},
            packed: {},
            returned: {}
          };
          state.items.forEach(item => {
            if (item.required) {
              state.todayState.carry[item.id] = true;
            }
          });
          await saveTodayState();
          updateStreak();

          state.todayFilter = 'all';
          state.itemsFilter = 'all';
          state.selectedGroup = null;

          // Refresh UI
          applyI18n();
          if (state.activeTab === 'today') renderToday();
          if (state.activeTab === 'items') renderItems();
          if (state.activeTab === 'history') renderHistory();
          if (state.activeTab === 'settings') renderSettings();

          showToast(t('toast_backup_imported'), 'success');
        } catch (err) {
          console.error('[PackCheck] Import backup failed:', err);
          showToast(t('toast_backup_invalid'), 'error');
        }

        fileInput.value = '';
      };
      reader.readAsText(file);
    });
  }
}

// ==========================================
// IMAGE COMPRESSOR
// Resizes and compresses photo base64 strings to fit within
// localStorage quota constraints.
// ==========================================
function compressImage(dataUrl, callback, maxWidth = 500, maxHeight = 500, quality = 0.7) {
  const img = new Image();
  img.src = dataUrl;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    callback(compressedDataUrl);
  };
  img.onerror = (err) => {
    console.error('[PackCheck] Image load failed for compression:', err);
    callback(dataUrl);
  };
}

// ==========================================
// ADD ITEM FORM
// ==========================================
function initAddItemForm() {
  const toggle = document.getElementById('add-item-toggle');
  const form = document.getElementById('add-item-form');
  const chevron = document.getElementById('add-chevron');
  const photoInput = document.getElementById('item-photo');
  const photoPreview = document.getElementById('photo-preview');
  const photoPlaceholder = document.getElementById('photo-placeholder');
  const groupSelector = document.getElementById('group-selector');
  const cancelBtn = document.getElementById('btn-cancel-edit');

  let currentPhoto = null;

  window.startEditItem = (id) => {
    const item = state.items.find(i => i.id === id);
    if (!item) return;

    state.editItemId = id;

    // 1. Populate standard fields
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-note').value = item.note || '';
    document.getElementById('item-required').checked = !!item.required;

    // 2. Populate group tag selection
    state.selectedGroup = item.group;
    groupSelector.querySelectorAll('.group-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.group === item.group);
    });

    // 3. Populate photo preview
    currentPhoto = item.photo;
    if (item.photo) {
      photoPreview.src = item.photo;
      photoPreview.classList.remove('hidden');
      photoPlaceholder.classList.add('hidden');
    } else {
      photoPreview.classList.add('hidden');
      photoPreview.src = '';
      photoPlaceholder.classList.remove('hidden');
    }

    // 4. Update titles and buttons
    updateFormTexts();

    // 5. Expand form if hidden
    state.formOpen = true;
    form.classList.remove('hidden');
    chevron.classList.add('open');

    // 6. Scroll smoothly to form and focus name
    const formCard = document.getElementById('add-item-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => document.getElementById('item-name').focus(), 150);
  };

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
    state.selectedGroup = null;
    state.editItemId = null;
    updateFormTexts();
  });

  photoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast(t('toast_photo_large'), 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      compressImage(ev.target.result, (compressed) => {
        currentPhoto = compressed;
        photoPreview.src = currentPhoto;
        photoPreview.classList.remove('hidden');
        photoPlaceholder.classList.add('hidden');
      });
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

    if (state.editItemId !== null) {
      // Edit mode
      const item = state.items.find(i => i.id === state.editItemId);
      if (item) {
        item.name = name;
        item.photo = currentPhoto || null;
        item.note = document.getElementById('item-note').value.trim() || null;
        item.group = state.selectedGroup || null;
        item.required = document.getElementById('item-required').checked;

        saveItems().catch(console.error);

        // Sync required state to today carry
        if (item.required) {
          state.todayState.carry[item.id] = true;
          saveTodayState().catch(console.error);
        }

        showToast(tf('toast_updated', name), 'success');
      }
      state.editItemId = null;
    } else {
      // Add mode
      const newItem = {
        id: genId(), name,
        photo: currentPhoto || null,
        note: document.getElementById('item-note').value.trim() || null,
        group: state.selectedGroup || null,
        required: document.getElementById('item-required').checked
      };

      state.items.push(newItem);
      saveItems().catch(console.error);

      if (newItem.required) {
        state.todayState.carry[newItem.id] = true;
        saveTodayState().catch(console.error);
      }

      showToast(tf('toast_added', name), 'success');
    }

    state.formOpen = false;
    form.classList.add('hidden');
    chevron.classList.remove('open');
    resetAddForm(photoPreview, photoPlaceholder, groupSelector);
    currentPhoto = null; state.selectedGroup = null;
    updateFormTexts();

    renderItems();
    if (state.activeTab === 'today') renderToday();
    updateProgressBar();
  });
}

function resetAddForm(photoPreview, photoPlaceholder, groupSelector) {
  document.getElementById('item-name').value = '';
  document.getElementById('item-note').value = '';
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
  const list = document.getElementById('history-list');
  const emptyEl = document.getElementById('history-empty');

  updateStreak();

  document.getElementById('panel-history').querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.getElementById('panel-history').querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  if (state.history.length === 0) {
    list.innerHTML = ''; emptyEl.classList.remove('hidden'); return;
  }
  emptyEl.classList.add('hidden');
  list.innerHTML = '';
  state.history.forEach((entry, idx) => list.appendChild(buildHistoryEntry(entry, idx)));
}

function buildHistoryEntry(entry) {
  const div = document.createElement('div');
  div.className = 'history-entry';

  const pct = entry.totalCount > 0 ? Math.round((entry.checkedCount / entry.totalCount) * 100) : 0;
  const missedCount = entry.missed ? entry.missed.length : 0;
  const badgeHTML = missedCount > 0
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

  const header = div.querySelector('.history-entry-header');
  const body = div.querySelector('.history-entry-body');
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
  // Lang switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });

  // Reminder settings checkbox & container visibility
  const enabledCheckbox = document.getElementById('reminder-enabled');
  if (enabledCheckbox) {
    enabledCheckbox.checked = state.settings.reminderEnabled;
  }

  const optionsContainer = document.getElementById('reminder-options');
  if (optionsContainer) {
    optionsContainer.classList.toggle('hidden', !state.settings.reminderEnabled);
  }

  // Reminder Mode switcher buttons
  const mode = state.settings.reminderMode;
  const modeTimeBtn = document.getElementById('mode-time');
  const modeIntervalBtn = document.getElementById('mode-interval');
  if (modeTimeBtn && modeIntervalBtn) {
    modeTimeBtn.classList.toggle('active', mode === 'time');
    modeIntervalBtn.classList.toggle('active', mode === 'interval');
  }

  // Reminder pickers visibility
  const timeRow = document.getElementById('row-reminder-time');
  const intervalRow = document.getElementById('row-reminder-interval');
  if (timeRow) timeRow.classList.toggle('hidden', mode !== 'time');
  if (intervalRow) intervalRow.classList.toggle('hidden', mode !== 'interval');

  // Set values of pickers
  const timeInput = document.getElementById('reminder-time');
  const intervalSelect = document.getElementById('reminder-interval');
  if (timeInput) timeInput.value = state.settings.reminderTime;
  if (intervalSelect) intervalSelect.value = state.settings.reminderInterval;
  renderGroupManageList();
}

function initSettings() {
  // Language button actions
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lang === state.lang) return;
      state.lang = btn.dataset.lang;
      saveLang().catch(console.error); // fire-and-forget
      applyI18n();
      renderHeaderDate();
      if (state.activeTab === 'today') renderToday();
      if (state.activeTab === 'items') renderItems();
      if (state.activeTab === 'history') renderHistory();
      if (state.activeTab === 'settings') renderSettings();
    });
  });

  // Reminder active checkbox toggle
  const enabledCheckbox = document.getElementById('reminder-enabled');
  if (enabledCheckbox) {
    enabledCheckbox.addEventListener('change', async e => {
      state.settings.reminderEnabled = e.target.checked;
      document.getElementById('reminder-options').classList.toggle('hidden', !e.target.checked);
      await saveSettings();
      await Notifications.scheduleReturnReminders();
    });
  }

  // Reminder Mode buttons action
  const modeTimeBtn = document.getElementById('mode-time');
  const modeIntervalBtn = document.getElementById('mode-interval');

  const setMode = async (mode) => {
    state.settings.reminderMode = mode;
    modeTimeBtn.classList.toggle('active', mode === 'time');
    modeIntervalBtn.classList.toggle('active', mode === 'interval');
    document.getElementById('row-reminder-time').classList.toggle('hidden', mode !== 'time');
    document.getElementById('row-reminder-interval').classList.toggle('hidden', mode !== 'interval');
    await saveSettings();
    await Notifications.scheduleReturnReminders();
  };

  if (modeTimeBtn) modeTimeBtn.addEventListener('click', () => setMode('time'));
  if (modeIntervalBtn) modeIntervalBtn.addEventListener('click', () => setMode('interval'));

  // Time picker input action
  const timeInput = document.getElementById('reminder-time');
  if (timeInput) {
    timeInput.addEventListener('change', async e => {
      state.settings.reminderTime = e.target.value;
      await saveSettings();
      await Notifications.scheduleReturnReminders();
    });
  }

  // Interval select selector action
  const intervalSelect = document.getElementById('reminder-interval');
  if (intervalSelect) {
    intervalSelect.addEventListener('change', async e => {
      state.settings.reminderInterval = e.target.value;
      await saveSettings();
      await Notifications.scheduleReturnReminders();
    });
  }

  // Clear data action
  document.getElementById('btn-clear-data').addEventListener('click', async () => {
    if (!confirm(t('settings_clear_confirm'))) return;
    await Promise.all([
      Storage.remove(STORAGE_KEYS.ITEMS),
      Storage.remove(STORAGE_KEYS.HISTORY),
      Storage.remove(STORAGE_KEYS.TODAY),
      Storage.remove(STORAGE_KEYS.SETTINGS),
      Storage.remove(STORAGE_KEYS.GROUPS),
      Storage.remove('packcheck_migrated_v1'),
    ]);

    state.items = [];
    state.history = [];
    state.groups = [...DEFAULT_GROUPS];
    state.todayState = {
      date: getTodayKey(),
      phase: 'packing',
      step: 'select',
      carry: {},
      packed: {},
      returned: {}
    };
    state.settings = {
      reminderEnabled: false,
      reminderMode: 'time',
      reminderTime: '17:00',
      reminderInterval: '3',
      reminderTargetTime: null
    };

    await Notifications.cancelAll();
    updateStreak();

    renderSettings();
    renderGroupFilters();
    updateProgressBar();
    showToast(t('toast_cleared'), 'info');
  });

  initGroupManageForm();
  initBackupHandlers();
}

// ==========================================
// DEMO SEED DATA
// ==========================================
function maybeSeedDemo() {
  if (state.items.length > 0) return;
  state.items = [
    { id: genId(), name: 'Water Bottle', photo: null, note: 'Fill before leaving!', group: 'Ra ngoài', required: true },
    { id: genId(), name: 'Keys', photo: null, note: null, group: 'Ra ngoài', required: true },
    { id: genId(), name: 'Notebook', photo: null, note: 'Blue spiral one', group: 'Đi học', required: false },
    { id: genId(), name: 'Gym Gloves', photo: null, note: null, group: 'Đi gym', required: false },
    { id: genId(), name: 'Earphones', photo: null, note: 'Check battery!', group: 'Đi chơi', required: false },
    { id: genId(), name: 'Work Badge', photo: null, note: null, group: 'Đi làm', required: true },
  ];
  // Auto-select required items in current todayState since they are newly created
  state.items.forEach(item => {
    if (item.required) {
      state.todayState.carry[item.id] = true;
    }
  });
  saveItems().catch(console.error);
  saveTodayState().catch(console.error);
}

// ==========================================
// INIT — async: must await loadState before
// rendering anything to the screen
// ==========================================
async function init() {
  // Request persistent storage if supported (useful for iOS/Safari PWAs)
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(isPersisted => {
      if (!isPersisted) {
        navigator.storage.persist().then(granted => {
          console.log(`[PackCheck] Persistent storage permission: ${granted}`);
        }).catch(err => console.warn('[PackCheck] Requesting persistent storage failed:', err));
      }
    }).catch(err => console.warn('[PackCheck] Checking persistent storage failed:', err));
  }

  // 1. Load all state from persistent storage
  await loadState();

  // 3. Seed demo data if first launch
  maybeSeedDemo();

  // 4. Start scheduler check loop if there's any active reminder target saved
  runDynamicScheduler();

  // 5. Apply i18n strings to static HTML elements
  applyI18n();
  renderHeaderDate();

  // 5. Wire up all interactivity
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  initAddItemForm();
  initSettings();

  // Wire up 2-phase UI buttons
  document.getElementById('btn-toggle-phase').addEventListener('click', () => {
    const nextPhase = state.todayState.phase === 'packing' ? 'returning' : 'packing';
    const confirmMsg = state.lang === 'vi'
      ? `Bạn có chắc muốn chuyển sang ${nextPhase === 'returning' ? 'Pha Về (Trả đồ)' : 'Pha Đi (Xếp đồ)'}?`
      : `Are you sure you want to switch to ${nextPhase === 'returning' ? 'Returning Phase' : 'Packing Phase'}?`;

    if (confirm(confirmMsg)) {
      state.todayState.phase = nextPhase;
      if (nextPhase === 'packing') state.todayState.step = 'select';
      saveTodayState().catch(console.error);
      renderToday();
    }
  });

  document.getElementById('step-btn-select').addEventListener('click', () => {
    state.todayState.step = 'select';
    saveTodayState().catch(console.error);
    renderToday();
  });

  document.getElementById('step-btn-pack').addEventListener('click', () => {
    state.todayState.step = 'pack';
    saveTodayState().catch(console.error);
    renderToday();
  });

  document.getElementById('btn-action-next').addEventListener('click', () => {
    state.todayState.step = 'pack';
    saveTodayState().catch(console.error);
    renderToday();
  });

  document.getElementById('btn-action-start').addEventListener('click', async () => {
    state.todayState.phase = 'returning';
    await saveTodayState();
    await Notifications.scheduleReturnReminders();

    const carryCount = state.items.filter(i => state.todayState.carry[i.id]).length;
    showToast(state.lang === 'vi'
      ? `🚀 Bắt đầu hành trình! Đã mang ${carryCount} đồ vật.`
      : `🚀 Safe travels! Carrying ${carryCount} items.`, 'success');

    renderToday();
  });

  document.getElementById('btn-action-finish').addEventListener('click', saveDay);

  document.getElementById('modal-confirm').addEventListener('click', confirmDelete);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // 6. Render initial view
  updateStreak();
  renderToday();
}

document.addEventListener('DOMContentLoaded', init);

