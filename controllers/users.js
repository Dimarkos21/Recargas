const usersRouter = require('express').Router();

const User = require('../models/user');
// 🛑 NUEVA IMPORTACIÓN: Modelo Negocio
const Negocio = require('../models/negocio'); 
const {userExtractor} = require("../middleware/auth");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const { PAGE_URL } = require('../config');
// Antes: const authorizeRoles = require("../middleware/roles");
const { authorizeRole } = require("../middleware/roles"); // ⬅️ Usa desestructuración y el nombre singular
// Asegúrate de que los modelos y el router están importados correctamente
// const usersRouter = require('express').Router();
// const User = require('../models/User'); 
// const Negocio = require('../models/Negocio');
// const authMiddleware = require('../middlewares/authMiddleware'); // Middleware de autenticación

//enviado de correo 
const { Resend } = require('resend');
const { findOne, findById } = require('../models/facturacion1');
const resend = new Resend(process.env.EMAIL_PASS);

usersRouter.get("/", async (request, response) => { 
 // const ipApiUrl = "https://api.ip2location.io/?key=E5CBE4899CF677C122DD0828C1ACC827";

// try {
//   // Consulta la IP y datos asociados
//   const ipResponse = await fetch(ipApiUrl);
//   if (!ipResponse.ok) {
//     throw new Error(`Error en la solicitud de IP: ${ipResponse.status}`);
//   }
//   const ipData = await ipResponse.json();
//   console.log("Datos de IP obtenidos:", ipData);

//   // Ahora que tenemos ipData, construimos la URL correcta
//   const countryApiUrl = `https://restcountries.com/v3.1/alpha/${ipData.country_code}`;
//   const countryResponse = await fetch(countryApiUrl);
//   if (!countryResponse.ok) {
//     throw new Error(`Error en la solicitud de países: ${countryResponse.status}`);
//   }

//   const countryData = await countryResponse.json();
//   const country = countryData[0]; // El resultado viene en array

//   const phoneCode = country.idd && country.idd.suffixes.length
//     ? `${country.idd.root}${country.idd.suffixes[0]}`
//     : "Código no disponible";

//   console.log(`Código telefónico para ${ipData.country_name}: ${phoneCode}`);

//   // Combinar y enviar los datos comenta todo
// } catch (error) {
//   console.error("Error en el proceso:", error);
// }

try {
    const finalData = {
      country  :  "Venezuela",
    
      phoneCode  : "+58"
    };
    return response.status(200).json(finalData);
  } catch (error) {
    console.error("Error:", error.message);
    return response.status(500).json({ error: "Ocurrió un error en el servidor.", detalle: error.message });
  }
});

// RUTA POST MODIFICADA PARA CREAR USUARIO Y NEGOCIO ---


usersRouter.post('/', async (request, response) => {
    // 'negocio' en el body ahora es el nombre del nuevo negocio.
    const { name, email, negocio: nombreNegocio, numero, password } = request.body; 

    if (!name || !email || !nombreNegocio || !numero || !password) {
        return response.status(400).json({error: 'Todos los espacios son requeridos'})
    }

    // Validación que el usuario ya existe.
    const userExist = await User.findOne({ email });
    if (userExist) {
        return response.status(400).json({ error: 'El email ya está registrado.' })
    }

    // Hasheo de contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 🛑 PASO 1: Crear el Usuario (Propietario)
    const newUser = new User ({
        name, 
        email, 
        numero,
        passwordHash,
        rol: 'Propietario',
    });

    const savedUser = await newUser.save();

    // 🛑 PASO 2: Crear el Nuevo Negocio
    const newNegocio = new Negocio({
        nombre: nombreNegocio,
        propietario: savedUser._id,
        
   
    });

    const savedNegocio = await newNegocio.save();

    // 🛑 PASO 3: Actualizar el Usuario con las referencias del Negocio
    savedUser.negocioPropio = savedNegocio._id;
    savedUser.negocio.push(savedNegocio._id);
    await savedUser.save();

    // 🛑 PASO 4: Generar Token de verificación (1 hora para expirar)
    const token = jwt.sign({ id: savedUser._id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15d'
    });

  
    try {
    await resend.emails.send({
    // Usamos el nombre profesional y el dominio verificado
    from: 'OptiGest Software <soporte@optigest.com.ve>', 
    to: [savedUser.email], 
    subject: 'Verifica tu cuenta - OptiGest',
    html: `
        <div style="text-align: center; font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <img src="https://i.ibb.co/9H9x22wk/Opti-Gesty.png" alt="OptiGest Logo" style="width: 150px; margin-bottom: 20px;">
            
            <h2 style="color: #007bff;">¡Bienvenido a OptiGest, ${name}!</h2>
            <p>Gracias por confiar en nosotros para gestionar <strong>${nombreNegocio}</strong>. Para comenzar a usar la plataforma, necesitamos verificar tu dirección de correo electrónico.</p>
            
            <div style="margin: 40px 0;">
                <a href="${process.env.PAGE_URL}/api/users/verify/${savedUser._id}/${token}" 
                    style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    Verificar Mi Cuenta
                </a>
            </div>
            
            <p style="font-size: 13px; color: #666;">Este enlace de verificación expirará en 60 minutos.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Si no creaste una cuenta en OptiGest, puedes ignorar este mensaje.</p>
        </div>
    `,
});
        
        return response.status(201).json({ message: 'Usuario y negocio creados. Por favor verifica tu correo.' });

    } catch (emailError) {
        console.error("Error enviando email:", emailError);
        return response.status(201).json({ 
            message: 'Usuario creado, pero hubo un error al enviar el correo de verificación.',
            error: emailError.message 
        });
    }
});

