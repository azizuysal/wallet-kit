import { execFileSync } from 'node:child_process';

const remoteUiPath = '/sdcard/wallet-kit.xml';

const runAdb = (arguments_) =>
  execFileSync('adb', arguments_, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const dumpUi = () => {
  runAdb(['shell', 'uiautomator', 'dump', remoteUiPath]);
  return runAdb(['exec-out', 'cat', remoteUiPath]);
};

const waitForUi = async (description, predicate, timeout = 60_000) => {
  const deadline = Date.now() + timeout;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const xml = dumpUi();
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
  (xml) => xml.includes('text="Error"'),
  30_000
);

console.log('Android packed-consumer smoke test passed');
