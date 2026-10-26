'use strict';

/* =====================================================================
 * Constants & tiny helpers
 * ===================================================================== */
const HOUR = 56; // px per hour in the day/week grid (mirrored in CSS as --hour)
const PALETTE = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6',
                 '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'];
const NONE_COLOR = '#9ca3af';
const SOURCES = {
  local: { label: 'Local' },
  google: { label: 'Google Calendar', short: 'G' },
  classroom: { label: 'Google Classroom', short: 'GC' },
  canvas: { label: 'Canvas', short: 'C' },
  notion: { label: 'Notion', short: 'N' },
};

const ICONS = {
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/>',
  plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  pencil: '<path d="M17 3l4 4L7 21H3v-4L17 3z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  grip: '<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  text: '<path d="M17 10H3M21 6H3M21 14H3M17 18H3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/>',
  layers: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
};
const icon = (name, size = 18) => {
  const s = document.createElement('span');
  s.className = 'icon';
  s.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  return s;
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const pad = n => String(n).padStart(2, '0');
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtLocal = d => `${fmtDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = d => addDays(startOfDay(d), -d.getDay());
const sameDay = (a, b) => fmtDate(a) === fmtDate(b);
const atMinutes = (day, mins) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, mins);
const fmtTime = d => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtTimeShort = d => d.toLocaleTimeString([], { hour: 'numeric', minute: d.getMinutes() ? '2-digit' : undefined });

/** Tiny DOM builder. Text is always set via textContent, so imported titles can't inject HTML. */
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, val] of Object.entries(v)) p.startsWith('--') ? e.style.setProperty(p, val) : (e.style[p] = val);
    } else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k in e) e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  const add = kid => {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(add);
    else e.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  };
  kids.forEach(add);
  return e;
}

/* =====================================================================
 * State & persistence
 * ===================================================================== */
const LS_KEY = 'pc.v2';
const defaults = () => ({
  subjects: [],   // { id, name, color }
  events: [],     // { id, title, start, end, allDay, location, description, subjectId, source, uid?, url? }
  settings: { theme: null, view: 'week', hiddenSubjects: [], autoSubjects: true, reminders: { enabled: false, lead: 10 } },
  notified: {},   // reminder keys that already fired
  integrations: {
    google: { clientId: '', calendar: true, classroom: true, connected: false },
    canvas: { baseUrl: '', token: '', connected: false },
    notion: { token: '', databases: '', proxy: '', connected: false },
  },
  meta: {},       // per-source { last, count }
});

function loadStore() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        ...d, ...s,
        settings: { ...d.settings, ...s.settings, reminders: { ...d.settings.reminders, ...s.settings?.reminders } },
        integrations: {
          google: { ...d.integrations.google, ...s.integrations?.google },
          canvas: { ...d.integrations.canvas, ...s.integrations?.canvas },
          notion: { ...d.integrations.notion, ...s.integrations?.notion },
        },
      };
    }
    // Migrate events from the very first version of this app ({ 'YYYY-MM-DD': ['text', ...] }).
    const legacy = JSON.parse(localStorage.getItem('calendar-events') || '{}');
    for (const [day, items] of Object.entries(legacy)) {
      const [y, m, dd] = day.split('-').map(Number);
      (items || []).forEach(text => d.events.push({
        id: newId(), title: String(text), start: `${day}T00:00`, end: fmtLocal(new Date(y, m - 1, dd + 1)),
        allDay: true, location: '', description: '', subjectId: null, source: 'local',
      }));
    }
  } catch { /* fall through to defaults */ }
  return d;
}

const store = loadStore();
const save = () => localStorage.setItem(LS_KEY, JSON.stringify(store));

const ui = {
  tab: 'calendar',
  view: store.settings.view || 'week',
  cursor: new Date(),
  mini: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  scroll: null,
  expanded: new Set(),
  showPast: new Set(),
  renaming: null,
  newColor: PALETTE[7],
  focusNewSubject: false,
  dragId: null,
  syncing: new Set(),
  errors: {},
};

/* ----- derived helpers ----- */
const subjectById = id => store.subjects.find(s => s.id === id) || null;
const colorOf = ev => subjectById(ev.subjectId)?.color || NONE_COLOR;
const evStart = ev => new Date(ev.start);
const evEnd = ev => new Date(ev.end);
const byStart = (a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
const isHidden = ev => store.settings.hiddenSubjects.includes(ev.subjectId || 'none');
const isLocal = ev => ev.source === 'local';

function createSubject(name, color) {
  const subject = { id: newId(), name: name.trim(), color: color || PALETTE[store.subjects.length % PALETTE.length] };
  store.subjects.push(subject);
  save();
  return subject;
}
function ensureSubject(name, color) {
  const found = store.subjects.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
  return found || createSubject(name, color);
}

function fmtWhen(ev) {
  const s = evStart(ev), e = evEnd(ev);
  const day = s.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  if (ev.allDay) {
    const last = addDays(e, -1);
    return sameDay(s, last) ? `${day} · All day` : `${day} – ${last.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  }
  const endText = sameDay(s, e) ? fmtTime(e) : `${e.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${fmtTime(e)}`;
  return `${day} · ${fmtTime(s)} – ${endText}`;
}

/* =====================================================================
 * Toasts, modals, popovers
 * ===================================================================== */
function toast(message, kind = 'info') {
  const t = h('div', { class: `toast ${kind}`, text: message });
  $('#toast').append(t);
  setTimeout(() => t.classList.add('out'), 3600);
  setTimeout(() => t.remove(), 4000);
}

const modalStack = [];
function openModal(content, { onClose, small = false } = {}) {
  const back = h('div', { class: 'backdrop', onmousedown: e => { if (e.target === back) api.close(); } },
    h('div', { class: 'modal' + (small ? ' small' : ''), role: 'dialog', 'aria-modal': 'true' }, content));
  $('#modal-root').append(back);
  requestAnimationFrame(() => back.classList.add('show'));
  const api = {
    el: back,
    close() {
      const i = modalStack.indexOf(api);
      if (i < 0) return;
      modalStack.splice(i, 1);
      back.classList.remove('show');
      setTimeout(() => back.remove(), 160);
      onClose?.();
    },
  };
  modalStack.push(api);
  return api;
}

function confirmDialog({ title, body, ok = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    let done = false;
    const finish = v => { if (done) return; done = true; m.close(); resolve(v); };
    const m = openModal(h('div', { class: 'confirm' },
      h('h3', { text: title }),
      h('p', { text: body }),
      h('div', { class: 'modal-foot' },
        h('span', { class: 'grow' }),
        h('button', { class: 'btn', text: 'Cancel', onclick: () => finish(false) }),
        h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), text: ok, onclick: () => finish(true) }))),
    { small: true, onClose: () => { if (!done) { done = true; resolve(false); } } });
  });
}

let popEl = null;
const popOutside = e => { if (popEl && !popEl.contains(e.target)) closePopover(); };
function closePopover() {
  popEl?.remove();
  popEl = null;
  document.removeEventListener('mousedown', popOutside);
}
function openColorPicker(anchor, current, onPick) {
  closePopover();
  popEl = h('div', { class: 'popover' },
    h('div', { class: 'swatches' }, PALETTE.map(c => h('button', {
      class: 'sw' + (c.toLowerCase() === String(current).toLowerCase() ? ' on' : ''),
      style: { background: c }, 'aria-label': c,
      onclick: () => { onPick(c); closePopover(); },
    }))),
    h('label', { class: 'custom' }, h('span', { text: 'Custom color' }),
      h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(current) ? current : '#6366f1', oninput: e => onPick(e.target.value) })));
  document.body.append(popEl);
  const r = anchor.getBoundingClientRect();
  popEl.style.left = `${Math.max(8, Math.min(r.left, innerWidth - 236))}px`;
  popEl.style.top = `${Math.min(r.bottom + 6, innerHeight - 160)}px`;
  setTimeout(() => document.addEventListener('mousedown', popOutside), 0);
}

/* =====================================================================
 * Calendar data helpers
 * ===================================================================== */
