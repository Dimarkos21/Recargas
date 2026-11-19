const StatsRouter = require('express').Router();
const mongoose = require('mongoose');
const roleChecker = require('../middleware/roleChecker'); 
// Asegúrate de que la ruta sea la correcta hacia tu carpeta de modelos
const Estadisticas = require('../models/estadisticas');
// Importar Modelos
const EstadisticaMensual = require('../models/estadisticas');
const Producto = require('../models/productos'); // Para obtener costos al actualizar

// =================================================================
// GET / (Obtener estadísticas del mes actual)
// Acceso: Propietario, Administrador
// =================================================================
StatsRouter.get("/", 
    roleChecker(['Propietario', 'Administrador','Gerente']), 
    async (req, res) => {
        try {
            const negocioId = req.user.negocio[0];
            
            // Obtenemos el mes actual en formato YYYY-MM
            const fechaActual = new Date();
            const mesAnio = `${fechaActual.getFullYear()}-${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}`;

            const estadisticas = await EstadisticaMensual.findOne({ 
                negocioId: negocioId, 
                mesAnio: mesAnio 
            });

            if (!estadisticas) {
                return res.status(404).json({ mensaje: "Aún no hay estadísticas generadas para este mes." });
            }

            return res.json(estadisticas);
        } catch (error) {
            console.error("Error en GET /api/stats:", error.message);
            return res.status(500).json({ error: "Error al obtener estadísticas." });
        }
    }
);

// =================================================================
// POST /update-manual (Llamada interna o forzada para actualizar)
// Esta lógica es la que debes invocar cuando creas una factura
//===========================================
StatsRouter.post("/update", 
    roleChecker(['Propietario', 'Administrador', 'Vendedor','Gerente']), 
    async (req, res) => {
        try {

            // Desestructuramos los datos que vienen de la factura
            const { productos, total, cedula, negocio } = req.body;
   const negocioId = req.user?.negocio?.[0];
      if (!negocioId) {
        return res.status(401).json({ error: "Usuario sin negocio asociado." });
      }

            // 1. Validar que vengan los datos necesarios
            if (!negocio || !productos) {
                return res.status(400).json({ error: "Faltan datos (negocio o productos)" });
            }

            const fecha = new Date();
            const mesAnio = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;

            let costeTotalVenta = 0;

            // 2. CORRECCIÓN SINTAXIS: Cálculo del coste (Bucle corregido)
            // Usamos un bucle for...of para poder usar await dentro
            for (const p of productos) {
                const idBuscado = p.productoId || p._id;
                const prodDB = await Producto.findById(idBuscado);
                
                if (prodDB) {
                    // Si no tiene costo definido, asumimos 0 para no romper el cálculo
                    const costoUnitario = prodDB.costo || 0;
                    const cantidad = p.cantidad || 1;
                    costeTotalVenta += (costoUnitario * cantidad);
                }
            }

            const gananciaNeta = parseFloat(total) - costeTotalVenta;

            // 3. Operación Atómica (Corregida para evitar errores de inicialización)
            const statsActualizadas = await EstadisticaMensual.findOneAndUpdate(
                { 
                    mesAnio, 
                    negocioId: negocio 
                },
                { 
                    $inc: {
                        "finanzas.totalVendido": parseFloat(total),
                        "finanzas.costeTotal": costeTotalVenta,
                        "finanzas.gananciaNeta": gananciaNeta,
                        "finanzas.conteoFacturas": 1
                    },
                    $addToSet: { "clientes.listaCedulas": cedula },
                    $set: { 
                        ultimaActualizacion: new Date() 
                    }
                },
                { 
                    upsert: true, // Si no existe el mes, lo crea
                    new: true     // Devuelve el documento actualizado
                }
            );

            return res.status(200).json({ 
                mensaje: "Estadísticas sincronizadas correctamente", 
                statsActualizadas 
            });

        } catch (error) {
            console.error("Error al actualizar stats:", error);
            return res.status(500).json({ 
                error: "Error interno al procesar estadísticas.",
                detalle: error.message 
            });
        }
    }
);

// =================================================================
// GET /comparativa (Obtener últimos 6 meses para gráficas)
// =================================================================
StatsRouter.get("/comparativa", 
    roleChecker(['Propietario', 'Administrador','Gerente']), 
    async (req, res) => {
        try {
            const negocioId = req.user.negocio[0];
            
            // Buscamos los registros del negocio
            // Ordenamos por año descendente y luego mes descendente
            const historial = await Estadisticas.find({ negocio: negocioId })
                .sort({ anio: -1, mes: -1 }) 
                .limit(6);

            // Invertimos el array para que al frontend le llegue del más antiguo al más reciente
            // Esto es mucho mejor para pintar gráficas de izquierda a derecha.
            return res.json(historial.reverse());
            
        } catch (error) {
            console.error("Error en comparativa:", error);
            return res.status(500).json({ error: "Error al obtener historial comparativo." });
        }
    }
);


StatsRouter.get("/mensual", 
    roleChecker(['Propietario', 'Administrador','Gerente']), 
    async (req, res) => {
        try {
            const negocioId = req.user.negocio[0];
            
            // 1. Obtener mes y año de los parámetros (query)
            // Si no vienen, usamos la fecha actual por defecto
            const fechaHoy = new Date();
            const mes = parseInt(req.query.mes) || (fechaHoy.getMonth() + 1);
            const anio = parseInt(req.query.anio) || fechaHoy.getFullYear();

            // 2. Buscar en la base de datos coincidiendo con los campos de tu middleware
            const stats = await Estadisticas.findOne({ 
                negocio: negocioId, 
                mes: mes, 
                anio: anio 
            });

            // 3. Si no hay datos aún para ese mes, devolvemos un objeto vacío estructurado
            if (!stats) {
                return res.json({
                    mensaje: "No hay datos registrados para este periodo",
                    resumenFinanciero: { ingresos: 0, egresos: 0, ganancia: 0 },
                    metricas: { productosVendidos: 0, nuevosClientes: 0 },
                    mes,
                    anio
                });
            }

            // 4. Devolver los resultados
            return res.json(stats);

        } catch (error) {
            console.error("❌ [ERROR GET STATS]:", error);
            return res.status(500).json({ error: "Error al obtener las estadísticas mensuales." });
        }
    }
);
module.exports = StatsRouter;