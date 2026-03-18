const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8').replace(/\r\n/g, '\n');
const old = '    const mediaUrlsJson = JSON.stringify(mediaUrls);\n    win.document.write';
const idx = c.indexOf(old);
if (idx === -1) { console.log('NOT FOUND'); process.exit(1); }
c = c.slice(0, idx) + '    win.document.write';
const rest = c.indexOf('win.document.write');
console.log('idx:', idx);
fs.writeFileSync('script.js', c);
console.log('OK');
