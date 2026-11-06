// Website-only static integrity checks. No dependencies and no file writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
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
const css = fs.readFileSync(path.join(root, 'styles/site.css'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'styles/fabrication.css'), 'utf8');
const portfolio = JSON.parse(fs.readFileSync(path.join(root, 'assets/fabrication/manifest.json'), 'utf8'));
const portfolioPhotos = portfolio.projects.flatMap(project => project.photos);
const portfolioByPath = new Map(portfolioPhotos.map(photo => [photo.src, photo]));
assert(html.startsWith('<!doctype html>') && /<html lang="en">/.test(html));
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert(!/<(?:iframe|object|embed|form)\b/i.test(html), 'Unexpected embed or form');
assert.deepEqual(html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi), ['<script src="scripts/mobile-gallery.js" defer></script>', '<script src="scripts/share-site.js" defer></script>'], 'Only the approved local gallery and sharing enhancements are allowed');
assert(!/@import|@font-face|url\s*\(/i.test(css), 'Unexpected remote/font/image CSS resource');
assert(!/style="|on(?:click|load|error)=/i.test(html), 'Unexpected inline behavior');
assert(!/filter:|object-fit:\s*cover/i.test(css), 'Original artwork must not be filtered or cropped');
assert(!html.includes('\uFFFD'), 'Invalid replacement character');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate anchor');
for (const id of ['main', 'top', 'videos', 'maintenance', 'installs', 'fabrication', 'shop-talk', 'garage', 'coil-cover', 'app', 'merch', 'partners', 'about']) assert(ids.includes(id), 'Missing section ' + id);
const links = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
const seriesPlaylists = {
  "maintenance": {
    "number": 1,
    "url": "https://www.youtube.com/playlist?list=PLGz0VVctYMiQ"
  },
  "installs": {
    "number": 2,
    "url": "https://www.youtube.com/playlist?list=PLRdiEbhCl5sc"
  },
  "fabrication": {
    "number": 3,
    "url": "https://www.youtube.com/playlist?list=PLdkLuscRNGCw"
  },
  "shop-talk": {
    "number": 4,
    "url": "https://www.youtube.com/playlist?list=PLdIEpr4_Ehpk"
  }
};
const channelURL = 'https://youtube.com/@brandx-design';
const approvedYouTubeURLs = new Set([channelURL, ...Object.values(seriesPlaylists).map(series => series.url)]);
const shareEmail = 'mailto:?subject=Bad%20Teeth%20Builds&amp;body=https%3A%2F%2Fbrandx-design.com%2F';
const shareFacebook = 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fbrandx-design.com%2F';
const shareSMS = 'sms:?body=https%3A%2F%2Fbrandx-design.com%2F';
let local = 0, anchors = 0, channel = 0, playlistLinks = 0, facebookLinks = 0;
for (const href of links) {
  if (href.startsWith('#')) { assert(ids.includes(href.slice(1)), 'Broken anchor ' + href); anchors++; continue; }
  if (href.startsWith('mailto:')) { assert(href.startsWith('mailto:brandxtattoo@hotmail.com') || href === shareEmail); continue; }
  if (href === shareSMS) continue;
  if (href === shareFacebook) { facebookLinks++; continue; }
  if (/^https?:/.test(href)) { assert(approvedYouTubeURLs.has(href), 'Unapproved external link ' + href); if (href === channelURL) channel++; else playlistLinks++; continue; }
  const file = path.resolve(root, decodeURIComponent(href));
  assert(file.startsWith(root + path.sep), 'Path escapes website');
  assert(fs.existsSync(file), 'Broken local link ' + href);
  local++;
}
for (const [id, series] of Object.entries(seriesPlaylists)) {
  const card = html.match(new RegExp('<article class="series-card" id="' + id + '"[\\s\\S]*?</article>'))?.[0];
  assert(card, 'Missing series card ' + id);
  assert.equal((card.match(/<a\b/g) || []).length, 1, 'Each card must use one interactive link');
  assert(card.includes('href="' + series.url + '" target="_blank" rel="noopener noreferrer"'), 'Wrong series playlist or link protections: ' + id);
  assert(card.includes('>Watch Series ' + series.number + ' <'), 'Wrong series call to action: ' + id);
  assert(card.includes('opens the playlist in a new tab'), 'Stale channel accessibility wording');
}
assert.equal(facebookLinks, 1, 'One approved Facebook sharing URL');
assert.equal(playlistLinks, 4);
assert.equal(channel, 5, 'Existing channel buttons/links must remain unchanged');
assert(css.includes('.series-card > a::after { content: ""; position: absolute; inset: -3px -1px -1px;'), 'Series links must cover the whole card');
const images = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]);
assert.equal(images.length, 25);
const imageFiles = [];
for (const tag of images) {
  assert(/\balt="[^"]{20,}"/.test(tag), 'Missing descriptive image alternative');
  assert(/\bwidth="[1-9][0-9]*"/.test(tag) && /\bheight="[1-9][0-9]*"/.test(tag));
  assert(/\bdecoding="async"/.test(tag));
  const file = decodeURIComponent(tag.match(/\bsrc="([^"]+)"/)[1]);
  assert(file in expected || portfolioByPath.has(file), 'Unverified image ' + file);
  if (portfolioByPath.has(file)) {
    const photo = portfolioByPath.get(file);
    assert(tag.includes('width="' + photo.width + '"') && tag.includes('height="' + photo.height + '"'), 'Wrong derivative dimensions');
    assert.equal(sha(fs.readFileSync(path.join(root, file))), photo.sha256, 'Derivative changed: ' + file);
  } else {
    assert(/\bwidth="1536"/.test(tag) && /\bheight="(?:864|1152)"/.test(tag));
  }
  imageFiles.push(file);
}
assert.deepEqual(imageFiles.filter(file => file in expected).sort(), [
  'assets/ChatGPT Image Nov 3, 2026, 02_59_32 PM.jpg',
  'assets/ChatGPT Image Nov 3, 2026, 02_59_40 PM.jpg'
]);
for (const filename of ['02_59_08 PM.jpg', '02_59_16 PM.jpg', '02_59_25 PM.jpg']) {
  assert(!decodeURIComponent(html).includes(filename), 'Removed full-motorcycle photo is still referenced: ' + filename);
}
assert.equal(images.filter(tag => /\bloading="lazy"/.test(tag)).length, 24);
assert(html.includes('href="privacy/"') && html.includes('href="support/"'));
assert(html.includes('The app is not publicly released yet.'));
assert(html.includes('COMING SOON'));
assert(/:focus-visible/.test(css) && /prefers-reduced-motion/.test(css) && /forced-colors/.test(css));
assert(/@media \(max-width: 760px\)/.test(css) && /@media \(max-width: 430px\)/.test(css));
assert(!/display:\s*none/.test(css.slice(css.indexOf('.main-nav'), css.indexOf('.button {'))), 'Navigation hidden without an alternative');

