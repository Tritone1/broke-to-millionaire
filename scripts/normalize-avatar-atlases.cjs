const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const characterDir = path.join(root, 'assets', 'game', 'characters');
const layout = require(path.join(root, 'src', 'data', 'avatarAnchorData.json'));
const alphaThreshold = 32;

function readPng(filename) {
  return PNG.sync.read(fs.readFileSync(path.join(characterDir, filename)));
}

function writePng(filename, image) {
  fs.writeFileSync(path.join(characterDir, filename), PNG.sync.write(image));
}

function alphaAt(image, x, y) {
  return image.data[(image.width * y + x) * 4 + 3];
}

function largestComponent(image, x0, y0, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let largest = null;

  for (let localY = 0; localY < height; localY += 1) {
    for (let localX = 0; localX < width; localX += 1) {
      const start = localY * width + localX;
      if (visited[start] || alphaAt(image, x0 + localX, y0 + localY) < alphaThreshold) continue;

      let read = 0;
      let write = 0;
      let count = 0;
      let minX = localX;
      let maxX = localX;
      let minY = localY;
      let maxY = localY;
      visited[start] = 1;
      queue[write++] = start;

      while (read < write) {
        const index = queue[read++];
        const x = index % width;
        const y = Math.floor(index / width);
        count += 1;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        const neighbors = [index - 1, index + 1, index - width, index + width];
        for (let direction = 0; direction < neighbors.length; direction += 1) {
          const next = neighbors[direction];
          const nextX = next % width;
          const nextY = Math.floor(next / width);
          if (next < 0 || next >= visited.length || visited[next]) continue;
          if (direction === 0 && x === 0) continue;
          if (direction === 1 && x === width - 1) continue;
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
          if (alphaAt(image, x0 + nextX, y0 + nextY) < alphaThreshold) continue;
          visited[next] = 1;
          queue[write++] = next;
        }
      }

      if (!largest || count > largest.count) {
        largest = { count, minX, maxX, minY, maxY, members: Array.from(queue.subarray(0, write)) };
      }
    }
  }

  if (!largest) throw new Error(`No visible component in cell ${x0},${y0}`);
  return largest;
}

function copyPixel(source, sourceX, sourceY, destination, destinationX, destinationY) {
  if (destinationX < 0 || destinationX >= destination.width || destinationY < 0 || destinationY >= destination.height) return;
  const sourceIndex = (source.width * sourceY + sourceX) * 4;
  const destinationIndex = (destination.width * destinationY + destinationX) * 4;
  destination.data[destinationIndex] = source.data[sourceIndex];
  destination.data[destinationIndex + 1] = source.data[sourceIndex + 1];
  destination.data[destinationIndex + 2] = source.data[sourceIndex + 2];
  destination.data[destinationIndex + 3] = source.data[sourceIndex + 3];
}

function normalizeHeadAtlas(inputName, outputName) {
  const source = readPng(inputName);
  if (source.width % 6 !== 0 || source.height % 2 !== 0) throw new Error(`${inputName} does not use a 6x2 grid`);
  const cellWidth = source.width / 6;
  const cellHeight = source.height / 2;
  const destination = new PNG({ width: source.width, height: source.height });
  const targetCenterX = (cellWidth - 1) / 2;

  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      const x0 = column * cellWidth;
      const y0 = row * cellHeight;
      const component = largestComponent(source, x0, y0, cellWidth, cellHeight);
      const minX = Math.max(0, component.minX - 2);
      const maxX = Math.min(cellWidth - 1, component.maxX + 2);
      const minY = Math.max(0, component.minY - 2);
      const maxY = Math.min(cellHeight - 1, component.maxY + 2);
      const centerX = (component.minX + component.maxX) / 2;
      const shiftX = Math.round(targetCenterX - centerX);
      const keep = new Uint8Array(cellWidth * cellHeight);
      for (const member of component.members) {
        const memberX = member % cellWidth;
        const memberY = Math.floor(member / cellWidth);
        for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
          for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
            const keepX = memberX + offsetX;
            const keepY = memberY + offsetY;
            if (keepX >= 0 && keepX < cellWidth && keepY >= 0 && keepY < cellHeight) keep[keepY * cellWidth + keepX] = 1;
          }
        }
      }

      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          if (!keep[y * cellWidth + x]) continue;
          copyPixel(source, x0 + x, y0 + y, destination, x0 + x + shiftX, y0 + y);
        }
      }
    }
  }

  writePng(outputName, destination);
}

