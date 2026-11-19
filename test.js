const bcrypt = require('bcrypt');

const pass = ''; // Pon la clave que quieres usar para entrar

bcrypt.hash(pass, 10, (err, hash) => {
    if (err) console.log(err);
    console.log('--- COPIA ESTE NUEVO HASH ---');
    console.log(hash);
});