const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

if (process.platform !== 'win32') {
  const result = spawnSync('./gradlew', ['clean', 'bundleRelease'], {
    cwd: path.join(projectRoot, 'android'),
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

const driveLetter = ['R', 'S', 'T', 'U', 'V', 'W'].find(
  (letter) => !fs.existsSync(`${letter}:\\`),
);

if (!driveLetter) {
  throw new Error('No free drive letter is available for the short Android build path.');
}

const drive = `${driveLetter}:`;
const projectParent = path.dirname(projectRoot);
const mappedProject = `${drive}\\${path.basename(projectRoot)}`;

try {
  // Map the parent so package.json is not at the mapped drive root. Expo's
  // autolinker walks upward to find it and does not inspect a drive root.
  execFileSync('subst', [drive, projectParent], { stdio: 'ignore' });
  const result = spawnSync('gradlew.bat', ['clean', 'bundleRelease'], {
    cwd: `${mappedProject}\\android`,
    stdio: 'inherit',
    shell: true,
  });
  process.exitCode = result.status ?? 1;
} finally {
  try {
    execFileSync('subst', [drive, '/D'], { stdio: 'ignore' });
  } catch {
    // The build result remains authoritative if Windows already removed it.
  }
}
