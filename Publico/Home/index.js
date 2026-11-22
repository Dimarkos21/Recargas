const iniciarSesion = document.querySelector("#boton");


const catalogo = document.getElementById('catalogoContainer');
function generarUrlLimpia(texto) {
    return texto
        .toString()
        .normalize('NFD') // Separa las tildes de las letras
        .replace(/[\u0300-\u036f]/g, '') // Elimina las tildes
        .toLowerCase() // Todo en minúsculas
        .trim() // Elimina espacios al inicio y al final
        .replace(/\s+/g, '-') // 👈 Aquí cambias los espacios por guiones (-) en lugar de %20
        .replace(/[^a-z0-9\-]/g, ''); // Elimina caracteres especiales extraños
}






const scorpionUser = document.querySelector(".scorpion-user-pseudo");
const scorpionMail = document.querySelector(".scorpion-f-mail");
const scorpionNombre = document.querySelector(".scorpion-f-name");



// Menu de autenticado

const nav_menu = document.querySelector(".scorpion-nav-menu")
async function VerificaciondeusuarioDevolverPanel(){

try {

      const response = await axios.get("/api/users/SesionACTIVA",{
    method: 'GET',
    credentials: 'include' // IMPORTANTE: esto le dice al navegador que envíe las cookies
});

 

     if ( response.status === 200)
     {
 scorpionUser.innerHTML = `${response.data.name} `;
 scorpionNombre.innerHTML = `${response.data.email} `;

  scorpionMail.innerHTML = `${response.data.name} `;
nav_menu.classList.remove("oculto");
   iniciarSesion.style.display = "none";

     } 
     else if (response.status === 401){

        // no hacemos nada
     }
} catch ( error){

    console.log(error)
}
}
// CARGADOR DE PAGINA 
(async () => {
    try {
         VerificaciondeusuarioDevolverPanel()
        //  const response = await axios.post('/api/productosJuegosRouter');
const response = await axios.get('/api/Game');

    console.log('Productos obtenidos:',response);
function cortarPalabras(texto, limite = 5) {
  const palabras = texto.trim().split(/\s+/);
  if (palabras.length <= limite) return texto;
  return palabras.slice(0, limite).join(' ') + '...';
}

// Ejemplo con tus paquetes:

// Resultado: "300 + 30 Genesis Crystals..."
    response.data.forEach(product => {
     catalogo.innerHTML += `  
   
            <!-- Ejemplo en HTML/JS para la tarjeta de Arena Breakout -->
<a href="/juego/${generarUrlLimpia(product.name)}" class="game-card">


                <article class="description">
                    <div class="img-wrapper" >
                        <img src="${product.IMG}" alt="Validación de Jugador" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <h3>${product.name}</h3>
                    <p>${ cortarPalabras(product.description )|| ""}</p>
                </article>

                
                </a>
          `;
    });
 
    
    } catch (error) {
        console.error('Error al obtener productos:', error);
    }
})();
// FIN



const MenuIniciarSesion = document.querySelector("#authModalOverlay");
iniciarSesion.addEventListener("click", e => {
MenuIniciarSesion.style.display = "";
VerificaciondeusuarioDevolverPanel()

});
// BOTON CERRAR INICIO SESION

const  botoncerrar = document.querySelector(".auth-close-btn");

botoncerrar.addEventListener("click", e => {
MenuIniciarSesion.style.display = "none";
});