/** Event pieces falling on `day` (an event spanning midnight yields a piece per day). */
function segmentsOn(day) {
  const next = addDays(day, 1);
  const out = [];
  for (const ev of store.events) {
    if (isHidden(ev)) continue;
    const s = evStart(ev), e = evEnd(ev);
    if (!(s < next && e > day)) continue;
    out.push({
      ev,
      sm: s >= day ? s.getHours() * 60 + s.getMinutes() : 0,
      em: e >= next ? 1440 : e.getHours() * 60 + e.getMinutes(),
    });
  }
  return out.sort((a, b) => a.sm - b.sm || byStart(a.ev, b.ev));
}

/** Lay out overlapping pieces side by side. */
function layoutSegments(segs) {
  const items = segs.map(s => ({ ...s, ve: Math.max(s.em, s.sm + 30) })).sort((a, b) => a.sm - b.sm || b.ve - a.ve);
  const result = [];
  let cluster = [], colEnds = [], clusterEnd = 0;
  const flush = () => { cluster.forEach(it => { it.n = colEnds.length; }); result.push(...cluster); cluster = []; colEnds = []; };
  for (const it of items) {
    if (cluster.length && it.sm >= clusterEnd) flush();
    let c = colEnds.findIndex(end => end <= it.sm);
    if (c < 0) { c = colEnds.length; colEnds.push(0); }
    colEnds[c] = it.ve;
    it.c = c;
    clusterEnd = Math.max(cluster.length ? clusterEnd : 0, it.ve);
    cluster.push(it);
  }
  flush();
  return result;
}

function eventDaySet() {
  const set = new Set();
  for (const ev of store.events) {
    if (isHidden(ev)) continue;
    let d = startOfDay(evStart(ev));
    const end = evEnd(ev);
    for (let i = 0; i < 62 && d < end; i++) { set.add(fmtDate(d)); d = addDays(d, 1); }
  }
  return set;
}

/* =====================================================================
 * Rendering: shell
 * ===================================================================== */
function render() {
  closePopover();
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === ui.tab));
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === `tab-${ui.tab}`));
  renderSidebar();
  ({ calendar: renderCalendar, subjects: renderSubjects, integrations: renderIntegrations })[ui.tab]($(`#tab-${ui.tab}`));
}

function setCursor(d) {
  ui.cursor = d;
  ui.mini = new Date(d.getFullYear(), d.getMonth(), 1);
  render();
}

const ago = ts => {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

function renderSidebar() {
  const extra = $('#side-extra');
  extra.replaceChildren();
  if (ui.tab === 'calendar') extra.append(miniCalendar(), subjectFilters());

  const connected = connectedSources();
  const last = Math.max(0, ...connected.map(s => store.meta[s]?.last || 0));
  $('#sync-status').textContent = !connected.length ? 'No integrations connected'
    : ui.syncing.size ? 'Syncing…' : last ? `Synced ${ago(last)}` : 'Not synced yet';
  const dark = document.documentElement.dataset.theme === 'dark';
  $('#theme-btn').replaceChildren(icon(dark ? 'sun' : 'moon'));
}

function miniCalendar() {
  const first = ui.mini;
  const start = startOfWeek(first);
  const today = startOfDay(new Date());
  const days = eventDaySet();
  const rangeStart = ui.view === 'week' ? startOfWeek(ui.cursor) : startOfDay(ui.cursor);
  const rangeLen = ui.view === 'week' ? 7 : ui.view === 'day' ? 1 : 0;
  const inRange = d => rangeLen && d >= rangeStart && d < addDays(rangeStart, rangeLen);

  const grid = h('div', { class: 'mini-grid' }, ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(l => h('span', { class: 'mini-dow', text: l })));
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    grid.append(h('button', {
      class: 'mini-day' + (d.getMonth() !== first.getMonth() ? ' other' : '') + (sameDay(d, today) ? ' today' : '')
        + (inRange(d) ? ' range' : '') + (days.has(fmtDate(d)) ? ' has' : ''),
      text: d.getDate(), onclick: () => setCursor(d),
    }));
  }
  return h('div', { class: 'mini' },
    h('div', { class: 'mini-head' },
      h('span', { text: first.toLocaleDateString([], { month: 'long', year: 'numeric' }) }),
      h('div', { class: 'row' },
        h('button', { class: 'icon-btn sm', 'aria-label': 'Previous month', onclick: () => { ui.mini = new Date(first.getFullYear(), first.getMonth() - 1, 1); render(); } }, icon('left', 16)),
        h('button', { class: 'icon-btn sm', 'aria-label': 'Next month', onclick: () => { ui.mini = new Date(first.getFullYear(), first.getMonth() + 1, 1); render(); } }, icon('right', 16)))),
    grid);
}

function subjectFilters() {
  const hidden = store.settings.hiddenSubjects;
  const row = (id, name, color) => h('button', {
    class: 'filter' + (hidden.includes(id) ? ' off' : ''), style: { '--c': color },
    onclick: () => {
      store.settings.hiddenSubjects = hidden.includes(id) ? hidden.filter(x => x !== id) : [...hidden, id];
      save(); render();
    },
  }, h('i', { class: 'check' }), h('span', { class: 'fname', text: name }));
  return h('div', { class: 'filters' },
    h('div', { class: 'side-label', text: 'Subjects' }),
    store.subjects.map(s => row(s.id, s.name, s.color)),
    row('none', 'No subject', NONE_COLOR));
}

/* =====================================================================
 * Rendering: calendar tab
 * ===================================================================== */
function viewTitle() {
  const c = ui.cursor;
  if (ui.view === 'month') return c.toLocaleDateString([], { month: 'long', year: 'numeric' });
  if (ui.view === 'day') return c.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const s = startOfWeek(c), e = addDays(s, 6);
  return s.getMonth() === e.getMonth()
    ? `${s.toLocaleDateString([], { month: 'long' })} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`
    : `${s.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${e.getFullYear()}`;
}

function navigate(dir) {
  const c = ui.cursor;
  if (ui.view === 'month') setCursor(new Date(c.getFullYear(), c.getMonth() + dir, 1));
  else setCursor(addDays(c, (ui.view === 'week' ? 7 : 1) * dir));
}

function setView(v) {
  ui.view = v;
  store.settings.view = v;
  save();
  render();
}

function defaultNewEventTimes() {
  const now = new Date();
  let start;
  if (sameDay(ui.cursor, now)) start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
  else start = new Date(ui.cursor.getFullYear(), ui.cursor.getMonth(), ui.cursor.getDate(), 9);
  if (start.getHours() === 0) start = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1, 23);
  return { start: fmtLocal(start), end: fmtLocal(new Date(start.getTime() + 3600000)) };
}

function renderCalendar(root) {
  const connected = connectedSources();
  const toolbar = h('div', { class: 'toolbar' },
    h('h1', { class: 'cal-title', text: viewTitle() }),
    h('div', { class: 'grow' }),
    h('div', { class: 'row gap' },
      h('button', { class: 'btn', text: 'Today', onclick: () => setCursor(new Date()) }),
      h('div', { class: 'row' },
        h('button', { class: 'icon-btn', 'aria-label': 'Previous', onclick: () => navigate(-1) }, icon('left')),
        h('button', { class: 'icon-btn', 'aria-label': 'Next', onclick: () => navigate(1) }, icon('right'))),
      h('div', { class: 'seg' }, ['day', 'week', 'month'].map(v => h('button', {
        class: ui.view === v ? 'on' : '', text: v[0].toUpperCase() + v.slice(1), onclick: () => setView(v),
      }))),
      connected.length ? h('button', {
        class: 'icon-btn' + (ui.syncing.size ? ' spin' : ''), title: 'Sync integrations', 'aria-label': 'Sync integrations',
        onclick: () => syncAll(),
      }, icon('refresh')) : null,
      h('button', { class: 'btn primary', onclick: () => openEventModal({ defaults: defaultNewEventTimes() }) }, icon('plus', 16), 'New event')));

  root.replaceChildren(toolbar, ui.view === 'month' ? monthView() : timeView());

  const scroller = $('.cal-scroll', root);
  if (scroller) {
    scroller.addEventListener('scroll', () => { ui.scroll = scroller.scrollTop; });
    if (ui.scroll == null) {
      const hour = new Date().getHours();
      ui.scroll = Math.max(0, (ui.view !== 'month' && hour > 8 ? hour - 2 : 7) * HOUR);
    }
    scroller.scrollTop = ui.scroll;
  }
}