function normalizeHairAtlas() {
  const source = readPng('hair_atlas_v2.png');
  if (source.width % 6 !== 0) throw new Error('hair_atlas_v2.png does not use a six-column grid');
  const sourceCellWidth = source.width / 6;
  const sourceCellHeight = source.height;
  const destinationCellWidth = 400;
  const destinationCellHeight = 800;
  const destination = new PNG({ width: destinationCellWidth * 6, height: destinationCellHeight });

  for (let column = 0; column < 6; column += 1) {
    const x0 = column * sourceCellWidth;
    const component = largestComponent(source, x0, 0, sourceCellWidth, sourceCellHeight);
    const minX = Math.max(0, component.minX - 2);
    const maxX = Math.min(sourceCellWidth - 1, component.maxX + 2);
    const minY = Math.max(0, component.minY - 2);
    const maxY = Math.min(sourceCellHeight - 1, component.maxY + 2);
    const sourceWidth = maxX - minX + 1;
    const sourceHeight = maxY - minY + 1;
    const scale = Math.min(360 / sourceWidth, 760 / sourceHeight, 1);
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    const targetX = column * destinationCellWidth + Math.round((destinationCellWidth - targetWidth) / 2);
    const targetY = Math.round(minY * destinationCellHeight / sourceCellHeight);

    for (let y = 0; y < targetHeight; y += 1) {
      for (let x = 0; x < targetWidth; x += 1) {
        const sourceX = x0 + minX + Math.min(sourceWidth - 1, Math.floor(x / scale));
        const sourceY = minY + Math.min(sourceHeight - 1, Math.floor(y / scale));
        copyPixel(source, sourceX, sourceY, destination, targetX + x, targetY + y);
      }
    }
  }

  writePng('hair_atlas_v3.png', destination);
}

function visibleBounds(image, x0, y0, width, height) {
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alphaAt(image, x0 + x, y0 + y) < alphaThreshold) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      count += 1;
    }
  }
  if (count === 0) throw new Error(`No visible pixels in cell ${x0},${y0}`);
  return { minX, maxX, minY, maxY, count };
}

function boundaryRunLengths(image, bounds) {
  let left = 0;
  let right = 0;
  let bottom = 0;
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    if (alphaAt(image, bounds.minX, y) >= alphaThreshold) left += 1;
    if (alphaAt(image, bounds.maxX, y) >= alphaThreshold) right += 1;
  }
  for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
    if (alphaAt(image, x, bounds.maxY) >= alphaThreshold) bottom += 1;
  }
  return { left, right, bottom };
}

