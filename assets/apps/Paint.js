//const iconSvg = `
//<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden="true">
//  <path d="M5 3c5 0 7 3 9 5s5 4 5 7a4 4 0 0 1-4 4h-2a2 2 0 1 1 0-4h1a2 2 0 0 0 2-2c0-1-1-2-2-3s-2-2-3-3-2-2-3-2H5a2 2 0 1 0 0 4h2a1 1 0 1 1 0 2H5a4 4 0 1 1 0-8z"/>
//</svg>`;

export default {
  id: 'paint',
  name: 'Paint',
  //icon: { type: 'svg', value: iconSvg },
   icon: { type: 'fa', value: 'fas fa-paint-brush' },
  open(AppHost) {
    const win = AppHost.createWindow({ id: this.id, title: this.name, width: 800, height: 520, icon: this.icon });
    win.contentEl.innerHTML = `
      <div style="padding:12px;">
        <div class="paint-tools" style="display:flex;gap:10px;margin-bottom:10px;">
          <button data-tool="pencil" class="paint-tool" style="padding:5px 10px;border:1px solid #ddd;border-radius:4px;cursor:pointer;">Pencil</button>
          <button data-tool="eraser" class="paint-tool" style="padding:5px 10px;border:1px solid #ddd;border-radius:4px;cursor:pointer;">Eraser</button>
          <button data-tool="line"   class="paint-tool" style="padding:5px 10px;border:1px solid #ddd;border-radius:4px;cursor:pointer;">Line</button>
        </div>
        <div class="paint-colors" style="display:flex;gap:5px;margin-bottom:10px;">
          ${['#000000','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff'].map(c=>`<div class="paint-color" data-color="${c}" style="width:24px;height:24px;border-radius:50%;cursor:pointer;border:2px solid transparent;background:${c};"></div>`).join('')}
        </div>
        <div class="paint-canvas-container" style="width:100%;height:400px;overflow:auto;border:1px solid #ddd;background:#fff;">
          <canvas id="paintCanvas" width="1200" height="800" style="background:#fff;cursor:crosshair;"></canvas>
        </div>
      </div>
    `;

    const canvas = win.contentEl.querySelector('#paintCanvas');
    const ctx = canvas.getContext('2d');
    const tools = win.contentEl.querySelectorAll('.paint-tool');
    const colors = win.contentEl.querySelectorAll('.paint-color');

    let isDrawing=false, lastX=0, lastY=0, currentTool='pencil', color='#000', lineWidth=2, lineStart=null;
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=color; ctx.lineWidth=lineWidth;

    tools.forEach(t => t.addEventListener('click', () => {
      tools.forEach(b=>b.style.background=''); t.style.background='#0078d7'; t.style.color='#fff';
      currentTool = t.getAttribute('data-tool');
    }));
    colors.forEach(c => c.addEventListener('click', () => {
      colors.forEach(x=>x.style.borderColor='transparent'); c.style.borderColor='#000';
      color = c.getAttribute('data-color'); ctx.strokeStyle=color;
    }));

    canvas.addEventListener('mousedown', e => {
      isDrawing=true; [lastX,lastY]=[e.offsetX,e.offsetY];
      if (currentTool==='line') lineStart=[e.offsetX,e.offsetY];
    });
    canvas.addEventListener('mousemove', e => {
      if (!isDrawing) return;
      if (currentTool==='pencil' || currentTool==='eraser') {
        ctx.strokeStyle = (currentTool==='eraser') ? '#fff' : color;
        ctx.lineWidth = (currentTool==='eraser') ? 16 : 2;
        ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(e.offsetX,e.offsetY); ctx.stroke();
        [lastX,lastY]=[e.offsetX,e.offsetY];
      }
    });
    canvas.addEventListener('mouseup', e => {
      if (currentTool==='line' && lineStart) {
        ctx.strokeStyle=color; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(lineStart[0], lineStart[1]); ctx.lineTo(e.offsetX,e.offsetY); ctx.stroke();
      }
      isDrawing=false; lineStart=null;
    });
    canvas.addEventListener('mouseout', ()=>{ isDrawing=false; lineStart=null; });
  }
};
