// ⭐ Selección inicial de botones y elementos del menú
const HomeBtn = document.querySelector("#Home-btn");
const RegistroBtn = document.querySelector("#Registro-btn");
// CORRECCIÓN: Usar el mismo selector para el botón de mensaje.
const MensajeBtn = document.querySelector("#mensaje-btn"); 
const botonMenu = document.querySelector("#boton-menu");
import './index.css'; // <--- ¡ESTO ES VITAL!
// La selección de 'cerrarSesion' aquí es innecesaria si se usa el delegation de eventos (ver abajo)
// const cerrarSesion = document.querySelector("#cerrar-sesion"); 


// ----------------------------------------------------------------------
// ⭐ Lógica para Cargar Información de Configuración (Función Auto-ejecutable)
// --------------------a--------------------------------------------------

(async () => {
    try {
        const { data } = await axios.get('/api/configuracion');
        console.log(data);
        
        // CORRECCIÓN: Usar una sola variable para el contenedor
        const containerInfo = document.querySelector("#contenedor-info"); 

        if (!containerInfo) {
            console.error("Contenedor '#contenedor-info' no encontrado en el DOM.");
            return;
        }

        // ⭐ CORRECCIÓN CLAVE: Usamos innerHTML para agregar el contenido. 
        // No necesitamos (ni debemos) usar .appendChild(containerInfo) después.
        containerInfo.innerHTML += `
            <section id="informacion">
                <article id="nombre" class="info-item">
                    <h2 class="titulo">Nombre y Apellido:</h2>
                    <p class="valor">${data[0] || 'N/A'}</p>
                </article>

                <article id="correo" class="info-item">
                    <h2 class="titulo">Correo electrónico:</h2>
                    <p class="valor">${data[1] || 'N/A'}</p>
                </article>

                <article id="numero" class="info-item">
                    <h2 class="titulo">Numero de telefono:</h2>
                    <p class="valor">${data[2] || 'N/A'}</p>
                </article>

                <article id="negocio" class="info-item">
                    <h2 class="titulo">Negocio o compañia:</h2>
                    <p class="valor">${data[3] || 'N/A'}</p>
                </article>
                
                <div id="div-container"> 
                    <button id="cerrar-sesion" class="boton">Cerrar sesion</button>
                </div>
            </section>
        `;

        // ❌ LÍNEA ELIMINADA:
        // containerInfo.appendChild(listItem); // ¡Esto causaba el HierarchyRequestError!
    
    } catch (error) {
            window.location.pathname = "/Login/"
        console.error('Error al cargar la configuración:', error.message);
    }
})();

// ----------------------------------------------------------------------
// ⭐ Lógica del Menú Desplegable
// ----------------------------------------------------------------------

botonMenu.addEventListener("click" , e => {
    // CORRECCIÓN: Usar una sola variable para el menú
    const menuDesplegable = document.querySelector("#menu-desplegable");
    
    if (!menuDesplegable) return;

    // Alternar la clase 'visible'
    menuDesplegable.classList.toggle("visible");

    // Los console.log internos son redundantes en producción, pero se mantienen si los necesitas para debug.
    if (menuDesplegable.classList.contains("visible")) {
        console.log("Menú visible");
    } else { 
        console.log("Menú oculto");
    }
});

// ----------------------------------------------------------------------
// ⭐ Lógica de Navegación de Botones
// ----------------------------------------------------------------------

HomeBtn.addEventListener("click", () => {
    window.location.pathname = "/Casa";
});

RegistroBtn.addEventListener("click", () => {
    window.location.pathname = "/Inventario";
});

const ProductosBtn = document.querySelector("#producto-btn");
ProductosBtn.addEventListener("click", () => {
    window.location.pathname = "/Productos";
});

// CORRECCIÓN: Se usa la variable inicial 'MensajeBtn' para evitar duplicidad y typos.
MensajeBtn.addEventListener("click", () => {
    window.location.pathname = "/Inventario";
});


const ConfiguracionBtn = document.querySelector("#config-btn");
ConfiguracionBtn.addEventListener("click", () => {
    window.location.pathname = "/Configuracion";
});

const AdminBtn = document.querySelector("#administrador-btn");
AdminBtn.addEventListener("click", () => {
    window.location.pathname = "/Administrador";
});
const ControlGastosBTN = document.querySelector("#controlGastos-btn");

ControlGastosBTN.addEventListener("click", e => {
    window.location.pathname = "/Control/Gastos"

})
// ----------------------------------------------------------------------
// ⭐ Lógica de Cerrar Sesión (Usando Event Delegation)
// ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    // Delegamos el evento de click al documento para capturar el botón de cerrar sesión
    // incluso si se inserta dinámicamente.
    document.addEventListener("click", async (e) => {
        // e.target.closest("#cerrar-sesion") funciona incluso si el botón fue agregado con innerHTML
        if (e.target.closest("#cerrar-sesion")) {
            try {
                await axios.get("/api/logout");
                window.location.pathname = "/Login/";
            } catch (error) {
                console.log("Error al cerrar sesión:", error);
                // Opcional: mostrar un mensaje de error al usuario
            }
        }
    });
});

const PresupuestoHTML = document.querySelector("#Presupuesto-btn");
PresupuestoHTML.addEventListener("click", e => {
    window.location.pathname = "/Presupuesto"

});