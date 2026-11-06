const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const characterDir = path.join(root, 'assets', 'game', 'characters');
const layout = require(path.join(root, 'src', 'data', 'avatarAnchorData.json'));
const CELL = layout.canvas.width;
const FULL_HEIGHT = layout.canvas.fullHeight;

function read(name) {
  return PNG.sync.read(fs.readFileSync(path.join(characterDir, name)));
}

function write(name, image) {
  fs.writeFileSync(path.join(characterDir, name), PNG.sync.write(image));
}

function sample(source, x, y) {
  const sx = Math.max(0, Math.min(source.width - 1, Math.round(x)));
  const sy = Math.max(0, Math.min(source.height - 1, Math.round(y)));
  const index = (sy * source.width + sx) * 4;
  return [source.data[index], source.data[index + 1], source.data[index + 2], source.data[index + 3]];
}

function setPixel(destination, x, y, rgba) {
  if (x < 0 || x >= destination.width || y < 0 || y >= destination.height) return;
  const index = (y * destination.width + x) * 4;
  destination.data[index] = rgba[0];
  destination.data[index + 1] = rgba[1];
  destination.data[index + 2] = rgba[2];
  destination.data[index + 3] = rgba[3];
}

function blendPixel(destination, x, y, rgba) {
  if (x < 0 || x >= destination.width || y < 0 || y >= destination.height || rgba[3] === 0) return;
  const index = (y * destination.width + x) * 4;
  const sourceAlpha = rgba[3] / 255;
  const destinationAlpha = destination.data[index + 3] / 255;
  const outputAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
  if (outputAlpha === 0) return;
  for (let channel = 0; channel < 3; channel += 1) {
    destination.data[index + channel] = Math.round((rgba[channel] * sourceAlpha + destination.data[index + channel] * destinationAlpha * (1 - sourceAlpha)) / outputAlpha);
  }
  destination.data[index + 3] = Math.round(outputAlpha * 255);
}

function opaqueInteriorAbove(source, sourceRect, sourceX, sourceY) {
  for (let scanY = Math.floor(sourceY); scanY >= sourceRect.y; scanY -= 1) {
    const candidate = sample(source, sourceX, scanY);
    if (candidate[3] < 220) continue;
    return sample(source, sourceX, Math.max(sourceRect.y, scanY - 4));
  }
  return null;
}

function drawScaled(source, sourceRect, destination, destinationRect, cellOffsetX = 0, cellOffsetY = 0, includePixel = null, cellHeight = CELL, sampleOptions = null) {
  const startX = Math.max(0, Math.floor(destinationRect.x));
  const startY = Math.max(0, Math.floor(destinationRect.y));
  const endX = Math.min(CELL, Math.ceil(destinationRect.x + destinationRect.width));
  const destinationBottom = destinationRect.y + destinationRect.height;
  const extendedBottom = sampleOptions?.extendTransparentFromAbove ? Math.max(destinationBottom, sampleOptions.endY + 1) : destinationBottom;
  const endY = Math.min(cellHeight, Math.ceil(extendedBottom));
  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const inclusion = includePixel ? includePixel(x, y) : 1;
      if (!inclusion) continue;
      const u = (x + 0.5 - destinationRect.x) / destinationRect.width;
      const v = (y + 0.5 - destinationRect.y) / destinationRect.height;
      const sourceX = sourceRect.x + Math.max(0, Math.min(1, u)) * Math.max(0, sourceRect.width - 1);
      let sourceY = sourceRect.y + Math.max(0, Math.min(1, v)) * Math.max(0, sourceRect.height - 1);
      if (sampleOptions?.extendTransparentFromAbove && y >= sampleOptions.extensionStartY) {
        const heldV = (sampleOptions.extensionSampleY + 0.5 - destinationRect.y) / destinationRect.height;
        sourceY = sourceRect.y + Math.max(0, Math.min(1, heldV)) * Math.max(0, sourceRect.height - 1);
      }
      let rgba = sample(source, sourceX, sourceY);
      if (rgba[3] === 0 && sampleOptions?.extendTransparentFromAbove) {
        rgba = opaqueInteriorAbove(source, sourceRect, sourceX, sourceY) ?? rgba;
      }
      if (rgba[3] === 0) continue;
      if (typeof inclusion === 'number' && inclusion < 1) rgba[3] = Math.round(rgba[3] * inclusion);
      setPixel(destination, cellOffsetX + x, cellOffsetY + y, rgba);
    }
  }
}

