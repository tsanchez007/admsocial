const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8').replace(/\r\n/g, '\n');

const START = 'mediaUrls = [];\n    const rows = posts.map(post => {';
const END = ": '<div style=\"width:100%;height:80px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999;\">Sin imagen</div>';";

const si = c.indexOf(START);
const ei = c.indexOf(END) + END.length;

if (si === -1 || ei === -1) { console.log('NOT FOUND', si, ei); process.exit(1); }

const newBlock = `rows = posts.map(post => {
        const fecha = new Date(post.fecha_programada).toLocaleString('es-DO',{dateStyle:'full',timeStyle:'short'});
        var publicUrls = [];
        try {
            var parsed = JSON.parse(post.imagen_url || '[]');
            if (Array.isArray(parsed)) publicUrls = parsed.filter(function(u){ return u && u.startsWith('http'); });
            else if (post.imagen_url && post.imagen_url.startsWith('http')) publicUrls = [post.imagen_url];
        } catch(e) { if (post.imagen_url && post.imagen_url.startsWith('http')) publicUrls = [post.imagen_url]; }
        var firstUrl = publicUrls[0] || null;
        var isCarousel = publicUrls.length > 1;
        var isVideo = firstUrl && (firstUrl.includes('/video/') || /\.(mp4|mov|webm)/i.test(firstUrl));
        var mediaHtml = '<div style="width:100%;height:80px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#999;">Sin imagen</div>';
        if (firstUrl) {
            var badge = isCarousel ? '<span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.65);color:white;font-size:10px;padding:2px 8px;border-radius:4px;">Carrusel (' + publicUrls.length + ')</span>' : '';
            var vbadge = (!isCarousel && isVideo) ? '<span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.65);color:white;font-size:10px;padding:2px 8px;border-radius:4px;">Video</span>' : '';
            var thumbSrc = isVideo ? firstUrl.replace('/video/upload/', '/video/upload/so_0,w_400,h_400,c_fill/').replace(/\.(mp4|mov|webm)$/i, '.jpg') : firstUrl;
            var thumbImg = '<img src="' + thumbSrc + '" style="width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid #ddd;display:block;">';
            var links = publicUrls.map(function(u, i) {
                var lbl = isCarousel ? ('Ver ' + (isVideo ? 'video' : 'foto') + ' ' + (i+1)) : (isVideo ? 'Ver video' : 'Ver imagen');
                var html = 'data:text/html;charset=utf-8,' + encodeURIComponent('<html><head><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;}img,video{max-width:100%;max-height:100vh;object-fit:contain;}</style></head><body>' + (isVideo ? '<video src="'+u+'" controls autoplay style="max-width:100%;"></video>' : '<img src="'+u+'">') + '</body></html>');
                return '<a href="' + html + '" target="_blank" style="display:inline-block;margin-top:6px;margin-right:6px;font-size:0.75rem;color:#6c63ff;text-decoration:none;border:1px solid #6c63ff;padding:3px 10px;border-radius:4px;font-weight:600;">' + lbl + '</a>';
            }).join('');
            mediaHtml = '<div style="position:relative;">' + badge + vbadge + '<a href="' + (isVideo ? 'data:text/html;charset=utf-8,' + encodeURIComponent('<html><body style="margin:0;background:#000;"><video src="'+firstUrl+'" controls autoplay style="max-width:100%;max-height:100vh;"></video></body></html>') : 'data:text/html;charset=utf-8,' + encodeURIComponent('<html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="'+firstUrl+'" style="max-width:100%;max-height:100vh;object-fit:contain;"></body></html>')) + '" target="_blank" style="display:block;">' + thumbImg + '</a><div>' + links + '</div></div>';
        }`;

c = c.slice(0, si) + newBlock + c.slice(ei);
fs.writeFileSync('script.js', c);
console.log('OK');
