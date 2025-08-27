export default {
  id: 'notepad',
  name: 'Notepad',
  icon: { type: 'fa', value: 'fas fa-file-alt' },

  open(AppHost) {
    const store = AppHost.storage(this.id);

    // State
    const defaultState = {
      tabs: [{ id: 'tab-1', title: 'Note 1', html: '' }],
      activeTab: 'tab-1',
      theme: 'light',
    };
    let state = normalizeState(store.load(defaultState));

    const win = AppHost.createWindow({
      id: this.id,
      title: this.name,
      width: 1000,
      height: 700,
      icon: this.icon,
    });

    // UI
    win.contentEl.innerHTML = `
      <style>
        .np-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--bg, #ffffff);
          color: var(--fg, #1f2937);
          transition: background 0.2s, color 0.2s;
        }
        .np-root.dark {
          --bg: #1f2937;
          --fg: #f3f4f6;
          --border: #4b5563;
          --btn-bg: #374151;
          --btn-hover: #4b5563;
          --editor-bg: #111827;
          --tab-bg: #374151;
          --tab-active: #1f2937;
        }
        .np-root.light {
          --bg: #ffffff;
          --fg: #1f2937;
          --border: #e5e7eb;
          --btn-bg: #f3f4f6;
          --btn-hover: #e5e7eb;
          --editor-bg: #ffffff;
          --tab-bg: #f3f4f6;
          --tab-active: #ffffff;
        }

        .np-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          background: var(--btn-bg);
          border-bottom: 1px solid var(--border);
          padding: 10px;
          border-radius: 8px 8px 0 0;
        }
        .np-group {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-right: 10px;
          border-right: 1px solid var(--border);
        }
        .np-group:last-child { border-right: none; padding-right: 0; }
        .np-btn, .np-select, .np-color {
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 6px;
          height: 32px;
          padding: 0 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: var(--fg);
          transition: background 0.2s;
        }
        .np-btn:hover { background: var(--btn-hover); }
        .np-btn:active { transform: scale(0.98); }
        .np-select { height: 32px; }
        .np-color { width: 32px; padding: 0; justify-content: center; }

        .np-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--tab-bg);
          padding: 8px 10px;
          overflow-x: auto;
          scrollbar-width: thin;
        }
        .np-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid var(--border);
          background: var(--tab-bg);
          border-radius: 6px;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }
        .np-tab.active {
          background: var(--tab-active);
          border-color: var(--fg);
          color: var(--fg);
        }
        .np-tab.dragging { opacity: 0.5; }
        .np-tab input {
          border: none;
          background: transparent;
          color: inherit;
          font-weight: 500;
          width: 120px;
          font-size: 14px;
        }
        .np-tab input:focus { outline: none; }
        .np-tab .close {
          opacity: 0.7;
          font-size: 16px;
          font-weight: bold;
        }
        .np-tab .close:hover { opacity: 1; }

        .np-editor-container {
          display: flex;
          flex: 1;
          min-height: 0;
          border: 1px solid var(--border);
          border-radius: 0 0 8px 8px;
          overflow: hidden;
        }
        .np-line-numbers {
          width: 40px;
          background: var(--btn-bg);
          border-right: 1px solid var(--border);
          padding: 18px 8px;
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          color: #6b7280;
          user-select: none;
          overflow-y: auto;
          text-align: right;
        }
        .np-line-numbers div { line-height: 1.5; }
        .np-editor {
          outline: none;
          padding: 18px 20px;
          flex: 1;
          overflow-y: auto;
          background: var(--editor-bg);
          color: var(--fg);
          line-height: 1.5;
          font-size: 15px;
          scrollbar-width: thin;
        }
        .np-editor h1, .np-editor h2, .np-editor h3 { margin: 0.6em 0; }
        .np-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,.1);
        }
        .np-editor blockquote {
          border-left: 4px solid #2563eb;
          margin: 8px 0;
          padding: 6px 12px;
          background: #f3f6ff;
          border-radius: 6px;
        }
        .np-drop {
          position: absolute;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(37,99,235,.1);
          border: 2px dashed #2563eb;
          color: #2563eb;
          font-weight: 700;
          font-size: 18px;
        }

        .np-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid var(--border);
        }
        .np-status .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
        }
        .np-status.saving .dot { background: #f59e0b; }
        .np-btn, .np-select, .np-color {
  border: 1px solid var(--border);
  background: var(--btn-bg);
  border-radius: 6px;
  height: 32px;
  padding: 0 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--fg); /* Ensure text is visible in dark mode */
  transition: background 0.2s, color 0.2s;
}
.np-btn:hover {
  background: var(--btn-hover);
  color: var(--fg); /* Maintain visibility on hover */
}
.np-btn:active {
  transform: scale(0.98);
  color: var(--fg); /* Maintain visibility on active state */
}
.np-select {
  height: 32px;
  color: var(--fg); /* Ensure dropdown text is visible */
  background: var(--btn-bg);
}
.np-color {
  width: 32px;
  padding: 0;
  justify-content: center;
  color: var(--fg); /* Ensure any text/icon is visible */
}

.np-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: var(--tab-bg);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s, color 0.2s; /* Add color transition */
}
.np-tab.active {
  background: var(--tab-active);
  border-color: var(--fg);
  color: var(--fg); /* Ensure active tab text is visible */
}
.np-tab input {
  border: none;
  background: transparent;
  color: inherit; /* Inherit from parent for dark/light mode */
  font-weight: 500;
  width: 120px;
  font-size: 14px;
}
.np-tab .close {
  opacity: 0.7;
  font-size: 16px;
  font-weight: bold;
  color: inherit; /* Inherit for visibility */
}
.np-tab .close:hover { opacity: 1; }
      </style>

      <div class="np-root">
        <div class="np-toolbar">
          <div class="np-group">
            <button class="np-btn" id="np-new" title="New tab (Ctrl+T)" aria-label="New tab"><i class="fas fa-plus"></i> New</button>
            <button class="np-btn" id="np-save" title="Save (Ctrl+S)" aria-label="Save"><i class="fas fa-save"></i> Save</button>
            <button class="np-btn" id="np-export" title="Export HTML" aria-label="Export HTML"><i class="fas fa-file-export"></i> Export</button>
            <label class="np-btn" title="Import HTML" aria-label="Import HTML">
              <i class="fas fa-file-import"></i> Import
              <input type="file" id="np-import" accept=".html,text/html" style="display:none;">
            </label>
            <button class="np-btn" id="np-print" title="Print" aria-label="Print"><i class="fas fa-print"></i> Print</button>
          </div>
          <div class="np-group">
            <button class="np-btn" data-cmd="undo" title="Undo (Ctrl+Z)" aria-label="Undo"><i class="fas fa-undo"></i></button>
            <button class="np-btn" data-cmd="redo" title="Redo (Ctrl+Y)" aria-label="Redo"><i class="fas fa-redo"></i></button>
          </div>
          <div class="np-group">
            <select class="np-select" id="np-block" aria-label="Block format">
              <option value="p">Paragraph</option>
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="pre">Code</option>
            </select>
            <button class="np-btn" data-cmd="bold" title="Bold (Ctrl+B)" aria-label="Bold"><i class="fas fa-bold"></i></button>
            <button class="np-btn" data-cmd="italic" title="Italic (Ctrl+I)" aria-label="Italic"><i class="fas fa-italic"></i></button>
            <button class="np-btn" data-cmd="underline" title="Underline (Ctrl+U)" aria-label="Underline"><i class="fas fa-underline"></i></button>
            <button class="np-btn" data-cmd="strikeThrough" title="Strikethrough" aria-label="Strikethrough"><i class="fas fa-strikethrough"></i></button>
            <input type="color" class="np-color" id="np-fore" title="Text color" aria-label="Text color">
            <input type="color" class="np-color" id="np-back" title="Highlight" aria-label="Highlight">
          </div>
          <div class="np-group">
            <button class="np-btn" data-cmd="insertUnorderedList" title="Bulleted list" aria-label="Bulleted list"><i class="fas fa-list-ul"></i></button>
            <button class="np-btn" data-cmd="insertOrderedList" title="Numbered list" aria-label="Numbered list"><i class="fas fa-list-ol"></i></button>
            <button class="np-btn" data-cmd="outdent" title="Outdent" aria-label="Outdent"><i class="fas fa-outdent"></i></button>
            <button class="np-btn" data-cmd="indent" title="Indent" aria-label="Indent"><i class="fas fa-indent"></i></button>
          </div>
          <div class="np-group">
            <button class="np-btn" data-cmd="justifyLeft" title="Align left" aria-label="Align left"><i class="fas fa-align-left"></i></button>
            <button class="np-btn" data-cmd="justifyCenter" title="Align center" aria-label="Align center"><i class="fas fa-align-center"></i></button>
            <button class="np-btn" data-cmd="justifyRight" title="Align right" aria-label="Align right"><i class="fas fa-align-right"></i></button>
            <button class="np-btn" data-cmd="justifyFull" title="Justify" aria-label="Justify"><i class="fas fa-align-justify"></i></button>
          </div>
          <div class="np-group">
            <button class="np-btn" id="np-link" title="Insert link" aria-label="Insert link"><i class="fas fa-link"></i></button>
            <button class="np-btn" id="np-unlink" title="Remove link" aria-label="Remove link"><i class="fas fa-unlink"></i></button>
            <button class="np-btn" id="np-hr" title="Horizontal rule" aria-label="Horizontal rule"><i class="fas fa-minus"></i></button>
            <button class="np-btn" id="np-clear" title="Clear formatting" aria-label="Clear formatting"><i class="fas fa-eraser"></i></button>
          </div>
          <div class="np-group">
            <label class="np-btn" title="Insert image (upload)" aria-label="Upload image">
              <i class="fas fa-image"></i> Upload
              <input type="file" id="np-img-upload" accept="image/*" multiple style="display:none;">
            </label>
            <button class="np-btn" id="np-img-url" title="Insert image from URL" aria-label="Insert image from URL"><i class="fas fa-link"></i> URL</button>
          </div>
          <div class="np-group">
            <button class="np-btn" id="np-theme" title="Toggle theme" aria-label="Toggle theme"><i class="fas fa-moon"></i></button>
          </div>
        </div>
        <div class="np-tabs" id="np-tabs"></div>
        <div class="np-editor-container">
          <div class="np-line-numbers" id="np-line-numbers"></div>
          <div class="np-editor" id="np-editor" contenteditable="true" spellcheck="true"></div>
          <div class="np-drop" id="np-drop">Drop images to insert</div>
        </div>
        <div class="np-status" id="np-status">
          <span class="dot"></span>
          <span id="np-status-text">Saved</span>
          <span id="np-stats" style="margin-left:10px;"></span>
        </div>
      </div>
    `;

    const el = {
      root: win.contentEl.querySelector('.np-root'),
      tabs: win.contentEl.querySelector('#np-tabs'),
      editor: win.contentEl.querySelector('#np-editor'),
      lineNumbers: win.contentEl.querySelector('#np-line-numbers'),
      drop: win.contentEl.querySelector('#np-drop'),
      status: win.contentEl.querySelector('#np-status'),
      statusText: win.contentEl.querySelector('#np-status-text'),
      stats: win.contentEl.querySelector('#np-stats'),
      block: win.contentEl.querySelector('#np-block'),
      fore: win.contentEl.querySelector('#np-fore'),
      back: win.contentEl.querySelector('#np-back'),
      import: win.contentEl.querySelector('#np-import'),
      imgUpload: win.contentEl.querySelector('#np-img-upload'),
      theme: win.contentEl.querySelector('#np-theme'),
    };

    // Apply initial theme
    el.root.classList.add(state.theme);

    // Tabs
    function renderTabs() {
      el.tabs.innerHTML = '';
      state.tabs.forEach(t => {
        const tab = document.createElement('div');
        tab.className = 'np-tab' + (t.id === state.activeTab ? ' active' : '');
        tab.dataset.id = t.id;
        tab.draggable = true;

        const title = document.createElement('input');
        title.value = t.title;
        title.readOnly = true;
        title.setAttribute('aria-label', `Tab: ${t.title}`);
        title.addEventListener('dblclick', () => {
          title.readOnly = false;
          title.focus();
          title.select();
        });
        title.addEventListener('blur', () => {
          title.readOnly = true;
          t.title = title.value.trim() || 'Untitled';
          persist();
          renderTabs();
        });
        title.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); title.blur(); }
          if (e.key === 'Escape') { e.preventDefault(); title.readOnly = true; title.value = t.title; title.blur(); }
        });

        const close = document.createElement('span');
        close.className = 'close';
        close.innerHTML = '&times;';
        close.setAttribute('aria-label', `Close tab: ${t.title}`);
        close.addEventListener('click', e => {
          e.stopPropagation();
          if (state.tabs.length === 1) return;
          const idx = state.tabs.findIndex(x => x.id === t.id);
          state.tabs.splice(idx, 1);
          if (state.activeTab === t.id) {
            state.activeTab = state.tabs[Math.max(0, idx - 1)]?.id || state.tabs[0].id;
          }
          persist();
          renderTabs();
          loadActive();
        });

        tab.append(title, close);
        tab.addEventListener('click', () => setActive(t.id));
        tab.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', t.id);
          tab.classList.add('dragging');
        });
        tab.addEventListener('dragend', () => tab.classList.remove('dragging'));
        tab.addEventListener('dragover', e => e.preventDefault());
        tab.addEventListener('drop', e => {
          e.preventDefault();
          const draggedId = e.dataTransfer.getData('text/plain');
          const targetId = t.id;
          if (draggedId !== targetId) {
            const draggedIdx = state.tabs.findIndex(x => x.id === draggedId);
            const targetIdx = state.tabs.findIndex(x => x.id === targetId);
            const [dragged] = state.tabs.splice(draggedIdx, 1);
            state.tabs.splice(targetIdx, 0, dragged);
            persist();
            renderTabs();
          }
        });

        el.tabs.appendChild(tab);
      });
    }

    function setActive(id) {
      saveActiveHTML();
      state.activeTab = id;
      renderTabs();
      loadActive();
      persist();
    }

    function addTab() {
      const id = 'tab-' + Date.now();
      state.tabs.push({ id, title: `Note ${state.tabs.length + 1}`, html: '' });
      setActive(id);
    }

    function saveActiveHTML() {
      const t = getActiveTab();
      if (!t) return;
      t.html = el.editor.innerHTML;
    }

    function loadActive() {
      const t = getActiveTab();
      el.editor.innerHTML = t?.html || '';
      el.editor.focus();
      updateLineNumbers();
      updateStats();
      setSaved();
    }

    function getActiveTab() {
      return state.tabs.find(t => t.id === state.activeTab) || state.tabs[0];
    }

    // Line Numbering
    function updateLineNumbers() {
      const lines = (el.editor.innerText || '').split('\n').length;
      el.lineNumbers.innerHTML = Array.from(
        { length: Math.max(1, lines) },
        (_, i) => `<div>${i + 1}</div>`
      ).join('');
      el.lineNumbers.scrollTop = el.editor.scrollTop;
    }

    // Stats (Word/Character Count)
    function updateStats() {
      const text = el.editor.innerText || '';
      const words = text.trim().split(/\s+/).filter(w => w).length;
      const chars = text.length;
      el.stats.textContent = `${words} words, ${chars} characters`;
    }

    // Toolbar Actions
    el.theme.addEventListener('click', () => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      el.root.classList.toggle('light', state.theme === 'light');
      el.root.classList.toggle('dark', state.theme === 'dark');
      persist();
    });

    win.contentEl.querySelector('#np-new').addEventListener('click', addTab);
    win.contentEl.querySelector('#np-save').addEventListener('click', () => {
      saveActiveHTML();
      persist(true);
    });
    win.contentEl.querySelector('#np-export').addEventListener('click', exportHTML);
    el.import.addEventListener('change', importHTML);
    win.contentEl.querySelector('#np-print').addEventListener('click', () => {
      const html = wrapPrintable(el.editor.innerHTML);
      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    });

    win.contentEl.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        document.execCommand(cmd, false, null);
        el.editor.focus();
        updateLineNumbers();
        updateStats();
      });
    });

    el.block.addEventListener('change', () => {
      const val = el.block.value;
      if (val === 'p') document.execCommand('formatBlock', false, 'p');
      else if (val === 'pre') document.execCommand('formatBlock', false, 'pre');
      else document.execCommand('formatBlock', false, val.toUpperCase());
      el.editor.focus();
      updateLineNumbers();
      updateStats();
    });

    el.fore.addEventListener('input', () => {
      document.execCommand('foreColor', false, el.fore.value);
      el.editor.focus();
    });
    el.back.addEventListener('input', () => {
      const ok = document.execCommand('hiliteColor', false, el.back.value);
      if (!ok) document.execCommand('backColor', false, el.back.value);
      el.editor.focus();
    });

    win.contentEl.querySelector('#np-link').addEventListener('click', () => {
      const url = prompt('Enter URL (https://...)', 'https://');
      if (!url) return;
      document.execCommand('createLink', false, url);
      el.editor.focus();
    });
    win.contentEl.querySelector('#np-unlink').addEventListener('click', () => {
      document.execCommand('unlink', false, null);
      el.editor.focus();
    });
    win.contentEl.querySelector('#np-hr').addEventListener('click', () => {
      document.execCommand('insertHorizontalRule', false, null);
      el.editor.focus();
      updateLineNumbers();
    });
    win.contentEl.querySelector('#np-clear').addEventListener('click', () => {
      document.execCommand('removeFormat', false, null);
      el.editor.focus();
    });

    el.imgUpload.addEventListener('change', async e => {
      const files = [...(e.target.files || [])].filter(f => f.type.startsWith('image/'));
      if (!files.length) return;
      for (const f of files) {
        const dataUrl = await fileToDataURL(f);
        insertImage(dataUrl);
      }
      e.target.value = '';
      saveActiveHTML();
      persist();
      updateLineNumbers();
      updateStats();
    });

    win.contentEl.querySelector('#np-img-url').addEventListener('click', () => {
      const url = prompt('Image URL (https://...)');
      if (!url) return;
      insertImage(url);
      saveActiveHTML();
      persist();
      updateLineNumbers();
      updateStats();
    });

    // Editor Events
    let saveTimer;
    el.editor.addEventListener('input', () => {
      setSaving();
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveActiveHTML();
        persist();
        updateLineNumbers();
        updateStats();
      }, 400);
    });

    el.editor.addEventListener('paste', async e => {
      const items = [...(e.clipboardData?.items || [])];
      const imgItems = items.filter(it => it.type && it.type.startsWith('image/'));
      if (!imgItems.length) return;
      e.preventDefault();
      for (const it of imgItems) {
        const file = it.getAsFile();
        if (file) {
          const dataUrl = await fileToDataURL(file);
          insertImage(dataUrl);
        }
      }
      saveActiveHTML();
      persist();
      updateLineNumbers();
      updateStats();
    });

    el.editor.addEventListener('dragover', e => {
      if ([...e.dataTransfer.items].some(i => i.type.startsWith('image/'))) {
        e.preventDefault();
        el.drop.style.display = 'flex';
      }
    });
    el.editor.addEventListener('dragleave', () => {
      el.drop.style.display = 'none';
    });
    el.editor.addEventListener('drop', async e => {
      el.drop.style.display = 'none';
      const files = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      for (const f of files) {
        const dataUrl = await fileToDataURL(f);
        insertImage(dataUrl);
      }
      saveActiveHTML();
      persist();
      updateLineNumbers();
      updateStats();
    });

    el.editor.addEventListener('scroll', () => {
      el.lineNumbers.scrollTop = el.editor.scrollTop;
    });

    // Keyboard Shortcuts
    win.el.addEventListener('keydown', e => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'b') { e.preventDefault(); document.execCommand('bold'); }
      if (e.key.toLowerCase() === 'i') { e.preventDefault(); document.execCommand('italic'); }
      if (e.key.toLowerCase() === 'u') { e.preventDefault(); document.execCommand('underline'); }
      if (e.key.toLowerCase() === 's') { e.preventDefault(); saveActiveHTML(); persist(true); }
      if (e.key.toLowerCase() === 't') { e.preventDefault(); addTab(); }
    });

    // Persist on Close
    win.onClose(() => {
      saveActiveHTML();
      persist(true);
    });

    // Helpers
    function normalizeState(s) {
      if (!s || !Array.isArray(s.tabs) || !s.tabs.length) return { ...defaultState };
      if (!s.activeTab || !s.tabs.find(t => t.id === s.activeTab)) s.activeTab = s.tabs[0].id;
      s.tabs.forEach(t => {
        if (t.content != null && t.html == null) t.html = t.content;
      });
      return s;
    }

    function persist(showSaved) {
      store.save(state);
      if (showSaved) setSaved();
      else setSavedSoft();
    }

    function setSaving() {
      el.status.classList.add('saving');
      el.statusText.textContent = 'Saving…';
    }
    function setSaved() {
      el.status.classList.remove('saving');
      el.statusText.textContent = 'Saved';
    }
    function setSavedSoft() {
      el.statusText.textContent = 'Saved';
      el.status.classList.remove('saving');
    }

    function fileToDataURL(file) {
      return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
    }

    function insertImage(src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'image';
      placeAtCursor(img);
    }

    function placeAtCursor(node) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        el.editor.appendChild(node);
      }
    }

    function exportHTML() {
      saveActiveHTML();
      const t = getActiveTab();
      const blob = new Blob([wrapExport(t.html)], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (t.title || 'note') + '.html';
      a.click();
      URL.revokeObjectURL(url);
    }

    async function importHTML(ev) {
      const f = ev.target.files?.[0];
      if (!f) return;
      const text = await f.text();
      el.editor.innerHTML = stripHTMLShell(text);
      saveActiveHTML();
      persist(true);
      updateLineNumbers();
      updateStats();
      ev.target.value = '';
    }

    function wrapExport(inner) {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Exported Note</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>body{font-family:Inter,system-ui,sans-serif;line-height:1.5;padding:24px;max-width:900px;margin:auto}
        img{max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1)}</style>
      </head><body>${inner}</body></html>`;
    }

    function wrapPrintable(inner) {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Print</title>
      <style>body{font-family:Inter,system-ui,sans-serif;line-height:1.4;padding:24px} img{max-width:100%;}</style>
      </head><body>${inner}</body></html>`;
    }

    function stripHTMLShell(html) {
      const m = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
      return m ? m[1] : html;
    }

    // Initial Render
    renderTabs();
    loadActive();
  },
};