#!/usr/bin/env node
/* Builds the Google Apps Script version of Pakistan Runner from pakistan-runner/.
 * Run:  node tools/build-gas.js
 * Output: google-apps-script/ (Code.gs, appsscript.json and one .html file per part)
 */
'use strict';
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '../pakistan-runner'), out = path.join(__dirname, '../google-apps-script');
fs.mkdirSync(out, { recursive: true });
const read = (p) => fs.readFileSync(path.join(src, p), 'utf8');

// Each script or stylesheet becomes its own HTML file that index.html pulls in.
const parts = [
  ['style', 'css/style.css', 'style'],
  ['three', 'js/vendor/three.min.js', 'script'],
  ['data', 'js/data.js', 'script'],
  ['art', 'js/art.js', 'script'],
  ['world', 'js/world.js', 'script'],
  ['audio', 'js/audio.js', 'script'],
  ['game', 'js/game.js', 'script']
];
parts.forEach(([name, file, tag]) => {
  const body = read(file);
  if (/<\/(script|style)/i.test(body)) throw new Error(file + ' contains a closing ' + tag + ' tag');
  fs.writeFileSync(path.join(out, name + '.html'), `<${tag}>\n${body}\n</${tag}>\n`);
});

// index.html: the game page with the files included by Apps Script.
let html = read('index.html');
html = html.replace(/<meta name="viewport"[^>]*>\n/, '').replace(/<meta name="theme-color"[^>]*>\n/, '').replace(/<title>[^<]*<\/title>\n/, '');
html = html.replace('<link rel="stylesheet" href="css/style.css">', "<?!= include('style'); ?>");
html = html.replace(/<script src="js\/vendor\/three\.min\.js"><\/script>[\s\S]*<script src="js\/game\.js"><\/script>/,
  parts.slice(1).map(([n]) => `<?!= include('${n}'); ?>`).join('\n'));
if (/src="js\//.test(html) || /href="css\//.test(html)) throw new Error('index.html still links a local file');
fs.writeFileSync(path.join(out, 'index.html'), html);

fs.writeFileSync(path.join(out, 'Code.gs'), `/**
 * Pakistan Runner as a Google Apps Script web app.
 * Deploy > New deployment > Web app, then open the web app URL to play.
 * Built from pakistan-runner/ by tools/build-gas.js; edit the originals, not these files.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Pakistan Runner')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Pulls one of the other HTML files into index.html. */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
`);
fs.writeFileSync(path.join(out, 'appsscript.json'), JSON.stringify({
  timeZone: 'Asia/Karachi', exceptionLogging: 'STACKDRIVER', runtimeVersion: 'V8',
  webapp: { executeAs: 'USER_DEPLOYING', access: 'ANYONE_ANONYMOUS' }
}, null, 2) + '\n');
fs.readdirSync(out).forEach((f) => console.log(f.padEnd(16), (fs.statSync(path.join(out, f)).size / 1024).toFixed(0) + ' KB'));
