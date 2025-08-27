const iconSvg = `
<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden="true">
  <path d="M12 8a4 4 0 1 1-.001 8.001A4 4 0 0 1 12 8zm8.94 3a8.06 8.06 0 0 1 0 2l2.02 1.57a.5.5 0 0 1 .12.66l-1.91 3.3a.5.5 0 0 1-.61.22l-2.38-.96a7.93 7.93 0 0 1-1.73 1l-.36 2.54a.5.5 0 0 1-.5.42h-3.82a.5.5 0 0 1-.5-.42l-.36-2.54a7.93 7.93 0 0 1-1.73-1l-2.38.96a.5.5 0 0 1-.61-.22l-1.91-3.3a.5.5 0 0 1 .12-.66L3.06 13a8.06 8.06 0 0 1 0-2L1.04 9.43a.5.5 0 0 1-.12-.66l1.91-3.3a.5.5 0 0 1 .61-.22l2.38.96c.54-.39 1.12-.72 1.73-1l.36-2.54a.5.5 0 0 1 .5-.42h3.82a.5.5 0 0 1 .5.42l.36 2.54c.61.28 1.19.61 1.73 1l2.38-.96a.5.5 0 0 1 .61.22l1.91 3.3a.5.5 0 0 1-.12.66L20.94 11z"/>
</svg>`;

export default {
  id: 'settings',
  name: 'Settings',
 icon: { type: 'fa', value: 'fas fa-cog' },
  open(AppHost) {
    const win = AppHost.createWindow({ id: this.id, title: this.name, icon: this.icon, width: 700, height: 500 });

    const s = JSON.parse(localStorage.getItem('desktopSettings') || '{}');
    const W = window.WALLPAPER_LIST || [];
    const WT = window.WALLPAPER_THUMB_LIST || [];

    win.contentEl.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%;">
        <div style="padding:15px; border-bottom:1px solid #ddd; display:flex; align-items:center;">
          <h1 style="font-size:24px; font-weight:400; margin:0;">Settings</h1>
          <input id="settings-search" type="text" placeholder="Find a setting" style="margin-left:auto; padding:8px; border:1px solid #ddd; border-radius:4px; width:200px;">
        </div>
        <div style="flex:1; display:flex; min-height:0;">
          <div class="settings-sidebar" style="width:200px; border-right:1px solid #ddd; overflow:auto; background:#f3f3f3;">
            <div class="sidebar-item active" data-panel="personalization" style="padding:12px 16px; cursor:pointer;">Personalization</div>
            <div class="sidebar-item" data-panel="apps" style="padding:12px 16px; cursor:pointer;">Apps</div>
            <div class="sidebar-item" data-panel="system" style="padding:12px 16px; cursor:pointer;">System</div>
          </div>
          <div class="settings-panels" style="flex:1; overflow:auto; padding:20px;">
            <div id="personalization-panel">
              <h2 style="font-size:18px; margin-bottom:15px;">Colors & Wallpaper</h2>
              <div style="display:flex; align-items:center; gap:24px; margin-bottom:18px;">
                <div><label style="font-weight:500;">Icon Color:</label><input type="color" id="setting-icon-color" style="margin-left:10px;"></div>
                <div><label style="font-weight:500;">Icon Text Color:</label><input type="color" id="setting-icon-text-color" style="margin-left:10px;"></div>
              </div>
              <div style="margin-bottom:18px;">
                <label style="font-weight:500;">Wallpaper:</label>
                <div id="setting-wallpaper-list" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px;"></div>
                <div style="margin-top:10px;">
                  <label style="font-size:14px;">Solid Color:</label>
                  <input type="color" id="setting-wallpaper-solid-color" style="margin-left:10px;">
                  <button id="setting-wallpaper-solid-btn" class="modal-btn secondary" style="margin-left:10px;">Set Solid Color</button>
                </div>
              </div>
            </div>
            <div id="apps-panel" style="display:none;">
              <h2 style="font-size:18px; margin-bottom:15px;">Manage Apps</h2>
              <button id="setting-add-app-btn" class="modal-btn primary">Add New App</button>
            </div>
            <div id="system-panel" style="display:none;">
              <h2 style="font-size:18px; margin-bottom:15px;">System Settings</h2>
              <label style="font-weight:500;">Taskbar:</label>
              <button id="setting-taskbar-toggle" class="modal-btn secondary" style="margin-left:10px;">${s.taskbarVisible===false?'Show':'Hide'} Taskbar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Sidebar switching
    const sidebarItems = win.contentEl.querySelectorAll('.sidebar-item');
    function switchPanel(id){
      win.contentEl.querySelectorAll('.settings-panels > div').forEach(p => p.style.display='none');
      win.contentEl.querySelector(`#${id}-panel`).style.display='block';
      sidebarItems.forEach(i=>i.classList.remove('active'));
      win.contentEl.querySelector(`.sidebar-item[data-panel="${id}"]`).classList.add('active');
    }
    sidebarItems.forEach(item => item.addEventListener('click', () => switchPanel(item.getAttribute('data-panel'))));
    switchPanel('personalization');

    // Personalization values
    const iconColorInput = win.contentEl.querySelector('#setting-icon-color');
    const iconTextColorInput = win.contentEl.querySelector('#setting-icon-text-color');
    const solidColorInput = win.contentEl.querySelector('#setting-wallpaper-solid-color');

    iconColorInput.value = s.iconColor || '#ffffff';
    iconTextColorInput.value = s.iconTextColor || '#000000';
    solidColorInput.value = s.wallpaperSolid || '#000000';

    iconColorInput.oninput = function(){ saveSettings({ iconColor:this.value }); };
    iconTextColorInput.oninput = function(){ saveSettings({ iconTextColor:this.value }); };

    const wallpaperList = win.contentEl.querySelector('#setting-wallpaper-list');
    wallpaperList.innerHTML = '';
    W.forEach((url, idx) => {
      const img = document.createElement('img');
      img.src = WT[idx] || url;
      img.style.width='100%'; img.style.height='60px'; img.style.objectFit='cover'; img.style.borderRadius='6px'; img.style.cursor='pointer';
      const selected = s.wallpaper === url && s.wallpaperType==='image';
      img.style.border = selected ? '3px solid #0078d7' : '2px solid #ccc';
      img.addEventListener('click', () => {
        saveSettings({ wallpaper:url, wallpaperType:'image' });
        wallpaperList.querySelectorAll('img').forEach(i=>i.style.border='2px solid #ccc');
        img.style.border = '3px solid #0078d7';
      });
      wallpaperList.appendChild(img);
    });

    win.contentEl.querySelector('#setting-wallpaper-solid-btn').onclick = function(){
      const color = solidColorInput.value;
      saveSettings({ wallpaperSolid: color, wallpaperType:'solid' });
      wallpaperList.querySelectorAll('img').forEach(i=>i.style.border='2px solid #ccc');
    };

    // Apps panel
    win.contentEl.querySelector('#setting-add-app-btn').onclick = () => {
      const modal = document.getElementById('new-app-modal');
      if (modal) { modal.style.display='flex'; }
    };

    // System panel
    const taskbarToggleBtn = win.contentEl.querySelector('#setting-taskbar-toggle');
    taskbarToggleBtn.onclick = () => {
      const cur = JSON.parse(localStorage.getItem('desktopSettings') || '{}');
      const vis = cur.taskbarVisible !== false;
      saveSettings({ taskbarVisible: !vis });
      taskbarToggleBtn.textContent = (!vis) ? 'Hide Taskbar' : 'Show Taskbar';
    };
  }
};
