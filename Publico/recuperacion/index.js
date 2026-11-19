const Correo = document.querySelector("#correo")
const Contraseña = document.querySelector("#Contraseña")
const form = document.querySelector('#contenedor1');
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



form.addEventListener('submit', async e => {
    e.preventDefault();
if ( !Correo.value )
{


mostrarNotificacion("No pueden estar vacios los inputs")
}
else {
        // utilizamos axios para comunicar el front con el back y el try catch para que sea un evento asyncrono porque no sabemos cuando tiempo va a tardar para enviar una respuesta.
        try {
        
            
        
           
            const email = Correo.value 
        const response =    await axios.post('/api/users/verificarRecuperacion',  {email} );

      const data = await response.data;
 
      window.location  = "/Login";
            // rederigir al usuario a la pagina de todos cuando inicien sesion correctamente
          
        } catch (error) {

            if (error.status === 404){    mostrarNotificacion("Correo no registrado")}
   else {         mostrarNotificacion("Correo o contraseña equivocados")}
        }
}
    
    
   
})

Home.addEventListener("click", e => {
      window.location.pathname = "/"
})