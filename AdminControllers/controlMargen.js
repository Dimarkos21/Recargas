const ControlMargen= require('express').Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// Modelos necesarios 

const roleChecker = require('../middleware/roleChecker'); 
const Juegos = require("../models/PagoModel");


ControlMargen.get('/Total', async (req, res) => { 


    try {

const Juegos  = await db.tu_coleccion.aggregate([
  {
    $match: {
      estatus: {
        $in: [ 'APROBADO', 
          'DEBITO_APROBADO'  ,
          'REEMBOLSADO', 
        ]} // Opcional: filtra antes de sumar
    
    }
  },
  {
    $group: {
      _id: null,
      ordenProcesada: true,
      costoTotal: { $sum: "$precioUnitarioUsd" ,
        utilizado: true,
      }
    
    }
  }
]);
         

 return res.status(200).json(Juegos );

    } catch (error) {
        console.error("Error al obtener la deuda total:", error.message);
        return res.status(500).json({ error: "Error al obtener la deuda total." });
    }
    
} );




module.exports = ControlMargen;