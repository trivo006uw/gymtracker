#!/usr/bin/env node
// Post-process the Expo web export for GitHub Pages (SPA + Jekyll-safe).
const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');
const index = path.join(dist, 'index.html');
if (!fs.existsSync(index)) {
  console.error('prepare-pages: dist/index.html not found. Run expo export first.');
  process.exit(1);
}
fs.copyFileSync(index, path.join(dist, '404.html'));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('prepare-pages: wrote dist/404.html and dist/.nojekyll');
