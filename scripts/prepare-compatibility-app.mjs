import fs from 'node:fs';
import path from 'node:path';

const options = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const name = process.argv[index];
  const value = process.argv[index + 1];
  if (!name?.startsWith('--') || value === undefined) {
    throw new Error('Compatibility app arguments must be --name value pairs');
  }
  options.set(name.slice(2), value);
}

const required = ['app', 'tarball', 'react-native', 'react', 'architecture'];
for (const name of required) {
  if (!options.get(name)) {
    throw new Error(`Missing --${name}`);
  }
}

const appDirectory = path.resolve(options.get('app'));
const tarball = path.resolve(options.get('tarball'));
const reactNativeVersion = options.get('react-native');
const reactVersion = options.get('react');
const architecture = options.get('architecture');
const includeNativeTests = options.get('native-tests') === 'true';

if (!['legacy', 'new'].includes(architecture)) {
  throw new Error('--architecture must be legacy or new');
}
if (!fs.existsSync(tarball)) {
  throw new Error(`Package tarball does not exist: ${tarball}`);
}

const packagePath = path.join(appDirectory, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.packageManager = 'yarn@4.18.0';
packageJson.dependencies = {
  ...packageJson.dependencies,
  '@azizuysal/wallet-kit': `file:${tarball}`,
  react: reactVersion,
  'react-native': reactNativeVersion,
};
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  '@react-native-community/cli': '20.2.0',
  '@react-native/babel-preset': reactNativeVersion,
  '@react-native/metro-config': reactNativeVersion,
  '@react-native/typescript-config': reactNativeVersion,
  'react-native-test-app': '5.4.6',
};
delete packageJson.devDependencies['react-native-builder-bob'];
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

fs.writeFileSync(
  path.join(appDirectory, '.yarnrc.yml'),
  [
    'enableGlobalCache: false',
    'enableScripts: true',
    'nodeLinker: node-modules',
    'npmMinimalAgeGate: 0',
    '',
  ].join('\n')
);

const gradlePropertiesPath = path.join(
  appDirectory,
  'android',
  'gradle.properties'
);
if (fs.existsSync(gradlePropertiesPath)) {
  const useNewArchitecture =
    architecture === 'new' || Number(reactNativeVersion.split('.')[1]) >= 82;
  let properties = fs.readFileSync(gradlePropertiesPath, 'utf8');
  const setting = `newArchEnabled=${useNewArchitecture}`;
  properties = /^newArchEnabled=.*$/m.test(properties)
    ? properties.replace(/^newArchEnabled=.*$/m, setting)
    : `${properties.trimEnd()}\n${setting}\n`;
  fs.writeFileSync(gradlePropertiesPath, properties);
}

const podfilePath = path.join(appDirectory, 'ios', 'Podfile');
if (includeNativeTests && fs.existsSync(podfilePath)) {
  fs.writeFileSync(
    podfilePath,
    `ws_dir = Pathname.new(__dir__)
ws_dir = ws_dir.parent until
  File.exist?("#{ws_dir}/node_modules/react-native-test-app/test_app.rb") ||
  ws_dir.expand_path.to_s == '/'
require "#{ws_dir}/node_modules/react-native-test-app/test_app.rb"

workspace 'WalletKitExample.xcworkspace'

use_test_app! :hermes_enabled => true,
              :fabric_enabled => ENV.fetch('RCT_NEW_ARCH_ENABLED', '1') != '0' do |targets|
  targets.tests do
    pod 'wallet-kit',
        :path => '../node_modules/@azizuysal/wallet-kit',
        :testspecs => ['Tests']
  end
end
`
  );
}

console.log(
  `Prepared RN ${reactNativeVersion} / React ${reactVersion} / ${architecture} consumer app`
);
