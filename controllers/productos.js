const productosRouter = require('express').Router(); // Router sigue siendo adecuado
const mongoose = require('mongoose');
const user = require('../models/user'); // Cambié "user" a "User" para que represente mejor el modelo
const ProductosModel = require('../models/productos'); // Cambié "Producto" a "ProductosModel" para reflejar que es un modelo

const multer = require("multer");
const path = require("path");


const User = require('../models/user'); // Cambié "user" a "User" para que represente mejor el modelo








const  NegocioModel =require('../models/negocio');

const checkPlan = require('../middleware/VerificacionPlanes'); 
const roleChecker = require('../middleware/roleChecker'); 
// Configuración de Multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Límite estricto de 5MB
});
// Ruta para manejar las solicitudes POST a /api/productos
     

const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../list/index"); // Asegúrate de tener este archivo configurado
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
    
const sharp = require('sharp'); // Para optimizar imágenes

const cron = require('node-cron');
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
// Importa tu modelo y tu cliente S3/R2


// Tarea programada: Se ejecuta todos los días a las 3:00 AM
cron.schedule('0 3 * * *', async () => {
    console.log("--- 🧹 INICIANDO LIMPIEZA PROGRAMADA ---");
    
    try {
        const haceDiezDias = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000));
        
        // 1. Buscamos solo los IDs y las rutas de imagen (para no cargar todo el objeto)
        const productos = await ProductosModel.find(
            { status: false, deletedAt: { $lte: haceDiezDias } },
            'imagen _id' 
        ).lean();

        if (productos.length === 0) return console.log("Nada que limpiar.");

        // 2. Procesamos en bloques de 20 para no saturar la conexión
        const tamañoBloque = 20;
        for (let i = 0; i < productos.length; i += tamañoBloque) {
            const bloque = productos.slice(i, i + tamañoBloque);

            // Ejecutamos el borrado del bloque en paralelo
            await Promise.all(bloque.map(async (prod) => {
                try {
                    // Borrar de R2
                    if (prod.imagen) {
                        await s3Client.send(new DeleteObjectCommand({
                            Bucket: process.env.R2_BUCKET_NAME,
                            Key: prod.imagen
                        }));
                    }
                    // Borrar de MongoDB
                    await ProductosModel.findByIdAndDelete(prod._id);
                } catch (err) {
                    console.error(`Error procesando ID ${prod._id}:`, err.message);
                }
            }));

            console.log(`Progreso: ${i + bloque.length}/${productos.length} procesados.`);
            
            // Pausa de 1 segundo entre bloques para dejar respirar al servidor
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log("--- ✅ Limpieza de SaaS completada con éxito ---");

    } catch (error) {
        console.error("❌ Error en el cron de limpieza:", error);
    }
}, {
    scheduled: true,
    timezone: "America/Caracas"
});
// 1. Configuración de Multer con límite de 5MB