usersRouter.get('/verify/:id/:token', async (request, response) => {
    const { id, token } = request.params;

    try {
        // 1. Verificar si el token es válido y no ha expirado
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 2. Seguridad extra: ¿El ID del token coincide con el ID de la URL?
        if (decodedToken.id !== id) {
            return response.status(401).json({ error: 'Token inválido para este usuario.' });
        }

        // 3. Buscar al usuario y actualizar su estado a verificado
        const user = await User.findById(id);

        if (!user) {
            return response.status(405).json({ error: 'Usuario no encontrado.' });
        }
        
        if (user.verified === "true") {
            return response.status(400).json({ error: 'Este correo ya ha sido verificado anteriormente.' });
        }
console.log("Token recibido:", token);
console.log("Secret usado:", process.env.ACCESS_TOKEN_SECRET);
        // Activar usuario
        user.verified = true;
        await user.save();

        // 4. Redirigir al frontend con un mensaje de éxito
        // (Opcional: puedes enviar un JSON o redirigir directamente al login)
        return response.redirect(`${process.env.PAGE_URL}/login?verified=true`);

    } catch (error) {
        console.error("Error en verificación:", error.message);
        
        if (error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: 'El enlace ha expirado. Por favor, solicita uno nuevo.' });
        }
        
        return response.status(400).json({ error: 'El enlace de verificación no es válido.' });
    }
});
//Contraseña olvidada


usersRouter.post('/verificarRecuperacion', async (request, response) => {
    const { email } = request.body;

    if (!email) {
        return response.status(400).json({ error: 'El email es requerido' });
    }

    // 1. Verificar que el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
        // Por seguridad, a veces es mejor decir "Si el correo existe, se envió un enlace"
        return response.status(404).json({ error: 'No existe un usuario con ese email' });
    }
    const secret = process.env.ACCESS_TOKEN_SECRET + user.passwordHash;
    // 2. Crear un Token de recuperación (Vence en 15 minutos)
    const token = jwt.sign(
        { id: user.id }, 
      secret,
        { expiresIn: '15m' } 
    );





// ... (Resto de tu código de buscar usuario y generar el token JWT) ...

// 3. Ya no necesitas configurar Nodemailer. Usaremos la API de Resend directamente.
try {
    // 4. Enviar el correo usando Resend (Es mucho más ligero para el plan Free de Render)
    const { data, error } = await resend.emails.send({
        from: 'OptiGest <soporte@optigest.com.ve>', // Cuando verifiques tu dominio cámbialo a: 'soporte@optigest.com.ve'
        to: user.email, // Enviamos al correo del usuario encontrado
        subject: 'Recuperar Contraseña - OptiGest',
        html: `
            <div style="text-align: center; font-family: sans-serif;">
                <img src="https://i.ibb.co/9H9x22wk/Opti-Gesty.png" alt="OptiGest Logo" style="width: 150px; margin-bottom: 20px;">
                <h2 style="color: #333;">¿Olvidaste tu contraseña?</h2>
                <p>Hola, has solicitado restablecer tu contraseña para acceder al sistema de inventario.</p>
                <p>Haz clic en el botón de abajo para crear una nueva. Este enlace vence en 15 minutos.</p>
                <div style="margin: 30px 0;">
                    <a href="${process.env.PAGE_URL}/reset-password/${user.id}/${token}" 
                       style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       Restablecer Contraseña
                    </a>
                </div>
                <p style="font-size: 12px; color: #777;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
            </div>
        `,
    });

    if (error) {
        console.error("Error detectado por Resend:", error);
        return response.status(400).json({ error: 'Fallo al procesar el envío', detalle: error });
    }

    console.log("Email enviado con éxito a través de Resend:", data);
    return response.status(200).json('Enlace de recuperación enviado al correo');

}
 catch (error) {
        // AGREGADO PARA RENDER: Mostrar el error exacto en los logs y enviarlo al frontend
        console.error("ERROR CRÍTICO AL ENVIAR CORREO EN RENDER:", error);
        return response.status(500).json({ error: 'Error al enviar el correo', detalle: error.message });
    }
});
// verificar token para cambiar contrase ;

