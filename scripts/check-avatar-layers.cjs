const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const characterDir = path.join(root, 'assets', 'game', 'characters');
const resultPath = path.join(root, 'src', 'data', 'avatarLayerCheck.json');
const layout = require(path.join(root, 'src', 'data', 'avatarAnchorData.json'));
const alphaThreshold = 8;

function alphaAt(image, x, y) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return 0;
  return image.data[(y * image.width + x) * 4 + 3];
}

function longestConstantRun(values, minimum, label, coordinateFor) {
  let best = null;
  let start = 0;
  for (let index = 1; index <= values.length; index += 1) {
    const continues = index < values.length && values[index] !== null && values[index] === values[start];
    if (continues) continue;
    const length = index - start;
    if (values[start] !== null && length > minimum && (!best || length > best.length)) {
      best = { kind: label, length, ...coordinateFor(start, values[start]) };
    }
    start = index;
  }
  return best;
}

function silhouette(image) {
  const rows = Array.from({ length: image.height }, () => ({ left: null, right: null }));
  const columns = Array.from({ length: image.width }, () => ({ top: null, bottom: null }));
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (alphaAt(image, x, y) <= alphaThreshold) continue;
      rows[y].left = rows[y].left === null ? x : Math.min(rows[y].left, x);
      rows[y].right = rows[y].right === null ? x : Math.max(rows[y].right, x);
      columns[x].top = columns[x].top === null ? y : Math.min(columns[x].top, y);
      columns[x].bottom = columns[x].bottom === null ? y : Math.max(columns[x].bottom, y);
    }
  }
  return { rows, columns };
}

function hasFeather(image, x, y, side) {
  const direction = side === 'left' ? 1 : -1;
  for (let offset = -1; offset <= 3; offset += 1) {
    const alpha = alphaAt(image, x + direction * offset, y);
    if (alpha > alphaThreshold && alpha < 247) return true;
  }
  return false;
}

function hardDiagonal(rows, image, side) {
  const key = side === 'left' ? 'left' : 'right';
  const minimum = Math.round(image.height * 0.06);
  let start = 0;
  while (start < rows.length - 1) {
    const first = rows[start][key];
    const next = rows[start + 1][key];
    if (first === null || next === null) { start += 1; continue; }
    const delta = next - first;
    if (delta === 0 || Math.abs(delta) > 2 || hasFeather(image, first, start, side)) { start += 1; continue; }
    let end = start + 1;
    while (end < rows.length - 1) {
      const current = rows[end][key];
      const following = rows[end + 1][key];
      if (current === null || following === null || following - current !== delta || hasFeather(image, current, end, side)) break;
      end += 1;
    }
    const length = end - start + 1;
    if (length > minimum) return { kind: `hard-${side}-diagonal`, x: first, y: start, length };
    start = Math.max(start + 1, end);
  }
  return null;
}

function inspect(filename) {
  const image = PNG.sync.read(fs.readFileSync(path.join(characterDir, filename)));
  const violations = [];
  for (let x = 0; x < image.width; x += 1) {
    if (alphaAt(image, x, 0) > alphaThreshold) violations.push({ kind: 'canvas-top-border', x, y: 0, length: 1 });
    if (alphaAt(image, x, image.height - 1) > alphaThreshold) violations.push({ kind: 'canvas-bottom-border', x, y: image.height - 1, length: 1 });
  }
  for (let y = 0; y < image.height; y += 1) {
    if (alphaAt(image, 0, y) > alphaThreshold) violations.push({ kind: 'canvas-left-border', x: 0, y, length: 1 });
    if (alphaAt(image, image.width - 1, y) > alphaThreshold) violations.push({ kind: 'canvas-right-border', x: image.width - 1, y, length: 1 });
  }
  const { rows, columns } = silhouette(image);
  const verticalLimit = Math.round(image.height * 0.06);
  const horizontalLimit = Math.round(image.width * 0.06);
  const candidates = [
    longestConstantRun(rows.map((row) => row.left), verticalLimit, 'straight-left-edge', (y, x) => ({ x, y })),
    longestConstantRun(rows.map((row) => row.right), verticalLimit, 'straight-right-edge', (y, x) => ({ x, y })),
    longestConstantRun(columns.map((column) => column.top), horizontalLimit, 'straight-top-edge', (x, y) => ({ x, y })),
    longestConstantRun(columns.map((column) => column.bottom), horizontalLimit, 'straight-bottom-edge', (x, y) => ({ x, y })),
    hardDiagonal(rows, image, 'left'),
    hardDiagonal(rows, image, 'right'),
  ];
  for (const candidate of candidates) if (candidate) violations.push(candidate);
  return violations;
}

const files = [];
for (const style of layout.hairstyles) {
  for (const mode of ['portrait', 'full']) {
    for (const layer of ['back', 'front']) files.push(`avatar_${mode}_hair_${layer}_${style.id}.png`);
  }
}

const failures = [];
for (const filename of files) {
  for (const violation of inspect(filename)) failures.push({ filename, ...violation });
}

fs.writeFileSync(resultPath, `${JSON.stringify({ passed: failures.length === 0, checkedFiles: files.length, violations: failures }, null, 2)}\n`);

if (failures.length > 0) {
  process.stderr.write(`Avatar layer check failed with ${failures.length} violation(s):\n`);
  for (const failure of failures) process.stderr.write(`- ${failure.filename}: ${failure.kind} at (${failure.x},${failure.y}), length ${failure.length}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Avatar layer check passed: ${files.length} full-canvas hair layers have curved, feathered, border-safe alpha.\n`);
}
