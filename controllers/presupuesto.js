const PresupuestoRouter = require('express').Router(); // Router sigue siendo adecuado
const user = require('../models/user'); // Cambié "user" a "User" para que represente mejor el modelo
const PresupuestoModel= require('../models/presupuesto'); // Cambié "Producto" a "ProductosModel" para reflejar que es un modelo
const mongoose = require('mongoose');
const multer = require("multer");
const path = require("path");
const roleChecker = require('../middleware/roleChecker'); 
const checkPlan = require('../middleware/VerificacionPlanes'); 




// Configuración de Multer
const storage = multer.memoryStorage(); // Si quieres guardar la imagen en MongoDB como Buffer
const upload = multer({ storage }); // Crea una instancia de Multer


// Usamos PATCH y el ID del documento para actualizar la tabla completa
PresupuestoRouter.get("/", roleChecker(['Propietario', 'Administrador',checkPlan("Presupuestos"),
    'Vendedor'
]), async (req, res) => {
    try {
        const user = req.user;

        if (!user || !user.negocio) {
            return res.status(401).json({ 
                error: 'No autorizado: El usuario no tiene un negocio vinculado.' 
            });
        }
        const negocioId = req.user.negocio[0];
               if (!negocioId ) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }

        // 1. Extraer datos
       
  

       const respuesta = await PresupuestoModel.find({ negocio: negocioId })
       .sort({ 
ultimaActualizacion: -1 }) // -1 ordena de más nuevo a más viejo (los más viejos abajo)
        .lean();
    console.log(respuesta)

        // Importante: El return evita que se intente enviar otra respuesta después
        return res.status(200).json({
            mensaje: "tabla consultada",
            data: respuesta
        });

    } catch (error) {
        console.error("Error al sincronizar tabla única:", error);
    return res.status(500).json({ 
        error: 'Error al actualizar los precios',
        detalle: error.message // Solo enviamos el texto del error
    });
    }
});

// Asegúrate de importar el modelo correctamente
const Presupuesto = require('../models/presupuesto'); // Ajusta la ruta según tu carpetas

PresupuestoRouter.post("/", roleChecker(['Propietario', 'Administrador', "Vendedor"]), checkPlan("Presupuestos"),async (req, res) => {
    try {
        const user = req.user;

        // 1. Validar existencia de usuario y negocio
        if (!user || !user.negocio || user.negocio.length === 0) {
            return res.status(401).json({ 
                error: 'No autorizado: El usuario no tiene un negocio vinculado.' 
            });
        }

        const negocioId = user.negocio[0];

        // 2. Extraer datos del body
        const {
            cliente,
            edad,
            telefono,
            cedula,
            direccion,
            evaluacion,
            montura,
            cristales,
            precio,
            tasaBCV // Asumiendo que lo envías desde el front
        } = req.body;
const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };

if ( !cedula || !telefono || !edad || !cliente || !direccion || !evaluacion || !montura || !cristales || !precio ) {
        return res.status(400).json({ 
            error: 'Tienes un dato vacio verifica el presupuesto',
       
        });
}
const Validacion = /^0(412|414|416|424|426|212)\d{7}$/;
if (!Validacion.test(telefono)){ 
        return res.status(400).json({ 
            error: 'Tienes un dato vacio verifica el presupuesto',
       
        });
        // 3. Mapear los datos a la estructura del PresupuestoSchema
    }
        const datosParaGuardar = {
    fecha: new Date().toLocaleDateString('es-ES', opciones),
            beneficiario: {
                nombre: cliente,
                edad: edad,
                cedula: cedula,
                telefono: telefono,
                direccion: direccion
            },
            evaluacion: evaluacion,
            especificaciones: {
                montura: montura,
                cristales: cristales
            },
            cotizacion: {
                precioBase: precio,
                tasaBCV: tasaBCV || 0,
                totalBs: precio * (tasaBCV || 1)
            },
            asesor: user.nombre || "Vendedor", // Opcional: registrar quién lo hizo
            estatus: "Pendiente",
            negocio: negocioId
        };

        // 4. Crear y Guardar en la base de datos
        const nuevoPresupuesto = new Presupuesto(datosParaGuardar);
        const presupuestoGuardado = await nuevoPresupuesto.save();

        // 5. Respuesta exitosa
        return res.status(201).json({
            mensaje: "Presupuesto creado con éxito",
            data: presupuestoGuardado
        });

    } catch (error) {
        console.error("Error al crear presupuesto:", error);
        return res.status(500).json({ 
            error: 'Error al procesar el presupuesto',
            detalle: error.message 
        });
    }
});