usersRouter.post('/update-password', async (req, res) => {
    // Nota: Asegúrate de que desde el frontend envíes 'password' o 'newPassword'
    const { id, token, password } = req.body;

    try {
        console.log('--- INICIO PROCESO ACTUALIZACIÓN ---');
        console.log('ID recibido:', id);
        console.log('Token recibido:', token ? 'Recibido (check)' : 'NO RECIBIDO');

        // 1. Buscar al usuario
        const user = await User.findById(id);
        
        if (!user) {
            console.log('Error: Usuario no encontrado en DB');
            return res.status(404).json({ error: 'El usuario ya no existe.' });
        }

        // 2. Reconstruir secreto
        // IMPORTANTE: Este console.log te dirá si la llave maestra existe
        console.log('¿Existe ACCESS_TOKEN_SECRET?:', process.env.ACCESS_TOKEN_SECRET ? 'SÍ' : 'NO');
        
        const secret = process.env.ACCESS_TOKEN_SECRET + user.passwordHash;
        // console.log('Secreto generado para verificar:', secret); // Descomenta solo para pruebas locales muy privadas

        // 3. Verificar el token
        console.log('Verificando token...');
        const decodedToken = jwt.verify(token, secret);


        // 4. Verificar que el token sea para este usuario
        if (decodedToken.id !== id) {
            console.log('Error: El ID del token no coincide con el ID de la URL');
            return res.status(401).json({ error: 'Token no autorizado.' });
        }

        // 5. Encriptar y guardar
        console.log('Encriptando nueva contraseña...');
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        user.passwordHash  = passwordHash;
        await user.save();

        console.log('✅ Contraseña actualizada en la base de datos para:', user.email);
        res.status(200).json({ message: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        console.log("--- ERROR EN CAPA DE VERIFICACIÓN ---");
        console.log("Mensaje de error:", error.message);
        
        if (error.message === 'invalid signature') {
            console.log("Causa: El secreto (llave + password) no coincide con el que se usó al enviar el mail.");
        } else if (error.message === 'jwt expired') {
            console.log("Causa: Pasaron más de los minutos permitidos.");
        }

        res.status(400).json({ error: 'El enlace ha expirado o es inválido.' });
    }
});
// CÓDIGO CORREGIDO Y FUNCIONAL
usersRouter.patch('/recuperar', async (request, response) => {});


usersRouter.patch('/:id/:token', async (request, response) => {
    const { id, token } = request.params;

    try {
        // 1. Intentar verificar el token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decodedToken.id;

        // 2. Si es válido, marcar como verificado
        await User.findByIdAndUpdate(userId, { verified: true });
        return response.sendStatus(200);

    } catch (error) {
        // 3. Si entra aquí, el token expiró o es falso
        try {
            const user = await User.findById(id);
            if (!user) return response.status(404).json({ error: 'Usuario no encontrado' });

            // 4. Generar nuevo token (1 día de duración)
            const newToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });

            // 5. Enviar nuevo link usando Resend (Región São Paulo)
            await resend.emails.send({
                from: 'OptiGest Software <soporte@optigest.com.ve>',
                to: [user.email],
                subject: 'Nuevo Link de Verificación - OptiGest',
                html: `
                    <div style="text-align: center; font-family: sans-serif;">
                        <img src="https://i.ibb.co/9H9x22wk/Opti-Gesty.png" alt="OptiGest Logo" style="width: 150px; margin-bottom: 20px;">
                        <h2 style="color: #333;">El enlace anterior ha expirado</h2>
                        <p>No te preocupes, aquí tienes uno nuevo para verificar tu cuenta:</p>
                        <div style="margin: 30px 0;">
                            <a href="${process.env.PAGE_URL}/verify/${user.id}/${newToken}" 
                               style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                               Verificar Cuenta Ahora
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #777;">Este enlace es válido por 24 horas.</p>
                    </div>
                `
            });

            return response.status(400).json({ 
                error: 'El link ya expiró. Se ha enviado un nuevo link de verificación a su correo.' 
            });

        } catch (innerError) {
            console.error("Error al re-enviar verificación:", innerError);
            return response.status(500).json({ error: 'Error interno al procesar la solicitud' });
        }
    }
});

// USER VERIFICACION DE USUARIO


// Ruta para verificar si la sesión sigue activa y devolver datos del usuario
usersRouter.get("/SesionACTIVA", userExtractor, async (request, response) => {
    // Gracias al middleware, aquí ya tienes asegurado que el usuario está logueado
    // y tienes sus datos en request.user
try {
        return response.status(200).json(request.user);
} catch (error){
          return response.status(500).json(request.user);
}
});
module.exports = usersRouter;