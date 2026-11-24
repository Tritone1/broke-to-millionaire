const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const androidRoot = path.join(projectRoot, 'android');
const nativeHeaderTasks = [
  ':react-native-worklets:prepareWorkletsHeadersForPrefabs',
  ':react-native-reanimated:prepareReanimatedHeadersForPrefabs',
];

function loadIgnoredEnvironment() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = path.join(projectRoot, fileName);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      const rawValue = match[2];
      process.env[match[1]] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
    }
    break;
  }
}

function validateProductionAdConfiguration() {
  if (process.env.EXPO_PUBLIC_ADS_TEST_MODE !== 'false') return;
  const required = [
    'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID',
    'EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID',
    'EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID',
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Production AdMob configuration is incomplete: ${missing.join(', ')}`);
  }
}

function prepareGestureHandlerSourcesForWindows() {
  if (process.platform !== 'win32') return;

  const gestureHandlerRoot = path.join(projectRoot, 'node_modules', 'react-native-gesture-handler');
  const cmakeFile = path.join(gestureHandlerRoot, 'android', 'CMakeLists.txt');
  const sourceDirectory = path.join(gestureHandlerRoot, 'shared', 'shadowNodes');
  const mirroredDirectory = path.join(
    gestureHandlerRoot,
    'android',
    'build',
    'generated',
    'source',
    'rngh-shadow-nodes',
  );
  const originalGlob = '../shared/shadowNodes/*.cpp';
  const shortGlob = './build/generated/source/rngh-shadow-nodes/*.cpp';

  if (!fs.existsSync(cmakeFile) || !fs.existsSync(sourceDirectory)) {
    throw new Error('react-native-gesture-handler native sources are missing. Run npm install first.');
  }

  fs.cpSync(sourceDirectory, mirroredDirectory, { recursive: true, force: true });
  const cmake = fs.readFileSync(cmakeFile, 'utf8');
  if (cmake.includes(originalGlob)) {
    fs.writeFileSync(cmakeFile, cmake.replace(originalGlob, shortGlob));
  } else if (!cmake.includes(shortGlob)) {
    throw new Error('Unsupported react-native-gesture-handler CMake layout; cannot shorten Windows object paths.');
  }
}

function mirrorCmakeSources({ packageName, cmakeRelativePath, replacements, directories }) {
  const packageRoot = path.join(projectRoot, 'node_modules', packageName);
  const cmakeFile = path.join(packageRoot, cmakeRelativePath);
  if (!fs.existsSync(cmakeFile)) {
    throw new Error(`${packageName} CMake configuration is missing. Run npm install first.`);
  }

  const cmakeDirectory = path.dirname(cmakeFile);
  for (const [sourceRelativePath, mirrorRelativePath] of directories) {
    const source = path.join(packageRoot, sourceRelativePath);
    const mirror = path.join(cmakeDirectory, mirrorRelativePath);
    if (!fs.existsSync(source)) {
      throw new Error(`${packageName} native source directory is missing: ${sourceRelativePath}`);
    }
    fs.cpSync(source, mirror, { recursive: true, force: true });
  }

  let cmake = fs.readFileSync(cmakeFile, 'utf8');
  for (const [original, replacement] of replacements) {
    if (cmake.includes(original)) cmake = cmake.replace(original, replacement);
    else if (!cmake.includes(replacement)) {
      throw new Error(`Unsupported ${packageName} CMake layout; cannot shorten Windows object paths.`);
    }
  }
  fs.writeFileSync(cmakeFile, cmake);
}

function prepareRemainingNativeSourcesForWindows() {
  if (process.platform !== 'win32') return;

  mirrorCmakeSources({
    packageName: 'react-native-safe-area-context',
    cmakeRelativePath: 'android/src/main/jni/CMakeLists.txt',
    replacements: [
      ['set(LIB_COMMON_DIR ${LIB_ANDROID_DIR}/../common/cpp)', 'set(LIB_COMMON_DIR .short/common)'],
      ['set(LIB_ANDROID_GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)', 'set(LIB_ANDROID_GENERATED_JNI_DIR .short/generated)'],
    ],
    directories: [
      ['common/cpp', '.short/common'],
      ['android/build/generated/source/codegen/jni', '.short/generated'],
    ],
  });

  mirrorCmakeSources({
    packageName: 'react-native-screens',
    cmakeRelativePath: 'android/src/main/jni/CMakeLists.txt',
    replacements: [
      ['set(LIB_COMMON_DIR ${LIB_ANDROID_DIR}/../common/cpp)', 'set(LIB_COMMON_DIR .short/common)'],
      ['set(LIB_ANDROID_GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)', 'set(LIB_ANDROID_GENERATED_JNI_DIR .short/generated)'],
    ],
    directories: [
      ['common/cpp', '.short/common'],
      ['android/build/generated/source/codegen/jni', '.short/generated'],
    ],
  });

  mirrorCmakeSources({
    packageName: 'react-native-svg',
    cmakeRelativePath: 'android/src/main/jni/CMakeLists.txt',
    replacements: [
      ['set(RNSVG_COMMON_DIR ${RNSVG_ANDROID_DIR}/../common/cpp)', 'set(RNSVG_COMMON_DIR .short/common)'],
      ['set(RNSVG_GENERATED_JNI_DIR ${RNSVG_GENERATED_DIR}/source/codegen/jni)', 'set(RNSVG_GENERATED_JNI_DIR .short/generated)'],
    ],
    directories: [
      ['common/cpp', '.short/common'],
      ['android/build/generated/source/codegen/jni', '.short/generated'],
    ],
  });

  mirrorCmakeSources({
    packageName: 'react-native-reanimated',
    cmakeRelativePath: 'Common/NativeView/CMakeLists.txt',
    replacements: [
      ['set(CODEGEN_JNI_DIR ${ANDROID_DIR}/build/generated/source/codegen/jni)', 'set(CODEGEN_JNI_DIR .short/generated)'],
    ],
    directories: [
      ['android/build/generated/source/codegen/jni', '.short/generated'],
    ],
  });
}

function runGradle(argumentsList) {
  if (process.platform !== 'win32') {
    return spawnSync('./gradlew', argumentsList, { cwd: androidRoot, stdio: 'inherit' });
  }
  return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'gradlew.bat', ...argumentsList], {
    cwd: androidRoot,
    stdio: 'inherit',
  });
}

// Keep every codegen input on the real project drive. Mapping the repository to
// another drive makes Windows reject C: dependency paths as a different root.
loadIgnoredEnvironment();
validateProductionAdConfiguration();
prepareGestureHandlerSourcesForWindows();
prepareRemainingNativeSourcesForWindows();
const headers = runGradle(nativeHeaderTasks);
if ((headers.status ?? 1) !== 0) process.exit(headers.status ?? 1);

const bundle = runGradle(['bundleRelease']);
process.exit(bundle.status ?? 1);