function chip(ev, showTime) {
  return h('div', {
    class: 'chip' + (ev.allDay ? ' solid' : ''), style: { '--c': colorOf(ev) }, title: ev.title,
    onclick: e => { e.stopPropagation(); openEventModal({ ev }); },
  }, !ev.allDay && showTime ? h('span', { class: 'ct', text: fmtTimeShort(evStart(ev)) }) : null,
  h('span', { class: 'cn', text: ev.title }));
}

/* ----- day & week view ----- */
function timeView() {
  const n = ui.view === 'day' ? 1 : 7;
  const first = ui.view === 'day' ? startOfDay(ui.cursor) : startOfWeek(ui.cursor);
  const days = Array.from({ length: n }, (_, i) => addDays(first, i));
  const today = startOfDay(new Date());
  const segs = days.map(segmentsOn);

  const head = h('div', { class: 'cal-head' },
    h('div', { class: 'gutter' }),
    days.map(d => h('div', { class: 'dayhead' + (sameDay(d, today) ? ' today' : '') },
      h('span', { class: 'dow', text: d.toLocaleDateString([], { weekday: 'short' }) }),
      h('span', { class: 'dnum', text: d.getDate() }))));

  const allday = h('div', { class: 'allday' },
    h('div', { class: 'gutter', text: 'all-day' }),
    days.map((d, i) => h('div', {
      class: 'ad-cell', title: 'Add an all-day event',
      onclick: () => openEventModal({ defaults: { allDay: true, start: fmtLocal(d), end: fmtLocal(addDays(d, 1)) } }),
    }, segs[i].filter(s => s.ev.allDay).map(s => chip(s.ev)))));

  const gutter = h('div', { class: 'gutter hours' }, Array.from({ length: 24 }, (_, hr) => h('div', {
    class: 'hour-label', text: hr ? new Date(2000, 0, 1, hr).toLocaleTimeString([], { hour: 'numeric' }) : '',
  })));

  const body = h('div', { class: 'time-body' }, gutter, days.map((d, i) => dayColumn(d, segs[i].filter(s => !s.ev.allDay), today)));
  return h('div', { class: 'cal-wrap' },
    h('div', { class: 'cal-scroll' },
      h('div', { class: 'cal-grid', style: { '--n': n } }, h('div', { class: 'cal-top' }, head, allday), body)));
}

function dayColumn(day, segs, today) {
  const col = h('div', { class: 'daycol' + (sameDay(day, today) ? ' today' : ''), 'data-date': fmtDate(day) });
  col.addEventListener('pointerdown', e => onSlotDown(e, day));
  for (const it of layoutSegments(segs)) {
    const ev = it.ev;
    const height = Math.max((it.ve - it.sm) / 60 * HOUR - 2, 18);
    const block = h('div', {
      class: 'ev' + (isLocal(ev) ? ' local' : ' ext'),
      style: {
        '--c': colorOf(ev), top: `${it.sm / 60 * HOUR + 1}px`, height: `${height}px`,
        left: `calc(${it.c / it.n * 100}% + 2px)`, width: `calc(${100 / it.n}% - 5px)`,
      },
      title: `${ev.title}\n${fmtWhen(ev)}`,
    },
    h('div', { class: 'ev-title' },
      !isLocal(ev) ? h('span', { class: 'src', text: SOURCES[ev.source]?.short || '' }) : null,
      h('span', { text: ev.title })),
    height >= 38 ? h('div', { class: 'ev-time', text: `${fmtTime(evStart(ev))} – ${fmtTime(evEnd(ev))}` }) : null,
    height >= 58 && ev.location ? h('div', { class: 'ev-loc', text: ev.location }) : null);
    block.addEventListener('pointerdown', e => startEventDrag(e, ev, block));
    col.append(block);
  }
  if (sameDay(day, today)) col.append(h('div', { class: 'nowline', style: { top: `${nowMinutes() / 60 * HOUR}px` } }));
  return col;
}

const nowMinutes = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
setInterval(() => { const l = $('.nowline'); if (l) l.style.top = `${nowMinutes() / 60 * HOUR}px`; }, 60000);

/** Click or drag on an empty slot to create an event. */
function onSlotDown(e, day) {
  if (e.button !== 0 || e.target.closest('.ev')) return;
  e.preventDefault();
  const col = e.currentTarget;
  const rect = col.getBoundingClientRect();
  const snap = y => Math.max(0, Math.min(1410, Math.floor((y - rect.top) / HOUR * 2) * 30));
  const anchor = snap(e.clientY);
  let lo = anchor, hi = anchor + 30, moved = false;
  const ghost = h('div', { class: 'ghost' }, h('span', { text: '(New event)' }));
  col.append(ghost);
  const paint = () => {
    ghost.style.top = `${lo / 60 * HOUR + 1}px`;
    ghost.style.height = `${Math.max((hi - lo) / 60 * HOUR - 2, 16)}px`;
  };
  paint();
  const move = m => { const b = snap(m.clientY); lo = Math.min(anchor, b); hi = Math.max(anchor, b) + 30; moved = true; paint(); };
  const off = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
  };
  const cancel = () => { off(); ghost.remove(); };
  const up = () => {
    off();
    const endMin = moved ? hi : Math.min(anchor + 60, 1440);
    openEventModal({
      defaults: { start: fmtLocal(atMinutes(day, lo)), end: fmtLocal(atMinutes(day, endMin)) },
      onClose: () => ghost.remove(),
    });
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
}

/** Press on an event: click opens it, dragging moves it (local events only). */
function startEventDrag(e, ev, block) {
  if (e.button !== 0) return;
  e.stopPropagation();
  const sx = e.clientX, sy = e.clientY;
  let moved = false;
  const move = m => {
    const dx = m.clientX - sx, dy = m.clientY - sy;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    if (!isLocal(ev)) return;
    moved = true;
    block.classList.add('dragging');
    block.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const off = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
  };
  const cancel = () => { off(); block.classList.remove('dragging'); block.style.transform = ''; };
  const up = m => {
    off();
    block.classList.remove('dragging');
    block.style.transform = '';
    if (!moved) return openEventModal({ ev });
    const cols = $$('.daycol');
    const from = cols.indexOf(block.parentElement);
    let to = cols.findIndex(c => { const r = c.getBoundingClientRect(); return m.clientX >= r.left && m.clientX < r.right; });
    if (to < 0) to = from;
    const dayDelta = to - from;
    const minDelta = Math.round((m.clientY - sy) / HOUR * 60 / 15) * 15;
    if (!dayDelta && !minDelta) return;
    const shift = str => { const d = new Date(str); return fmtLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + dayDelta, d.getHours(), d.getMinutes() + minDelta)); };
    ev.start = shift(ev.start);
    ev.end = shift(ev.end);
    save(); render();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
}

/* ----- month view ----- */
function monthView() {
  const c = ui.cursor;
  const first = new Date(c.getFullYear(), c.getMonth(), 1);
  const dim = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
  const rows = Math.ceil((first.getDay() + dim) / 7);
  const start = startOfWeek(first);
  const today = startOfDay(new Date());

  const grid = h('div', { class: 'mgrid', style: { '--rows': rows } });
  for (let i = 0; i < rows * 7; i++) {
    const d = addDays(start, i);
    const segs = segmentsOn(d).sort((a, b) => (b.ev.allDay - a.ev.allDay) || a.sm - b.sm);
    const max = segs.length > 3 ? 2 : 3;
    grid.append(h('div', {
      class: 'mcell' + (d.getMonth() !== c.getMonth() ? ' other' : '') + (sameDay(d, today) ? ' today' : ''),
      onclick: () => openEventModal({ defaults: { start: fmtLocal(atMinutes(d, 540)), end: fmtLocal(atMinutes(d, 600)) } }),
    },
    h('button', { class: 'mnum', text: d.getDate(), onclick: e => { e.stopPropagation(); ui.view = 'day'; store.settings.view = 'day'; save(); setCursor(d); } }),
    segs.slice(0, max).map(s => chip(s.ev, true)),
    segs.length > max ? h('button', {
      class: 'more', text: `+${segs.length - max} more`,
      onclick: e => { e.stopPropagation(); ui.view = 'day'; store.settings.view = 'day'; save(); setCursor(d); },
    }) : null));
  }
  return h('div', { class: 'cal-wrap month' },
    h('div', { class: 'mhead' }, Array.from({ length: 7 }, (_, i) => h('div', { text: addDays(start, i).toLocaleDateString([], { weekday: 'short' }) }))),
    grid);
}

