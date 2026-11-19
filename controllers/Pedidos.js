const pedidosRouter = require('express').Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// Modelos necesarios 
const User = require('../models/user'); 
const Pedidos = require('../models/Pedidos'); 
const roleChecker = require('../middleware/roleChecker'); 
const nodemailer = require('nodemailer');
const { response } = require('express');

// =================================================================
// RUTA Get /)
// =================================================================
//recibir 



// Esta función se ejecuta al arrancar tu servidor



// consultar
pedidosRouter.get("/",  roleChecker(['Propietario', 'Administrador', 'Vendedor','Gerente']),   async (req, res) => {
    try{

           if (!req.user || !req.user._id) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }
                   const negocioId = req.user.negocio[0];
               if (!negocioId ) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }

        const pedidos = await Pedidos.find({negocio:negocioId })
           .sort({ _id: -1 }) // Orden cronológico (más nuevos primero) usando el índice por defecto
            .limit(50)      // Trae solo un bloque de 50
            .lean(); 
     
            return res.status(200).json({
            mensaje: "tabla consultada",
            data: pedidos,
            optica: req.user.name,
        });
    } catch(error){
            console.error("Error en verificación:", error);
        res.status(500).json({ error: "Error interno al procesar el pago" });
        return res.status(500)}
}
);

pedidosRouter.patch('/:id'  ,roleChecker(["Propietario", "Administrador",'Gerente']), async (req, res) => {
  try {
    const Pid = req.params.id;

    if (!req.user || !req.user.negocio || req.user.negocio.length === 0) {
      return res.status(401).json({ error: "Usuario no autenticado o sin negocio asignado." });
    }

    const negocioId = req.user.negocio[0];
  const {
             id 
            
            } = req.body;;
            Valor  = 0;



const Pedidos2 = await Pedidos.findOne( {_id: id, negocio: negocioId  });
if (Pedidos2.checked === "PorPedir") // Verifica si el estado actual es "PorPedir"
{Valor = "enLaboratorio" } // Cambia el estado a "enLaboratorio"
else  if (Pedidos2.checked === "enLaboratorio") // Verifica si el estado actual es "Completado"
{  Valor = "Completado"}// Cambia el estado a "Completado"
else if (Pedidos2.checked === "Completado")  {
    Valor = "Entregado" 
}  // cambia el estado a "Entregado" si no es ninguno de los anteriores
if (Valor === 0 )
{      return res.status(404).json({ error: "Usuario no autenticado o sin negocio asignado." });};

const Pedidos1 = await Pedidos.findOneAndUpdate(
    {
        _id: id,       // Buscamos el pedido específico por su ID único
        negocio: negocioId      // Filtramos por tu negocioId para asegurar que pertenezca a la óptica
    },
    {
        $set: { 
            checked: Valor,       // Aquí lo pasas de 'Pedir' a 'enLaboratorio' o 'Completado'

        }
    },
    { 
        new: true // Esto le dice a Mongo que te devuelva el pedido YA actualizado en la variable 'Pedidos1'
    }
);
    if (!Pedidos1) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

          return res.status(200).json({
            mensaje: "tabla consultada",
            data: Pedidos1 ,
            id: Pedidos1._id,
       
        });

  } catch (error) {
    console.error('❌ Error al buscar el producto:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});
pedidosRouter.get('/:id',roleChecker(['Propietario', 'Administrador', 'Vendedor','Gerente']),  async (req, res) => {
  try {
    const Pid = req.params.id;

    if (!req.user || !req.user.negocio || req.user.negocio.length === 0) {
      return res.status(401).json({ error: "Usuario no autenticado o sin negocio asignado." });
    }

    const negocioId = req.user.negocio[0];

    const Pedidos1 = await Pedidos.find({
    checked: Pid,
      negocio: negocioId,
    
    }) .sort({ _id: -1 });


    if (!Pedidos1) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    };

          return res.status(200).json({
            mensaje: "tabla consultada",
            data: Pedidos1 ,
       
        });

  } catch (error) {
    console.error('❌ Error al buscar el producto:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});
module.exports = pedidosRouter;