productosRouter.post("/", 
    upload.single("imagen"), 
    roleChecker(['Propietario', 'Administrador' , "Gerente"]), checkPlan("Productos"),
    async (req, res) => {
        try {
            // 1. CAMBIO: Usamos 'let' en lugar de 'const' para que 'codigo' pueda ser modificado
            let { 
                nombre, codigo, categoria, 
                marca, esfera, cilindro, adicion,
                stock_actual, costo, precio,
                negocio ,Tratamiento , Tipo, precioMayor, CodigoBarras2026
            } = req.body;

if (!nombre){
                return res.status(400).json({ error: "El campo 'nombre' es obligatorio, está vacío o es false." });
            }

            if (!categoria) {
                return res.status(400).json({ error: "El campo 'categoria' es obligatorio, está vacío o es false." });
            }

            if (!stock_actual) {
                return res.status(400).json({ error: "El campo 'stock_actual' es obligatorio, está vacío o es false." });
            }

            if (!costo) {
                return res.status(400).json({ error: "El campo 'costo' es obligatorio, está vacío o es false." });
            }

            if (!precio) {
                return res.status(400).json({ error: "El campo 'precio' es obligatorio, está vacío o es false." });
            }

            const stockNum = Number(stock_actual);
            
            if (isNaN(stockNum) || stockNum < 0) {
                return res.status(400).json({ 
                    error: "Stock inválido", 
                    detalle: "El stock inicial no puede ser un número negativo." 
                });
            }

            if (!req.user || !req.user._id) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }
            
            const negocioId = req.user.negocio[0];
            
            if (!negocioId) {
                return res.status(401).json({ error: "Negocio no identificado." });
            }

            if (categoria === "Cristal" && (!esfera || !cilindro || !adicion)) {
                return res.status(400).json({ error: "Todos los campos de formula son obligatorios." });
            }

            if (categoria === "Cristal" && (isNaN(parseFloat(esfera)) || isNaN(parseFloat(cilindro)) || isNaN(parseFloat(adicion)))) {
                return res.status(400).json({ error: "Todos los campos de formula deben ser numéricos." });
            }
                
            const totalProductos = await ProductosModel.countDocuments({ 
                negocio: negocioId, 
                status: true 
            });

            const negocioPermisos = await NegocioModel.findOne({ _id: negocioId });

            if (totalProductos >= negocioPermisos.permisos.productos) {
                return res.status(403).json({ 
                    error: "Límite de plan alcanzado",
                    detalle: `Tu plan básico permite un máximo de ${negocioPermisos.permisos.productos} productos activos.` 
                });
            }

            // 2. GENERACIÓN AUTOMÁTICA DEL CÓDIGO SI ESTÁ VACÍO
            if (!codigo || String(codigo).trim() === '') {
                try {
                    const negocioActualizado = await NegocioModel.findByIdAndUpdate(
                        { _id: negocioId },
                        { $inc: { 'contadores.productos': 1 } },
                        { new: true }
                    );

                    const numero = String(negocioActualizado.contadores.productos).padStart(4, '0');
                    codigo = `PAC-${numero}`; // Se asigna correctamente porque 'codigo' es 'let'

                } catch (error) {
                    console.log("❌ Error al generar el código:", error);
                    return res.status(500).json({ 
                        success: false,
                        mensaje: 'Error al generar el SKU o código del producto', 
                        error: error.message 
                    });
                }
            }

            const datosParaGuardar = {
                nombre: nombre,
                codigo, // Aquí ya viaja con el valor generado o el que introdujo el usuario
                codigoBarras: CodigoBarras2026,
                categoria,
                detalles: { marca: marca },
                especificaciones: (esfera || cilindro) ? {
                    esfera: esfera ? parseFloat(esfera) : 0,
                    cilindro: cilindro ? parseFloat(cilindro) : 0,
                    adicion: adicion ? parseFloat(adicion) : 0,
                    tratamiento: Tratamiento ? String(Tratamiento).trim() : 0,
                    tipo: Tipo ? String(Tipo).trim() : 0,   
                } : undefined,
                stock: {
                    actual: Number(stock_actual) || 0,
                    minimo: 2 
                },
                finanzas: {
                    costo: Number(costo),
                    precio: Number(precio),
                    precioMayorista: Number(precioMayor),
                    moneda: 'USD'
                },
                negocio: negocioId,
                status: true
            };

            if (req.file) {
                const bufferOptimizado = await sharp(req.file.buffer)
                    .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 }) 
                    .toBuffer();

                const fileName = `${negocioId}/productos/${Date.now()}-${codigo}.webp`;

                const uploadParams = {
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: fileName,
                    Body: bufferOptimizado,
                    ContentType: 'image/webp',
                };

                await s3Client.send(new PutObjectCommand(uploadParams));
                datosParaGuardar.imagen = fileName; 
                console.log(`📸 Imagen guardada: ${fileName}`);
            }

            const nuevoProducto = new ProductosModel(datosParaGuardar);
            const productoGuardado = await nuevoProducto.save();
            
            return res.status(201).json(productoGuardado);

        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ 
                    error: "Código duplicado", 
                    detalle: `El código (SKU) '${req.body.codigo}' ya está registrado.` 
                });
            }
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: "La imagen excede el límite de 5MB." });
            }

            console.error("❌ Error al guardar producto:", error);
            return res.status(500).json({ error: "Error interno", detalle: error.message });
        }
    }
);

