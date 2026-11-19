const jwt = require('jsonwebtoken');
const Master = require('../models/superUsuario'); 

module.exports = async (req, res, next) => {
    try {
        // 1. Validamos que las cookies existan para evitar el error de "undefined"
        if (!req.cookies) {
            console.error("Error: cookie-parser no está configurado en el servidor principal.");
            return res.status(500).send("Error interno de configuración.");
        }

        // 2. Buscamos la cookie con el nombre EXACTO que aparece en tu navegador
        const token = req.cookies.AdminSuper; 

        if (!token) {
            console.log('Intento de acceso al panel maestro sin cookie AdminSuper');
            return res.status(401).send("Debes iniciar sesión como administrador.");
        }

        // 3. Verificamos el Token JWT
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 4. Verificación en Base de Datos
        const jefe = await Master.findById(decoded.id);

        if (jefe && decoded.rol === 'admin_supremo') {
            req.master = jefe; 
            return next(); 
        } else {
            console.warn(`Intento de acceso no autorizado de un usuario sin rango supremo.`);
            return res.status(403).send("<h1>403 Prohibido</h1><p>Esta zona está reservada para el dueño del sistema.</p>");
        }
        
    } catch (error) {
        console.error("Error en el middleware maestro:", error.message);
        // Borramos la cookie correcta si falla
        res.clearCookie('AdminSuper');
        return res.status(401).send("Tu sesión ha expirado o es inválida.");
    }
};