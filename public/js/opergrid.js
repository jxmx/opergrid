/**
 *
 *    Copyright 2026 Jason D. McCormick
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://github.com/jxmx/opergrid/blob/main/LICENSE
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

const API = 'api.php';
let config   = null;
let signups  = {};
let pending  = null;   // { station, timeslot } while modal is open
let eventCode = "default";

// ── Helpers ───────────────────────────────────────────────────────────────

function slotKey(station, timeslot) { return station + '|' + timeslot; }

function pad2(n) { return String(n).padStart(2, '0'); }

// Parse "YYYY-MM-DD HH:MM" into a Date (local time)
function parseDateTime(s) {
  // Replace space with T so Date() parses it as local, not UTC
  return new Date(s.trim().replace(' ', 'T') + ':00');
}

// Format a Date as "YYYY-MM-DDTHH:MM" key (used as slot identifier)
function fmtKey(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate())
       + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

// Format a Date for display in the time column — shows date when day changes
function fmtTimeLabel(d, prevD) {
  const time = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  if (!prevD || d.getDate() !== prevD.getDate()) {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return days[d.getDay()] + ' ' +
           (d.getMonth()+1) + '/' + d.getDate() + '\u00a0\u00a0' + time;
  }
  return time;
}

// Format a Date for modal slot info display
function fmtDateTime(d) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return days[d.getDay()] + ' ' + (d.getMonth()+1) + '/' + d.getDate() +
         ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function generateTimeslots(start, end) {
  const slots = [];  // each: { key, label, date, prevDate }
  const startDt = parseDateTime(start);
  const endDt   = parseDateTime(end);
  let cur = new Date(startDt);
  let prev = null;
  while (cur < endDt) {
    slots.push({ key: fmtKey(cur), label: fmtTimeLabel(cur, prev), date: new Date(cur) });
    prev = new Date(cur);
    cur = new Date(cur.getTime() + 60 * 60 * 1000); // +1 hour
  }
  return slots;
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, opts);
  return res.json();
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  clearTimeout(t._to);
  t._to = setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ── Build grid ─────────────────────────────────────────────────────────────

function buildGrid() {
  const timeslots = generateTimeslots(config.schedule.start, config.schedule.end);

  // Header
  const head = document.getElementById('grid-head');
  head.innerHTML = '<th class="th-corner"></th>';
  config.stations.forEach(st => {
    const th = document.createElement('th');
    th.className = 'th-station';
    th.innerHTML = `<span class="st-name">${st.name}</span>
                    <span class="st-meta">${st.band} · ${st.mode}</span>`;
    head.appendChild(th);
  });

  // Rows
  const tbody = document.getElementById('grid-body');
  tbody.innerHTML = '';
  timeslots.forEach(slot => {
    const tr = document.createElement('tr');
    // Add a CSS class when this row starts a new day (label contains '/')
    if (slot.label.includes('/')) tr.classList.add('day-boundary');

    const tdTime = document.createElement('td');
    tdTime.className = 'td-time';
    tdTime.innerHTML = slot.label.replace(/(.+\/.+)\s{2}(.+)/, '<span class="td-date">$1</span><br>$2');
    tr.appendChild(tdTime);

    config.stations.forEach(st => {
      const td = document.createElement('td');
      td.className = 'cell';
      td.dataset.station  = st.id;
      td.dataset.timeslot = slot.key;
      td.dataset.stname   = st.name;
      td.dataset.stmeta   = st.band + ' · ' + st.mode;
      td.dataset.slotdt   = slot.date.toISOString();
      td.addEventListener('click', onCellClick);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  renderCells();
}

function renderCells() {
  document.querySelectorAll('.cell').forEach(td => {
    const key = slotKey(td.dataset.station, td.dataset.timeslot);
    const su  = signups[key];
    if (su) {
      td.className = 'cell taken';
      td.innerHTML = `<div class="cell-inner">
        <span class="cell-callsign">${su.callsign}</span>
        <span class="cell-name">${su.name}</span>
      </div>`;
    } else {
      td.className = 'cell open';
      td.innerHTML = `<div class="cell-inner">
        <span class="cell-open-label">+ OPEN</span>
      </div>`;
    }
  });
}

// ── Modal ──────────────────────────────────────────────────────────────────

function openModal(station, timeslot, stname, stmeta, td_isodate) {
  pending = { station, timeslot };
  const key = slotKey(station, timeslot);
  const su  = signups[key];

  document.getElementById('modal-title').textContent = stname;
  const slotDt  = new Date(td_isodate);
  const slotEnd = new Date(slotDt.getTime() + 60*60*1000);
  document.getElementById('modal-slot-info').textContent =
    stmeta + '  ·  ' + fmtDateTime(slotDt) + ' – ' + pad2(slotEnd.getHours()) + ':' + pad2(slotEnd.getMinutes());

  const body = document.getElementById('modal-body');

  if (su) {
    // View only
    body.innerHTML = `
      <div class="taken-card">
        <div class="tc-callsign">${su.callsign}</div>
        <div class="tc-name">${su.name}</div>
        <div class="tc-email">${su.email}</div>
      </div>
      <p style="font-size:.8rem;color:var(--text-muted)">This slot is already claimed.</p>`;
  } else {
    body.innerHTML = `
      <form id="signup-form" onsubmit="return false">
        <div class="form-group">
          <label for="f-name">Full Name</label>
          <input type="text" id="f-name" placeholder="Jane Smith" autocomplete="name" required>
        </div>
        <div class="form-group">
          <label for="f-call">Callsign</label>
          <input type="text" id="f-call" class="callsign-input" placeholder="W1XYZ"
                 autocomplete="off" maxlength="10" required>
          <div class="form-error" id="err-call">Invalid callsign format</div>
        </div>
        <button class="btn-submit" id="btn-claim" type="button" onclick="submitClaim()">
          CLAIM THIS SLOT
        </button>
      </form>`;
    setTimeout(() => document.getElementById('f-name')?.focus(), 80);
  }

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  pending = null;
}


// ── Claim ──────────────────────────────────────────────────────────────────

async function submitClaim() {
  const name     = document.getElementById('f-name').value.trim();
  const callsign = document.getElementById('f-call').value.trim().toUpperCase();
  const email    = document.getElementById('f-email').value.trim();

  let valid = true;

  const callRe = /^[A-Z0-9\/]{3,10}$/;
  document.getElementById('err-call').classList.toggle('visible', !callRe.test(callsign));
  if (!callRe.test(callsign)) valid = false;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  document.getElementById('err-email').classList.toggle('visible', !emailRe.test(email));
  if (!emailRe.test(email)) valid = false;

  if (!valid || !name) return;

  const btn = document.getElementById('btn-claim');
  btn.disabled = true;
  btn.textContent = 'CLAIMING…';

  try {
    const res = await apiFetch(`?action=claim&event=${eventCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pending, name, callsign, email }),
    });

    if (!res.success) {
      showToast(res.error || 'Error claiming slot', 'error');
      btn.disabled = false;
      btn.textContent = 'CLAIM THIS SLOT';
      return;
    }

    signups[res.slot] = res.signup;
    renderCells();
    closeModal();
    showToast('Slot claimed! 73 de ' + callsign, 'success');
  } catch (e) {
    showToast('Network error. Try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'CLAIM THIS SLOT';
  }
}

// ── Events ─────────────────────────────────────────────────────────────────

function onCellClick(e) {
  const td = e.currentTarget;
  openModal(td.dataset.station, td.dataset.timeslot, td.dataset.stname, td.dataset.stmeta, td.dataset.slotdt);
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  const params = new URLSearchParams(window.location.search);
  let p_eventCode = params.get("event");
  try {

    if(p_eventCode != null){
      if(/^[A-Za-z0-9]+$/.test(p_eventCode)) {
        eventCode = p_eventCode;
      } else {
        alert("Invalid ?event=");
        return;
      }
    }

    const [cfgRes, suRes] = await Promise.all([
      apiFetch(`?action=config&event=${eventCode}`),
      apiFetch(`?action=signups&event=${eventCode}`),
    ]);

    config  = cfgRes.config;
    signups = suRes.signups || {};

    document.getElementById('event-name').textContent = config.event.name;
    const startDt = parseDateTime(config.schedule.start);
    const endDt   = parseDateTime(config.schedule.end);
    const tzDt = config.schedule.tz;
    document.getElementById('event-meta').textContent =
      fmtDateTime(startDt) + '  –  ' + fmtDateTime(endDt) + ' ' + tzDt;

    buildGrid();
  } catch (err) {
    document.getElementById('event-name').textContent = `Could not load configuration for event "${eventCode}"`;
    console.error(err);
    alert(`Check your config_${eventCode}.json`);
  }
}

window.addEventListener("load", () => {
  init();
});