/* =====================================================================
 * Event modal
 * ===================================================================== */
function subjectPicker(selected, onChange) {
  const wrap = h('div', { class: 'pills' });
  const pill = (id, name, color) => h('button', {
    type: 'button', class: 'pill' + ((selected || null) === id ? ' on' : ''), style: { '--c': color },
    onclick: () => { selected = id; onChange(id); draw(); },
  }, h('i', { class: 'dot' }), name);

  const draw = () => {
    wrap.replaceChildren(pill(null, 'None', NONE_COLOR), ...store.subjects.map(s => pill(s.id, s.name, s.color)),
      h('button', { type: 'button', class: 'pill add', onclick: addInline }, icon('plus', 14), 'New'));
  };
  const addInline = () => {
    const input = h('input', { class: 'pill-input', placeholder: 'Subject name', maxLength: 40 });
    const commit = () => {
      const name = input.value.trim();
      if (name) {
        const s = ensureSubject(name);
        selected = s.id;
        onChange(s.id);
      }
      draw();
    };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.removeEventListener('blur', commit); commit(); }
      if (e.key === 'Escape') { e.stopPropagation(); input.removeEventListener('blur', commit); draw(); }
    });
    input.addEventListener('blur', commit);
    wrap.lastElementChild.replaceWith(input);
    input.focus();
  };
  draw();
  return wrap;
}

function openEventModal({ ev = null, defaults = {}, onClose } = {}) {
  const isNew = !ev;
  const external = !!ev && !isLocal(ev);
  const base = ev || {
    title: '', subjectId: defaults.subjectId ?? null, start: defaults.start, end: defaults.end,
    allDay: !!defaults.allDay, location: '', description: '',
  };
  let chosen = base.subjectId || null;
  let allDay = !!base.allDay;
  const s0 = new Date(base.start);
  let e0 = new Date(base.end);
  if (allDay) e0 = addDays(e0, -1);
  if (e0 < s0) e0 = s0;

  const title = h('input', { class: 'title-input', placeholder: 'Event title', value: base.title, disabled: external, maxLength: 200 });
  const sd = h('input', { type: 'date', value: fmtDate(s0), disabled: external });
  const st = h('input', { type: 'time', value: allDay ? '09:00' : hhmm(s0), disabled: external });
  const ed = h('input', { type: 'date', value: fmtDate(e0), disabled: external });
  const et = h('input', { type: 'time', value: allDay ? '10:00' : hhmm(e0), disabled: external });
  const loc = h('input', { placeholder: 'Add location', value: base.location || '', disabled: external });
  const desc = h('textarea', { placeholder: 'Add a short description', rows: 3, value: base.description || '', disabled: external });
  const timeRow = h('div', { class: 'time-row' + (allDay ? ' allday' : '') });
  const remind = h('select', { 'aria-label': 'Reminder' },
    REMIND_OPTIONS.map(([v, label]) => h('option', { value: String(v), text: label, selected: (base.remind ?? null) === v })));
  const readRemind = () => (remind.value === 'null' ? null : Number(remind.value));

  const getStart = () => new Date(`${sd.value}T${allDay ? '00:00' : (st.value || '00:00')}`);
  const getEnd = () => new Date(`${ed.value}T${allDay ? '00:00' : (et.value || '00:00')}`);
  let prevStart = getStart();
  const onStart = () => {
    const ns = getStart();
    if (isNaN(ns) || isNaN(prevStart)) { prevStart = ns; return; }
    const oldEnd = getEnd();
    let ne;
    if (allDay) ne = addDays(oldEnd, Math.round((ns - prevStart) / 864e5));
    else ne = new Date(oldEnd.getTime() + (ns - prevStart));
    if (!isNaN(ne)) { ed.value = fmtDate(ne); et.value = hhmm(ne); }
    prevStart = ns;
  };
  sd.addEventListener('change', onStart);
  st.addEventListener('change', onStart);

  const allDayBox = h('input', {
    type: 'checkbox', checked: allDay, disabled: external,
    onchange: e => { allDay = e.target.checked; timeRow.classList.toggle('allday', allDay); prevStart = getStart(); },
  });

  timeRow.append(
    h('div', { class: 'trow' }, h('span', { class: 'tlabel', text: 'Starts' }), sd, h('span', { class: 't' }, st)),
    h('div', { class: 'trow' }, h('span', { class: 'tlabel', text: 'Ends' }), ed, h('span', { class: 't' }, et)));

  const field = (ic, node) => h('div', { class: 'field' }, h('div', { class: 'field-icon' }, icon(ic, 18)), node);
  let m;
  const closeModal = () => m.close();

  const commit = () => {
    const data = { subjectId: chosen, remind: readRemind() };
    if (!external) {
      let s = getStart(), e = getEnd();
      if (isNaN(s) || isNaN(e)) return toast('Please enter a valid date and time', 'error');
      if (allDay) { if (e < s) return toast('End date must be on or after the start date', 'error'); e = addDays(e, 1); }
      else if (e <= s) return toast('End time must be after the start time', 'error');
      Object.assign(data, {
        title: title.value.trim() || 'Untitled', start: fmtLocal(s), end: fmtLocal(e), allDay,
        location: loc.value.trim(), description: desc.value.trim(),
      });
    }
    if (isNew) store.events.push({ id: newId(), source: 'local', ...data });
    else Object.assign(ev, data);
    save();
    closeModal();
    render();
  };

  const remove = async () => {
    if (!await confirmDialog({ title: 'Delete event?', body: `"${ev.title}" will be permanently removed.`, ok: 'Delete', danger: true })) return;
    store.events = store.events.filter(x => x.id !== ev.id);
    save(); closeModal(); render();
  };

  const content = h('div', { class: 'event-form' },
    h('div', { class: 'modal-top' },
      title,
      h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: closeModal }, icon('x'))),
    external ? h('div', { class: 'banner' },
      h('span', { text: `Imported from ${SOURCES[ev.source].label}. Only the subject and reminder can be changed here.` }),
      ev.url ? h('a', { href: ev.url, target: '_blank', rel: 'noopener noreferrer' }, 'Open', icon('external', 14)) : null) : null,
    h('div', { class: 'sub-label', text: 'Subject' }),
    subjectPicker(chosen, id => { chosen = id; }),
    field('clock', h('div', { class: 'time-block' }, timeRow,
      h('label', { class: 'check-row' }, allDayBox, h('span', { text: 'All day' })))),
    field('bell', h('div', { class: 'time-block' }, remind,
      store.settings.reminders.enabled ? null : h('small', { class: 'hint', text: 'Notifications are off. Turn them on in Integrations.' }))),
    field('pin', loc),
    field('text', desc),
    h('div', { class: 'modal-foot' },
      !isNew && !external ? h('button', { class: 'btn danger-ghost', onclick: remove }, icon('trash', 16), 'Delete') : null,
      h('span', { class: 'grow' }),
      h('button', { class: 'btn', text: 'Cancel', onclick: closeModal }),
      h('button', { class: 'btn primary', text: isNew ? 'Create event' : 'Save', onclick: commit })));

  title.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
  content.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit(); });

  m = openModal(content, { onClose });
  setTimeout(() => { if (!external) { title.focus(); title.select(); } }, 30);
}

/* =====================================================================
 * Rendering: subjects tab
 * ===================================================================== */
function pageHead(title, subtitle, right) {
  return h('div', { class: 'page-head' }, h('div', {}, h('h1', { text: title }), h('p', { class: 'sub', text: subtitle })), right || null);
}

