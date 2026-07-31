import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const npmCache = fs.mkdtempSync(
  path.join(os.tmpdir(), 'wallet-kit-npm-cache-')
);
let result;
try {
  result = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
      encoding: 'utf8',
      env: { ...process.env, npm_config_cache: npmCache },
    })
  )[0];
} finally {
  fs.rmSync(npmCache, { recursive: true, force: true });
}
const files = result.files.map(({ path: filePath }) => filePath);
const required = [
  'package.json',
  'wallet-kit.podspec',
  'src/index.tsx',
  'lib/commonjs/index.js',
  'lib/module/index.js',
  'lib/typescript/commonjs/src/index.d.ts',
  'lib/typescript/module/src/index.d.ts',
  'android/build.gradle',
  'android/src/main/java/com/azizuysal/walletkit/WalletKitCore.kt',
  'android/src/legacy/java/com/azizuysal/walletkit/WalletKitModule.kt',
  'android/src/newarch/java/com/azizuysal/walletkit/WalletKitModule.kt',
  'android/src/test/java/com/azizuysal/walletkit/WalletKitCoreTest.kt',
  'ios/WalletKit.mm',
  'ios/WalletButton.mm',
  'ios/tests/WalletKitTests.mm',
];
const forbidden =
  /(^|\/)(?:\.env(?:\..*)?|credentials?(?:\..*)?|service[-_]?account(?:\..*)?)$|\.(?:pem|key)$|(^|\/)__tests__(\/|$)/i;

for (const filename of required) {
  if (!files.includes(filename)) {
    throw new Error(`Packed package is missing ${filename}`);
  }
}
for (const filename of files) {
  if (forbidden.test(filename)) {
    throw new Error(`Packed package contains forbidden file: ${filename}`);
  }
}

console.log(`Validated ${files.length} files in ${result.filename}`);
