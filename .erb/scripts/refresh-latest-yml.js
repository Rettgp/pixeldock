// Signing changes the installer's bytes, so the sha512/size that
// electron-builder wrote into latest.yml no longer match. Recompute them.
// usage: node refresh-latest-yml.js <installer.exe> <latest.yml>
const crypto = require('crypto');
const fs = require('fs');

const [installerPath, latestPath] = process.argv.slice(2);
if (!installerPath || !latestPath) {
    console.error('usage: refresh-latest-yml.js <installer.exe> <latest.yml>');
    process.exit(1);
}

const bytes = fs.readFileSync(installerPath);
const sha512 = crypto.createHash('sha512').update(bytes).digest('base64');

const latest = fs
    .readFileSync(latestPath, 'utf8')
    .replace(/(sha512:\s*)\S+/g, `$1${sha512}`)
    .replace(/(size:\s*)\d+/g, `$1${bytes.length}`);

fs.writeFileSync(latestPath, latest);
console.log(`Updated ${latestPath}: size=${bytes.length}`);
