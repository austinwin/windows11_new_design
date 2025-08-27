document.addEventListener("DOMContentLoaded", function() {
  const app = document.getElementById("app");
  if (!app) return;

  // baseline layout
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.title = "Sewer Desktop";
  document.body.style.margin = '0';
  app.style.height = '100vh';
  app.style.width = '100vw';
  app.style.overflow = 'hidden';

  fetch("./assets/main.html")
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const spinCastDoc = parser.parseFromString(html, "text/html");

      // styles
      const styleTags = Array.from(spinCastDoc.querySelectorAll('style'));
      const styleLinks = Array.from(spinCastDoc.querySelectorAll('link[rel="stylesheet"]'));
      const stylePromises = styleLinks.map(link => loadStylesheet(link.href));

      // container
      const container = spinCastDoc.querySelector('#container');
      if (!container) throw new Error("No #container found in main.html");
      const containerHtml = container.outerHTML;

      // scripts (inline classic + external classic)
      const inlineScripts = Array.from(spinCastDoc.querySelectorAll('script')).filter(s => !s.src);
      const externalScripts = Array.from(spinCastDoc.querySelectorAll('script[src]'));
      const scriptPromises = externalScripts.map(s => loadScript(s.src)); // classic

      return Promise.all([...stylePromises, ...scriptPromises]).then(() => {
        // mount styles
        styleTags.forEach(tag => {
          const el = document.createElement('style');
          el.textContent = tag.textContent;
          document.head.appendChild(el);
        });

        // inject desktop HTML
        app.innerHTML = containerHtml;

        // run inline classic scripts (NO modules here)
        inlineScripts.forEach(s => {
          const el = document.createElement('script');
          el.textContent = s.textContent;   // must not contain top-level await
          document.body.appendChild(el);
        });

        // init desktop then load apps as modules
setTimeout(async () => {
  if (typeof initDesktop === 'function') initDesktop();

  const modules = (window.APP_MODULES || []);
  // dynamically import and register each module
  for (const p of modules) {
    try {
      const mod = await import(p); // allowed inside async fn in classic script
      if (mod && mod.default) {
        window.AppRegistry.register(mod.default);
      } else {
        console.warn('No default export from', p);
      }
    } catch (e) {
      console.error('Failed to import module', p, e);
    }
  }
}, 0);     
      });
    })
    .catch(error => {
      console.error("Error loading Sewer Desktop:", error);
      app.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h2>Error Loading Content</h2>
          <p>Could not load the Sewer Desktop.</p>
          <p>Error: ${error.message}</p>
        </div>
      `;
    });
});

// -------- helpers --------
function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = url;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadModule(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-module-src="${url}"]`)) return resolve();
    const s = document.createElement('script');
    s.type = 'module';
    s.dataset.moduleSrc = url;
    s.src = url;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadStylesheet(url) {
  return new Promise((resolve) => {
    if (document.querySelector(`link[href="${url}"]`)) return resolve();
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = url;
    l.onload = resolve;
    document.head.appendChild(l);
  });
}
