const path = require('path');
const { spawnSync } = require('child_process');
const manifest = require('../../compatibility.json');

const scriptPath = path.join(__dirname, '..', 'compatibility-matrix.mjs');
const runMatrix = (mode) =>
  spawnSync(process.execPath, [scriptPath, '--mode', mode], {
    cwd: path.join(__dirname, '..', '..'),
    encoding: 'utf8',
  });

describe('compatibility matrix', () => {
  it('includes every supported version and architecture in the full gate', () => {
    const result = runMatrix('full');

    expect(result.status).toBe(0);
    const { include } = JSON.parse(result.stdout);
    expect(
      include.map(({ rn, react, architecture }) => ({
        rn,
        react,
        architecture,
      }))
    ).toEqual(
      manifest.reactNative.flatMap(({ version, react, architectures }) =>
        architectures.map((architecture) => ({
          rn: version,
          react,
          architecture,
        }))
      )
    );
    expect(include).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rn: '0.87.1',
          react: '19.2.5',
          architecture: 'new',
        }),
        expect.objectContaining({
          rn: '0.88.1',
          react: '19.3.0',
          architecture: 'new',
        }),
      ])
    );
  });

  it('keeps the oldest, architecture boundaries, and newest version in the PR gate', () => {
    const result = runMatrix('pr');

    expect(result.status).toBe(0);
    const { include } = JSON.parse(result.stdout);
    expect(include.map(({ rn, architecture }) => [rn, architecture])).toEqual([
      ['0.76.9', 'legacy'],
      ['0.76.9', 'new'],
      ['0.81.6', 'legacy'],
      ['0.81.6', 'new'],
      ['0.82.1', 'new'],
      ['0.88.1', 'new'],
    ]);
  });

  it.each(['pr', 'full'])(
    'builds releases at both ends of the %s gate',
    (mode) => {
      const result = runMatrix(mode);

      expect(result.status).toBe(0);
      const { include } = JSON.parse(result.stdout);
      expect(
        include
          .filter(({ release }) => release)
          .map(({ rn, architecture }) => [rn, architecture])
      ).toEqual([
        ['0.76.9', 'legacy'],
        ['0.88.1', 'new'],
      ]);
      expect(
        include
          .filter(({ nativeTests }) => nativeTests)
          .map(({ rn, architecture }) => [rn, architecture])
      ).toEqual([['0.81.6', 'legacy']]);
    }
  );

  it('rejects an invalid matrix mode', () => {
    const result = runMatrix('invalid');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('--mode pr|full');
  });
});
