const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Master = require('../models/superUsuario'); // Asegúrate de importar el modelo Master

const userExtractor = async (request, response, next) => {
    try {
        // 1. Extraemos AdminSuper (prioridad) o accessToken de forma segura
        const token = request.cookies.AdminSuper || request.cookies.accessToken;

        // VALIDACIÓN PREVIA: Si no hay token de ningún tipo
        if (!token) {
            // EXCEPCIÓN: Si es la ruta de sesión activa, dejamos pasar con request.user = null
            if (request.path === '/SesionACTIVA') {
                request.user = null;
                return next();
            }
            
            console.log('⚠️ Acceso denegado: No se proporcionó ningún token (AdminSuper o accessToken)');
            return response.sendStatus(401);
        }

        // 2. Verificamos el token con tu secreto
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // 3. Lógica de búsqueda según el Rol contenido en el token
        let user;
        if (decoded.rol === 'admin_supremo') {
            // Buscamos en la tabla de jefes
            user = await Master.findById(decoded.id);
            console.log('👑 Admin Supremo autenticado correctamente');
        } else {
            // Buscamos en la tabla de usuarios normales
            user = await User.findById(decoded.id);
            console.log('👤 Usuario normal autenticado');
        }

        if (!user) {
            console.log('⚠️ Acceso denegado: El usuario ya no existe en la base de datos');
            return response.sendStatus(401);
        }

        // 4. Inyectamos los datos en el request
        request.user = user;
        request.rol = decoded.rol; // Añadimos el rol por si lo necesitas en la ruta
        next();

    } catch (error) {
        // Si el token expiró o es inválido, caerá aquí
        console.error('❌ Error de Autenticación:', error.message);
        
        // Opcional: Si el error es por token expirado, podrías limpiar la cookie
        // response.clearCookie('AdminSuper');
        
        return response.status(401).send("Tu sesión ha expirado o es inválida.");
    }
};

module.exports = { userExtractor };