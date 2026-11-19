const HistorialRouter = require('express').Router();
const mongoose = require('mongoose');


// 🛑 Importar el roleChecker
// ASEGÚRATE DE QUE LA RUTA SEA CORRECTA. La ruta '../middlewares/roleChecker' ASUME
// que HistorialRouter.js está en una subcarpeta (ej: 'controllers') y que 
// 'middlewares' está en la carpeta raíz (un nivel arriba).
const roleChecker = require('../middleware/roleChecker'); 

// Modelos
const User = require('../models/user'); 


const ProductosModel = require('../models/productos.js'); 

const HistorialModel = require('../models/AuditLog.js'); 

const Facturacion = require('../models/facturacion1'); 

// =================================================================
// POST / (Crear Factura) - Permiso para todos (Vendedor, Admin, Propietario)
// =================================================================
HistorialRouter.post("/", 
    roleChecker(['Propietario', 'Administrador', 'Vendedor']), 
    async (req, res) => {
        try {
            const {
                cliente,
                productos, 
                Pprecio,
                cedula,
                metodo,
                moneda,
                precio,
                conversion,
                tasa,
                tipodeabono,
                Cuotas, 
                factura,
                fecha
            } = req.body;

            // 1. Validaciones Obligatorias
            if (!cliente) return res.status(400).json({ error: "El campo 'cliente' es obligatorio." });
            if (!productos || productos.length === 0) return res.status(400).json({ error: "El campo 'productos' no puede estar vacío." });
            if (!factura) return res.status(400).json({ error: "El campo 'factura' es obligatorio." });
            if (!cedula) return res.status(400).json({ error: "El campo 'cedula' es obligatorio." });
            if (!metodo) return res.status(400).json({ error: "El campo 'metodo' es obligatorio." });
            if (!moneda) return res.status(400).json({ error: "El campo 'moneda' es obligatorio." });
            if (!precio) return res.status(400).json({ error: "El campo 'precio' es obligatorio." });
            if (!fecha) return res.status(400).json({ error: "El campo 'fecha' es obligatorio." });
            
            // 2. Validación CONDICIONAL (solo si es Cuotas)
            if (tipodeabono === "Cuotas") {
                if (!Cuotas) {
                    return res.status(400).json({ error: "Para el abono en 'Cuotas', se requieren los detalles de las cuotas." });
                }
            }

            const guardarProductos = Array.isArray(productos) ? productos : [productos];

            // 3. Creación del Documento
            let nuevaFactura;
            
            const baseFactura = {
                cliente,
                productos: guardarProductos,
                Pprecio,
                cedula,
                metodo,
                moneda,
                precio,
                conversion,
                tasa,
                factura,
                fecha,
                tipodeabono,
                checked: false,
            negocio: req.user ? req.user.negocio : null, // Si hay usuario autenticado
            };
            
            // Añadimos las cuotas solo si el tipo de abono es "Cuotas"
            if (tipodeabono === "Cuotas") {
                // Asumiendo que 'Cuotas' es el objeto o array que Mongoose espera
                baseFactura.cuotas = Cuotas; 
            }

            nuevaFactura = new Facturacion(baseFactura);

            // 4. Guardar y Responder
            const facturaGuardada = await nuevaFactura.save();
            return res.status(201).json(facturaGuardada); 

        } catch (error) {
            console.error("Error al guardar la facturación:", error.message);
            return res.status(500).json({ error: "Error al guardar la factura.", detalle: error.message });
        }
    }
);


// =================================================================
// GET / (Obtener todas las facturas) - Permiso para todos (Vendedor, Admin, Propietario)
// =================================================================
HistorialRouter.get("/", 
    roleChecker(['Propietario', 'Administrador', 'Vendedor','Gerente']), 
    async (req, res) => {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({ error: "Usuario no autenticado." });
            }
const negocioId = req.user.negocio[0];

            const facturacion = await HistorialModel.find({  negocio: negocioId } )
            .sort({ _id: -1 }) // Orden cronológico automático
                        .limit(40)
                        .lean();

console.log(1 , facturacion)
            return res.json({facturacion,negocioId}

            );
        } catch (error) {
            console.error("Error en GET /api/facturacion:", error.message);
            return res.status(500).json({ error: "Ocurrió un error al obtener las facturas." });
        }
    }
);


// =================================================================
// PATCH /:id (Actualizar Factura) - Permiso para Admin y Propietario
// Nota: Esta ruta estaba duplicada en tu código original. He dejado la segunda versión con mejor estructura.
// =================================================================



