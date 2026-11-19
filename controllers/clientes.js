const express = require('express');
const clientesRouter = express.Router();
const Cliente = require('../models/clientes'); // Tu modelo de Mongoose
const roleChecker = require('../middleware/roleChecker'); 
const checkPlan = require('../middleware/VerificacionPlanes'); 
// RUTA: POST /api/clientes/registrar

clientesRouter.get('/inventario', roleChecker(['Propietario', 'Administrador', 'Vendedor', "Gerente"]),checkPlan("Clientes"), async (req, res) => {
    try {
        const { clienteCedula } = req.query;

        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "Usuario no autenticado." });
        }

        const negocioId = req.user.negocio[0];
        if (!negocioId) {
            return res.status(401).json({ error: "Negocio no especificado." });
        }

        // Creamos la expresión regular si el usuario escribió algo
        const searchRegex = clienteCedula && clienteCedula.trim() !== "" 
            ? new RegExp(clienteCedula.trim(), 'i') 
            : null;

        // Búsqueda 100% directa y optimizada dentro del .find() de MongoDB
        let clientes = await Cliente.find({
            negocio: negocioId,
            ...(searchRegex && {
                $or: [
                    { nombre: searchRegex },
                    { cedula: searchRegex }
                ]
            })
        })
        .limit(6)
        .lean();

        // Ocultar datos sensibles si es Vendedor
        if (req.user.rol === "Vendedor") {
            clientes = clientes.map(cliente => ({
                ...cliente,
                saldoDeudoraTotal: cliente.saldoDeudoraTotal !== undefined ? "Confidencial" : undefined,
                totalGastadoHistorico: cliente.totalGastadoHistorico !== undefined ? "Confidencial" : undefined
            }));
        }

        return res.json(clientes);

    } catch (error) {
        console.error("❌ ERROR CRÍTICO EN BACKEND:", error);
        return res.status(500).json({ mensaje: "Error interno", detalle: error.message });
    }
});
clientesRouter.post('/c', checkPlan("Clientes"), async (req, res) => {


  try {
      const {Nombre , Cedula , Telefono , Ocupacion, Fecha} = req.body;
      console.log(Nombre , Cedula , Telefono , Ocupacion, Fecha)

    if (!Nombre || !Cedula || !Telefono) {
        return res.status(400).json({ error: "Usuario  dato invalido" })
    }      
    const validarTelefonoVzla = (numero) => {
    // Explicación de la Regex:
    // ^04         -> Debe empezar por 04
    // (12|14|24|16|26) -> Seguido de uno de estos códigos
    // [0-9]{7}$   -> Y terminar con exactamente 7 números más
    const regex = /^04(12|14|24|16|26)[0-9]{7}$/;
    return regex.test(numero);
};

// Uso en tu evento de registro:
const tlf = Telefono;

if (!validarTelefonoVzla(tlf)) {
    return res.status(403).json({ error: "Usuario  dato invalido" })
} 
    const regexCedula = /^[VJEGP][0-9]{6,9}$/i;
if (!regexCedula.test(Cedula) ) {
 return res.status(403).json({ error: "Usuario  dato invalido" })
}                                                    
       const user = req.user;
          if (!user) {
            return res.status(401).json({ error: "Usuario no autenticado" });
          }
    
          // 1. Validación de negocio
          const negocioId = req.user?.negocio?.[0];
          if (!negocioId) return res.status(401).json({ error: "Usuario sin negocio asociado." });
    
    // Buscamos por cédula y actualizamos los datos que vienen del formulario
    // Si no existe, 'upsert: true' crea el documento nuevo

        // 2. BUSCAR SI YA EXISTE
        const clienteExistente = await Cliente.findOne({ cedula: Cedula });

        if (clienteExistente) {
            // Si lo encuentra, lanzamos el error y DETENEMOS el proceso
            return res.status(404).json({ 
                success: false, 
                error: "El cliente ya está registrado con esa cédula." 
            });
        }

        // 3. SI NO EXISTE, LO CREAMOS
        // Usamos .create() que es más directo para registros nuevos
        const nuevoCliente = await Cliente.create({
            nombre: Nombre,
            cedula: Cedula,
            telefono: Telefono,
            fechaNacimiento: Fecha,
            ocupacion: Ocupacion,
            negocio: negocioId
        });

        return res.status(201).json({
            success: true,
            mensaje: "Cliente creado exitosamente",
            cliente: nuevoCliente
        });



  } catch (error) {
    console.error("Error al registrar cliente:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error en el servidor al procesar el registro",
      error: error.message
    });
  }
});

clientesRouter.get('/c',checkPlan("Clientes"), async (req, res) => {


  try {

                                                           
       const user = req.user;
          if (!user) {
            return res.status(401).json({ error: "Usuario no autenticado" });
          }
    
          // 1. Validación de negocio
          const negocioId = req.user?.negocio?.[0];
          
          if (!negocioId) return res.status(401).json({ error: "Usuario sin negocio asociado." })
           

    
const nuevoCliente = await Cliente.find({
  negocio: negocioId,
  

}).sort({ _id: -1 }) // Los más nuevos primero
            .limit(200)       
            .lean(); 
    

        return res.status(201).json({
            success: true,
            mensaje: "Cliente creado exitosamente",
            cliente: nuevoCliente
        });



  } catch (error) {
    console.error("Error al registrar cliente:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error en el servidor al procesar el registro",
      error: error.message
    });
  }
});

module.exports = clientesRouter;