const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8').replace(/\r\n/g, '\n');
const si = c.indexOf('const mediaUrls = [];');
const ei = c.indexOf("Sin imagen</div>';") + "Sin imagen</div>';".length;
console.log('si:', si, 'ei:', ei);
if (si === -1 || ei === -1) { process.exit(1); }
const n = '    const rows = posts.map(post => {\n        const fecha = new Date(post.fecha_programada).toLocaleString("es-DO",{dateStyle:"full",timeStyle:"short"});\n        var publicUrls=[];\n        try{var p=JSON.parse(post.imagen_url||"[]");publicUrls=Array.isArray(p)?p.filter(function(u){return u&&u.startsWith("http")}):(post.imagen_url&&post.imagen_url.startsWith("http")?[post.imagen_url]:[]);}catch(e){if(post.imagen_url&&post.imagen_url.startsWith("http"))publicUrls=[post.imagen_url];}\n        var firstUrl=publicUrls[0]||null;\n        var isVideo=firstUrl&&(firstUrl.includes("/video/")||/\.(mp4|mov|webm)/i.test(firstUrl));\n        var thumbSrc=firstUrl?(isVideo?firstUrl.replace("/video/upload/","/video/upload/so_0,w_400,h_400,c_fill/").replace(/\.(mp4|mov|webm)$/i,".jpg"):firstUrl):null;\n        var mediaHtml=thumbSrc\n            ?"<a href=\'"+firstUrl+"\' target=\'_blank\' style=\'display:block;\'><img src=\'"+thumbSrc+"\' style=\'width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;\'></a>"\n            :"<div style=\'width:100%;height:80px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999;\'>Sin imagen</div>";\n';
c = c.slice(0, si) + n + c.slice(ei);
fs.writeFileSync('script.js', c);
console.log('OK');