function renderSubjects(root) {
  const nameInput = h('input', { id: 'new-subject-name', placeholder: 'New subject name (e.g. Biology)', maxLength: 40 });
  const swatch = h('button', {
    type: 'button', class: 'swatch-btn', style: { background: ui.newColor }, 'aria-label': 'Choose color',
    onclick: e => openColorPicker(e.currentTarget, ui.newColor, c => { ui.newColor = c; swatch.style.background = c; }),
  });
  const addSubject = e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return nameInput.focus();
    if (store.subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) return toast('You already have a subject with that name', 'error');
    createSubject(name, ui.newColor);
    ui.newColor = PALETTE[store.subjects.length % PALETTE.length];
    ui.focusNewSubject = true;
    render();
  };

  const form = h('form', { class: 'add-subject', onsubmit: addSubject },
    swatch, nameInput, h('button', { class: 'btn primary', type: 'submit' }, icon('plus', 16), 'Add subject'));

  root.replaceChildren(h('div', { class: 'page' },
    pageHead('Subjects', 'Group events by subject. Drag an event onto another subject to re-file it.'),
    form,
    h('div', { class: 'subject-list' }, store.subjects.map(subjectCard), subjectCard(null))));

  if (ui.focusNewSubject) { ui.focusNewSubject = false; nameInput.focus(); }
}

function eventRow(ev, past) {
  const row = h('div', {
    class: 'erow' + (past ? ' past' : ''), draggable: true, style: { '--c': colorOf(ev) },
    onclick: () => openEventModal({ ev }),
    ondragstart: e => {
      ui.dragId = ev.id;
      e.dataTransfer.setData('text/plain', ev.id);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => row.classList.add('dragging'), 0);
    },
    ondragend: () => { ui.dragId = null; row.classList.remove('dragging'); $$('.subject.drop').forEach(x => x.classList.remove('drop')); },
  },
  h('span', { class: 'grip' }, icon('grip', 16)),
  h('div', { class: 'etext' },
    h('div', { class: 'etitle', text: ev.title }),
    h('div', { class: 'emeta', text: fmtWhen(ev) + (ev.location ? ` · ${ev.location}` : '') })),
  isLocal(ev) ? null : h('span', { class: 'badge', text: SOURCES[ev.source].label }));
  return row;
}

function moveEvent(id, subjectId) {
  const ev = store.events.find(e => e.id === id);
  if (!ev || (ev.subjectId || null) === subjectId) return;
  ev.subjectId = subjectId;
  ui.expanded.add(subjectId || 'none');
  save();
  toast(`Moved "${ev.title}" to ${subjectId ? subjectById(subjectId).name : 'No subject'}`);
  render();
}

function subjectCard(subject) {
  const key = subject ? subject.id : 'none';
  const sid = subject ? subject.id : null;
  const color = subject ? subject.color : NONE_COLOR;
  const events = store.events.filter(e => (e.subjectId || null) === sid).sort(byStart);
  const now = fmtLocal(new Date());
  const upcoming = events.filter(e => e.end >= now);
  const past = events.filter(e => e.end < now).reverse();
  const open = ui.expanded.has(key);

  const toggle = () => { open ? ui.expanded.delete(key) : ui.expanded.add(key); render(); };

  let nameNode;
  if (subject && ui.renaming === subject.id) {
    const input = h('input', { class: 'rename', value: subject.name, maxLength: 40, onclick: e => e.stopPropagation() });
    let finished = false;
    const finish = apply => {
      if (finished) return;
      finished = true;
      const name = input.value.trim();
      ui.renaming = null;
      if (apply && name && name !== subject.name) {
        if (store.subjects.some(s => s.id !== subject.id && s.name.toLowerCase() === name.toLowerCase())) toast('You already have a subject with that name', 'error');
        else { subject.name = name; save(); }
      }
      render();
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
    nameNode = input;
    setTimeout(() => { input.focus(); input.select(); }, 0);
  } else {
    nameNode = h('span', { class: 'sname', text: subject ? subject.name : 'No subject' });
  }

  const head = h('div', { class: 'subject-head', onclick: toggle },
    h('span', { class: 'chev' }, icon('down', 18)),
    subject ? h('button', {
      class: 'swatch-btn sm', style: { background: color }, title: 'Change color', 'aria-label': 'Change color',
      onclick: e => { e.stopPropagation(); openColorPicker(e.currentTarget, subject.color, c => { subject.color = c; save(); render(); }); },
    }) : h('span', { class: 'swatch-btn sm static', style: { background: color } }),
    nameNode,
    h('span', { class: 'count', text: events.length }),
    h('div', { class: 'grow' }),
    h('div', { class: 'actions', onclick: e => e.stopPropagation() },
      h('button', {
        class: 'icon-btn sm', title: 'Add event to this subject', 'aria-label': 'Add event',
        onclick: () => openEventModal({ defaults: { ...defaultNewEventTimes(), subjectId: sid } }),
      }, icon('plus', 16)),
      subject ? h('button', { class: 'icon-btn sm', title: 'Rename', 'aria-label': 'Rename', onclick: () => { ui.renaming = subject.id; render(); } }, icon('pencil', 15)) : null,
      subject ? h('button', {
        class: 'icon-btn sm danger', title: 'Delete subject', 'aria-label': 'Delete subject',
        onclick: async () => {
          const body = events.length
            ? `"${subject.name}" will be deleted. Its ${events.length} event${events.length === 1 ? '' : 's'} will be kept and moved to "No subject".`
            : `"${subject.name}" will be deleted.`;
          if (!await confirmDialog({ title: 'Delete subject?', body, ok: 'Delete', danger: true })) return;
          store.events.forEach(e => { if (e.subjectId === subject.id) e.subjectId = null; });
          store.subjects = store.subjects.filter(s => s.id !== subject.id);
          store.settings.hiddenSubjects = store.settings.hiddenSubjects.filter(x => x !== subject.id);
          save(); render();
        },
      }, icon('trash', 15)) : null));

  const showPast = ui.showPast.has(key);
  const body = h('div', { class: 'subject-body' },
    !events.length ? h('div', { class: 'empty', text: 'No events yet. Drag one here or press + to add one.' }) : null,
    upcoming.map(e => eventRow(e, false)),
    past.length ? h('button', {
      class: 'link-btn', text: showPast ? 'Hide past events' : `Show ${past.length} past event${past.length === 1 ? '' : 's'}`,
      onclick: () => { showPast ? ui.showPast.delete(key) : ui.showPast.add(key); render(); },
    }) : null,
    showPast ? past.map(e => eventRow(e, true)) : null);

  const card = h('div', { class: 'subject' + (open ? ' open' : ''), style: { '--c': color } }, head, body);

  let hoverTimer = null;
  card.addEventListener('dragover', e => {
    if (!ui.dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    card.classList.add('drop');
    if (!open && !hoverTimer) hoverTimer = setTimeout(() => { ui.expanded.add(key); card.classList.add('open'); }, 700);
  });
  card.addEventListener('dragleave', e => {
    if (card.contains(e.relatedTarget)) return;
    card.classList.remove('drop');
    clearTimeout(hoverTimer); hoverTimer = null;
  });
  card.addEventListener('drop', e => {
    e.preventDefault();
    clearTimeout(hoverTimer);
    const id = e.dataTransfer.getData('text/plain') || ui.dragId;
    ui.dragId = null;
    moveEvent(id, sid);
  });
  return card;
}

/* =====================================================================
 * Integrations: state & sync
 * ===================================================================== */
const I = store.integrations;
const SYNC_PAST_DAYS = 30, SYNC_FUTURE_DAYS = 150;
const syncWindow = () => {
  const today = startOfDay(new Date());
  return { min: addDays(today, -SYNC_PAST_DAYS), max: addDays(today, SYNC_FUTURE_DAYS) };
};

function isConnected(src) {
  if (src === 'google') return I.google.connected && I.google.calendar;
  if (src === 'classroom') return I.google.connected && I.google.classroom;
  return !!I[src].connected;
}
const connectedSources = () => ['google', 'classroom', 'canvas', 'notion'].filter(isConnected);

function cachedGoogleToken() {
  try {
    const t = JSON.parse(sessionStorage.getItem('pc.gtoken'));
    if (t && t.exp > Date.now() && t.client === I.google.clientId.trim()) return t;
  } catch { /* ignore */ }
  return null;
}

async function getGoogleToken() {
  const scopes = [...(I.google.calendar ? Integrations.GOOGLE_SCOPES.calendar : []), ...(I.google.classroom ? Integrations.GOOGLE_SCOPES.classroom : [])];
  const cached = cachedGoogleToken();
  if (cached && scopes.every(s => cached.scope.includes(s))) return cached.token;
  const t = await Integrations.googleToken(I.google.clientId.trim(), scopes, I.google.connected ? '' : 'consent');
  sessionStorage.setItem('pc.gtoken', JSON.stringify({ ...t, client: I.google.clientId.trim() }));
  I.google.connected = true;
  save();
  return t.token;
}

function mergeImported(src, items, min, max) {
  const minS = fmtLocal(min), maxS = fmtLocal(max);
  const existing = new Map(store.events.filter(e => e.source === src).map(e => [e.uid, e]));
  const seen = new Set();
  for (const it of items) {
    if (seen.has(it.uid)) continue;
    seen.add(it.uid);
    if (it.end <= it.start) it.end = fmtLocal(new Date(new Date(it.start).getTime() + 15 * 60000));
    const fields = {
      title: it.title, start: it.start, end: it.end, allDay: !!it.allDay,
      location: it.location || '', description: it.description || '', url: it.url || '',
    };
    const ex = existing.get(it.uid);
    if (ex) Object.assign(ex, fields);
    else {
      store.events.push({
        id: newId(), source: src, uid: it.uid, ...fields,
        subjectId: store.settings.autoSubjects && it.course ? ensureSubject(it.course).id : null,
      });
    }
  }
  // Drop events that disappeared from the source (only inside the synced window).
  store.events = store.events.filter(e => e.source !== src || seen.has(e.uid) || e.end < minS || e.start > maxS);
  return seen.size;
}

async function syncSource(src, { silent = false } = {}) {
  if (ui.syncing.has(src)) return;
  ui.syncing.add(src);
  delete ui.errors[src];
  render();
  try {
    const { min, max } = syncWindow();
    let items;
    if (src === 'google') items = await Integrations.googleCalendar(await getGoogleToken(), min, max);
    else if (src === 'classroom') items = await Integrations.classroom(await getGoogleToken(), min, max);
    else if (src === 'canvas') items = await Integrations.canvas(I.canvas, min, max);
    else items = await Integrations.notion(I.notion, min, max);
    const count = mergeImported(src, items, min, max);
    store.meta[src] = { last: Date.now(), count };
    if (src === 'canvas' || src === 'notion') I[src].connected = true;
    save();
    if (!silent) toast(`${SOURCES[src].label}: synced ${count} item${count === 1 ? '' : 's'}`, 'success');
  } catch (err) {
    if (err.status === 401 && (src === 'google' || src === 'classroom')) sessionStorage.removeItem('pc.gtoken');
    ui.errors[src] = err.message;
    if (!silent) toast(err.message, 'error');
  } finally {
    ui.syncing.delete(src);
    render();
  }
}

async function syncAll({ silent = false } = {}) {
  for (const src of connectedSources()) {
    if (silent && (src === 'google' || src === 'classroom') && !cachedGoogleToken()) continue; // needs a click to re-auth
    await syncSource(src, { silent });
  }
}

async function disconnect(src) {
  const label = src === 'google' ? 'Google' : SOURCES[src].label;
  const sources = src === 'google' ? ['google', 'classroom'] : [src];
  const count = store.events.filter(e => sources.includes(e.source)).length;
  const ok = await confirmDialog({
    title: `Disconnect ${label}?`,
    body: count ? `${count} imported event${count === 1 ? '' : 's'} will be removed from your calendar. Your own events and subjects are not affected.` : 'Your own events and subjects are not affected.',
    ok: 'Disconnect', danger: true,
  });
  if (!ok) return;
  if (src === 'google') {
    const t = cachedGoogleToken();
    if (t) Integrations.googleRevoke(t.token);
    sessionStorage.removeItem('pc.gtoken');
    I.google.connected = false;
  } else {
    I[src].connected = false;
    I[src].token = '';
  }
  store.events = store.events.filter(e => !sources.includes(e.source));
  sources.forEach(s => { delete store.meta[s]; delete ui.errors[s]; });
  save(); render();
}

/* =====================================================================
 * Rendering: integrations tab
 * ===================================================================== */
function sw(checked, onchange) {
  return h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked, onchange: e => onchange(e.target.checked) }), h('span', { class: 'knob' }));
}

