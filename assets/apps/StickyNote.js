const APP_ID = 'stickynote';
const APP_NAME = 'Sticky Notes';

function makeAppDef() {
  const STORAGE = `APP_${APP_ID}`;
  const DESKTOP_SEL = '.desktop';
  const NOTE_CLASS = 'sn-note';
  const TRAY_BTN_ID = 'sticky-tray-btn';
  const TRAY_MENU_ID = 'sticky-tray-menu';

  injectOnce('sn-styles', `
    .${NOTE_CLASS}{
      position:absolute; width:220px; min-height:160px;
      background:#fff8a6; color:#333; border-radius:10px;
      box-shadow:0 8px 22px rgba(0,0,0,.25);
      border:1px solid rgba(0,0,0,.08);
      display:flex; flex-direction:column; overflow:hidden; z-index:9;
    }
    .${NOTE_CLASS}.dragging{ opacity:.9; cursor:grabbing; }
    .sn-head{
      height:28px; display:flex; align-items:center; justify-content:space-between;
      padding:0 8px; background:linear-gradient(180deg,#fff3a0,#ffe979);
      border-bottom:1px solid rgba(0,0,0,.06); cursor:grab; user-select:none;
      font:600 12px/1 'Segoe UI',system-ui,sans-serif; color:#5b4e00;
    }
    .sn-close{
      width:18px; height:18px; border-radius:4px; display:inline-flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,.08); cursor:pointer; transition:background .15s;
    }
    .sn-close:hover{ background:rgba(0,0,0,.18); }
    .sn-body{
      flex:1; padding:10px; outline:none; font:14px/1.35 'Segoe UI',system-ui,sans-serif;
      white-space:pre-wrap; overflow:auto;
    }
    #${TRAY_BTN_ID}{
      width:26px; height:26px; border:none; border-radius:50%;
      background:rgba(255,255,255,.12); margin-left:6px; display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:#7b5c00;
    }
    #${TRAY_BTN_ID}:hover{ background:#fff2c0; color:#5b4e00; }
    #${TRAY_MENU_ID}{
      position:fixed; display:none; z-index:3000;
      background:rgba(40,40,40,.98); color:#eee; border:1px solid rgba(255,255,255,.12);
      border-radius:10px; padding:6px; box-shadow:0 10px 30px rgba(0,0,0,.35); min-width:180px;
    }
    .sn-menu-item{padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13px;}
    .sn-menu-item:hover{background:rgba(255,255,255,.08);}
  `);

  // storage
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE);
      return raw ? JSON.parse(raw) : { notes: [], hidden: false, nextId: 1 };
    } catch { return { notes: [], hidden: false, nextId: 1 }; }
  }
  function saveStore(s) { localStorage.setItem(STORAGE, JSON.stringify(s)); }

  // dom helpers
  const qs = (s, r=document)=>r.querySelector(s);
  const ce = (t, a={})=>Object.assign(document.createElement(t), a);

  // ----- render -----
  function renderAll() {
    const desktop = qs(DESKTOP_SEL); if (!desktop) return;
    desktop.querySelectorAll(`.${NOTE_CLASS}`).forEach(n => n.remove());
    const s = loadStore();
    if (s.hidden || s.notes.length === 0) return;
    s.notes.forEach(n => desktop.appendChild(renderNote(n)));
  }

  function renderNote(model) {
    const n = ce('div'); n.className = NOTE_CLASS; n.dataset.id = model.id;
    n.style.left = model.x + 'px'; n.style.top = model.y + 'px';
    if (model.w) n.style.width = model.w + 'px';
    if (model.h) n.style.height = model.h + 'px';

    const head = ce('div'); head.className = 'sn-head'; head.textContent = 'Note';
    const close = ce('div'); close.className = 'sn-close'; close.innerHTML = '&times;';
    head.appendChild(close);

    const body = ce('div'); body.className = 'sn-body'; body.contentEditable = 'true';
    body.spellcheck = false; body.innerHTML = model.content || '';

    // drag
    let drag = { active:false, dx:0, dy:0 };
    head.addEventListener('mousedown', (e) => {
      drag.active = true; n.classList.add('dragging');
      const rect = n.getBoundingClientRect();
      drag.dx = e.clientX - rect.left; drag.dy = e.clientY - rect.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!drag.active) return;
      const desktopRect = qs(DESKTOP_SEL).getBoundingClientRect();
      let x = e.clientX - desktopRect.left - drag.dx;
      let y = e.clientY - desktopRect.top - drag.dy;
      x = Math.max(0, Math.min(desktopRect.width - n.offsetWidth, x));
      y = Math.max(0, Math.min(desktopRect.height - 48 - n.offsetHeight, y));
      n.style.left = x + 'px'; n.style.top = y + 'px';
    });
    document.addEventListener('mouseup', () => {
      if (!drag.active) return;
      drag.active = false; n.classList.remove('dragging'); persistFromDOM(n);
    });

    // delete
    close.addEventListener('click', () => {
      const s = loadStore();
      s.notes = s.notes.filter(x => x.id !== model.id);
      saveStore(s);
      n.remove();
      syncTray(); // drop tray icon if last note gone
    });

    // edit (debounced)
    let t;
    body.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => persistFromDOM(n), 200);
    });

    // resize
    n.style.resize = 'both'; n.style.overflow = 'auto';
    n.addEventListener('mouseup', () => persistFromDOM(n));

    n.appendChild(head); n.appendChild(body);
    return n;
  }

  function persistFromDOM(noteEl) {
    const id = Number(noteEl.dataset.id);
    const s = loadStore();
    const r = noteEl.getBoundingClientRect();
    const d = qs(DESKTOP_SEL).getBoundingClientRect();
    const body = noteEl.querySelector('.sn-body');
    const idx = s.notes.findIndex(n => n.id === id);
    const next = {
      id,
      x: Math.round(r.left - d.left),
      y: Math.round(r.top - d.top),
      w: Math.round(r.width),
      h: Math.round(r.height),
      content: body.innerHTML
    };
    if (idx >= 0) s.notes[idx] = next; else s.notes.push(next);
    saveStore(s);
  }

  function computeNewNotePosition(noteW = 220, noteH = 180) {
    const deskRect = qs(DESKTOP_SEL).getBoundingClientRect();
    const taskRect = qs('#taskbar').getBoundingClientRect();
    const gap = 8;

    const btn = document.getElementById(TRAY_BTN_ID);
    let left;
    if (btn) {
      const br = btn.getBoundingClientRect();
      left = br.left + (br.width / 2) - (noteW / 2) - deskRect.left;
    } else {
      const trayRect = qs('.system-tray').getBoundingClientRect();
      left = trayRect.right - noteW - 12 - deskRect.left;
    }
    left = Math.max(8, Math.min(left, deskRect.width - noteW - 8));
    const y = taskRect.top - noteH - gap - deskRect.top;
    const yClamped = Math.max(8, Math.min(y, deskRect.height - noteH - 48));
    return { x: Math.round(left), y: Math.round(yClamped) };
  }

  function newNote(opts = {}) {
    const s = loadStore();
    const id = s.nextId++;
    const w = 220, h = 180;

    const model = { id, x:0, y:0, w, h, content: opts.content || '' };
    s.notes.push(model);
    saveStore(s);

    syncTray(); // ensure tray icon exists now that we have notes

    const pos = (opts.x != null && opts.y != null) ? { x:opts.x, y:opts.y } : computeNewNotePosition(w, h);
    const s2 = loadStore();
    const idx = s2.notes.findIndex(n => n.id === id);
    if (idx >= 0) { s2.notes[idx].x = pos.x; s2.notes[idx].y = pos.y; saveStore(s2); }

    if (!s2.hidden) {
      const desktop = qs(DESKTOP_SEL);
      desktop.appendChild(renderNote(s2.notes[idx]));
    }
  }

  function showAll(){ const s = loadStore(); if (s.hidden){ s.hidden=false; saveStore(s); } renderAll(); syncTray(); }
  function hideAll(){ const s = loadStore(); if (!s.hidden){ s.hidden=true; saveStore(s); } renderAll(); syncTray(); }

  // ----- tray (exists only if notes exist) -----
  function initTrayInteractions(btn, menu) {
    function positionMenu() {
      const r = btn.getBoundingClientRect();
      menu.style.display = 'block';
      menu.style.left = (r.right - menu.offsetWidth) + 'px';
      menu.style.top  = (r.top - menu.offsetHeight - 6) + 'px';
      if (r.top - menu.offsetHeight - 6 < 0) menu.style.top = (r.bottom + 6) + 'px';
    }
    let open = false;
    const outside = (e)=>{ if(!menu.contains(e.target) && e.target!==btn){ open=false; menu.style.display='none'; document.removeEventListener('mousedown', outside, true);} };

    btn.addEventListener('click', () => {
      if (open) { open=false; menu.style.display='none'; document.removeEventListener('mousedown', outside, true); return; }
      const s = loadStore();
      menu.innerHTML = `
        <div class="sn-menu-item" data-cmd="toggle">${s.hidden ? 'Show notes' : 'Hide notes'}</div>
        <div class="sn-menu-item" data-cmd="new">New note</div>
      `;
      open = true; positionMenu(); setTimeout(()=>document.addEventListener('mousedown', outside, true),0);
    });

    menu.addEventListener('click', e => {
      const item = e.target.closest('.sn-menu-item'); if (!item) return;
      const cmd = item.dataset.cmd;
      if (cmd==='toggle'){ const s = loadStore(); s.hidden ? showAll() : hideAll(); }
      if (cmd==='new'){ showAll(); newNote(); }
      open=false; menu.style.display='none'; document.removeEventListener('mousedown', outside, true);
    });
  }

  function syncTray() {
    const tray = qs('.system-tray');
    if (!tray) return;

    const s = loadStore();
    const hasNotes = s.notes.length > 0;

    const btn = document.getElementById(TRAY_BTN_ID);
    const menu = document.getElementById(TRAY_MENU_ID);

    if (!hasNotes) {
      if (btn) btn.remove();
      if (menu) menu.remove();
      return;
    }

    let tbtn = btn;
    if (!tbtn) {
      tbtn = ce('button', { id: TRAY_BTN_ID, title: 'Sticky Notes' });
      tbtn.innerHTML = '<i class="far fa-sticky-note"></i>';
      tray.appendChild(tbtn);
    }

    let tmenu = menu;
    if (!tmenu) {
      tmenu = ce('div', { id: TRAY_MENU_ID });
      document.body.appendChild(tmenu);
      initTrayInteractions(tbtn, tmenu);
    }
  }

  // ----- robust boot: run now if ready; otherwise wait, and also wait for tray insertion -----
  boot();

  function boot() {
    const start = () => onDesktopReady(() => { syncTray(); renderAll(); });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once:true });
    } else {
      start(); // DOM already ready (your case on refresh)
    }
  }

  // Wait until .system-tray exists (in case your desktop/taskbar is mounted after scripts run)
  function onDesktopReady(cb) {
    if (qs('.system-tray')) { cb(); return; }
    const mo = new MutationObserver(() => {
      if (qs('.system-tray')) { mo.disconnect(); cb(); }
    });
    mo.observe(document.body, { childList:true, subtree:true });
  }

  // ---- App window (optional helper) ----
  return {
    id: APP_ID,
    name: APP_NAME,
    icon: { type: 'fa', value: 'far fa-sticky-note' },
    open(host) {
      const win = host.createWindow({
        id: APP_ID, title: APP_NAME, width: 360, height: 260,
        icon: { type:'fa', value:'far fa-sticky-note'}
      });
      const root = win.contentEl;
      root.innerHTML = `
        <div style="padding:14px;font:14px 'Segoe UI',system-ui,sans-serif; color:#222">
          <div style="margin-bottom:10px; font-weight:600;">Sticky Notes</div>
          <div style="margin-bottom:8px">Tray (<i class="far fa-sticky-note"></i>) → <em>New note</em> / <em>Show/Hide</em>.</div>
          <div style="margin-bottom:8px">Drag by header, edit inline, × to delete. Autosaves to <code>localStorage</code>.</div>
          <div style="margin-top:12px">
            <button id="sn-new" style="padding:6px 10px;border:none;border-radius:6px;background:#ffd44d;cursor:pointer">New note</button>
            <button id="sn-show" style="padding:6px 10px;border:none;border-radius:6px;margin-left:6px;background:#e6f0fa;cursor:pointer">Show</button>
            <button id="sn-hide" style="padding:6px 10px;border:none;border-radius:6px;margin-left:6px;background:#f3e8ff;cursor:pointer">Hide</button>
          </div>
        </div>`;
      root.querySelector('#sn-new').onclick  = () => { showAll(); newNote(); };
      root.querySelector('#sn-show').onclick = showAll;
      root.querySelector('#sn-hide').onclick = hideAll;

      // make sure tray/notes visible even if app opened very early
      onDesktopReady(() => { syncTray(); renderAll(); });
    }
  };

  function injectOnce(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s);
  }
}

export default makeAppDef();
