const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8').replace(/\r\n/g, '\n');

const old = "const thumb = isVideo\n                ? '<video src=\"' + firstUrl + '\" style=\"width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;\" muted></video>'\n                : '<img src=\"' + firstUrl + '\" style=\"width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;\">';";

if (!c.includes(old)) { console.log('NOT FOUND'); process.exit(1); }

const newCode = "var vThumb = isVideo ? firstUrl.replace('/video/upload/', '/video/upload/so_0,w_400,h_400,c_fill/').replace(/\\.(mp4|mov|webm)$/i, '.jpg') : firstUrl;\n            const thumb = '<img src=\"' + vThumb + '\" style=\"width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;\">';";

c = c.replace(old, newCode);
fs.writeFileSync('script.js', c);
console.log('OK');
