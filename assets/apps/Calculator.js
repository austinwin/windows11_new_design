// /apps/Calculator.js — "WWO Engineering Calculator" (best-in-class)

export default {
  id: 'calculator',
  name: 'Calculator',
  icon: { type: 'fa', value: 'fas fa-calculator' },

  open(AppHost) {
    const win = AppHost.createWindow({
      id: this.id,
      title: this.name,
      width: 420,
      height: 640,
      icon: this.icon
    });

    // ---------- UI ----------
    win.contentEl.innerHTML = `
      <style>
        .wwo-calc { display:flex; flex-direction:column; height:100%; font-family:'Segoe UI',system-ui,sans-serif; }
        .wwo-banner {
          display:flex; align-items:center; gap:10px; padding:10px 12px; margin:0 0 8px 0;
          background: linear-gradient(135deg,#0ea5e9 0%, #2563eb 60%, #1e40af 100%);
          color:#fff; border-radius:10px; box-shadow:0 4px 18px rgba(0,0,0,.18);
        }
        .wwo-badge { width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;
                     background: linear-gradient(135deg,#ff4e50,#f9d423); box-shadow:0 2px 8px rgba(0,0,0,.25);}
        .wwo-title { font-weight:600; letter-spacing:.2px; }
        .calc-display {
          background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:14px 12px; margin:6px 0 10px 0;
          text-align:right; font-size:28px; font-family:'Consolas',ui-monospace,monospace; min-height:52px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.6), inset 0 -2px 6px rgba(0,0,0,.06);
        }
        .tabs { display:flex; gap:6px; border-bottom:1px solid #e5e7eb; padding:0 2px 6px 2px; }
        .tab-btn {
          border:none; background:#f3f4f6; color:#111; padding:8px 14px; border-radius:999px; cursor:pointer; font-weight:600;
          box-shadow: 0 1px 0 rgba(255,255,255,.6), 0 2px 8px rgba(0,0,0,.06); transition:transform .06s, background .2s;
        }
        .tab-btn:hover { background:#e5e7eb; }
        .tab-btn:active { transform: translateY(1px); }
        .tab-btn.active { background:#111827; color:#fff; }
        .tab-contents { flex:1; overflow:auto; }
        .grid-keys { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:10px 2px 2px 2px; }
        .key {
          border:none; border-radius:12px; padding:12px; font-size:18px; cursor:pointer; background:#f3f4f6; color:#111;
          box-shadow: 0 2px 10px rgba(0,0,0,.08); transition:transform .05s, background .2s, box-shadow .2s;
        }
        .key:hover { background:#eaeef2; }
        .key:active { transform: translateY(1px); box-shadow: 0 1px 6px rgba(0,0,0,.12); }
        .key.operator { background:#f59e0b; color:#fff; }
        .key.equals   { background:#2563eb; color:#fff; }
        .key.wide { grid-column: span 2; }
        .eng-header { margin:8px 0 10px 0; font-size:14px; color:#2563eb; font-weight:700; }
        .eng-buttons { display:flex; flex-wrap:wrap; gap:8px; }
.eng-btn {
  padding:8px 12px; border-radius:10px; border:1px solid #e5e7eb; background:#fff; cursor:pointer; font-weight:600;
  box-shadow: 0 2px 8px rgba(0,0,0,.06); transition:transform .05s, background .2s, border .2s;
}
.eng-btn:hover { background:#f3f4f6; }
.eng-btn:active { transform: translateY(1px); }
.eng-btn.active {
  background:#2563eb; 
  color:#fff; 
  border-color:#1e40af;
  box-shadow: 0 3px 12px rgba(37,99,235,.3);
}
        .panel { margin-top:10px; padding:10px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; box-shadow:0 2px 10px rgba(0,0,0,.06); }
        .panel label { font-size:13px; color:#374151; display:block; margin:6px 0 2px; }
        .panel input, .panel select { width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; background:#f9fafb; }
        .panel .action { margin-top:10px; padding:10px 12px; border:none; border-radius:10px; background:#2563eb; color:#fff; font-weight:700; cursor:pointer; }
        .muted { color:#6b7280; font-size:12px; margin-top:6px; }
      </style>

      <div class="wwo-calc">

        <div id="calc-display" class="calc-display">0</div>

        <div class="tabs">
          <button class="tab-btn active" data-tab="basic">Basic</button>
          <button class="tab-btn" data-tab="eng">Engineering</button>
        </div>

        <div class="tab-contents">
          <!-- Basic -->
          <div id="tab-basic">
            <div class="grid-keys">
              ${['C','±','%','÷','7','8','9','x','4','5','6','-','1','2','3','+','0','.','='].map(v=>{
                const cls = v==='=' ? 'equals' : (['÷','x','-','+'].includes(v) ? 'operator' : '');
                const extra = v==='0' ? 'key wide' : 'key';
                return `<button class="${extra} ${cls}" data-value="${v}">${v}</button>`;
              }).join('')}
            </div>
            <div class="muted">Tip: Use keyboard — digits, + − × /, Enter, Esc, Backspace.</div>
          </div>

          <!-- Engineering -->
          <div id="tab-eng" style="display:none;padding:4px 0 6px;">
            <div class="eng-header">Wastewater / Hydraulics Tools</div>
            <div class="eng-buttons">
              <button class="eng-btn" data-fn="manning">Manning Q</button>
              <button class="eng-btn" data-fn="hazen">Hazen–Williams</button>
              <button class="eng-btn" data-fn="darcy">Darcy–Weisbach</button>
              <button class="eng-btn" data-fn="reynolds">Reynolds No.</button>
              <button class="eng-btn" data-fn="continuity">Continuity</button>
              <button class="eng-btn" data-fn="detention">Detention Time</button>
              <button class="eng-btn" data-fn="overflow">Overflow Rate</button>
              <button class="eng-btn" data-fn="bodremove">BOD Removal %</button>
              <button class="eng-btn" data-fn="pumppower">Pump Power</button>
              <button class="eng-btn" data-fn="flowconv">Flow Convert</button>
              <button class="eng-btn" data-fn="lengthconv">Length Convert</button>
            </div>
            <div id="eng-panel" class="panel"></div>
          </div>
        </div>
      </div>
    `;

    // ---------- State ----------
    const display = win.contentEl.querySelector('#calc-display');
    const keys = win.contentEl.querySelectorAll('#tab-basic .key');
    let current = '0', previous = '', op = null, reset = false;

    const fmt = n => {
      if (!isFinite(n)) return '∞';
      const s = Math.abs(n) >= 1e10 || (Math.abs(n) > 0 && Math.abs(n) < 1e-6)
        ? n.toExponential(6)
        : n.toLocaleString(undefined, { maximumFractionDigits: 12 });
      return s.replace(/(?:\.0+|(\.\d*?[1-9]))0+$/,'$1'); // trim trailing zeros
    };

    const update = () => display.textContent = current;

    // ---------- Basic calculator ----------
    keys.forEach(btn => btn.addEventListener('click', () => handle(btn.getAttribute('data-value'))));

    const handle = v => {
      if ('0123456789.'.includes(v)) {
        if (v === '.' && current.includes('.')) return;
        if (current === '0' || reset) { current = (v === '.') ? '0.' : v; reset = false; }
        else current += v;
        return update();
      }
      if (['+','-','x','÷'].includes(v)) {
        if (op) compute();
        previous = current; op = v; reset = true; return;
      }
      if (v === '=') { compute(); return; }
      if (v === 'C') { current='0'; previous=''; op=null; reset=false; return update(); }
      if (v === '±') { const x = parseFloat(current)||0; current = (-x).toString(); return update(); }
      if (v === '%') { const x = parseFloat(current)||0; current = (x/100).toString(); return update(); }
    };

    const compute = () => {
      const a = parseFloat(previous), b = parseFloat(current);
      if (Number.isNaN(a) || Number.isNaN(b)) return;
      let r;
      switch (op) {
        case '+': r = a + b; break;
        case '-': r = a - b; break;
        case 'x': r = a * b; break;
        case '÷': r = a / b; break;
        default: return;
      }
      current = fmt(r); op=null; previous=''; reset=true; update();
    };

    // Keyboard support
    const onKey = (e) => {
      const k = e.key;
      if ((k >= '0' && k <= '9') || k === '.') return handle(k);
      if (k === '+' || k === '-') return handle(k);
      if (k === '*' ) return handle('x');
      if (k === '/' ) return handle('÷');
      if (k === 'Enter' || k === '=') return handle('=');
      if (k === 'Escape') return handle('C');
      if (k === 'Backspace') { // backspace digit
        if (reset) { current = '0'; reset = false; }
        else current = (current.length > 1) ? current.slice(0,-1) : '0';
        return update();
      }
    };
    win.el.addEventListener('keydown', onKey);
    // focus window content to receive keys
    win.contentEl.tabIndex = 0;
    win.contentEl.focus();

    // ---------- Tabs ----------
    const tabs = win.contentEl.querySelectorAll('.tab-btn');
    tabs.forEach(btn => btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      win.contentEl.querySelector('#tab-basic').style.display = (btn.dataset.tab === 'basic') ? '' : 'none';
      win.contentEl.querySelector('#tab-eng').style.display   = (btn.dataset.tab === 'eng') ? '' : 'none';
      win.contentEl.focus();
    }));

    // ---------- Engineering tools ----------
    const engPanel = win.contentEl.querySelector('#eng-panel');
    const setPanel = (html) => { engPanel.innerHTML = html; };

    // helpers
    const val = id => parseFloat(win.contentEl.querySelector('#'+id).value);

    const showManning = () => setPanel(`
      <div>
        <label>Manning n</label><input id="mann-n" type="number" value="0.013" step="0.001">
        <label>Diameter D (m)</label><input id="mann-d" type="number" value="0.6" step="0.05">
        <label>Slope S (m/m)</label><input id="mann-s" type="number" value="0.001" step="0.0001">
        <button class="action" id="mann-go">Calculate</button>
        <div class="muted">Q = (1/n) · A · R<sup>2/3</sup> · S<sup>1/2</sup>, circular full: A=πD²/4, R=D/4</div>
      </div>
    `);

    const showHazen = () => setPanel(`
      <div>
        <label>Flow Q (m³/s)</label><input id="haz-q" type="number" value="0.05" step="0.005">
        <label>Diameter D (m)</label><input id="haz-d" type="number" value="0.15" step="0.01">
        <label>Length L (m)</label><input id="haz-l" type="number" value="100" step="10">
        <label>C (Hazen–Williams)</label><input id="haz-c" type="number" value="130" step="1">
        <button class="action" id="haz-go">Calculate</button>
        <div class="muted">h<sub>f</sub> = 10.67 L Q<sup>1.852</sup> / (C<sup>1.852</sup> D<sup>4.87</sup>)</div>
      </div>
    `);

    const showDarcy = () => setPanel(`
      <div>
        <label>Flow Q (m³/s)</label><input id="dar-q" type="number" value="0.1" step="0.01">
        <label>Diameter D (m)</label><input id="dar-d" type="number" value="0.3" step="0.01">
        <label>Length L (m)</label><input id="dar-l" type="number" value="100" step="10">
        <label>Friction f (Darcy)</label><input id="dar-f" type="number" value="0.02" step="0.001">
        <button class="action" id="dar-go">Calculate</button>
        <div class="muted">h<sub>f</sub> = f (L/D) V² / (2g), V = Q/A</div>
      </div>
    `);

    const showRe = () => setPanel(`
      <div>
        <label>Velocity V (m/s)</label><input id="re-v" type="number" value="1" step="0.1">
        <label>Diameter D (m)</label><input id="re-d" type="number" value="0.3" step="0.01">
        <label>Kinematic ν (m²/s)</label><input id="re-nu" type="number" value="0.000001" step="any">
        <button class="action" id="re-go">Calculate</button>
        <div class="muted">Re = V D / ν</div>
      </div>
    `);

    const showContinuity = () => setPanel(`
      <div>
        <label>Flow Q (m³/s)</label><input id="con-q" type="number" value="0.1" step="0.01">
        <label>Area A (m²)</label><input id="con-a" type="number" value="0.2" step="0.01">
        <button class="action" id="con-go">Calculate</button>
        <div class="muted">V = Q / A</div>
      </div>
    `);

    const showDetention = () => setPanel(`
      <div>
        <label>Volume V (m³)</label><input id="det-v" type="number" value="1000" step="10">
        <label>Flow Q (m³/s)</label><input id="det-q" type="number" value="0.1" step="0.01">
        <button class="action" id="det-go">Calculate</button>
        <div class="muted">t = V/Q (shown in hours)</div>
      </div>
    `);

    const showOverflow = () => setPanel(`
      <div>
        <label>Flow Q (m³/s)</label><input id="ovr-q" type="number" value="0.1" step="0.01">
        <label>Surface Area A (m²)</label><input id="ovr-a" type="number" value="100" step="1">
        <button class="action" id="ovr-go">Calculate</button>
        <div class="muted">Surface overflow rate (m/d)</div>
      </div>
    `);

    const showBOD = () => setPanel(`
      <div>
        <label>Influent BOD (mg/L)</label><input id="bod-in" type="number" value="200" step="1">
        <label>Effluent BOD (mg/L)</label><input id="bod-out" type="number" value="20" step="1">
        <button class="action" id="bod-go">Calculate</button>
        <div class="muted">Removal % = (In - Out) / In × 100</div>
      </div>
    `);

    const showPumpPower = () => setPanel(`
      <div>
        <label>Flow Q (m³/s)</label><input id="pmp-q" type="number" value="0.1" step="0.01">
        <label>Head H (m)</label><input id="pmp-h" type="number" value="10" step="0.1">
        <label>Efficiency η (0–1)</label><input id="pmp-eff" type="number" value="0.8" step="0.05">
        <button class="action" id="pmp-go">Calculate</button>
        <div class="muted">P = ρ g Q H / η (kW)</div>
      </div>
    `);

    const showFlowConv = () => setPanel(`
      <div>
        <label>Value</label><input id="fc-val" type="number" value="100" step="any">
        <label>From</label>
        <select id="fc-from">
          <option value="gpm">gpm</option>
          <option value="cfs">cfs</option>
          <option value="m3s">m³/s</option>
          <option value="Ls">L/s</option>
          <option value="mgd">MGD</option>
        </select>
        <label>To</label>
        <select id="fc-to">
          <option value="gpm">gpm</option>
          <option value="cfs">cfs</option>
          <option value="m3s">m³/s</option>
          <option value="Ls">L/s</option>
          <option value="mgd">MGD</option>
        </select>
        <button class="action" id="fc-go">Convert</button>
        <div class="muted">Internal base: m³/s</div>
      </div>
    `);

    const showLengthConv = () => setPanel(`
      <div>
        <label>Value</label><input id="lc-val" type="number" value="5280" step="any">
        <label>From</label>
        <select id="lc-from">
          <option value="ft">ft (feet)</option>
          <option value="mi">mi (miles)</option>
          <option value="m">m (meters)</option>
          <option value="km">km (kilometers)</option>
        </select>
        <label>To</label>
        <select id="lc-to">
          <option value="mi">mi (miles)</option>
          <option value="ft">ft (feet)</option>
          <option value="m">m (meters)</option>
          <option value="km">km (kilometers)</option>
        </select>
        <button class="action" id="lc-go">Convert</button>
        <div class="muted">Built-ins: ft ⇄ mi are exact (1 mi = 5280 ft). Base: meters.</div>
      </div>
    `);

    // Wire buttons -> panels
