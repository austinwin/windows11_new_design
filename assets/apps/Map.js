const iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M15 4l6 2v12l-6-2-6 2-6-2V4l6 2 6-2zm0 2.2l-6 2-4-1.333v9.933l4 1.333 6-2 4 1.333V6.533L15 6.2z"/></svg>`;

export default {
  id: 'browser',
  name: 'Map',
  icon: { type: 'fa', value: 'fas fa-map' },
  open(AppHost) {
    const win = AppHost.createWindow({ id: this.id, title: this.name, icon: this.icon, width: Math.round(window.innerWidth*0.7), height: Math.round(window.innerHeight*0.7) });
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    wrap.innerHTML = `
      <div class="spinner" style="width:48px;height:48px;border:6px solid #e0e0e0;border-top:6px solid #0078d7;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:12px;"></div>
      <span style="color:#0078d7;font-weight:500;font-size:16px;">Loading...</span>`;
    win.contentEl.appendChild(wrap);

    const iframe = document.createElement('iframe');
    iframe.src = "https://austinwin.github.io/map";  // NOTE: target site must allow embedding
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.onload = () => { wrap.style.display='none'; };
    win.contentEl.appendChild(iframe);
  }
};
