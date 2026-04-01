const fs = require('fs');
let c = fs.readFileSync('api/auth/callback.js', 'utf8').replace(/\r\n/g, '\n');
const old = '        const state = req.query.state || "";';
const nw = '        const state = req.query.state || "";\n        // Crear notificacion\n        try {\n            const cuentasNombres = savedAccounts.map(a => a.usuario || a.nombre).join(", ");\n            await db.query("INSERT INTO notificaciones (tipo, mensaje) VALUES (?,?)", ["nueva_cuenta", "Nueva cuenta conectada: " + cuentasNombres]);\n        } catch(e) {}\n';
if (c.includes(old)) { c = c.replace(old, nw); fs.writeFileSync('api/auth/callback.js', c); console.log('OK'); }
else { console.log('NOT FOUND'); }
