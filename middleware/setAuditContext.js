const AuditLog = require('../models/AuditLog');


const auditMiddleware = (entityType) => {
  return (req, res, next) => {
    res.on('finish', async () => {
      try {
        const status = res.statusCode;
        // Solo auditar si la respuesta fue exitosa y hay un usuario logueado
        if (![200, 201, 204].includes(status) || !req.user) return;

        const method = req.method;
  const action = req.method === 'DELETE' ? 'DELETED' : null;


        const copiaEliminada = res.locals.deletedEntity;
        const negocioId = req.user.negocio?.[0]?.toString();

        if (!negocioId) return;
console.log(`[AUDIT] Acción: ${copiaEliminada}, Entidad: ${entityType}, Negocio: ${negocioId}, Usuario: ${req.user._id}`);
        
        // 1. Guardar en MongoDB
        const nuevoLog = await AuditLog.create({
          action,
          entityType,
          entityId: req.params.id || req.body._id,
          userId: req.user._id,
          UserAction: {
            Name: req.user.name,
            Correo: req.user.email
          },
          negocio: negocioId,
          details: {
            url: req.originalUrl,
            data: action === 'DELETED' ? copiaEliminada : req.body,
            params: req.params,
            query: req.query
          }
        });
        

        // 2. ENVIAR AL FRONTEND (Usando tu estructura de estadísticas)
 // server.js


// Dentro de tu middleware de auditoría

        if (action === 'DELETED') {
          console.log(`\x1b[41m[AUDIT]\x1b[0m Registro enviado al frontend para el negocio: ${negocioId}`);
        }

      } catch (error) {
        console.error('[AUDIT ERROR]', error.message);
      }
    });
    next();
  };
};



module.exports = { auditMiddleware };