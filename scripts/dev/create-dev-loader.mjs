import fs from 'fs';
import path from 'path';
import { DEV_USER_SCRIPT_URL } from './dev-constants.mjs';

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const loaderPath = path.join(distDir, 'dev-loader.user.js');
const templatePath = path.resolve('scripts/dev/dev-loader.template.js');
const metaPath = path.resolve('meta.json');

const loaderBody = fs.readFileSync(templatePath, 'utf8');

if (!fs.existsSync(metaPath)) {
  console.error('meta.json not found at:', metaPath);
  process.exit(1);
}

let meta;
try {
  meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
} catch (e) {
  console.error('Failed to parse meta.json:', e);
  process.exit(1);
}

const { name, namespace, version, author, match } = meta;

if (!name || !namespace || !version || !author) {
  console.error('meta.json missing required fields: name/namespace/version/description/author');
  process.exit(1);
}

if (!Array.isArray(match) || match.length === 0) {
  console.error('meta.json "match" field must be a non-empty array');
  process.exit(1);
}

const matchLines = match.map((m) => `// @match        ${m}`).join('\n');

const header =
  `// ==UserScript==\n` +
  `// @name         ${name} (Dev Loader)\n` +
  `// @namespace    ${namespace}\n` +
  `// @version      ${version}\n` +
  `// @author       ${author}\n` +
  `${matchLines}\n` +
  `// @grant        GM_xmlhttpRequest\n` +
  `// @connect      localhost\n` +
  `// ==/UserScript==\n\n`;

const loaderContent = (header + loaderBody).replace('__DEV_URL__', DEV_USER_SCRIPT_URL);

fs.writeFileSync(loaderPath, loaderContent, 'utf8');
