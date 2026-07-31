import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files', '-z'])
  .toString('utf8')
  .split('\0')
  .filter(Boolean);
const forbiddenPath = /(^|\/)(?:\.env(?:\..*)?|credentials?(?:\..*)?|service[-_]?account(?:\..*)?)$|\.(?:pem|key)$/i;
const privateKeyHeader = [
  '-----BEGIN ',
  '(?:RSA |EC |OPENSSH )?',
  'PRIVATE KEY-----',
].join('');
const secretMarkers = [
  new RegExp(privateKeyHeader),
  new RegExp(`["']private_${'key'}["']\\s*:\\s*["']-----${'BEGIN'}`),
];

for (const filename of trackedFiles) {
  if (!fs.existsSync(filename)) continue;
  if (forbiddenPath.test(filename)) {
    throw new Error(`Tracked credential file is not allowed: ${filename}`);
  }
  const data = fs.readFileSync(filename);
  if (data.includes(0)) continue;
  const source = data.toString('utf8');
  for (const marker of secretMarkers) {
    if (marker.test(source)) {
      throw new Error(`Private-key material found in tracked file: ${filename}`);
    }
  }
}

console.log(`Scanned ${trackedFiles.length} tracked files for credential material`);
