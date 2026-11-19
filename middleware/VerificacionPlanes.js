const { findOne } = require('../models/Billetera');
const Negocio22 = require('../models/negocio');
const User =  require("../models/user");




// config/plans.js
const PLAN_FEATURES = {
  Historial_Clinico: {
    features: ['Formulas' ],
        productos: 0,
    empleados: 1,

    precio:  30    ,
  },
  basico :  {
    features: ['Clientes', 'Productos', 'historial_clinico' , "Gastos",'Estadisticas',"Presupuestos",'Formulas', "Facturacion"],
    productos:  950,
    empleados: 2,
    precio: 65  ,
  },
  profesional: {
    features: ['Clientes', 'Productos', 'historial_clinico' , "Gastos",'Estadisticas',"Presupuestos",'Formulas', "Facturacion"],
    productos: 3000,
    empleados: 3,
    precio : 85,
  },
  empresa: {
    features: ['Clientes', 'inventario_basico', 'historial_clinico', 'reportes' , "Gastos",'Estadisticas'],
    productos: 350,
    empleados: 5,
    precio: 95,

  }
};




// middlewares/checkPlan.js


const checkPlan = (requiredFeature) => {
  return async (req, res, next) => {
    try {

          const user = req.user;  

              if (!user || !user._id) {
        console.warn('[roleChecker] Usuario no autenticado o sin ID.');
        return response.status(401).json({ error: 'No autenticado.' });
      }

            // Validación defensiva del array de negocios
      const negocios = Array.isArray(user.negocio) ? user.negocio : [];
      if (negocios.length === 0) {
        console.warn(`[roleChecker] Usuario ${user._id} no tiene negocios asociados.`);
        return res.status(403).json({ error: 'Acceso denegado. No está asociado a ningún negocio.' });
      }

      const negocioId = negocios[0]?.toString(); // Selecciona el primero por defecto
          if (!negocioId) {
        console.warn(`[roleChecker] negocioId inválido para usuario ${user._id}.`);
        return res.status(403).json({ error: 'Negocio ID inválido.' });
      }
      const response = await Negocio22.findOne({
      _id:  negocioId
      }).lean();
      // Asumimos que tu middleware de autenticación previo adjunta el usuario (con su plan) a req.user
      // Ejemplo: req.user = { id: '...', plan: 'basico' }
      const userPlan = response?.plan || 'Historial_Clinico';
      const planConfig = PLAN_FEATURES[userPlan];
    
    
      // Validar si el plan existe y si incluye la característica solicitada
      if (!planConfig || !planConfig.features.includes(requiredFeature) || !userPlan) {
        return res.status(402).json({
          error: 'Acceso restringido por plan',
          message: `Tu plan actual (${userPlan}) no incluye esta funcionalidad. Por favor, actualiza tu suscripción.`
        });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno al validar el plan de suscripción.' });
    }
  };
};

module.exports = checkPlan;