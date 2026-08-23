import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function serve() {
  return new Promise((resolveServer, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url || '/', 'http://127.0.0.1');
      const pathname = normalize(decodeURIComponent(url.pathname).replace(/^\/Site100/, '') || '/').replace(/^([.][.][/\\])+/, '');
      let path = join(dist, pathname);
      if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
      if (!existsSync(path)) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }
      response.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
      response.end(readFileSync(path));
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolveServer({ server, origin: `http://127.0.0.1:${server.address().port}/Site100` }));
  });
}

const { server, origin } = await serve();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const exceptions = [];

cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
  exceptions.push({
    text: exceptionDetails.text,
    url: exceptionDetails.url,
    line: exceptionDetails.lineNumber + 1,
    column: exceptionDetails.columnNumber + 1,
    description: exceptionDetails.exception?.description || exceptionDetails.exception?.value || ''
  });
});
await cdp.send('Runtime.enable');

try {
  const response = await page.goto(`${origin}/?moduleSmoke=1`, { waitUntil: 'domcontentloaded', timeout: 12000 });
  if (!response?.ok()) throw new Error(`HTTP ${response?.status() || 'unknown'}`);
  await page.waitForTimeout(300);
  const scripts = await page.evaluate(() => [...document.scripts].map((script) => ({
    type: script.type || 'classic',
    src: script.src || 'inline',
    text: script.src ? '' : script.textContent.slice(0, 80)
  })));
  if (exceptions.length) {
    console.error('Generated script tags:', JSON.stringify(scripts, null, 2));
    console.error('Runtime exceptions:', JSON.stringify(exceptions, null, 2));
    throw new Error(`Module scope smoke failed with ${exceptions.length} exception(s).`);
  }
  console.log(`Module scope smoke passed with ${scripts.length} script tags.`);
} finally {
  await cdp.detach().catch(() => {});
  await context.close();
  await browser.close();
  await new Promise((close) => server.close(close));
}