productosRouter.get('/inventario',  roleChecker(['Propietario', 'Administrador', 'Vendedor' , "Gerente"]), checkPlan("Productos"),  async (req, res) => {
    try {
   

        if (!req.user || !req.user._id) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }
                   const negocioId = req.user.negocio[0];
               if (!negocioId ) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }

     
        // 1. Capturamos y normalizamos el término de búsqueda
        const searchRaw = req.query.search || "";
        const search = searchRaw.toLowerCase().trim();
      
        console.log(`--- INICIO BÚSQUEDA ---`);
        console.log(`📡 Recibido del cliente: "${searchRaw}"`);
        console.log(`🧹 Término procesado: "${search}"`);

        // 2. Traemos los datos base del negocio]

        const facturas = await  ProductosModel.find({ negocio: negocioId ,// Agregamos el filtro directo en la BD:
$or: [
    { nombre: { $regex: search, $options: "i" } } ,
    { codigo: { $regex: search, $options: "i" } },
    { codigoBarras: { $regex: search, $options: "i" } },// Busca 'search' en cualquier parte, ignorando mayúsculas ('i')
  ] ,status: true , "stock.actual": { $gt: 0 }  })
        .limit(50) // Limite de 50 para evitar saturar la memoria
    .sort({ _id: -1 })
        .lean();
        const rolUsuario = req.user.rol; // O req.user.role, según tu base de datos
     if (rolUsuario === "Vendedor") {
            facturas = facturas.map(prod => {
                const p = prod.toObject(); // Convertimos de Mongoose a objeto JS
                if (p.finanzas) {
                    p.finanzas.costo = "Confidencial"; // O simplemente 0
                }
                return p;
            });
            console.log("🔒 Costos ocultados para el Vendedor");
        }
console.log(facturas)
        console.log(`📦 Total facturas en este negocio: ${facturas.length}`);

        // 3. Si no hay búsqueda, enviamos todo
        if (!search) {
            console.log("⚠️ Búsqueda vacía, enviando todo.");
            return res.json(facturas);
        }

        // 4. Filtrado con Logs de comparación
  

  
        console.log(`--- FIN BÚSQUEDA ---`);

        res.json(facturas);

    } catch (error) {
        console.error("❌ ERROR CRÍTICO EN BACKEND:", error);
        res.status(500).json({ mensaje: "Error interno" });
    }
});

productosRouter.get('/inventario/codigoBarras', roleChecker(['Propietario', 'Administrador', 'Vendedor', 'Gerente']), checkPlan("Productos"), async (req, res) => {
    try {
        // 1. Validar autenticación y negocio
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "Usuario no autenticado." });
        }
        
        const negocioId = req.user.negocio?.[0];
        if (!negocioId) {
            return res.status(401).json({ error: "El usuario no tiene un negocio asociado." });
        }

        // 2. Capturar y validar el código de barras
        const searchRaw = req.query.codigo;
        if (!searchRaw || searchRaw.trim() === "") {
            console.log("⚠️ Búsqueda vacía rechazada.");
            return res.status(400).json({ error: "El código de barras es obligatorio." });
        }

        const codigoBusqueda = searchRaw.trim(); // Mantener mayúsculas/minúsculas si el código de barras lo requiere, o usar .toLowerCase() si es estándar.
      
        console.log(`--- INICIO BÚSQUEDA ---`);
        console.log(`📡 Recibido del cliente: "${searchRaw}"`);

        // 3. Buscar el producto en la base de datos (findOne porque es un código de barras único)
        let producto = await ProductosModel.findOne({ 
            negocio: negocioId,
            codigoBarras: codigoBusqueda,
            status: true, 
            "stock.actual": { $gt: 0 } 
        }).lean();

        // Si no lo encuentra por código de barras estricto, puedes retornar 404
        if (!producto) {
            console.log("❌ Producto no encontrado o sin stock.");
            return res.status(404).json({ error: "Producto no encontrado en el inventario." });
        }

        // 4. Ocultar costos si el rol es Vendedor
        if (req.user.rol === "Vendedor") {
            if (producto.finanzas) {
                producto.finanzas.costo = "Confidencial";
            }
            console.log("🔒 Costos ocultados para el Vendedor");
        }

        console.log(`--- FIN BÚSQUEDA ---`);
        res.json(producto);

    } catch (error) {
        console.error("❌ ERROR CRÍTICO EN BACKEND:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
});
// minimo
productosRouter.get("/minimo", roleChecker(['Propietario', 'Administrador']), async (req, res) => {
    try {
        // Obtenemos el ID del negocio del usuario autenticado
        const negocioId = req.user.negocio[0];
        
        // Buscamos productos con stock bajo (entre 1 y 3)
        const productos = await ProductosModel.find({ 
            negocio: negocioId,
            "stock.actual": { 
                $gt: 0, 
                $lt: 4 
            } ,
            status: true,
        });

        // YA NO mapeamos para convertir a Base64. 
        // El campo 'imagen' ya contiene la URL de R2 lista para usar.
        res.json(productos);

    } catch (error) {
        console.error("❌ Error al obtener los productos:", error);
        res.status(500).json({ error: 'Ocurrió un error al obtener los productos' });
    }
});
// controllers/productos.js (Ruta GET /api/productos)
productosRouter.get("/Papelera/cantidad", roleChecker(['Propietario', 'Administrador']),checkPlan("Productos"), async (req, res) => {
    try {
        const negocioId = req.user.negocio[0];

        // Usamos countDocuments para que la base de datos solo cuente y no devuelva datos
        const cantidadPapelera = await ProductosModel.countDocuments({ 
            negocio: negocioId, 
            status: false 
        });

        res.json({ total: cantidadPapelera });
    } catch (error) {
        console.error("Error al contar productos en papelera:", error);
        res.status(500).json({ error: 'Error al obtener la cantidad' });
    }
});
productosRouter.get("/Papelera",  roleChecker(['Propietario', 'Administrador']),checkPlan("Productos"), async (req, res) => {
    try {
   // **AHORA (la solución):**
const negocioId = req.user.negocio[0];
console.log(negocioId)
// C:\Users\Dimarkos\Desktop\Margocitas\controllers\productos.js:49
// Asumiendo que negocioId ya está definido como req.user.negocio[0]
const productos = await ProductosModel.find({ negocio: negocioId , status: false
 }); 

// ^^^^ NO asteriscos ^^^^
        // Transformar cada producto para incluir la imagen en formato Base64
const productosConImagen = productos.map(producto => {
    
    // 💡 SOLUCIÓN: Verifica que el objeto 'imagen' exista antes de acceder a sus propiedades anidadas.
    const imagenBase64 = 
        (producto.imagen && producto.imagen.data) // Verifica producto.imagen Y producto.imagen.data
            ? `data:${producto.imagen.contentType};base64,${producto.imagen.data.toString('base64')}` 
            : null; // Si es undefined o null, asigna null
    
    return {
        ...producto.toObject(), // Convierte el documento Mongoose a un objeto plano
        imagen: imagenBase64    // Asigna la cadena Base64 o null
    };
});

        res.json(productos)
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        res.status(500).json({ error: 'Ocurrió un error al obtener los productos' });
    }
});