function softNeckMask({ centerX, startY, midY, endY, topHalfWidth, midHalfWidth, bottomHalfWidth, bottomCurveDepth = 0, feather = 5 }) {
  return (x, y) => {
    const curveRatio = Math.min(1, Math.abs(x - centerX) / Math.max(1, bottomHalfWidth));
    const localEndY = endY - bottomCurveDepth * curveRatio * curveRatio;
    if (y < startY || y > localEndY) return false;
    const hasMiddleAnchor = typeof midY === 'number' && typeof midHalfWidth === 'number';
    const segmentStartY = hasMiddleAnchor && y > midY ? midY : startY;
    const segmentEndY = hasMiddleAnchor && y <= midY ? midY : endY;
    const segmentStartWidth = hasMiddleAnchor && y > midY ? midHalfWidth : topHalfWidth;
    const segmentEndWidth = hasMiddleAnchor && y <= midY ? midHalfWidth : bottomHalfWidth;
    const progress = Math.max(0, Math.min(1, (y - segmentStartY) / Math.max(1, segmentEndY - segmentStartY)));
    const halfWidth = segmentStartWidth + (segmentEndWidth - segmentStartWidth) * progress;
    const horizontalEdge = halfWidth - Math.abs(x - centerX);
    if (horizontalEdge <= 0) return false;
    const horizontalAlpha = Math.min(1, horizontalEdge / feather);
    const verticalAlpha = Math.min(1, (y - startY + 1) / feather, (localEndY - y + 1) / feather);
    return horizontalAlpha * verticalAlpha;
  };
}

function necklineForegroundMask({ centerX, startY, halfWidth, feather = 4 }) {
  return (x, y) => {
    if (y < startY) return false;
    const horizontalEdge = halfWidth - Math.abs(x - centerX);
    if (horizontalEdge <= 0) return false;
    return Math.min(1, horizontalEdge / feather, (y - startY + 1) / feather);
  };
}

function paintPortraitHoodInterior(destination, cellOffsetX, gender) {
  const centerX = layout.genderAnchors[gender].headCenterX;
  // The male hood lining belongs inside the collar, not directly beneath the
  // jaw. Painting from chin + 4 created the dark angular "neck notches" seen
  // in the creator even though the original neck artwork was continuous.
  const startY = gender === 'male'
    ? layout.outfits.casual.male.collarTopY - 28
    : layout.genderAnchors[gender].chin + 4;
  const endY = layout.anchors.shirtNeckline.y + 8;
  const color = gender === 'female' ? [8, 76, 96] : [12, 67, 73];
  for (let y = startY; y <= endY; y += 1) {
    const progress = (y - startY) / Math.max(1, endY - startY);
    const halfWidth = gender === 'male'
      ? 136 - progress * 28
      : 72 + progress * 64;
    for (let x = Math.floor(centerX - halfWidth); x <= Math.ceil(centerX + halfWidth); x += 1) {
      const destinationIndex = (y * destination.width + cellOffsetX + x) * 4;
      if (destination.data[destinationIndex + 3] > 12) continue;
      const edgeDistance = halfWidth - Math.abs(x - centerX);
      const alpha = Math.round(255 * Math.max(0, Math.min(1, edgeDistance / 4)));
      setPixel(destination, cellOffsetX + x, y, [...color, alpha]);
    }
  }
}

function portraitOutfitPlacement(gender) {
  const fit = layout.outfits.casual[gender];
  const anchors = layout.genderAnchors[gender];
  const width = fit.sourceWidth * fit.collarScaleX;
  const height = fit.sourceHeight;
  return {
    x: anchors.headCenterX - width / 2,
    y: anchors.shoulderLine - fit.sourceShoulderRatio * height + fit.collarOffsetY,
    width,
    height,
  };
}

