const negociosRouter = require('express').Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// Modelos necesarios 
const User = require('../models/user'); 
const Negocio = require('../models/negocio'); 
const roleChecker = require('../middleware/roleChecker'); 
const nodemailer = require('nodemailer');
const { Resend } = require ("resend");
const resend = new Resend(process.env.EMAIL_PASS);
const multer = require("multer");
const checkPlan = require('../middleware/VerificacionPlanes');
// =================================================================
// RUTA POST /empleados (Crear Empleado)
// =================================================================
negociosRouter.post(
  "/empleados",
  roleChecker(['Propietario', 'Administrador']),
  async (request, response) => {
    // 🔐 Verificación de autenticación
    if (!request.user || !request.user._id) {
      return response.status(401).json({ error: "No autenticado. Por favor, inicie sesión." });
    }

    try {
      const { name, email, password, numero, Cedula, role, Sucursal } = request.body;

      // 1. Validación de campos requeridos (incluyendo la sucursal de forma segura)
      if (!name || !email || !password || !numero || !Cedula) {
        return response.status(400).json({ error: "Todos los campos son requeridos." });
      }

      if (!Sucursal) { 
        return response.status(403).json({ error: "Propietario por favor agregar una sucursal parte derecha 👍" });
      }
      if (!role){
            return response.status(400).json({ error: "Todos los campos son requeridos. (role)" });
      }

      // 2. Obtener el negocio principal del usuario autenticado
      const negocioId = Array.isArray(request.user.negocio) && request.user.negocio.length > 0
        ? request.user.negocio[0]
        : null;

      if (!negocioId) {
        
        return response.status(403).json({ error: "El usuario no está asociado a un negocio principal." });
      }
      const negocioPermisos = await Negocio.findOne({_id : negocioId});
      
            
           
  const totalEmpleados = await  User.countDocuments({ 
                negocio: negocioId, 
             
            });

                   if (totalEmpleados >= negocioPermisos.permisos.Empleados) { // Límite de plan básico
                      return response.status(403).json({ 
                          error: "Límite de plan alcanzado",
                          detalle: `Tu plan básico permite un máximo de ${negocioPermisos.permisos.Empleados} productos activos.` 
                      });
                  }
          
        
      // 3. Verificar si el usuario ya existe en la base de datos global
      const userExist = await User.findOne({ email });

      if (userExist) {
        // Comprobamos si el usuario ya tiene un negocio activo asignado
        const tieneNegocioActivo = Array.isArray(userExist.negocio) && 
          userExist.negocio.some(idNegocio => idNegocio !== null && idNegocio !== undefined);

        if (tieneNegocioActivo) {
          return response.status(409).json({ 
            error: "El usuario ya se encuentra vinculado y trabajando en otro negocio activo." 
          });
        }

        // Si no tiene negocio activo, lo vinculamos a tu negocio actual
        const rolAsignado = role || "Vendedor";
        const resultado = await User.updateOne(
          { _id: userExist._id },
          { 
            $set: { 
              sucursal: Sucursal, 
              rol: rolAsignado,
              negocio: [negocioId] // Reemplazamos/Asignamos el negocio actual
            } 
          }
        );

        // Verificamos correctamente si la modificación surtió efecto
        if (resultado.modifiedCount > 0) {
          return response.status(200).json({ 
            message: "Usuario existente agregado como empleado con éxito.",
            usuarioId: userExist._id
          });
        } else {
          return response.status(409).json({ error: "No se pudo actualizar el usuario." });
        }
      }

      // 4. Si el usuario NO existe, lo creamos desde cero
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const rolAsignado = role || "Vendedor";

      const newEmployee = new User({
        name,
        email,
        numero,
        cedula: Cedula,
        sucursal: Sucursal,
        passwordHash,
        rol: rolAsignado,
        negocio: [negocioId],
        verified: true,
      });

      const savedEmployee = await newEmployee.save();

      // 5. Registrar el nuevo empleado en el modelo Negocio (si mantienes este array)
      const infoNegocio = await Negocio.findByIdAndUpdate(
        negocioId,
        {
          $push: {
            empleados: {
              user: savedEmployee._id,
              rol: rolAsignado
            }
          }
        },
        { new: false }
      );

      // 6. Configurar y Enviar Email de Bienvenida
      await resend.emails.send({
        from: 'OptiGest Software <soporte@optigest.com.ve>', 
        to: [savedEmployee.email], 
        subject: `Bienvenido a ${infoNegocio?.nombre || 'el equipo'} - OptiGest`,
        html: `
          <div style="text-align: center; font-family: sans-serif; color: #333;">
              <img src="https://tu-dominio-r2.com/logo-optigest.png" alt="OptiGest Logo" style="width: 150px; margin-bottom: 20px;">
              <h2>¡Bienvenido al equipo, ${name}!</h2>
              <p>Has sido registrado como empleado en <strong>${infoNegocio?.nombre || 'nuestra óptica'}</strong>.</p>
              <p>Tus credenciales de acceso son:</p>
              <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; display: inline-block; text-align: left;">
                <p><strong>Usuario:</strong> ${email}</p>
                <p><strong>Contraseña:</strong> (La proporcionada por tu administrador)</p>
              </div>
              <div style="margin: 30px 0;">
                  <a href="${process.env.PAGE_URL}/Login/" 
                     style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                     Acceder al Sistema
                  </a>
              </div>
              <p style="font-size: 12px; color: #777;">Si tienes dudas, contacta con tu administrador.</p>
          </div>
        `,
      });

      return response.status(201).json({
        message: `Empleado ${savedEmployee.name} creado con éxito.`,
        empleado: {
          _id: savedEmployee._id,
          name: savedEmployee.name,
          email: savedEmployee.email
        }
      });

    } catch (error) {
      console.error("Error al crear el empleado:", error);
      if (error.code === 11000) {
        return response.status(409).json({ error: "El correo electrónico ya está registrado." });
      }
      return response.status(500).json({ error: "Error interno del servidor." });
    }
  }
);