function textField(label, value, onInput, opts = {}) {
  const input = opts.multiline
    ? h('textarea', { rows: 2, value, placeholder: opts.placeholder || '', spellcheck: false })
    : h('input', { type: opts.secret ? 'password' : 'text', value, placeholder: opts.placeholder || '', spellcheck: false, autocomplete: 'off' });
  input.addEventListener('input', () => { onInput(input.value); save(); });
  return h('label', { class: 'int-field' }, h('span', { text: label }), input, opts.hint ? h('small', { text: opts.hint }) : null);
}

function integrationCard({ logo, logoClass, name, desc, status, children, actions, help }) {
  return h('section', { class: 'int-card' },
    h('div', { class: 'int-head' },
      h('div', { class: `logo ${logoClass}` }, logo),
      h('div', { class: 'int-title' }, h('h3', { text: name }), h('p', { text: desc })),
      h('span', { class: `status ${status.kind}`, text: status.text })),
    children,
    h('div', { class: 'int-actions' }, actions),
    help ? h('details', { class: 'help' }, h('summary', { text: 'How to set this up' }), help) : null);
}

const metaText = src => {
  const m = store.meta[src];
  return m ? `${m.count} item${m.count === 1 ? '' : 's'} · synced ${ago(m.last)}` : 'Not synced yet';
};
const busyBtn = (label, src, onclick, cls = 'btn primary') =>
  h('button', { class: cls, disabled: ui.syncing.has(src), onclick }, ui.syncing.has(src) ? 'Syncing…' : label);

