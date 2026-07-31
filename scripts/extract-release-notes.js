#!/usr/bin/env node

const fs = require('fs');

const escapeRegularExpression = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractReleaseNotes = (changelog, version) => {
  const escapedVersion = escapeRegularExpression(version);
  const headingPattern = new RegExp(
    `^## \\[${escapedVersion}\\](?: - .+)?$`,
    'gm'
  );
  const headings = [...changelog.matchAll(headingPattern)];
  if (headings.length !== 1) {
    throw new Error(
      `Expected exactly one changelog section for ${version}, found ${headings.length}`
    );
  }

  const sectionStart = headings[0].index + headings[0][0].length;
  const remainingChangelog = changelog.slice(sectionStart);
  const nextHeading = remainingChangelog.search(/^## \[/m);
  const section = remainingChangelog
    .slice(0, nextHeading === -1 ? undefined : nextHeading)
    .trim();
  if (!section) {
    throw new Error(`Changelog section for ${version} is empty`);
  }

  const comparisonPattern = new RegExp(
    `^\\[${escapedVersion}\\]:\\s+(https://\\S+)\\s*$`,
    'm'
  );
  const comparison = changelog.match(comparisonPattern);
  if (!comparison) {
    throw new Error(`Changelog comparison link for ${version} is missing`);
  }

  return `${section}\n\n**Full Changelog**: ${comparison[1]}\n`;
};

const main = () => {
  const [, , changelogPath, version, outputPath] = process.argv;
  if (!changelogPath || !version || !outputPath) {
    throw new Error(
      'Usage: extract-release-notes.js <changelog> <version> <output>'
    );
  }

  const changelog = fs.readFileSync(changelogPath, 'utf8');
  fs.writeFileSync(outputPath, extractReleaseNotes(changelog, version));
};

if (require.main === module) {
  main();
}

module.exports = { extractReleaseNotes };
