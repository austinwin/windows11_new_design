const iconSvg = `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4a3 3 0 1 0 .002 6.002A3 3 0 0 0 12 6z"/></svg>`;

export default {
  id: 'assetmap',
  name: 'Asset Map',
  icon: { type: 'svg', value: iconSvg },
  open(AppHost) {
    const win = AppHost.createWindow({ id: this.id, title: this.name, icon: this.icon, width: Math.round(window.innerWidth*0.7), height: Math.round(window.innerHeight*0.7) });
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    wrap.innerHTML = `
      <div class="spinner" style="width:48px;height:48px;border:6px solid #e0e0e0;border-top:6px solid #0078d7;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:12px;"></div>
      <span style="color:#0078d7;font-weight:500;font-size:16px;">Loading...</span>`;
    win.contentEl.appendChild(wrap);

    const iframe = document.createElement('iframe');
    iframe.src = "https://mycity.maps.arcgis.com/apps/webappviewer/index.html?id=d7ca0cea22704066892341d580145291";
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.onload = () => { wrap.style.display='none'; };
    win.contentEl.appendChild(iframe);
  }
};
