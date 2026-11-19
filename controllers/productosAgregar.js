const  ProductoAgregarRouter = require('express').Router(); // Router sigue siendo adecuado
const user = require('../models/user'); // Cambié "user" a "User" para que represente mejor el modelo
const PModel = require('../models/Pproductos'); // Cambié "Producto" a "PModel" para reflejar que es un modelo
const PMode = require('../models/productos'); // Cambié "Producto" a "PModel" para reflejar que es un modelo

const mongoose = require('mongoose');

const P = require('../models/Pproductos'); 

function CambioProductos(){
  
}
   

ProductoAgregarRouter.post("/productosAgregar", async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        // Usamos el ID del negocio que ya validaste
        const negocioId = user.negocio?.[0];
        if (!negocioId) {
            return res.status(401).json({ error: "Usuario sin negocio asociado." });
        }

        const { listaProductos } = req.body;
        const d = listaProductos.IdentificadorP;

        // Buscamos el producto en el inventario general
        const listaProducto = await PMode.findOne({
            _id: d,
            negocio: negocioId
        });

        if (!listaProducto) {
            return res.status(404).json({ error: "Producto no encontrado en este negocio." });
        }

        // Crea el documento en la tabla PRouter (Carrito/Venta Temporal)
        const nuevaFactura = new P({
            nombre: listaProducto.nombre,
            cantidad: 1,
            precio: listaProducto.precio,
            fecha: new Date(),
            productoId: listaProducto._id,
            checked: true,
            // 🌟 AQUÍ AGREGAMOS EL VENDEDOR (El ID del usuario logueado)
            vendedor: user._id, 
            // Usamos el negocioId validado
            negocio: negocioId 
        });

        // Guardar en la base de datos
        const facturaGuardada = await nuevaFactura.save();
        
        // Retornamos la respuesta
        return res.status(201).json(facturaGuardada);

    } catch (error) {
        console.error("Error al guardar la facturación:", error.message);
        return res.status(500).json({ 
            error: "Error al guardar la factura.", 
            detalle: error.message 
        });
    }
});

  // Ruta para manejar las solicitudes GET a /api/productos
 ProductoAgregarRouter.get("/", async (req, res) => {
  try {
    const user = req.user;
    console.log("🧠 Usuario recibido:", user);

    // Validación defensiva
    const negocioIdRaw = user.negocio?.[0] || null;
    if (!negocioIdRaw || !mongoose.Types.ObjectId.isValid(negocioIdRaw)) {
      console.warn("⚠️ ID de negocio inválido o no presente");
      return res.status(400).json({ error: "El usuario no tiene un ID de negocio válido." });
    }

    const negocioId = new mongoose.Types.ObjectId(negocioIdRaw);
    console.log("🔍 Buscando productos con negocio:", negocioId);

    const productos = await P.find({ negocio: negocioId, checked: true  , vendedor: req.user._id,});

    const productosConImagen = productos.map(producto => ({
      ...producto.toObject(),
      imagen: producto.imagen?.data
        ? `data:${producto.imagen.contentType};base64,${producto.imagen.data.toString("base64")}`
        : null
    }));

    res.json(productosConImagen);
  } catch (error) {
    console.error("❌ Error al obtener los productos:", error);
    res.status(500).json({ error: "Ocurrió un error al obtener los productos" });
  }
});

ProductoAgregarRouter.get("/:id", async (req, res) => {
  try {
    const user = req.user;
    const facturacionId = req.params.id;
    const cantidadSolicitada = parseInt(req.query.cantidad) || 1;

    const negocioIdRaw = user.negocio?.[0] || null;
    if (!negocioIdRaw || !mongoose.Types.ObjectId.isValid(negocioIdRaw)) {
      return res.status(400).json({ 
        success: false, 
        error: "ID de negocio inválido." 
      });
    }

    const producto = await P.findById(facturacionId);
    if (!producto) {
      return res.status(404).json({ 
        success: false, 
        error: "Producto no encontrado." 
      });
    }

    // Validación de stock
    if (producto.stock < cantidadSolicitada) {
      return res.status(400).json({ 
        success: false, 
        error: "No hay suficiente stock disponible." 
      });
    }

    const productoRelacionado = await PMode.findById(producto.productoId);

    const productoConImagen = {
      ...producto.toObject(),
      imagen: producto.imagen?.data
        ? `data:${producto.imagen.contentType};base64,${producto.imagen.data.toString("base64")}`
        : null
    };

    res.json({
      success: true, // 👈 aquí envías el flag
      producto: productoConImagen,
      modelo: productoRelacionado,
      cantidadDisponible: producto.stock
    });
  } catch (error) {
    console.error("❌ Error al obtener el producto:", error);
    res.status(500).json({ 
      success: false, 
      error: "Error interno del servidor." 
    });
  }
});



