export function renderErrorPage(error?: any): string {
  const errorMsg = error instanceof Error ? error.message : String(error || "Unknown error");
  const errorStack = error instanceof Error ? error.stack : "";
  
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 48rem; width: 100%; padding: 2rem; background: #fff; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .text-center { text-align: center; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1.5rem; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
      pre { background: #f3f4f6; color: #ef4444; padding: 1rem; border-radius: 0.375rem; text-align: left; font-family: monospace; font-size: 0.875rem; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="text-center">
        <h1>This page didn't load</h1>
        <p>Something went wrong on our end. You can try refreshing or head back home.</p>
        <div class="actions">
          <button class="primary" onclick="location.reload()">Try again</button>
          <a class="secondary" href="/">Go home</a>
        </div>
      </div>
      ${error ? `
      <div>
        <h2 style="font-size: 1rem; margin: 1rem 0 0.5rem;">Error Details:</h2>
        <pre><code>${errorMsg}\n\n${errorStack}</code></pre>
      </div>` : ''}
    </div>
  </body>
</html>`;
}
