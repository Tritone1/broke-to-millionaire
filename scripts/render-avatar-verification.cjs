const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const characterDir = path.join(root, 'assets', 'game', 'characters');
const outputDir = path.join(root, 'artifacts');
const CELL = 512;
const FULL_HEIGHT = 768;

function read(name) {
  return PNG.sync.read(fs.readFileSync(path.join(characterDir, name)));
}

function blend(destination, dx, dy, rgba) {
  const index = (dy * destination.width + dx) * 4;
  const sourceAlpha = rgba[3] / 255;
  const targetAlpha = destination.data[index + 3] / 255;
  const outputAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
  if (outputAlpha === 0) return;
  for (let channel = 0; channel < 3; channel += 1) {
    destination.data[index + channel] = Math.round((rgba[channel] * sourceAlpha + destination.data[index + channel] * targetAlpha * (1 - sourceAlpha)) / outputAlpha);
  }
  destination.data[index + 3] = Math.round(outputAlpha * 255);
}

function paintCell(source, destination, sourceColumn, sourceRow, columns, rows, targetColumn, targetRow, cellHeight = CELL) {
  const sourceWidth = source.width / columns;
  const sourceHeight = source.height / rows;
  for (let y = 0; y < cellHeight; y += 1) {
    for (let x = 0; x < CELL; x += 1) {
      const sourceIndex = (((sourceRow * sourceHeight + y) * source.width) + sourceColumn * sourceWidth + x) * 4;
      const alpha = source.data[sourceIndex + 3];
      if (alpha === 0) continue;
      blend(destination, targetColumn * CELL + x, targetRow * cellHeight + y, [source.data[sourceIndex], source.data[sourceIndex + 1], source.data[sourceIndex + 2], alpha]);
    }
  }
}

function fillBackground(image) {
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = (y * image.width + x) * 4;
      image.data[index] = 143;
      image.data[index + 1] = 213;
      image.data[index + 2] = 236;
      image.data[index + 3] = 255;
    }
  }
}

const head = read('avatar_portrait_head_v8_skin_2.png');
const neck = read('avatar_portrait_neck_v8_skin_2.png');
const clothing = read('avatar_portrait_clothing_v8.png');
const necklineFront = read('avatar_portrait_neckline_front_v8.png');
const hair = {
  male: { back: read('avatar_portrait_hair_back_v7_male.png'), front: read('avatar_portrait_hair_front_v7_male.png') },
  female: { back: read('avatar_portrait_hair_back_v7_female.png'), front: read('avatar_portrait_hair_front_v7_female.png') },
};
const output = new PNG({ width: CELL * 3, height: CELL * 2 });

fillBackground(output);

for (let genderRow = 0; genderRow < 2; genderRow += 1) {
  const gender = genderRow === 0 ? 'male' : 'female';
  for (let column = 0; column < 3; column += 1) {
    paintCell(hair[gender].back, output, column, 0, 3, 1, column, genderRow);
    paintCell(clothing, output, genderRow, 0, 2, 1, column, genderRow);
    paintCell(neck, output, 3, genderRow, 6, 2, column, genderRow);
    paintCell(necklineFront, output, genderRow, 0, 2, 1, column, genderRow);
    paintCell(head, output, 3, genderRow, 6, 2, column, genderRow);
    paintCell(hair[gender].front, output, column, 0, 3, 1, column, genderRow);
  }
}

fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'avatar-verification.png');
fs.writeFileSync(outputPath, PNG.sync.write(output));

const fullHead = read('avatar_full_head_skin_2.png');
const fullNeck = read('avatar_full_neck_skin_2.png');
const fullClothing = read('avatar_full_clothing.png');
const fullNecklineFront = read('avatar_full_neckline_front.png');
const fullHair = {
  male: { back: read('avatar_full_hair_back_male.png'), front: read('avatar_full_hair_front_male.png') },
  female: { back: read('avatar_full_hair_back_female.png'), front: read('avatar_full_hair_front_female.png') },
};
const fullOutput = new PNG({ width: CELL * 3, height: FULL_HEIGHT * 2 });
fillBackground(fullOutput);
for (let genderRow = 0; genderRow < 2; genderRow += 1) {
  const gender = genderRow === 0 ? 'male' : 'female';
  for (let column = 0; column < 3; column += 1) {
    paintCell(fullHair[gender].back, fullOutput, column, 0, 3, 1, column, genderRow, FULL_HEIGHT);
    paintCell(fullClothing, fullOutput, genderRow, 0, 2, 1, column, genderRow, FULL_HEIGHT);
    paintCell(fullNeck, fullOutput, 3, genderRow, 6, 2, column, genderRow, FULL_HEIGHT);
    paintCell(fullNecklineFront, fullOutput, genderRow, 0, 2, 1, column, genderRow, FULL_HEIGHT);
    paintCell(fullHead, fullOutput, 3, genderRow, 6, 2, column, genderRow, FULL_HEIGHT);
    paintCell(fullHair[gender].front, fullOutput, column, 0, 3, 1, column, genderRow, FULL_HEIGHT);
  }
}
const fullOutputPath = path.join(outputDir, 'avatar-full-verification.png');
fs.writeFileSync(fullOutputPath, PNG.sync.write(fullOutput));

const identityOutput = new PNG({ width: CELL * 6, height: CELL * 6 });
fillBackground(identityOutput);
for (let skinRow = 0; skinRow < 6; skinRow += 1) {
  const identityHead = read(`avatar_portrait_head_v8_skin_${skinRow}.png`);
  const identityNeck = read(`avatar_portrait_neck_v8_skin_${skinRow}.png`);
  const genderRow = skinRow % 2;
  const gender = genderRow === 0 ? 'male' : 'female';
  const hairColumn = Math.floor(skinRow / 2) % 3;
  for (let ethnicityColumn = 0; ethnicityColumn < 6; ethnicityColumn += 1) {
    paintCell(hair[gender].back, identityOutput, hairColumn, 0, 3, 1, ethnicityColumn, skinRow);
    paintCell(clothing, identityOutput, genderRow, 0, 2, 1, ethnicityColumn, skinRow);
    paintCell(identityNeck, identityOutput, ethnicityColumn, genderRow, 6, 2, ethnicityColumn, skinRow);
    paintCell(necklineFront, identityOutput, genderRow, 0, 2, 1, ethnicityColumn, skinRow);
    paintCell(identityHead, identityOutput, ethnicityColumn, genderRow, 6, 2, ethnicityColumn, skinRow);
    paintCell(hair[gender].front, identityOutput, hairColumn, 0, 3, 1, ethnicityColumn, skinRow);
  }
}
const identityOutputPath = path.join(outputDir, 'avatar-identity-verification.png');
fs.writeFileSync(identityOutputPath, PNG.sync.write(identityOutput));
process.stdout.write(`${outputPath}\n${fullOutputPath}\n${identityOutputPath}\n`);
