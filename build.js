// Builds the folder Cloudflare Pages publishes (dist/).
//
// Run with:  node build.js
//
// Only the files listed here are copied, so working files (scratch/, tests/,
// README, node_modules) can never end up on the live site. If you add a new
// file the site needs, add it below; the check at the end fails the build if
// sw.js or index.html refers to something that was not copied.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");

const FILES = [
    "index.html",
    "style.css",
    "manifest.json",
    "sw.js",
    "script.js",
    "note-templates.js",
    "mha-data.js",
    "mha.js",
    "mha-ui.js",
    "ect.js",
    "_headers"
];
const FOLDERS = ["icons", "vendor"];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
FILES.forEach(file => fs.copyFileSync(path.join(ROOT, file), path.join(OUT, file)));
FOLDERS.forEach(dir => fs.cpSync(path.join(ROOT, dir), path.join(OUT, dir), { recursive: true }));

// Every file the service worker caches, and every local script, stylesheet,
// icon or manifest index.html loads, must be in dist/.
const swAssets = [...fs.readFileSync(path.join(ROOT, "sw.js"), "utf8").matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]);
const htmlRefs = [...fs.readFileSync(path.join(ROOT, "index.html"), "utf8").matchAll(/(?:src|href)="([^"#:]+)"/g)]
    .map(m => m[1].split("?")[0]);
const missing = [...new Set([...swAssets, ...htmlRefs])]
    .filter(ref => ref && !fs.existsSync(path.join(OUT, ref)));
if (missing.length) {
    console.error("Build failed. These files are used by the site but not copied by build.js:\n- " + missing.join("\n- "));
    process.exit(1);
}
console.log(`Built dist/ (${FILES.length} files, ${FOLDERS.length} folders).`);