PresupuestoRouter.patch("/", roleChecker(['Propietario', 'Administrador']),checkPlan("Presupuestos"), async (request, response) => {
    try {
        console.log("--- INICIO DE ACTUALIZACIÓN ---");
        const user = request.user;
        const negocioId = Array.isArray(user.negocio) ? user.negocio[0] : user.negocio;

        console.log("1. Negocio ID detectado:", negocioId);

        if (!negocioId) {
            console.error("ERROR: No se encontró negocioId en el usuario.");
            return response.status(401).json({ error: 'No autorizado: Usuario sin negocio.' });
        }

        // 1. Extraemos los datos del body
        const { _id, __v, negocio, ...fields } = request.body;
        console.log("2. Datos recibidos del Frontend (fields):", JSON.stringify(fields, null, 2));

        // 2. Lista maestra
        const numericFields = [
            'Vision_sencilla', 'Vision_sencilla_Tratamiento', 'Vision_sencilla_Tratamiento_Foto', 'Vision_sencilla_Poli',
            'Vision_Tallado', 'Vision_Tallado_Tratamiento', 'Vision_Tallado_Tratamiento_Foto', 'Vision_Tallado_Poli',
            'Vision_Formula_Alta', 'Vision_Formula_Alta_AR', 'Vision_Formula_Alta_Foto', 'Vision_Formula_Alta_Poli', 'Vision_Alta_Tratamiento_Foto',
            'Bifocales', 'Bifocales_Tratamiento', 'Bifocales_Tratamiento_Foto', 'Bifocales_Poli',
            'Bifocales_Tallados', 'Bifocales_Tallados_Tratamiento', 'Bifocales_Tallados_Tratamiento_Foto', 'Bifocales_Tallados_Poli',
            'Bifocales_Alta', 'Bifocales_Alta_AR', 'Bifocales_Alta_Foto', 'Bifocales_Alta_Poli',
            'Multifocales', 'Multifocales_Tratamiento', 'Multifocales_Tratamiento_Foto', 'Multifocales_Poli',
            'Multifocales_Tallados', 'Multifocales_Tallados_Tratamiento', 'Multifocales_Tallados_Tratamiento_Foto', 'Multifocales_Tallados_Poli',
            'Multifocales_Alta', 'Multifocales_Alta_AR', 'Multifocales_Alta_Foto', 'Multifocales_Alta_Poli'
        ];

        // 3. Procesamiento y Limpieza
        const updateData = {};
        
        console.log("3. Iniciando bucle de campos...");
        numericFields.forEach(field => {
            const value = fields[field];
            // Log para detectar si un campo llega como 'undefined' (posible error de nombre)
            if (value === undefined) {
                console.warn(`AVISO: El campo [${field}] no viene en el request (será 0).`);
            }

            const numericValue = (value !== undefined && value !== null && value !== "") ? Number(value) : 0;
            updateData[field] = numericValue;
        });

        updateData.checked = fields.checked !== undefined ? fields.checked : true;
        updateData.ultimaActualizacion = new Date();
        updateData.negocio = negocioId;

        console.log("4. Objeto FINAL que se enviará a MongoDB:", JSON.stringify(updateData, null, 2));

        // 4. Actualización en Base de Datos
        const resultado = await PresupuestoModel.findOneAndUpdate(
            { negocio: negocioId },
            { $set: updateData },
            { 
                new: true,
                upsert: true, 
                runValidators: true 
            }
        );

        console.log("5. Resultado de MongoDB (Actualizado):", resultado ? "ÉXITO" : "FALLO - No se encontró/creó");
        console.log("--- FIN DE ACTUALIZACIÓN ---");

        return response.status(200).json({
            mensaje: "Tarifas actualizadas",
            data: resultado
        });

    } catch (error) {
        console.error("!!! ERROR CRÍTICO EN PATCH !!!");
        console.error("Mensaje:", error.message);
        console.error("Stack:", error.stack);
        return response.status(500).json({ 
            error: 'Error al procesar la actualización.',
            detalles: error.message 
        });
    }
});

// get agusto uno solo 
PresupuestoRouter.get("/:id", roleChecker(['Propietario', 'Administrador',checkPlan("Presupuestos"),
    'Vendedor'
]), async (req, res) => {
    try {
          const  IDNEGOCIO  = req.params.id;

        const user = req.user;

        if (!user || !user.negocio) {
            return res.status(401).json({ 
                error: 'No autorizado: El usuario no tiene un negocio vinculado.' 
            });
        }
        const negocioId = req.user.negocio[0];
               if (!negocioId ) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }



            

        // 1. Extraer datos
       
       const respuesta = await PresupuestoModel.findOne({ negocio: negocioId , _id : IDNEGOCIO })
    
    console.log(respuesta);
        // Importante: El return evita que se intente enviar otra respuesta después
        return res.status(200).json({
            mensaje: "tabla consultada",
            data: respuesta
        });

    } catch (error) {
        console.error("Error al sincronizar tabla única:", error);
    return res.status(500).json({ 
        error: 'Error al actualizar los precios',
        detalle: error.message // Solo enviamos el texto del error
    });
    }
});
module.exports = PresupuestoRouter;
