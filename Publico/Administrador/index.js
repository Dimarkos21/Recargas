// ====================================================================
//                          1. Selectores DOM
// ====================================================================
const Sucursal =  document.querySelector("#Sucursal");


// **NOTA IMPORTANTE: El script asume que los elementos existen.** // **Si uno es null, el error persiste. Asegúrate que en tu HTML:**
// 1. El input de Correo tiene id="Producto"
// 2. El input de Contraseña tiene id="Tratamiento"
// 3. El input de Rol tiene id="Precio" (Este fue el punto de error)

const form = document.querySelector("#form-presupuesto");
const correoInput = document.querySelector("#Producto"); // Usado como 'Correo'
const contraseñaInput = document.querySelector("#Tratamiento"); // Usado como 'Contraseña'
const rolInput = document.querySelector("#Precio"); // Usado como 'Rol'
const Correo = document.querySelector("#Correo"); 

const añadir = document.querySelector("#Añadir");
const tabla = document.querySelector("#tabla-datos"); // Tabla para mostrar empleados

// Selectores del menú desplegable
const botonMenu = document.querySelector("#boton-menu");
const datos1 = document.querySelector("#menu-desplegable");
const HomeBtn = document.querySelector("#Home-btn");
const RegistroBtn = document.querySelector("#Registro-btn");
const MensajeBtn = document.querySelector("#mensaje-btn");
const ProductosBtn = document.querySelector("#producto-btn");
const HistorialBtn = document.querySelector("#mensaje-historial");
const ConfiguracionBtn = document.querySelector("#config-btn");

// Asegúrate de que este selector DOM esté disponible en tu HTML


// 1. Selector DOM Corregido para apuntar al <tbody>
const tablaEmpleadosBody = document.querySelector("#tabla-datos"); 

// ====================================================================
//                      2. Funciones de Utilidad
// ====================================================================

// Selector para la notificación
const notificacion = document.getElementById("notificacion");

/**
 * Verifica si el string proporcionado tiene un formato de correo electrónico válido.
 * @param {string} inputCorreo El valor a verificar.
 * @returns {boolean} `true` si es válido, `false` en caso contrario.
 */
function verificarCorreo(inputCorreo) {
    // Expresión Regular para un correo electrónico estándar
    const regexCorreo = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (regexCorreo.test(inputCorreo)) {
        console.log(`"${inputCorreo}" es un correo válido.`);
        return true;
    } else {
        console.log(`"${inputCorreo}" NO es un correo válido. Por favor, revise el formato.`);
        return false;
    }
}

/**
 * Muestra una notificación temporal en la UI.
 * @param {string} mensaje El texto a mostrar.
 */
function mostrarNotificacion(mensaje) {
    if (!notificacion) {
        console.warn("Elemento #notificacion no encontrado.");
        return;
    }
    notificacion.textContent = mensaje;
    notificacion.classList.remove("oculto");
    notificacion.classList.add("visible");

    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove("visible");
        notificacion.classList.add("oculto");
    }, 3000);
}

/**
 * Función principal que contiene toda la lógica. 
 * Se ejecuta al cargar el DOM para asegurar que los selectores funcionen.
 */