productosRouter.patch('/restaurar/:id', roleChecker(['Propietario', 'Administrador']),checkPlan("Productos"), async (req, res) => {
  try {
    const Pid = req.params.id;

    if (!req.user || !req.user.negocio || req.user.negocio.length === 0) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    const negocioId = req.user.negocio[0];

    // 1. BUSCAR Y ACTUALIZAR el campo que lo saca de la papelera
    // Aquí asumo que 'checked: true' significa que está en papelera. 
    // Lo cambiamos a 'false' para restaurarlo.
    const productoActualizado = await ProductosModel.findOneAndUpdate(
      { _id: Pid, negocio: negocioId }, 
      { $set: { status: true} ,
      $unset: { deletedAt: "" }
    
    }, // <--- CAMBIO CLAVE: Cambia el estado
      
      { new: true } // Para que devuelva el objeto ya modificado
    );

    if (!productoActualizado) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // --- LÓGICA DE IMAGEN (Tu código original optimizado) ---
    const prodObj = productoActualizado.toObject();
    let imagenFinal = null;

    if (typeof prodObj.imagen === 'string') {
      if (prodObj.imagen.startsWith('http')) {
        imagenFinal = prodObj.imagen;
      } else {
        try {
          const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: prodObj.imagen,
          });
          imagenFinal = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        } catch (s3Error) {
          console.error("❌ Error al firmar URL:", s3Error);
          imagenFinal = null;
        }
      }
    } else if (prodObj.imagen?.data) {
      imagenFinal = `data:${prodObj.imagen.contentType};base64,${prodObj.imagen.data.toString('base64')}`;
    }

    const respuesta = { ...prodObj, imagen: imagenFinal };

    console.log(`✅ Producto restaurado con éxito: ${respuesta.nombre}`);
    res.json(respuesta); // Enviamos el producto restaurado al frontend

  } catch (error) {
    console.error('❌ Error al restaurar producto:', error);
    res.status(500).json({ error: 'Error interno al restaurar' });
  }
});
productosRouter.delete("/Papelera", roleChecker(['Propietario', 'Administrador']), checkPlan("Productos"),async (req, res) => {
    try {
        const negocioId = req.user.negocio[0];

        // 1. Buscamos TODOS los productos que están en la papelera (status: false)

        const productosABorrar = await ProductosModel.find({ negocio: negocioId, status: false});

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
        const resultado = await ProductosModel.deleteMany({ negocio: negocioId, status: false });

        res.json({
            message: "Papelera vaciada con éxito",
            cantidadEliminada: resultado.deletedCount
        });

    } catch (error) {
        console.error("❌ Error al vaciar la papelera:", error);
        res.status(500).json({ error: 'Ocurrió un error al vaciar la papelera' });
    }
});
productosRouter.get("/todos",  roleChecker(['Propietario', 'Administrador',"Gerente", "Vendedor"]), checkPlan("Productos") ,async (req, res) => {
    try {
   // **AHORA (la solución):**
const negocioId = req.user.negocio[0];

// C:\Users\Dimarkos\Desktop\Margocitas\controllers\productos.js:49
// Asumiendo que negocioId ya está definido como req.user.negocio[0]
const valor = await NegocioModel.findOne({ _id: negocioId 
 }); 
const productos = await ProductosModel.find({ negocio: negocioId , status: true
 }); 

// ^^^^ NO asteriscos ^^^^
        // Transformar cada producto para incluir la imagen en formato Base64
const productosConImagen = productos.map(producto => {
    
    // 💡 SOLUCIÓN: Verifica que el objeto 'imagen' exista antes de acceder a sus propiedades anidadas.
    const imagenBase64 = 
        (producto.imagen && producto.imagen.data) // Verifica producto.imagen Y producto.imagen.data
            ? `data:${producto.imagen.contentType};base64,${producto.imagen.data.toString('base64')}` 
            : null; // Si es undefined o null, asigna null
    
    return {
        ...producto.toObject(), // Convierte el documento Mongoose a un objeto plano
        imagen: imagenBase64    // Asigna la cadena Base64 o null
    };
});
      res.status(200).json({productos, categoria: valor.tipoNegocio });
     
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        res.status(500).json({ error: 'Ocurrió un error al obtener los productos' });
    }
});
// Ruta para manejar las solicitudes GET a /api/productos
async function obtenerUrlImagen(imagen) {
    if (!imagen) return null;

    // Caso A: Si ya es una URL completa (http...)
    if (typeof imagen === 'string' && imagen.startsWith('http')) {
        return imagen;
    }

    // Caso B: Es la ruta (Key) guardada en R2 -> Generamos la firma
    if (typeof imagen === 'string') {
        try {
            const command = new GetObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: imagen,
            });
            return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        } catch (s3Error) {
            console.error("❌ Error al firmar URL de R2:", s3Error);
            return null;
        }
    }

    // Caso C: Formato binario antiguo (Buffer / Base64)
    if (typeof imagen === 'object' && imagen.data) {
        return `data:${imagen.contentType};base64,${Buffer.from(imagen.data).toString('base64')}`;
    }

    return null;
}