// Approved owner-confirmed portfolio grouping. Every source appears once.
const approvedProjects = {
  A: ['BX Honeycomb Floorboards & Hinged Mounts', 'Foot Controls & Floorboards', ['5220', '5231', '5245', '5258', '5259']],
  B: ['Custom Domed & Vented Air Cleaner', 'Intake & Air-Cleaner Fabrication', ['5774', '5775', '5776']],
  C: ['Custom Teardrop Air Cleaner', 'Intake & Air-Cleaner Fabrication', ['5810', '5811', '5812']],
  D: ['Custom Honeycomb Air Cleaner', 'Intake & Air-Cleaner Fabrication', ['5910', '5911', '5912']],
  E: ['Custom Dual-Headlight Assembly & Mounting Bracket', 'Lighting & Mounting Fabrication', ['7619', '7622', '7623']],
  F: ['Custom Ribbed Teardrop Air Cleaner', 'Intake & Air-Cleaner Fabrication', ['7699', '7700', '7701']],
  G: ['AMF/Harley-Themed Honeycomb Floorboards', 'Foot Controls & Floorboards', ['8067', '8092', '8107']]
};
const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
assert.equal(portfolio.projects.length, 7);
assert.equal(new Set(portfolio.projects.map(project => project.id)).size, 7);
assert.equal(new Set(portfolio.projects.map(project => project.category)).size, 3);
assert.equal(portfolioPhotos.length, 23);
assert.equal(portfolioByPath.size, 23);
assert.equal(new Set(portfolioPhotos.map(photo => photo.original)).size, 23);
const garage = html.slice(html.indexOf('    <section class="garage-section'), html.indexOf('    <section class="section container app-section'));
assert.equal((garage.match(/class="portfolio-category"/g) || []).length, 3);
assert.equal((garage.match(/class="fabrication-project"/g) || []).length, 7);
assert.equal((garage.match(/class="project-gallery"/g) || []).length, 7);
assert.equal((garage.match(/class="steel-frame project-photo"/g) || []).length, 23);
assert(garage.includes('id="coil-cover"') && garage.includes('id="fabrication-portfolio"'));
assert(garage.indexOf('id="coil-cover"') < garage.indexOf('id="fabrication-portfolio"'));
for (const project of portfolio.projects) {
  const approved = approvedProjects[project.id];
  assert(approved, 'Unexpected project ' + project.id);
  assert.equal(project.title, approved[0]);
  assert.equal(project.category, approved[1]);
  assert.deepEqual(project.photos.map(photo => photo.original), approved[2].map(number => 'IMG_' + number + '.HEIC'));
  const article = garage.match(new RegExp('<article class="fabrication-project" id="' + project.slug + '"[\\s\\S]*?</article>'))?.[0];
  assert(article, 'Missing project gallery ' + project.id);
  assert(article.includes(escapeHtml(project.title)) && article.includes(escapeHtml(project.description)));
  assert.equal((article.match(/<img\b/g) || []).length, project.photos.length);
  for (const photo of project.photos) {
    assert.equal(html.split('src="' + photo.src + '"').length - 1, 1, 'Duplicate or absent photo ' + photo.original);
    assert(article.includes('href="' + photo.src + '" target="_blank" rel="noopener"'), 'Missing enlargement link');
    assert(article.includes('alt="' + escapeHtml(photo.alt) + '"'), 'Incorrect alternative text');
    assert.equal(sha(fs.readFileSync(path.join(root, photo.small_src))), photo.small_sha256, 'Small derivative changed: ' + photo.original);
    assert(article.includes('srcset="' + photo.small_src + ' ' + photo.small_width + 'w, ' + photo.src + ' ' + photo.width + 'w"'), 'Missing responsive image candidates');
    assert(Math.abs(photo.small_width / photo.small_height - photo.original_width / photo.original_height) < .003, 'Cropped/stretched small derivative');
    assert(Math.abs(photo.width / photo.height - photo.original_width / photo.original_height) < .002, 'Cropped/stretched derivative');
  }
}
assert.equal(portfolio.projects.find(project => project.id === 'E').description, 'Custom-fabricated dual-headlight assembly and mounting bracket, designed and built for a one-of-a-kind motorcycle project.');
assert.equal(portfolio.derivative_settings.encoding, 'lossless');
assert.equal(portfolio.derivative_settings.crop, false);
const archive = path.join(root, portfolio.archive);
if (fs.existsSync(archive)) assert.equal(sha(fs.readFileSync(archive)), portfolio.archive_sha256, 'Original archive changed');
assert(!html.includes('src=".preview/') && !html.includes('src="Fabrication.zip'));
assert(css.includes('.project-gallery { display: grid;') && css.includes('grid-template-columns: 1fr;'));
console.log('PASS seven owner-confirmed projects in three categories; all 23 original filenames mapped once to full-frame lossless WebP derivatives.');
console.log('PASS gallery grouping, dimensions, hashes, descriptive alternatives, enlargement links and deferred loading.');