function headForegroundMask({ centerX, chinY, neckEndY, jawHalfWidth, neckHalfWidth, feather = 5 }) {
  return (x, y) => {
    if (y <= chinY) return 1;
    const progress = Math.max(0, Math.min(1, (y - chinY) / Math.max(1, neckEndY - chinY)));
    const halfWidth = neckHalfWidth + (jawHalfWidth - neckHalfWidth) * (1 - progress) ** 2;
    const distance = Math.abs(x - centerX);
    const horizontalEdge = halfWidth - distance;
    if (horizontalEdge <= 0) return false;
    const curveRatio = Math.min(1, distance / Math.max(1, neckHalfWidth));
    const localEndY = neckEndY - 4 * curveRatio * curveRatio;
    if (y >= localEndY) return false;
    const horizontalAlpha = Math.min(1, horizontalEdge / feather);
    const verticalAlpha = Math.min(1, (localEndY - y) / feather);
    return horizontalAlpha * verticalAlpha;
  };
}

function headCellRect(source, column, row) {
  return { x: column * (source.width / 6), y: row * (source.height / 2), width: source.width / 6, height: source.height / 2 };
}

function transformFullRect(rect) {
  const transform = layout.fullCanvasTransform;
  return {
    x: transform.x + rect.x * transform.scale,
    y: transform.y + rect.y * transform.scale,
    width: rect.width * transform.scale,
    height: rect.height * transform.scale,
  };
}

function buildHeadAtlases() {
  for (let skin = 0; skin < 6; skin += 1) {
    const source = read(`head_atlas_v3_skin_${skin}.png`);
    const portrait = new PNG({ width: CELL * 6, height: CELL * 2 });
    const portraitNeck = new PNG({ width: CELL * 6, height: CELL * 2 });
    const full = new PNG({ width: CELL * 6, height: FULL_HEIGHT * 2 });
    const fullNeck = new PNG({ width: CELL * 6, height: FULL_HEIGHT * 2 });
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const sourceRect = headCellRect(source, column, row);
        const gender = row === 1 ? 'female' : 'male';
        const portraitNeckFit = layout.portraitNeckFit[gender];
        const genderAnchors = layout.genderAnchors[gender];
        const maleNeckForeground = softNeckMask({
          centerX: genderAnchors.headCenterX,
          // Start inside the jaw and continue through the hood opening.  The
          // previous mask stopped at the top of the lining, leaving a short
          // rectangular neck sitting above a separate dark collar crescent.
          startY: genderAnchors.chin - 12,
          midY: 390,
          endY: layout.anchors.shirtNeckline.y + 4,
          topHalfWidth: 76,
          midHalfWidth: 55,
          bottomHalfWidth: 78,
          bottomCurveDepth: 10,
          feather: 5,
        });
        const portraitHeadMask = gender === 'male'
          ? (x, y) => (y <= genderAnchors.chin ? 1 : maleNeckForeground(x, y))
          : headForegroundMask({
            centerX: genderAnchors.headCenterX,
            chinY: genderAnchors.chin,
            neckEndY: genderAnchors.chin + 22,
            jawHalfWidth: 70,
            neckHalfWidth: 57,
            feather: 3,
          });
        drawScaled(source, sourceRect, portrait, layout.headPlacement, column * CELL, row * CELL, portraitHeadMask);
        // The head atlas already contains the matching illustrated neck and
        // upper chest. Extract that original artwork behind the front collar
        // instead of substituting an independently generated neck asset.
        drawScaled(source, sourceRect, portraitNeck, layout.headPlacement, column * CELL, row * CELL, softNeckMask({
          centerX: genderAnchors.headCenterX,
          ...portraitNeckFit,
        }));
        const bodyPlacement = layout.fullBodyPlacement[gender];
        const headPlacement = layout.fullHeadPlacement[gender];
        const alignedHead = { ...headPlacement, y: headPlacement.y + bodyPlacement.y };
        const fullDestination = transformFullRect(alignedHead);
        drawScaled(source, sourceRect, full, fullDestination, column * CELL, row * FULL_HEIGHT, headForegroundMask({
          centerX: layout.fullBodyAnchors.chin.x,
          chinY: layout.fullBodyAnchors.chin.y,
          neckEndY: layout.fullBodyAnchors.neckBase.y + 8,
          jawHalfWidth: gender === 'female' ? 48 : 50,
          neckHalfWidth: gender === 'female' ? 34 : 32,
          feather: 3,
        }), FULL_HEIGHT);
        drawScaled(source, sourceRect, fullNeck, fullDestination, column * CELL, row * FULL_HEIGHT, softNeckMask({
          centerX: layout.fullBodyAnchors.neckBase.x,
          startY: layout.fullBodyAnchors.chin.y - 3,
          endY: layout.fullBodyAnchors.shoulders.y - 8,
          topHalfWidth: 38,
          bottomHalfWidth: 24,
          feather: 3,
        }), FULL_HEIGHT);
      }
    }
    write(`avatar_portrait_head_v8_skin_${skin}.png`, portrait);
    // Version every changed portrait layer together. Metro/Expo cache static
    // require() assets by path, so overwriting a PNG can leave a device showing
    // old geometry even after the generator has produced corrected pixels.
    write(`avatar_portrait_neck_v8_skin_${skin}.png`, portraitNeck);
    write(`avatar_full_head_skin_${skin}.png`, full);
    write(`avatar_full_neck_skin_${skin}.png`, fullNeck);
  }
}

