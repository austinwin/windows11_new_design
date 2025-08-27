// /apps/OneNote.js — ESM app module (export default appDef)

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

function uid() { return Math.random().toString(36).slice(2, 10); }

function makeAppDef() {
  return {
    id: APP_ID,
    name: APP_NAME,
    icon: { type: 'svg', value: ICON_SVG },

    open(host) {
      const store = host.storage(APP_ID);
      const state = store.load({
        notebooks: [{ id: 'default', name: 'Personal', pages: [] }],
        activeNotebookId: 'default',
        activePageId: null
      });

      const win = host.createWindow({
        id: APP_ID,
        title: APP_NAME,
        width: 920,
        height: 620,
        icon: { type: 'svg', value: ICON_SVG }
      });
      const root = win.contentEl;

      root.innerHTML =
        '<div style="display:flex; height:100%; font-size:14px; color:#111;">' +
          '<div id="nbPanel" style="width:220px;border-right:1px solid #e5e5e5;background:#fafafa;display:flex;flex-direction:column;">' +
            '<div style="padding:10px 12px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #eee;">' +
              '<button id="btnNewNotebook" class="modal-btn secondary" style="padding:6px 8px;">+ Notebook</button>' +
              '<button id="btnNewPage" class="modal-btn primary" style="padding:6px 8px;margin-left:auto;">+ Page</button>' +
            '</div>' +
            '<div id="notebooks" style="flex:1;overflow:auto;"></div>' +
          '</div>' +

          '<div style="flex:1;display:flex;flex-direction:column;">' +
            '<div style="padding:10px 12px;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center;">' +
              '<input id="pageTitle" placeholder="Untitled page" style="flex:1;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:16px;">' +
              '<button id="btnDeletePage" class="modal-btn secondary" title="Delete page">Delete</button>' +
            '</div>' +
            '<div id="editor" contenteditable="true" style="flex:1; padding:16px; outline:none; overflow:auto; line-height:1.5; font-size:15px;"></div>' +
            '<div style="border-top:1px solid #eee;padding:6px 12px;font-size:12px;color:#666;">' +
              'Autosaved locally • <span id="status">Saved</span>' +
            '</div>' +
          '</div>' +
        '</div>';

      const el = sel => root.querySelector(sel);
      const activeNotebook = () =>
        (state.notebooks || []).find(n => n.id === state.activeNotebookId);
      const activePage = () => {
        const nb = activeNotebook(); if (!nb) return null;
        return (nb.pages || []).find(p => p.id === state.activePageId) || null;
      };

      let saveTimer;
      const setStatus = s => { const st = el('#status'); if (st) st.textContent = s; };
      const saveNow = () => { store.save(state); setStatus('Saved'); };
      const scheduleSave = () => {
        setStatus('Saving…');
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(saveNow, 300);
      };

      function renderNotebooks() {
        const cont = el('#notebooks');
        cont.innerHTML = '';
        (state.notebooks || []).forEach(nb => {
          const nbWrap = document.createElement('div');
          nbWrap.style.borderBottom = '1px solid #eee';
          nbWrap.innerHTML =
            `<div data-nb="${nb.id}" style="padding:10px 12px; font-weight:600; display:flex; align-items:center; gap:8px; cursor:pointer; background:${nb.id===state.activeNotebookId ? '#eef3ff':'transparent'};">` +
              '<span style="width:8px;height:8px;border-radius:50%;background:#7b1fa2;"></span>' +
              `<span>${nb.name || 'Notebook'}</span>` +
              `<span style="margin-left:auto;font-size:12px;color:#666">${(nb.pages?nb.pages.length:0)}</span>` +
            '</div>' +
            `<div data-nb-pages="${nb.id}" style="padding:6px 0 10px 24px;"></div>`;
          cont.appendChild(nbWrap);

          const pagesHost = nbWrap.querySelector(`[data-nb-pages="${nb.id}"]`);
          (nb.pages || []).forEach(p => {
            const pEl = document.createElement('div');
            pEl.dataset.page = p.id;
            pEl.style.cssText = `padding:6px 8px;border-radius:6px;cursor:pointer;margin:2px 8px 2px 0;background:${state.activePageId===p.id?'#e9ddff':'transparent'};`;
            pEl.textContent = p.title || 'Untitled';
            pEl.addEventListener('click', () => {
              state.activeNotebookId = nb.id;
              state.activePageId = p.id;
              renderNotebooks();
              renderEditor();
              saveNow();
            });
            pagesHost.appendChild(pEl);
          });

          nbWrap.querySelector(`[data-nb="${nb.id}"]`).addEventListener('click', () => {
            state.activeNotebookId = nb.id;
            renderNotebooks();
            saveNow();
          });
        });
      }

      function renderEditor() {
        const page = activePage();
        const titleEl = el('#pageTitle');
        const editorEl = el('#editor');

        if (!page) {
          titleEl.value = '';
          editorEl.innerHTML = '';
          editorEl.contentEditable = 'false';
          el('#btnDeletePage').disabled = true;
          return;
        }
        el('#btnDeletePage').disabled = false;
        editorEl.contentEditable = 'true';

        titleEl.value = page.title || '';
        editorEl.innerHTML = page.html || '';

        titleEl.oninput = () => {
          page.title = titleEl.value;
          scheduleSave();
          renderNotebooks(); // refresh list labels
        };
        editorEl.oninput = () => {
          page.html = editorEl.innerHTML;
          scheduleSave();
        };
      }

      el('#btnNewNotebook').addEventListener('click', () => {
        const name = prompt('Notebook name:', 'New Notebook');
        if (!name) return;
        const n = { id: uid(), name, pages: [] };
        state.notebooks.push(n);
        state.activeNotebookId = n.id;
        state.activePageId = null;
        renderNotebooks();
        renderEditor();
        saveNow();
      });

      el('#btnNewPage').addEventListener('click', () => {
        let nb = activeNotebook();
        if (!nb) {
          nb = { id: uid(), name: 'Notebook', pages: [] };
          state.notebooks.push(nb);
          state.activeNotebookId = nb.id;
        }
        const p = { id: uid(), title: 'Untitled', html: '' };
        nb.pages.unshift(p);
        state.activePageId = p.id;
        renderNotebooks();
        renderEditor();
        saveNow();
      });

      el('#btnDeletePage').addEventListener('click', () => {
        const nb = activeNotebook();
        const page = activePage();
        if (!nb || !page) return;
        if (!confirm(`Delete page "${page.title || 'Untitled'}"?`)) return;
        nb.pages = (nb.pages || []).filter(x => x.id !== page.id);
        state.activePageId = (nb.pages && nb.pages[0] && nb.pages[0].id) || null;
        renderNotebooks();
        renderEditor();
        saveNow();
      });

      // initial render & selection
      renderNotebooks();
      if (!activeNotebook()) state.activeNotebookId = (state.notebooks[0] && state.notebooks[0].id) || null;
      if (!activePage()) {
        const nb0 = activeNotebook();
        if (nb0 && nb0.pages && nb0.pages[0]) state.activePageId = nb0.pages[0].id;
      }
      renderEditor();

      // flush on close
      win.onClose(() => { saveNow(); });
    }
  };
}

export default makeAppDef();
