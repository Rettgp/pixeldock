// Writes the three winget manifests (version, installer, default locale) for
// the current package.json version, hashing the final installer so the
// manifest matches exactly what users download from the GitHub release.
// usage: node winget-manifest.js <installer.exe> [outDir]
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PACKAGE_ID = 'Rettgp.PixelDock';
const MANIFEST_VERSION = '1.6.0';
const REPO = 'https://github.com/rettgp/pixeldock';

const [installerPath, outRoot = 'release/winget'] = process.argv.slice(2);
if (!installerPath) {
    console.error('usage: winget-manifest.js <installer.exe> [outDir]');
    process.exit(1);
}

const { version } = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'),
);
const installerName = path.basename(installerPath);
const sha256 = crypto
    .createHash('sha256')
    .update(fs.readFileSync(installerPath))
    .digest('hex')
    .toUpperCase();

// Every manifest shares the schema header, package identity and type footer
const manifest = (type, lines) =>
    [
        `# yaml-language-server: $schema=https://aka.ms/winget-manifest.${type}.${MANIFEST_VERSION}.schema.json`,
        `PackageIdentifier: ${PACKAGE_ID}`,
        `PackageVersion: ${version}`,
        ...lines,
        `ManifestType: ${type}`,
        `ManifestVersion: ${MANIFEST_VERSION}`,
        '',
    ].join('\n');

const files = {
    [`${PACKAGE_ID}.yaml`]: manifest('version', ['DefaultLocale: en-US']),

    [`${PACKAGE_ID}.installer.yaml`]: manifest('installer', [
        'InstallerLocale: en-US',
        'Platform:',
        '  - Windows.Desktop',
        'MinimumOSVersion: 10.0.0.0',
        // electron-builder's one-click NSIS installer installs per user
        'InstallerType: nullsoft',
        'Scope: user',
        'InstallModes:',
        '  - interactive',
        '  - silent',
        'UpgradeBehavior: install',
        `ReleaseDate: ${new Date().toISOString().slice(0, 10)}`,
        'Installers:',
        '  - Architecture: x64',
        `    InstallerUrl: ${REPO}/releases/download/v${version}/${installerName}`,
        `    InstallerSha256: ${sha256}`,
    ]),

    [`${PACKAGE_ID}.locale.en-US.yaml`]: manifest('defaultLocale', [
        'PackageLocale: en-US',
        'Publisher: Garrett Phelps',
        'PublisherUrl: https://github.com/rettgp',
        `PublisherSupportUrl: ${REPO}/issues`,
        'Author: Garrett Phelps',
        'PackageName: PixelDock',
        `PackageUrl: ${REPO}`,
        'License: MIT',
        `LicenseUrl: ${REPO}/blob/main/LICENSE`,
        'ShortDescription: A sleek desktop launcher for your Steam and non-Steam games.',
        'Description: PixelDock docks a half dial of your games to the edge of the screen. It reads your Steam library, including non-Steam shortcuts and SteamGridDB artwork, and updates live as games are installed or added.',
        'Moniker: pixeldock',
        'Tags:',
        '  - games',
        '  - launcher',
        '  - steam',
        '  - steamgriddb',
        `ReleaseNotesUrl: ${REPO}/releases/tag/v${version}`,
    ]),
};

const outDir = path.join(outRoot, 'manifests/r/Rettgp/PixelDock', version);
fs.mkdirSync(outDir, { recursive: true });
Object.entries(files).forEach(([name, content]) =>
    fs.writeFileSync(path.join(outDir, name), content),
);
console.log(
    `Wrote winget manifests for ${version} to ${outDir} (sha256 ${sha256})`,
);
