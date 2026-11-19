const loginRouter = require('express').Router();
const User = require('../models/user');
const Master = require('../models/superUsuario'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

loginRouter.post('/', async (request, response) => {
    const { email , password } = request.body;
    console.log(`Intentando login para: ${email}`);

    // 1. Buscamos al usuario
    let userExist = await Master.findOne({ email }); 
    let isMaster = false;

    if (userExist) {
        isMaster = true; 
        console.log('--- USUARIO ENCONTRADO EN TABLA MASTER ---');
    } else {
        userExist = await User.findOne({ email });
    }

    // 2. Validamos existencia
    if (!userExist) {
        return response.status(400).json({error:'email o contraseña invalido.'})
    }

    // 3. Validamos verificación (solo normales)
    if (!isMaster && !userExist.verified) {
        return response.status(400).json({error:'Tu email no ha sido verificado.'})
    }

    // 4. Validamos Contraseña
    const passParaComparar = isMaster ? userExist.password : userExist.passwordHash;
    const isCorrect = await bcrypt.compare(password, passParaComparar);
    
    if (!isCorrect) {
        return response.status(400).json({error: 'email o contraseña invalido.'})
    }

    // 5. Creamos el Token
    const userForToken = {
        id: userExist.id,
        rol: isMaster ? 'admin_supremo' : 'usuario'
    }

    const accessToken = jwt.sign(userForToken, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
    });

    // --- 6. LÓGICA DE COOKIE DIFERENCIADA ---
    // Definimos el nombre de la cookie según el rol
    const nombreCookie = isMaster ? 'AdminSuper' : 'accessToken';

    response.cookie(nombreCookie, accessToken, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: 'lax' // Recomendado para evitar problemas de redirección
    });

    console.log(`Cookie creada: ${nombreCookie} para rol: ${userForToken.rol}`);

    // 7. Respuesta final
    if (isMaster) {
        return response.status(200).json({ url: '/SuperUsuario'});
    } else {
        return response.status(200).json({ url: '/Casa', rol: 'usuario' });
    }
});



module.exports = loginRouter;