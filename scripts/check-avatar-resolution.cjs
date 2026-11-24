const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const characterDir = path.join(root, 'assets', 'game', 'characters');
const errors = [];

function pngDimensions(filePath) {
  const data = fs.readFileSync(filePath);
  if (data.length < 24 || data.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`${path.basename(filePath)} is not a valid PNG`);
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function expectDimensions(baseName, width, height) {
  const extension = path.extname(baseName);
  const hdName = `${baseName.slice(0, -extension.length)}@2x${extension}`;
  const filePath = path.join(characterDir, hdName);
  if (!fs.existsSync(filePath)) {
    errors.push(`${hdName} is missing`);
    return;
  }
  const size = pngDimensions(filePath);
  if (size.width !== width || size.height !== height) {
    errors.push(`${hdName} must be ${width}x${height}; found ${size.width}x${size.height}`);
  }
}

expectDimensions('avatar_portrait_clothing_v8.png', 2048, 1024);
expectDimensions('avatar_portrait_neckline_front_v8.png', 2048, 1024);
expectDimensions('avatar_full_clothing.png', 2048, 1536);
expectDimensions('avatar_full_neckline_front.png', 2048, 1536);

for (let skin = 0; skin < 6; skin += 1) {
  for (let ethnicity = 0; ethnicity < 6; ethnicity += 1) {
    expectDimensions(`avatar_portrait_head_v8_skin_${skin}_ethnicity_${ethnicity}.png`, 1024, 2048);
    expectDimensions(`avatar_portrait_neck_v8_skin_${skin}_ethnicity_${ethnicity}.png`, 1024, 2048);
    expectDimensions(`avatar_full_head_skin_${skin}_ethnicity_${ethnicity}.png`, 1024, 3072);
    expectDimensions(`avatar_full_neck_skin_${skin}_ethnicity_${ethnicity}.png`, 1024, 3072);
  }
}

for (const hairstyle of ['buzz', 'curly', 'side-sweep', 'long-waves', 'braids', 'high-ponytail']) {
  expectDimensions(`avatar_portrait_hair_back_v7_${hairstyle}.png`, 1024, 1024);
  expectDimensions(`avatar_portrait_hair_front_v7_${hairstyle}.png`, 1024, 1024);
  expectDimensions(`avatar_full_hair_back_v4_${hairstyle}.png`, 1024, 1536);
  expectDimensions(`avatar_full_hair_front_v4_${hairstyle}.png`, 1024, 1536);
}

if (errors.length > 0) {
  process.stderr.write(`Avatar HD asset check failed:\n- ${errors.join('\n- ')}\n`);
  process.exit(1);
}

process.stdout.write('Avatar HD assets are present at 2x resolution.\n');
