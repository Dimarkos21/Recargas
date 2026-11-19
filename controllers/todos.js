const todosRouter = require('express').Router();
const user = require('../models/user');
const Todo = require('../models/todo');
const roleChecker = require('../middleware/roleChecker'); 
const mongoose = require('mongoose');
// modelo de pedidos
const Pedido = require('../models/Pedidos');
//escuchador 



// Ruta para manejar las solicitudes POST a /api/todos
todosRouter.post("/", async (request, response) => {
    try {
        const user = request.user;
        if (!user) {
            return response.status(401).json({ error: 'Usuario no autenticado' });
        }


        // 1. Extraemos los datos del body (vienen planos desde el front)
const { 
    paciente, Edad, cedula, telefono, patologia, OD, OI, 
    CilindroD, CilindroI, AdicionI, AdicionD, EjeD, EjeI, 
    Altura, DP, Resultados, Montura, Cristales, tratamiento,
    AgudezaVisual ,    especialidad

} = request.body;
if(    !paciente, !Edad, !cedula, !telefono, !patologia, !OD, !OI, 
    !CilindroD, !CilindroI, !AdicionI, !AdicionD, !EjeD, !EjeI, 
    !Altura, !DP, !Resultados, !Montura, !Cristales, !tratamiento,
    !AgudezaVisual ,    !especialidad) { 
        return response.status(400).json({ error: 'Faltan datos obligatorios' });
    }
  let   ObjetoFormulaOftamologica = null;
 if (  especialidad === "Oftalmología"){
  ObjetoFormulaOftamologica = {
        OD : {    Lejos : AgudezaVisual?.LejosAVOD || 0,
            Cerca: AgudezaVisual?.CercaAvOd || 0,
            PIO : AgudezaVisual?.PIO_OD || 0 ,
               DNP_L : AgudezaVisual?.NasoPupilarOD_L || 0  ,
               DNP_C: AgudezaVisual?.NasoPupilarOD_C ||  0 ,
               DV : AgudezaVisual?.VerticeOD  || 0,
               AP: AgudezaVisual?.PantoscopicoOD  || 0,
               AF  : AgudezaVisual?.AnguloFacialOD  || 0,
        } , 
        
        OI : {
            Lejos : AgudezaVisual?.LejosAVOI || 0,
            Cerca: AgudezaVisual?.CercaAvOI || 0,
            PIO : AgudezaVisual?.PIO_OI || 0 ,
               DNP_L : AgudezaVisual?.NasoPupilarOI_L || 0,
               DNP_C:  AgudezaVisual?.NasoPupilarOI_C || 0,
               DV: AgudezaVisual?.VerticeOI || 0 ,
             AP  : AgudezaVisual?.PantoscopicoID  || 0,
             AF : AgudezaVisual?.AnguloFacialOI || 0 ,
        },
        
   
    }
 }
const newTodo = new Todo({
    paciente,
    cedula,
    edad: Number(String(Edad).trim()),
    telefono,
    patologia,
    
   
      
        formula: {
        od: {
            esfera: OD || "0.00",
            cilindro: CilindroD || "0.00",
            eje: EjeD || "0",
            adicion: AdicionD || "0.00"
        },
        oi: {
            esfera: OI || "0.00",
            cilindro: CilindroI || "0.00",
            eje: EjeI || "0",
            adicion: AdicionI || "0.00"
        },
        cristales: Cristales,
        dp: DP,
            tratamiento: tratamiento ,
        altura: Altura
    },
 


 
      
       oftamologia : ObjetoFormulaOftamologica,
    montura: Montura,
    resultados: Resultados,
 responsable:{
    nombre:  user.name,
    ID : user._id ,
 },
    fecha:   new Date(),
    checked: true,
    negocio: user.negocio
});

        // 3. Guardar en MongoDB
        const historiaGuardada = await newTodo.save();
        
        console.log('✅ Registro guardado siguiendo el esquema:', historiaGuardada._id);

        // 2. Crear pedido EN SEGUNDO PLANO (Sin await)
// No usamos await para que no detenga la respuesta al usuario

Pedido.create({
 
   Origen: 'Pacientes', // Marcamos que viene de un operativo para estadística
    paciente:    historiaGuardada.paciente,
    cedula:   historiaGuardada.cedula,
    edad:   historiaGuardada.Edad,
    telefono:   historiaGuardada.telefono,
    patologia:   historiaGuardada.patologia,
    formula: {
        od: {
            esfera:   historiaGuardada.formula.od.esfera|| "0.00",
            cilindro:   historiaGuardada.formula.od.cilindro || "0.00",
            eje:   historiaGuardada.formula.od.eje ,
            adicion:   historiaGuardada.formula.od.adicion || "0.00"
        },
        oi: {
            esfera:   historiaGuardada.formula.oi.esfera || "0.00",
            cilindro:   historiaGuardada.formula.oi.cilindro || "0.00",
            eje:   historiaGuardada.formula.oi.eje || "0",
            adicion:   historiaGuardada.formula.oi.adicion || "0.00"
        },
        cristales:   historiaGuardada.formula.cristales,
        dp:   historiaGuardada.formula.dp,
            tratamiento:   historiaGuardada.formula.tratamiento ,
        altura:   historiaGuardada.formula.altura
    },

    resultados:   historiaGuardada.Resultados,
  

    negocio: user.negocio,

}).catch(err => {
    // Si falla, lo guardamos en un log especial para recuperarlo luego
    console.error(`🚨 ERROR CRÍTICO: Pedido no creado para paciente ${paciente}`, err);
});
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
todosRouter.get("/", async (request, response) => {
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

        const todos = await Todo.find({negocio: negocioId, checked: true}).sort({ _id: -1 })
  
        response.json(todos);
    } catch (error) {
        response.status(500).json({ error: 'An error occurred' });
    }
});
todosRouter.get("/buscar", async (request, response) => {
    try {  
     const { clienteCedula } = request.query;
          console.log(clienteCedula);
    const negocioId = request.user.negocio[0];
    

    
                const user = request.user;
                if (!user) {
                    return response.status(401).json({ error: "Usuario no autenticado" });
                }
                     if (!negocioId) {
                    return response.status(401).json({ error: "Usuario sin negocio autenticado" });
                }

           
        const todos = await Todo.find({negocio: negocioId, checked: true , paciente: { $regex: clienteCedula, $options: 'i' }}).sort({ _id: -1 }).limit(5)
  
        response.json(todos);
    } catch (error) {
        response.status(500).json({ error: error });
    }
});
todosRouter.delete("/Papelera", roleChecker(['Propietario', 'Administrador']), async (req, res) => {
    try {

          const negocioId = req.user.negocio[0];

                const user = req.user;
                if (!user) {
                    return res.status(401).json({ error: "Usuario no autenticado" });
                }
                     if (!negocioId) {
                    return res.status(401).json({ error: "Usuario sin negocio autenticado" });
                }

        // 1. Buscamos TODOS los productos que están en la papelera (status: false)

        const productosABorrar = await Todo.find({ negocio: negocioId, checked: false});

        if (productosABorrar.length === 0) {
            return res.json({ message: "La papelera ya está vacía." });
        }

        // 2. Borramos las imágenes de Cloudflare R2 una por una
        for (const producto of productosABorrar) {
            if (producto.imagen) {
                const deleteParams = {
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: producto.imagen, // La ruta limpia que guardamos antes
                };
                try {
                    await s3Client.send(new DeleteObjectCommand(deleteParams));
                    console.log(`Imagen borrada de R2: ${producto.imagen}`);
                } catch (err) {
                    console.error(`No se pudo borrar la imagen ${producto.imagen} de R2:`, err);
                }
            }
        }

        // 3. Ahora sí, borramos todos los registros de la base de datos
        const resultado = await Todo.deleteMany({ negocio: negocioId, checked: false });

        res.json({
            message: "Papelera vaciada con éxito",
            cantidadEliminada: resultado.deletedCount
        });

    } catch (error) {
        console.error("❌ Error al vaciar la papelera:", error);
        res.status(500).json({ error: 'Ocurrió un error al vaciar la papelera' });
    }
});
// papelera restaurar 

todosRouter.patch('/restaurar/:id', roleChecker(['Propietario', 'Administrador']), async (req, res) => {
  try {
    const Pid = req.params.id;

    if (!req.user || !req.user.negocio || req.user.negocio.length === 0) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    const negocioId = req.user.negocio[0];

    // 1. BUSCAR Y ACTUALIZAR el campo que lo saca de la papelera
    // Aquí asumo que 'checked: true' significa que está en papelera. 
    // Lo cambiamos a 'false' para restaurarlo.
    const productoActualizado = await Todo.findOneAndUpdate(
      { _id: Pid, negocio: negocioId }, 
      { $set: { checked: true} ,
      $unset: { deletedAt: "" }
    
    }, // <--- CAMBIO CLAVE: Cambia el estado
      
      { new: true } // Para que devuelva el objeto ya modificado
    );

    if (!productoActualizado) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // --- LÓGICA DE IMAGEN (Tu código original optimizado) ---
    const prodObj = productoActualizado.toObject();
 

 

    const respuesta = { ...prodObj};

    console.log(`✅ Producto restaurado con éxito: ${respuesta.nombre}`);
    res.json(respuesta); // Enviamos el producto restaurado al frontend

  } catch (error) {
    console.error('❌ Error al restaurar producto:', error);
    res.status(500).json({ error: 'Error interno al restaurar' });
  }
});

todosRouter.get("/Papelera/cantidad", roleChecker(['Propietario', 'Administrador', 'Vendedor', "Gerente"]), async (req, res) => {
    try {
        const negocioId = req.user.negocio[0];

        // Usamos countDocuments para que la base de datos solo cuente y no devuelva datos
        const cantidadPapelera = await Todo.countDocuments({ 
            negocio: negocioId, 
            checked: false 
        });

        res.json({ total: cantidadPapelera });
    } catch (error) {
        console.error("Error al contar productos en papelera:", error);
        res.status(500).json({ error: 'Error al obtener la cantidad' });
    }
});
todosRouter.get("/Papelera",roleChecker(['Propietario', 'Administrador', 'Vendedor']), async (request, response) => {
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

        const todos = await Todo.find({negocio: negocioId,checked: false});
   
        response.json(todos);
    } catch (error) {
        response.status(500).json({ error: 'An error occurred' });
    }
});

// Ruta para manejar las solicitudes DELETE a /api/todos/:id
todosRouter.delete("/:id", 
    roleChecker(['Propietario', "Administrador"]), 
     async (req, res, next) => {
            try {
                const negocioId = req.user.negocio[0];
                const user = req.user;
                if (!user) {
                    return res.status(401).json({ error: "Usuario no autenticado" });
                }
                     if (!negocioId) {
                    return res.status(401).json({ error: "Usuario sin negocio autenticado" });
                }
    
                const facturacionId = req.params.id;
                if (!mongoose.Types.ObjectId.isValid(facturacionId)) {
                    return res.status(400).json({ error: "ID de producto inválido" });
                }
    
                // 1. En lugar de borrar, actualizamos el campo 'checked' a false
                // Esto lo mueve al "historial" o lo oculta de la vista activa
                 const ahora = new Date();
    const diezDiasEnMs = 20 * 24 * 60 * 60 * 1000;
    const fechaExpiracion = new Date(ahora.getTime() + diezDiasEnMs);
    
                const productoActualizado = await Todo.findByIdAndUpdate(
                    facturacionId, 
                    {  checked: "false",            // Usar booleano false, no "false" entre comillas
            deletedAt: ahora,         // Grabamos HOY para que el índice cuente desde aquí
            expiresAt: fechaExpiracion,  }// Opcional: para mostrar al usuario cuándo vence }
               
                );
    
                if (!productoActualizado) {
                    return res.status(404).json({ error: "Producto no encontrado" });
                }
                
                // Guardamos el producto en locals por si tienes un middleware de auditoría después
                res.locals.deletedEntity = productoActualizado;
    
                // Enviamos un 200 (OK) o 204. Recomiendo 200 si quieres confirmar el cambio.
                res.status(200).json({ message: "Paciente movido al historial (desactivado)" });
    
            }
   

         

                  catch (error) {
            console.error("Error al eliminar la factura:", error);
            return response.status(500).json({ error: "Ocurrió un error en el servidor" });
        }
    }
);

module.exports = todosRouter;