function renderIntegrations(root) {
  const fileWarn = location.protocol === 'file:'
    ? h('div', { class: 'banner warn' },
      'You opened this page as a file. Integrations need the local server: run ', h('code', { text: 'node server.js' }), ' then open ', h('code', { text: 'http://localhost:5173' }), '.')
    : null;

  /* Google */
  const g = I.google;
  const gNeedsAuth = g.connected && !cachedGoogleToken();
  const gStatus = ui.errors.google || ui.errors.classroom ? { kind: 'error', text: 'Error' }
    : g.connected ? (gNeedsAuth ? { kind: 'warn', text: 'Session expired' } : { kind: 'ok', text: 'Connected' })
      : { kind: 'off', text: 'Not connected' };
  const googleCard = integrationCard({
    logo: icon('calendar', 22), logoClass: 'google', name: 'Google Calendar & Classroom',
    desc: 'Import your calendar events and Classroom assignment due dates.',
    status: gStatus,
    children: [
      textField('OAuth Client ID', g.clientId, v => { g.clientId = v; }, { placeholder: '1234567890-abc123.apps.googleusercontent.com' }),
      h('div', { class: 'toggle-row' },
        h('div', {}, h('b', { text: 'Google Calendar' }), h('small', { text: g.connected && g.calendar ? metaText('google') : 'Events from all your calendars' })),
        sw(g.calendar, v => { g.calendar = v; save(); render(); })),
      h('div', { class: 'toggle-row' },
        h('div', {}, h('b', { text: 'Google Classroom' }), h('small', { text: g.connected && g.classroom ? metaText('classroom') : 'Assignment due dates, one subject per class' })),
        sw(g.classroom, v => { g.classroom = v; save(); render(); })),
      ui.errors.google ? h('div', { class: 'err', text: ui.errors.google }) : null,
      ui.errors.classroom ? h('div', { class: 'err', text: ui.errors.classroom }) : null,
    ],
    actions: g.connected ? [
      h('button', { class: 'btn primary', disabled: ui.syncing.size > 0, onclick: async () => { for (const s of ['google', 'classroom']) if (isConnected(s)) await syncSource(s); } },
        gNeedsAuth ? 'Reconnect & sync' : 'Sync now'),
      h('button', { class: 'btn danger-ghost', text: 'Disconnect', onclick: () => disconnect('google') }),
    ] : [
      h('button', {
        class: 'btn primary', text: 'Connect Google',
        onclick: async () => {
          try {
            await getGoogleToken();
            for (const s of ['google', 'classroom']) if (isConnected(s)) await syncSource(s);
            render();
          } catch (err) { ui.errors.google = err.message; toast(err.message, 'error'); render(); }
        },
      }),
    ],
    help: h('ol', {},
      h('li', {}, 'In ', h('a', { href: 'https://console.cloud.google.com/apis/credentials', target: '_blank', rel: 'noopener noreferrer', text: 'Google Cloud Console' }), ', create a project and enable the Google Calendar API and Google Classroom API.'),
      h('li', { text: 'Configure the OAuth consent screen (External) and add yourself as a test user.' }),
      h('li', {}, 'Create credentials, "OAuth client ID", type "Web application". Under Authorized JavaScript origins add ', h('code', { text: location.origin }), '.'),
      h('li', { text: 'Paste the Client ID above and press Connect. Access is read-only.' })),
  });

  /* Canvas */
  const c = I.canvas;
  const canvasCard = integrationCard({
    logo: icon('layers', 22), logoClass: 'canvas', name: 'Canvas',
    desc: 'Assignments, quizzes and events from your Canvas planner.',
    status: ui.errors.canvas ? { kind: 'error', text: 'Error' } : c.connected ? { kind: 'ok', text: 'Connected' } : { kind: 'off', text: 'Not connected' },
    children: [
      textField('Canvas URL', c.baseUrl, v => { c.baseUrl = v; }, { placeholder: 'https://yourschool.instructure.com' }),
      textField('Access token', c.token, v => { c.token = v; }, { secret: true, placeholder: 'Paste your access token', hint: 'Stored only in this browser.' }),
      c.connected ? h('div', { class: 'meta-line', text: metaText('canvas') }) : null,
      ui.errors.canvas ? h('div', { class: 'err', text: ui.errors.canvas }) : null,
    ],
    actions: c.connected ? [
      busyBtn('Sync now', 'canvas', () => syncSource('canvas')),
      h('button', { class: 'btn danger-ghost', text: 'Disconnect', onclick: () => disconnect('canvas') }),
    ] : [busyBtn('Connect & sync', 'canvas', () => syncSource('canvas'))],
    help: h('ol', {},
      h('li', { text: 'In Canvas open Account, then Settings.' }),
      h('li', { text: 'Under "Approved Integrations" choose "+ New Access Token", give it a name and generate it.' }),
      h('li', { text: 'Copy the token (it is shown only once) and paste it above with your school\'s Canvas URL.' }),
      h('li', { text: 'Each course becomes a subject automatically. If your school blocks personal tokens, ask your admin.' })),
  });

  /* Notion */
  const n = I.notion;
  const notionCard = integrationCard({
    logo: 'N', logoClass: 'notion', name: 'Notion',
    desc: 'Pull dated pages from one or more Notion databases.',
    status: ui.errors.notion ? { kind: 'error', text: 'Error' } : n.connected ? { kind: 'ok', text: 'Connected' } : { kind: 'off', text: 'Not connected' },
    children: [
      textField('Integration token', n.token, v => { n.token = v; }, { secret: true, placeholder: 'secret_… or ntn_…', hint: 'Stored only in this browser.' }),
      textField('Database links or IDs', n.databases, v => { n.databases = v; }, { multiline: true, placeholder: 'Paste one or more database links, separated by commas or new lines' }),
      textField('Proxy URL (optional)', n.proxy, v => { n.proxy = v; }, { placeholder: 'Leave blank when using node server.js', hint: 'Only needed if you host the app somewhere else.' }),
      n.connected ? h('div', { class: 'meta-line', text: metaText('notion') }) : null,
      ui.errors.notion ? h('div', { class: 'err', text: ui.errors.notion }) : null,
    ],
    actions: n.connected ? [
      busyBtn('Sync now', 'notion', () => syncSource('notion')),
      h('button', { class: 'btn danger-ghost', text: 'Disconnect', onclick: () => disconnect('notion') }),
    ] : [busyBtn('Connect & sync', 'notion', () => syncSource('notion'))],
    help: h('ol', {},
      h('li', {}, 'Create an internal integration at ', h('a', { href: 'https://www.notion.so/profile/integrations', target: '_blank', rel: 'noopener noreferrer', text: 'notion.so/profile/integrations' }), ' and copy its secret.'),
      h('li', { text: 'Open your database in Notion, click "..." then "Connections" and add your integration.' }),
      h('li', { text: 'Copy the database link and paste it above. The database needs a Date property.' }),
      h('li', { text: 'A select property named "Subject", "Course" or "Class" is used to pick the subject automatically.' }),
      h('li', {}, 'Notion blocks direct browser requests, so calls go through the included ', h('code', { text: 'server.js' }), ' proxy.')),
  });

  const autoToggle = h('div', { class: 'toggle-row card-row' },
    h('div', {}, h('b', { text: 'Create subjects from course names' }),
      h('small', { text: 'New Canvas, Classroom and Notion items are filed under a subject named after their course.' })),
    sw(store.settings.autoSubjects, v => { store.settings.autoSubjects = v; save(); }));

  /* Notifications */
  const rem = store.settings.reminders;
  const perm = permission();
  const remindersOn = rem.enabled && perm === 'granted';
  const notifCard = integrationCard({
    logo: icon('bell', 22), logoClass: 'notif', name: 'Reminders & notifications',
    desc: 'Get a notification before your events start.',
    status: perm === 'unsupported' ? { kind: 'error', text: 'Unsupported' }
      : perm === 'denied' ? { kind: 'error', text: 'Blocked' }
        : remindersOn ? { kind: 'ok', text: 'On' } : { kind: 'off', text: 'Off' },
    children: [
      h('div', { class: 'toggle-row' },
        h('div', {}, h('b', { text: 'Enable reminders' }),
          h('small', { text: perm === 'denied' ? 'Blocked in your browser. Allow notifications for this site in its settings.' : 'The browser will ask for permission the first time.' })),
        sw(remindersOn, v => (v ? enableReminders() : (rem.enabled = false, save(), render())))),
      h('label', { class: 'int-field' }, h('span', { text: 'Default reminder' }),
        h('select', {
          onchange: e => { rem.lead = Number(e.target.value); save(); },
        }, LEAD_OPTIONS.map(([v, label]) => h('option', { value: String(v), text: label, selected: rem.lead === v }))),
        h('small', { text: 'You can override this on any event. All-day events notify at 9:00 AM.' })),
      h('div', { class: 'meta-line', text: 'Reminders fire while this app is open in a browser tab or installed as an app. Closed apps cannot send them.' }),
    ],
    actions: [
      h('button', { class: 'btn primary', disabled: !remindersOn, text: 'Send test notification', onclick: sendTestNotification }),
      installPrompt ? h('button', {
        class: 'btn', text: 'Install app',
        onclick: async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; render(); },
      }) : null,
    ],
  });

  /* Data */
  const hasDemo = store.events.some(e => e.demo);
  const dataCard = integrationCard({
    logo: icon('tag', 22), logoClass: 'data', name: 'Your data',
    desc: 'Everything is stored in this browser only. Nothing is uploaded anywhere.',
    status: { kind: 'off', text: `${store.events.length} event${store.events.length === 1 ? '' : 's'}` },
    actions: [
      h('button', { class: 'btn', text: hasDemo ? 'Reload sample data' : 'Load sample data', onclick: loadSampleData }),
      h('button', { class: 'btn danger-ghost', text: 'Erase all data', onclick: eraseAllData }),
    ],
  });

  root.replaceChildren(h('div', { class: 'page' },
    pageHead('Integrations', 'Bring your calendars and coursework into one place. Credentials never leave this browser.'),
    fileWarn, autoToggle,
    h('div', { class: 'cards' }, notifCard, googleCard, canvasCard, notionCard, dataCard)));
}

/* =====================================================================
 * Reminders / notifications
 * ===================================================================== */
const REMIND_OPTIONS = [
  [null, 'Default'], [-1, 'No reminder'], [0, 'At time of event'], [5, '5 minutes before'], [10, '10 minutes before'],
  [15, '15 minutes before'], [30, '30 minutes before'], [60, '1 hour before'], [120, '2 hours before'], [1440, '1 day before'],
];
const LEAD_OPTIONS = REMIND_OPTIONS.filter(([v]) => v !== null && v >= 0);
const ALL_DAY_NOTIFY_MINUTES = 9 * 60; // all-day events notify at 9:00 AM
const CATCH_UP_MS = 15 * 60000;        // still fire if we were asleep for a few minutes
let swReg = null;
let installPrompt = null;

