const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Middleware que AUTENTICA (verifica token) y AUTORIZA (verifica rol).
 * * @param {string[]} allowedRoles - Array de strings con los roles permitidos (ej. ['admin', 'manager']).
 */
const authorizeRole = (allowedRoles) => async (request, response, next) => {
    try {
        // ===================================================================
        // PASO 1: AUTENTICACIÓN (Verifica Token y Usuario)
        // ===================================================================
        const token = request.cookies?.accessToken;
        
    

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Buscamos el usuario en la DB (Asegúrate que el modelo User tiene el campo 'role')
        const user = await User.findById(decoded.id); 
        
        if (!user || !token) {
            // Usuario no existe
            return response.status(401).json({ message: 'Acceso denegado: Usuario no encontrado.' });
        }

        // ===================================================================
        // PASO 2: AUTORIZACIÓN (Verifica Rol)
        // ===================================================================
        const userRole = user.role;
        
        if (allowedRoles.includes(userRole)) {
            // El rol del usuario SÍ está en la lista de roles permitidos
            request.user = user; // Adjuntamos el objeto 'user' a la solicitud
            console.log(`✅ Acceso concedido. Rol: ${userRole}`);
            next(); // Continuar a la función controladora de la ruta
        } else {
            // El rol del usuario NO está permitido
            console.log(`❌ Acceso prohibido para el rol: ${userRole}`);
            return response.status(403).json({ 
                message: `Acceso prohibido. No tienes los permisos necesarios (${allowedRoles.join(', ')}).` 
            });
        }
        
    } catch (error) {
        // Manejo de errores de JWT (token inválido o expirado)
        
        console.error('❌ Error de Autenticación/Token:', error.message);
        return response.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

module.exports = { authorizeRole };