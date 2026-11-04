const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const scriptPath = path.join(__dirname, '..', 'prepare-compatibility-app.mjs');

const runPrepare = (appDirectory, tarball, extraArguments = []) =>
  spawnSync(
    process.execPath,
    [
      scriptPath,
      '--app',
      appDirectory,
      '--tarball',
      tarball,
      '--react-native',
      '0.76.9',
      '--react',
      '18.3.1',
      '--architecture',
      'legacy',
      ...extraArguments,
    ],
    { encoding: 'utf8' }
  );

describe('compatibility app preparation', () => {
  let temporaryDirectory;
  let appDirectory;
  let tarball;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wallet-kit-compatibility-')
    );
    appDirectory = path.join(temporaryDirectory, 'app');
    tarball = path.join(temporaryDirectory, 'wallet-kit.tgz');
    fs.mkdirSync(appDirectory);
    fs.writeFileSync(
      path.join(appDirectory, 'package.json'),
      JSON.stringify({ dependencies: {}, devDependencies: {} })
    );
    fs.writeFileSync(tarball, 'fixture');
  });

  afterEach(() => {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('prepares package metadata before native projects are generated', () => {
    const result = runPrepare(appDirectory, tarball);

    expect(result.status).toBe(0);
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(appDirectory, 'package.json'), 'utf8')
    );
    expect(packageJson.dependencies['@azizuysal/wallet-kit']).toBe(
      `file:${tarball}`
    );
    expect(packageJson.dependencies['react-native']).toBe('0.76.9');
  });

  it('declares the Babel peer required by the Flow enum transformer', () => {
    const result = runPrepare(appDirectory, tarball);

    expect(result.status).toBe(0);
    const yarnConfig = fs.readFileSync(
      path.join(appDirectory, '.yarnrc.yml'),
      'utf8'
    );
    expect(yarnConfig).toContain(
      [
        'packageExtensions:',
        '  babel-plugin-transform-flow-enums@0.0.2:',
        '    peerDependencies:',
        "      '@babel/core': ^7.0.0-0",
      ].join('\n')
    );
    expect(yarnConfig).not.toContain('logFilters');
  });

  it.each([
    ['0.87.1', '19.2.5'],
    ['0.88.1', '19.3.0'],
  ])('prepares an RN %s consumer with matching React', (rn, react) => {
    const result = runPrepare(appDirectory, tarball, [
      '--react-native',
      rn,
      '--react',
      react,
      '--architecture',
      'new',
    ]);

    expect(result.status).toBe(0);
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(appDirectory, 'package.json'), 'utf8')
    );
    expect(packageJson.dependencies['react-native']).toBe(rn);
    expect(packageJson.dependencies.react).toBe(react);
    expect(packageJson.devDependencies['@react-native/babel-preset']).toBe(rn);
    expect(packageJson.devDependencies['@react-native/metro-config']).toBe(rn);
    expect(packageJson.devDependencies['@react-native/typescript-config']).toBe(
      rn
    );
    expect(packageJson.devDependencies['react-native-test-app']).toBe('5.4.16');
  });

  it('updates generated Android and iOS projects', () => {
    const gradleDirectory = path.join(
      appDirectory,
      'android',
      'gradle',
      'wrapper'
    );
    const iosDirectory = path.join(appDirectory, 'ios');
    fs.mkdirSync(gradleDirectory, { recursive: true });
    fs.mkdirSync(iosDirectory);
    fs.writeFileSync(
      path.join(appDirectory, 'android', 'gradle.properties'),
      'newArchEnabled=true\n'
    );
    fs.writeFileSync(
      path.join(gradleDirectory, 'gradle-wrapper.properties'),
      'distributionUrl=https\\://services.gradle.org/distributions/gradle-old.zip\n'
    );
    fs.writeFileSync(path.join(iosDirectory, 'Podfile'), 'old content\n');

    const result = runPrepare(appDirectory, tarball, [
      '--native-tests',
      'true',
    ]);

    expect(result.status).toBe(0);
    expect(
      fs.readFileSync(
        path.join(appDirectory, 'android', 'gradle.properties'),
        'utf8'
      )
    ).toBe('newArchEnabled=false\n');
    expect(
      fs.readFileSync(
        path.join(gradleDirectory, 'gradle-wrapper.properties'),
        'utf8'
      )
    ).toContain('gradle-8.11.1-all.zip');
    expect(
      fs.readFileSync(path.join(iosDirectory, 'Podfile'), 'utf8')
    ).toContain(":testspecs => ['Tests']");
  });

  it('prepares an autolinked AGP 9 consumer without unrelated native packages', () => {
    fs.writeFileSync(
      path.join(appDirectory, 'package.json'),
      JSON.stringify({
        dependencies: { 'react-native-safe-area-context': '5.8.0' },
        devDependencies: { 'react-native-fs': '^2.20.0' },
      })
    );

    const result = runPrepare(appDirectory, tarball, [
      '--react-native',
      '0.87.1',
      '--react',
      '19.2.5',
      '--architecture',
      'new',
      '--agp9',
      'true',
    ]);

    expect(result.status).toBe(0);
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(appDirectory, 'package.json'), 'utf8')
    );
    expect(packageJson.dependencies['@azizuysal/wallet-kit']).toBe(
      `file:${tarball}`
    );
    expect(packageJson.dependencies['react-native']).toBe('0.87.1');
    expect(
      packageJson.dependencies['react-native-safe-area-context']
    ).toBeUndefined();
    expect(packageJson.devDependencies['react-native-fs']).toBeUndefined();
    expect(
      packageJson.devDependencies['react-native-test-app']
    ).toBeUndefined();
    expect(require(path.join(appDirectory, 'react-native.config.js'))).toEqual(
      {}
    );
    expect(
      fs.readFileSync(
        path.join(appDirectory, 'android', 'settings.gradle'),
        'utf8'
      )
    ).toContain('autolinkLibrariesFromCommand');
    expect(
      fs.readFileSync(
        path.join(
          appDirectory,
          'android',
          'gradle',
          'wrapper',
          'gradle-wrapper.properties'
        ),
        'utf8'
      )
    ).toContain('gradle-9.6.1-bin.zip');
    expect(() =>
      fs.accessSync(
        path.join(appDirectory, 'android', 'gradlew'),
        fs.constants.X_OK
      )
    ).not.toThrow();
  });
});
