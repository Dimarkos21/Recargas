const ProveedorRouter = require('express').Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// Modelos necesarios 
const User = require('../models/user'); 

const roleChecker = require('../middleware/roleChecker'); 
// =================================================================
// RUTA POST /empleados (Crear Empleado)
// =================================================================
ProveedorRouter.post('/PDF', roleChecker(['Propietario', 'Administrador']), async (req, res) => {
    try {
        // 1. Validaciones de Seguridad
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "Usuario no autenticado." });
        }
        
        const negocioId = req.user.negocio[0];
        if (!negocioId) {
            return res.status(400).json({ error: "No se encontró el negocio asociado." });
        }

        // 2. Verificar si viene el archivo (asumiendo express-fileupload o multer)
        if (!req.files || !req.files.listaPdf) {
            return res.status(400).json({ error: "No se subió ningún archivo PDF." });
        }

        const archivoPdf = req.files.listaPdf;

        // 3. Preparar los datos para el microservicio de Python (app.py)
        const form = new FormData();
        // Pasamos el buffer del archivo directamente sin guardar en disco
        form.append('file', archivoPdf.data, {
            filename: archivoPdf.name,
            contentType: 'application/pdf',
        });

        console.log(`⏳ Enviando "${archivoPdf.name}" al motor de extracción Python...`);

        // 4. Llamada al servicio de Python (el que tienes en el puerto 5000)
        const responsePython = await axios.post('http://localhost:5000/procesar-lista', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        const productosExtraidos = responsePython.data;

        // 5. Respuesta al Frontend
        // Aquí enviamos los datos procesados para que el cliente los vea en una tabla
        // antes de guardarlos definitivamente en la base de datos de productos.
        res.json({
            mensaje: "PDF procesado correctamente",
            proveedor_detectado: productosExtraidos.length > 0 ? "Detectado" : "Desconocido",
            total_items: productosExtraidos.length,
            productos: productosExtraidos // Esto contiene [{seccion, detalle, valor}, ...]
        });

    } catch (error) {
        console.error("❌ ERROR PROCESANDO PDF:", error.message);
        res.status(500).json({ 
            error: "Error al procesar el PDF", 
            detalles: error.response ? error.response.data : "Motor Python fuera de línea" 
        });
    }
});
module.exports = ProveedorRouter;