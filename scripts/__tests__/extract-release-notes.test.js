const fs = require('fs');
const path = require('path');

const { extractReleaseNotes } = require('../extract-release-notes');

describe('GitHub release notes', () => {
  const changelog = fs.readFileSync(
    path.join(__dirname, '..', '..', 'CHANGELOG.md'),
    'utf8'
  );

  it('extracts the 2.0.0 notes without including neighboring releases', () => {
    const notes = extractReleaseNotes(changelog, '2.0.0');

    expect(notes).toContain('### Breaking Changes');
    expect(notes).toContain('### Compatibility');
    expect(notes).toContain('compare/v1.1.0...v2.0.0');
    expect(notes).not.toContain('## [1.1.0]');
  });

  it('extracts curated notes and a comparison link for the package being published', () => {
    const packageJson = require('../../package.json');
    const notes = extractReleaseNotes(changelog, packageJson.version);

    expect(notes).toMatch(/^### \S/m);
    expect(notes).toContain('**Full Changelog**: https://github.com/');
    expect(notes).toContain(`...v${packageJson.version}\n`);
    expect(notes).not.toMatch(/^## \[/m);
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
