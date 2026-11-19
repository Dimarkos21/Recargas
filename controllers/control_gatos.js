// Importaciones
const express = require('express');
const mongoose = require('mongoose');
const ControlRouter = express.Router();
const roleChecker = require('../middleware/roleChecker'); 
const User = require('../models/user'); // Modelo de usuario
const FacturacionModel = require('../models/control_gatos'); // Modelo de facturación
const TasaModel = require('../models/tasaBcv'); // Modelo de  la tasa bcv
const Estadisticas = require('../models/estadisticas');  // Modelo de   estadisticas
const   checkPlan = require('../middleware/VerificacionPlanes'); 
   const obtenerTasa = async () => {
        try {
         const tasaDoc = await TasaModel.findOne({ nombre: "BCV" });
        
        if (tasaDoc) {
            return tasaDoc.valor;
        } else {
            return 0; // O un valor por defecto si la BD está vacía
        }

        } catch (error) { 
          console.error("Error al obtener tasa BCV:", error.message);
          return 0; 
        }
      };
// Endpoint POST /api/control_gatos
ControlRouter.post("/",  roleChecker(["Propietario", "Administrador","Gerente"]),  checkPlan("Gastos"), async (req, res) => {
  try {
    console.log("Solicitud recibida en /api/control_gatos");

    const {
      nombre,
      precio,
    categoria,
  
     
    } = req.body;
       

    // Validaci ones estrictas para campos obligatorios
    if (!nombre) {
      return res.status(404).json({ error: "El campo 'nombre' es obligatorio." });
    }

    if (!precio) {
      return res.status(404).json({ error: "El campo 'precio' es obligatorio." });
    }
    
      const negocioId = req.user.negocio[0];
     if (!negocioId ) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }

   const Promedio = await obtenerTasa();
      const TasaBCV= Math.ceil(precio * Promedio).toFixed(2);

    // Asegura que productos sea un array
const fechaActual = new Date();

const anio = parseInt(new Intl.DateTimeFormat('es-ES', { year: 'numeric', timeZone: 'America/Caracas' }).format(fechaActual));
const mes = parseInt(new Intl.DateTimeFormat('es-ES', { month: 'numeric', timeZone: 'America/Caracas' }).format(fechaActual));
const dia = parseInt(new Intl.DateTimeFormat('es-ES', { day: 'numeric', timeZone: 'America/Caracas' }).format(fechaActual));

const fechaFormateada = `${dia}/${mes}/${anio}`;
console.log(fechaFormateada); // Ejemplo: 9/1815

    // Crea el documento con los datos
    const nuevaFactura = new FacturacionModel({
      nombre : nombre,
  categoria:  categoria, 
      precio : precio,
      tasaCambio:  TasaBCV,
      tasaCambioDia: Promedio,
      mes:  mes,
      año:     anio, 
fecha: new Date(),
negocio :  negocioId,
      checked: false,

    });

    // Guarda en la base de datos
    const facturaGuardada = await nuevaFactura.save();
console.log(  "LOCURAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",anio , mes)
       await Estadisticas.findOneAndUpdate(
                { negocio: negocioId, anio: anio , mes: mes }, 
                { $inc: { "metricas.GastoBolivar": Number(TasaBCV) ,
                  "metricas.GastoDolar": Number(precio)
                } },
                
                { new: true, upsert: true }
              );
    return res.status(201).json(facturaGuardada); // Respuesta exitosa
  } catch (error) {
    console.error("Error al guardar la facturación:", error.message);
    return res.status(500).json({
      error: "Error al guardar la factura.",
      detalle: error.message
    });
  }
});

// Ruta para manejar las solicitudes GET a /api/productos
ControlRouter.get("/",checkPlan("Gastos"), async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "Usuario no autenticado." });
        }
      const negocioId = req.user.negocio[0];
               if (!negocioId ) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }
     

        const facturacion = await FacturacionModel.find({ negocio:  negocioId }).sort({ _id: -1 })

   

        return res.json(facturacion);
    } catch (error) {
        console.error("Error en GET /api/productos:", error.message);
        return res.status(500).json({ error: "Ocurrió un error al obtener las facturas." });
    }
});

ControlRouter.get("/Total", roleChecker(["Propietario", "Administrador","Gerente"]),checkPlan("Gastos"), async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "Usuario no autenticado." });
        }
      const negocioId = req.user.negocio[0];
               if (!negocioId ) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }
            // Obtienes la fecha de la factura (o la actual)


// Extraes el año y mes exactos respetando la zona horaria de Venezuela
const fechaActual = new Date();

const anio = parseInt(new Intl.DateTimeFormat('es-ES', { year: 'numeric', timeZone: 'America/Caracas' }).format(fechaActual));
const mes = parseInt(new Intl.DateTimeFormat('es-ES', { month: 'numeric', timeZone: 'America/Caracas' }).format(fechaActual));
const dia = parseInt(new Intl.DateTimeFormat('es-ES', { day: 'numeric', timeZone: 'America/Caracas' }).format(fechaActual));
console.log("Locura1111111111111111111111111111111111111111111111111111111111111111111111" ,anio, mes)
// Ahora sí, tu consulta a la base de datos guardará el mes y año real local
const estadisticaControl = await Estadisticas.findOne({ 
    negocio: negocioId, 
    anio: anio, 
    mes: mes 
});

    return res.status(201).json({estadisticaControl }); // Respuesta exitosa
     
    } catch (error) {
        console.error("Error en GET /api/productos:", error.message);
        return res.status(500).json({ error: "Ocurrió un error al obtener las facturas." });
    }
});

module.exports = ControlRouter;