function hairDestination(headPlacement, style, gender, mode) {
  const fit = style.modeFits?.[mode]?.[gender] ?? style.genderFits?.[gender] ?? style.fit;
  const ratio = headPlacement.width / layout.headPlacement.width;
  const centerX = headPlacement.x + headPlacement.width / 2;
  const centerY = headPlacement.y + headPlacement.height / 2;
  const baseX = headPlacement.x + (layout.hairSourcePlacement.x - layout.headPlacement.x) * ratio;
  const baseY = headPlacement.y + (layout.hairSourcePlacement.y - layout.headPlacement.y) * ratio;
  const width = layout.hairSourcePlacement.width * ratio;
  const height = layout.hairSourcePlacement.height * ratio;
  return {
    x: centerX + (baseX - centerX) * fit.scale + fit.x * ratio,
    y: centerY + (baseY - centerY) * fit.scale + fit.y * ratio,
    width: width * fit.scale,
    height: height * fit.scale,
  };
}

function frontMask(style, headPlacement) {
  const ratio = headPlacement.width / layout.headPlacement.width;
  const earY = headPlacement.y + (layout.anchors.earLeft.y - layout.headPlacement.y) * ratio;
  const earLeftX = headPlacement.x + (layout.anchors.earLeft.x - layout.headPlacement.x) * ratio;
  const earRightX = headPlacement.x + (layout.anchors.earRight.x - layout.headPlacement.x) * ratio;
  const centerX = headPlacement.x + (layout.anchors.headCenter.x - layout.headPlacement.x) * ratio;
  const hairline = headPlacement.y + (layout.anchors.hairline.y - layout.headPlacement.y) * ratio;
  const capFeather = 12 * ratio;
  const capAlpha = (x, y) => {
    const boundary = hairline + 48 * ratio - Math.abs(x - centerX) * 0.34;
    return Math.max(0, Math.min(1, (boundary - y + capFeather) / Math.max(1, capFeather)));
  };
  const ponytailCapAlpha = (x, y) => {
    const distance = Math.abs(x - centerX) / Math.max(1, 80 * ratio);
    const boundary = hairline + (2 - 16 * distance ** 1.5) * ratio;
    return Math.max(0, Math.min(1, (boundary - y + 12 * ratio) / Math.max(1, 12 * ratio)));
  };
  const cutoffAnchor = layout.anchors[style.frontCutoffAnchor ?? 'chin'];
  const cutoff = headPlacement.y + (cutoffAnchor.y - layout.headPlacement.y) * ratio;
  const earRadiusX = layout.earMaskRadius.x * ratio;
  const earRadiusY = layout.earMaskRadius.y * ratio;
  return (x, y) => {
    if (style.id === 'long-waves') {
      return capAlpha(x, y);
    }
    if (style.id === 'braids') {
      const side = x < centerX ? -1 : 1;
      const phase = side < 0 ? 0.4 : 2.1;
      const strandCenter = centerX + side * (104 * ratio + 3 * ratio * Math.sin((y - hairline) / Math.max(1, 14 * ratio) + phase));
      const strandHalfWidth = (21 + 2 * Math.sin((y - hairline) / Math.max(1, 19 * ratio) + phase)) * ratio;
      const strandDistance = Math.abs(x - strandCenter);
      const strandAlpha = Math.max(0, Math.min(1, (strandHalfWidth - strandDistance) / Math.max(1, 6 * ratio)));
      return Math.max(capAlpha(x, y), strandAlpha);
    }
    if (style.id === 'high-ponytail') {
      return ponytailCapAlpha(x, y);
    }
    if (y > cutoff) return false;
    if (style.id === 'side-sweep') return true;
    const overLeftEar = ((x - earLeftX) / earRadiusX) ** 2 + ((y - earY) / earRadiusY) ** 2 < 1;
    const overRightEar = ((x - earRightX) / earRadiusX) ** 2 + ((y - earY) / earRadiusY) ** 2 < 1;
    return !overLeftEar && !overRightEar;
  };
}

