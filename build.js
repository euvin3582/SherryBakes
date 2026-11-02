// Builds the site into dist/, ready to upload to the web host (PHP is needed for the quote form's api/ folder).
// No dependencies: copies the site files and lightly minifies CSS/JS.
//
// Upload the CONTENTS of dist/ to the site's folder on HostGator. The api/ scripts read the database login
// from lead-config.php in the hosting account's home folder (the same file the Fight Cancer site uses),
// so lead-config.php is never part of the upload.
const fs = require("fs");
const path = require("path");

const root = __dirname;
const out = path.join(root, "dist");

const STYLES = ["styles.css", "leads.css"];
const SCRIPTS = ["recipes.js", "script.js", "leads.js", "ads.js"];
const COPY_AS_IS = ["index.html", ".htaccess", "api", "data"];
const IMAGE = /\.(jpe?g|png|webp|gif|svg)$/i;

const minifyCss = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "")
   .replace(/\s+/g, " ")
   .replace(/\s*([{};,>])\s*/g, "$1")
   .replace(/([{;])\s*([a-z-]+)\s*:\s*/g, "$1$2:")
   .replace(/;}/g, "}")
   .trim();

// Only strips full-line comments, blank lines and indentation, so it's safe for the JS here
const minifyJs = (s) =>
  s.split("\n")
   .filter((line) => !/^\s*\/\//.test(line) && line.trim() !== "")
   .map((line) => line.trim())
   .join("\n");

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const write = (rel, content) => {
  fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true });
  fs.writeFileSync(path.join(out, rel), content);
};

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const f of STYLES) write(f, minifyCss(read(f)));
for (const f of SCRIPTS) write(f, minifyJs(read(f)));
for (const f of COPY_AS_IS) fs.cpSync(path.join(root, f), path.join(out, f), { recursive: true });
// Photos only (images/CREDITS.md and other notes stay out of the upload)
fs.cpSync(path.join(root, "images"), path.join(out, "images"), {
  recursive: true,
  filter: (src) => fs.statSync(src).isDirectory() || IMAGE.test(src),
});

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(out);
const mb = files.reduce((n, f) => n + fs.statSync(f).size, 0) / 1024 / 1024;
console.log(`Built dist/: ${files.length} files, ${files.filter((f) => IMAGE.test(f)).length} images, ${mb.toFixed(1)} MB`);