// =================================================================
// DELETE /:id (Eliminar Factura) - Permiso solo para Propietario
// =================================================================
HistorialRouter.delete("/:id", 
    roleChecker(['Propietario']), 
    async (request, response) => {
        try {
            const user = request.user;
            if (!user) {
                return response.status(401).json({ error: "Usuario no autenticado" });
            }
   // 1. Validación de negocio
      const negocioId = req.user?.negocio?.[0];
      if (!negocioId) return res.status(401).json({ error: "Usuario sin negocio asociado." });

            const facturacionId = request.params.id;
            if (!mongoose.Types.ObjectId.isValid(facturacionId)) {
                return response.status(400).json({ error: "ID de factura inválido" });
            }

            const factura = await HistorialModel.findById(facturacionId);

            if (!factura) {
                return response.status(404).json({ error: "Factura no encontrada" });
            }
            
            // 1. Verificar que el usuario sea el creador O Propietario (roleChecker ya valida Propietario)
          

            // 2. Eliminar
            await HistorialModel.findByIdAndDelete(facturacionId);
            console.log("Factura eliminada correctamente");
            return response.status(204).end();
        } catch (error) {
            console.error("Error al eliminar la factura:", error);
            return response.status(500).json({ error: "Ocurrió un error en el servidor" });
        }
    }
);

HistorialRouter.get("/:id", 
    roleChecker(['Propietario', 'Administrador', 'Vendedor','Gerente']), 
    async (request, response) => {
        try {

               const user = request.user;
            if (!user) {
                return response.status(401).json({ error: "Usuario no autenticado" });
            }
   // 1. Validación de negocio
      const negocioId = request.user?.negocio?.[0];
      if (!negocioId) return res.status(401).json({ error: "Usuario sin negocio asociado." });

            const id = request.params.id;

            // 1. Buscamos todos los registros del historial
            const historiales = await HistorialModel.find({ negocio:negocioId, _id: id }).lean()

            .sort({ _id: -1 }) // Orden cronológico automático
                            .limit(40);;
                                       

            if (!historiales || historiales.length === 0) {
                return response.status(404).json({ mensaje: "No se encontraron registros en el historial" });
            }

            // 2. Procesamos cada registro para inyectar los detalles
            const resultadosCompletos = await Promise.all(historiales.map(async (registro) => {
                const urlCompleta = registro.details?.url;
                
                if (!urlCompleta) return registro;

                // --- LIMPIEZA DEL ID ---
                // Extraemos el ID final de la URL (ej: de "/api/facturacion/6963..." a "6963...")
                const idLimpio = urlCompleta.split('/').pop();

                // Verificamos que sea un ID válido para evitar el CastError
                if (!mongoose.Types.ObjectId.isValid(idLimpio)) {
                    return { ...registro, error: "ID de referencia inválido" };
                }

                // --- BÚSQUEDA DIRECTA (Mejor que usar axios aquí) ---
                // Intentamos buscarlo como producto o factura
                const [producto, factura] = await Promise.all([
                    ProductosModel.findById(idLimpio).lean(),
                    Facturacion.findById(idLimpio).lean()
                ]);

                return {
                    ...registro,
                    detalleProducto: producto || null,
                    detalleFactura: factura || null
                };
            }));

            return response.status(200).json(resultadosCompletos);

        } catch (error) {
            console.error("Error al filtrar el historial:", error);
            return response.status(500).json({ error: "Ocurrió un error en el servidor" });
        }
    }
);
HistorialRouter.get("/Filtrar/:id", 
    roleChecker(['Propietario', 'Administrador', 'Vendedor','Gerente']), 
    async (request, response) => {
        try {

               const user = request.user;
            if (!user) {
                return response.status(401).json({ error: "Usuario no autenticado" });
            }
   // 1. Validación de negocio
      const negocioId = request.user?.negocio?.[0];
      if (!negocioId) return res.status(401).json({ error: "Usuario sin negocio asociado." });

            const id = request.params.id;

            // 1. Buscamos todos los registros del historial
            const historiales = await HistorialModel.find({ negocio:negocioId,entityType: id }).lean()

            .sort({ _id: -1 }) // Orden cronológico automático
                            .limit(40);;
                                       

            if (!historiales || historiales.length === 0) {
                return response.status(404).json({ mensaje: "No se encontraron registros en el historial" });
            }

            // 2. Procesamos cada registro para inyectar los detalles
            const resultadosCompletos = await Promise.all(historiales.map(async (registro) => {
                const urlCompleta = registro.details?.url;
                
                if (!urlCompleta) return registro;

                // --- LIMPIEZA DEL ID ---
                // Extraemos el ID final de la URL (ej: de "/api/facturacion/6963..." a "6963...")
                const idLimpio = urlCompleta.split('/').pop();

                // Verificamos que sea un ID válido para evitar el CastError
                if (!mongoose.Types.ObjectId.isValid(idLimpio)) {
                    return { ...registro, error: "ID de referencia inválido" };
                }

                // --- BÚSQUEDA DIRECTA (Mejor que usar axios aquí) ---
                // Intentamos buscarlo como producto o factura
                const [producto, factura] = await Promise.all([
                    ProductosModel.findById(idLimpio).lean(),
                    Facturacion.findById(idLimpio).lean()
                ]);

                return {
                    ...registro,
                    detalleProducto: producto || null,
                    detalleFactura: factura || null
                };
            }));

            return response.status(200).json(resultadosCompletos);

        } catch (error) {
            console.error("Error al filtrar el historial:", error);
            return response.status(500).json({ error: "Ocurrió un error en el servidor" });
        }
    }
);



module.exports = HistorialRouter;