function hairEdgeMask(style, headPlacement) {
  const ratio = headPlacement.width / layout.headPlacement.width;
  const centerX = headPlacement.x + (layout.anchors.headCenter.x - layout.headPlacement.x) * ratio;
  const curveStart = headPlacement.y + (layout.anchors.headTop.y - layout.headPlacement.y) * ratio;
  const curveEnd = headPlacement.y + (layout.anchors.shoulderLine.y - layout.headPlacement.y) * ratio;
  const sourceBottom = headPlacement.y + (style.bounds.bottom - layout.headPlacement.y) * ratio;
  return (x, y) => {
    let horizontalAlpha = 1;
    if (style.id === 'long-waves' || style.id === 'high-ponytail') {
      const progress = Math.max(0, Math.min(1, (y - curveStart) / Math.max(1, curveEnd - curveStart)));
      // Keep the mask comfortably inside the source bitmap's trimmed edge. This
      // creates a soft silhouette instead of exposing the source's rectangular cut.
      let halfWidth = style.id === 'long-waves'
        ? (150 + 28 * Math.sin(Math.PI * progress) - 35 * progress ** 2) * ratio
        : (136 + 18 * Math.sin(Math.PI * progress) - 22 * progress ** 2) * ratio;
      const phase = x < centerX ? 0.35 : 1.8;
      const waveStrength = style.id === 'long-waves' ? 5 : 3;
      halfWidth += waveStrength * ratio * Math.sin((y - curveStart) / Math.max(1, 15 * ratio) + phase);
      const feather = (style.id === 'long-waves' ? 5 : 12) * ratio;
      const edgeDistance = halfWidth - Math.abs(x - centerX);
      horizontalAlpha = Math.max(0, Math.min(1, edgeDistance / Math.max(1, feather)));
    } else if (style.id === 'curly' || style.id === 'side-sweep') {
      const progress = Math.max(0, Math.min(1, (y - curveStart) / Math.max(1, curveEnd - curveStart)));
      const baseHalfWidth = style.id === 'curly' ? 164 : 176;
      const phase = x < centerX ? 0.25 : 1.65;
      const halfWidth = (baseHalfWidth + 8 * Math.sin(Math.PI * progress) - 10 * progress ** 2
        + 4 * Math.sin((y - curveStart) / Math.max(1, 14 * ratio) + phase)) * ratio;
      horizontalAlpha = Math.max(0, Math.min(1, (halfWidth - Math.abs(x - centerX)) / Math.max(1, 5 * ratio)));
    }
    const normalizedX = Math.min(1, Math.abs(x - centerX) / Math.max(1, 180 * ratio));
    const localBottom = sourceBottom - (style.id === 'long-waves' || style.id === 'high-ponytail'
      ? (12 * normalizedX ** 2 + 3 * Math.sin(x / Math.max(1, 17 * ratio))) * ratio
      : 0);
    const bottomFadeStart = localBottom - 10 * ratio;
    const verticalAlpha = y <= bottomFadeStart ? 1 : Math.max(0, Math.min(1, (localBottom - y) / Math.max(1, 10 * ratio)));
    return horizontalAlpha * verticalAlpha;
  };
}

