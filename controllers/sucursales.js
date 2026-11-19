const SucusalesRouter = require('express').Router();
const user = require('../models/user');
const Negocio = require('../models/negocio');
const roleChecker = require('../middleware/roleChecker'); 
const OpticasEstadisticas = require('../models/EstadisticasSucursales'); 
const mongoose = require('mongoose');
// modelo de pedidos
const  Opticas = require('../models/opticas'); // Modelo de sucursales
//escuchador 



// Ruta para manejar las solicitudes POST a /api/todos
SucusalesRouter.post("/", roleChecker(['Propietario']), async (request, response) => {
    try {
        const user = request.user;
        if (!user) {
            return response.status(401).json({ error: 'Usuario no autenticado' });
        }
 const negocio = request.user.negocio[0];
            if (!negocio) {
            return response.status(401).json({ error: 'Usuario no autenticado' });
        }
        
    const NumbSucursales = await Opticas.countDocuments({ negocio: negocio });
      const SucursalesPermitidas = await Negocio.findOne({ _id: negocio });
      console.log(NumbSucursales,SucursalesPermitidas)
    if (NumbSucursales >= SucursalesPermitidas.Opticas) {
        return response.status(400).json({ error: 'Se ha alcanzado el límite de sucursales permitidas (5).' });
    }
     if (!SucursalesPermitidas.Opticas) {
        return response.status(400).json({ error: 'Se ha alcanzado el límite de sucursales permitidas (5).' });
    }
        
        // 1. Extraemos los datos del body (vienen planos desde el front)
const { 
         nombre,
           calle, 
           estado,
           ciudad,
           
            numero

} = request.body;
if (!nombre || !calle || !estado || !ciudad || !numero) {
    return response.status(400).json({ error: 'Todos los campos son obligatorios.' });
};
const newTodo = new Opticas({
  
nombre: nombre, 
 numero: numero,
   ciudad: ciudad, 
   estado: estado, 
direccion: calle,
 
  
 
    fecha:   new Date(),
    checked: true,

    negocio: user.negocio
});

        // 3. Guardar en MongoDB
        const historiaGuardada = await newTodo.save();
        
        console.log('✅ Registro guardado siguiendo el esquema:', historiaGuardada._id);

        // 2. Crear pedido EN SEGUNDO PLANO (Sin await)
// No usamos await para que no detenga la respuesta al usuario


        // 4. Respondemos (el transform toJSON del modelo se encargará del id)
        return response.status(200).json(historiaGuardada);

    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        return response.status(500).json({ 
            error: 'No se pudo guardar la historia médica',
            detalle: error.message 
        });
    }
});
// Ruta para manejar las solicitudes GET a /api/todos
SucusalesRouter.get("/", async (request, response) => {
    try {
    const negocioId = request.user.negocio[0];
    console.log(negocioId)
                const user = request.user;
                if (!user) {
                    return response.status(401).json({ error: "Usuario no autenticado" });
                }
                     if (!negocioId) {
                    return response.status(401).json({ error: "Usuario sin negocio autenticado" });
                }
     const fechaHoy = new Date();
            const mes1 = parseInt(request.query.mes) || (fechaHoy.getMonth() + 1);
            const anio1 = parseInt(request.query.anio) || fechaHoy.getFullYear();

        const todos = await Opticas.find({negocio: negocioId}).sort({ _id: -1 })
                const EstadisticasMensualesSucursal = await OpticasEstadisticas.find({negocio: negocioId, mes: mes1   , 
anio: anio1  , 
 }).sort({ _id: -1 })
    return response.status(200).json({ data : todos,
        Estadisticas: EstadisticasMensualesSucursal,
    });
    } catch (error) {
        response.status(500).json({ error: error });
    }
});
SucusalesRouter.get("/Empleados", async (request, response) => {
    try {
    const negocioId = request.user.negocio[0];

                const user = request.user;
                if (!user) {
                    return response.status(401).json({ error: "Usuario no autenticado" });
                }
                     if (!negocioId) {
                    return response.status(401).json({ error: "Usuario sin negocio autenticado" });
                }
  
         
        const todos = await Opticas.find({negocio: negocioId}).sort({ _id: -1 })
             
    return response.status(200).json(  todos
       
    );
    } catch (error) {
        response.status(500).json({ error: error });
    }
});

// papelera restaurar 





// Ruta para manejar las solicitudes DELETE a /api/todos/:id


module.exports = SucusalesRouter;