/**
 * Función universal: detecta automáticamente si es un producto o un array de productos
 */
async function formatearConImagen(data) {
    if (!data) return data;

    const procesarItem = async (item) => {
        const obj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        obj.imagen = await obtenerUrlImagen(obj.imagen);
        return obj;
    };

    if (Array.isArray(data)) {
        return await Promise.all(data.map(item => procesarItem(item)));
    } else {
        return await procesarItem(data);
    }
}
productosRouter.get("/", async (req, res) => {
    try {
        const negocioId = req.user.negocio[0];
        
        // 1. Verificación de seguridad
        if (!req.user || !req.user.negocio || req.user.negocio.length === 0) {
            return res.status(401).json({ error: "Sesión inválida o sin negocio asignado." });
        }

        const Usuario = await User.findOne({ 
            _id: req.user._id 
        });
    
        const productos = await ProductosModel.find({ 
            negocio: negocioId, 
            status: true, 
            "stock.actual": { $gt: 0 } 
        });

        // 2. Transformamos todos los productos en paralelo usando la función reutilizable

        res.json(productos);

    } catch (error) {
        console.error("❌ Error al obtener los productos:", error);
        res.status(500).json({ error: 'Ocurrió un error al obtener los productos' });
    }
});
productosRouter.get("/Imagen", async (req, res) => {
    try {
        const negocioId = req.user.negocio[0];
        
        // 1. Verificación de seguridad
        if (!req.user || !req.user.negocio || req.user.negocio.length === 0) {
            return res.status(401).json({ error: "Sesión inválida o sin negocio asignado." });
        }

        const Usuario = await User.findOne({ 
            _id: req.user._id 
        });
    
        const productos = await ProductosModel.find({ 
            negocio: negocioId, 
            status: true, 
            "stock.actual": { $gt: 0 } 
        });

        // 2. Transformamos todos los productos en paralelo usando la función reutilizable
        const productosProcesados = await Promise.all(
            productos.map(async (producto) => {
                const prodObj = producto.toObject();
                
                // 🚀 Aquí aplicamos la función que procesa la imagen (R2 firmada, URL o Base64)
                prodObj.imagen = await obtenerUrlImagen(prodObj.imagen);

                return prodObj;
            })
        );

        res.json(
       
           productosProcesados
        );


    } catch (error) {
        console.error("❌ Error al obtener los productos:", error);
        res.status(500).json({ error: 'Ocurrió un error al obtener los productos' });
    }
});
productosRouter.get('/Imagen/:id', upload.single("imagen"), async (req, res) => {
  try {
    const termino= req.params.id;
 const negocioId = req.user.negocio[0];
    if (!req.user || !negocioId || req.user.negocio.length === 0 || !termino) {
      return res.status(401).json({ error: "Usuario no autenticado o sin negocio asignado." });
    }

   

// 1. Usamos .find() y $regex para buscar productos cuyo nombre contenga el texto (insensible a mayúsculas/minúsculas)
// 1. Buscamos productos que coincidan con el texto ingresado
    let producto = await ProductosModel.find({
      negocio: negocioId,
      status: true,
      
$or: [
    { nombre: { $regex: termino, $options: "i" } } ,
    { codigo: { $regex: termino, $options: "i" } },
    { codigoBarras: { $regex: termino, $options: "i" } },// Busca 'termino' en cualquier parte, ignorando mayúsculas ('i')
  ],
       "stock.actual": { $gt: 0 } ,
    }).limit(60);

    // 2. Si no hay coincidencias, usamos el respaldo (hasta 50 productos)


 const productosProcesados = await Promise.all(
            producto.map(async (producto) => {
                const prodObj = producto.toObject();
                
                // 🚀 Aquí aplicamos la función que procesa la imagen (R2 firmada, URL o Base64)
                prodObj.imagen = await obtenerUrlImagen(prodObj.imagen);

                return prodObj;
            })
        );

    console.log(`✅ Producto recuperado con URL segura: ${productosProcesados.nombre}`);
    res.json(productosProcesados);

  } catch (error) {
    console.error('❌ Error al buscar el producto:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});
//Buscar solo 1 elemento por ID ++++++++++++++++++++++++++++++
// 2. Obtener una montura específica por ID

productosRouter.get('/:id', async (req, res) => {
  try {
    const Pid = req.params.id;

    if (!req.user || !req.user.negocio || req.user.negocio.length === 0) {
      return res.status(401).json({ error: "Usuario no autenticado o sin negocio asignado." });
    }

    const negocioId = req.user.negocio[0];

    const producto = await ProductosModel.findOne({
      _id: Pid,
      negocio: negocioId,
      status: true,
    });

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    const prodObj = producto.toObject();
    let imagenFinal = null;

    // --- LÓGICA DE IMAGEN CON URL FIRMADA (SEGURA) ---
    if (typeof prodObj.imagen === 'string') {
      
      if (prodObj.imagen.startsWith('http')) {
        // Caso A: Si es una URL completa externa o antigua, la dejamos igual
        imagenFinal = prodObj.imagen;
      } else {
        // Caso B: Es solo la ruta (Key) guardada en R2. GENERAMOS LA FIRMA.
        try {
          const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: prodObj.imagen, // Ejemplo: "6929a9.../productos/123.jpg"
          });

          // Esta URL solo funcionará por 3600 segundos (1 hora)
          // El frontend la recibirá con el token de seguridad pegado al final
          imagenFinal = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        } catch (s3Error) {
          console.error("❌ Error al firmar URL de R2:", s3Error);
          imagenFinal = null; // O una imagen por defecto
        }
      }

    } else if (prodObj.imagen && prodObj.imagen.data) {
      // Caso C: Formato binario antiguo (Base64)
      imagenFinal = `data:${prodObj.imagen.contentType};base64,${prodObj.imagen.data.toString('base64')}`;
    }

    const productoConImagen = {
      ...prodObj,
      imagen: imagenFinal
    };

    console.log(`✅ Producto recuperado con URL segura: ${productoConImagen.nombre}`);
    res.json(productoConImagen);

  } catch (error) {
    console.error('❌ Error al buscar el producto:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});
// Ruta para manejar las solicitudes DELETE a /api/productos/:id

// Ruta para manejar las solicitudes DELETE a /api/productos/:id
// Ruta para manejar las solicitudes DELETE a /api/productoss/:id
// Ruta para manejar las solicitudes DELETE a /api/productos/:id
// Ruta para manejar las solicitudes DELETE a /api/productos/:id
productosRouter.delete("/:id", roleChecker(['Propietario', 'Administrador']), checkPlan("Productos"),

    async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }

            const facturacionId = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(facturacionId)) {
                return res.status(400).json({ error: "ID de producto inválido" });
            }

            // 1. En lugar de borrar, actualizamos el campo 'checked' a false
            // Esto lo mueve al "historial" o lo oculta de la vista activa
             const ahora = new Date();
const diezDiasEnMs = 10 * 24 * 60 * 60 * 1000;
const fechaExpiracion = new Date(ahora.getTime() + diezDiasEnMs);

            const productoActualizado = await ProductosModel.findByIdAndUpdate(
                facturacionId, 
                {  status: "false",            // Usar booleano false, no "false" entre comillas
        deletedAt: ahora,         // Grabamos HOY para que el índice cuente desde aquí
        expiresAt: fechaExpiracion,  }// Opcional: para mostrar al usuario cuándo vence }
           
            );

            if (!productoActualizado) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }
            
            // Guardamos el producto en locals por si tienes un middleware de auditoría después
            res.locals.deletedEntity = productoActualizado;

            // Enviamos un 200 (OK) o 204. Recomiendo 200 si quieres confirmar el cambio.
            res.status(200).json({ message: "Producto movido al historial (desactivado)" });

        } catch (error) {
            console.error("Error al desactivar el producto:", error);
            res.status(500).json({ error: "Ocurrió un error en el servidor" });
            next(error); 
        }
    }
);
productosRouter.patch("/:id", roleChecker(['Propietario', 'Administrador']),checkPlan("Productos"), async (req, res) => {
    try {
        const { nombreActualizado, cantidadActualizado, costoActualizado, precioActualizado , cristalActualizado, tratamientoActualizado, esferaActualizado, cilindroActualizado, adicionActualizado } = req.body;
        const productoId = req.params.id;

        // 1. Verificación de usuario
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
      

        // 2. Construir objeto dinámico con solo las propiedades enviadas
  const datosAActualizar = {};
if (nombreActualizado === "") {
              return res.status(404).json({ error: 'Nombre no puede ser vacio' });
}
if (nombreActualizado !== undefined) datosAActualizar.nombre = nombreActualizado;
if (cantidadActualizado !== undefined)  datosAActualizar["stock.actual"]  = cantidadActualizado;

// Usando notación de puntos (recomendado para MongoDB/Mongoose)
if (costoActualizado !== undefined) datosAActualizar["finanzas.costo"] = costoActualizado;
if (precioActualizado !== undefined) datosAActualizar["finanzas.precio"] = precioActualizado;
if (cristalActualizado !== undefined) datosAActualizar["especificaciones.tipo"] = cristalActualizado;
if (tratamientoActualizado !== undefined) datosAActualizar["especificaciones.tratamiento"] = tratamientoActualizado;
if (esferaActualizado !== undefined) datosAActualizar["especificaciones.esfera"] = esferaActualizado;
if (cilindroActualizado !== undefined) datosAActualizar["especificaciones.cilindro"] = cilindroActualizado;
if (adicionActualizado !== undefined) datosAActualizar["especificaciones.adicion"] = adicionActualizado;

        // 3. Actualización directa usando solo los campos presentes
        if (Number(costoActualizado) === 0 ){
          return res.status(404).json({ error: 'Costo no puede ser vacio' });
        }
          if (Number(precioActualizado) === 0 ){
          return res.status(404).json({ error: 'Precio no puede ser vacio' });
        }
              if (Number(costoActualizado)  >= Number(precioActualizado)   ){
          return res.status(404).json({ error: 'Precio no puede ser mas alto que costo  o igual!' });
        }
  
        const productoEditado = await ProductosModel.findByIdAndUpdate(
            productoId,
            { $set: datosAActualizar },
            { new: true, runValidators: true }
        );

            // 4. Verificar si el producto existía
        if (!productoEditado) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // 5. Respuesta al cliente
           // --- LÓGICA DE IMAGEN ---
// 1. Extraemos el archivo de forma segura
const CambiarImagen = req.file ? req.file.buffer : null;

// 2. Si el usuario SÍ envió una nueva imagen para actualizar:
if (CambiarImagen) {
    // Verificamos si el producto ya tenía una imagen anterior registrada en la BD
    if (productoEditado && productoEditado.imagen) {
        try {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: productoEditado.imagen
            }));
            console.log(`🗑️ Imagen anterior eliminada de R2: ${productoEditado.imagen}`);
        } catch (error) {
            console.error("⚠️ No se pudo eliminar la imagen anterior de R2:", error.message);
        }
    }

    // Procesamos la nueva imagen
    const bufferOptimizado = await sharp(CambiarImagen)
        .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 }) 
        .toBuffer();

    const fileName = `${idNegocio}/productos/${Date.now()}-${codigo}.webp`;

    await s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: bufferOptimizado,
        ContentType: 'image/webp',
    }));

    // Asignamos la nueva ruta al objeto que se va a guardar en MongoDB
    datosParaGuardar.imagen = fileName; 
    console.log(`📸 Nueva imagen guardada: ${fileName}`);
} 
// Si NO hay 'CambiarImagen', este bloque se ignora y el producto conserva su estado de imagen anterior (o se queda sin ella si es nuevo).
        return res.status(200).json({
            mensaje: "Producto actualizado correctamente",
            producto: productoEditado
        });

    } catch (error) {
        console.error("Error en PATCH productos:", error);
        return res.status(500).json({ 
            error: 'Error interno del servidor', 
            detalle: error.message 
        });
    }
});

