const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const archiveRoot = path.resolve(root, process.argv[2] || 'eas-inspect-archive');
const manifestPath = path.join(root, 'src', 'data', 'artManifest.ts');
const source = fs.readFileSync(manifestPath, 'utf8');
const references = [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
const missing = references.filter((reference) => (
  !fs.existsSync(path.resolve(archiveRoot, 'src', 'data', reference))
));

if (missing.length > 0) {
  process.stderr.write(`Missing from EAS archive:\n${missing.join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`EAS archive asset check passed: ${references.length} static assets present.\n`);