async function inicializarAplicacion() {
  // Validar existencia de elementos críticos
  if (!form || !correoInput || !contraseñaInput || !rolInput || !tabla) {
    console.error("Uno o más selectores críticos de DOM son 'null'. Revisar el HTML.");
    mostrarNotificacion("Error de carga: No se encontraron los campos del formulario.");
    return;
  }

  // ====================================================================
  // 3. Carga Inicial de Datos
  // ====================================================================
  try {
    const respuesta = await axios.get("/api/negocios/empleados");

      const response  = await axios.get("/api/sucursales/Empleados");
      Sucursal.innerHTML = `<option disabled selected value="">Seleccione una sucursal</option>`;
      response.data.forEach(e  => {
        console.log(e)
  Sucursal.innerHTML += `<option  value = "${e._id}">${e.nombre} </option>`;

      });
    
  
    const empleados = Array.isArray(respuesta.data.empleados) ? respuesta.data.empleados : [];
  
    console.log("Empleados cargados:", empleados);

    tabla.innerHTML = ''; // Limpiar tabla antes de renderizar

    empleados.forEach((empleado, index) => {
     
      const {  id ,user, rol , email , numero} = empleado;
      let botonAccion  = `    <button class="config-delete" data-id="${id}">❌</button>`
    if (rol === "Propietario" ){
botonAccion = "";
    }
      
      tabla.innerHTML += `
        <tr id="row-${id}">
          <td>${email}</td>
          <td>${numero ? '*********' : ''}</td>
          <td>${rol}</td>
          <td>
       ${ botonAccion }
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error al cargar los empleados iniciales:", error);
    mostrarNotificacion("Error al cargar los datos iniciales.");
  }

  // ====================================================================
  // 4. Manejo del Formulario (Creación)
  // ====================================================================
  const nombre = document.querySelector("#Nombre");
  const numero = document.querySelector("#Numero");
  const cedula = document.querySelector("#Cedula");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correoValor = correoInput.value.trim();
    const contraseñaValor = contraseñaInput.value.trim();
    const rolValor = rolInput.value.trim();
if (!Sucursal.value) {
  return mostrarNotificacion("Propietario por favor agregar una sucursal parte  derecha 👍 o seleccione una sucursal ")
}
    const datos = {
      name: nombre.value.trim(),
      Cedula: cedula.value.trim(),
      email: correoValor,
      Sucursal: Sucursal.value ,
      numero: numero.value.trim(),
      password: contraseñaValor,
      role: rolValor
    };

    if (!verificarCorreo(datos.email)) {
      mostrarNotificacion("El formato del correo electrónico NO es válido.");
      correoInput.focus();
      return;
    }


    try {
      const publicacion = await axios.post("/api/negocios/empleados", datos);
      const nuevoDocumento = publicacion.data;
console.log(publicacion , nuevoDocumento)
    let LOL =  `<button class="config-delete" data-id="${nuevoDocumento.usuarioId || nuevoDocumento.empleado._id}">❌</button>`
    if (datos.role === "Propietario" ){
LOL = "";
    }
      const nuevaFilaHTML = `
        <tr id="row-${nuevoDocumento.usuarioId || nuevoDocumento.empleado._id}">
          <td>${datos.email}</td>
          <td>${datos.numero ? '*********' : ''}</td>
          <td>${datos.role}</td>
          <td>
${LOL ||  ""}
          </td>
        </tr>
      `;

      tabla.insertAdjacentHTML('beforeend', nuevaFilaHTML);

      correoInput.value = "";
      contraseñaInput.value = "";
     
      nombre.value = "";
      numero.value = "";

      mostrarNotificacion("Empleado creado con éxito: " + datos.email);
    } catch (error) {
      console.error("Error al crear el empleado:", error);

      let mensaje = "Ocurrió un error desconocido al guardar el empleado.";
      if (error.response?.data?.error) {
        mensaje = error.response.data.error;
      } else if (error.message) {
        mensaje = "Error de conexión: " + error.message;
      }

      mostrarNotificacion("ERROR: " + mensaje);
    }
  });

  // ====================================================================
  // 5. Manejo de la Eliminación
  // ====================================================================
  document.addEventListener("click", async (e) => {
    if (e.target && (e.target.classList.contains("config-delete") || e.target.closest('.config-delete'))) {
      e.preventDefault();

      const boton = e.target.closest('.config-delete');
      const idDocumento = boton.dataset.id;
      const row = document.querySelector(`#row-${idDocumento}`);

      if (!idDocumento) {
        console.error("No se pudo obtener el ID del documento para eliminar.");
        return;
      }

      if (!confirm(`¿Está seguro de eliminar el registro con ID: ${idDocumento}?`)) {
        return;
      }

      try {
        const respuesta = await axios.delete(`/api/negocios/${idDocumento}`);
        console.log("Respuesta de eliminación:", respuesta);

        if (row) {
          row.remove();
          mostrarNotificacion(`Registro con ID ${idDocumento} eliminado.`);
        } else {
          mostrarNotificacion(`Eliminado en servidor, pero no se encontró la fila ${idDocumento} en el DOM.`);
        }

      } catch (error) {
        console.error("Error al eliminar el registro:", error);
       
        if (error.response.status === 403) {
       mostrarNotificacion("No te puedes eliminar a ti mismo.")
        }
             if (error.response.status === 405) {
       mostrarNotificacion("Solo el propietario  puede eliminar a un empleado.")
        }
      }
    }
  });
}

// ====================================================================
//                     6. Barra de Navegación
// ====================================================================

// **Mejora:** Uso de encadenamiento opcional para prevenir errores si el elemento es 'null'




botonMenu.addEventListener("click" , e => {
 
  const menuDesplegable = document.querySelector("#menu-desplegable")
  const container2 = document.querySelector("#menu-desplegable")
  if ( container2.classList.contains("visible") ===true) {
      container2.classList.remove("visible")
      console.log(menuDesplegable)
  }else {  console.log("hdd")
      container2.classList.add("visible")}
  
  });
  
HomeBtn.addEventListener("click", e => {
    window.location.pathname = "/Casa";
});

RegistroBtn.addEventListener("click", e => {
    window.location.pathname = "/Inventario";
});

ProductosBtn.addEventListener("click", e => {
    window.location.pathname = "/Productos";
});

