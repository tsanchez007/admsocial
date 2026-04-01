const fs = require('fs');
let c = fs.readFileSync('api/migrate.js', 'utf8').replace(/\r\n/g, '\n');
const old = '        await db.end();';
const nw = '        await db.query("CREATE TABLE IF NOT EXISTS notificaciones (id INT AUTO_INCREMENT PRIMARY KEY, tipo VARCHAR(100), mensaje TEXT, leido TINYINT DEFAULT 0, fecha DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");\n        await db.end();';
if (c.includes(old)) { c = c.replace(old, nw); fs.writeFileSync('api/migrate.js', c); console.log('OK'); }
else { console.log('NOT FOUND'); }