const notificationsSupported = () => 'Notification' in window;
const permission = () => (notificationsSupported() ? Notification.permission : 'unsupported');

/** Minutes before the event to remind, or null when this event shouldn't notify. */
function reminderLead(ev) {
  const r = store.settings.reminders;
  if (!r.enabled || ev.remind === -1) return null;
  return ev.remind ?? r.lead;
}

function reminderTime(ev, lead) {
  const s = evStart(ev);
  if (ev.allDay) {
    const nineAm = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, ALL_DAY_NOTIFY_MINUTES);
    return new Date(nineAm.getTime() - (lead >= 1440 ? lead : 0) * 60000);
  }
  return new Date(s.getTime() - lead * 60000);
}

async function showNotification(title, options) {
  if (permission() !== 'granted') return false;
  const opts = { icon: 'icon.svg', badge: 'icon.svg', data: { url: location.href }, ...options };
  try {
    const reg = swReg || await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(title, opts); return true; }
    new Notification(title, opts);
    return true;
  } catch {
    try { new Notification(title, opts); return true; } catch { return false; }
  }
}

function reminderBody(ev, lead) {
  const s = evStart(ev);
  const parts = [];
  if (ev.allDay) parts.push(lead >= 1440 ? 'Tomorrow · all day' : 'Today · all day');
  else {
    const mins = Math.round((s.getTime() - Date.now()) / 60000);
    parts.push(mins <= 0 ? `Starting now (${fmtTime(s)})`
      : mins < 60 ? `In ${mins} min (${fmtTime(s)})`
        : mins < 1440 ? `In ${Math.round(mins / 60)} h (${fmtTime(s)})`
          : `${s.toLocaleDateString([], { weekday: 'short' })} ${fmtTime(s)}`);
  }
  if (ev.location) parts.push(ev.location);
  const subject = subjectById(ev.subjectId);
  if (subject) parts.push(subject.name);
  return parts.join(' · ');
}

async function notifyEvent(ev, lead) {
  const body = reminderBody(ev, lead);
  const shown = await showNotification(ev.title, { body, tag: `pc-${ev.id}` });
  if (!shown) toast(`${ev.title}: ${body}`);
}

function checkReminders() {
  if (!store.settings.reminders.enabled) return;
  const now = Date.now();
  let changed = false;
  for (const ev of store.events) {
    const lead = reminderLead(ev);
    if (lead == null) continue;
    const at = reminderTime(ev, lead).getTime();
    const key = `${ev.id}|${ev.start}|${lead}`;
    if (now < at || now >= evEnd(ev).getTime() || store.notified[key]) continue;
    if (!ev.allDay && now - at > CATCH_UP_MS) continue;
    store.notified[key] = now;
    changed = true;
    notifyEvent(ev, lead);
  }
  for (const [k, t] of Object.entries(store.notified)) {
    if (now - t > 14 * 864e5) { delete store.notified[k]; changed = true; }
  }
  if (changed) save();
}

async function enableReminders() {
  if (!notificationsSupported()) {
    toast('This browser does not support notifications', 'error');
  } else {
    const result = permission() === 'default' ? await Notification.requestPermission() : permission();
    if (result === 'granted') {
      store.settings.reminders.enabled = true;
      save(); render(); checkReminders();
      return;
    }
    toast(result === 'denied' ? 'Notifications are blocked. Allow them in your browser\'s site settings.' : 'Notification permission was dismissed', 'error');
  }
  store.settings.reminders.enabled = false;
  save(); render();
}

async function sendTestNotification() {
  if (permission() !== 'granted') return toast('Turn on reminders first so the browser can ask for permission', 'error');
  const ok = await showNotification('Test reminder', { body: 'Notifications are working. You will get a reminder before your events.', tag: 'pc-test' });
  if (!ok) toast('Could not show a notification in this browser', 'error');
}

/* =====================================================================
 * Sample data / reset
 * ===================================================================== */
function loadSampleData() {
  store.events = store.events.filter(e => !e.demo);
  const subjects = {};
  [['Biology', '#22c55e'], ['Calculus', '#6366f1'], ['English Lit', '#f97316'], ['Computer Science', '#06b6d4']]
    .forEach(([name, color]) => { subjects[name] = ensureSubject(name, color).id; });
  const week = startOfWeek(new Date());
  // [day offset, start hour, start minute, minutes, title, subject, location, description]
  const rows = [
    [1, 9, 0, 75, 'Biology lecture', 'Biology', 'Science Hall 204', 'Chapter 9: cellular respiration'],
    [1, 11, 0, 60, 'Calculus', 'Calculus', 'Math Building 12', ''],
    [1, 14, 0, 90, 'CS lab', 'Computer Science', 'Lab 3', 'Pair programming: linked lists'],
    [2, 10, 30, 60, 'English seminar', 'English Lit', 'Humanities 101', 'Bring the annotated copy'],
    [2, 16, 0, 60, 'Study group', 'Calculus', 'Library, 2nd floor', 'Problem set 5'],
    [3, 9, 0, 75, 'Biology lecture', 'Biology', 'Science Hall 204', ''],
    [3, 13, 0, 30, 'Office hours', 'Computer Science', 'Room 410', ''],
    [4, 11, 0, 60, 'Calculus', 'Calculus', 'Math Building 12', ''],
    [4, 15, 0, 60, 'Essay draft due', 'English Lit', '', 'Submit on Canvas'],
    [5, 10, 0, 120, 'Biology lab report', 'Biology', '', 'Write up results and discussion'],
  ];
  rows.forEach(([d, hr, mi, dur, title, subject, location, description]) => {
    const start = new Date(week.getFullYear(), week.getMonth(), week.getDate() + d, hr, mi);
    store.events.push({
      id: newId(), source: 'local', demo: true, title, location, description, allDay: false,
      start: fmtLocal(start), end: fmtLocal(new Date(start.getTime() + dur * 60000)), subjectId: subjects[subject],
    });
  });
  const exam = addDays(week, 5);
  store.events.push({
    id: newId(), source: 'local', demo: true, title: 'Midterm exams', location: '', description: '', allDay: true,
    start: fmtLocal(addDays(exam, 7)), end: fmtLocal(addDays(exam, 9)), subjectId: subjects['Calculus'],
  });
  save();
  toast('Sample data loaded', 'success');
  render();
}

async function eraseAllData() {
  const ok = await confirmDialog({
    title: 'Erase all data?',
    body: 'This deletes every event, subject and saved integration credential stored in this browser. This cannot be undone.',
    ok: 'Erase everything', danger: true,
  });
  if (!ok) return;
  localStorage.removeItem(LS_KEY);
  sessionStorage.removeItem('pc.gtoken');
  location.reload();
}

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (ui.tab === 'integrations') render(); });
window.addEventListener('appinstalled', () => { installPrompt = null; if (ui.tab === 'integrations') render(); });

/* =====================================================================
 * Boot
 * ===================================================================== */
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  store.settings.theme = theme;
  save();
  renderSidebar();
}

document.documentElement.style.setProperty('--hour', `${HOUR}px`);
$$('.nav-btn').forEach(b => {
  b.prepend(icon(b.dataset.icon));
  b.addEventListener('click', () => { ui.tab = b.dataset.tab; render(); });
});
$('#theme-btn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (popEl) return closePopover(); modalStack.at(-1)?.close(); return; }
  if (modalStack.length || e.ctrlKey || e.metaKey || e.altKey || ui.tab !== 'calendar') return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (k === 't') setCursor(new Date());
  else if (k === 'd' || k === 'w' || k === 'm') setView({ d: 'day', w: 'week', m: 'month' }[k]);
  else if (k === 'arrowleft') navigate(-1);
  else if (k === 'arrowright') navigate(1);
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').then(r => { swReg = r; }).catch(() => {});
}
setInterval(checkReminders, 30000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkReminders(); });

render();
checkReminders();
syncAll({ silent: true });







