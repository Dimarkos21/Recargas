const botonMenu = document.querySelector("#boton-menu");
// --- SELECCIÓN DE ELEMENTOS ---
const HomeBtn = document.querySelector("#Home-btn");
const RegistroBtn = document.querySelector("#Registro-btn");

const MensajeBtn = document.querySelector("#mensaje-btn");
const ConfiguracionBtn = document.querySelector("#config-btn");
const HistorialBtn = document.querySelector("#mensaje-historial");
const administradorBtn = document.querySelector("#administrador-btn");
const  ProductosBTN = document.querySelector("#producto-btn");

const PresupuestoBTN = document.querySelector("#Presupuesto-btn");

const configurarBoton = (btn, ruta) => {
    if (btn) btn.addEventListener("click", () => window.location.pathname = ruta);
};


const  d = document.querySelector("#Pedidos-btn");  
configurarBoton(HomeBtn, "/Casa");
configurarBoton(RegistroBtn, "/Inventario");
configurarBoton(MensajeBtn, "/Facturacion");
configurarBoton(ConfiguracionBtn, "/Configuracion");
configurarBoton(administradorBtn, "/Administrador");
configurarBoton(HistorialBtn, "/Historial");

configurarBoton(ProductosBTN, "/Productos");
configurarBoton( PresupuestoBTN, "/Presupuesto");
configurarBoton( d, "/Pedidos");
const ClientesBTN = document.querySelector("#Clientes-btn");
configurarBoton( ClientesBTN, "/Clientes");
const ControlGastosBTN = document.querySelector("#controlGastos-btn");
configurarBoton( ControlGastosBTN , "/Control/Gastos");

// barra de navegacion
      const container2 = document.querySelector("#menu-desplegable");
    (() => {
console.log(1);
    });
    /**
 * Muestra una notificación flotante
 * @param {string} mensaje - El texto a mostrar
 * @param {string} tipo - 'success', 'error', o 'info'
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    const container = document.getElementById('notification-container');
 
    // Crear el elemento de la notificación
    const toast = document.createElement('div');
    toast.classList.add('toast', tipo);
    toast.innerText = mensaje;

    // Agregar al contenedor
    container.appendChild(toast);

    // Eliminar del DOM después de que termine la animación (3 segundos total)
    setTimeout(() => {
        toast.remove();
    }, 1200);
}
 botonMenu.addEventListener("click" , e => {
 
       
      
            if ( container2.classList.contains("visible") ===true) {
                container2.classList.remove("visible")
              
              
            }else { 
                container2.classList.add("visible")
        
        }
            
            });
 
            const registroCliente = document.querySelector("#registroCliente");
        const registroCedula= document.querySelector("#Cedula");
          const registroNombre= document.querySelector("#Nombre");
                const registroTelefono= document.querySelector("#Telefono");
                const  registroOcupacion = document.querySelector("#Ocupacion"); 
                        const registroFecha = document.querySelector("#Fecha");
            registroCliente.addEventListener('submit',async  e =>{
e.preventDefault();
                try {
          const Datos = {

            Nombre: registroNombre.value.trim(),
            Cedula: registroCedula.value.trim(),
            Telefono: registroTelefono.value.trim(),
            Ocupacion: registroOcupacion.value.trim(),
            Fecha: registroFecha.value // Si es un input type="date"
        };

const regexCedula = /^[VJEGP][0-9]{6,9}$/i;
if (!regexCedula.test(Datos.Cedula) ) {
 return mostrarNotificacion('Cedula invalida');
}
const validarTelefonoVzla = (numero) => {
    // Explicación de la Regex:
    // ^04         -> Debe empezar por 04
    // (12|14|24|16|26) -> Seguido de uno de estos códigos
    // [0-9]{7}$   -> Y terminar con exactamente 7 números más
    const regex = /^04(12|14|24|16|26)[0-9]{7}$/;
    return regex.test(numero);
};

// Uso en tu evento de registro:
const tlf = registroTelefono.value.trim();

if (!validarTelefonoVzla(tlf)) {
    return mostrarNotificacion("Número inválido. Use formato: 04121234567", "error");
}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
             const respuesta = await axios.post("/api/clientes/c" , Datos);
                  if (respuesta.status === 403) {
                    mostrarNotificacion("Cedula invalida , Rif o Telefono")  
        } 
       if (respuesta.status === 404) {
                    mostrarNotificacion("Cliente  ya Registrado")  
        } 

        


     
    mostrarNotificacion("Cliente Guardado")  
    registroCliente.reset();
     
                } catch(error){
                
               mostrarNotificacion("Cliente Registrado")       
console.log(error);
                }
            });



            const btnCargar = document.querySelector('#btn-cargar');
const listaContenedor = document.querySelector('#lista-clientes');

// Función para obtener datos del servidor
const cargarClientes = async () => {
    try {
        listaContenedor.innerHTML = '<p class="loading-text">Cargando clientes...</p>';
        
        const res = await axios.get('/api/clientes/c');
        console.log(res.data.cliente)
        const clientes = res.data.cliente; // Suponiendo que devuelve un array de clientes

        if (clientes.length === 0) {
            listaContenedor.innerHTML = '<p class="loading-text">No hay clientes registrados.</p>';
            return;
        }

        // Construir la tabla
        let tablaHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Cédula</th>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Ocupación</th>
                    </tr>
                </thead>
                <tbody>
        `;

        clientes.forEach(c => {
            tablaHTML += `
                <tr>
                    <td><strong>${c.cedula}</strong></td>
                    <td>${c.nombre}</td>
                    <td>${c.telefono}</td>
                    <td><span class="badge">${c.ocupacion || 'N/A'}</span></td>
                </tr>
            `;
        });

        tablaHTML += `</tbody></table>`;
        listaContenedor.innerHTML = tablaHTML;

        mostrarNotificacion("Clientes cargados", "success");

    } catch (error) {
        console.error(error);
        mostrarNotificacion("Error al obtener clientes", "error");
        listaContenedor.innerHTML = '<p class="loading-text" style="color:red">Error al conectar con el servidor.</p>';
    }
};
cargarClientes();
// Escuchar el clic del botón
btnCargar.addEventListener('click', cargarClientes);

// Opcional: Cargar automáticamente al iniciar la página
// document.addEventListener('DOMContentLoaded', cargarClientes);


