import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('compatibility.json', 'utf8'));
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const expectedVersions = [
  '0.76.9',
  '0.77.3',
  '0.78.3',
  '0.79.7',
  '0.80.3',
  '0.81.6',
  '0.82.1',
  '0.83.10',
  '0.84.1',
  '0.85.3',
  '0.86.2',
];

const actualVersions = manifest.reactNative.map(({ version }) => version);
if (JSON.stringify(actualVersions) !== JSON.stringify(expectedVersions)) {
  throw new Error(
    `Compatibility versions must be ${expectedVersions.join(', ')}`
  );
}

for (const entry of manifest.reactNative) {
  if (!/^\d+\.\d+\.\d+$/.test(entry.react)) {
    throw new Error(`React must be exactly pinned for RN ${entry.version}`);
  }
  const minor = Number(entry.version.split('.')[1]);
  const expectedArchitectures = minor < 82 ? ['legacy', 'new'] : ['new'];
  if (
    JSON.stringify(entry.architectures) !==
    JSON.stringify(expectedArchitectures)
  ) {
    throw new Error(`Invalid architecture list for RN ${entry.version}`);
  }
}

if (packageJson.peerDependencies.react !== '>=18.2.0') {
  throw new Error('The React peer floor must remain >=18.2.0 for the 2.x line');
}
if (packageJson.peerDependencies['react-native'] !== '>=0.76.0') {
  throw new Error(
    'The React Native peer floor must remain >=0.76.0 with no upper bound'
  );
}

console.log(
  `Validated ${manifest.reactNative.length} React Native compatibility entries`
);