ProductoAgregarRouter.delete("/:id", async (req, res ,next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const facturacionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(facturacionId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const factura = await PModel.findById(facturacionId);
    if (!factura) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }


    // 🧠 Guardamos copia antes de eliminar
    const copiaFactura = factura.toObject(); // Convierte el documento Mongoose a objeto plano

    await PModel.findByIdAndDelete(facturacionId);
    console.log("Factura eliminada correctamente:", copiaFactura);

    // 🔁 Retornamos la copia como confirmación
    return res.status(200).json({
      mensaje: "Factura eliminada correctamente",
      facturaEliminada: copiaFactura,
    });

  } catch (error) {
    console.error("Error al eliminar la factura:", error);
    return res.status(500).json({ error: "Ocurrió un error en el servidor" });
  }
});



ProductoAgregarRouter.delete("/", async (req, res) => {
  try {
    console.log("➡️ DELETE /api/productosAgregar recibido");

    const negocioIdRaw = req.user.negocio[0];
    const negocioId  = req.user.negocio[0];
    console.log("🧠 negocioId recibido:", negocioIdRaw);

    if (!negocioIdRaw || !mongoose.Types.ObjectId.isValid(negocioIdRaw)) {
      console.warn("⚠️ ID de negocio inválido o no presente");
      return res.status(400).json({ error: "Debes proporcionar un ID de negocio válido." });
    }

  

    const existe = await PModel.find({  negocio: negocioId } );
    await PModel.deleteMany({ negocio: negocioId });

    console.log("📂 ¿Existe producto con ese negocio?", !!existe);

    if (!existe) {
      console.warn("⚠️ No hay productos para ese negocio");
      return res.status(404).json({ error: "No se encontraron productos asociados a ese negocio." });
    }

    console.log("🟡 Ejecutando deleteMany con filtro:", { negocio: negocioId });
    const resultado = await PModel.deleteMany({ negocio: negocioId });
    console.log("🔵 Resultado deleteMany:", resultado);

    return res.status(200).json({
      mensaje: `Se eliminaron ${resultado.deletedCount} productos.`,
      negocioId,
      cantidadEliminada: resultado.deletedCount
    });

  } catch (error) {
    console.error("❌ Error al eliminar productos:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});








// Asumiendo que ProductModel (PModel) es tu modelo Mongoose para productos
// y ProductoAgregarRouter es tu router de Express.



// Asumiendo que Mongoose está inicializado y PModel es el modelo de Producto
// const PModel = require('../models/ProductModel'); 

// Importar ObjectId de Mongoose para validar y construir filtros


const { ObjectId } = mongoose.Types; 
ProductoAgregarRouter.patch("/", async (req, res) => {
  try {
    // Verificación de que el modelo está cargado.
    if (!P || !P.modelName) {
      console.error("ERROR: El modelo P no está definido.");
      return res.status(500).json({ 
          error: "El modelo de producto (P) no está disponible o no se importó correctamente.",
          sugerencia: "Asegúrate de que el modelo 'Pproductos' esté correctamente importado y compilado."
      });
    }
    
    const { productos } = req.body;
    const user = req.user; 

    // 1. Validaciones de Acceso y Datos de Entrada
    if (!user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
console.log(Array.isArray(productos) || productos.length === 0)
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: "Lista de productos vacía o inválida" });
    }

    const operacionesValidas = [];
    const resultadosInvalidos = [];
    const idsValidos = []; 

    // 2. Pre-validación y Construcción de la Operación Masiva
    for (const producto of productos) {
      const { id, cantidad } = producto;
      
      // CONVERSIÓN A NÚMERO
      // 'newQuantity' es el nuevo valor total que debe tener la cantidad.
      const newQuantity = parseInt(cantidad); 

      // 2a. Validación de formato de datos
      if (
        !id ||
        !ObjectId.isValid(id) ||
        isNaN(newQuantity) ||
        newQuantity < 0 // En un carrito, la cantidad no debería ser negativa.
      ) {
        console.warn("Producto inválido, omitiendo:", producto);
        resultadosInvalidos.push({
          id,
          cantidad,
          actualizado: false,
          error: "Datos de producto inválidos (id, cantidad no numérica o menor a cero)"
        });
        continue;
      }
      
      const objectId = new ObjectId(id);
      idsValidos.push(objectId);

      // OPERACIÓN CLAVE: Usamos $set para fijar la cantidad al valor exacto
      const bulkOperation = {
        updateOne: {
          filter: { _id: objectId },
          update: { 
            $set: { cantidad: newQuantity } // Establece el nuevo valor directamente
          } 
        }
      };

      // === DEPURACIÓN: Muestra la operación que se intenta ===
      console.log('Operación BULK a ejecutar:', JSON.stringify(bulkOperation));
      // =======================================================

      operacionesValidas.push(bulkOperation);
    }

    if (operacionesValidas.length === 0) {
      return res.status(400).json({
        mensaje: "Ningún producto válido para actualizar",
        actualizaciones: resultadosInvalidos
      });
    }

    // 3. Ejecución de la Operación Masiva (Bulk Write)
    const resultadoMasivo = await P.bulkWrite(operacionesValidas); 
    
    // === DEPURACIÓN: Muestra el resultado de MongoDB ===
    console.log('Resultado Masivo de MongoDB:', resultadoMasivo);
    // ==================================================

    // 4. Lectura Única de los Documentos Actualizados/Intentados
    const productosFinales = await P.find({ _id: { $in: idsValidos } }).lean(); 

    // 5. Consolidación de Resultados
    const actualizacionesFinales = [];
    const productosMap = new Map(productosFinales.map(p => [p._id.toString(), p]));
    const totalModified = resultadoMasivo.modifiedCount;
    let modifiedCountCheck = 0; 

    // Iteramos sobre las operaciones válidas para determinar el estado post-actualización
    for (const operacion of operacionesValidas) {
        const idString = operacion.updateOne.filter._id.toString();
        // Usamos $set en esta nueva versión, no $inc. Extraemos la cantidad de $set
        const newQuantitySet = operacion.updateOne.update.$set.cantidad; 
        
        const productoLeido = productosMap.get(idString);
        
        let fueModificado = false;
        let errorMensaje = null;
        
        if (productoLeido) {
            // El resultadoMasivo.modifiedCount indica que hubo cambios.
            if (modifiedCountCheck < totalModified) {
                modifiedCountCheck++;
                fueModificado = true;
            } 
            
            // Si el producto fue encontrado, reportamos el estado
            actualizacionesFinales.push({
                id: idString,
                cantidadFinal: productoLeido.cantidad, // Valor final después de la actualización
                cantidadEstablecida: newQuantitySet,
                actualizado: fueModificado,
                producto: productoLeido,
                error: !fueModificado ? "ID encontrado, pero no se modificó (posiblemente porque ya tenía la cantidad solicitada)" : null
            });
        } else {
             actualizacionesFinales.push({
                id: idString,
                cantidadEstablecida: newQuantitySet,
                actualizado: false,
                producto: null,
                error: "Producto no encontrado en la base de datos (ID válido pero inexistente)"
            });
        }
    }

    // 6. Devolver Respuesta
    return res.status(200).json({
      mensaje: `Actualización de cantidades completada. ${totalModified} de ${operacionesValidas.length} productos fueron modificados exitosamente.`,
      // Combinar los resultados de la pre-validación y la post-actualización
      actualizaciones: [...actualizacionesFinales, ...resultadosInvalidos]
    });

  } catch (error) {
    console.error("Error al actualizar las cantidades", error);
    // 7. Manejo de Errores
    return res.status(500).json({ error: "Ocurrió un error en el servidor", detalle: error.message });
  }
});


module.exports =  ProductoAgregarRouter;
