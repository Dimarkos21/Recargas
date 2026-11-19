const Negocio = require('../models/negocio');
const User =  require("../models/user");
/**
 * Middleware para verificar si el usuario tiene un rol específico en el negocio.
 * @param {Array<string>} requiredRoles - Roles requeridos para acceder a la ruta (ej: ['Administrador', 'Propietario']).
 */
const roleChecker = (requiredRoles) => {
  return async (request, response, next) => {
    try {

  const user = request.user;     
  
      // LOG 1: Datos iniciales de verificación
      console.log('--- DIAGNÓSTICO roleChecker ---');
      console.log(`[LOG 1] User ID (Autenticado): ${user?._id}`);
      console.log(`[LOG 1] Roles Requeridos: ${requiredRoles.join(', ')}`);
      console.log('-------------------------------');


      if (!user || !user._id) {
        console.warn('[roleChecker] Usuario no autenticado o sin ID.');
        return response.status(401).json({ error: 'No autenticado.' });
      }


      // Validación defensiva del array de negocios
      const negocios = Array.isArray(user.negocio) ? user.negocio : [];
      if (negocios.length === 0) {
        console.warn(`[roleChecker] Usuario ${user._id} no tiene negocios asociados.`);
        return response.status(403).json({ error: 'Acceso denegado. No está asociado a ningún negocio.' });
      }

      const negocioId = negocios[0]?.toString(); // Selecciona el primero por defecto
      
      // LOG 2: ID de Negocio Seleccionado
      console.log(`[LOG 2] ID de Negocio Seleccionado: ${negocioId}`);

      if (!negocioId) {
        console.warn(`[roleChecker] negocioId inválido para usuario ${user._id}.`);
        return response.status(403).json({ error: 'Negocio ID inválido.' });
      }

      // Buscar el negocio y validar que el usuario esté registrado como empleado
      const negocio = await Negocio.findById(negocioId);
      const Empleado = await  User.findById(user._id);
   
           
        if (!Empleado) {
        console.warn(`[roleChecker] Negocio ${Empleado} no encontrado.`);
        return response.status(404).json({ error: 'Negocio no encontrado.' });
      }
      if (!negocio) {
        console.warn(`[roleChecker] Negocio ${negocioId} no encontrado.`);
        return response.status(404).json({ error: 'Negocio no encontrado.' });
      }
      
      // LOG 3: Empleados cargados y tu ID de Usuario
      console.log(`[LOG 3] Total Empleados en DB: ${user}`);
      console.log(`[LOG 3] ID de Usuario a buscar: ${user._id.toString()}`);
      
  

      if (Empleado.negocio[0]?.toString() !== negocio._id.toString()) {
        console.warn(`[roleChecker] Usuario ${user._id} no es empleado del negocio ${negocioId}.`);
        // LOG 4: FALLO: No se encontró al usuario
        console.log('[LOG 4] FALLO: Usuario no encontrado en la lista de empleados. (ERROR 403)');
        return response.status(401).json({ error: 'Acceso denegado. No es un empleado registrado.' });
      }

      const userRole =  Empleado.rol;
      
      // LOG 5: Rol encontrado vs. Rol requerido
      console.log(`[LOG 5] Rol del Usuario ENCONTRADO: ${userRole}`);
      console.log(`[LOG 5] Roles REQUERIDOS: ${requiredRoles.join(', ')}`);

      if (!requiredRoles.includes(userRole)) {
        console.warn(`[roleChecker] Rol ${userRole} no autorizado. Requiere: ${requiredRoles.join(', ')}.`);
        // LOG 6: FALLO: Rol no autorizado
        console.log('[LOG 6] FALLO: El rol no coincide con los requeridos. (ERROR 403)');
        return response.status(403).json({
          error: `Acceso prohibido. Rol actual: ${userRole}. Roles requeridos: ${requiredRoles.join(', ')}.`
        });
      }

      // ✅ Rol válido, adjuntamos el negocioId para uso posterior
      request.negocioId = negocioId;
      console.log('[LOG 7] ÉXITO: Rol verificado. Acceso concedido.');
      next();

    } catch (error) {
        
      console.error('[roleChecker] Error interno:', error);
      return response.status(500).json({ error: 'Error interno del servidor al verificar permisos.' });
    }
  };
};

module.exports = roleChecker;