function combineMasks(...masks) {
  return (x, y) => masks.reduce((alpha, mask) => alpha * Number(mask(x, y)), 1);
}

function buildHairAtlases() {
  const source = read('hair_atlas_v3.png');
  // The original ponytail and replacement bun both had incompatible face
  // openings. The third female slot now reuses the proven side-sweep source
  // and its validated anchors as a short pixie sweep.
  const replacementPixieStyle = layout.hairstyles[2];
  const sourceCellWidth = source.width / 6;
  const atlases = {
    male: {
      portraitBack: new PNG({ width: CELL * 3, height: CELL }),
      portraitFront: new PNG({ width: CELL * 3, height: CELL }),
      fullBack: new PNG({ width: CELL * 3, height: FULL_HEIGHT }),
      fullFront: new PNG({ width: CELL * 3, height: FULL_HEIGHT }),
    },
    female: {
      portraitBack: new PNG({ width: CELL * 3, height: CELL }),
      portraitFront: new PNG({ width: CELL * 3, height: CELL }),
      fullBack: new PNG({ width: CELL * 3, height: FULL_HEIGHT }),
      fullFront: new PNG({ width: CELL * 3, height: FULL_HEIGHT }),
    },
  };
  for (const [row, gender] of ['male', 'female'].entries()) {
    const atlas = atlases[gender];
    for (let localColumn = 0; localColumn < 3; localColumn += 1) {
      const sourceColumn = row * 3 + localColumn;
      const style = layout.hairstyles[sourceColumn];
      const sourceRect = { x: sourceColumn * sourceCellWidth, y: 0, width: sourceCellWidth, height: source.height };
      const usesReplacementPixie = gender === 'female' && style.id === 'high-ponytail';
      const portraitSource = source;
      const portraitSourceRect = usesReplacementPixie
        ? { x: 2 * sourceCellWidth, y: 0, width: sourceCellWidth, height: source.height }
        : sourceRect;
      const portraitDestination = usesReplacementPixie
        ? hairDestination(layout.headPlacement, replacementPixieStyle, gender, 'portrait')
        : hairDestination(layout.headPlacement, style, gender, 'portrait');
      const portraitMaskStyle = usesReplacementPixie ? replacementPixieStyle : style;
      const portraitEdgeMask = hairEdgeMask(portraitMaskStyle, layout.headPlacement);
      const portraitFrontMask = combineMasks(portraitEdgeMask, frontMask(portraitMaskStyle, layout.headPlacement));
      drawScaled(portraitSource, portraitSourceRect, atlas.portraitBack, portraitDestination, localColumn * CELL, 0, portraitEdgeMask);
      drawScaled(portraitSource, portraitSourceRect, atlas.portraitFront, portraitDestination, localColumn * CELL, 0, portraitFrontMask);
      const portraitBackLayer = new PNG({ width: CELL, height: CELL });
      const portraitFrontLayer = new PNG({ width: CELL, height: CELL });
      drawScaled(portraitSource, portraitSourceRect, portraitBackLayer, portraitDestination, 0, 0, portraitEdgeMask);
      drawScaled(portraitSource, portraitSourceRect, portraitFrontLayer, portraitDestination, 0, 0, portraitFrontMask);
      write(`avatar_portrait_hair_back_v7_${style.id}.png`, portraitBackLayer);
      write(`avatar_portrait_hair_front_v7_${style.id}.png`, portraitFrontLayer);
      const bodyPlacement = layout.fullBodyPlacement[gender];
      const headPlacement = layout.fullHeadPlacement[gender];
      const placement = { ...headPlacement, y: headPlacement.y + bodyPlacement.y };
      const destination = transformFullRect(hairDestination(
        placement,
        usesReplacementPixie ? replacementPixieStyle : style,
        gender,
        'full',
      ));
      const fullPlacement = transformFullRect(placement);
      const fullMaskStyle = usesReplacementPixie ? replacementPixieStyle : style;
      const fullEdgeMask = hairEdgeMask(fullMaskStyle, fullPlacement);
      const fullFrontMask = combineMasks(fullEdgeMask, frontMask(fullMaskStyle, fullPlacement));
      const fullSource = source;
      const fullSourceRect = usesReplacementPixie
        ? { x: 2 * sourceCellWidth, y: 0, width: sourceCellWidth, height: source.height }
        : sourceRect;
      drawScaled(fullSource, fullSourceRect, atlas.fullBack, destination, localColumn * CELL, 0, fullEdgeMask, FULL_HEIGHT);
      drawScaled(fullSource, fullSourceRect, atlas.fullFront, destination, localColumn * CELL, 0, fullFrontMask, FULL_HEIGHT);
      const fullBackLayer = new PNG({ width: CELL, height: FULL_HEIGHT });
      const fullFrontLayer = new PNG({ width: CELL, height: FULL_HEIGHT });
      drawScaled(fullSource, fullSourceRect, fullBackLayer, destination, 0, 0, fullEdgeMask, FULL_HEIGHT);
      drawScaled(fullSource, fullSourceRect, fullFrontLayer, destination, 0, 0, fullFrontMask, FULL_HEIGHT);
      write(`avatar_full_hair_back_v4_${style.id}.png`, fullBackLayer);
      write(`avatar_full_hair_front_v4_${style.id}.png`, fullFrontLayer);
    }
  }
  for (const gender of ['male', 'female']) {
    const atlas = atlases[gender];
    write(`avatar_portrait_hair_back_v7_${gender}.png`, atlas.portraitBack);
    write(`avatar_portrait_hair_front_v7_${gender}.png`, atlas.portraitFront);
    write(`avatar_full_hair_back_v4_${gender}.png`, atlas.fullBack);
    write(`avatar_full_hair_front_v4_${gender}.png`, atlas.fullFront);
  }
  const visibleBounds = layout.hairstyles.map((style, sourceColumn) => {
    const gender = sourceColumn < 3 ? 'male' : 'female';
    const portraitBack = atlases[gender].portraitBack;
    const portraitFront = atlases[gender].portraitFront;
    const cellLeft = (sourceColumn % 3) * CELL;
    const bounds = { id: style.id, left: CELL, top: CELL, right: -1, bottom: -1, leftRun: 0, rightRun: 0, bottomRun: 0, leftEyeCoverage: 0, rightEyeCoverage: 0 };
    for (let y = 0; y < CELL; y += 1) {
      for (let x = 0; x < CELL; x += 1) {
        const alpha = portraitBack.data[(y * portraitBack.width + cellLeft + x) * 4 + 3];
        if (alpha <= 8) continue;
        bounds.left = Math.min(bounds.left, x);
        bounds.top = Math.min(bounds.top, y);
        bounds.right = Math.max(bounds.right, x);
        bounds.bottom = Math.max(bounds.bottom, y);
      }
    }
    for (let y = bounds.top; y <= bounds.bottom; y += 1) {
      if (portraitBack.data[(y * portraitBack.width + cellLeft + bounds.left) * 4 + 3] > 8) bounds.leftRun += 1;
      if (portraitBack.data[(y * portraitBack.width + cellLeft + bounds.right) * 4 + 3] > 8) bounds.rightRun += 1;
    }
    for (let x = bounds.left; x <= bounds.right; x += 1) {
      if (portraitBack.data[(bounds.bottom * portraitBack.width + cellLeft + x) * 4 + 3] > 8) bounds.bottomRun += 1;
    }
    const eyeCoverage = (centerX) => {
      let covered = 0;
      let total = 0;
      for (let y = layout.anchors.eyeLine.y - 16; y <= layout.anchors.eyeLine.y + 16; y += 1) {
        for (let x = centerX - 28; x <= centerX + 28; x += 1) {
          total += 1;
          if (portraitFront.data[(y * portraitFront.width + cellLeft + x) * 4 + 3] > 32) covered += 1;
        }
      }
      return Number((covered / total).toFixed(4));
    };
    bounds.leftEyeCoverage = eyeCoverage(layout.anchors.headCenter.x - 64);
    bounds.rightEyeCoverage = eyeCoverage(layout.anchors.headCenter.x + 64);
    return bounds;
  });
  fs.writeFileSync(path.join(root, 'src', 'data', 'avatarHairBounds.json'), `${JSON.stringify(visibleBounds, null, 2)}\n`);
}

