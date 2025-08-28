const APP_ID = 'taskmanager';
const APP_NAME = 'Task Mgr.';

function makeAppDef() {
  // ---------- Utilities (declared first to avoid any hoist/bundler quirks) ----------
  function injectOnce(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id; s.textContent = css; document.head.appendChild(s);
  }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function ce(tag, props) { const el = document.createElement(tag); if (props) Object.assign(el, props); return el; }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);
    });
  }

  // window ops: use your globals if present, fall back to DOM tweaks
  function bringToFront(w) {
    if (typeof window.bringToFront === 'function') { window.bringToFront(w); return; }
    window.zIndex = (window.zIndex || 10) + 1;
    w.style.zIndex = String(window.zIndex);
  }
  function minimize(w) {
    if (typeof window.minimizeWindow === 'function') { window.minimizeWindow(w); return; }
    w.style.display = 'none';
  }
  function restore(w) {
    w.style.display = 'flex';
    bringToFront(w);
  }
  function toggleMaximize(w) {
    if (typeof window.toggleMaximizeWindow === 'function') { window.toggleMaximizeWindow(w); return; }
    if (w.classList.contains('maximized')) w.classList.remove('maximized'); else w.classList.add('maximized');
  }
  function closeWin(w) {
    if (typeof window.closeWindow === 'function') { window.closeWindow(w); return; }
    w.remove();
  }

  function getAllDesktopWindows() {
    // collect windows
    var desktop = qs('.desktop') || document.body;
    var wins = qsa('.window', desktop);
    var deskRect = desktop.getBoundingClientRect ? desktop.getBoundingClientRect() : { left:0, top:0 };

    return wins.map(function(w){
      var rect = w.getBoundingClientRect ? w.getBoundingClientRect() : {left:0, top:0, width:w.offsetWidth||0, height:w.offsetHeight||0};
      var style = window.getComputedStyle ? window.getComputedStyle(w) : { display:'', zIndex:'0' };
      var titleEl = w.querySelector('.window-title');
      var rawTitle = titleEl ? titleEl.textContent : '';
      var id = w.id || '';
      var appId = w.getAttribute('data-app') || '';
      var isMin = style.display === 'none';
      var isMax = w.classList ? w.classList.contains('maximized') : false;
      var z = parseInt(style.zIndex || '0', 10) || 0;
      var frames = qsa('iframe', w).length;
      var kind = id.indexOf('builtin-') === 0 ? 'Built-in' : (id.indexOf('custom-') === 0 ? 'Custom' : 'Other');

      return {
        id: id,
        appId: appId,
        el: w,
        title: rawTitle ? rawTitle.trim() : '(untitled)',
        kind: kind,
        state: isMin ? 'Minimized' : (isMax ? 'Maximized' : 'Normal'),
        x: Math.round(rect.left - deskRect.left),
        y: Math.round(rect.top - deskRect.top),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        z: z,
        frames: frames
      };
    });
  }

  function filterRows(rows, term) {
    term = (term || '').toLowerCase();
    if (!term) return rows;
    return rows.filter(function(r){
      return (r.title.toLowerCase().indexOf(term) >= 0) ||
             (r.appId.toLowerCase().indexOf(term) >= 0) ||
             (r.kind.toLowerCase().indexOf(term) >= 0) ||
             (r.state.toLowerCase().indexOf(term) >= 0);
    });
  }

  // ---------- Styles ----------
  injectOnce('tm-styles', [
    '.tm-wrap{height:100%;display:flex;flex-direction:column;background:#fff;color:#111;',
    "font:14px/1.35 'Segoe UI',system-ui,sans-serif;}",
    '.tm-toolbar{display:flex;gap:8px;align-items:center;padding:10px;border-bottom:1px solid #e6e6e6;background:#fafafa;}',
    '.tm-toolbar .tm-title{font-weight:600;margin-right:auto;color:#222;}',
    '.tm-toolbar input[type="text"]{width:240px;padding:6px 10px;border:1px solid #d0d7de;border-radius:6px;}',
    '.tm-btn{padding:6px 10px;border:1px solid #d0d7de;background:#fff;border-radius:6px;cursor:pointer;}',
    '.tm-btn:hover{background:#f6f8fa;}',
    '.tm-btn[disabled]{opacity:.5;cursor:default;}',
    '.tm-badge{font-size:12px;padding:2px 6px;border-radius:12px;border:1px solid #d0d7de;background:#f6f8fa;color:#444;}',
    '.tm-body{flex:1;overflow:auto;}',
    '.tm-table{width:100%;border-collapse:separate;border-spacing:0;}',
    '.tm-table thead th{position:sticky;top:0;background:#f3f4f6;text-align:left;font-weight:600;font-size:12px;color:#444;padding:8px 10px;border-bottom:1px solid #e6e6e6;}',
    '.tm-table tbody td{padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#222;}',
    '.tm-row{cursor:pointer;}',
    '.tm-row:hover{background:#f8fafc;}',
    '.tm-row.tm-selected{background:#e6f0fa;}',
    '.tm-muted{color:#777;}',
    '.tm-state-pill{font-size:11px;padding:2px 6px;border-radius:10px;border:1px solid rgba(0,0,0,0.08);background:#eef2ff;color:#334155;}',
    '.tm-state-pill.min{background:#fff7ed;color:#7c2d12;}',
    '.tm-state-pill.max{background:#ecfeff;color:#155e75;}',
    '.tm-foot{padding:8px 10px;border-top:1px solid #e6e6e6;display:flex;gap:12px;align-items:center;background:#fafafa;}'
  ].join(''));

  // ---------- App Definition ----------
  return {
    id: APP_ID,
    name: APP_NAME,
    icon: { type:'fa', value:'fas fa-tasks' },
    open: function(host) {
      // Create window FIRST; if anything below throws, at least a window exists
      var win = host.createWindow({
        id: APP_ID,
        title: APP_NAME,
        width: 820,
        height: 520,
        icon: { type:'fa', value:'fas fa-tasks' }
      });

      var root = win.contentEl;
      root.innerHTML =
        '<div class="tm-wrap">' +
          '<div class="tm-toolbar">' +
            '<div class="tm-title">Windows</div>' +
            '<input id="tm-filter" type="text" placeholder="Filter by name, app id, state…">' +
            '<button id="tm-refresh" class="tm-btn">Refresh</button>' +
            '<span id="tm-count" class="tm-badge">0 tasks</span>' +
          '</div>' +
          '<div class="tm-body">' +
            '<table class="tm-table">' +
              '<thead><tr>' +
                '<th style="width:28px;"></th>' +
                '<th>Title</th><th>App ID</th><th>Type</th><th>State</th>' +
                '<th>Pos</th><th>Size</th><th>Z</th><th>Iframes</th>' +
              '</tr></thead>' +
              '<tbody id="tm-tbody"></tbody>' +
            '</table>' +
          '</div>' +
          '<div class="tm-foot">' +
            '<button id="tm-bring" class="tm-btn" disabled>Bring to front</button>' +
            '<button id="tm-min" class="tm-btn" disabled>Minimize</button>' +
            '<button id="tm-rest" class="tm-btn" disabled>Restore</button>' +
            '<button id="tm-max" class="tm-btn" disabled>Maximize/Restore</button>' +
            '<button id="tm-end" class="tm-btn" disabled style="border-color:#dc2626;color:#dc2626;">End task</button>' +
          '</div>' +
        '</div>';

      var els = {
        tbody: qs('#tm-tbody', root),
        filter: qs('#tm-filter', root),
        refresh: qs('#tm-refresh', root),
        count: qs('#tm-count', root),
        btnBring: qs('#tm-bring', root),
        btnMin: qs('#tm-min', root),
        btnRest: qs('#tm-rest', root),
        btnMax: qs('#tm-max', root),
        btnEnd: qs('#tm-end', root)
      };

      var selectedId = null;
      var lastRows = [];

      function fmtPos(r){ return r.x + ',' + r.y; }
      function fmtSize(r){ return r.w + '×' + r.h; }

      function render() {
        try {
          var all = getAllDesktopWindows();
          lastRows = filterRows(all, els.filter.value);
          var html = '';
          for (var i=0;i<lastRows.length;i++){
            var r = lastRows[i];
            html += '<tr class="tm-row' + (r.id===selectedId?' tm-selected':'') + '" data-id="' + escapeHtml(r.id) + '">' +
              '<td>' + (r.id===selectedId?'•':'') + '</td>' +
              '<td>' + escapeHtml(r.title) + '</td>' +
              '<td class="tm-muted">' + escapeHtml(r.appId) + '</td>' +
              '<td class="tm-muted">' + escapeHtml(r.kind) + '</td>' +
              '<td><span class="tm-state-pill ' + (r.state==='Minimized'?'min':(r.state==='Maximized'?'max':'')) + '">' + r.state + '</span></td>' +
              '<td class="tm-muted">' + fmtPos(r) + '</td>' +
              '<td class="tm-muted">' + fmtSize(r) + '</td>' +
              '<td class="tm-muted">' + r.z + '</td>' +
              '<td class="tm-muted">' + r.frames + '</td>' +
            '</tr>';
          }
          els.tbody.innerHTML = html;
          els.count.textContent = lastRows.length + ' task' + (lastRows.length===1?'':'s');

          // bind row events
          var rows = qsa('tr.tm-row', els.tbody);
          for (var j=0;j<rows.length;j++){
            rows[j].onclick = function(){
              selectedId = this.getAttribute('data-id');
              render(); // repaint selection dot
              updateButtons();
            };
            rows[j].ondblclick = function(){
              var rid = this.getAttribute('data-id');
              var r = null; for (var k=0;k<lastRows.length;k++){ if (lastRows[k].id===rid) { r = lastRows[k]; break; } }
              if (!r) return;
              restore(r.el);
            };
          }

          updateButtons();
        } catch (e) {
          console.error('TaskManager render error:', e);
        }
      }

      function getSelected() {
        if (!selectedId) return null;
        var all = getAllDesktopWindows();
        for (var i=0;i<all.length;i++) if (all[i].id===selectedId) return all[i];
        return null;
      }

      function updateButtons() {
        var r = getSelected();
        var has = !!r;
        els.btnBring.disabled = !has;
        els.btnMin.disabled   = !has || r.state === 'Minimized';
        els.btnRest.disabled  = !has || r.state !== 'Minimized';
        els.btnMax.disabled   = !has;
        els.btnEnd.disabled   = !has;
      }

      // actions
      els.btnBring.onclick = function(){ var r=getSelected(); if(!r) return; restore(r.el); bringToFront(r.el); render(); };
      els.btnMin.onclick   = function(){ var r=getSelected(); if(!r) return; minimize(r.el); render(); };
      els.btnRest.onclick  = function(){ var r=getSelected(); if(!r) return; restore(r.el); render(); };
      els.btnMax.onclick   = function(){ var r=getSelected(); if(!r) return; toggleMaximize(r.el); bringToFront(r.el); render(); };
      els.btnEnd.onclick   = function(){ var r=getSelected(); if(!r) return; closeWin(r.el); selectedId=null; render(); };

      els.refresh.onclick  = render;
      els.filter.oninput   = render;

      // simple timer refresh (safe, cheap)
      var listTimer = setInterval(render, 800);

      // cleanup on close
      if (typeof win.onClose === 'function') {
        win.onClose(function(){ try { clearInterval(listTimer); } catch(_){} });
      }

      // initial paint
      render();
    }
  };
}

export default makeAppDef();
