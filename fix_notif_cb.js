const fs = require('fs');
let c = fs.readFileSync('api/auth/callback.js', 'utf8').replace(/\r\n/g, '\n');
const old = '        await db.end();\n        const state = req.query.state';
const nw = '        try { await db.query("INSERT INTO notificaciones (tipo, mensaje) VALUES (?,?)", ["nueva_cuenta", "Nueva cuenta conectada: " + (userData.name || "Usuario")]); } catch(e) {}\n        await db.end();\n        const state = req.query.state';
if (c.includes(old)) { c = c.replace(old, nw); fs.writeFileSync('api/auth/callback.js', c); console.log('OK'); }
else { console.log('NOT FOUND'); }
