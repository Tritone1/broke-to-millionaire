const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const credentialsPath = path.join(projectRoot, 'credentials.json');

if (!fs.existsSync(credentialsPath)) {
  throw new Error('credentials.json is missing. Run `eas credentials -p android` and download the Android credentials first.');
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const keystore = credentials?.android?.keystore;
const required = ['keystorePath', 'keystorePassword', 'keyAlias', 'keyPassword'];
for (const key of required) {
  if (!keystore?.[key] || typeof keystore[key] !== 'string') {
    throw new Error(`Android credentials are missing ${key}.`);
  }
}

const sourceKeystore = path.resolve(projectRoot, keystore.keystorePath);
if (!fs.existsSync(sourceKeystore)) {
  throw new Error(`Downloaded Android keystore was not found at ${sourceKeystore}.`);
}

const destinationName = 'play-upload-key.jks';
const destinationKeystore = path.join(projectRoot, 'android', 'app', destinationName);
fs.copyFileSync(sourceKeystore, destinationKeystore);

const escapeProperty = (value) => value.replaceAll('\\', '\\\\').replaceAll(':', '\\:').replaceAll('=', '\\=');
const properties = [
  '# Generated from ignored credentials.json. Never commit this file.',
  `MYAPP_UPLOAD_STORE_FILE=${destinationName}`,
  `MYAPP_UPLOAD_KEY_ALIAS=${escapeProperty(keystore.keyAlias)}`,
  `MYAPP_UPLOAD_STORE_PASSWORD=${escapeProperty(keystore.keystorePassword)}`,
  `MYAPP_UPLOAD_KEY_PASSWORD=${escapeProperty(keystore.keyPassword)}`,
  '',
].join('\n');
fs.writeFileSync(path.join(projectRoot, 'android', 'key.properties'), properties, { encoding: 'utf8', mode: 0o600 });

process.stdout.write('Android release signing configured from the downloaded Play upload credential.\n');
