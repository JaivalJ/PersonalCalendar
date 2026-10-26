'use strict';
/*
 * Integrations: Google Calendar, Google Classroom, Canvas, Notion.
 * Every fetcher returns normalized items:
 *   { uid, title, start, end, allDay, location, description, url, course }
 * where start/end are local "YYYY-MM-DDTHH:mm" strings. For all-day items `end` is exclusive.
 */
const Integrations = (() => {
  const pad = n => String(n).padStart(2, '0');
  const dayStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toLocal = d => `${dayStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const addMinutes = (d, m) => new Date(d.getTime() + m * 60000);
  const nextDay = s => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return dayStr(new Date(y, m - 1, d + 1)); };

  const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';

  const htmlToText = html => {
    const withBreaks = String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n');
    return (new DOMParser().parseFromString(withBreaks, 'text/html').body.textContent || '').trim();
  };

  async function jsonFetch(url, opts, label) {
    let res;
    try {
      res = await fetch(url, opts);
    } catch {
      const err = new Error(`${label}: couldn't reach the server (network or CORS error)`);
      err.network = true;
      throw err;
    }
    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.clone().json();
        detail = j.error?.message || j.message || (typeof j.error === 'string' ? j.error : '') || j.errors?.[0]?.message || '';
      } catch { /* not json */ }
      const err = new Error(`${label}: ${res.status} ${detail || res.statusText}`.trim());
      err.status = res.status;
      throw err;
    }
    return res;
  }

  async function paged(url, key, headers, label) {
    const out = [];
    let token = '';
    do {
      const u = url + (token ? `&pageToken=${encodeURIComponent(token)}` : '');
      const data = await (await jsonFetch(u, { headers }, label)).json();
      out.push(...(data[key] || []));
      token = data.nextPageToken || '';
    } while (token);
    return out;
  }

  /* ---------------- Google auth (Identity Services token flow) ---------------- */
  const GOOGLE_SCOPES = {
    calendar: ['https://www.googleapis.com/auth/calendar.readonly'],
    classroom: [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
    ],
  };

  let gsiPromise = null;
  function loadGsi() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    return (gsiPromise ||= new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { gsiPromise = null; reject(new Error("Couldn't load Google sign-in (are you offline?)")); };
      document.head.appendChild(s);
    }));
  }

  async function googleToken(clientId, scopes, prompt) {
    if (!clientId) throw new Error('Paste your Google OAuth Client ID first');
    if (location.protocol === 'file:') throw new Error('Google sign-in needs http. Run "node server.js" and open http://localhost:5173');
    await loadGsi();
    return new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: scopes.join(' '),
        callback: r => {
          if (r.error) return reject(new Error(r.error_description || r.error));
          resolve({ token: r.access_token, exp: Date.now() + (Number(r.expires_in) - 60) * 1000, scope: r.scope || scopes.join(' ') });
        },
        error_callback: e => reject(new Error(e.type === 'popup_closed' ? 'Google sign-in was closed' : (e.message || e.type || 'Google sign-in failed'))),
      });
      client.requestAccessToken(prompt ? { prompt } : {});
    });
  }

  function googleRevoke(token) {
    try { window.google?.accounts?.oauth2?.revoke(token, () => {}); } catch { /* ignore */ }
  }

  /* ---------------- Google Calendar ---------------- */
  async function googleCalendar(token, min, max) {
    const headers = { Authorization: `Bearer ${token}` };
    const list = await (await jsonFetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader', { headers }, 'Google Calendar')).json();
    const out = [];
    for (const cal of (list.items || []).filter(c => c.selected !== false)) {
      let pageToken = '';
      do {
        const q = new URLSearchParams({
          singleEvents: 'true', orderBy: 'startTime', maxResults: '250',
          timeMin: min.toISOString(), timeMax: max.toISOString(),
        });
        if (pageToken) q.set('pageToken', pageToken);
        const data = await (await jsonFetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${q}`, { headers }, 'Google Calendar')).json();
        for (const e of data.items || []) {
          if (e.status === 'cancelled' || !e.start) continue;
          const allDay = !!e.start.date;
          let start, end;
          if (allDay) {
            start = `${e.start.date}T00:00`;
            end = `${e.end?.date || nextDay(e.start.date)}T00:00`;
            if (end <= start) end = `${nextDay(e.start.date)}T00:00`;
          } else {
            start = toLocal(new Date(e.start.dateTime));
            end = toLocal(new Date(e.end?.dateTime || e.start.dateTime));
          }
          out.push({
            uid: `${cal.id}|${e.id}`, title: e.summary || '(No title)', start, end, allDay,
            location: e.location || '', description: htmlToText(e.description || ''), url: e.htmlLink || '', course: null,
          });
        }
        pageToken = data.nextPageToken || '';
      } while (pageToken);
    }
    return out;
  }

  /* ---------------- Google Classroom ---------------- */
  async function classroom(token, min, max) {
    const headers = { Authorization: `Bearer ${token}` };
    const courses = await paged(
      'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&studentId=me&pageSize=50', 'courses', headers, 'Google Classroom');
    const out = [];
    for (const c of courses) {
      const work = await paged(
        `https://classroom.googleapis.com/v1/courses/${c.id}/courseWork?pageSize=100`, 'courseWork', headers, 'Google Classroom');
      for (const w of work) {
        const dd = w.dueDate;
        if (!dd) continue;
        let start, end, allDay = false;
        if (w.dueTime) {
          // Classroom due times are expressed in UTC.
          const when = new Date(Date.UTC(dd.year, dd.month - 1, dd.day, w.dueTime.hours || 0, w.dueTime.minutes || 0));
          start = toLocal(when);
          end = toLocal(addMinutes(when, 30));
        } else {
          const ds = `${dd.year}-${pad(dd.month)}-${pad(dd.day)}`;
          start = `${ds}T00:00`;
          end = `${nextDay(ds)}T00:00`;
          allDay = true;
        }
        const startDate = new Date(start);
        if (startDate < min || startDate > max) continue;
        out.push({
          uid: `${c.id}:${w.id}`, title: w.title || '(Untitled assignment)', start, end, allDay,
          location: '', description: w.description || '', url: w.alternateLink || '', course: c.name,
        });
      }
    }
    return out;
  }

  /* ---------------- Canvas ---------------- */
  function normalizeCanvasBase(raw) {
    let s = (raw || '').trim();
    if (!s) throw new Error('Enter your Canvas URL, e.g. https://school.instructure.com');
    if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
    return new URL(s).origin;
  }

  async function canvas(cfg, min, max) {
    const base = normalizeCanvasBase(cfg.baseUrl);
    if (!cfg.token?.trim()) throw new Error('Paste your Canvas access token');
    const headers = { Authorization: `Bearer ${cfg.token.trim()}` };
    let useProxy = false;

    async function get(pathAndQuery) {
      if (!useProxy) {
        try {
          return await jsonFetch(base + pathAndQuery, { headers }, 'Canvas');
        } catch (e) {
          if (!e.network) throw e;
          if (!isLocalHost) {
            throw new Error('Canvas: the request was blocked (CORS). Some schools disable browser access to the Canvas API. Run the app locally with "node server.js" to use its proxy.');
          }
          useProxy = true; // CORS blocked: fall back to the local proxy
        }
      }
      return jsonFetch('/proxy/canvas' + pathAndQuery, { headers: { ...headers, 'X-Canvas-Host': new URL(base).host } }, 'Canvas');
    }

    const out = [];
    let next = `/api/v1/planner/items?start_date=${dayStr(min)}&end_date=${dayStr(max)}&per_page=100`;
    for (let page = 0; next && page < 40; page++) {
      const res = await get(next);
      const items = await res.json();
      for (const it of items) {
        const p = it.plannable || {};
        const type = it.plannable_type || 'item';
        const when = p.due_at || p.start_at || p.todo_date || it.plannable_date;
        if (!when) continue;
        const s = new Date(when);
        if (isNaN(s)) continue;
        const title = p.title || p.name;
        if (!title) continue;
        const isEvent = type === 'calendar_event';
        let start, end, allDay = false;
        if (isEvent && p.all_day) {
          const ds = (p.all_day_date || dayStr(s));
          start = `${ds}T00:00`; end = `${nextDay(ds)}T00:00`; allDay = true;
        } else {
          start = toLocal(s);
          end = toLocal(p.end_at ? new Date(p.end_at) : addMinutes(s, isEvent ? 60 : 30));
        }
        out.push({
          uid: `${type}:${it.plannable_id}`, title, start, end, allDay,
          location: p.location_name || '', description: p.description ? htmlToText(p.description) : '',
          url: it.html_url ? new URL(it.html_url, base).href : '', course: it.context_name || null,
        });
      }
      const m = (res.headers.get('link') || '').match(/<([^>]+)>;\s*rel="next"/);
      next = m ? (u => u.pathname + u.search)(new URL(m[1])) : null;
    }
    return out;
  }

  /* ---------------- Notion (through the local proxy) ---------------- */
  function notionIds(raw) {
    return (raw || '').split(/[\s,]+/).map(part => {
      const plain = part.match(/[0-9a-f]{32}/i);
      if (plain) return plain[0].toLowerCase();
      const dashed = part.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      return dashed ? dashed[0].replace(/-/g, '').toLowerCase() : null;
    }).filter(Boolean);
  }
  const richText = arr => (arr || []).map(t => t.plain_text).join('');

  async function notion(cfg, min, max) {
    const proxy = (cfg.proxy || '').trim().replace(/\/+$/, '');
    if (!proxy && !isLocalHost) throw new Error('Notion blocks direct browser requests. Run the app with "node server.js", or enter a Proxy URL in the Notion settings.');
    if (!proxy && location.protocol === 'file:') throw new Error('Notion needs the local server. Run "node server.js" and open http://localhost:5173');
    if (!cfg.token?.trim()) throw new Error('Paste your Notion integration token');
    const ids = notionIds(cfg.databases);
    if (!ids.length) throw new Error('Add at least one Notion database link or ID');
    const base = `${proxy}/proxy/notion/v1`;
    const headers = { Authorization: `Bearer ${cfg.token.trim()}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };
    const out = [];

    for (const id of ids) {
      const db = await (await jsonFetch(`${base}/databases/${id}`, { headers }, 'Notion')).json();
      const props = Object.entries(db.properties || {});
      const dateProps = props.filter(([, p]) => p.type === 'date');
      if (!dateProps.length) throw new Error(`Notion database "${richText(db.title) || id}" needs a Date property`);
      const dateName = (dateProps.find(([n]) => /date|due|when|deadline/i.test(n)) || dateProps[0])[0];
      const titleName = props.find(([, p]) => p.type === 'title')?.[0];
      const subjectName = props.find(([n, p]) => p.type === 'select' && /subject|course|class/i.test(n))?.[0];

      let cursor = null;
      do {
        const body = {
          page_size: 100,
          filter: { and: [
            { property: dateName, date: { on_or_after: dayStr(min) } },
            { property: dateName, date: { on_or_before: dayStr(max) } },
          ] },
        };
        if (cursor) body.start_cursor = cursor;
        const data = await (await jsonFetch(`${base}/databases/${id}/query`,
          { method: 'POST', headers, body: JSON.stringify(body) }, 'Notion')).json();

        for (const page of data.results || []) {
          const d = page.properties?.[dateName]?.date;
          if (!d?.start) continue;
          let start, end, allDay = false;
          if (d.start.length <= 10) {
            allDay = true;
            start = `${d.start}T00:00`;
            end = `${nextDay(d.end || d.start)}T00:00`; // Notion's end date is inclusive
          } else {
            const s = new Date(d.start);
            start = toLocal(s);
            end = toLocal(d.end ? new Date(d.end) : addMinutes(s, 60));
          }
          out.push({
            uid: page.id,
            title: (titleName && richText(page.properties[titleName]?.title)) || 'Untitled',
            start, end, allDay, location: '', description: '', url: page.url || '',
            course: (subjectName && page.properties[subjectName]?.select?.name) || null,
          });
        }
        cursor = data.has_more ? data.next_cursor : null;
      } while (cursor);
    }
    return out;
  }

  return { GOOGLE_SCOPES, googleToken, googleRevoke, googleCalendar, classroom, canvas, notion, notionIds };
})();




laksllaksdjalksdj