function buildClothingAtlases() {
  const portrait = new PNG({ width: CELL * 2, height: CELL });
  const portraitNecklineFront = new PNG({ width: CELL * 2, height: CELL });
  const full = new PNG({ width: CELL * 2, height: FULL_HEIGHT });
  const fullNecklineFront = new PNG({ width: CELL * 2, height: FULL_HEIGHT });
  const portraitFiles = ['portrait_shoulders_male_v4.png', 'portrait_shoulders_female_v1.png'];
  const fullFiles = ['player_body_male_v2.png', 'player_body_female_v2.png'];
  for (let gender = 0; gender < 2; gender += 1) {
    const portraitSource = read(portraitFiles[gender]);
    const genderName = gender === 1 ? 'female' : 'male';
    const portraitPlacement = portraitOutfitPlacement(genderName);
    drawScaled(portraitSource, { x: 0, y: 0, width: portraitSource.width, height: portraitSource.height }, portrait, portraitPlacement, gender * CELL, 0);
    const fullSource = read(fullFiles[gender]);
    drawScaled(fullSource, { x: 0, y: 0, width: fullSource.width, height: fullSource.height }, full, transformFullRect(layout.fullBodyPlacement[gender === 1 ? 'female' : 'male']), gender * CELL, 0, null, FULL_HEIGHT);
  }
  for (let gender = 0; gender < 2; gender += 1) {
    const genderName = gender === 1 ? 'female' : 'male';
    const portraitFrontFit = { ...layout.portraitNecklineFront[genderName], startY: layout.outfits.casual[genderName].collarTopY };
    drawScaled(portrait, { x: gender * CELL, y: 0, width: CELL, height: CELL }, portraitNecklineFront, { x: 0, y: 0, width: CELL, height: CELL }, gender * CELL, 0, necklineForegroundMask(portraitFrontFit));
    // The revised male hoodie includes its own shallow, curved lining. The
    // female source still needs the generated rear lining behind the neck.
    if (genderName === 'female') paintPortraitHoodInterior(portrait, gender * CELL, genderName);
    drawScaled(full, { x: gender * CELL, y: 0, width: CELL, height: FULL_HEIGHT }, fullNecklineFront, { x: 0, y: 0, width: CELL, height: FULL_HEIGHT }, gender * CELL, 0, necklineForegroundMask(layout.fullNecklineFront[genderName]), FULL_HEIGHT);
  }
  write('avatar_portrait_clothing_v8.png', portrait);
  write('avatar_portrait_neckline_front_v8.png', portraitNecklineFront);
  write('avatar_full_clothing.png', full);
  write('avatar_full_neckline_front.png', fullNecklineFront);
}

buildHeadAtlases();
buildHairAtlases();
buildClothingAtlases();
process.stdout.write('Built unified portrait and full-body avatar canvases.\n');