function validateNormalizedAssets() {
  for (let skin = 0; skin < 6; skin += 1) {
    const filename = `head_atlas_v3_skin_${skin}.png`;
    const image = readPng(filename);
    if (image.width % 6 !== 0 || image.height % 2 !== 0) throw new Error(`${filename} does not use a 6x2 grid`);
    const cellWidth = image.width / 6;
    const cellHeight = image.height / 2;
    const expectedCenter = (cellWidth - 1) / 2;
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const bounds = visibleBounds(image, column * cellWidth, row * cellHeight, cellWidth, cellHeight);
        const actualCenter = (bounds.minX + bounds.maxX) / 2;
        if (Math.abs(actualCenter - expectedCenter) > 0.5) {
          throw new Error(`${filename} row ${row} column ${column} is off-center by ${actualCenter - expectedCenter}px`);
        }
        if (bounds.minX < 4 || bounds.maxX > cellWidth - 5) {
          throw new Error(`${filename} row ${row} column ${column} touches a horizontal cell boundary`);
        }
      }
    }
  }

  for (let skin = 0; skin < 6; skin += 1) {
    for (const [filename, cellHeight, centerY] of [
      [`avatar_portrait_neck_v8_skin_${skin}.png`, 512, null],
      [`avatar_full_neck_skin_${skin}.png`, 768, 171],
    ]) {
      const neck = readPng(filename);
      if (neck.width !== 512 * 6 || neck.height !== cellHeight * 2) throw new Error(`${filename} does not use the shared 6x2 avatar canvas`);
      for (let row = 0; row < 2; row += 1) {
        for (let column = 0; column < 6; column += 1) {
          const bounds = visibleBounds(neck, column * 512, row * cellHeight, 512, cellHeight);
          if (cellHeight === 512) {
            const gender = row === 1 ? 'female' : 'male';
            const fit = layout.portraitNeckFit[gender];
            const anchors = layout.genderAnchors[gender];
            const corridorHalfWidth = Math.max(fit.topHalfWidth, fit.midHalfWidth ?? 0, fit.bottomHalfWidth) + fit.feather;
            const component = largestComponent(neck, column * 512, row * cellHeight, 512, cellHeight);
            if (component.count !== bounds.count) throw new Error(`${filename} ${gender} row contains disconnected neck fragments`);
            if (alphaAt(neck, column * 512 + anchors.headCenterX, row * cellHeight + fit.endY - 8) < alphaThreshold) throw new Error(`${filename} row ${row} column ${column} has a gap at the neck base`);
            if (bounds.minX < 256 - corridorHalfWidth || bounds.maxX > 256 + corridorHalfWidth) throw new Error(`${filename} ${gender} row extends outside its configured neck corridor`);
            if (bounds.maxY > fit.endY) throw new Error(`${filename} ${gender} row extends below its configured neckline`);
            const collarTop = layout.outfits.casual[gender].collarTopY;
            for (let y = anchors.chin; y <= Math.min(collarTop, fit.endY); y += 1) {
              for (let x = 0; x < 512; x += 1) {
                if (x >= anchors.jawLeft && x <= anchors.jawRight) continue;
                if (alphaAt(neck, column * 512 + x, row * cellHeight + y) >= alphaThreshold) throw new Error(`${filename} ${gender} has stray alpha outside the jaw corridor at ${x},${y}`);
              }
            }
          } else if (bounds.minX < 160 || bounds.maxX > 352) {
            throw new Error(`${filename} row ${row} column ${column} extends outside the full-body neck corridor`);
          } else if (alphaAt(neck, column * 512 + 256, row * cellHeight + centerY) < alphaThreshold) {
            throw new Error(`${filename} row ${row} column ${column} has a gap at the neck base`);
          }
        }
      }
    }
  }

  for (const [filename, cellHeight, fits] of [
    ['avatar_portrait_neckline_front_v8.png', 512, layout.portraitNecklineFront],
    ['avatar_full_neckline_front.png', 768, layout.fullNecklineFront],
  ]) {
    const neckline = readPng(filename);
    if (neckline.width !== 512 * 2 || neckline.height !== cellHeight) throw new Error(`${filename} does not use the shared two-column avatar canvas`);
    for (let column = 0; column < 2; column += 1) {
      const gender = column === 1 ? 'female' : 'male';
      const bounds = visibleBounds(neckline, column * 512, 0, 512, cellHeight);
      const fit = cellHeight === 512 ? { ...fits[gender], startY: layout.outfits.casual[gender].collarTopY } : fits[gender];
      if (bounds.minY < fit.startY) throw new Error(`${filename} ${gender} foreground starts above its configured shirt edge`);
      if (bounds.minX < fit.centerX - fit.halfWidth || bounds.maxX > fit.centerX + fit.halfWidth) throw new Error(`${filename} ${gender} foreground extends into the rear hoodie collar`);
    }
  }

  const portraitOutfit = readPng('avatar_portrait_clothing_v8.png');
  if (portraitOutfit.width !== 512 * 2 || portraitOutfit.height !== 512) throw new Error('avatar_portrait_clothing_v8.png does not use the shared two-column canvas');
  for (let column = 0; column < 2; column += 1) {
    let bottomPixels = 0;
    for (let x = 0; x < 512; x += 1) {
      if (alphaAt(portraitOutfit, column * 512 + x, 511) >= alphaThreshold) bottomPixels += 1;
    }
    if (bottomPixels < 128) throw new Error(`avatar_portrait_clothing_v8.png column ${column} does not bleed through the frame bottom`);
  }

  const hair = readPng('hair_atlas_v3.png');
  if (hair.width % 6 !== 0) throw new Error('hair_atlas_v3.png does not use a six-column grid');
  const hairCellWidth = hair.width / 6;
  for (let column = 0; column < 6; column += 1) {
    const bounds = visibleBounds(hair, column * hairCellWidth, 0, hairCellWidth, hair.height);
    if (bounds.minX < 10 || bounds.maxX > hairCellWidth - 11) {
      throw new Error(`hair_atlas_v3.png column ${column} touches a neighboring cell`);
    }
  }

  for (const style of layout.hairstyles) {
    for (const [mode, height] of [['portrait', 512], ['full', 768]]) {
      for (const layer of ['back', 'front']) {
        const filename = `avatar_${mode}_hair_${layer}_${style.id}.png`;
        const image = readPng(filename);
        if (image.width !== 512 || image.height !== height) throw new Error(`${filename} is not a full shared avatar canvas`);
        const bounds = visibleBounds(image, 0, 0, image.width, image.height);
        if (bounds.minX <= 0 || bounds.maxX >= image.width - 1 || bounds.maxY >= image.height - 1) {
          throw new Error(`${filename} alpha touches a canvas edge and may be cropped`);
        }
        if (mode === 'portrait' && layer === 'back' && ['long-waves', 'high-ponytail'].includes(style.id)) {
          const runs = boundaryRunLengths(image, bounds);
          if (Math.max(runs.left, runs.right) > 64 || runs.bottom > 48) {
            throw new Error(`${filename} has a suspicious straight alpha boundary (${runs.left}/${runs.right}/${runs.bottom})`);
          }
        }
      }
    }
  }
}

if (!process.argv.includes('--check')) {
  for (let skin = 0; skin < 6; skin += 1) {
    normalizeHeadAtlas(`head_atlas_skin_${skin}.png`, `head_atlas_v3_skin_${skin}.png`);
  }
  normalizeHairAtlas();
}
validateNormalizedAssets();
process.stdout.write(process.argv.includes('--check')
  ? 'Validated centered heads and full-canvas avatar hair layers.\n'
  : 'Normalized and validated avatar source atlases and full-canvas layers.\n');
