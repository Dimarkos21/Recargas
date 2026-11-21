const GamesRouter = require('express').Router();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');

let HttpsProxyAgent = null;
try {
    ({ HttpsProxyAgent } = require('https-proxy-agent'));
} catch (_) {
    // Se usará conexión directa si https-proxy-agent no está instalado
}

const GameModel = require('../models/Game');
const roleChecker = require('../middleware/roleChecker');
const GamePrincipal = require('../models/GamePrincipal');
const Billetera_Model = require('../models/Billetera');
const Producto_Model = require('../models/Product');
const Trasferencia_Model = require('../models/PagoModel');
const { userExtractor } = require('../middleware/auth');
const Tasa = require('../models/tasap2p');

const esWorkerPrincipal = () => !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';

const redondear2 = (valor) => {
    const num = Number(valor);
    if (!Number.isFinite(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

// BILLETERA
GamesRouter.get("/TotalBilletera", userExtractor, async (request, response) => {
    try {
        const user = request.user;
        if (!user) {
            return response.status(401).json({ error: 'Usuario no autenticado' });
        }

        const billetera = await Billetera_Model.findOne({ usuario: user._id }).lean();
        return response.json({
            Saldo: billetera ? billetera.saldo : 0
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR EN BACKEND:", error);
        return response.status(500).json({ error: 'Ocurrió un error', detalle: error.message });
    }
});

// Ruta para manejar las solicitudes GET a /api/todos
GamesRouter.get("/", async (request, response) => {
    try {
        const nombresBuscados = ['arena breakout', 'call of duty', "Discord", "genshin impact", "Oxide", "AceCraft", "Asphalt 9"];

        // Creamos un patrón que une los nombres con un OR lógico (|) y la 'i' al final para ignorar mayúsculas/minúsculas
        const regexPattern = new RegExp(nombresBuscados.join('|'), 'i');

        const juegos = await GamePrincipal.find({
            name: { $regex: regexPattern }
        });
        response.json(juegos);
    } catch (error) {
        response.status(500).json({ error: 'An error occurred' });
    }
});

// CALCULO DE COSTES Y GANANCIA (Única fuente de verdad para catálogo y cobros)
function CalculoComisionConIvaReal(costoUsdt, gananciaPct, tasaP2p, comisionPasarela = 0.02, iva = 0.16) {
    // 1. Lo que te cuesta + tu ganancia limpia en USDT
    let usdtNetoObjetivo = costoUsdt * (1 + gananciaPct);

    // 2. Bolívares limpios que necesitas para Binance P2P
    let bsParaBinance = usdtNetoObjetivo * tasaP2p;

    // 3. Tu ganancia en bolívares y el IVA exclusivo sobre esa ganancia
    let gananciaBs = (costoUsdt * gananciaPct) * tasaP2p;
    let ivaSobreGanancia = gananciaBs * iva;

    // 4. Sumamos lo de Binance + el IVA de tu servicio, y dividimos entre el factor de la pasarela
    let totalNecesario = bsParaBinance + ivaSobreGanancia;
    let precioFinalBs = totalNecesario / (1 - comisionPasarela);

    return Number(precioFinalBs.toFixed(2));
}

function calcularPreciosProducto(producto, tasaBs) {
    const costoBase = Number(producto?.cost_price_usd) > 0
        ? Number(producto.cost_price_usd)
        : Number(producto?.sell_price_usd) || 0;

    const precioProveedorUsd = Number(producto?.sell_price_usd) > 0
        ? Number(producto.sell_price_usd)
        : costoBase;

    if (costoBase <= 0 || !Number.isFinite(tasaBs) || tasaBs <= 0) {
        return {
            costoBase: 0,
            precioProveedorUsd: 0,
            precioFinalUsd: 0,
            precioFinalBs: 0
        };
    }

    const margenDeseado = 0.20;    // 20% de ganancia neta en USDT sobre el costo
    const comisionPasarela = 0.02; // 2% comisión de pasarela (Débito Inmediato)
    const ivaComision = 0.16;      // 16% IVA aplicado sobre la ganancia

    const precioFinalBs = CalculoComisionConIvaReal(
        costoBase,
        margenDeseado,
        tasaBs,
        comisionPasarela,
        ivaComision
    );
    const precioFinalUsd = redondear2(precioFinalBs / tasaBs);

    return {
        costoBase,
        precioProveedorUsd,
        precioFinalUsd,
        precioFinalBs
    };
}

// BINANCE TASA P2P
let ultimaTasaAltaConocida = null;

// Vigilante que guarda la tasa en MongoDB cada 5 minutos
const iniciarVigilanteTasaP2P = () => {
    if (!esWorkerPrincipal()) return;

    const INTERVALO_MS = 5 * 60 * 1000; // 5 minutos
    let ejecutando = false;

    const actualizarEnMongo = async () => {
        if (ejecutando) return;
        ejecutando = true;

        try {
            const nuevaTasa = await consultarTasaExterna();
            if (!Number.isFinite(nuevaTasa) || nuevaTasa <= 0) return;

            await Tasa.findOneAndUpdate(
                { nombre: "P2P" },
                {
                    $set: {
                        valor: nuevaTasa,
                        ultimaActualizacion: new Date()
                    }
                },
                { upsert: true, new: true }
            );

            ultimaTasaAltaConocida = nuevaTasa;
        } catch (error) {
            console.error("❌ Error guardando tasa P2P en MongoDB:", error.message);
        } finally {
            ejecutando = false;
        }
    };

    actualizarEnMongo(); // Primera carga al iniciar
    const intervalo = setInterval(actualizarEnMongo, INTERVALO_MS);
    intervalo.unref();
};

async function consultarTasaExterna() {
    const TIMEOUT_MS = 3500;

    async function fetchConTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            return await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } finally {
            clearTimeout(timer);
        }
    }

    function calcularPromedioAlto(precios) {
        const validos = precios
            .map(p => parseFloat(p))
            .filter(p => Number.isFinite(p) && p > 0)
            .sort((a, b) => a - b);

        if (validos.length === 0) {
            throw new Error("No hay precios válidos");
        }

        const filasAltas = validos.slice(-3);
        const suma = filasAltas.reduce((acc, val) => acc + val, 0);
        return Number((suma / filasAltas.length).toFixed(2));
    }

    // 1. Fuente principal: Binance P2P
    try {
        const url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";
        const payload = {
            asset: "USDT",
            fiat: "VES",
            tradeType: "BUY",
            transAmount: "50000",
            payTypes: ["Banesco", "PagoMovil"],
            page: 1,
            rows: 10
        };

        const response = await fetchConTimeout(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Binance HTTP ${response.status}`);
        }

        const data = await response.json();
        const ofertas = data?.data;

        if (!Array.isArray(ofertas) || ofertas.length === 0) {
            throw new Error("No hay ofertas en Binance P2P");
        }

        const precios = ofertas.map(item => item?.adv?.price);
        const tasaBinance = calcularPromedioAlto(precios);
        ultimaTasaAltaConocida = tasaBinance;
        return tasaBinance;
    } catch (error) {
        console.warn("Fallo en Binance P2P, probando respaldo 1:", error.message);
    }

    // 2. Respaldo 1: Cotizave
    try {
        const apiKey = process.env.cotizaveP2PUSDT;
        if (!apiKey) {
            throw new Error("Falta variable de entorno cotizaveP2PUSDT");
        }

        const url = "https://api.cotizave.com/v2/fx/VE/rates/ve-binance";
        const response = await fetchConTimeout(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "X-API-Key": apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Respaldo 1 HTTP ${response.status}`);
        }

        const data = await response.json();
        const baseRate = parseFloat(data?.sell ?? data?.mid ?? data?.price);
        if (!Number.isFinite(baseRate) || baseRate <= 0) {
            throw new Error("Dato inválido en Respaldo 1");
        }

        const tasaRespaldo1 = Number(baseRate.toFixed(2));
        ultimaTasaAltaConocida = tasaRespaldo1;
        return tasaRespaldo1;
    } catch (error) {
        console.warn("Fallo en respaldo 1, probando respaldo 2:", error.message);
    }

    // 3. Respaldo 2: CriptoYa
    try {
        const url = "https://criptoya.com/api/binancep2p/usdt/ves/100";
        const response = await fetchConTimeout(url, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Respaldo 2 HTTP ${response.status}`);
        }

        const data = await response.json();
        const candidato = parseFloat(data?.ask ?? data?.totalAsk ?? data?.bid);
        if (!Number.isFinite(candidato) || candidato <= 0) {
            throw new Error("Dato inválido en Respaldo 2");
        }

        const tasaRespaldo2 = Number(candidato.toFixed(2));
        ultimaTasaAltaConocida = tasaRespaldo2;
        return tasaRespaldo2;
    } catch (error) {
        console.warn("Fallo en respaldo 2, usando respaldo 3 (caché):", error.message);
    }

    // 4. Respaldo 3: Última tasa válida en memoria
    if (Number.isFinite(ultimaTasaAltaConocida) && ultimaTasaAltaConocida > 0) {
        return ultimaTasaAltaConocida;
    }

    console.error("Error consultando Binance y todos los respaldos fallaron.");
    return null;
}

// Devuelve el valor guardado en MongoDB
async function obtenerTasaBinanceAlta() {
    try {
        const registro = await Tasa.findOne({ nombre: "P2P" }).lean();

        if (registro && Number.isFinite(registro.valor) && registro.valor > 0) {
            ultimaTasaAltaConocida = registro.valor;
            return registro.valor;
        }

        // Si es la primera vez y aún no hay documento en MongoDB, consulta y guarda una vez
        const tasaInicial = await consultarTasaExterna();
        if (Number.isFinite(tasaInicial) && tasaInicial > 0) {
            await Tasa.findOneAndUpdate(
                { nombre: "P2P" },
                {
                    $set: {
                        valor: tasaInicial,
                        ultimaActualizacion: new Date()
                    }
                },
                { upsert: true, new: true }
            );
            return tasaInicial;
        }
    } catch (error) {
        console.warn("⚠️ Error leyendo tasa P2P de MongoDB, usando respaldo en memoria:", error.message);
    }

    // Respaldo de emergencia si MongoDB sufre un corte temporal
    if (Number.isFinite(ultimaTasaAltaConocida) && ultimaTasaAltaConocida > 0) {
        return ultimaTasaAltaConocida;
    }

    return null;
}

// Ruta para obtener los productos de un juego específico
GamesRouter.get("/1/:name", async (request, response) => {
    try {
        const externalIdNum = Number(request.params.name);

        if (!Number.isInteger(externalIdNum) || externalIdNum <= 0) {
            return response.status(400).json({ error: "ID de juego inválido" });
        }

        // 1. Buscamos el juego principal usando el external_id numérico
        const juego = await GamePrincipal.findOne({ external_id: externalIdNum }).lean();
        if (!juego) {
            return response.status(404).json({ error: "Juego principal no encontrado" });
        }

        // 2. Buscamos la subcategoría vinculada al juego principal
        const subcategoria = await GameModel.findOne({ game_principal: juego._id }).lean();
        if (!subcategoria) {
            return response.status(404).json({ error: "Subcategoría no encontrada" });
        }

        // 3. Buscamos los productos disponibles usando el ID de la subcategoría
        const productos = await Producto_Model.find({
            category_id: subcategoria.external_id,
            is_available: true
        }).lean();

        if (!productos.length) {
            return response.status(404).json({ error: "No hay productos disponibles" });
        }

        // 4. Obtenemos la tasa desde el sistema de vigilancia/MongoDB/respaldos
        const TASA_RESPALDO_DEFAULT = 1082.30;
        const tasaBinanceReal = await obtenerTasaBinanceAlta();
        const usandoRespaldo = !(Number.isFinite(tasaBinanceReal) && tasaBinanceReal > 0);
        const tasaProtegida = usandoRespaldo ? TASA_RESPALDO_DEFAULT : Number(tasaBinanceReal);

        if (usandoRespaldo) {
            console.warn("⚠️ Usando tasa de respaldo por fallo al obtener tasa P2P");
        }

        // 5. Cálculo unificado de precios
        const productosConPrecioBs = productos.map((prod) => {
            const { precioFinalUsd, precioFinalBs } = calcularPreciosProducto(prod, tasaProtegida);

            if (precioFinalBs <= 0) {
                return {
                    ...prod,
                    precio_usd: 0,
                    precio_bs: "0,00"
                };
            }

            return {
                ...prod,
                precio_usd: precioFinalUsd,
                precio_bs: precioFinalBs.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            };
        });

        // 6. Respuesta final
        return response.json({
            nombre: juego.name,
            tasa_referencia_usdt: Number(tasaProtegida.toFixed(2)),
            productos: productosConPrecioBs
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR EN BACKEND:", error);
        return response.status(500).json({ error: "Ocurrió un error", detalle: error.message });
    }
});

GamesRouter.post("/PlayerID", userExtractor, async (request, response) => {
    try {
        const { PlayerID, JuegoID } = request.body;

        const { data } = await axios.post(
            "https://shop2topup.com/api/endpoints/v1/player/validate",
            {
                sub_category_id: Number(JuegoID),
                player_id: Number(PlayerID),
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.json({
            success: true,
            playerInfo: data
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR EN BACKEND:", error.response?.data || error.message);

        return response.status(500).json({
            error: 'Ocurrió un error al validar el jugador',
            detalle: error.response?.data || error.message
        });
    }
});

// COMPRAS Pagomovil y/o Billetera
GamesRouter.get("/Ordenes_Recargas", userExtractor, async (request, response) => {
    try {
        const user = request.user;
        if (!user) {
            return response.status(401).json({ error: 'Usuario no autenticado' });
        }

        const Transferencia = await Trasferencia_Model.find({
            responsable: user._id,
            estatus: { $ne: 'OTP_SOLICITADO' }
        }).lean();

        return response.json({
            Transferencia: Transferencia || []
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR EN BACKEND:", error);
        return response.status(500).json({ error: 'Ocurrió un error', detalle: error.message });
    }
});

GamesRouter.post("/Compra", userExtractor, async (request, response) => {
    let saldoDescontado = 0;
    let userIdActual = null;

    try {
        const user = request.user;
        if (!user) {
            return response.status(401).json({ error: 'Usuario no autenticado' });
        }
        userIdActual = user._id;

        // 1. Extraemos y validamos los datos que envía el cliente
        const { Metodo, PlayerID, JuegoID, Cantidad } = request.body;

        if (!Metodo || !PlayerID || !JuegoID || Cantidad === undefined) {
            return response.status(400).json({ error: 'Faltan datos obligatorios en la solicitud' });
        }

        if (!validarCantidadEntera(Cantidad)) {
            return response.status(400).json({
                error: `La cantidad debe ser un número entero entre 1 y ${MAX_CANTIDAD_POR_ORDEN}`
            });
        }

        const cantidadEntera = Number(Cantidad);

        // 2. Validamos primero el jugador con la API externa de Shop2TopUp
        const { data: validacionData } = await axios.post(
            "https://shop2topup.com/api/endpoints/v1/player/validate",
            {
                sub_category_id: Number(JuegoID),
                player_id: Number(PlayerID),
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!validacionData || !validacionData.success) {
            return response.status(404).json({ error: 'Jugador no válido o ID incorrecto en el juego.' });
        }

        // 3. Lógica según el método de pago
        if (Metodo === "Pagomovil") {
            return response.status(400).json({ error: 'Método Pagomovil no implementado todavía' });
        } else if (Metodo === "Billetera") {
            // Buscar el producto en tu base de datos para saber el precio
            const Producto = await Producto_Model.findOne({ external_id: JuegoID });
            if (!Producto) {
                return response.status(404).json({ error: 'Producto no encontrado en el catálogo.' });
            }

            const precioUnitarioUsd = redondear2(Producto.sell_price_usd);
            if (precioUnitarioUsd <= 0) {
                return response.status(400).json({ error: 'El producto tiene un precio inválido.' });
            }

            const costoTotal = redondear2(precioUnitarioUsd * cantidadEntera);

            // 4. Descuento atómico ANTES de llamar al proveedor (evita doble gasto por concurrencia)
            const billeteraActualizada = await Billetera_Model.findOneAndUpdate(
                { usuario: user._id, saldo: { $gte: costoTotal } },
                [
                    {
                        $set: {
                            saldo: {
                                $round: [{ $subtract: ['$saldo', costoTotal] }, 2]
                            }
                        }
                    }
                ],
                { new: true }
            );

            if (!billeteraActualizada) {
                const billeteraExistente = await Billetera_Model.findOne({ usuario: user._id }).lean();
                if (!billeteraExistente) {
                    return response.status(404).json({ error: 'Billetera no encontrada para este usuario' });
                }
                return response.status(400).json({
                    error: 'Sin Dinero en la billetera',
                    saldoActual: billeteraExistente.saldo,
                    costoRequerido: costoTotal
                });
            }

            saldoDescontado = costoTotal;

            // 5. Generar el UUID único para la idempotencia del pedido en Shop2TopUp
            const orderId = crypto.randomUUID();

            // 6. Hacer el POST para crear el pedido real en Shop2TopUp
            const { data: orderData } = await axios.post(
                "https://shop2topup.com/api/endpoints/v1/orders/create",
                {
                    "order_id": orderId,
                    "sub_category_id": Number(JuegoID),
                    "quantity": cantidadEntera,
                    "requirements": {
                        "player_id": String(PlayerID),
                    },
                    "expected_unit_price": precioUnitarioUsd
                },
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!orderData || !orderData.success) {
                await acreditarSaldoBilletera(user._id, saldoDescontado, 'Reversión por rechazo inmediato en /Compra');
                saldoDescontado = 0;
                return response.status(500).json({ error: 'Error al procesar el pedido con el proveedor', detalle: orderData });
            }

            // Saldo comprometido en orden válida: ya no se revierte en el catch
            saldoDescontado = 0;

            const estadoProveedor = orderData.order?.status || 'pending';
            const proveedorOrderId = String(orderData.order?.order_id || orderId).trim();

            // 7. Guardar el registro de la transacción/pago en la base de datos
            await Trasferencia_Model.create({
                telefono: user.telefono || 'N/A',
                cedula: user.cedula || 'N/A',
                bancoEmisor: 'Billetera Interna',
                Producto: Producto.name,
                juegoId: Number(JuegoID),
                playerId: String(PlayerID).trim(),
                Cantidad: cantidadEntera,
                precioUnitarioUsd: precioUnitarioUsd,
                monto: costoTotal,
                concepto: `Compra de ${cantidadEntera}x ${Producto.name || 'Diamantes/Ítem'} para ID: ${PlayerID}`,
                referencia: proveedorOrderId,
                responsable: user._id,
                uuid: orderId,
                proveedorRequestId: orderId,
                proveedorOrderId: proveedorOrderId,
                ordenProcesada: true,
                utilizado: true,
                estatus: estadoProveedor === 'completed' ? 'APROBADO' : 'PENDIENTE',
                tipoTransaccion: 'Billetera'
            });

            // 8. Responder con éxito al cliente
            return response.json({
                success: true,
                mensaje: "Pedido creado con éxito",
                order: orderData.order
            });
        } else {
            return response.status(400).json({ error: 'Método de pago no válido' });
        }
    } catch (error) {
        if (saldoDescontado > 0 && userIdActual) {
            await acreditarSaldoBilletera(
                userIdActual,
                saldoDescontado,
                `Reversión automática por error en /Compra: ${error.message}`
            ).catch((err) => {
                console.error(`🚨 [CRÍTICO] No se pudo revertir $${saldoDescontado} al usuario ${userIdActual}:`, err.message);
            });
        }

        console.error("DETALLE DEL ERROR EN BACKEND:", error.response?.data || error.message);

        return response.status(500).json({
            error: 'Ocurrió un error al procesar la compra',
            detalle: error.response?.data || error.message
        });
    }
});

GamesRouter.post("/webhook/shop2topup", async (request, response) => {
    try {
        // Validación de secreto si está configurado en variables de entorno
        const webhookSecret = (process.env.SHOP2TOPUP_WEBHOOK_SECRET || '').trim();
        if (webhookSecret) {
            const headerSecret = (
                request.headers['x-webhook-secret'] ||
                request.headers['authorization'] ||
                ''
            ).replace(/^Bearer\s+/i, '').trim();

            if (!compararTokensSeguro(headerSecret, webhookSecret)) {
                console.warn('⛔ Intento no autorizado en /webhook/shop2topup');
                return response.status(401).json({ error: 'Webhook no autorizado' });
            }
        }

        const eventData = request.body || {};
        console.log("📥 Webhook recibido de Shop2TopUp:", eventData);

        const tipoEvento = String(eventData.event || eventData.status || '').toLowerCase().trim();
        const orderId = String(eventData.order_id || eventData.order?.order_id || '').trim();

        if (!orderId) {
            return response.status(400).json({ error: 'Webhook sin order_id válido' });
        }

        // 1. Buscamos la transacción tanto por IDs de proveedor (R4) como por uuid (Billetera)
        const transaccion = await Trasferencia_Model.findOne({
            $or: [
                { proveedorOrderId: orderId },
                { proveedorRequestId: orderId },
                { uuid: orderId }
            ]
        });

        if (!transaccion) {
            console.warn(`⚠️ Transacción con order_id ${orderId} no encontrada en el sistema.`);
            return response.status(404).json({ error: 'Transacción no encontrada' });
        }

        // 2. Evaluamos el tipo de evento recibido
        if (tipoEvento === 'order.completed' || tipoEvento === 'completed') {
            if (transaccion.estatus !== 'APROBADO') {
                await Trasferencia_Model.updateOne(
                    { _id: transaccion._id, estatus: { $nin: ['APROBADO', 'REEMBOLSADO'] } },
                    { $set: { estatus: 'APROBADO', proveedorOrderId: orderId } }
                );
                console.log(`✅ Pedido ${orderId} marcado como APROBADO.`);
            }
        } else if (['order.refunded', 'failed', 'refunded', 'cancelled', 'canceled', 'rejected'].includes(tipoEvento)) {
            // Bloqueo atómico para evitar doble acreditación en webhooks repetidos
            const txReembolsada = await Trasferencia_Model.findOneAndUpdate(
                { _id: transaccion._id, estatus: { $ne: 'REEMBOLSADO' } },
                {
                    $set: {
                        estatus: 'REEMBOLSADO',
                        proveedorOrderId: orderId,
                        detalleError: `Webhook proveedor (${tipoEvento}). Saldo acreditado en billetera.`
                    }
                },
                { new: true }
            );

            if (txReembolsada) {
                await acreditarSaldoBilletera(
                    txReembolsada.responsable,
                    redondear2(txReembolsada.monto),
                    `Webhook Shop2TopUp (${tipoEvento}) - Orden ${orderId}`
                );
                console.log(`🔄 Pedido ${orderId} reembolsado. Se devolvieron $${txReembolsada.monto} al usuario ${txReembolsada.responsable}.`);
            }
        }

        return response.json({ received: true });
    } catch (error) {
        console.error("❌ Error procesando el Webhook:", error.message);
        return response.status(500).json({ error: 'Error interno procesando webhook' });
    }
});

// =========================================================================
// CONFIGURACIÓN OFICIAL R4 CONECTA (V3.1)
// =========================================================================

// =========================================================================
// 1. CONFIGURACIÓN Y CONSTANTES
// =========================================================================
const R4_BASE_URL = (process.env.R4_BASE_URL || 'https://r4conecta.mibanco.com.ve').replace(/\/+$/, '');
const R4_COMMERCE = (process.env.R4_COMMERCE_ID || process.env.R4_COMMERCE_TOKEN || '')
    .replace(/['"]+/g, '')
    .trim();
const R4_WEBHOOK_UUID = (process.env.R4_WEBHOOK_UUID || '').replace(/['"]+/g, '').trim();

const MAX_CANTIDAD_POR_ORDEN = 50;
const TTL_INTENCION_OTP_MS = 10 * 60 * 1000; // 10 minutos de vigencia para usar el OTP
const COOLDOWN_OTP_MS = 30 * 1000; // 30 segundos entre solicitudes OTP por usuario

// Cliente HTTP con timeout estricto para evitar bloqueos en el Event Loop
const httpClient = axios.create({ timeout: 25000 });

const validarCantidadEntera = (cantidad) => {
    const num = Number(cantidad);
    return Number.isInteger(num) && num >= 1 && num <= MAX_CANTIDAD_POR_ORDEN;
};

const verificarCredenciales = () => {
    if (!R4_COMMERCE) {
        throw new Error('❌ Falta R4_COMMERCE_ID o R4_COMMERCE_TOKEN en las variables de entorno (.env)');
    }
};

// =========================================================================
// 2. HELPERS DE SEGURIDAD, SANITIZACIÓN Y BCV
// =========================================================================

/**
 * Genera la firma HMAC-SHA256 en hexadecimal minúsculas exigida por R4 Conecta
 */
function generarFirmaR4(cadenaConcatenada, tokenCommerce) {
    const llaveFirma = (tokenCommerce || R4_COMMERCE || '').replace(/['"]+/g, '').trim();
    if (!llaveFirma) {
        throw new Error('❌ El token Commerce es obligatorio para generar la firma HMAC-SHA256.');
    }

    return crypto
        .createHmac('sha256', llaveFirma)
        .update(String(cadenaConcatenada), 'utf8')
        .digest('hex')
        .toLowerCase();
}

/**
 * Comparación segura contra ataques de tiempo para el token del webhook /SIMF
 */
function compararTokensSeguro(tokenRecibido, tokenEsperado) {
    if (!tokenRecibido || !tokenEsperado) return false;
    const bufA = Buffer.from(String(tokenRecibido), 'utf8');
    const bufB = Buffer.from(String(tokenEsperado), 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Normaliza los datos del pagador al formato estricto de R4 Conecta:
 * - Banco: 4 dígitos exactos (ej. "0102")
 * - Teléfono: 11 dígitos nacionales (ej. "04242059100")
 * - Cédula: Prefijo [V, E, J, P] + números (si viene sin letra, antepone "V")
 * - Nombre: ASCII limpio <= 35 caracteres (evita ISO BE20)
 */
function sanitizarDatosPagador({ banco, telefono, cedula, nombre }) {
    const bancoDigitos = String(banco || '').replace(/\D/g, '');
    const bancoLimpio = bancoDigitos ? bancoDigitos.padStart(4, '0').slice(-4) : '';

    let telLimpio = String(telefono || '').replace(/\D/g, '');
    if (telLimpio.startsWith('58') && telLimpio.length === 12) {
        telLimpio = '0' + telLimpio.slice(2);
    } else if (telLimpio.length === 10 && telLimpio.startsWith('4')) {
        telLimpio = '0' + telLimpio;
    }

    let cedulaLimpia = String(cedula || '').toUpperCase().replace(/[^VEJP0-9]/g, '');
    if (/^\d{5,9}$/.test(cedulaLimpia)) {
        cedulaLimpia = `V${cedulaLimpia}`;
    }

    const nombreLimpio = String(nombre || 'Cliente')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .slice(0, 35) || 'Cliente';

    return {
        banco: /^\d{4}$/.test(bancoLimpio) ? bancoLimpio : '',
        telefono: /^04\d{9}$/.test(telLimpio) ? telLimpio : '',
        cedula: /^[VEJP]\d{5,9}$/.test(cedulaLimpia) ? cedulaLimpia : '',
        nombre: nombreLimpio
    };
}

const obtenerIpCliente = (req) => {
    const ipDirecta = (req.socket?.remoteAddress || req.ip || '').replace(/^::ffff:/, '').trim();
    const ipHeader = (
        req.headers['cf-connecting-ip'] ||
        req.headers['x-forwarded-for']?.split(',')[0] ||
        ''
    ).replace(/^::ffff:/, '').trim();

    const esProxyLocal =
        ipDirecta === '127.0.0.1' ||
        ipDirecta === '::1' ||
        ipDirecta.startsWith('10.') ||
        ipDirecta.startsWith('172.') ||
        ipDirecta.startsWith('192.168.');

    return (esProxyLocal && ipHeader) ? ipHeader : (ipDirecta || ipHeader || '0.0.0.0');
};

// =========================================================================
// 3. GESTIÓN DE BILLETERA Y DESPACHO IDEMPOTENTE AL PROVEEDOR
// =========================================================================

/**
 * Abona saldo en USD a la billetera interna del usuario cuando R4 cobró el dinero
 * pero el proveedor de recargas rechazó o devolvió la orden.
 */
async function acreditarSaldoBilletera(usuarioId, montoUsd, motivo = '') {
    const montoLimpio = redondear2(montoUsd);
    if (!usuarioId || !Number.isFinite(montoLimpio) || montoLimpio <= 0) return null;

    const billetera = await Billetera_Model.findOneAndUpdate(
        { usuario: usuarioId },
        [
            {
                $set: {
                    usuario: usuarioId,
                    saldo: {
                        $round: [{ $add: [{ $ifNull: ['$saldo', 0] }, montoLimpio] }, 2]
                    },
                    saldoRetenido: { $ifNull: ['$saldoRetenido', 0] },
                    estado: { $ifNull: ['$estado', 'ACTIVA'] }
                }
            }
        ],
        { new: true, upsert: true }
    );

    console.log(`💰 [Billetera] Acreditados $${montoLimpio.toFixed(2)} USD al usuario ${usuarioId}. ${motivo}`);
    return billetera;
}

/**
 * Envía la orden a Shop2TopUp usando un ID único persistente para evitar duplicados
 */
async function procesarOrdenProveedor(transaccionDoc) {
    if (!process.env.SHOP2TOPUP_API_KEY) {
        throw new Error('Falta SHOP2TOPUP_API_KEY en el servidor.');
    }

    if (transaccionDoc.ordenProcesada && transaccionDoc.proveedorOrderId) {
        return {
            success: true,
            order: {
                order_id: transaccionDoc.proveedorOrderId,
                status: transaccionDoc.estatus === 'APROBADO' ? 'completed' : 'pending'
            }
        };
    }

    if (!transaccionDoc.proveedorRequestId) {
        transaccionDoc.proveedorRequestId = crypto.randomUUID();
        await transaccionDoc.save();
    }

    const { data: orderData } = await httpClient.post(
        'https://shop2topup.com/api/endpoints/v1/orders/create',
        {
            order_id: transaccionDoc.proveedorRequestId,
            sub_category_id: Number(transaccionDoc.juegoId),
            quantity: Number(transaccionDoc.Cantidad),
            requirements: {
                player_id: String(transaccionDoc.playerId).trim()
            },
            expected_unit_price: Number(transaccionDoc.precioUnitarioUsd)
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (orderData && orderData.success === false) {
        const err = new Error(orderData.message || 'El proveedor rechazó la creación de la orden.');
        err.esRechazoDefinitivo = true;
        throw err;
    }

    const estadoProveedor = String(orderData?.order?.status || 'pending').toLowerCase().trim();
    const proveedorOrderId = String(
        orderData?.order?.order_id || orderData?.order_id || transaccionDoc.proveedorRequestId
    ).trim();

    if (['refunded', 'failed', 'cancelled', 'canceled', 'rejected'].includes(estadoProveedor)) {
        const err = new Error(`El proveedor devolvió la orden con estado: ${estadoProveedor}`);
        err.esRechazoDefinitivo = true;
        throw err;
    }

    transaccionDoc.proveedorOrderId = proveedorOrderId;
    transaccionDoc.estatus = estadoProveedor === 'completed' ? 'APROBADO' : 'PENDIENTE';
    transaccionDoc.ordenProcesada = true;
    await transaccionDoc.save();

    return orderData;
}

/**
 * Despacha la orden al proveedor tras confirmar débito ACCP en R4.
 * Si el proveedor rechaza definitivamente la recarga, acredita el monto en USD a la billetera.
 */
async function ejecutarDespachoSeguro(transaccionId) {
    const ordenBloqueada = await Trasferencia_Model.findOneAndUpdate(
        {
            _id: transaccionId,
            utilizado: { $ne: true },
            estatus: 'DEBITO_APROBADO'
        },
        {
            $set: {
                utilizado: true,
                estatus: 'ENVIANDO_PROVEEDOR'
            }
        },
        { new: true }
    );

    if (!ordenBloqueada) {
        const actual = await Trasferencia_Model.findById(transaccionId).lean();
        return {
            procesadaAhora: false,
            acreditadoEnBilletera: actual?.estatus === 'REEMBOLSADO',
            estatusFinal: actual?.estatus || null,
            order: null
        };
    }

    try {
        const orderData = await procesarOrdenProveedor(ordenBloqueada);

        return {
            procesadaAhora: true,
            acreditadoEnBilletera: false,
            estatusFinal: ordenBloqueada.estatus,
            order: orderData?.order || null
        };
    } catch (provError) {
        const statusHttp = provError.response?.status;
        const esRechazoDefinitivo =
            Boolean(provError.esRechazoDefinitivo) ||
            (statusHttp && statusHttp >= 400 && statusHttp < 500 && statusHttp !== 429);

        if (!esRechazoDefinitivo) {
            console.error(
                `🚨 [REVISIÓN MANUAL] Error ambiguo en Shop2TopUp para TX ${ordenBloqueada._id}:`,
                provError.response?.data || provError.message
            );
            await Trasferencia_Model.updateOne(
                { _id: ordenBloqueada._id },
                {
                    $set: {
                        estatus: 'REVISION_MANUAL',
                        detalleError: `Error de comunicación con proveedor (${provError.message}). Verificar antes de reembolsar.`
                    }
                }
            );
            return {
                procesadaAhora: true,
                acreditadoEnBilletera: false,
                estatusFinal: 'REVISION_MANUAL',
                order: null
            };
        }

        const motivoRechazo = provError.response?.data?.message || provError.message;
        const txMarcadaReembolso = await Trasferencia_Model.findOneAndUpdate(
            { _id: ordenBloqueada._id, estatus: { $ne: 'REEMBOLSADO' } },
            {
                $set: {
                    estatus: 'REEMBOLSADO',
                    detalleError: `Proveedor no pudo recargar (${motivoRechazo}). Saldo acreditado en billetera.`
                }
            },
            { new: true }
        );

        if (txMarcadaReembolso) {
            try {
                const montoReembolsoUsd = redondear2(txMarcadaReembolso.monto);
                await acreditarSaldoBilletera(
                    txMarcadaReembolso.responsable,
                    montoReembolsoUsd,
                    `TX ${txMarcadaReembolso._id} - ${motivoRechazo}`
                );
            } catch (walletErr) {
                console.error(`🚨 [CRÍTICO] Falló abono a billetera para TX ${txMarcadaReembolso._id}:`, walletErr.message);
                await Trasferencia_Model.updateOne(
                    { _id: txMarcadaReembolso._id },
                    {
                        $set: {
                            estatus: 'REVISION_MANUAL',
                            detalleError: `Fallo al acreditar $${txMarcadaReembolso.monto} USD en billetera: ${walletErr.message}`
                        }
                    }
                );
                return {
                    procesadaAhora: true,
                    acreditadoEnBilletera: false,
                    estatusFinal: 'REVISION_MANUAL',
                    order: null
                };
            }
        }

        return {
            procesadaAhora: true,
            acreditadoEnBilletera: true,
            estatusFinal: 'REEMBOLSADO',
            order: null
        };
    }
}

// PROXY DE IP INDEPENDIENTE DESDE DONDE SALE LA SOLICITUD HTTPS
function crearHttpsAgentProxy(proxyUrl) {
    if (!proxyUrl) return undefined;

    try {
        const parsed = new URL(proxyUrl);
        if (HttpsProxyAgent) {
            return new HttpsProxyAgent(parsed.toString());
        }
        console.warn('⚠️ Instala "https-proxy-agent" para soportar proxy HTTPS correctamente.');
        return undefined;
    } catch (err) {
        console.warn('⚠️ Proxie_URL_SALIDAS_IP inválida, se enviará conexión directa:', err.message);
        return undefined;
    }
}

const r4HttpClient = axios.create({
    timeout: 25000,
    httpsAgent: crearHttpsAgentProxy(process.env.Proxie_URL_SALIDAS_IP),
    proxy: false
});

// =========================================================================
// 4. PASO 1: SOLICITAR OTP (POST /GenerarOtp)
// =========================================================================
GamesRouter.post('/solicitar-otp', userExtractor, async (request, response) => {
    const reqId = crypto.randomUUID().slice(0, 8);
    console.log(`\n🚀 [OTP-${reqId}] Iniciando solicitud de Débito Inmediato...`);

    try {
        verificarCredenciales();

        const user = request.user;
        if (!user) {
            return response.status(401).json({ success: false, error: 'Usuario no autenticado.' });
        }

        const { telefono, cedula, banco, PlayerID, JuegoID, Cantidad } = request.body || {};

        if (!telefono || !cedula || !banco || !PlayerID || !JuegoID || Cantidad === undefined) {
            return response.status(400).json({
                success: false,
                error: 'Faltan datos requeridos (teléfono, cédula, banco, PlayerID, JuegoID o Cantidad).'
            });
        }

        if (
            (typeof JuegoID !== 'string' && typeof JuegoID !== 'number') ||
            (typeof PlayerID !== 'string' && typeof PlayerID !== 'number')
        ) {
            return response.status(400).json({ success: false, error: 'Formato de JuegoID o PlayerID inválido.' });
        }

        const juegoIdLimpio = String(JuegoID).trim();
        const playerIdLimpio = String(PlayerID).trim();

        if (!/^\d+$/.test(juegoIdLimpio) || !playerIdLimpio || playerIdLimpio.length > 64) {
            return response.status(400).json({ success: false, error: 'JuegoID o PlayerID inválido.' });
        }

        if (!validarCantidadEntera(Cantidad)) {
            return response.status(400).json({
                success: false,
                error: `La cantidad debe ser un número entero entre 1 y ${MAX_CANTIDAD_POR_ORDEN}.`
            });
        }

        const cantidadEntera = Number(Cantidad);
        const datos = sanitizarDatosPagador({ banco, telefono, cedula, nombre: user.name });
        console.log(`🧹 [OTP-${reqId}] Datos sanitizados:`, datos);

        if (!datos.banco) {
            return response.status(400).json({ success: false, error: 'El código de banco debe tener 4 dígitos.' });
        }
        if (!datos.telefono) {
            return response.status(400).json({ success: false, error: 'Número de teléfono inválido (debe ser 04XXXXXXXXX).' });
        }
        if (!datos.cedula) {
            return response.status(400).json({ success: false, error: 'Cédula inválida (ej. V12345678).' });
        }

        const solicitudReciente = await Trasferencia_Model.findOne({
            responsable: user._id,
            estatus: 'OTP_SOLICITADO',
            createdAt: { $gte: new Date(Date.now() - COOLDOWN_OTP_MS) }
        }).lean();

        if (solicitudReciente) {
            return response.status(429).json({
                success: false,
                error: 'Ya solicitaste una clave dinámica hace unos segundos. Espera 30 segundos antes de pedir otra.'
            });
        }

        // 1. Validar jugador en Shop2TopUp
        const playerIdPayload =
            /^\d+$/.test(playerIdLimpio) && !playerIdLimpio.startsWith('0')
                ? Number(playerIdLimpio)
                : playerIdLimpio;

        console.log(`🎮 [OTP-${reqId}] Validando jugador en Shop2TopUp...`, {
            sub_category_id: Number(juegoIdLimpio),
            player_id: playerIdPayload
        });

        const { data: validacionData } = await httpClient.post(
            'https://shop2topup.com/api/endpoints/v1/player/validate',
            {
                sub_category_id: Number(juegoIdLimpio),
                player_id: playerIdPayload
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!validacionData?.success) {
            return response.status(404).json({
                success: false,
                error: 'Jugador no válido o ID incorrecto en el juego.'
            });
        }

        // 2. Buscar producto y calcular monto exacto usando la misma fórmula del catálogo
        const Producto = await Producto_Model.findOne({ external_id: juegoIdLimpio });
        if (!Producto) {
            return response.status(404).json({ success: false, error: 'Producto no disponible en el catálogo.' });
        }

        const tasaBinance = Number(await obtenerTasaBinanceAlta());
        if (!Number.isFinite(tasaBinance) || tasaBinance <= 0) {
            return response.status(503).json({ success: false, error: 'Error al consultar la tasa P2P.' });
        }

        const { precioProveedorUsd, precioFinalUsd, precioFinalBs } = calcularPreciosProducto(Producto, tasaBinance);
        if (precioFinalBs <= 0) {
            return response.status(404).json({ success: false, error: 'Producto sin precio válido en el catálogo.' });
        }

        const costoTotalUsd = redondear2(precioFinalUsd * cantidadEntera);
        const montoVESNum = redondear2(precioFinalBs * cantidadEntera);
        const montoFormateado = montoVESNum.toFixed(2);

        if (montoVESNum <= 0) {
            return response.status(400).json({ success: false, error: 'El monto calculado es inválido.' });
        }

        // 3. Solicitar OTP en R4 Conecta (Firma HMAC: "Banco + Monto + Telefono + Cedula")
        const cadenaFirma = `${datos.banco}${montoFormateado}${datos.telefono}${datos.cedula}`;
        const tokenAuthorization = generarFirmaR4(cadenaFirma);

        console.log(`📤 [OTP-${reqId}] Enviando POST a R4 /GenerarOtp:`, {
            url: `${R4_BASE_URL}/GenerarOtp`,
            commercePrefix: `${R4_COMMERCE.slice(0, 6)}...`,
            Banco: datos.banco,
            Monto: montoFormateado,
            Telefono: datos.telefono,
            Cedula: datos.cedula
        });

        const r4Response = await r4HttpClient.post(
            `${R4_BASE_URL}/GenerarOtp`,
            {
                Banco: datos.banco,
                Monto: montoFormateado,
                Telefono: datos.telefono,
                Cedula: datos.cedula
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: tokenAuthorization,
                    Commerce: R4_COMMERCE
                }
            }
        );

        console.log(`📥 [OTP-${reqId}] Respuesta R4 (HTTP ${r4Response.status}):`, r4Response.data);

        const codigoOtp = String(r4Response.data?.code || '').trim();

        if (codigoOtp === '202') {
            const tempUuid = crypto.randomUUID();
            const intencionPago = await Trasferencia_Model.create({
                telefonoEmisor: datos.telefono,
                cedula: datos.cedula,
                bancoEmisor: datos.banco,
                referencia: `OTP-${tempUuid}`,
                Producto: Producto.name,
                juegoId: Number(juegoIdLimpio),
                playerId: playerIdLimpio,
                Cantidad: cantidadEntera,
                precioUnitarioUsd: precioProveedorUsd,
                monto: costoTotalUsd,
                montoVES: montoVESNum,
                montoVESString: montoFormateado,
                concepto: `Compra de ${cantidadEntera}x ${Producto.name} para ID: ${playerIdLimpio}`,
                responsable: user._id,
                estatus: 'OTP_SOLICITADO',
                utilizado: false,
                tipoTransaccion: 'DebitoInmediato'
            });

            return response.status(200).json({
                success: true,
                message:
                    r4Response.data?.message ||
                    '¡Clave dinámica enviada! Revisa tus SMS o las notificaciones de tu app bancaria.',
                intentId: intencionPago._id,
                montoCalculado: montoFormateado
            });
        }

        return response.status(400).json({
            success: false,
            error: r4Response.data?.message || 'El banco rechazó la solicitud de clave dinámica.',
            codigoRespuesta: codigoOtp
        });
    } catch (error) {
        console.error(`❌ [OTP-${reqId}] Error en /solicitar-otp:`, error.response?.data || error.message);
        return response.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.message || 'Error interno al solicitar la clave dinámica.'
        });
    }
});

// =========================================================================
// 5. PASO 2: EJECUTAR DÉBITO INMEDIATO (POST /DebitoInmediato)
// =========================================================================
GamesRouter.post('/confirmar-c2p', userExtractor, async (request, response) => {
    let transaccion = null;

    try {
        verificarCredenciales();

        const user = request.user;
        if (!user) {
            return response.status(401).json({ success: false, error: 'Usuario no autenticado.' });
        }

        const { intentId, otp, concepto } = request.body || {};

        if (!intentId || !otp) {
            return response.status(400).json({
                success: false,
                error: 'El intentId y el código OTP son obligatorios.'
            });
        }

        const intentIdLimpio = String(intentId).trim();
        if (!mongoose.Types.ObjectId.isValid(intentIdLimpio)) {
            return response.status(400).json({ success: false, error: 'El intentId tiene un formato inválido.' });
        }

        const otpLimpio = String(otp).trim();
        if (!/^\d{4,10}$/.test(otpLimpio)) {
            return response.status(400).json({ success: false, error: 'Formato de OTP inválido.' });
        }

        const limiteVigencia = new Date(Date.now() - TTL_INTENCION_OTP_MS);

        transaccion = await Trasferencia_Model.findOneAndUpdate(
            {
                _id: intentIdLimpio,
                responsable: user._id,
                estatus: 'OTP_SOLICITADO',
                utilizado: { $ne: true },
                createdAt: { $gte: limiteVigencia }
            },
            {
                $set: { estatus: 'PROCESANDO_R4' }
            },
            { new: true }
        );

        if (!transaccion) {
            return response.status(409).json({
                success: false,
                error: 'La sesión de pago expiró, no existe o ya está siendo procesada. Solicita un nuevo OTP.'
            });
        }

        const datos = sanitizarDatosPagador({
            banco: transaccion.bancoEmisor,
            telefono: transaccion.telefonoEmisor,
            cedula: transaccion.cedula,
            nombre: user.name
        });

        const montoExacto = transaccion.montoVESString || redondear2(transaccion.montoVES).toFixed(2);
        const conceptoFinal =
            String(concepto || transaccion.concepto || 'Pago de servicio')
                .replace(/[^\w\s\-.:]/g, '')
                .trim()
                .slice(0, 40) || 'Pago de servicio';

        const stringToSign = `${datos.banco}${datos.cedula}${datos.telefono}${montoExacto}${otpLimpio}`;
        const tokenAuthorization = generarFirmaR4(stringToSign);

        const r4Response = await r4HttpClient.post(
            `${R4_BASE_URL}/DebitoInmediato`,
            {
                Banco: datos.banco,
                Monto: montoExacto,
                Telefono: datos.telefono,
                Cedula: datos.cedula,
                Nombre: datos.nombre,
                OTP: otpLimpio,
                Concepto: conceptoFinal
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: tokenAuthorization,
                    Commerce: R4_COMMERCE
                }
            }
        );

        const { code, reference, uuid, id, mensaje, message } = r4Response.data || {};
        const r4Uuid = uuid || id;
        const codigoR4 = String(code || '').toUpperCase().trim();

        if (r4Uuid) transaccion.uuid = String(r4Uuid).trim();
        if (reference) {
            transaccion.referencia = String(reference).trim();
            transaccion.referenciaBancaria = String(reference).trim();
        }

        // CASO 1: ACEPTADO DE INMEDIATO (ACCP)
        if (codigoR4 === 'ACCP') {
            transaccion.estatus = 'DEBITO_APROBADO';
            await transaccion.save();

            const despacho = await ejecutarDespachoSeguro(transaccion._id);

            return response.status(200).json({
                success: true,
                code: 'ACCP',
                acreditadoEnBilletera: despacho.acreditadoEnBilletera,
                message: despacho.acreditadoEnBilletera
                    ? `Pago confirmado, pero el juego no pudo recargarse. Se acreditaron $${redondear2(transaccion.monto).toFixed(2)} USD a tu billetera.`
                    : '¡Débito inmediato procesado y pedido creado con éxito!',
                referenciaBancaria: transaccion.referenciaBancaria || null,
                uuid: transaccion.uuid || null,
                order: despacho.order
            });
        }

        // CASO 2: EN ESPERA DE RESPUESTA DEL BANCO RECEPTOR (AC00)
        if (codigoR4 === 'AC00') {
            transaccion.estatus = 'EN_ESPERA_SIMF';
            await transaccion.save();

            return response.status(202).json({
                success: true,
                code: 'AC00',
                message: 'Operación en espera de confirmación del banco receptor.',
                uuid: transaccion.uuid || null
            });
        }

        // CASO 3: RECHAZO BANCARIO DEFINITIVO
        transaccion.estatus = 'RECHAZADO';
        transaccion.codigoErrorR4 = codigoR4 || 'RJCT';
        transaccion.detalleError = mensaje || message || 'Rechazado por el banco.';
        await transaccion.save();

        return response.status(400).json({
            success: false,
            error: mensaje || message || 'El débito inmediato fue rechazado por el banco.',
            codigoRespuesta: codigoR4
        });
    } catch (error) {
        const statusHttp = error.response?.status;
        const dataError = error.response?.data;
        console.error('❌ Error en /confirmar-c2p:', dataError || error.message);

        if (transaccion && transaccion.estatus === 'PROCESANDO_R4') {
            const esRechazoExplicitoR4 =
                statusHttp && statusHttp >= 400 && statusHttp < 500 && statusHttp !== 408 && statusHttp !== 429;

            if (esRechazoExplicitoR4) {
                const codigoErr = String(dataError?.code || `HTTP_${statusHttp}`).toUpperCase().trim();
                const mensajeErr = dataError?.mensaje || dataError?.message || 'Débito rechazado por R4.';

                transaccion.estatus = 'RECHAZADO';
                transaccion.codigoErrorR4 = codigoErr;
                transaccion.detalleError = mensajeErr;
                await transaccion.save().catch(() => {});

                return response.status(400).json({
                    success: false,
                    error: mensajeErr,
                    codigoRespuesta: codigoErr
                });
            }

            transaccion.estatus = transaccion.uuid ? 'EN_ESPERA_SIMF' : 'REVISION_MANUAL';
            transaccion.detalleError = `Error de comunicación con R4 durante débito: ${error.message}`;
            await transaccion.save().catch(() => {});
        }

        return response.status(statusHttp || 500).json({
            success: false,
            error: 'Ocurrió un error al procesar el débito inmediato.'
        });
    }
});

// =========================================================================
// 6. PASO 3: WEBHOOK ASÍNCRONO R4 (POST /SIMF)
// =========================================================================
GamesRouter.post('/SIMF', async (request, response) => {
    try {
        const ipOrigen = obtenerIpCliente(request);
        const ipsR4 = ['45.175.213.98', '200.74.203.91', '204.199.249.3'];

        if (process.env.NODE_ENV === 'production' && !ipsR4.includes(ipOrigen)) {
            console.warn('⛔ IP no autorizada en /SIMF:', ipOrigen);
            return response.status(403).json({ status: false });
        }

        const authHeader = (request.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
        if (!compararTokensSeguro(authHeader, R4_WEBHOOK_UUID)) {
            console.warn('⛔ Token inválido o no configurado en /SIMF desde IP:', ipOrigen);
            return response.status(401).json({ status: false });
        }

        const { id, uuid, code, reference, message } = request.body || {};
        const r4Uuid = String(id || uuid || '').trim();
        console.log('📩 [R4 Webhook /SIMF] Notificación recibida:', { r4Uuid, code, reference });

        if (!r4Uuid || r4Uuid.length > 100) {
            return response.status(200).json({ status: true });
        }

        const transaccion = await Trasferencia_Model.findOne({ uuid: r4Uuid });
        if (!transaccion) {
            console.warn('⚠️ /SIMF recibió un UUID no registrado en BD:', r4Uuid);
            return response.status(200).json({ status: true });
        }

        const codigoNorm = String(code || '').toUpperCase().trim();

        if (codigoNorm === 'ACCP') {
            const updateFields = { estatus: 'DEBITO_APROBADO' };
            if (reference) {
                updateFields.referencia = String(reference).trim();
                updateFields.referenciaBancaria = String(reference).trim();
            }

            await Trasferencia_Model.updateOne(
                {
                    _id: transaccion._id,
                    utilizado: { $ne: true },
                    estatus: { $in: ['EN_ESPERA_SIMF', 'PROCESANDO_R4', 'REVISION_MANUAL'] }
                },
                { $set: updateFields }
            );

            await ejecutarDespachoSeguro(transaccion._id);
        } else if (codigoNorm && codigoNorm !== 'AC00') {
            await Trasferencia_Model.updateOne(
                {
                    _id: transaccion._id,
                    utilizado: { $ne: true },
                    estatus: { $in: ['EN_ESPERA_SIMF', 'PROCESANDO_R4'] }
                },
                {
                    $set: {
                        estatus: 'RECHAZADO',
                        codigoErrorR4: codigoNorm,
                        detalleError: message || 'Rechazado vía SIMF'
                    }
                }
            );
        }

        return response.status(200).json({ status: true });
    } catch (error) {
        console.error('❌ Error procesando webhook /SIMF:', error.message);
        return response.status(200).json({ status: false });
    }
});

// =========================================================================
// 7. PASO 4: CONSULTA DE RESPALDO Y VERIFICACIÓN DE ESTADOS R4
// =========================================================================
async function consultarEstatusOperacionR4(r4Uuid) {
    verificarCredenciales();
    const uuidLimpio = String(r4Uuid).trim();
    const tokenAuthorization = generarFirmaR4(uuidLimpio);
    const headers = {
        'Content-Type': 'application/json',
        Authorization: tokenAuthorization,
        Commerce: R4_COMMERCE
    };

    const payloads = [{ uuid: uuidLimpio }, { Id: uuidLimpio }, { id: uuidLimpio }];
    let ultimoError = null;

    for (const bodyPayload of payloads) {
        try {
            const { data } = await r4HttpClient.post(`${R4_BASE_URL}/ConsultarOperaciones`, bodyPayload, { headers });
            return data;
        } catch (err) {
            ultimoError = err;
            if (err.response?.status !== 400) break;
        }
    }

    throw ultimoError;
}

async function verificarYProcesarOperacionR4(uuid, userIdPropietario = null) {
    const uuidLimpio = String(uuid).trim();
    const filtro = { uuid: uuidLimpio };
    if (userIdPropietario) filtro.responsable = userIdPropietario;

    const transaccion = await Trasferencia_Model.findOne(filtro);
    if (!transaccion) return { encontrada: false };

    if (transaccion.estatus === 'DEBITO_APROBADO' && !transaccion.utilizado) {
        const despacho = await ejecutarDespachoSeguro(transaccion._id);
        return {
            encontrada: true,
            code: 'ACCP',
            estatusLocal: despacho.estatusFinal,
            acreditadoEnBilletera: despacho.acreditadoEnBilletera
        };
    }

    const estadosFinales = ['APROBADO', 'PENDIENTE', 'ENVIANDO_PROVEEDOR', 'REEMBOLSADO', 'RECHAZADO'];
    if (estadosFinales.includes(transaccion.estatus)) {
        return {
            encontrada: true,
            code: transaccion.estatus,
            estatusLocal: transaccion.estatus,
            acreditadoEnBilletera: transaccion.estatus === 'REEMBOLSADO'
        };
    }

    const resultadoR4 = await consultarEstatusOperacionR4(uuidLimpio);
    const codigoR4 = String(resultadoR4?.code || '').toUpperCase().trim();

    if (codigoR4 === 'ACCP') {
        const updateFields = { estatus: 'DEBITO_APROBADO' };
        if (resultadoR4.reference) {
            updateFields.referencia = String(resultadoR4.reference).trim();
            updateFields.referenciaBancaria = String(resultadoR4.reference).trim();
        }

        await Trasferencia_Model.updateOne(
            { _id: transaccion._id, utilizado: { $ne: true } },
            { $set: updateFields }
        );

        const despacho = await ejecutarDespachoSeguro(transaccion._id);

        return {
            encontrada: true,
            code: 'ACCP',
            estatusLocal: despacho.estatusFinal || 'PENDIENTE',
            acreditadoEnBilletera: despacho.acreditadoEnBilletera
        };
    }

    if (codigoR4 && codigoR4 !== 'AC00') {
        await Trasferencia_Model.updateOne(
            { _id: transaccion._id, utilizado: { $ne: true } },
            {
                $set: {
                    estatus: 'RECHAZADO',
                    codigoErrorR4: codigoR4,
                    detalleError: resultadoR4?.mensaje || resultadoR4?.message || 'Rechazado en consulta R4'
                }
            }
        );

        return {
            encontrada: true,
            code: codigoR4,
            estatusLocal: 'RECHAZADO',
            acreditadoEnBilletera: false
        };
    }

    return {
        encontrada: true,
        code: 'AC00',
        estatusLocal: transaccion.estatus,
        acreditadoEnBilletera: false
    };
}

GamesRouter.post('/consultar-operacion', userExtractor, async (request, response) => {
    try {
        const { uuid } = request.body || {};
        if (!uuid || typeof uuid !== 'string') {
            return response.status(400).json({ success: false, error: 'El campo uuid es obligatorio y debe ser texto.' });
        }

        const uuidLimpio = uuid.trim();
        if (!uuidLimpio || uuidLimpio.length > 100) {
            return response.status(400).json({ success: false, error: 'Formato de uuid inválido.' });
        }

        const resultado = await verificarYProcesarOperacionR4(uuidLimpio, request.user._id);

        if (!resultado.encontrada) {
            return response.status(404).json({ success: false, error: 'Transacción no encontrada.' });
        }

        return response.status(200).json({ success: true, ...resultado });
    } catch (error) {
        console.error('❌ Error en /consultar-operacion:', error.response?.data || error.message);
        return response.status(error.response?.status || 500).json({
            success: false,
            error: 'No se pudo consultar el estado de la operación.'
        });
    }
});

// =========================================================================
// 8. VIGILANTES AUTOMÁTICOS (R4 CONECTA + PROVEEDOR DE RECARGAS)
// =========================================================================

/**
 * Vigilante 1: Verifica operaciones en espera de R4 (AC00), rescata débitos aprobados
 * sin despachar y detecta procesos interrumpidos por reinicio del servidor.
 */
const iniciarVigilantePendientesR4 = () => {
    if (!esWorkerPrincipal()) return;

    const INTERVALO_MS = 60 * 1000;
    const ANTIGUEDAD_MINIMA_MS = 3 * 60 * 1000;
    const ANTIGUEDAD_MAXIMA_MS = 24 * 60 * 60 * 1000;
    let ejecutando = false;

    const intervalo = setInterval(async () => {
        if (ejecutando) return;
        ejecutando = true;

        try {
            const ahora = Date.now();
            const limiteMinimo = new Date(ahora - ANTIGUEDAD_MINIMA_MS);
            const limiteMaximo = new Date(ahora - ANTIGUEDAD_MAXIMA_MS);

            // 1. Expirar operaciones sin respuesta tras 24h
            await Trasferencia_Model.updateMany(
                {
                    estatus: 'EN_ESPERA_SIMF',
                    utilizado: { $ne: true },
                    createdAt: { $lt: limiteMaximo }
                },
                {
                    $set: {
                        estatus: 'RECHAZADO',
                        detalleError: 'Tiempo máximo de espera (24h) excedido sin confirmación de R4.'
                    }
                }
            );

            // 2. Marcar para revisión órdenes que quedaron colgadas en ENVIANDO_PROVEEDOR por un reinicio
            await Trasferencia_Model.updateMany(
                {
                    estatus: 'ENVIANDO_PROVEEDOR',
                    updatedAt: { $lte: new Date(ahora - 3 * 60 * 1000) }
                },
                {
                    $set: {
                        estatus: 'REVISION_MANUAL',
                        detalleError: 'Proceso interrumpido mientras se enviaba al proveedor. Verificar antes de reembolsar.'
                    }
                }
            );

            // 3. Rescatar órdenes ya aprobadas por R4 (DEBITO_APROBADO) que no llegaron a enviarse
            const aprobadasSinDespachar = await Trasferencia_Model.find({
                estatus: 'DEBITO_APROBADO',
                utilizado: { $ne: true },
                updatedAt: { $lte: new Date(ahora - 60 * 1000) }
            }).limit(10);

            for (const tx of aprobadasSinDespachar) {
                try {
                    await ejecutarDespachoSeguro(tx._id);
                } catch (err) {
                    console.error(`❌ Error rescatando despacho TX ${tx._id}:`, err.message);
                }
            }

            // 4. Consultar en R4 operaciones pendientes de confirmación (AC00 / EN_ESPERA_SIMF)
            const pendientes = await Trasferencia_Model.find({
                estatus: 'EN_ESPERA_SIMF',
                utilizado: { $ne: true },
                uuid: { $exists: true, $nin: [null, ''] },
                createdAt: { $lte: limiteMinimo, $gte: limiteMaximo }
            }).limit(15);

            for (const tx of pendientes) {
                try {
                    await verificarYProcesarOperacionR4(tx.uuid);
                } catch (txError) {
                    console.error(`❌ Error verificando UUID ${tx.uuid}:`, txError.response?.data || txError.message);
                }
            }
        } catch (error) {
            if (error.code === 'ECONNRESET' || error.name === 'MongoNetworkError') {
                console.warn('⚠️ Reconexión transitoria de red en vigilante R4 (reintentará en 60s).');
            } else {
                console.error('❌ Error general en vigilante R4:', error.message);
            }
        } finally {
            ejecutando = false;
        }
    }, INTERVALO_MS);

    intervalo.unref();
};

/**
 * Vigilante 2: Verifica el estado final en Shop2TopUp y acredita en billetera USD
 * si el proveedor reembolsó, canceló, falló o entregó parcialmente.
 */
const iniciarVigilanteOrdenesProveedor = () => {
    if (!esWorkerPrincipal()) return;

    const INTERVALO_MS = 6 * 60 * 1000;
    let ejecutando = false;

    const intervalo = setInterval(async () => {
        if (ejecutando || !process.env.SHOP2TOPUP_API_KEY) return;
        ejecutando = true;

        try {
            const ordenesPendientes = await Trasferencia_Model.find({
                estatus: 'PENDIENTE',
                utilizado: true,
                $or: [
                    { proveedorOrderId: { $exists: true, $nin: [null, ''] } },
                    { uuid: { $exists: true, $nin: [null, ''] } }
                ]
            }).limit(50);

            if (!ordenesPendientes.length) return;

            const mapaOrdenes = new Map();
            for (const tx of ordenesPendientes) {
                const idConsulta = String(tx.proveedorOrderId || tx.uuid).trim();
                mapaOrdenes.set(idConsulta, tx);
            }

            const orderIds = Array.from(mapaOrdenes.keys());

            const { data } = await httpClient.post(
                'https://shop2topup.com/api/endpoints/v1/orders/batch',
                { order_ids: orderIds },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!data?.success || !Array.isArray(data.orders)) return;

            for (const ordenInfo of data.orders) {
                const orderId = String(ordenInfo.order_id || '').trim();
                const estadoProveedor = String(ordenInfo.status || '').toLowerCase().trim();
                const tx = mapaOrdenes.get(orderId);
                if (!tx) continue;

                // A. Recarga completada exitosamente
                if (estadoProveedor === 'completed') {
                    await Trasferencia_Model.updateOne(
                        { _id: tx._id, estatus: 'PENDIENTE' },
                        { $set: { estatus: 'APROBADO', proveedorOrderId: orderId } }
                    );
                }
                // B. Recarga devuelta, fallida o cancelada -> Reembolso total en USD a billetera
                else if (['refunded', 'failed', 'cancelled', 'canceled', 'rejected'].includes(estadoProveedor)) {
                    const txReembolsada = await Trasferencia_Model.findOneAndUpdate(
                        { _id: tx._id, estatus: 'PENDIENTE' },
                        {
                            $set: {
                                estatus: 'REEMBOLSADO',
                                proveedorOrderId: orderId,
                                detalleError: `Orden ${estadoProveedor} por el proveedor. Saldo acreditado en billetera.`
                            }
                        },
                        { new: true }
                    );

                    if (txReembolsada) {
                        await acreditarSaldoBilletera(
                            txReembolsada.responsable,
                            redondear2(txReembolsada.monto),
                            `Orden proveedor ${orderId} (${estadoProveedor})`
                        );
                    }
                }
                // C. Entrega parcial -> Reembolso proporcional en USD a billetera
                else if (estadoProveedor === 'partial') {
                    try {
                        const { data: detalleData } = await httpClient.get(
                            `https://shop2topup.com/api/endpoints/v1/orders/${orderId}`,
                            {
                                headers: { Authorization: `Bearer ${process.env.SHOP2TOPUP_API_KEY}` }
                            }
                        );

                        const subTxs = detalleData?.order?.sub_transactions || [];
                        const unidadesReembolsadas = subTxs.filter((s) =>
                            ['refunded', 'failed', 'cancelled', 'canceled'].includes(
                                String(s.status || '').toLowerCase().trim()
                            )
                        ).length;

                        const precioUnitario =
                            redondear2(tx.precioUnitarioUsd) || redondear2(tx.monto / (tx.Cantidad || 1));
                        const montoReembolsoUsd = redondear2(unidadesReembolsadas * precioUnitario);

                        const txParcial = await Trasferencia_Model.findOneAndUpdate(
                            { _id: tx._id, estatus: 'PENDIENTE' },
                            {
                                $set: {
                                    estatus: 'APROBADO',
                                    proveedorOrderId: orderId,
                                    detalleError: `Entrega parcial: ${unidadesReembolsadas} unidad(es) reembolsada(s) ($${montoReembolsoUsd.toFixed(2)} USD).`
                                }
                            },
                            { new: true }
                        );

                        if (txParcial && montoReembolsoUsd > 0) {
                            await acreditarSaldoBilletera(
                                txParcial.responsable,
                                montoReembolsoUsd,
                                `Reembolso parcial orden ${orderId}`
                            );
                        }
                    } catch (partialErr) {
                        console.error(`❌ Error detalle parcial orden ${orderId}:`, partialErr.message);
                    }
                }
            }
        } catch (error) {
            if (error.code === 'ECONNRESET' || error.name === 'MongoNetworkError') {
                console.warn('⚠️ Reconexión transitoria de red en vigilante Shop2TopUp (reintentará en 60s).');
            } else {
                console.error('❌ Error en vigilante Shop2TopUp:', error.response?.data || error.message);
            }
        } finally {
            ejecutando = false;
        }
    }, INTERVALO_MS);

    intervalo.unref();
};

iniciarVigilantePendientesR4();
iniciarVigilanteOrdenesProveedor();
iniciarVigilanteTasaP2P();

module.exports = GamesRouter;