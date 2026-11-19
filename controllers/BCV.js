const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const TasaModel = require('../models/tasaBcv.js');

// Configuración de agente para saltar errores de SSL en BCV (muy común en sus servidores)
const agent = new https.Agent({ rejectUnauthorized: false });

const obtenerTasaBCV = async (req, res) => {
    const AHORA = new Date();
    const CINCO_HORAS = 5 * 60 * 60 * 1000;

    try {
        // 1. Intentar obtener la tasa actual de MongoDB
        let tasaDoc = await TasaModel.findOne({ nombre: "BCV" });

        // Verificar si existe y si sigue vigente (menos de 5 horas)
        const esMuyVieja = !tasaDoc || (AHORA - new Date(tasaDoc.ultimaActualizacion) > CINCO_HORAS);

        if (!esMuyVieja) {
            console.log("✅ Tasa vigente encontrada en MongoDB.");
            return res.json({
                success: true,
                valor: tasaDoc.valor,
                fuente: "Base de Datos (Caché)",
                ultimaActualizacion: tasaDoc.ultimaActualizacion
            });
        }

        // 2. Si es vieja o no existe, intentamos actualizar
        console.log("🔄 Tasa expirada o inexistente. Intentando actualizar...");
        let nuevaTasa = null;
        let fuenteUsada = null;

        // --- INTENTO A: Web Scraping BCV ---
        try {
            console.log("🌐 Consultando BCV...");
            const responseBCV = await axios.get('https://www.bcv.org.ve/', {
                httpsAgent: agent,
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const $ = cheerio.load(responseBCV.data);
            const tasaRaw = $('#dolar strong').text().trim();
            if (tasaRaw) {
                nuevaTasa = parseFloat(tasaRaw.replace(',', '.'));
                fuenteUsada = "BCV (Scraping)";
            }
        } catch (e) {
            console.error("⚠️ BCV falló:", e.message);
        }

        // --- INTENTO B: API Respaldo (Si falló el scraping) ---
        if (!nuevaTasa) {
            try {
                console.log("🔄 Consultando DolarAPI (Respaldo)...");
                const { data } = await axios.get('https://ve.dolarapi.com/v1/cotizaciones', { timeout: 8000 });
                const oficial = data.find(t => t.nombre.toLowerCase().includes('oficial')) || data[0];
                nuevaTasa = oficial.promedio;
                fuenteUsada = "DolarAPI (Respaldo)";
            } catch (e2) {
                console.error("❌ Falló el respaldo:", e2.message);
            }
        }

        // 3. Procesar resultados de la actualización
        if (nuevaTasa && !isNaN(nuevaTasa)) {
            // Guardar en MongoDB
            tasaDoc = await TasaModel.findOneAndUpdate(
                { nombre: "BCV" },
                { valor: nuevaTasa, ultimaActualizacion: AHORA },
                { upsert: true, new: true }
            );
            console.log(`✅ Tasa actualizada a ${nuevaTasa} (${fuenteUsada})`);
        } else {
            // 4. Si todo falló, verificar si tenemos datos antiguos para usar como emergencia
            if (tasaDoc) {
                console.log("⚠️ Fuentes externas caídas. Usando último registro disponible en BD.");
                return res.json({
                    success: true,
                    valor: tasaDoc.valor,
                    warning: "Usando tasa desactualizada por falla de fuentes externas",
                    ultimaActualizacion: tasaDoc.ultimaActualizacion
                });
            } else {
                throw new Error("No hay datos en BD ni conexión a las fuentes externas.");
            }
        }

        // Respuesta final exitosa
        return res.json({
            success: true,
            valor: tasaDoc.valor,
            fuente: fuenteUsada,
            ultimaActualizacion: tasaDoc.ultimaActualizacion
        });

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error.message);
        return res.status(500).json({
            success: false,
            error: "Error interno al procesar la tasa",
            detalle: error.message
        });
    }
};

module.exports = { obtenerTasaBCV };