const engBtns = win.contentEl.querySelectorAll('.eng-btn');
engBtns.forEach(b => {
  b.addEventListener('click', () => {
    // remove active from all
    engBtns.forEach(btn => btn.classList.remove('active'));
    // set this one active
    b.classList.add('active');

    const f = b.dataset.fn;
    if (f === 'manning')    { showManning(); }
    if (f === 'hazen')      { showHazen(); }
    if (f === 'darcy')      { showDarcy(); }
    if (f === 'reynolds')   { showRe(); }
    if (f === 'continuity') { showContinuity(); }
    if (f === 'detention')  { showDetention(); }
    if (f === 'overflow')   { showOverflow(); }
    if (f === 'bodremove')  { showBOD(); }
    if (f === 'pumppower')  { showPumpPower(); }
    if (f === 'flowconv')   { showFlowConv(); }
    if (f === 'lengthconv') { showLengthConv(); }
  });
});

// set default highlight on Manning
win.contentEl.querySelector('.eng-btn[data-fn="manning"]').classList.add('active');

    // Default panel
    showManning();

    // Calc handlers for panels
    engPanel.addEventListener('click', (e) => {
      const id = (e.target && e.target.id) || '';
      if (id === 'mann-go') {
        const n = val('mann-n'), D = val('mann-d'), S = val('mann-s');
        const A = Math.PI * (D**2) / 4, R = D/4;
        const Q = (1/n) * A * Math.pow(R, 2/3) * Math.sqrt(S);
        current = `Q = ${fmt(Q)} m³/s`; update();
      }
      if (id === 'haz-go') {
        const Q = val('haz-q'), d = val('haz-d'), L = val('haz-l'), C = val('haz-c');
        const hf = 10.67 * L * (Q**1.852) / ( (C**1.852) * (d**4.87) );
        current = `h_f = ${fmt(hf)} m`; update();
      }
      if (id === 'dar-go') {
        const Q = val('dar-q'), D = val('dar-d'), L = val('dar-l'), f = val('dar-f');
        const A = Math.PI * (D**2) / 4, V = Q / A, g = 9.81;
        const hf = f * (L/D) * (V**2) / (2*g);
        current = `h_f = ${fmt(hf)} m`; update();
      }
      if (id === 're-go') {
        const V = val('re-v'), D = val('re-d'), nu = val('re-nu');
        const Re = V * D / nu;
        current = `Re = ${fmt(Re)}`; update();
      }
      if (id === 'con-go') {
        const Q = val('con-q'), A = val('con-a');
        const V = Q / A;
        current = `V = ${fmt(V)} m/s`; update();
      }
      if (id === 'det-go') {
        const V = val('det-v'), Q = val('det-q');
        const t_hr = (V / Q) / 3600;
        current = `t = ${fmt(t_hr)} h`; update();
      }
      if (id === 'ovr-go') {
        const Q = val('ovr-q'), A = val('ovr-a');
        const sor = (Q / A) * 86400;
        current = `SOR = ${fmt(sor)} m/d`; update();
      }
      if (id === 'bod-go') {
        const In = val('bod-in'), Out = val('bod-out');
        const eff = ((In - Out) / In) * 100;
        current = `Efficiency = ${fmt(eff)} %`; update();
      }
      if (id === 'pmp-go') {
        const Q = val('pmp-q'), H = val('pmp-h'), eff = val('pmp-eff');
        const rho = 1000, g = 9.81;
        const PkW = (rho * g * Q * H) / eff / 1000;
        current = `P = ${fmt(PkW)} kW`; update();
      }
      if (id === 'fc-go') {
        const x = val('fc-val');
        const from = win.contentEl.querySelector('#fc-from').value;
        const to   = win.contentEl.querySelector('#fc-to').value;
        const to_m3s = {
          gpm: 0.0000630901964,
          cfs: 0.0283168466,
          m3s: 1,
          Ls:  0.001,
          mgd: 0.0438126364
        };
        const base = x * to_m3s[from];
        const out  = base / to_m3s[to];
        current = `${fmt(x)} ${from} = ${fmt(out)} ${to}`; update();
      }
      if (id === 'lc-go') {
        const x = val('lc-val');
        const from = win.contentEl.querySelector('#lc-from').value;
        const to   = win.contentEl.querySelector('#lc-to').value;
        // base: meters
        const to_m = {
          ft: 0.3048,
          mi: 1609.344, // exact: 5280 ft * 0.3048
          m:  1,
          km: 1000
        };
        const base = x * to_m[from];
        const out  = base / to_m[to];
        current = `${fmt(x)} ${from} = ${fmt(out)} ${to}`; update();
      }
    });
  }
};
