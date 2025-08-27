export default {
  id: 'notepad',
  name: 'Notepad',
  icon: { type: 'fa', value: 'fas fa-file-alt' },
  open(AppHost) {
    const store = AppHost.storage(this.id);
    // Load saved state or initialize default
    const defaultState = {
      tabs: [{ id: 'tab1', title: 'Note 1', content: '' }],
      activeTab: 'tab1',
    };
    const state = store.load(defaultState);

    // Create the main window
    const win = AppHost.createWindow({
      id: this.id,
      title: this.name,
      width: 800,
      height: 600,
      icon: this.icon,
    });

    // Create main container
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    container.style.fontFamily = 'Arial, sans-serif';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.padding = '5px';
    toolbar.style.background = '#f1f1f1';
    toolbar.style.borderBottom = '1px solid #ccc';

    // Toolbar Buttons
    const newTabBtn = document.createElement('button');
    newTabBtn.textContent = 'New Tab';
    newTabBtn.style.marginRight = '5px';
    newTabBtn.addEventListener('click', () => addNewTab());

    const boldBtn = document.createElement('button');
    boldBtn.textContent = 'B';
    boldBtn.style.fontWeight = 'bold';
    boldBtn.style.marginRight = '5px';
    boldBtn.addEventListener('click', () => document.execCommand('bold', false, null));

    const italicBtn = document.createElement('button');
    italicBtn.textContent = 'I';
    italicBtn.style.fontStyle = 'italic';
    italicBtn.style.marginRight = '5px';
    italicBtn.addEventListener('click', () => document.execCommand('italic', false, null));

    toolbar.append(newTabBtn, boldBtn, italicBtn);

    // Tab Bar
    const tabBar = document.createElement('div');
    tabBar.style.display = 'flex';
    tabBar.style.background = '#e0e0e0';
    tabBar.style.borderBottom = '1px solid #ccc';

    // Content Area
    const contentArea = document.createElement('div');
    contentArea.style.flex = '1';
    contentArea.style.display = 'flex';
    contentArea.style.overflow = 'hidden';

    // Line Numbers
    const lineNumbers = document.createElement('div');
    lineNumbers.style.width = '40px';
    lineNumbers.style.background = '#f9f9f9';
    lineNumbers.style.borderRight = '1px solid #ccc';
    lineNumbers.style.padding = '5px';
    lineNumbers.style.overflowY = 'auto';
    lineNumbers.style.userSelect = 'none';
    lineNumbers.style.color = '#666';
    lineNumbers.style.fontFamily = 'monospace';

    // Editable Content
    const editor = document.createElement('div');
    editor.contentEditable = true;
    editor.style.flex = '1';
    editor.style.padding = '5px';
    editor.style.whiteSpace = 'pre-wrap';
    editor.style.overflowY = 'auto';
    editor.style.fontFamily = 'monospace';
    editor.style.fontSize = '14px';
    editor.style.outline = 'none';

    contentArea.append(lineNumbers, editor);
    container.append(toolbar, tabBar, contentArea);
    win.contentEl.appendChild(container);

    // Tab Management
    let tabs = state.tabs;
    let activeTabId = state.activeTab;

    function renderTabs() {
      tabBar.innerHTML = '';
      tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.style.padding = '5px 10px';
        tabEl.style.cursor = 'pointer';
        tabEl.style.background = tab.id === activeTabId ? '#fff' : '#e0e0e0';
        tabEl.style.borderRight = '1px solid #ccc';

        const titleEl = document.createElement('span');
        titleEl.textContent = tab.title;
        titleEl.addEventListener('click', () => switchTab(tab.id));

        const closeBtn = document.createElement('span');
        closeBtn.textContent = ' ×';
        closeBtn.style.marginLeft = '5px';
        closeBtn.style.color = 'red';
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeTab(tab.id);
        });

        tabEl.append(titleEl, closeBtn);
        tabBar.appendChild(tabEl);
      });
    }

    function switchTab(tabId) {
      activeTabId = tabId;
      const activeTab = tabs.find(t => t.id === tabId);
      editor.innerHTML = activeTab.content || '';
      updateLineNumbers();
      saveState();
    }

    function addNewTab() {
      const newTabId = `tab${tabs.length + 1}`;
      tabs.push({ id: newTabId, title: `Note ${tabs.length + 1}`, content: '' });
      activeTabId = newTabId;
      renderTabs();
      switchTab(newTabId);
    }

    function closeTab(tabId) {
      if (tabs.length === 1) return; // Prevent closing the last tab
      tabs = tabs.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        activeTabId = tabs[0].id;
      }
      renderTabs();
      switchTab(activeTabId);
    }

    function saveState() {
      const activeTab = tabs.find(t => t.id === activeTabId);
      activeTab.content = editor.innerHTML;
      store.save({ tabs, activeTab: activeTabId });
    }

    function updateLineNumbers() {
      const lines = (editor.innerText || '').split('\n').length;
      lineNumbers.innerHTML = Array.from(
        { length: lines || 1 },
        (_, i) => `<div>${i + 1}</div>`
      ).join('');
    }

    // Event Listeners
    editor.addEventListener('input', () => {
      updateLineNumbers();
      saveState();
    });

    editor.addEventListener('scroll', () => {
      lineNumbers.scrollTop = editor.scrollTop;
    });

    // Initialize
    renderTabs();
    switchTab(activeTabId);
  },
};