// Builds the static site into dist/, ready to upload to any web host.
// No dependencies: copies the site files and lightly minifies CSS/JS.
const fs = require("fs");
const path = require("path");

const root = __dirname;
const out = path.join(root, "dist");

const minifyCss = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "")
   .replace(/\s+/g, " ")
   .replace(/\s*([{}:;,>])\s*/g, "$1")
   .replace(/;}/g, "}")
   .trim();

// Only strips full-line comments and blank lines, so it's safe for the JS here
const minifyJs = (s) =>
  s.split("\n")
   .filter((line) => !/^\s*\/\//.test(line) && line.trim() !== "")
   .map((line) => line.trim())
   .join("\n");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "images"), { recursive: true });

fs.copyFileSync(path.join(root, "index.html"), path.join(out, "index.html"));
fs.writeFileSync(path.join(out, "styles.css"), minifyCss(fs.readFileSync(path.join(root, "styles.css"), "utf8")));
for (const f of ["recipes.js", "script.js"]) {
  fs.writeFileSync(path.join(out, f), minifyJs(fs.readFileSync(path.join(root, f), "utf8")));
}

const images = fs.readdirSync(path.join(root, "images")).filter((f) => /\.(jpe?g|png|webp|gif|svg)$/i.test(f));
for (const f of images) fs.copyFileSync(path.join(root, "images", f), path.join(out, "images", f));

const size = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);

console.log(`Built dist/ (${images.length} images, ${(size(out) / 1024 / 1024).toFixed(1)} MB)`);
