// /apps/OneNote.js — WWO Note (OneNote-style, upgraded)
// Works with your AppHost + AppRegistry as-is (no external deps)

const ICON_SVG =
  '<svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#7b1fa2"/>' +
      '<stop offset="100%" stop-color="#512da8"/>' +
    '</linearGradient></defs>' +
    '<rect x="6" y="6" width="36" height="36" rx="6" fill="url(#g)"/>' +
    '<rect x="11" y="11" width="26" height="26" rx="3" fill="#fff" opacity="0.12"/>' +
    '<text x="18" y="31" font-family="Segoe UI, system-ui, sans-serif" font-size="16" fill="#fff" font-weight="700">N</text>' +
  '</svg>';

const APP_ID = 'onenote';
const APP_NAME = 'OneNote';

const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();

export default {
  id: APP_ID,
  name: APP_NAME,
  icon: { type: 'svg', value: ICON_SVG },

  open(host) {
    // ---------- state ----------
    const store = host.storage(APP_ID);

    const defaultState = {
      notebooks: [{
        id: 'default',
        name: 'Personal',
        sections: [{
          id: 'sec-default',
          name: 'Quick Notes',
          pages: []
        }]
      }],
      active: { nb: 'default', sec: 'sec-default', page: null },
      lastSavedAt: null
    };

    // ---------- PURE HELPERS (no closure over `state`) ----------
    function getActiveNB(s) {
      return (s.notebooks || []).find(n => n.id === s.active?.nb) || null;
    }
    function getActiveSEC(s) {
      const nb = getActiveNB(s);
      return nb ? (nb.sections || []).find(sec => sec.id === s.active?.sec) || null : null;
    }
    function getActivePAGE(s) {
      const sec = getActiveSEC(s);
      return sec ? (sec.pages || []).find(p => p.id === s.active?.page) || null : null;
    }

    // ---------- normalize BEFORE `state` is created ----------
    function normalize(s) {
      if (!s || !Array.isArray(s.notebooks) || !s.notebooks.length) return { ...defaultState };

      // migrate old shapes if any
      s.notebooks.forEach(nb => {
        if (Array.isArray(nb.pages)) {
          // old format (notebooks -> pages), lift into one section
          nb.sections = [{ id: uid(), name: 'Imported', pages: nb.pages }];
          delete nb.pages;
        }
        nb.sections ||= [{ id: uid(), name: 'Section', pages: [] }];
        nb.sections.forEach(sec => { sec.pages ||= []; });
      });

      s.active ||= { nb: s.notebooks[0].id, sec: s.notebooks[0].sections[0].id, page: null };

      // guard active nb/sec
      if (!s.notebooks.find(n => n.id === s.active.nb)) s.active.nb = s.notebooks[0].id;
      if (!getActiveNB(s)?.sections.find(x => x.id === s.active.sec)) s.active.sec = getActiveNB(s).sections[0].id;

      // page can be null; if set but missing, clear it
      if (s.active.page && !getActivePAGE(s)) s.active.page = null;

      return s;
    }

    // create state (safe: uses pure helpers)
    const state = normalize(store.load(defaultState));

    // ---------- window ----------
    const win = host.createWindow({
      id: APP_ID,
      title: APP_NAME,
      width: 1120,
      height: 700,
      icon: { type: 'svg', value: ICON_SVG }
    });
    const root = win.contentEl;

    // ---------- UI ----------
    root.innerHTML = `
      <style>
        .one-root{display:flex;height:100%;font:14px/1.5 'Segoe UI',system-ui,sans-serif;color:#111}
        .one-col{display:flex;flex-direction:column;height:100%}
        .one-nb{width:220px;border-right:1px solid #e5e7eb;background:#fafafa}
        .one-sec{width:240px;border-right:1px solid #e5e7eb;background:#fdfdfd}
        .one-main{flex:1;min-width:0;background:#fff}
        .topbar{display:flex;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid #e5e7eb;background:#f8fafc}
        .btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #d1d5db;background:#fff;border-radius:8px;height:32px;padding:0 10px;cursor:pointer;font-weight:600}
        .btn:hover{background:#f3f4f6}
        .btn.danger{border-color:#ef4444;color:#ef4444;background:#fff}
        .btn.pill{border-radius:999px}
        .field{height:32px;border:1px solid #d1d5db;border-radius:8px;padding:0 10px;background:#fff}
        .list{flex:1;overflow:auto;padding:6px}
        .item{display:flex;gap:8px;align-items:center;padding:8px;border-radius:8px;cursor:pointer}
        .item:hover{background:#f3f4f6}
        .item.active{background:#111827;color:#fff}
        .meta{font-size:12px;color:#6b7280}
        .hdr{padding:10px;border-bottom:1px solid #e5e7eb;background:#fff;display:flex;gap:8px;align-items:center}
        .title{flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;font-size:18px}
        .tag{display:inline-flex;align-items:center;gap:6px;border:1px solid #d1d5db;border-radius:999px;height:26px;padding:0 10px;background:#fff;font-size:12px;margin-right:6px}
        .toolbar{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid #e5e7eb;padding:8px;background:#fafafa}
        .color{width:32px;height:32px;border:1px solid #d1d5db;border-radius:8px;padding:0;overflow:hidden}
        .editor-wrap{position:relative;display:flex;height:calc(100% - 138px)}
        .gutter{width:52px;flex:0 0 52px;background:#f9fafb;border-right:1px solid #e5e7eb;color:#6b7280;font:12px/1.6 ui-monospace,Consolas,monospace;padding:12px 8px 12px 10px;overflow:hidden;user-select:none}
        .g-line{height:1.6em}
        .scroll{flex:1;overflow:auto;position:relative}
        .editor{min-height:100%;outline:none;padding:18px 28px;line-height:1.6;font-size:15px}
        .editor img{max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.06)}
        .editor blockquote{border-left:4px solid #7c3aed;margin:8px 0;padding:6px 10px;background:#f6f0ff;border-radius:6px}
        .editor table{border-collapse:collapse}
        .editor td,.editor th{border:1px solid #ddd;padding:6px 8px}
        .drop{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(124,58,237,.08);border:2px dashed #7c3aed;color:#7c3aed;font-weight:800;font-size:18px;pointer-events:none}
        .status{display:flex;gap:10px;align-items:center;padding:8px 10px;border-top:1px solid #e5e7eb;color:#374151;font-size:12px;background:#fff}
        .dot{width:8px;height:8px;border-radius:50%;background:#22c55e}
        .saving .dot{background:#f59e0b}
        .pill-mini{border:1px solid #d1d5db;border-radius:999px;padding:2px 8px;font-size:11px;background:#fff;color:#374151}
        .search{display:flex;gap:6px;align-items:center;padding:8px 10px;border-bottom:1px solid #e5e7eb}
        .titlebar{display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid #e5e7eb}
        .ghost{opacity:.6}
      </style>

      <div class="one-root">
        <!-- Notebooks -->
        <div class="one-col one-nb">
          <div class="titlebar">
            <button id="nb-add" class="btn pill"><i class="fas fa-book"></i>New Notebook</button>
          </div>
          <div class="search">
            <input id="nb-search" class="field" placeholder="Search notebooks…">
          </div>
          <div id="nb-list" class="list"></div>
        </div>

        <!-- Sections -->
        <div class="one-col one-sec">
          <div class="titlebar">
            <button id="sec-add" class="btn pill"><i class="fas fa-folder"></i>New Section</button>
          </div>
          <div class="search">
            <input id="sec-search" class="field" placeholder="Search sections…">
          </div>
          <div id="sec-list" class="list"></div>
        </div>

        <!-- Pages + Editor -->
        <div class="one-col one-main">
          <div class="topbar">
            <button id="page-add" class="btn pill"><i class="fas fa-file"></i>New Page</button>
            <button id="page-del" class="btn danger"><i class="fas fa-trash"></i>Delete</button>
            <span class="pill-mini" id="crumb"></span>
            <span class="ghost pill-mini" id="lastSaved">—</span>
            <span style="margin-left:auto"></span>
            <input id="page-search" class="field" placeholder="Search pages…">
          </div>

          <div class="hdr">
            <input id="page-title" class="title" placeholder="Untitled page">
            <div id="tagbar"></div>
            <button id="tag-add" class="btn"><i class="fas fa-hashtag"></i>Tag</button>
            <select id="page-color" class="field" title="Page color">
              <option value="">Default</option>
              <option value="#fff7ed">Peach</option>
              <option value="#eef2ff">Indigo</option>
              <option value="#f0f9ff">Sky</option>
              <option value="#ecfeff">Cyan</option>
              <option value="#fdf4ff">Fuchsia</option>
              <option value="#f7fee7">Lime</option>
            </select>
          </div>

          <div class="toolbar">
            <button class="btn" data-cmd="bold"><i class="fas fa-bold"></i></button>
            <button class="btn" data-cmd="italic"><i class="fas fa-italic"></i></button>
            <button class="btn" data-cmd="underline"><i class="fas fa-underline"></i></button>
            <button class="btn" data-cmd="strikeThrough"><i class="fas fa-strikethrough"></i></button>
            <button class="btn" data-cmd="insertUnorderedList"><i class="fas fa-list-ul"></i></button>
            <button class="btn" data-cmd="insertOrderedList"><i class="fas fa-list-ol"></i></button>
            <button class="btn" id="chk-toggle"><i class="fas fa-check-square"></i> Checklist</button>
            <button class="btn" data-cmd="justifyLeft"><i class="fas fa-align-left"></i></button>
            <button class="btn" data-cmd="justifyCenter"><i class="fas fa-align-center"></i></button>
            <button class="btn" data-cmd="justifyRight"><i class="fas fa-align-right"></i></button>
            <button class="btn" id="link-add"><i class="fas fa-link"></i></button>
            <button class="btn" id="hr-add"><i class="fas fa-minus"></i></button>
            <button class="btn" id="quote-add"><i class="fas fa-quote-left"></i></button>
            <button class="btn" id="code-add"><i class="fas fa-code"></i></button>
            <button class="btn" id="table-add"><i class="fas fa-table"></i></button>
            <label class="btn" title="Insert image (upload)">
              <i class="fas fa-image"></i> Upload
              <input id="img-upload" type="file" accept="image/*" multiple style="display:none">
            </label>
            <button class="btn" id="img-url"><i class="fas fa-link"></i> Image URL</button>
            <input id="fore" class="color" type="color" title="Text color">
            <input id="back" class="color" type="color" title="Highlight">
            <select id="block" class="field" style="width:120px">
              <option value="p">Paragraph</option>
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="pre">Code block</option>
            </select>
            <select id="templates" class="field" style="width:160px" title="Insert template">
              <option value="">Insert template…</option>
              <option value="meeting">Meeting notes</option>
              <option value="todo">To-do list</option>
              <option value="decision">Decision log</option>
            </select>
            <button class="btn" id="export-html"><i class="fas fa-file-export"></i> Export</button>
            <button class="btn" id="print"><i class="fas fa-print"></i></button>
          </div>

          <div class="editor-wrap">
            <div class="gutter"><div id="g-inner"></div></div>
            <div class="scroll" id="scroll">
              <div id="editor" class="editor" contenteditable="true" spellcheck="true"></div>
              <div id="drop" class="drop">Drop images to insert</div>
            </div>
          </div>

          <div id="status" class="status">
            <span class="dot"></span>
            <span id="stat-text">Saved</span>
            <span style="opacity:.4">|</span>
            <span id="counts" class="ghost">0 words • 0 chars</span>
          </div>
        </div>
      </div>
    `;

    // ---------- refs ----------
    const $ = (sel) => root.querySelector(sel);
    const nbList = $('#nb-list');
    const secList = $('#sec-list');
    const pageSearch = $('#page-search');
    const nbSearch = $('#nb-search');
    const secSearch = $('#sec-search');
    const pageTitle = $('#page-title');
    const editor = $('#editor');
    const scroll = $('#scroll');
    const drop = $('#drop');
    const gInner = $('#g-inner');
    const statusEl = $('#status');
    const statText = $('#stat-text');
    const lastSavedEl = $('#lastSaved');
    const crumb = $('#crumb');
    const tagbar = $('#tagbar');

    // ---------- bound helpers (safe: after `state`) ----------
    const activeNB = () => getActiveNB(state);
    const activeSEC = () => getActiveSEC(state);
    const activePAGE = () => getActivePAGE(state);
let lnFrame = 0;
    // ---------- rendering ----------
 renderNotebookList();
renderSectionList();
ensureActiveExists();
renderPageList(); 
renderEditor();   // <-- calls scheduleGutter() here, but lnFrame not yet defined!
updateCrumb();
updateLastSaved();
updateCounts();
syncGutter();

    // ---------- events: notebooks ----------
    $('#nb-add').addEventListener('click', () => {
      const name = prompt('Notebook name:', 'New Notebook');
      if (!name) return;
      const nb = { id: uid(), name, sections: [{ id: uid(), name: 'Section 1', pages: [] }] };
      state.notebooks.push(nb);
      state.active.nb = nb.id;
      state.active.sec = nb.sections[0].id;
      state.active.page = null;
      save('Saved');
      renderNotebookList(); renderSectionList(); renderPageList(); renderEditor(); updateCrumb();
    });
    nbSearch.addEventListener('input', renderNotebookList);

    // ---------- events: sections ----------
    $('#sec-add').addEventListener('click', () => {
      const nb = activeNB(); if (!nb) return;
      const name = prompt('Section name:', 'New Section'); if (!name) return;
      const s = { id: uid(), name, pages: [] };
      nb.sections.push(s);
      state.active.sec = s.id;
      state.active.page = null;
      save('Saved');
      renderSectionList(); renderPageList(); renderEditor(); updateCrumb();
    });
    secSearch.addEventListener('input', renderSectionList);

    // ---------- events: pages ----------
    $('#page-add').addEventListener('click', () => {
      const sec = activeSEC(); if (!sec) return;
      const p = {
        id: uid(),
        title: 'Untitled',
        html: '',
        color: '',
        tags: [],
        created: nowISO(),
        updated: nowISO()
      };
      sec.pages.unshift(p);
      state.active.page = p.id;
      save('Saved');
      renderPageList(); renderEditor(); updateCrumb();
    });

    $('#page-del').addEventListener('click', () => {
      const sec = activeSEC(); const p = activePAGE();
      if (!sec || !p) return;
      if (!confirm(`Delete page "${p.title || 'Untitled'}"?`)) return;
      sec.pages = sec.pages.filter(x => x.id !== p.id);
      state.active.page = sec.pages[0]?.id || null;
      save('Saved');
      renderPageList(); renderEditor(); updateCrumb();
    });

    pageSearch.addEventListener('input', renderPageList);

    // ---------- editor wiring ----------
    pageTitle.addEventListener('input', () => {
      const p = activePAGE(); if (!p) return;
      p.title = pageTitle.value;
      p.updated = nowISO();
      scheduleSave();
      renderPageList();
    });

    root.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.execCommand(btn.dataset.cmd, false, null);
        editor.focus(); scheduleSave(); scheduleGutter(); updateCounts();
      });
    });
    $('#fore').addEventListener('input', e => { document.execCommand('foreColor', false, e.target.value); editor.focus(); scheduleSave(); });
    $('#back').addEventListener('input', e => {
      const ok = document.execCommand('hiliteColor', false, e.target.value);
      if (!ok) document.execCommand('backColor', false, e.target.value);
      editor.focus(); scheduleSave();
    });
    $('#block').addEventListener('change', e => {
      const v = e.target.value;
      if (v === 'p' || v === 'pre') document.execCommand('formatBlock', false, v);
      else document.execCommand('formatBlock', false, v.toUpperCase());
      editor.focus(); scheduleSave(); scheduleGutter();
    });

    $('#link-add').addEventListener('click', () => {
      const url = prompt('Link URL (https://...)', 'https://');
      if (!url) return;
      document.execCommand('createLink', false, url); editor.focus(); scheduleSave();
    });
    $('#hr-add').addEventListener('click', () => { document.execCommand('insertHorizontalRule'); editor.focus(); scheduleSave(); scheduleGutter(); });
    $('#quote-add').addEventListener('click', () => wrapSelectionWith('<blockquote>','</blockquote>'));
    $('#code-add').addEventListener('click', () => wrapSelectionWith('<pre><code>','</code></pre>'));
    $('#table-add').addEventListener('click', () => {
      const r = +prompt('Rows?', '2') || 2; const c = +prompt('Cols?', '2') || 2;
      const html = '<table>' + Array.from({length:r}).map(()=>'<tr>' + Array.from({length:c}).map(()=>'<td>&nbsp;</td>').join('') + '</tr>').join('') + '</table>';
      insertHTML(html); scheduleSave(); scheduleGutter();
    });

    $('#chk-toggle').addEventListener('click', () => {
      const html = getSelectedHTML() || '<p></p>';
      const lines = html
        .replace(/<\/(p|div|li)>/g,'</$1>\n')
        .replace(/<[^>]+>/g,'')
        .split('\n').map(s => s.trim()).filter(Boolean);
      if (!lines.length) return;
      const ul = '<ul>' + lines.map(t => `<li><input type="checkbox"> ${escapeHTML(t)}</li>`).join('') + '</ul>';
      insertHTML(ul); scheduleSave(); scheduleGutter();
    });

    $('#templates').addEventListener('change', (e) => {
      const val = e.target.value; if (!val) return;
      if (val === 'meeting') {
        insertHTML(`
          <h2>Meeting Notes</h2>
          <p><b>When:</b> … &nbsp; <b>Where:</b> … &nbsp; <b>Attendees:</b> …</p>
          <h3>Agenda</h3>
          <ul><li>Topic 1</li><li>Topic 2</li></ul>
          <h3>Notes</h3>
          <p>—</p>
          <h3>Action Items</h3>
          <ul><li><input type="checkbox"> Owner — task — due</li></ul>
        `);
      }
      if (val === 'todo') {
        insertHTML(`<h2>To-do</h2><ul><li><input type="checkbox"> First task</li><li><input type="checkbox"> Second task</li></ul>`);
      }
      if (val === 'decision') {
        insertHTML(`
          <h2>Decision Log</h2>
          <table><tr><th>Date</th><th>Context</th><th>Decision</th><th>Owner</th></tr>
          <tr><td>${new Date().toLocaleDateString()}</td><td>…</td><td>…</td><td>…</td></tr></table>
        `);
      }
      e.target.value = '';
      scheduleSave(); scheduleGutter();
    });

    $('#img-upload').addEventListener('change', async (e) => {
      const files = [...e.target.files||[]].filter(f => f.type.startsWith('image/'));
      for (const f of files) insertImage(await fileToDataURL(f));
      e.target.value = '';
      scheduleSave(); scheduleGutter();
    });
    $('#img-url').addEventListener('click', () => {
      const url = prompt('Image URL (https://...)'); if (!url) return;
      insertImage(url); scheduleSave(); scheduleGutter();
    });

    editor.addEventListener('paste', async (e) => {
      const items = [...(e.clipboardData?.items||[])].filter(i => i.type.startsWith('image/'));
      if (!items.length) return; e.preventDefault();
      for (const it of items) { const f = it.getAsFile(); if (f) insertImage(await fileToDataURL(f)); }
      scheduleSave(); scheduleGutter();
    });
    scroll.addEventListener('dragover', (e) => {
      if ([...e.dataTransfer.items].some(i => i.type.startsWith('image/'))) { e.preventDefault(); drop.style.display='flex'; }
    });
    scroll.addEventListener('dragleave', () => drop.style.display='none');
    scroll.addEventListener('drop', async (e) => {
      drop.style.display='none';
      const files = [...(e.dataTransfer?.files||[])].filter(f => f.type.startsWith('image/'));
      if (!files.length) return; e.preventDefault();
      for (const f of files) insertImage(await fileToDataURL(f));
      scheduleSave(); scheduleGutter();
    });

    $('#page-color').addEventListener('change', (e) => {
      const p = activePAGE(); if (!p) return;
      p.color = e.target.value || '';
      editor.style.background = p.color || '#fff';
      scheduleSave();
    });

    $('#tag-add').addEventListener('click', () => {
      const p = activePAGE(); if (!p) return;
      const t = prompt('Add tag (e.g., #project, #idea):', '');
      if (!t) return;
      (p.tags ||= []).push(t.replace(/^#*/,'#'));
      renderTags(); scheduleSave();
    });

    let saveTimer;
    editor.addEventListener('input', () => {
      const p = activePAGE(); if (!p) return;
      p.html = editor.innerHTML; p.updated = nowISO();
      setSaving();
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => save('Saved'), 400);
      scheduleGutter(); updateCounts();
    });

    win.el.addEventListener('keydown', (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k==='b') { e.preventDefault(); document.execCommand('bold'); }
      if (k==='i') { e.preventDefault(); document.execCommand('italic'); }
      if (k==='u') { e.preventDefault(); document.execCommand('underline'); }
      if (k==='s') { e.preventDefault(); save('Saved'); }
    });

    win.onClose(() => save('Saved'));

    // ---------- functions ----------
    function renderNotebookList() {
      const q = nbSearch.value?.toLowerCase().trim() || '';
      nbList.innerHTML = '';
      state.notebooks
        .filter(n => !q || n.name.toLowerCase().includes(q))
        .forEach(n => {
          const el = document.createElement('div');
          el.className = 'item' + (n.id===state.active.nb?' active':'');
          el.innerHTML = `<i class="fas fa-book"></i><div>${escapeHTML(n.name)}</div>`;
          el.addEventListener('click', () => {
            state.active.nb = n.id;
            state.active.sec = n.sections[0]?.id || null;
            state.active.page = null;
            saveSoft();
            renderNotebookList(); renderSectionList(); renderPageList(); renderEditor(); updateCrumb();
          });
          nbList.appendChild(el);
        });
    }

    function renderSectionList() {
      const nb = activeNB(); if (!nb) { secList.innerHTML=''; return; }
      const q = secSearch.value?.toLowerCase().trim() || '';
      secList.innerHTML = '';
      nb.sections
        .filter(s => !q || s.name.toLowerCase().includes(q))
        .forEach(s => {
          const el = document.createElement('div');
          el.className = 'item' + (s.id===state.active.sec?' active':'');
          el.innerHTML = `<i class="fas fa-folder"></i><div>${escapeHTML(s.name)}</div>`;
          el.addEventListener('click', () => {
            state.active.sec = s.id;
            state.active.page = activeSEC()?.pages[0]?.id || null;
            saveSoft();
            renderSectionList(); renderPageList(); renderEditor(); updateCrumb();
          });
          el.addEventListener('dblclick', () => {
            const name = prompt('Rename section:', s.name); if (!name) return;
            s.name = name; save('Saved'); renderSectionList(); updateCrumb();
          });
          secList.appendChild(el);
        });
    }

    function renderPageList() {
      const sec = activeSEC();
      const listHost = ensurePageSideList();
      const q = pageSearch.value?.toLowerCase().trim() || '';
      listHost.innerHTML = '';
      (sec?.pages || [])
        .filter(p => {
          if (!q) return true;
          return (p.title||'').toLowerCase().includes(q) || (p.html||'').toLowerCase().includes(q);
        })
        .forEach(p => {
          const el = document.createElement('div');
          el.className = 'item' + (p.id===state.active.page?' active':'');
          el.innerHTML = `
            <i class="fas fa-file"></i>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(p.title||'Untitled')}</div>
              <div class="meta">${new Date(p.updated||p.created||nowISO()).toLocaleString()}</div>
            </div>
          `;
          el.addEventListener('click', () => {
            state.active.page = p.id; saveSoft(); renderPageList(); renderEditor(); updateCrumb();
          });
          el.addEventListener('dblclick', () => {
            const name = prompt('Rename page:', p.title||'Untitled'); if (!name) return;
            p.title = name; p.updated = nowISO(); save('Saved'); renderPageList(); renderEditor();
          });
          listHost.appendChild(el);
        });
    }

    function ensurePageSideList() {
      let cont = root.querySelector('#page-list');
      if (cont) return cont;
      const secCol = root.querySelector('.one-sec');
      const wrapper = document.createElement('div');
      wrapper.style.borderTop = '1px solid #e5e7eb';
      wrapper.innerHTML = `
        <div class="titlebar" style="justify-content:space-between">
          <div class="ghost">Pages</div>
          <div>
            <button id="page-up" class="btn"><i class="fas fa-arrow-up"></i></button>
            <button id="page-down" class="btn"><i class="fas fa-arrow-down"></i></button>
          </div>
        </div>
        <div id="page-list" class="list"></div>
      `;
      secCol.appendChild(wrapper);

      wrapper.querySelector('#page-up').addEventListener('click', () => movePage(-1));
      wrapper.querySelector('#page-down').addEventListener('click', () => movePage(1));

      return wrapper.querySelector('#page-list');
    }

    function movePage(delta) {
      const sec = activeSEC(); const id = state.active.page;
      if (!sec || !id) return;
      const idx = sec.pages.findIndex(p => p.id === id);
      const j = idx + delta;
      if (idx < 0 || j < 0 || j >= sec.pages.length) return;
      const [pg] = sec.pages.splice(idx,1);
      sec.pages.splice(j,0,pg);
      save('Saved'); renderPageList();
    }

    function renderEditor() {
      const p = activePAGE();
      if (!p) {
        pageTitle.value = '';
        editor.innerHTML = '';
        editor.contentEditable = 'false';
        $('#page-del').disabled = true;
        editor.style.background = '#fff';
        tagbar.innerHTML = '';
        return;
      }
      $('#page-del').disabled = false;
      editor.contentEditable = 'true';
      pageTitle.value = p.title || '';
      editor.innerHTML = p.html || '';
      editor.style.background = p.color || '#fff';
      renderTags();
      scheduleGutter();
      updateCounts();
    }

    function renderTags() {
      const p = activePAGE(); tagbar.innerHTML = '';
      (p?.tags || []).forEach((t, idx) => {
        const el = document.createElement('span');
        el.className = 'tag';
        el.innerHTML = `<i class="fas fa-hashtag"></i> ${escapeHTML(t)} <i data-i="${idx}" class="fas fa-times" style="cursor:pointer;opacity:.7"></i>`;
        el.querySelector('.fa-times').addEventListener('click', () => {
          p.tags.splice(idx,1); save('Saved'); renderTags();
        });
        tagbar.appendChild(el);
      });
    }

    function updateCrumb() {
      const nb = activeNB(), s = activeSEC(), p = activePAGE();
      crumb.textContent = [nb?.name, s?.name, p?.title || '—'].filter(Boolean).join(' / ');
    }

    // ---------- saving ----------
    function setSaving() { statusEl.classList.add('saving'); statText.textContent = 'Saving…'; }
    function save(text='Saved') {
      const p = activePAGE(); if (p) p.updated = nowISO();
      store.save(state);
      statusEl.classList.remove('saving');
      statText.textContent = text;
      state.lastSavedAt = nowISO();
      updateLastSaved();
    }
    function saveSoft() {
      store.save(state); statText.textContent = 'Saved';
    }
    function scheduleSave() {
      setSaving();
      clearTimeout(scheduleSave._t);
      scheduleSave._t = setTimeout(() => save('Saved'), 300);
    }
    function updateLastSaved() {
      const el = document.getElementById('lastSaved');
      if (el) {
        el.textContent = state.lastSavedAt
          ? new Date(state.lastSavedAt).toLocaleString()
          : '—';
      }
    }

    // ---------- gutter (line numbers) ----------

