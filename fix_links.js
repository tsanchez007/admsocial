const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8').replace(/\r\n/g, '\n');

const old = "return '<a href=\"' + u + '\" target=\"_blank\" style=\"display:inline-block;margin-top:6px;margin-right:6px;font-size:0.75rem;color:#6c63ff;text-decoration:none;border:1px solid #6c63ff;padding:3px 10px;border-radius:4px;font-weight:600;\">' + lbl + '</a>';";

const newCode = "const encoded = btoa(unescape(encodeURIComponent(u))); const html = 'data:text/html;charset=utf-8,' + encodeURIComponent('<html><head><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;}img,video{max-width:100%;max-height:100vh;object-fit:contain;}</style></head><body>' + (u.includes('/video/')||/\\.(mp4|mov|webm)/i.test(u) ? '<video src=\"'+u+'\" controls autoplay style=\"max-width:100%;max-height:100vh;\"></video>' : '<img src=\"'+u+'\">') + '</body></html>'); return '<a href=\"' + html + '\" target=\"_blank\" style=\"display:inline-block;margin-top:6px;margin-right:6px;font-size:0.75rem;color:#6c63ff;text-decoration:none;border:1px solid #6c63ff;padding:3px 10px;border-radius:4px;font-weight:600;\">' + lbl + '</a>';";

if (c.includes(old)) {
    c = c.replace(old, newCode);
    fs.writeFileSync('script.js', c);
    console.log('OK');
} else {
    console.log('NOT FOUND');
}
