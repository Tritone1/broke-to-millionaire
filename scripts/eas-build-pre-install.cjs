if (process.env.EAS_BUILD_PROFILE !== 'production') {
  process.stdout.write('Skipping production release check for a non-production EAS profile.\n');
  process.exit(0);
}

require('./check-release-config.cjs');
