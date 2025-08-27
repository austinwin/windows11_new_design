// /apps/HelloWorld.js — simple template app (ESM)

const APP_ID = 'helloworld';
const APP_NAME = 'About';

function makeAppDef() {
  return {
    id: APP_ID,
    name: APP_NAME,
    icon: { type: 'svg', value: '<svg viewBox="0 0 24 24" width="32" height="32" fill="#0078d7"><circle cx="12" cy="12" r="10"/></svg>' },

    open(host) {
      // Create a window
      const win = host.createWindow({
        id: APP_ID,
        title: APP_NAME,
        width: 200,
        height: 200
      });

      // Root content
      const root = win.contentEl;
root.innerHTML = `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
              height:100%;font-family:'Segoe UI',sans-serif;text-align:center;padding:20px;">
    <h2 style="margin-bottom:10px;color:#0078d7;">About Sewer Desktop</h2>
    <p style="margin:6px 0;font-size:14px;color:#333;">
      Built with <span style="color:#e25555;">&#10084;&#65039;</span>, 
      brought to you by <strong>WWO [H.Ng]</strong>.
    </p>
    <p style="margin:6px 0;font-size:14px;color:#333;">
      Hopefully you enjoy using this desktop environment as much as I enjoyed building it.
    </p>
    <p style="margin:10px 0 0 0;font-size:12px;color:#666;">
      © ${new Date().getFullYear()} Sewer Desktop
    </p>
  </div>
`;

      // Example of using storage
      const store = host.storage(APP_ID);
      let count = store.load(0);
      count++;
      store.save(count);
      console.log(`HelloWorld app has been opened ${count} times`);
    }
  };
}

export default makeAppDef();
