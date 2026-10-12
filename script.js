const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
let events = JSON.parse(localStorage.getItem('calendar-events') || '{}');
const save = () => localStorage.setItem('calendar-events', JSON.stringify(events));

const now = new Date();
let view = new Date(now.getFullYear(), now.getMonth(), 1);
let selected = key(now);

const grid = document.getElementById('grid');
const title = document.getElementById('title');
const list = document.getElementById('event-list');
const label = document.getElementById('selected-label');

function render() {
  title.textContent = view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  grid.innerHTML = '';
  const start = new Date(view);
  start.setDate(1 - view.getDay());
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const k = key(d);
    const el = document.createElement('div');
    el.className = 'day' + (d.getMonth() !== view.getMonth() ? ' other' : '')
      + (k === key(now) ? ' today' : '') + (k === selected ? ' selected' : '');
    el.textContent = d.getDate();
    if (events[k]?.length) el.insertAdjacentHTML('beforeend', '<span class="dot"></span>');
    el.onclick = () => { selected = k; view = new Date(d.getFullYear(), d.getMonth(), 1); render(); };
    grid.appendChild(el);
  }
  renderEvents();
}

function renderEvents() {
  const [y, m, d] = selected.split('-').map(Number);
  label.textContent = new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  list.innerHTML = '';
  const items = events[selected] || [];
  if (!items.length) list.innerHTML = '<li class="empty">No events</li>';
  items.forEach((text, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;
    const del = document.createElement('button');
    del.textContent = '✕';
    del.onclick = () => {
      items.splice(i, 1);
      if (!items.length) delete events[selected];
      save(); render();
    };
    li.append(span, del);
    list.appendChild(li);
  });
}

document.getElementById('prev').onclick = () => { view.setMonth(view.getMonth() - 1); render(); };
document.getElementById('next').onclick = () => { view.setMonth(view.getMonth() + 1); render(); };
document.getElementById('today').onclick = () => {
  view = new Date(now.getFullYear(), now.getMonth(), 1); selected = key(now); render();
};
document.getElementById('event-form').onsubmit = e => {
  e.preventDefault();
  const input = document.getElementById('event-input');
  (events[selected] ||= []).push(input.value.trim());
  input.value = '';
  save(); render();
};

render()