productosRouter.patch("/:id/imagen", upload.single('imagen'), roleChecker(['Propietario', 'Administrador']), checkPlan("Productos"), async (req, res) => {
    try {
        const productoId = req.params.id;

        // 1. Verificación de usuario
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        if (!productoId) {
            return res.status(400).json({ error: 'ID de producto no proporcionado' });
        }

        // 2. Buscamos el producto en la base de datos
        const productoEditado = await ProductosModel.findById(productoId);

        // 3. Verificar si el producto existe
        if (!productoEditado) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
let EliminarDespuesdeGuardarLaNuevaImagen  = productoEditado.imagen
        // 4. Extraemos el archivo de forma segura
        const CambiarImagen = req.file ? req.file.buffer : null;

        if (CambiarImagen) {
         

            // Procesamos la nueva imagen con Sharp
            const bufferOptimizado = await sharp(CambiarImagen)
                .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 }) 
                .toBuffer();

            // Obtenemos idNegocio y codigo de forma segura
            const idNegocio = req.user.negocio || productoEditado.negocio;
            const codigoProducto = productoEditado.codigo || 'sin-codigo';

            const fileName = `${idNegocio}/productos/${Date.now()}-${codigoProducto}.webp`;

            // Subimos la nueva imagen a Cloudflare R2
            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: bufferOptimizado,
                ContentType: 'image/webp',
            }));

            // Asignamos la nueva ruta al documento
            productoEditado.imagen = fileName; 

            // 🔑 ¡ESTO FALTABA! Guardamos los cambios de forma definitiva en MongoDB
            await productoEditado.save();

            console.log(`📸 Nueva imagen guardada y registrada: ${fileName}`);
               // Si el producto ya tenía una imagen anterior en R2, la borramos
            if (EliminarDespuesdeGuardarLaNuevaImagen) {
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: EliminarDespuesdeGuardarLaNuevaImagen
                    }));
                    console.log(`🗑️ Imagen anterior eliminada de R2: ${EliminarDespuesdeGuardarLaNuevaImagen}`);
                } catch (error) {
                    console.error("⚠️ No se pudo eliminar la imagen anterior de R2:", error.message);
                }
            }
        } else {
            return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
        }

        return res.status(200).json({
            mensaje: "Imagen de producto actualizada correctamente",
            producto: productoEditado
        });

    } catch (error) {
        console.error("Error en PATCH productos/imagen:", error);
        return res.status(500).json({ 
            error: 'Error interno del servidor', 
            detalle: error.message 
        });
    }
});