MensajeBtn.addEventListener("click", e => {
    window.location.pathname = "/Facturacion";
});

ConfiguracionBtn.addEventListener("click", e => {
    window.location.pathname = "/Configuracion";
});
    
HistorialBtn.addEventListener("click", e => {
    window.location.pathname = "/Historial";
});
const Presupuesto = document.querySelector("#Presupuesto-btn");
Presupuesto.addEventListener("click", e => {
    window.location.pathname = "/Presupuesto";
});

botonMenu.addEventListener("click", () => {
    // Lógica para toggle del menú
 

  if (  datos1.classList.contains("publica")) {
    datos1.classList.remove("publica")
      datos1.classList.add("restringida")
    } 
else  if   (datos1.classList.contains("restringida")){ 
        console.log("Menú oculto");
        datos1.classList.remove("restringida")
           datos1.classList.add("publica");
    }
});


// ====================================================================
//                      7. Inicialización Principal 
// ====================================================================

// Asegura que el script se ejecute solo cuando el DOM esté listo.
document.addEventListener("DOMContentLoaded", inicializarAplicacion);

//// LOGICA SUCURSALES 


const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const sucursalModal = document.getElementById('sucursalModal');

openModalBtn.addEventListener('click', () => {
      sucursalModal.classList.remove('btn-sucursal');
    sucursalModal.classList.add('active');
});

closeModalBtn.addEventListener('click', () => {
    sucursalModal.classList.remove('active');
});

sucursalModal.addEventListener('click', (event) => {
    if (event.target === sucursalModal) {
        sucursalModal.classList.remove('active');
    }
});

const formSucursal = document.getElementById('form-sucursal');
formSucursal.addEventListener('submit', async (event) => {
    event.preventDefault();       
    const nombre = document.querySelector('#nombre-sucursal').value; 
const calle = document.querySelector('#direccion-sucursal').value;
const estado = document.getElementById('estado').value;
const ciudad = document.getElementById('ciudad').value;
const numero = document.querySelector('#numero-sucursal').value;


    try {
      console.log(nombre, calle, estado.value, ciudad.value, numero);
      if (!nombre || !calle || !estado || !ciudad || !numero) {
        mostrarNotificacion("Por favor, completa todos los campos antes de enviar.");
        return;
    }
        const response = await axios.post('/api/sucursales', {
            nombre,
           calle, 
           estado,
           ciudad,
           
            numero
        });
        const data = await response.data;
     
        console.log('✅ Registro guardado:', data);
        formSucursal.reset(); // Limpiar el formulario
        sucursalModal.classList.remove('active');
    } catch (error) {
        console.error('❌ Error al guardar el registro:', error);
    if(error.status === 400){
        mostrarNotificacion("Se ha alcanzado el límite de sucursales permitidas ().");
    }
  }
});


 

