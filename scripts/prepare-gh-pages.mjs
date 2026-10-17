import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const BROWSER_DIST = path.join(ROOT_DIR, 'dist', 'fresnel', 'browser');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const TMP_GH_PAGES = path.join('/tmp', 'gh-pages-dist');

function copyDirRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[GH-Pages] Preparing static distribution for GitHub Pages...');

if (!fs.existsSync(BROWSER_DIST)) {
  console.error('[GH-Pages] dist/fresnel/browser does not exist. Run build first.');
  process.exit(1);
}

// Clean and populate docs/ and /tmp/gh-pages-dist
for (const targetDir of [DOCS_DIR, TMP_GH_PAGES]) {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  copyDirRecursive(BROWSER_DIST, targetDir);

  const indexPath = path.join(targetDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf-8');
    // Replace <base href="/"> with <base href="/Website_Checker/">
    html = html.replace(/<base\s+href="\/">/i, '<base href="/Website_Checker/">');
    fs.writeFileSync(indexPath, html, 'utf-8');

    // Create 404.html as a duplicate of index.html for SPA routing
    const notFoundPath = path.join(targetDir, '404.html');
    fs.writeFileSync(notFoundPath, html, 'utf-8');
  }

  // Create .nojekyll so GitHub Pages does not run Jekyll processing
  fs.writeFileSync(path.join(targetDir, '.nojekyll'), '', 'utf-8');
}

console.log('[GH-Pages] Successfully prepared docs/ and /tmp/gh-pages-dist with base-href /Website_Checker/, 404.html, and .nojekyll');
