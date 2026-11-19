const Estadisticas = require("../models/estadisticas");
const Productos = require("../models/productos");
const Facturacion = require("../models/facturacion1");
const statsMiddleware = async (req, res, next) => {
    const originalJson = res.json;

    res.json = async function (body) {
        if (res.statusCode === 200 || res.statusCode === 201) {
            try {
                const negocioId = req.user?.negocio?.[0];
                if (negocioId) {
                    const fecha = new Date();
                    const mes = fecha.getMonth() + 1;
                    const anio = fecha.getFullYear();

                    let update = { 
                        $inc: {}, 
                        $set: { updatedAt: new Date() },
                        $push: {} 
                    };

                    const url = req.originalUrl;
                    const metodo = req.method;
                    
                    if (url.includes("Nota") && metodo === "POST") {
                        const datosFactura = body.factura; 
                        if (!datosFactura) return originalJson.call(this, body);

                        const precioVentaTotal = Number(datosFactura.precio) || 0;
                        
                        // Determinar cuánto se cobró hoy usando el campo ABONO de finanzas o el total
                        let abonoHoy = 0;
                        if (datosFactura.tipodeabono === "Completo") {
                            abonoHoy = precioVentaTotal;
                        } else {
                            console.log(datosFactura);
                            // Usamos el ABONO que calculó tu router en el objeto finanzas
                            abonoHoy = Number(datosFactura.finanzas.abonoInicial) || Number(datosFactura.inicial) || 0;
                        }

                        // Cálculo de costos
                        const idsProductos = (datosFactura.productos || []).map(p => p.productoId).filter(id => id);
                        const productosDB = await Productos.find({ _id: { $in: idsProductos } }).lean();
                        
                        let costoTotalMercancia = 0;
                        (datosFactura.productos || []).forEach((p) => {
                            const prodOriginal = productosDB.find(dbP => dbP._id.toString() === p.productoId?.toString());
                            const cantidadItem = Number(p.cantidad) || 1;
                            
                            if (prodOriginal) {
                                console.log("MOSTRAR LA ORIGINALIDAD DE T",prodOriginal)
                                costoTotalMercancia += (Number(prodOriginal.finanzas.costo) || 0) * cantidadItem;
                                const categoria = prodOriginal.categoria || 'SinCategoria';
                                const subtotalProducto = (Number(prodOriginal.finanzas.precio) || 0) * cantidadItem;

                                update.$inc[`rankingProductos.${prodOriginal._id}.cantidad`] = cantidadItem;
                                update.$inc[`rankingProductos.${prodOriginal._id}.ingresos`] = subtotalProducto;
                                update.$set[`rankingProductos.${prodOriginal._id}.nombre`] = prodOriginal.nombre;
                                update.$inc[`ventasPorCategoria.${categoria}.cantidad`] = cantidadItem;
                                update.$inc[`ventasPorCategoria.${categoria}.ingresos`] = subtotalProducto;
                            }
                        });

                        // Ranking Vendedores
                        const nombreVendedor = datosFactura.vendedor?.nombre || 'Sin Vendedor';
                        const llaveVendedor = nombreVendedor.replace(/\./g, '_').trim();

                        update.$inc[`rankingVendedores.${llaveVendedor}.cantidadVentas`] = 1;
                        update.$inc[`rankingVendedores.${llaveVendedor}.montoGenerado`] = precioVentaTotal;
                        update.$inc[`rankingVendedores.${llaveVendedor}.productosVendidos`] = (datosFactura.productos || []).length;
                        update.$set[`rankingVendedores.${llaveVendedor}.nombre`] = nombreVendedor;

                        // Métricas Financieras
                        update.$inc = {
                            ...update.$inc,
                            "resumenFinanciero.ingresos": abonoHoy,
                            "resumenFinanciero.egresos": costoTotalMercancia,
                            "resumenFinanciero.ganancia": precioVentaTotal - costoTotalMercancia,
                            "metricas.totalFacturado": precioVentaTotal, 
                            "metricas.totalCobrado": abonoHoy,
                            "metricas.cuotasPendientes": precioVentaTotal - abonoHoy,
                           //"metricas.productosVendidos": (datosFactura.productos || []).length
                        };
                        console.log('\x1b[32m%s\x1b[0m', '🚀 ESTADÍSTICAS ACTUALIZADAS' ,abonoHoy);
                        update.$set.ultimoMovimiento = `Venta ${datosFactura.tipodeabono}: ${datosFactura.cliente}`;
                        update.$push.historial = {
                            tipo: 'INGRESO',
                            monto: abonoHoy,
                            descripcion: `Venta inicial - Paciente: ${datosFactura.paciente || datosFactura.cliente}`,
                            fecha: new Date()
                        };
                    }

                    // Ejecutar actualización única (Evita duplicados)
                    if (Object.keys(update.$inc).length > 0) {
                        const statsActualizadas = await Estadisticas.findOneAndUpdate(
                            { negocio: negocioId, mes, anio },
                            update,
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );

                        const io = req.app.get('socketio');
                        if (io) io.to(negocioId.toString()).emit('actualizarDashboard', statsActualizadas);
                    }
                }
            } catch (err) {
                console.error("❌ Error StatsMiddleware:", err.message);
            }
        }
        return originalJson.call(this, body);
    };
    next();
};

module.exports = statsMiddleware;