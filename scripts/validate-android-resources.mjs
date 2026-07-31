import fs from 'node:fs';
import path from 'node:path';

const resourceRoot = path.join('android', 'src', 'main', 'res');
const densityQualifiers = new Set([
  'mdpi',
  'hdpi',
  'xhdpi',
  'xxhdpi',
  'xxxhdpi',
]);
const invalidLegacyQualifiers = new Set([
  'by',
  'cz',
  'dk',
  'fl',
  'fp',
  'gr',
  'jp',
  'kh',
  'se',
  'br',
  'pt',
]);
const expectedCorrectedQualifiers = new Set([
  'be',
  'cs',
  'da',
  'fil',
  'fr',
  'el',
  'ja',
  'km',
  'sv',
  'pt-rBR',
  'pt-rPT',
]);

const localizedDirectories = fs
  .readdirSync(resourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('drawable-'))
  .map((entry) => entry.name.slice('drawable-'.length))
  .filter((qualifier) => !densityQualifiers.has(qualifier));

for (const qualifier of localizedDirectories) {
  if (invalidLegacyQualifiers.has(qualifier)) {
    throw new Error(`Invalid Android locale qualifier: drawable-${qualifier}`);
  }
  if (!/^(?:[a-z]{2,3})(?:-r[A-Z]{2})?$/.test(qualifier)) {
    throw new Error(
      `Malformed Android locale qualifier: drawable-${qualifier}`
    );
  }
  const directory = path.join(resourceRoot, `drawable-${qualifier}`);
  for (const filename of [
    'add_to_googlewallet_button_content.xml',
    'badge_add_to_googlewallet_button_content.xml',
  ]) {
    if (!fs.existsSync(path.join(directory, filename))) {
      throw new Error(`Missing ${filename} in drawable-${qualifier}`);
    }
  }
}

for (const qualifier of expectedCorrectedQualifiers) {
  if (!localizedDirectories.includes(qualifier)) {
    throw new Error(
      `Missing corrected Android locale qualifier: drawable-${qualifier}`
    );
  }
}

for (const filename of fs.readdirSync(path.join(resourceRoot, 'layout'))) {
  if (!filename.endsWith('.xml')) continue;
  const source = fs.readFileSync(
    path.join(resourceRoot, 'layout', filename),
    'utf8'
  );
  if (/\d+(?:\.\d+)?sp\b/.test(source)) {
    throw new Error(`${filename} uses sp for button geometry; use dp`);
  }
  const imageViews = source.match(/<ImageView[\s\S]*?\/>/g) ?? [];
  for (const imageView of imageViews) {
    if (!imageView.includes('android:contentDescription="@null"')) {
      throw new Error(
        `${filename} contains a decorative ImageView with an accessibility label`
      );
    }
    if (!imageView.includes('android:importantForAccessibility="no"')) {
      throw new Error(
        `${filename} contains an accessible decorative ImageView`
      );
    }
  }
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const providers = {
  ...packageJson.codegenConfig.ios.modulesProvider,
  ...packageJson.codegenConfig.ios.componentProvider,
};
const iosSource = fs
  .readdirSync('ios')
  .filter((filename) => /\.(?:h|m|mm)$/.test(filename))
  .map((filename) => fs.readFileSync(path.join('ios', filename), 'utf8'))
  .join('\n');
for (const nativeClass of Object.values(providers)) {
  if (
    !iosSource.includes(`@interface ${nativeClass}`) &&
    !iosSource.includes(`@implementation ${nativeClass}`)
  ) {
    throw new Error(
      `Codegen provider class ${nativeClass} is missing from ios/`
    );
  }
}

console.log(
  `Validated ${localizedDirectories.length} localized Android button resource sets`
);
