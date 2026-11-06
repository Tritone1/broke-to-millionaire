const fs = require('node:fs');
const path = require('node:path');

const [, , port = '9223', pageUrl, outputName = 'runtime-screen.png'] = process.argv;
if (!pageUrl) throw new Error('Usage: node scripts/capture-local-screen.cjs <debug-port> <url> <output-name>');

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function main() {
  const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const page = pages.find((item) => item.type === 'page' && (item.url === 'about:blank' || item.url.startsWith('http')));
  if (!page?.webSocketDebuggerUrl) throw new Error('No debuggable Edge page was found.');

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  let commandId = 0;
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const callback = pending.get(message.id);
    if (!callback) return;
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message));
    else callback.resolve(message.result);
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++commandId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true });
  const navigationStartedAt = Date.now();
  await send('Page.navigate', { url: pageUrl });

  const deadline = Date.now() + 30_000;
  let ready = false;
  while (Date.now() < deadline) {
    const result = await send('Runtime.evaluate', {
      expression: `Boolean(document.body && document.body.innerText.length > 40 && !document.querySelector('[data-testid="avatar-loading"], [data-testid="scene-background-loading"]'))`,
      returnByValue: true,
    });
    ready = result.result?.value === true;
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error('The screen did not finish loading within 30 seconds.');
  await delay(500);
  const screenshot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const outputPath = path.join(__dirname, '..', 'artifacts', outputName);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
  socket.close();
  process.stdout.write(`${outputPath}\nready-after-ms=${Date.now() - navigationStartedAt}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
