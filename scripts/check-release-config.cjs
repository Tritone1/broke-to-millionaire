const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const errors = [];

function requireEnv(name, pattern, description) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    errors.push(`${name} is missing (${description}).`);
  } else if (pattern && !pattern.test(value)) {
    errors.push(`${name} has an invalid format.`);
  }
}

function pngSize(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) {
    errors.push(`${relativePath} is missing.`);
    return null;
  }
  const data = fs.readFileSync(absolute);
  if (data.length < 24 || data.toString('ascii', 1, 4) !== 'PNG') {
    errors.push(`${relativePath} is not a valid PNG.`);
    return null;
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function requirePngSize(relativePath, width, height) {
  const size = pngSize(relativePath);
  if (size && (size.width !== width || size.height !== height)) {
    errors.push(`${relativePath} must be ${width}x${height}; found ${size.width}x${size.height}.`);
  }
}

const packageName = app.android?.package || '';
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,}$/.test(packageName)) {
  errors.push('The Android package must be a valid, all-lowercase application ID.');
}
if (app.name !== 'Broke to Millionaire') errors.push('The final app name must be "Broke to Millionaire".');
if (process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true') errors.push('EXPO_PUBLIC_ADS_TEST_MODE must not be true for production.');

requirePngSize('assets/release/app-icon.png', 1024, 1024);
requirePngSize('assets/release/adaptive-foreground.png', 1024, 1024);
requirePngSize('assets/release/splash-icon.png', 1024, 1024);
requirePngSize('assets/store/google-play-feature-graphic.png', 1024, 500);

const admobAppPattern = /^ca-app-pub-\d{16}~\d{10}$/;
const admobUnitPattern = /^ca-app-pub-\d{16}\/\d{10}$/;
requireEnv('EXPO_PUBLIC_ADMOB_ANDROID_APP_ID', admobAppPattern, 'Android AdMob app ID');
requireEnv('EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID', admobUnitPattern, 'Android interstitial unit');
requireEnv('EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID', admobUnitPattern, 'Android rewarded unit');
requireEnv('EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY', /^goog_[A-Za-z0-9]+$/, 'RevenueCat Android public SDK key');
requireEnv('EXPO_PUBLIC_SUPABASE_URL', /^https:\/\/[a-z0-9-]+\.supabase\.co$/i, 'Supabase project URL');
requireEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', /^.{20,}$/, 'Supabase public publishable key');
requireEnv('EXPO_PUBLIC_PRIVACY_POLICY_URL', /^https:\/\//i, 'public privacy policy URL');
requireEnv('EXPO_PUBLIC_TERMS_URL', /^https:\/\//i, 'public terms URL');
requireEnv('EXPO_PUBLIC_SUPPORT_URL', /^https:\/\//i, 'public support URL');

if (errors.length) {
  process.stderr.write(`Production release check failed:\n- ${errors.join('\n- ')}\n`);
  process.exit(1);
}

process.stdout.write('Production release configuration passed.\n');