productosRouter.patch("/stock/:id",   roleChecker(['Propietario', 'Administrador']),checkPlan("Productos"), async (req, res) => {
    try {
        const { cantidad} = req.body;
        const productoId = req.params.id;
console.log(cantidad)
        // 1. Verificación de usuario
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
          if (!cantidad) {
            return res.status(404).json({ error: 'Usuario no autenticado' });
        }

        // 2. Actualización Directa
        // { new: true } devuelve el producto ya actualizado
        // { runValidators: true } asegura que los nuevos datos sigan las reglas del modelo
 const cantidadNumerica = Number(cantidad); 

const productoEditado = await ProductosModel.findByIdAndUpdate(
    productoId,
    [
        { 
            $set: { 
                "stock.actual": { 
                    $max: [
                        0, 
                        { $add: [
                            { $toInt: "$stock.actual" }, // Convierte el String de la base a Integer
                            cantidadNumerica 
                        ]} 
                    ] 
                },
                "stock.minimo": 2 
            }
        }
    ],
    { new: true }
);

        // 3. Verificar si el producto existía
        if (!productoEditado) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // ✨ 4. RESPUESTA AL CLIENTE (Esto saca la petición del limbo)
        console.log('Producto actualizado:', productoEditado.nombre);
        return res.status(200).json({
            mensaje: "Producto actualizado correctamente",
            producto: productoEditado
        });

    } catch (error) {
        console.error("Error en PATCH productos:", error);
        return res.status(500).json({ 
            error: 'Error interno del servidor', 
            detalle: error.message 
        });
    }
});

module.exports = productosRouter;