function scheduleGutter() { 
  cancelAnimationFrame(lnFrame); 
  lnFrame = requestAnimationFrame(syncGutter); 
}
function syncGutter() {
  const text = (editor.innerText || '').replace(/\r/g,'');
  const count = Math.max(1, text.split('\n').length);
  const lineH = getLineHeight(editor) || 24;

  const frag = document.createDocumentFragment();
  for (let i = 1; i <= count; i++) {
    const d = document.createElement('div');
    d.className = 'g-line';
    d.style.height = lineH + 'px';
    d.textContent = i;
    frag.appendChild(d);
  }
  gInner.innerHTML = '';
  gInner.appendChild(frag);

  // keep gutter aligned with scroll
  gInner.parentElement.style.transform = `translateY(${-scroll.scrollTop}px)`;
}

// keep existing listeners right after these functions:
scroll.addEventListener('scroll', () => {
  gInner.parentElement.style.transform = `translateY(${-scroll.scrollTop}px)`;
});
const mo = new MutationObserver(scheduleGutter);
mo.observe(editor, { childList:true, subtree:true, characterData:true });

function getLineHeight(el) {
  const cs = getComputedStyle(el);
  const lh = cs.lineHeight;
  if (lh.endsWith('px')) return parseFloat(lh);
  const span = document.createElement('span');
  span.textContent = 'A';
  el.appendChild(span);
  const h = span.getBoundingClientRect().height;
  el.removeChild(span);
  return h || 24;
}

    // ---------- counts ----------
    function updateCounts() {
      const txt = (editor.innerText||'').replace(/\s+/g,' ').trim();
      const words = txt ? txt.split(' ').length : 0;
      const chars = (editor.textContent||'').length;
      $('#counts').textContent = `${words} words • ${chars} chars`;
    }

    // ---------- DOM tools ----------
    function insertHTML(html) {
      document.execCommand('insertHTML', false, html);
      editor.focus();
    }
    function wrapSelectionWith(before, after) {
      const html = getSelectedHTML();
      if (html) insertHTML(before + html + after);
      else insertHTML(before + '&nbsp;' + after);
      scheduleSave();
    }
    function getSelectedHTML() {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return '';
      const frag = sel.getRangeAt(0).cloneContents();
      const div = document.createElement('div'); div.appendChild(frag);
      return div.innerHTML;
    }
    function insertImage(src) {
      const img = document.createElement('img'); img.src = src; img.alt = 'image';
      placeAtCursor(img);
    }
    function placeAtCursor(node) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents(); range.insertNode(node);
        range.setStartAfter(node); range.collapse(true);
        sel.removeAllRanges(); sel.addRange(range);
      } else { editor.appendChild(node); }
    }
    function fileToDataURL(file) {
      return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
    }

    function ensureActiveExists() {
      const nb = activeNB(); if (!nb) { state.active.nb = state.notebooks[0].id; }
      const sec = activeSEC(); if (!sec) { state.active.sec = activeNB().sections[0].id; }
      const p = activePAGE(); if (!p && activeSEC().pages.length) state.active.page = activeSEC().pages[0].id;
    }

    // tiny util
    function escapeHTML(s=''){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  }
};
