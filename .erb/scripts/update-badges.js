const fs = require('fs');
const path = require('path');

const rootPkgPath = path.join(__dirname, '../../package.json');
const appPkgPath = path.join(__dirname, '../../release/app/package.json');

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const appPkg = JSON.parse(fs.readFileSync(appPkgPath, 'utf8'));

const version = rootPkg.version;

// Sync version from root package.json into release/app/package.json
appPkg.version = version;
fs.writeFileSync(appPkgPath, JSON.stringify(appPkg, null, 2) + '\n');
const react = rootPkg.dependencies.react.replace(/[\^~>=<]/g, '');
const electron = rootPkg.devDependencies.electron.replace(/[\^~>=<]/g, '');

const readmePath = path.join(__dirname, '../../README.md');
let readme = fs.readFileSync(readmePath, 'utf8');

readme = readme.replace(
    /https:\/\/img\.shields\.io\/badge\/version-[^-]+-blue/,
    `https://img.shields.io/badge/version-${version}-blue`,
);
readme = readme.replace(
    /https:\/\/img\.shields\.io\/badge\/react-[^-]+-61DAFB/,
    `https://img.shields.io/badge/react-${react}-61DAFB`,
);
readme = readme.replace(
    /https:\/\/img\.shields\.io\/badge\/electron-[^-]+-47848F/,
    `https://img.shields.io/badge/electron-${electron}-47848F`,
);

fs.writeFileSync(readmePath, readme);
console.log(
    `Updated badges: version=${version}, react=${react}, electron=${electron}`,
);
