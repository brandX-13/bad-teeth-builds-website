// Website-only static integrity checks. No dependencies and no file writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expected = {
  "privacy/index.html": "045e49e211cb5d1b187295a22d844c7e68fb40f862a9055d3749d5a2438602ea",
  "support/index.html": "43d6e44c040dcf1610b86850cda7a6252cbd7549c393704fc728d328629db1d9",
  "CNAME": "eb454a15cecc77dc5cca0e7fc8ad57eddf56be282196afa63e8c84ff2ecf6b1b",
  "assets/ChatGPT Image Nov 3, 2026, 02_59_08 PM.jpg": "dcfdc3d0988ee99b329a3d5abc2d112586177beaa153aef82f1b31212a858472",
  "assets/ChatGPT Image Nov 3, 2026, 02_59_16 PM.jpg": "222e9d787891b5b8de4c87e2906a48ed403e88752ae158b664f5a1dba4c25287",
  "assets/ChatGPT Image Nov 3, 2026, 02_59_25 PM.jpg": "e750032fd7621ec8b7c08d6e200ed0cad4b2b28bdf8fbd5c84d82c586d517360",
  "assets/ChatGPT Image Nov 3, 2026, 02_59_32 PM.jpg": "72d17d9147f56b1bdf3f3ce1fe02dab3d1f470c95b73e49c143eabe76b30aa63",
  "assets/ChatGPT Image Nov 3, 2026, 02_59_40 PM.jpg": "ee569713fed411891fed4d9da8aab727e6f1b755d177211896233811ec230efd"
};
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
for (const [file, hash] of Object.entries(expected)) {
  assert.equal(sha(fs.readFileSync(path.join(root, file))), hash, 'Protected original changed: ' + file);
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles/site.css'), 'utf8');
assert(html.startsWith('<!doctype html>') && /<html lang="en">/.test(html));
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert(!/<(?:script|iframe|object|embed|form)\b/i.test(html), 'Unexpected script, embed or form');
assert(!/@import|@font-face|url\s*\(/i.test(css), 'Unexpected remote/font/image CSS resource');
assert(!/style="|on(?:click|load|error)=/i.test(html), 'Unexpected inline behavior');
assert(!/filter:|object-fit:\s*cover/i.test(css), 'Original artwork must not be filtered or cropped');
assert(!html.includes('\uFFFD'), 'Invalid replacement character');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate anchor');
for (const id of ['main', 'top', 'videos', 'maintenance', 'installs', 'fabrication', 'shop-talk', 'garage', 'coil-cover', 'app', 'merch', 'partners', 'about']) assert(ids.includes(id), 'Missing section ' + id);
const links = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
let local = 0, anchors = 0, channel = 0;
for (const href of links) {
  if (href.startsWith('#')) { assert(ids.includes(href.slice(1)), 'Broken anchor ' + href); anchors++; continue; }
  if (href.startsWith('mailto:')) { assert(href.startsWith('mailto:brandxtattoo@hotmail.com')); continue; }
  if (/^https?:/.test(href)) { assert.equal(href, 'https://youtube.com/@brandx-design', 'Unapproved external link'); channel++; continue; }
  const file = path.resolve(root, decodeURIComponent(href));
  assert(file.startsWith(root + path.sep), 'Path escapes website');
  assert(fs.existsSync(file), 'Broken local link ' + href);
  local++;
}
const images = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]);
assert.equal(images.length, 2);
const imageFiles = [];
for (const tag of images) {
  assert(/\balt="[^"]{20,}"/.test(tag), 'Missing descriptive image alternative');
  assert(/\bwidth="1536"/.test(tag) && /\bheight="(?:864|1152)"/.test(tag));
  assert(/\bdecoding="async"/.test(tag));
  const file = decodeURIComponent(tag.match(/\bsrc="([^"]+)"/)[1]);
  assert(file in expected, 'Unverified image ' + file);
  imageFiles.push(file);
}
assert.deepEqual(imageFiles.slice().sort(), [
  'assets/ChatGPT Image Nov 3, 2026, 02_59_32 PM.jpg',
  'assets/ChatGPT Image Nov 3, 2026, 02_59_40 PM.jpg'
]);
for (const filename of ['02_59_08 PM.jpg', '02_59_16 PM.jpg', '02_59_25 PM.jpg']) {
  assert(!decodeURIComponent(html).includes(filename), 'Removed full-motorcycle photo is still referenced: ' + filename);
}
assert.equal(images.filter(tag => /\bloading="lazy"/.test(tag)).length, 1);
assert(html.includes('href="privacy/"') && html.includes('href="support/"'));
assert(html.includes('The app is not publicly released yet.'));
assert(html.includes('COMING SOON'));
assert(/:focus-visible/.test(css) && /prefers-reduced-motion/.test(css) && /forced-colors/.test(css));
assert(/@media \(max-width: 760px\)/.test(css) && /@media \(max-width: 430px\)/.test(css));
assert(!/display:\s*none/.test(css.slice(css.indexOf('.main-nav'), css.indexOf('.button {'))), 'Navigation hidden without an alternative');
console.log('PASS protected privacy/support/CNAME and all five original images: byte-for-byte unchanged.');
console.log('PASS ' + local + ' local references, ' + anchors + ' anchor links, ' + channel + ' verified-channel links; unique section IDs.');
console.log('PASS original banner and coil photo, descriptive alternatives, explicit dimensions, deferred coil loading; no full-motorcycle photo references.');
console.log('PASS static architecture, local resources, app release/merch labels, keyboard focus and responsive/reduced-motion rules.');
console.log('Browser layout, link interaction and viewport checks must also be run; this checker is not a physical-device test.');
