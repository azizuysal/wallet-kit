const fs = require('fs');
const path = require('path');

const { extractReleaseNotes } = require('../extract-release-notes');

describe('GitHub release notes', () => {
  it('extracts the current package version from the curated changelog', () => {
    const packageJson = require('../../package.json');
    const changelog = fs.readFileSync(
      path.join(__dirname, '..', '..', 'CHANGELOG.md'),
      'utf8'
    );

    const notes = extractReleaseNotes(changelog, packageJson.version);

    expect(notes).toContain('### Breaking Changes');
    expect(notes).toContain('### Compatibility');
    expect(notes).toContain(`compare/v1.1.0...v${packageJson.version}`);
    expect(notes).not.toContain('## [1.1.0]');
  });

  it('rejects a missing version section', () => {
    expect(() =>
      extractReleaseNotes(
        '## [Unreleased]\n\n[2.0.0]: https://example.test/compare\n',
        '2.0.0'
      )
    ).toThrow('Expected exactly one changelog section for 2.0.0, found 0');
  });

  it('rejects an empty version section', () => {
    expect(() =>
      extractReleaseNotes(
        '## [2.0.0] - 2026-07-31\n\n## [1.1.0] - 2026-04-23\n\n' +
          '[2.0.0]: https://example.test/compare\n',
        '2.0.0'
      )
    ).toThrow('Changelog section for 2.0.0 is empty');
  });

  it('rejects a missing comparison link', () => {
    expect(() =>
      extractReleaseNotes(
        '## [2.0.0] - 2026-07-31\n\n### Features\n\n- Added support.\n',
        '2.0.0'
      )
    ).toThrow('Changelog comparison link for 2.0.0 is missing');
  });
});
