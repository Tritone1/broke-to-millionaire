const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const requestedOutput = process.argv[2] ?? path.join('artifacts', 'creator-screens');
const outputDir = path.resolve(root, requestedOutput);
const profileDir = path.join(root, 'artifacts', 'edge-cdp-profile');
const port = 9333;
const origin = process.env.AVATAR_CAPTURE_ORIGIN ?? 'http://localhost:8089';

const cases = [
  ['male', 0, 'buzz'],
  ['male', 1, 'curly'],
  ['male', 2, 'side-sweep'],
  ['female', 3, 'long-waves'],
  ['female', 4, 'braids'],
  ['female', 5, 'pixie-sweep'],
];
const devices = [
  ['small', 320, 568],
  ['large', 430, 932],
];
const skinTones = [0, 2, 5];

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {}
    await wait(100);
  }
  throw new Error('Edge debugging endpoint did not start.');
}

function cdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  let nextId = 1;
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  return {
    ready,
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); },
  };
}

async function newTarget() {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Could not create Edge target: ${response.status}`);
  return response.json();
}

async function capture(label, width, height, gender, hair, styleName, skin, scrollBottom = false, outputName = null) {
  const target = await newTarget();
  const client = cdp(target.webSocketDebuggerUrl);
  await client.ready;
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: width,
    screenHeight: height,
  });
  await client.send('Page.navigate', { url: `${origin}/?preview=setup&gender=${gender}&hair=${hair}&skin=${skin}` });
  const deadline = Date.now() + 30_000;
  let ready = false;
  while (Date.now() < deadline) {
    const result = await client.send('Runtime.evaluate', {
      expression: `Boolean(document.body && document.body.innerText.includes('Create your look') && Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0))`,
      returnByValue: true,
    });
    ready = result.result?.value === true;
    if (ready) break;
    await wait(100);
  }
  if (!ready) throw new Error(`Avatar preview did not become ready: ${label}/${gender}/${styleName}/skin-${skin}`);
  if (scrollBottom) {
    await client.send('Runtime.evaluate', {
      expression: `(() => { const candidates = Array.from(document.querySelectorAll('*')).filter((element) => element.scrollHeight > element.clientHeight + 20); candidates.sort((first, second) => (second.scrollHeight - second.clientHeight) - (first.scrollHeight - first.clientHeight)); if (candidates[0]) candidates[0].scrollTop = candidates[0].scrollHeight; window.scrollTo(0, document.body.scrollHeight); return candidates.length; })()`,
      returnByValue: true,
    });
  }
  await wait(500);
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  const filename = outputName ?? `${label}-skin-${skin}-${gender}-${styleName}.png`;
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(screenshot.data, 'base64'));
  client.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  process.stdout.write(`${filename}\n`);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = spawn(edge, [
    '--headless=new',
    '--no-sandbox',
    '--hide-scrollbars',
    '--use-angle=swiftshader',
    '--disable-gpu-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  try {
    await waitForDebugger();
    for (const [label, width, height] of devices) {
      for (const skin of skinTones) {
        for (const [gender, hair, styleName] of cases) {
          await capture(label, width, height, gender, hair, styleName, skin);
        }
      }
      await capture(label, width, height, 'female', 5, 'pixie-sweep', 2, true, `${label}-form-bottom.png`);
    }
    const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json());
    const browserClient = cdp(version.webSocketDebuggerUrl);
    await browserClient.ready;
    await browserClient.send('Browser.close');
    browserClient.close();
  } finally {
    if (!browser.killed) browser.kill();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