const Estados = {
  "Amazonas": [
    "Puerto Ayacucho",
    "San Fernando de Atabapo",
    "La Esmeralda",
    "Maroa",
    "San Carlos de Río Negro",
    "Isla Ratón",
    "San Juan de Manapiare"
  ],
  "Anzoátegui": [
    "Barcelona",
    "Puerto La Cruz",
    "Lechería",
    "Guanta",
    "El Tigre",
    "Anaco",
    "Cantaura",
    "Pariaguán",
    "Clarines",
    "Onoto",
    "Boca de Uchire",
    "San José de Guanipa",
    "Aragua de Barcelona"
  ],
  "Apure": [
    "San Fernando de Apure",
    "Achaguas",
    "Guasdualito",
    "Elorza",
    "Biruaca",
    "San Juan de Payara",
    "Bruzual"
  ],
  "Aragua": [
    "Maracay",
    "Turmero",
    "El Limón",
    "Cagua",
    "La Victoria",
    "Santa Cruz de Aragua",
    "Palo Negro",
    "San Mateo",
    "Colonia Tovar",
    "Villa de Cura",
    "Camatagua",
    "San Sebastián de los Reyes"
  ],
  "Barinas": [
    "Barinas",
    "Barinitas",
    "Socopó",
    "Santa Bárbara",
    "Ciudad Bolivia",
    "Barrancas",
    "Pedraza",
    "Sabaneta"
  ],
  "Bolívar": [
    "Ciudad Bolívar",
    "Puerto Ordaz",
    "San Félix",
    "Upata",
    "Caicara del Orinoco",
    "Tumeremo",
    "Guasipati",
    "El Callao",
    "Santa Elena de Uairén",
    "Ciudad Piar"
  ],
  "Carabobo": [
    "Valencia",
    "Puerto Cabello",
    "Guacara",
    "Naguanagua",
    "San Diego",
    "Los Guayos",
    "Bejuma",
    "Morón",
    "San Joaquín",
    "Montalbán",
    "Miranda"
  ],
  "Cojedes": [
    "San Carlos",
    "Tinaquillo",
    "El Baúl",
    "El Pao",
    "Macapo",
    "Las Vegas"
  ],
  "Delta Amacuro": [
    "Tucupita",
    "Curiapo",
    "Pedernales",
    "Sierra Imataca"
  ],
  "Distrito Capital": [
    "Caracas"
  ],
  "Falcón": [
    "Coro",
    "Punto Fijo",
    "Píritu",
    "Tucacas",
    "Chichiriviche",
    "Dabajuro",
    "La Vela de Coro",
    "Capatárida",
    "Pedregal",
    "Santa Ana de Coro",
    "Yaracal"
  ],
  "Guárico": [
    "San Juan de los Morros",
    "Calabozo",
    "Valle de la Pascua",
    "Altagracia de Orituco",
    "Zaraza",
    "Tucupido",
    "El Socorro",
    "Las Mercedes del Poso",
    "Camaguán"
  ],
  "Lara": [
    "Barquisimeto",
    "Cabudare",
    "Carora",
    "El Tocuyo",
    "Quíbor",
    "Duaca",
    "Sanare",
    "Sarare",
    "Siquisique"
  ],
  "Mérida": [
    "Mérida",
    "El Vigía",
    "Tovar",
    "Ejido",
    "Mucuchíes",
    "Santa Cruz de Mora",
    "La Azulita",
    "Nueva Bolivia",
    "Timotes"
  ],
  "Miranda": [
    "Los Teques",
    "Petare",
    "Guarenas",
    "Guatire",
    "Charallave",
    "Cúa",
    "Santa Teresa del Tuy",
    "Ocumare del Tuy",
    "Santa Lucía",
    "Higuerote",
    "Río Chico",
    "San Antonio de los Altos",
    "Carrizal",
    "Chacao",
    "Baruta",
    "El Hatillo"
  ],
  "Monagas": [
    "Maturín",
    "Punta de Mata",
    "Caripito",
    "Caicara de Maturín",
    "Temblador",
    "Quiriquire",
    "Aragua de Maturín",
    "Barrancas del Orinoco",
    "Caripe"
  ],
  "Nueva Esparta": [
    "La Asunción",
    "Porlamar",
    "Pampatar",
    "Juan Griego",
    "San Juan Bautista",
    "El Valle del Espíritu Santo",
    "Punta de Piedras"
  ],
  "Portuguesa": [
    "Guanare",
    "Acarigua",
    "Araure",
    "Villa Bruzual",
    "Píritu",
    "Biscucuy",
    "San Rafael de Onoto",
    "El Playón"
  ],
  "Sucre": [
    "Cumaná",
    "Carúpano",
    "Güiria",
    "Río Caribe",
    "Cariaco",
    "Cumanacoa",
    "Araya",
    "El Pilar",
    "Yaguaraparo"
  ],
  "Táchira": [
    "San Cristóbal",
    "Táriba",
    "San Antonio del Táchira",
    "Ureña",
    "Rubio",
    "La Fría",
    "Colón",
    "Palmira",
    "Cordero",
    "Pregonero",
    "La Grita",
    "San Rafael del Piñal"
  ],
  "Trujillo": [
    "Trujillo",
    "Valera",
    "Boconó",
    "Carache",
    "Sabana de Mendoza",
    "Escuque",
    "Motatán",
    "Pampán",
    "La Ceiba"
  ],
  "La Guaira": [
    "La Guaira",
    "Maiquetía",
    "Catia La Mar",
    "Caraballeda",
    "Naiguatá",
    "Macuto"
  ],
  "Yaracuy": [
    "San Felipe",
    "Yaritagua",
    "Chivacoa",
    "Nirgua",
    "Cocorote",
    "Aroa",
    "Urachiche"
  ],
  "Zulia": [
    "Maracaibo",
    "Cabimas",
    "Ciudad Ojeda",
    "San Francisco",
    "Machiques",
    "La Villa del Rosario",
    "Ojeda",
    "Santa Rita",
    "Los Puertos de Altagracia",
    "San Carlos del Zulia",
    "Encontrados",
    "Bachaquero",
    "Lagunillas"
  ]
};



estado.addEventListener('change', () => {
    const estadoSeleccionado = estado.value;
    ciudad.innerHTML = '<option value="" disabled selected>Selecciona una ciudad</option>'; // Limpiar y agregar opción por defecto

    // Validar usando el objeto correcto "Estados"
    if (Estados[estadoSeleccionado]) {
        Estados[estadoSeleccionado].forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            ciudad.appendChild(option);
        });
    }
});
