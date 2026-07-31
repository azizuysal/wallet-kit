import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const runnerTemp = process.env.RUNNER_TEMP;
if (!runnerTemp) {
  throw new Error('RUNNER_TEMP is required');
}

const remoteUiPath = '/sdcard/wallet-kit.xml';
const beforePath = path.join(runnerTemp, 'wallet-kit-before.xml');
const afterPath = path.join(runnerTemp, 'wallet-kit-after.xml');
const screenshotPath = path.join(runnerTemp, 'wallet-kit-android.png');

const runAdb = (arguments_, options = {}) =>
  execFileSync('adb', arguments_, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const dumpUi = (localPath) => {
  runAdb(['shell', 'uiautomator', 'dump', remoteUiPath]);
  const xml = runAdb(['exec-out', 'cat', remoteUiPath]);
  fs.writeFileSync(localPath, xml);
  return xml;
};

const waitForUi = async (
  description,
  localPath,
  predicate,
  timeout = 60_000
) => {
  const deadline = Date.now() + timeout;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const xml = dumpUi(localPath);
      if (predicate(xml)) {
        return xml;
      }
      lastError = new Error(`UI does not yet contain ${description}`);
    } catch (error) {
      lastError = error;
    }
    await delay(2_000);
  }

  throw new Error(
    `Timed out waiting for ${description}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
};

const before = await waitForUi(
  'the rendered Wallet Kit example',
  beforePath,
  (xml) =>
    xml.includes('text="Wallet Kit Example"') &&
    /text="Can Add Passes: (YES|NO)"/.test(xml) &&
    xml.includes('text="Invalid Input Rejected: YES"') &&
    xml.includes('content-desc="Add To Google Wallet"')
);

const buttonBounds = before.match(
  /content-desc="Add To Google Wallet"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/
);
if (!buttonBounds) {
  throw new Error('Could not determine the native wallet button bounds');
}

const tapX = Math.round(
  (Number(buttonBounds[1]) + Number(buttonBounds[3])) / 2
);
const tapY = Math.round(
  (Number(buttonBounds[2]) + Number(buttonBounds[4])) / 2
);
runAdb(['shell', 'input', 'tap', String(tapX), String(tapY)]);

await waitForUi(
  'the button press result',
  afterPath,
  (xml) => xml.includes('text="Error"'),
  30_000
);

const screenshot = runAdb(['exec-out', 'screencap', '-p'], {
  encoding: null,
});
fs.writeFileSync(screenshotPath, screenshot);

console.log('Android packed-consumer smoke test passed');
