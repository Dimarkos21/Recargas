const GamesRouter = require('express').Router();
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

const esErrorTransitorioMongo = (error) => {
    if (!error) return false;
    return (
        error.code === 'ECONNRESET' ||
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoServerSelectionError' ||
        String(error.message || '').includes('server monitor timeout')
    );
};

// =========================================================================
// CONFIGURACIÓN Y CONSTANTES GENERALES
// =========================================================================
const R4_BASE_URL = (process.env.R4_BASE_URL || 'https://r4conecta.mibanco.com.ve').replace(/\/+$/, '');
const R4_COMMERCE = (process.env.R4_COMMERCE_ID || process.env.R4_COMMERCE_TOKEN || '')
    .replace(/['"]+/g, '')
    .trim();
const R4_WEBHOOK_UUID = (process.env.R4_WEBHOOK_UUID || '').replace(/['"]+/g, '').trim();

const TASA_RESPALDO_DEFAULT = 1082.30;
const MAX_ANTIGUEDAD_TASA_MS = 30 * 60 * 1000; // 30 minutos de vigencia máxima de tasa en BD
const MAX_CANTIDAD_POR_ORDEN = 50;
const TTL_INTENCION_OTP_MS = 10 * 60 * 1000; // 10 minutos de vigencia para usar el OTP
const COOLDOWN_OTP_MS = 30 * 1000; // 30 segundos entre solicitudes OTP por usuario

// Cliente HTTP con timeout estricto para evitar bloqueos en el Event Loop
const httpClient = axios.create({ timeout: 25000 });

const MENSAJES_ISO_R4 = {
    AB01: 'Tiempo de espera agotado con el banco receptor.',
    AB07: 'El banco receptor se encuentra fuera de línea.',
    AC01: 'Número de cuenta incorrecto.',
    AC04: 'La cuenta bancaria se encuentra cancelada.',
    AC06: 'La cuenta bancaria está bloqueada.',
    AG01: 'Operación restringida para este tipo de cuenta.',
    AG09: 'No se pudo completar la liquidación del pago.',
    AG10: 'Entidad bancaria temporalmente suspendida.',
    AM02: 'El monto excede el límite permitido por tu banco.',
    AM04: 'Saldo insuficiente en la cuenta.',
    AM05: 'Operación duplicada. Espera unos minutos antes de intentar de nuevo.',
    BE01: 'La cédula o los datos no corresponden al titular de la cuenta.',
    CH20: 'Formato de monto inválido (debe tener dos decimales).',
    CUST: 'Operación cancelada por el titular en su aplicación bancaria.',
    DS02: 'Operación cancelada en el sistema bancario.',
    DU01: 'Identificador de transacción duplicado.',
    ED05: 'Falla en la liquidación de fondos.',
    MD01: 'No tienes afiliado el servicio de Débito Inmediato en tu banco.',
    MD09: 'Servicio de Débito Inmediato inactivo en tu banco.',
    MD15: 'Cobro no permitido por políticas de tu entidad bancaria.',
    MD22: 'Afiliación de débito suspendida.',
    RC08: 'Código de banco inválido.',
    RJCT: 'El débito inmediato fue rechazado por el banco.',
    TKCM: 'La clave dinámica (OTP) ingresada es incorrecta o expiró.',
    TM01: 'Operación realizada fuera del horario permitido.',
    VE01: 'Incidencia técnica en el procesador bancario. Intenta más tarde.'
};

function obtenerMensajeErrorR4(codigo, mensajeApi) {
    const cod = String(codigo || '').toUpperCase().trim();
    return MENSAJES_ISO_R4[cod] || mensajeApi || 'El débito inmediato fue rechazado por el banco.';
}

const validarCantidadEntera = (cantidad) => {
    const num = Number(cantidad);
    return Number.isInteger(num) && num >= 1 && num <= MAX_CANTIDAD_POR_ORDEN;
};

const normalizarIdsJuegoYJugador = (JuegoID, PlayerID) => {
    if (
        (typeof JuegoID !== 'string' && typeof JuegoID !== 'number') ||
        (typeof PlayerID !== 'string' && typeof PlayerID !== 'number')
    ) {
        return null;
    }

    const juegoIdLimpio = String(JuegoID).trim();
    const playerIdLimpio = String(PlayerID).trim();

    if (!/^\d+$/.test(juegoIdLimpio) || !playerIdLimpio || playerIdLimpio.length > 64) {
        return null;
    }

    const playerIdPayload =
        /^\d+$/.test(playerIdLimpio) && !playerIdLimpio.startsWith('0')
            ? Number(playerIdLimpio)
            : playerIdLimpio;

    return {
        juegoIdLimpio,
        juegoIdNum: Number(juegoIdLimpio),
        playerIdLimpio,
        playerIdPayload
    };
};

// =========================================================================
// BILLETERA Y CATÁLOGO
// =========================================================================
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

GamesRouter.get("/", async (request, response) => {
    try {
        const nombresBuscados = ['arena breakout', 'call of duty', "Discord", "genshin impact", "Oxide", "AceCraft", "Asphalt 9","Roblox",];
        const regexPattern = new RegExp(nombresBuscados.join('|'), 'i');

        const juegos = await GamePrincipal.find({
            name: { $regex: regexPattern }
        }).lean();

        return response.json(juegos);
    } catch (error) {
        return response.status(500).json({ error: 'An error occurred' });
    }
});

// =========================================================================
// CÁLCULO DE COSTES Y GANANCIA (Única fuente de verdad)
// =========================================================================
function CalculoComisionConIvaReal(costoUsdt, gananciaPct, tasaP2p, comisionPasarela = 0.02, iva = 0.16) {
    const usdtNetoObjetivo = costoUsdt * (1 + gananciaPct);
    const bsParaBinance = usdtNetoObjetivo * tasaP2p;
    const gananciaBs = (costoUsdt * gananciaPct) * tasaP2p;
    const ivaSobreGanancia = gananciaBs * iva;

    const totalNecesario = bsParaBinance + ivaSobreGanancia;
    const precioFinalBs = totalNecesario / (1 - comisionPasarela);

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

// =========================================================================
// BINANCE TASA P2P Y VIGILANTE EN MONGODB
// =========================================================================
let ultimaTasaAltaConocida = null;

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
            if (esErrorTransitorioMongo(error)) {
                console.warn("⚠️ Reconexión transitoria con MongoDB al guardar tasa P2P.");
            } else {
                console.error("❌ Error guardando tasa P2P en MongoDB:", error.message);
            }
        } finally {
            ejecutando = false;
        }
    };

    actualizarEnMongo();
    const intervalo = setInterval(actualizarEnMongo, INTERVALO_MS);
    intervalo.unref();
};

async function consultarTasaExterna() {
    const TIMEOUT_MS = 8000;

    async function fetchConTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            return await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error(`Timeout de ${timeoutMs}ms excedido`);
            }
            throw err;
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

async function obtenerTasaBinanceAlta() {
    try {
        const registro = await Tasa.findOne({ nombre: "P2P" }).lean();
        const esReciente =
            registro?.ultimaActualizacion &&
            (Date.now() - new Date(registro.ultimaActualizacion).getTime()) <= MAX_ANTIGUEDAD_TASA_MS;

        if (registro && Number.isFinite(registro.valor) && registro.valor > 0 && esReciente) {
            ultimaTasaAltaConocida = registro.valor;
            return registro.valor;
        }

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

        if (registro && Number.isFinite(registro.valor) && registro.valor > 0) {
            return registro.valor;
        }
    } catch (error) {
        console.warn("⚠️ Error leyendo tasa P2P de MongoDB, usando respaldo en memoria:", error.message);
    }

    if (Number.isFinite(ultimaTasaAltaConocida) && ultimaTasaAltaConocida > 0) {
        return ultimaTasaAltaConocida;
    }

    return null;
}

// =========================================================================
// PRODUCTOS POR JUEGO, VALIDACIÓN DE JUGADOR E HISTORIAL
// =========================================================================
GamesRouter.get("/1/:name", async (request, response) => {
    try {
        const externalIdNum = Number(request.params.name);

        if (!Number.isInteger(externalIdNum) || externalIdNum <= 0) {
            return response.status(400).json({ error: "ID de juego inválido" });
        }

        const juego = await GamePrincipal.findOne({ external_id: externalIdNum }).lean();
        if (!juego) {
            return response.status(404).json({ error: "Juego principal no encontrado" });
        }
    
 let  subcategoria = null;
if ( externalIdNum === 1042) {
      subcategoria = await GameModel.findById("6af262cb39b04d88a8ee1c5c").lean();
} else {
       subcategoria = await GameModel.findOne({ game_principal: juego._id }).lean();   
}
     console.log("SE INICIO")
        if (!subcategoria) {
            return response.status(404).json({ error: "Subcategoría no encontrada" });
        }


             
    const productos = await Producto_Model.find({
            category_id: subcategoria.external_id,
            is_available: 
            true
        }).lean();
             
        

        if (!productos.length) {
            return response.status(404).json({ error: "No hay productos disponibles" });
        }

        const tasaBinanceReal = await obtenerTasaBinanceAlta();
        const usandoRespaldo = !(Number.isFinite(tasaBinanceReal) && tasaBinanceReal > 0);
        const tasaProtegida = usandoRespaldo ? TASA_RESPALDO_DEFAULT : Number(tasaBinanceReal);

        if (usandoRespaldo) {
            console.warn("⚠️ Usando tasa de respaldo por fallo al obtener tasa P2P");
        }

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

async function desactivarProductoNoDisponible(ids) {
    await Producto_Model.updateMany(
        {
            $or: [
                { external_id: ids.juegoIdLimpio },
                { external_id: ids.juegoIdNum }
            ]
        },
        { $set: { is_available: false } }
    );
}

GamesRouter.post("/PlayerID", userExtractor, async (request, response) => {
    try {
        const { PlayerID, JuegoID } = request.body || {};
        const ids = normalizarIdsJuegoYJugador(JuegoID, PlayerID);

        if (!ids) {
            return response.status(400).json({ success: false, error: 'JuegoID o PlayerID inválido' });
        }

        const { data } = await httpClient.post(
            "https://shop2topup.com/api/endpoints/v1/player/validate",
            {
                sub_category_id: ids.juegoIdNum,
                player_id: ids.playerIdPayload
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // Si Shop2TopUp responde HTTP 200 pero con error en el cuerpo
        if (data?.success === false || data?.error) {
            const errorCode = data?.error?.code;

            if (errorCode === 'PRODUCT_UNAVAILABLE') {
                await desactivarProductoNoDisponible(ids).catch((dbErr) => {
                    console.error("❌ Error desactivando producto en BD:", dbErr.message);
                });
                return response.status(503).json({
                    success: false,
                    code: 'PRODUCT_UNAVAILABLE',
                    error: 'Este producto no está disponible temporalmente. Intenta más tarde.',
                    redirect: '/'
                });
            }

            return response.status(400).json({
                success: false,
                code: errorCode || 'VALIDATION_ERROR',
                error: data?.error?.message || 'No se pudo validar el jugador'
            });
        }

        return response.json({
            success: true,
            playerInfo: data
        });
    } catch (error) {
        const providerData = error.response?.data;
        const providerError = providerData?.error;
        const errorCode = providerError?.code;

        console.error("DETALLE DEL ERROR EN BACKEND:", providerData || error.message);

        // Si Shop2TopUp responde con código HTTP 4xx/5xx y PRODUCT_UNAVAILABLE
        if (errorCode === 'PRODUCT_UNAVAILABLE') {
            const { PlayerID, JuegoID } = request.body || {};
            const ids = normalizarIdsJuegoYJugador(JuegoID, PlayerID);
            if (ids) {
                await desactivarProductoNoDisponible(ids).catch((dbErr) => {
                    console.error("❌ Error desactivando producto en BD:", dbErr.message);
                });
            }

            return response.status(503).json({
                success: false,
                code: 'PRODUCT_UNAVAILABLE',
                error: 'Este producto no está disponible temporalmente. Intenta más tarde.',
                redirect: '/'
            });
        }

        return response.status(error.response?.status || 500).json({
            success: false,
            error: providerError?.message || 'Ocurrió un error al validar el jugador',
            detalle: providerData || error.message
        });
    }
});

GamesRouter.get("/Ordenes_Recargas", userExtractor, async (request, response) => {
    try {
        const user = request.user;
        if (!user) {
            return response.status(401).json({ error: 'Usuario no autenticado' });
        }

        const Transferencia = await Trasferencia_Model.find({
            responsable: user._id,
            estatus: { $ne: 'OTP_SOLICITADO' }
        })
            .sort({ createdAt: -1 })
            .lean();

        return response.json({
            Transferencia: Transferencia || []
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR EN BACKEND:", error);
        return response.status(500).json({ error: 'Ocurrió un error', detalle: error.message });
    }
});

// =========================================================================
// COMPRA CON BILLETERA INTERNA
// =========================================================================
GamesRouter.post("/Compra", userExtractor, async (request, response) => {
    let saldoDescontado = 0;
    let userIdActual = null;

    try {
        const user = request.user;
        if (!user) {
            return response.status(401).json({ error: 'Usuario no autenticado' });
        }
        userIdActual = user._id;

        const { Metodo, PlayerID, JuegoID, Cantidad } = request.body || {};

        if (!Metodo || !PlayerID || !JuegoID || Cantidad === undefined) {
            return response.status(400).json({ error: 'Faltan datos obligatorios en la solicitud' });
        }

        const ids = normalizarIdsJuegoYJugador(JuegoID, PlayerID);
        if (!ids) {
            return response.status(400).json({ error: 'JuegoID o PlayerID inválido' });
        }

        if (!validarCantidadEntera(Cantidad)) {
            return response.status(400).json({
                error: `La cantidad debe ser un número entero entre 1 y ${MAX_CANTIDAD_POR_ORDEN}`
            });
        }

        const cantidadEntera = Number(Cantidad);

        // 1. Validar jugador con Shop2TopUp
        let validacionData;
        try {
            const respVal = await httpClient.post(
                "https://shop2topup.com/api/endpoints/v1/player/validate",
                {
                    sub_category_id: ids.juegoIdNum,
                    player_id: ids.playerIdPayload
                },
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            validacionData = respVal.data;
        } catch (valErr) {
            if (valErr.response?.data?.error?.code === 'PRODUCT_UNAVAILABLE') {
                await desactivarProductoNoDisponible(ids).catch(() => {});
                return response.status(503).json({
                    success: false,
                    code: 'PRODUCT_UNAVAILABLE',
                    error: 'Este producto no está disponible temporalmente.',
                    redirect: '/'
                });
            }
            throw valErr;
        }

        if (validacionData?.error?.code === 'PRODUCT_UNAVAILABLE') {
            await desactivarProductoNoDisponible(ids).catch(() => {});
            return response.status(503).json({
                success: false,
                code: 'PRODUCT_UNAVAILABLE',
                error: 'Este producto no está disponible temporalmente.',
                redirect: '/'
            });
        }

        if (!validacionData || !validacionData.success) {
            return response.status(404).json({ error: 'Jugador no válido o ID incorrecto en el juego.' });
        }

        if (Metodo === "Pagomovil") {
            return response.status(400).json({ error: 'Usa /solicitar-otp y /confirmar-c2p para Débito Inmediato.' });
        }

        if (Metodo !== "Billetera") {
            return response.status(400).json({ error: 'Método de pago no válido' });
        }

        // 2. Buscar producto disponible y calcular precio al público
        const Producto = await Producto_Model.findOne({
            $or: [
                { external_id: ids.juegoIdLimpio },
                { external_id: ids.juegoIdNum }
            ],
            is_available: true
        }).lean();

        if (!Producto) {
            return response.status(404).json({ error: 'Producto no disponible en el catálogo.' });
        }

        const tasaRef = Number(await obtenerTasaBinanceAlta()) || TASA_RESPALDO_DEFAULT;
        const { precioProveedorUsd, precioFinalUsd } = calcularPreciosProducto(Producto, tasaRef);

        if (precioFinalUsd <= 0 || precioProveedorUsd <= 0) {
            return response.status(400).json({ error: 'El producto tiene un precio inválido.' });
        }

        const costoTotal = redondear2(precioFinalUsd * cantidadEntera);

        // 3. Descuento atómico ANTES de llamar al proveedor
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
        const orderId = crypto.randomUUID();

        // 3.5 Registrar la orden en BD ANTES de llamar a Shop2TopUp
        const txBilletera = await Trasferencia_Model.create({
            telefono: user.telefono || 'N/A',
            telefonoEmisor: user.telefono || 'N/A',
            cedula: user.cedula || 'N/A',
            bancoEmisor: 'Billetera Interna',
            Producto: Producto.name,
            juegoId: ids.juegoIdNum,
            playerId: ids.playerIdLimpio,
            Cantidad: cantidadEntera,
            precioUnitarioUsd: precioProveedorUsd,
            monto: costoTotal,
            concepto: `Compra de ${cantidadEntera}x ${Producto.name || 'Diamantes/Ítem'} para ID: ${ids.playerIdLimpio}`,
            referencia: orderId,
            responsable: user._id,
            uuid: orderId,
            proveedorRequestId: orderId,
            ordenProcesada: false,
            utilizado: true,
            estatus: 'ENVIANDO_PROVEEDOR',
            tipoTransaccion: 'Billetera'
        });

        // 4. Crear el pedido en Shop2TopUp
        let orderData;
        try {
            const resp = await httpClient.post(
                "https://shop2topup.com/api/endpoints/v1/orders/create",
                {
                    order_id: orderId,
                    sub_category_id: ids.juegoIdNum,
                    quantity: cantidadEntera,
                    requirements: {
                        player_id: ids.playerIdLimpio
                    },
                    expected_unit_price: precioProveedorUsd
                },
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            orderData = resp.data;
        } catch (provError) {
            const statusHttp = provError.response?.status;
            const esRechazoDefinitivo =
                statusHttp && statusHttp >= 400 && statusHttp < 500 && statusHttp !== 408 && statusHttp !== 429;

            if (esRechazoDefinitivo) {
                await Trasferencia_Model.updateOne(
                    { _id: txBilletera._id },
                    {
                        $set: {
                            estatus: 'REEMBOLSADO',
                            detalleError: `Proveedor rechazó la recarga (HTTP ${statusHttp}). Saldo devuelto.`
                        }
                    }
                );
                await acreditarSaldoBilletera(
                    user._id,
                    saldoDescontado,
                    `Reversión por rechazo del proveedor en /Compra (HTTP ${statusHttp})`
                );
                saldoDescontado = 0;
                return response.status(400).json({
                    error: provError.response?.data?.message || 'El proveedor rechazó la recarga. Saldo devuelto a tu billetera.'
                });
            }

            // Timeout o error 5xx: marcar para revisión manual antes de reembolsar
            saldoDescontado = 0;
            await Trasferencia_Model.updateOne(
                { _id: txBilletera._id },
                {
                    $set: {
                        estatus: 'REVISION_MANUAL',
                        detalleError: `Error ambiguo con proveedor en /Compra: ${provError.message}`
                    }
                }
            );

            return response.status(202).json({
                success: true,
                mensaje: 'Tu pago con billetera fue procesado y la recarga está siendo verificada.'
            });
        }

        if (!orderData || !orderData.success) {
            await Trasferencia_Model.updateOne(
                { _id: txBilletera._id },
                {
                    $set: {
                        estatus: 'REEMBOLSADO',
                        detalleError: 'Rechazo inmediato en /Compra. Saldo devuelto.'
                    }
                }
            );
            await acreditarSaldoBilletera(user._id, saldoDescontado, 'Reversión por rechazo inmediato en /Compra');
            saldoDescontado = 0;
            return response.status(500).json({ error: 'Error al procesar el pedido con el proveedor', detalle: orderData });
        }

        saldoDescontado = 0;
        const estadoProveedor = orderData.order?.status || 'pending';
        const proveedorOrderId = String(orderData.order?.order_id || orderId).trim();

        await Trasferencia_Model.updateOne(
            { _id: txBilletera._id },
            {
                $set: {
                    referencia: proveedorOrderId,
                    proveedorOrderId: proveedorOrderId,
                    ordenProcesada: true,
                    estatus: estadoProveedor === 'completed' ? 'APROBADO' : 'PENDIENTE'
                }
            }
        );

        return response.json({
            success: true,
            mensaje: "Pedido creado con éxito",
            order: orderData.order
        });
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

// =========================================================================
// WEBHOOK SHOP2TOPUP
// =========================================================================
GamesRouter.post("/webhook/shop2topup", async (request, response) => {
    try {
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

        if (tipoEvento === 'order.completed' || tipoEvento === 'completed') {
            if (transaccion.estatus !== 'APROBADO') {
                await Trasferencia_Model.updateOne(
                    { _id: transaccion._id, estatus: { $nin: ['APROBADO', 'REEMBOLSADO'] } },
                    { $set: { estatus: 'APROBADO', proveedorOrderId: orderId } }
                );
                console.log(`✅ Pedido ${orderId} marcado como APROBADO.`);
            }
        } else if (['order.refunded', 'failed', 'refunded', 'cancelled', 'canceled', 'rejected'].includes(tipoEvento)) {
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
const verificarCredenciales = () => {
    if (!R4_COMMERCE) {
        throw new Error('❌ Falta R4_COMMERCE_ID o R4_COMMERCE_TOKEN en las variables de entorno (.env)');
    }
};

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

function compararTokensSeguro(tokenRecibido, tokenEsperado) {
    if (!tokenRecibido || !tokenEsperado) return false;
    const bufA = Buffer.from(String(tokenRecibido), 'utf8');
    const bufB = Buffer.from(String(tokenEsperado), 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

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
// GESTIÓN DE BILLETERA Y DESPACHO IDEMPOTENTE AL PROVEEDOR
// =========================================================================
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
            (statusHttp && statusHttp >= 400 && statusHttp < 500 && statusHttp !== 408 && statusHttp !== 429);

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
// PASO 1: SOLICITAR OTP (POST /GenerarOtp)
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

        const ids = normalizarIdsJuegoYJugador(JuegoID, PlayerID);
        if (!ids) {
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
        console.log(`🎮 [OTP-${reqId}] Validando jugador en Shop2TopUp...`, {
            sub_category_id: ids.juegoIdNum,
            player_id: ids.playerIdPayload
        });

        let validacionData;
        try {
            const respVal = await httpClient.post(
                'https://shop2topup.com/api/endpoints/v1/player/validate',
                {
                    sub_category_id: ids.juegoIdNum,
                    player_id: ids.playerIdPayload
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.SHOP2TOPUP_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            validacionData = respVal.data;
        } catch (valErr) {
            if (valErr.response?.data?.error?.code === 'PRODUCT_UNAVAILABLE') {
                await desactivarProductoNoDisponible(ids).catch(() => {});
                return response.status(503).json({
                    success: false,
                    code: 'PRODUCT_UNAVAILABLE',
                    error: 'Este producto no está disponible temporalmente.',
                    redirect: '/'
                });
            }
            throw valErr;
        }

        if (validacionData?.error?.code === 'PRODUCT_UNAVAILABLE') {
            await desactivarProductoNoDisponible(ids).catch(() => {});
            return response.status(503).json({
                success: false,
                code: 'PRODUCT_UNAVAILABLE',
                error: 'Este producto no está disponible temporalmente.',
                redirect: '/'
            });
        }

        if (!validacionData?.success) {
            return response.status(404).json({
                success: false,
                error: 'Jugador no válido o ID incorrecto en el juego.'
            });
        }

        // 2. Buscar producto disponible y calcular monto exacto usando la misma fórmula del catálogo
        const Producto = await Producto_Model.findOne({
            $or: [
                { external_id: ids.juegoIdLimpio },
                { external_id: ids.juegoIdNum }
            ],
            is_available: true
        }).lean();

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
                juegoId: ids.juegoIdNum,
                playerId: ids.playerIdLimpio,
                Cantidad: cantidadEntera,
                precioUnitarioUsd: precioProveedorUsd,
                monto: costoTotalUsd,
                montoVES: montoVESNum,
                montoVESString: montoFormateado,
                concepto: `Compra de ${cantidadEntera}x ${Producto.name} para ID: ${ids.playerIdLimpio}`,
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
// PASO 2: EJECUTAR DÉBITO INMEDIATO (POST /DebitoInmediato)
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
        const mensajeLegible = obtenerMensajeErrorR4(codigoR4, mensaje || message);
        transaccion.estatus = 'RECHAZADO';
        transaccion.codigoErrorR4 = codigoR4 || 'RJCT';
        transaccion.detalleError = mensajeLegible;
        await transaccion.save();

        return response.status(400).json({
            success: false,
            error: mensajeLegible,
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
                const mensajeErr = obtenerMensajeErrorR4(codigoErr, dataError?.mensaje || dataError?.message);

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
// PASO 3: WEBHOOK ASÍNCRONO R4 (POST /SIMF)
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
                        detalleError: obtenerMensajeErrorR4(codigoNorm, message)
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
// PASO 4: CONSULTA DE RESPALDO Y VERIFICACIÓN DE ESTADOS R4
// =========================================================================
async function consultarEstatusOperacionR4(r4Uuid) {
    verificarCredenciales();
    const uuidLimpio = String(r4Uuid).trim();
    const tokenAuthorization = generarFirmaR4(uuidLimpio);

    const { data } = await r4HttpClient.post(
        `${R4_BASE_URL}/ConsultarOperaciones`,
        { Id: uuidLimpio },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: tokenAuthorization,
                Commerce: R4_COMMERCE
            }
        }
    );

    return data;
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
                    detalleError: obtenerMensajeErrorR4(codigoR4, resultadoR4?.mensaje || resultadoR4?.message)
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
// VIGILANTES AUTOMÁTICOS (R4 CONECTA + PROVEEDOR DE RECARGAS)
// =========================================================================
const iniciarVigilantePendientesR4 = () => {
    if (!esWorkerPrincipal()) return;

    const INTERVALO_MS = 5 * 60 * 1000;            // Revisar cada 5 minutos
    const ARRANQUE_INICIAL_MS = 20 * 1000;         // Primera pasada 20s tras iniciar el servidor
    const ANTIGUEDAD_MINIMA_MS = 5 * 60 * 1000;    // Esperar 5 min a que llegue el webhook /SIMF
    const ANTIGUEDAD_MAXIMA_MS = 30 * 60 * 1000;   // Fin de consultas frecuentes en R4 (30 min)
    const RESCATE_TARDIO_MS = 2 * 60 * 60 * 1000;  // Consulta de respaldo a partir de las 2 horas
    const EXPIRACION_24H_MS = 24 * 60 * 60 * 1000; // Expirar definitivamente tras 24 horas
    const MAX_INTENTOS_RESCATE = 5;

    let ejecutando = false;

    const ejecutarCiclo = async () => {
        if (ejecutando) return;
        ejecutando = true;

        try {
            const ahora = Date.now();
            const limiteMinimo = new Date(ahora - ANTIGUEDAD_MINIMA_MS);
            const limiteMaximo = new Date(ahora - ANTIGUEDAD_MAXIMA_MS);
            const limiteRescateTardio = new Date(ahora - RESCATE_TARDIO_MS);
            const limiteExpiracion = new Date(ahora - EXPIRACION_24H_MS);

            // 1A. Marcar para revisión órdenes colgadas por reinicio en envío a R4 o al proveedor (> 3 min)
            await Trasferencia_Model.updateMany(
                {
                    tipoTransaccion: 'DebitoInmediato',
                    estatus: { $in: ['ENVIANDO_PROVEEDOR', 'PROCESANDO_R4'] },
                    updatedAt: { $lte: new Date(ahora - 3 * 60 * 1000) }
                },
                {
                    $set: {
                        estatus: 'REVISION_MANUAL',
                        detalleError: 'Proceso interrumpido durante comunicación externa. Verificar estado en R4/proveedor antes de reembolsar.'
                    }
                }
            );

            // 1B. Detectar anomalías: órdenes en EN_ESPERA_SIMF sin UUID válido tras 3 minutos
            await Trasferencia_Model.updateMany(
                {
                    tipoTransaccion: 'DebitoInmediato',
                    estatus: 'EN_ESPERA_SIMF',
                    $or: [{ uuid: { $exists: false } }, { uuid: null }, { uuid: '' }],
                    updatedAt: { $lte: new Date(ahora - 3 * 60 * 1000) }
                },
                {
                    $set: {
                        estatus: 'REVISION_MANUAL',
                        detalleError: 'Operación en espera de SIMF sin UUID de R4 registrado.'
                    }
                }
            );

            // 2. Rescatar órdenes ya aprobadas por R4 (DEBITO_APROBADO) que no llegaron a despacharse
            const aprobadasSinDespachar = await Trasferencia_Model.find({
                tipoTransaccion: 'DebitoInmediato',
                estatus: 'DEBITO_APROBADO',
                utilizado: { $ne: true },
                ordenProcesada: { $ne: true },
                updatedAt: { $lte: new Date(ahora - 60 * 1000) }
            })
                .sort({ createdAt: 1 })
                .limit(10);

            for (const tx of aprobadasSinDespachar) {
                const intentos = (tx.intentosRescate || 0) + 1;

                if (intentos > MAX_INTENTOS_RESCATE) {
                    await Trasferencia_Model.updateOne(
                        { _id: tx._id, estatus: 'DEBITO_APROBADO' },
                        {
                            $set: {
                                estatus: 'REVISION_MANUAL',
                                detalleError: `Superado límite de ${MAX_INTENTOS_RESCATE} intentos automáticos de despacho.`
                            }
                        }
                    );
                    continue;
                }

                try {
                    const marcado = await Trasferencia_Model.updateOne(
                        {
                            _id: tx._id,
                            estatus: 'DEBITO_APROBADO',
                            utilizado: { $ne: true },
                            ordenProcesada: { $ne: true }
                        },
                        { $inc: { intentosRescate: 1 } }
                    );
                    if (marcado.modifiedCount === 0) continue; // Ya fue tomada por otro proceso

                    await ejecutarDespachoSeguro(tx._id);
                } catch (err) {
                    console.error(`❌ Error rescatando despacho TX ${tx._id} (intento ${intentos}):`, err.message);
                }
            }

            // 3. Consultar en R4 operaciones pendientes de confirmación (AC00 / EN_ESPERA_SIMF)
            const pendientes = await Trasferencia_Model.find({
                tipoTransaccion: 'DebitoInmediato',
                estatus: 'EN_ESPERA_SIMF',
                utilizado: { $ne: true },
                ordenProcesada: { $ne: true },
                uuid: { $exists: true, $nin: [null, ''] },
                $or: [
                    // Tramo 1: Consultas regulares entre el minuto 5 y el minuto 30
                    { createdAt: { $lte: limiteMinimo, $gte: limiteMaximo } },
                    // Tramo 2: Rescate garantizado a partir de las 2 horas (incluye órdenes > 24h antes de expirar)
                    {
                        createdAt: { $lte: limiteRescateTardio },
                        rescateTardioRealizado: { $ne: true }
                    }
                ]
            })
                .sort({ createdAt: 1 })
                .limit(15);

            for (const tx of pendientes) {
                const esRescateTardio = tx.createdAt <= limiteRescateTardio;
                try {
                    await verificarYProcesarOperacionR4(tx.uuid);

                    // Solo cerramos el rescate tardío si R4 respondió sin error de red/timeout
                    if (esRescateTardio) {
                        await Trasferencia_Model.updateOne(
                            { _id: tx._id },
                            { $set: { rescateTardioRealizado: true } }
                        );
                    }
                } catch (txError) {
                    console.error(`❌ Error verificando UUID ${tx.uuid}:`, txError.response?.data || txError.message);

                    // Si falla por red/timeout en el rescate tardío, permitir 1 reintento más antes de cerrar
                    if (esRescateTardio) {
                        const fallosTardios = (tx.intentosRescate || 0) + 1;
                        await Trasferencia_Model.updateOne(
                            { _id: tx._id },
                            {
                                $inc: { intentosRescate: 1 },
                                ...(fallosTardios >= 2 ? { $set: { rescateTardioRealizado: true } } : {})
                            }
                        );
                    }
                }
            }

            // 4. Expirar operaciones sin respuesta tras 24h reales (y solicitudes de OTP abandonadas)
            await Trasferencia_Model.updateMany(
                {
                    tipoTransaccion: 'DebitoInmediato',
                    estatus: { $in: ['EN_ESPERA_SIMF', 'OTP_SOLICITADO', 'PENDIENTE'] },
                    utilizado: { $ne: true },
                    ordenProcesada: { $ne: true },
                    createdAt: { $lt: limiteExpiracion }
                },
                {
                    $set: {
                        estatus: 'RECHAZADO',
                        detalleError: 'Tiempo máximo de espera (24h) excedido sin confirmación de R4.'
                    }
                }
            );
        } catch (error) {
            if (esErrorTransitorioMongo(error)) {
                console.warn('⚠️ Reconexión transitoria con MongoDB Atlas en vigilante R4 (reintentará en 5m).');
            } else {
                console.error('❌ Error general en vigilante R4:', error.message);
            }
        } finally {
            ejecutando = false;
        }
    };

    setTimeout(ejecutarCiclo, ARRANQUE_INICIAL_MS);

    const intervalo = setInterval(ejecutarCiclo, INTERVALO_MS);
    intervalo.unref();
};

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
                        try {
                            await acreditarSaldoBilletera(
                                txReembolsada.responsable,
                                redondear2(txReembolsada.monto),
                                `Orden proveedor ${orderId} (${estadoProveedor})`
                            );
                        } catch (walletErr) {
                            await Trasferencia_Model.updateOne(
                                { _id: txReembolsada._id },
                                {
                                    $set: {
                                        estatus: 'REVISION_MANUAL',
                                        detalleError: `Fallo al reembolsar $${txReembolsada.monto} USD: ${walletErr.message}`
                                    }
                                }
                            );
                        }
                    }
                }
                // C. Entrega parcial -> Reembolso proporcional del monto pagado por el cliente
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

                        const precioUnitarioCliente = redondear2(tx.monto / (tx.Cantidad || 1));
                        const montoReembolsoUsd = redondear2(unidadesReembolsadas * precioUnitarioCliente);

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
                            try {
                                await acreditarSaldoBilletera(
                                    txParcial.responsable,
                                    montoReembolsoUsd,
                                    `Reembolso parcial orden ${orderId}`
                                );
                            } catch (walletErr) {
                                await Trasferencia_Model.updateOne(
                                    { _id: txParcial._id },
                                    {
                                        $set: {
                                            estatus: 'REVISION_MANUAL',
                                            detalleError: `Fallo al acreditar reembolso parcial ($${montoReembolsoUsd.toFixed(2)} USD): ${walletErr.message}`
                                        }
                                    }
                                );
                            }
                        }
                    } catch (partialErr) {
                        console.error(`❌ Error detalle parcial orden ${orderId}:`, partialErr.message);
                    }
                }
            }
        } catch (error) {
            if (esErrorTransitorioMongo(error)) {
                console.warn('⚠️ Reconexión transitoria con MongoDB Atlas en vigilante Shop2TopUp (reintentará en 6m).');
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