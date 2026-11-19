const Correo = document.querySelector("#correo")
const Contraseña = document.querySelector("#Contraseña")

const notificacion = document.querySelector("#notificacion")

const Home = document.querySelector("#Inventary")
// funcion de mensaje
function mostrarNotificacion(mensaje) {
    const notificacion = document.getElementById("notificacion");
    notificacion.textContent = mensaje;
    notificacion.classList.remove("oculto");
    notificacion.classList.add("visible");

    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove("visible");
        notificacion.classList.add("oculto");
    }, 3000);
}





Home.addEventListener("click", e => {
      window.location.pathname = "/"
})

const form = document.getElementById('contenedor1');

// Extraemos el ID y Token de la URL actual (ej: /reset-password/ID/TOKEN)
const params = window.location.pathname.split('/');
const id = params[params.length - 2];
const token = params[params.length - 1];

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('pass1').value;
    const pass2 = document.getElementById('pass2').value;

    // Validación básica en el cliente
    if (password !== pass2) {
        return alert("Las contraseñas no coinciden");
    }
    console.log(password)
console.log(token)
    try {
        // Enviamos los datos a tu endpoint de la API
        await axios.post('/api/users/update-password', {
           id,
            token,
            password
        });
        
        alert("¡Contraseña actualizada correctamente!");
        // Redirigimos al login
        window.location.href = "/Login"; 
    } catch (error) {
        console.error(error);
        alert("Error: El enlace es inválido o ya expiró. Intenta solicitar uno nuevo.");
    }
});