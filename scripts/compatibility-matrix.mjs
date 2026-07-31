import fs from 'node:fs';

const modeIndex = process.argv.indexOf('--mode');
const mode = modeIndex === -1 ? 'pr' : process.argv[modeIndex + 1];
if (!['pr', 'full'].includes(mode)) {
  throw new Error('Usage: compatibility-matrix.mjs --mode pr|full');
}

const manifest = JSON.parse(fs.readFileSync('compatibility.json', 'utf8'));
const pullRequestVersions = new Set(['0.76.9', '0.81.6', '0.82.1', '0.86.2']);
const selected = manifest.reactNative.filter(
  ({ version }) => mode === 'full' || pullRequestVersions.has(version)
);

const include = selected.flatMap(({ version, react, architectures }) =>
  architectures
    .filter(
      (architecture) =>
        mode === 'full' ||
        version === '0.76.9' ||
        version === '0.81.6' ||
        architecture === 'new'
    )
    .map((architecture) => ({
      rn: version,
      react,
      architecture,
      release:
        (version === '0.76.9' && architecture === 'legacy') ||
        (version === '0.86.2' && architecture === 'new'),
      nativeTests: version === '0.81.6' && architecture === 'legacy',
    }))
);

process.stdout.write(JSON.stringify({ include }));
