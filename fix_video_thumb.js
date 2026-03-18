const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8').replace(/\r\n/g, '\n');

const old = "const thumb = isVideo\n                ? '<video src=\"' + firstUrl + '\" style=\"width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;\" muted></video>'\n                : '<img src=\"' + firstUrl + '\" style=\"width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;\">';";

const newCode = "const videoThumb = firstUrl.replace('/video/upload/', '/video/upload/so_0,w_400,h_400,c_fill/').replace(/\\.(mp4|mov|webm)$/i, '.jpg'); const thumb = isVideo\n                ? '<img src=\"' + videoThumb + '\" style=\"width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;\" onerror=\"this.src=\\'data:image/svg+xml,<svg xmlns=\\\\'http://www.w3.org/2000/svg\\\\'><rect width=\\\\'100%\\\\'height=\\\\'100%\\\\'fill=\\\\'\\'%23111\\\\'\\'/><text x=\\\\'50%\\\\'y=\\\\'50%\\\\'fill=\\\\'white\\\\'text-anchor=\\\\'middle\\\\'>Video</text></svg>\\''>\n                : '<img src=\"' + firstUrl + '\" style=\"width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;\">';";

if (c.includes(old)) {
    c = c.replace(old, newCode);
    fs.writeFileSync('script.js', c);
    console.log('OK');
} else {
    console.log('NOT FOUND');
}