console.log('PASS protected privacy/support/CNAME and all five original images: byte-for-byte unchanged.');
console.log('PASS ' + local + ' local references, ' + anchors + ' anchor links, ' + channel + ' verified-channel links, ' + playlistLinks + ' owner-approved playlist links; unique section IDs.');
console.log('PASS original banner and coil photo, descriptive alternatives, explicit dimensions, deferred coil loading; previously removed homepage photos remain unreferenced.');
console.log('PASS static architecture, local resources, app release/merch labels, keyboard focus and responsive/reduced-motion rules.');
// Sharing tests simulate browser capabilities without sending messages or touching the clipboard.
const shareSource = fs.readFileSync(path.join(root, 'scripts/share-site.js'), 'utf8');
const publicUrl = 'https://brandx-design.com/';
const approvedServices = ['email', 'facebook', 'instagram', 'tiktok', 'messenger', 'sms', 'copy'];
assert.deepEqual([...html.matchAll(/data-share="([^"]+)"/g)].map(m => m[1]), approvedServices);
const approvedLabels = ['Open Email', 'Share on Facebook', 'Copy for Instagram', 'Copy for TikTok', 'Copy for Messenger', 'Open Messages', 'Copy Link'];
assert.deepEqual([...html.matchAll(/<(?:a|button)\b[^>]*data-share="[^"]+"[^>]*>([^<]+)</g)].map(m => m[1].trim()), approvedLabels);
const emailURL = new URL(shareEmail.replaceAll('&amp;', '&'));
assert.equal(emailURL.protocol, 'mailto:');
assert.equal(emailURL.pathname, '', 'Email sharing does not preselect a recipient');
assert.equal(emailURL.searchParams.get('subject'), 'Bad Teeth Builds');
assert.equal(emailURL.searchParams.get('body'), publicUrl);
assert.deepEqual([...emailURL.searchParams.keys()], ['subject', 'body']);
assert.equal((html.match(/id="share-dialog"/g) || []).length, 1);
assert(html.includes('aria-haspopup="dialog" aria-controls="share-dialog"'));
assert(html.includes('id="share-status" role="status" aria-live="polite" aria-atomic="true"'));
assert(html.includes('SHARE THE <span class="red-text">MADNESS!</span>'));
assert(html.includes('Know somebody who belongs in this garage?'));
assert(html.includes('<p class="share-motto">STEEL BEFORE SMILES</p>'));
assert(html.includes('id="share-url" type="url" value="' + publicUrl + '" readonly'));
assert(!/navigator\.share|fetch\(|XMLHttpRequest/.test(shareSource), 'No native share sheet or remote services');
function shareHarness(navigator = {}) {
  let activeElement;
  const element = () => ({
    hidden: true, textContent: '', open: false, attributes: new Map(), listeners: new Map(),
    addEventListener(type, listener) { this.listeners.set(type, listener); },
    emit(type, event = {}) { this.listeners.get(type)?.(event); },
    click() { this.emit('click'); },
    setAttribute(name, value) { this.attributes.set(name, value); },
    removeAttribute(name) { this.attributes.delete(name); },
    focus() { this.focused = true; activeElement = this; }, select() { this.selected = true; },
    closest() { return null; }, getClientRects() { return [{}]; }
  });
  const elements = Object.fromEntries(['share-site', 'share-dialog', 'share-close', 'share-status', 'share-manual', 'share-url', 'share-sms'].map(id => [id, element()]));
  const options = approvedServices.map(service => Object.assign(element(), { dataset: { share: service } }));
  const dialog = elements['share-dialog'];
  elements['share-url'].closest = () => elements['share-manual'].hidden ? elements['share-manual'] : null;
  dialog.querySelectorAll = selector => selector === '[data-share]' ? options : [elements['share-close'], ...options, elements['share-url']];
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.emit('close'); };
  dialog.getBoundingClientRect = () => ({ left: 20, top: 20, right: 600, bottom: 700 });
  const classes = new Set();
  vm.runInNewContext(shareSource, {
    navigator, document: { get activeElement() { return activeElement; }, getElementById: id => elements[id], body: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } } }
  });
  return { elements, options, dialog, classes, open: () => elements['share-site'].click(), choose: service => options.find(o => o.dataset.share === service).click() };
}
const flush = () => new Promise(setImmediate);
const copied = [];
const working = shareHarness({ clipboard: { writeText: async url => { copied.push(url); } } });
working.open();
assert(working.dialog.open && working.elements['share-close'].focused && working.classes.has('share-popup-open'));
working.options.at(-1).focus();
working.dialog.emit('keydown', { key: 'Tab', preventDefault() {} });
assert(working.elements['share-close'].focused, 'Tab wraps to Close');
working.dialog.emit('keydown', { key: 'Tab', shiftKey: true, preventDefault() {} });
assert(working.options.at(-1).focused, 'Shift-Tab wraps to Copy Link');
for (const service of ['instagram', 'tiktok', 'messenger', 'copy']) {
  working.choose(service);
  await flush();
  assert.equal(copied.at(-1), publicUrl);
  assert.equal(working.elements['share-status'].textContent, service === 'copy' ? 'Link copied!' :
    'Link copied! Paste it into ' + { instagram: 'Instagram', tiktok: 'TikTok', messenger: 'Messenger' }[service] + '.');
  assert(working.elements['share-manual'].hidden);
}
for (const service of ['email', 'facebook', 'sms']) {
  const before = copied.length;
  working.choose(service);
  assert.equal(copied.length, before);
  assert(working.elements['share-status'].textContent.includes('use Copy Link'));
  assert.equal(working.elements['share-manual'].hidden, service !== 'sms', 'SMS always offers the manual-copy fallback');
  if (service === 'sms') assert(!working.elements['share-url'].focused, 'SMS fallback must not steal focus from app handoff');
}
working.elements['share-close'].click();
assert(!working.dialog.open && !working.classes.has('share-popup-open') && working.elements['share-site'].focused);
working.open();
assert.equal(working.elements['share-status'].textContent, '', 'Reopening resets old feedback');
let prevented = false;
working.dialog.emit('cancel', { preventDefault() { prevented = true; } });
assert(prevented && !working.dialog.open, 'Escape closes');
working.open();
working.dialog.emit('pointerdown', { target: working.dialog, clientX: 0, clientY: 0 });
working.dialog.emit('click', { target: working.dialog, clientX: 0, clientY: 0 });
assert(!working.dialog.open, 'Backdrop click closes');
working.open();
working.dialog.emit('pointerdown', { target: working.dialog, clientX: 30, clientY: 30 });
working.dialog.emit('click', { target: working.dialog, clientX: 0, clientY: 0 });
assert(working.dialog.open, 'A drag starting inside does not dismiss');
for (const navigator of [{}, { clipboard: { writeText: async () => { throw new Error('Denied'); } } }]) {
  const manual = shareHarness(navigator);
  manual.open();
  manual.choose('messenger');
  await flush();
  assert(!manual.elements['share-manual'].hidden && manual.elements['share-url'].focused && manual.elements['share-url'].selected);
  assert.equal(manual.elements['share-status'].textContent, 'Copy the website link below, then paste it into Messenger.');
  assert(!manual.dialog.attributes.has('aria-busy'));
}
let finishCopy;
let pendingCalls = 0;
const pending = shareHarness({ clipboard: { writeText: () => { pendingCalls++; return new Promise(resolve => { finishCopy = resolve; }); } } });
pending.open(); pending.choose('copy'); pending.choose('instagram');
assert.equal(pendingCalls, 1, 'Ignore repeated copy presses while pending');
pending.elements['share-close'].click(); pending.open();
finishCopy(); await flush();
assert.equal(pending.elements['share-status'].textContent, '', 'Stale clipboard result must not change a reopened popup');
assert(!pending.dialog.attributes.has('aria-busy'));
for (const [navigator, separator] of [
  [{ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', platform: 'iPhone' }, '&'],
  [{ userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', platform: 'iPad' }, '&'],
  [{ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', platform: 'MacIntel', maxTouchPoints: 5 }, '&'],
  [{ userAgent: 'Mozilla/5.0 (Linux; Android 15)', platform: 'Linux armv8l' }, '?'],
  [{ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32' }, '?'],
  [{ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', platform: 'MacIntel', maxTouchPoints: 0 }, '?']
]) {
  const h = shareHarness(navigator);
  assert.equal(h.elements['share-sms'].href, 'sms:' + separator + 'body=' + encodeURIComponent(publicUrl));
  assert.equal(h.elements['share-sms'].href.slice(4).split(/[?&]/)[0], '', 'SMS must not specify a recipient');
  assert.equal(decodeURIComponent(h.elements['share-sms'].href.split('body=')[1]), publicUrl);
  h.open(); h.choose('sms');
  assert(!h.elements['share-manual'].hidden && !h.elements['share-url'].focused);
  assert(h.elements['share-status'].textContent.includes('If nothing opens'));
}
vm.runInNewContext(shareSource, { document: { getElementById: () => null } });
console.log('PASS seven-option BTB popup: scoped URLs, honest feedback, clipboard success/denial/unavailable, close/reopen, stale-copy guard, Escape/backdrop/focus and SMS variants (simulated).');

console.log('Browser layout, link interaction and viewport checks must also be run; this checker is not a physical-device test.');