// -----------------------------------------------------------------
// RUTA GET /empleados (Obtener Lista de Empleados)
// -----------------------------------------------------------------


/**
 * GET /empleados
 * Recupera la lista de empleados del negocio asociado al usuario autenticado.
 * Requiere que el middleware roleChecker haya validado el rol y adjuntado request.negocioId.
 */
/**
 * GET /empleados
 * Recupera la lista de empleados del negocio asociado al usuario autenticado.
 * Requiere que el middleware roleChecker haya validado el rol y adjuntado request.negocioId.
 */
negociosRouter.get(
    "/", 
    // Middleware roleChecker asegura que req.user exista y que el rol sea 'Propietario' o 'Administrador'
    roleChecker(['Propietario', 'Administrador']), 
    
    async (request, response) => { 
        
        const negocioId = request.negocioId;
        
        if (!request.user || !request.user._id) {
            return response.status(401).json({ error: "No autenticado. Por favor, inicie sesión." });
        }
        
        console.log(`[GET /empleados] Sucursal/Negocio ID a buscar: ${negocioId}`);
 
        if (!negocioId) {
            return response.status(403).json({ error: "El usuario no está asociado a un negocio o sucursal válida." });
        }
        
        try {
            // Buscamos directamente en la colección User los usuarios que pertenecen a esta sucursal
            const negocioList = await Negocio.find({ _id: negocioId });
            
    
    

            return response.status(200).json({
                message: "Lista de empleados recuperada exitosamente.",
             datos: negocioList[0] || null
            });

        } catch (error) {
            console.log(error, "Error del server");
            return response.status(500).json({ error: "Error interno del servidor." });
        }
    }
);
negociosRouter.get(
    "/empleados", 
    // Middleware roleChecker asegura que req.user exista y que el rol sea 'Propietario' o 'Administrador'
    roleChecker(['Propietario', 'Administrador']), 
    
    async (request, response) => { 
        
        const negocioId = request.negocioId;
        
        if (!request.user || !request.user._id) {
            return response.status(401).json({ error: "No autenticado. Por favor, inicie sesión." });
        }
        
        console.log(`[GET /empleados] Sucursal/Negocio ID a buscar: ${negocioId}`);
 
        if (!negocioId) {
            return response.status(403).json({ error: "El usuario no está asociado a un negocio o sucursal válida." });
        }
        
        try {
            // Buscamos directamente en la colección User los usuarios que pertenecen a esta sucursal
            const empleadosList = await User.find({ negocio: negocioId });
            
            if (!empleadosList || empleadosList.length === 0) {
                return response.status(404).json({ error: "No se encontraron empleados registrados en esta sucursal." });
            }
            
            // Mapeamos los campos requeridos utilizando el formato transformado del modelo
            const empleadosConRol = empleadosList.map(empleado => ({
                id: empleado._id, // Gracias al toJSON, esto ya estará limpio o mapeado
                name: empleado.name,
                email: empleado.email,
                numero: empleado.numero,
                rol: empleado.rol,   
            }));

            return response.status(200).json({
                message: "Lista de empleados recuperada exitosamente.",
                empleados: empleadosConRol
            });

        } catch (error) {
            console.log(error, "Error del server");
            return response.status(500).json({ error: "Error interno del servidor." });
        }
    }
);
negociosRouter.delete(
    "/:id", 
    roleChecker(['Propietario', 'Administrador']), 
    async (request, response) => { 
        
        const usuarioLogueadoId = request.user?._id || request.usuario?._id;
        const negocioId = request.negocioId;
        const usuarioAEliminarId = request.params.id; // ID del usuario/empleado que se va a desvincular

        console.log(`[DELETE /:id] Negocio ID: ${negocioId}, Usuario ID a desvincular: ${usuarioAEliminarId}`);

        if (!negocioId || !usuarioAEliminarId || !usuarioLogueadoId) {
            return response.status(400).json({ 
                error: "Faltan parámetros: ID de negocio, ID de usuario o el usuario logueado no está disponible." 
            });
        }
        
        try {
            // --- 1. Verificar que el usuario a eliminar pertenezca al negocio ---
            const usuarioAEliminar = await User.findOne({ 
                _id: usuarioAEliminarId, 
                negocio: negocioId 
            });
                      const negocio = await Negocio.findOne({ 
                _id:  negocioId , 
               
            });
            
            if (!usuarioAEliminar) {
                return response.status(404).json({ error: "El usuario no pertenece a este negocio." });
            }
            
            // --- 2. Validación de Auto-Eliminación ---
            if (usuarioAEliminarId.toString() === usuarioLogueadoId.toString()) {
                return response.status(403).json({ 
                    error: "❌ Prohibido: El usuario no puede eliminarse a sí mismo."
                });
            }
            
            // --- 3. Validación opcional de Propietario ---
            // Si el usuario a eliminar es Propietario, validar que quien lo borra también lo sea o tenga permisos especiales.

            // --- 4. Actualizar el documento del User ---
            // Como ahora el User lleva el negocio, la sucursal y el rol, 
            // puedes remover el negocio del array y limpiar sucursal/rol correspondientes.
                if (usuarioAEliminar.rol === "Propietario" 

            ) {
                    return response.status(404).json({ error: "El usuario  es propietario." });
            }
            if (usuarioAEliminar._id === negocio.propietario 

            ) {
                    return response.status(404).json({ error: "El usuario  es propietario." });
            }
            const resultado = await User.updateOne(
                { _id: usuarioAEliminarId }, 
                { 
                    $pull: { negocio: negocioId },
                    $set: { sucursal: null, rol: "" } // Opcional: limpiar sucursal y rol si ya no pertenecen al negocio
                }
            );

            if (resultado.modifiedCount === 1) {
                return response.status(200).json({
                    message: "Usuario desvinculado del negocio con éxito.",
                    usuarioId: usuarioAEliminarId,
                    negocioId: negocioId
                });
            } else {
                return response.status(404).json({ 
                    error: "El usuario no pudo ser actualizado en la base de datos."
                });
            }

        } catch (error) {
            console.error("Error al intentar desvincular al usuario:", error);
            return response.status(500).json({ 
                error: "Error interno del servidor al procesar la solicitud." 
            });
        }
    }
);
// Ruta "Proxy" que llamará el frontend
// 2. Añade esta ruta a tu servidor Express
const axios = require('axios'); // <-- AGREGA ESTO ARRIBA DEL TODO
negociosRouter.post('/api/proxy-logo', async (req, res) => {
  try {
    const { urlR2 } = req.body; // Aquí recibiremos la URL firmada de Cloudflare desde el frontend

    if (!urlR2) {
      return res.status(400).json({ error: "Falta la URL de la imagen" });
    }

    // El servidor descarga los bytes de la imagen directamente (R2 no bloquea al backend)
    const respuesta = await axios.get(urlR2, { responseType: 'arraybuffer' });
    
    // Transformamos los bytes binarios del WebP a un texto Base64 seguro para el navegador
    const base64 = Buffer.from(respuesta.data, 'binary').toString('base64');
    
    // Devolvemos el string estructurado listo para que el frontend lo pinte
    res.json({ imagenBase64: `data:image/webp;base64,${base64}` });

  } catch (error) {
    console.error("Error en el proxy de imagen R2:", error.message);
    res.status(500).json({ error: "No se pudo descargar la imagen desde el servidor" });
  }
});
// Logo del negocio
negociosRouter.get(
  "/Logo", 
  // Middleware para asegurar que el usuario esté autenticado y tenga el rol correcto
  roleChecker(['Propietario', 'Administrador', 'Vendedor']),
  
  async (request, response) => { 
    try { 
      const negocioId = request.negocioId;
      if (!request.user || !request.user._id) {
        return response.status(401).json({ error: "No autenticado. Por favor, inicie sesión." });
      }
      
      console.log(`[GET /api/negocios/Logo] Negocio ID a buscar: ${negocioId}`);

      // Esta verificación es un doble chequeo. Si roleChecker fue exitoso, negocioId debería existir.
      if (!negocioId) {
        // Este error ya no debería dispararse si el middleware funciona correctamente
        return response.status(403).json({ error: "El usuario no está asociado a un negocio válido." });
      }

      const respuesta = await Negocio.findOne({
        _id: negocioId,                      // Primero filtra por el ID específico
        Info: { $exists: true, $ne: "" },   // Verifica que la info no esté vacía
        Pagomovil: { $exists: true, $ne: "" }, // Verifica que el pago móvil no esté vacío
      });

      // Si por alguna razón no encuentra el documento, evitamos que la app rompa abajo
      if (!respuesta) {
        return response.status(404).json({ error: "No se encontró el negocio o los datos están incompletos." });
      }

      console.log(respuesta);

      // ✨ CORRECCIÓN: Convertimos el documento de Mongoose a objeto JS plano para poder usar destructuring/spread
      const prodObj = respuesta.toObject();
      let imagenFinal = null;
   
      // ✨ CORRECCIÓN: Validamos usando 'logo' en minúscula, idéntico a tu base de datos
      if (prodObj.Info && typeof prodObj.Info.logo === 'string') {
      
        if (prodObj.Info.logo.startsWith('http')) {
          // Caso A: Si es una URL completa externa o antigua, la dejamos igual
          imagenFinal = prodObj.Info.logo;
        } else {
          // Caso B: Es solo la ruta (Key) guardada en R2. GENERAMOS LA FIRMA.
          try {
            const command = new GetObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: prodObj.Info.logo, // ✨ CORRECCIÓN: Cambiado 'Info.imagen' por 'Info.logo' para que lea la ruta real
            });

            // Esta URL solo funcionará por 3600 segundos (1 hora)
            // El frontend la recibirá con el token de seguridad pegado al final
            imagenFinal = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          } catch (s3Error) {
            console.error("❌ Error al firmar URL de R2:", s3Error);
            imagenFinal = null; // O una imagen por defecto
          }
        }
      }

      // Estructuramos el objeto final acoplando la URL firmada
      const productoConImagen = {
        ...prodObj,
        imagen: imagenFinal
      };

      console.log(`✅ Datos de negocio recuperados con URL segura de logo.`);

      // 🛑 VALIDACIÓN OBLIGATORIA
      if (!respuesta.Pagomovil) {
        return response.status(201).json({ 
          respuesta: "No tiene los datos" 
        });
      }

      // Devolvemos los datos procesados con la URL firmada en lugar de la respuesta cruda de Mongoose
      return response.status(200).json({
        datos: productoConImagen,
        respuesta: "Si tiene los datos."
      });
      
    } catch (error) {
      // Manejo de errores generales (conexión a DB, Mongoose, etc.)
      console.error("Error en GET /Logo:", error);
      return response.status(500).json({ 
        error: "Error interno del servidor al procesar el logo del negocio." 
      });
    }
  }
);
  // cloufare y img 
  const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
  const { s3Client } = require("../list/index"); // Asegúrate de tener este archivo configurado
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
      
  const sharp = require('sharp'); // Para optimizar imágenes
  
  const cron = require('node-cron');
  const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Límite estricto de 5MB
});
// Ruta para actualizar información del negocio (Banco, Teléfono, Cédula, Logo)
negociosRouter.patch(
  "/Logo",
  roleChecker(['Propietario', 'Administrador']),
  upload.single('logo'),
  async (request, response) => {
    // 🔐 Verificación de autenticación
    if (!request.user || !request.user._id) {
      return response.status(401).json({ error: "No autenticado." });
    }

    try {
      const { Banco, Telefono, Cedula, Rif, Celular, Direccion } = request.body;

      // 1. Obtener el negocio asociado al usuario
      const negocioId = Array.isArray(request.user.negocio) && request.user.negocio.length > 0
        ? request.user.negocio[0]
        : null;

      if (!negocioId) {
        return response.status(403).json({ error: "No tienes un negocio asociado." });
      }

      // 🚨 VALIDACIÓN CRÍTICA: Detener el flujo si no subieron un archivo válido
      if (!request.file || !request.file.buffer || request.file.buffer.length === 0) {
        return response.status(400).json({ 
          error: "No se recibió ninguna imagen. Asegúrate de enviar el archivo en el campo 'logo'." 
        });
      }

      // --- OBTENER DATOS ACTUALES DEL NEGOCIO (Para el logo antiguo) ---
      const negocioIMG = await Negocio.findOne({ _id: negocioId });
      if (!negocioIMG) {
        return response.status(404).json({ error: "Negocio no encontrado." });
      }
      
      // Guardamos la referencia del logo viejo para borrarlo al final
      const logoAntiguoKey = negocioIMG.Info?.logo; 

      // --- LÓGICA DE IMAGEN SEGURA (SHARP) ---
      let bufferOptimizado;
      try {
        bufferOptimizado = await sharp(request.file.buffer)
          .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 }) 
          .toBuffer();
      } catch (sharpError) {
        // Si el archivo está corrupto o no es una imagen, frena aquí sin tumbar el backend
        console.error("❌ Error al procesar imagen con Sharp:", sharpError.message);
        return response.status(422).json({ error: "El archivo enviado no contiene un formato de imagen válido." });
      }

      // --- SUBIR NUEVO LOGO A R2 ---
      const fileName = `${negocioId}/Logo/${Date.now()}-.webp`;
      const uploadParams = {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: bufferOptimizado,
        ContentType: 'image/webp',
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      console.log(`📸 Imagen guardada en R2: ${fileName}`);

      // --- ACTUALIZAR BASE DE DATOS ---
      const negocioActualizado = await Negocio.findByIdAndUpdate(
        negocioId,
        {
          $set: {
            "Info.logo": fileName,
            "Info.rif": Rif,
            "Info.Direccion": Direccion,
            "Info.Celular": Number(Celular), 
            "Pagomovil.Banco": Banco,
            "Pagomovil.Cedula": Cedula,
            "Pagomovil.Telefono": Number(Telefono)
          }
        },
        { new: true, runValidators: true }
      );

      if (!negocioActualizado) {
        return response.status(404).json({ error: "Negocio no encontrado al actualizar." });
      }

      // --- ELIMINAR LOGO ANTIGUO DE R2 (AHORA SÍ, AL FINAL Y SEGURO) ---
      if (logoAntiguoKey) {
        try {
          const deleteParams = {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: logoAntiguoKey 
          };
          await s3Client.send(new DeleteObjectCommand(deleteParams));
          console.log(`🗑️ Logo antiguo eliminado de R2: ${logoAntiguoKey}`);
        } catch (s3Error) {
          // Si el archivo ya no existía en R2, solo dejamos una advertencia y permitimos el éxito
          console.error("⚠️ Advertencia al eliminar logo antiguo de R2 (puede que ya no existiera):", s3Error.message);
        }
      }

      // 🎨 Logs decorativos en consola en el lugar correcto (Al confirmar el éxito real)
      const reset = "\x1b[0m";
      const cyan = "\x1b[36m";
      const verde = "\x1b[32m";
      const amarillo = "\x1b[33m";
      const negrita = "\x1b[1m";

      console.log(`${cyan}=========================================`);
      console.log(`${verde}${negrita}   🚀 NEGOCIO ACTUALIZADO CON ÉXITO`);
      console.log(`${amarillo}   Datos: RIF, Teléfono y Logo guardados correctamente.`);
      console.log(`${cyan}========================================${reset}`);

      return response.status(200).json({
        message: "Información del negocio actualizada con éxito.",
        data: negocioActualizado
      });

    } catch (error) {
      console.error("Error crítico al actualizar el negocio:", error);
      return response.status(500).json({ error: "Error interno al guardar los datos." });
    }
  }
);

module.exports = negociosRouter;