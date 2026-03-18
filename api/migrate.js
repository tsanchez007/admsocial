import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    try {
        await db.query("ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS page_id VARCHAR(100) DEFAULT NULL");
        await db.query("ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS ig_account_id VARCHAR(100) DEFAULT NULL");
        await db.query("ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS nombre VARCHAR(200) DEFAULT NULL");
        await db.query("ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS tipo_publicacion VARCHAR(50) DEFAULT NULL");
        await db.query("ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS creado_por VARCHAR(100) DEFAULT NULL");
        await db.query("CREATE TABLE IF NOT EXISTS usuarios (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, rol ENUM('ceo','admin','asistente') DEFAULT 'asistente', nombre VARCHAR(200), email VARCHAR(200), permisos TEXT, activo TINYINT DEFAULT 1, fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        await db.query("CREATE TABLE IF NOT EXISTS usuario_cuentas (id INT AUTO_INCREMENT PRIMARY KEY, usuario_id INT, page_id VARCHAR(100)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        try { await db.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(200) DEFAULT NULL"); } catch(e) {}
        try { await db.query("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('ceo','admin','asistente') DEFAULT 'asistente'"); } catch(e) {}
        try { await db.query("UPDATE usuarios SET rol='ceo' WHERE username='tsanchez'"); } catch(e) {}
        try { await db.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos TEXT DEFAULT NULL"); } catch(e) {}
        await db.end();
        return res.json({ success: true, message: "Migracion completada" });
    } catch (err) {
        await db.end();
        return res.status(500).json({ success: false, error: err.message });
    }
}
