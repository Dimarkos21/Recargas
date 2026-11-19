

// aislamientos
const Paciente = document.querySelector("#Paciente")
const Cedula = document.querySelector("#Cedula")
const Telefono = document.querySelector("#Telefono")
const Edad = document.querySelector("#Edad")
const  Patologia = document.querySelector("#Patologia")
const  OD= document.querySelector("#OD")
const OI = document.querySelector("#OI")
const Adicion = document.querySelector("#Adicion")
const  DP = document.querySelector("#DP")
const Altura = document.querySelector("#Altura1")
const Resultados = document.querySelector("#Resultados")
const Montura = document.querySelector("#Montura")
const Cristales = document.querySelector("#Cristales")
// contenedores
const contenedor2 = document.querySelector("#contenedor2")
const botonMenu = document.querySelector("#boton-menu")
const datos1 = document.querySelector("#sugerencias1")
const HomeBtn = document.querySelector("#Home-btn")
const RegistroBtn = document.querySelector("#Registro-btn")
const MensajeBtn = document.querySelector("#mensaje-btn")
const boton = document.querySelector("#boton")
const datos = document.querySelector("#sugerencias")
const configDelete = document.querySelector("#config-delete")
const ProductosBtn = document.querySelector("#producto-btn");

const ConfiguracionBtn = document.querySelector("#config-btn");
const costo = document.querySelector("#Costo");

/// mostrar NOTIFICACION MAESTRA Y BONITA
function mostrarNotificacion(mensaje) {
    const notificacion = document.getElementById("notificacion");
    notificacion.textContent = mensaje;
    notificacion.classList.remove("oculto");
    notificacion.classList.add("publico");

    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove("publico");
        notificacion.classList.add("oculto");
    }, 5000);
}
/// mostrar NOTIFICACION MAESTRA Y BONITA
//Funcion para anadir atomaticamente al historial algo eliminado

botonMenu.addEventListener("click" , e => {
 
const menuDesplegable = document.querySelector("#menu-desplegable")
const container2 = document.querySelector("#menu-desplegable")
if ( container2.classList.contains("visible") ===true) {
    container2.classList.remove("visible")
    console.log(menuDesplegable)
}else {  console.log("hdd")
    container2.classList.add("visible")}

})
;

// Obtener la fecha 
function crearFechaActual() {
    const fecha = new Date(); // Crea una instancia de la fecha actual

    // Obtén los componentes
    const dia = fecha.getDate().toString().padStart(2, '0'); // Día (2 dígitos)
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Mes (0 indexado, +1 para corregir)
    const año = fecha.getFullYear(); // Año completo (ej: 2025)

    // Formatear como "dd/mm/yyyy"
    return `${dia}/${mes}/${año}`;
}

const ul = document.querySelector('ul');
const form = document.querySelector('#formulario');

// Obtener la fecha 
function crearFechaActual() {
    const fecha = new Date(); // Crea una instancia de la fecha actual

    // Obtén los componentes
    const dia = fecha.getDate().toString().padStart(2, '0'); // Día (2 dígitos)
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Mes (0 indexado, +1 para corregir)
    const año = fecha.getFullYear(); // Año completo (ej: 2025)

    // Formatear como "dd/mm/yyyy"
    return `${dia}/${mes}/${año}`;
}
//Papelera 
async function actualizarContadorPapelera() {
    try {
        // Llamada a tu nuevo endpoint
        const response = await axios.get('/api/todos/Papelera/cantidad');
        const { total } = response.data;

        // Buscamos el elemento donde está el número (ajusta el selector según tu HTML)
        const contadorElemento = document.querySelector("#contadorPapelera"); 
        
        if (contadorElemento) {
            contadorElemento.textContent = total;
        }
        console.log(total)
    } catch (error) {
        console.error("Error al actualizar el contador de papelera:", error);
    }
}

// Contadores de tareas
// Cargar las tareas desde el servidor cuando se inicia la aplicación
(async () => {
    try {
        const { data } = await axios.get('/api/todos');
        actualizarContadorPapelera();
                console.log(data)
        data.forEach(todo => {
         console.log(todo)
            const tabla = document.querySelector("#sugerencias");
            const listItem = document.createElement('div');
            listItem.id = todo.id;
       const fechaUTC = new Date(todo.fecha);

// Configurar la conversión a la hora local de Venezuela
const opciones = {
  timeZone: 'America/Caracas',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
};

const FechaLocal = new Intl.DateTimeFormat('es-VE', opciones).format(fechaUTC);
            listItem.innerHTML += `

            
              <div id="p-datos">

            <input class="input-datos" value="${todo.paciente || 'Sin nombre'}" readonly></input>
            <input class="input-datos" value="${todo.cedula || 0}" readonly></input>
            <input class="input-datos" value="${FechaLocal || 0}" readonly></input>

                   

        
      
            
            <button id="config-delete">
                <script src="https://cdn.lordicon.com/lordicon.js"></script>
                <lord-icon
                    src="https://cdn.lordicon.com/zxvuvcnc.json"
                    trigger="hover"
                    style="width:30px;height:30px">
                </lord-icon>
            </button>
            
            <button id="config">
                <script src="https://cdn.lordicon.com/lordicon.js"></script>
                <lord-icon
                    src="https://cdn.lordicon.com/lomfljuq.json"
                    trigger="hover"
                    style="width:30px;height:30px">
                </lord-icon>
            </button>

                  <div id="config-container">
            <button id="info"><script src="https://cdn.lordicon.com/lordicon.js"></script>
<lord-icon
    src="https://cdn.lordicon.com/fikcyfpp.json"
    trigger="hover"
    style="width:30px;height:30px">
</lord-icon>
</button>
</div>
        </div>
    
            `;

         

            tabla.appendChild(listItem);

             
        });
    } catch (error) {
        
        console.error('Error al cargar tareas:', error);

    }
})();








     // eliminar
     const infoBtn = document.querySelector("#info");
const containerMas = document.querySelector(".container-mas");

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", async (e) => {
        if (e.target.closest("#info")) {
           console.log(1)
            const boton = e.target.closest("#info");

            // Obtener los datos del producto
            const { data } = await axios.get("/api/todos");
            const productos = Array.isArray(data) ? data : [data];
console.log(data)
console.log(productos)
            // Identificar el div padre seleccionado
            const padre = boton.parentElement.parentElement.parentElement; // Selecciona el div exacto
         console.log(padre)

            if (!padre.classList.contains("container-mas")) {
console.log(productos)

                // Filtrar el producto que NO corresponde al div seleccionado (para agregar contenido)
                
                console.log(padre.id)
                const productoSeleccionado = productos.find(producto => producto.id=== padre.id);
                console.log(padre.id)
     console.log(productoSeleccionado)
                    console.log(2)
                if (productoSeleccionado) {
                    console.log(productoSeleccionado)
                    console.log(3)
                    padre.classList.add("container-mas"); // Añadir la clase
                    padre.style.width = "100%"; // Para ocupar todo el ancho disponible

                    padre.style.maxHeight = "500rem"; // Ajusta el tamaño máximo según el contenido
                    padre.style.overflow = "visible"; // Asegúrate de que el contenido sea visible
                    padre.style.transition = "max-height 0.5s ease-out"; // Animación suave
const fechaUTC = new Date(productoSeleccionado.fecha);

// Configurar la conversión a la hora local de Venezuela
const opciones = {
  timeZone: 'America/Caracas',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
};

const FechaLocal = new Intl.DateTimeFormat('es-VE', opciones).format(fechaUTC);
                    // Actualizar el contenido del div seleccionado
      
 if (!productoSeleccionado.oftamologia){
   
    padre.innerHTML = `                        
    <div id="descripcion">      
        <h3 class="seccion-titulo">Datos del Paciente</h3>
        <div class="grid-datos-personales">
            <div class="campo">
                <p>Nombre:</p>
                <input class="input-datos" id="NombreActualizado" value="${productoSeleccionado.paciente || 'Sin nombre'}">
            </div>
            <div class="campo">
                <p>Cédula:</p>
                <input class="input-datos" id="CedulaActualizada" value="${productoSeleccionado.cedula || 0}">
            </div>
            <div class="campo">
                <p>Teléfono:</p>
                <input class="input-datos" id="TelefonoActualizado" value="${productoSeleccionado.telefono || 0}">
            </div>
            <div class="campo">
                <p>Edad:</p>
                <input class="input-datos" id="EdadActualizada" value="${productoSeleccionado.edad || 0}">
            </div>
            <div class="campo full-width">
                <p>Patología:</p>
                <input class="input-datos" id="PatologiaActualizada" value="${productoSeleccionado.patologia || 'Ninguna'}">
            </div>
        </div>

        
        <h3 class="seccion-titulo">Graduación (Fórmula)</h3>
        <div class="tabla-wrapper">
            <table class="tabla-clinica">
                <thead>
                    <tr>
                        <th>Ojo</th>
                        <th>Esfera</th>
                        <th>Cilindro</th>
                        <th>Eje</th>
                        <th>Adición</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>O.D.</strong></td>
                        <td><input type="text" class="input-tabla" id="od_esfera" value="${productoSeleccionado.formula?.od?.esfera || '0.00'}"></td>
                        <td><input type="text" class="input-tabla" id="od_cilindro" value="${productoSeleccionado.formula?.od?.cilindro || '0.00'}"></td>
                        <td><input type="text" class="input-tabla" id="od_eje" value="${productoSeleccionado.formula?.od?.eje || '0'}"></td>
                        <td><input type="text" class="input-tabla" id="od_adicion" value="${productoSeleccionado.formula?.od?.adicion || '0.00'}"></td>
                    </tr>
                    <tr>
                        <td><strong>O.I.</strong></td>
                        <td><input type="text" class="input-tabla" id="oi_esfera" value="${productoSeleccionado.formula?.oi?.esfera || '0.00'}"></td>
                        <td><input type="text" class="input-tabla" id="oi_cilindro" value="${productoSeleccionado.formula?.oi?.cilindro || '0.00'}"></td>
                        <td><input type="text" class="input-tabla" id="oi_eje" value="${productoSeleccionado.formula?.oi?.eje || '0'}"></td>
                        <td><input type="text" class="input-tabla" id="oi_adicion" value="${productoSeleccionado.formula?.oi?.adicion || '0.00'}"></td>
                    </tr>
                </tbody>
            </table>
        </div>

      

        <h3 class="seccion-titulo">Especificaciones Técnicas</h3>
        <div class="tabla-wrapper">
            <table class="tabla-clinica tabla-tecnica">
                <thead>
                    <tr>
                        <th>Tipo de Cristales</th>
                        <th>Tratamiento</th>
                        <th>D.P. (mm)</th>
                        <th>Altura</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><input type="text" class="input-tabla wide" id="CristalesActualizado" value="${productoSeleccionado.formula?.cristales || 'Sin definir'}"></td>
                        <td><input type="text" class="input-tabla wide" id="TratamientoActualizado" value="${productoSeleccionado.formula?.tratamiento || 'Sin tratamiento'}"></td>
                        <td><input type="text" class="input-tabla" id="DPActualizado" value="${productoSeleccionado.formula?.dp || 0}"></td>
                        <td><input type="text" class="input-tabla" id="AlturaActualizada" value="${productoSeleccionado.formula?.altura || 0}"></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="grid-datos-personales" style="margin-top: 20px;">
            <div class="campo">
                <p>Montura:</p>
                <input class="input-datos" id="MonturaActualizada" value="${productoSeleccionado.montura || 'Sin montura'}">
            </div>
            <div class="campo">
                <p>Resultados:</p>
                <input class="input-datos" id="ResultadosActualizado" value="${productoSeleccionado.resultados || 'Sin observaciones'}">
                                                <p>Responsable:</p>

                <input class="input-datos" id="ResponsableActualizado" value="${productoSeleccionado.responsable?.nombre || 'Sin observaciones'}">
            </div>
        </div>
        
        <div class="fecha-footer">
            <p>Fecha de Registro: <span>${FechaLocal || 'Sin fecha'}</span></p>
        </div>
    </div>

    <div id="container-boton">
        <button id="config-delete" title="Eliminar">
            <lord-icon src="https://cdn.lordicon.com/zxvuvcnc.json" trigger="hover" style="width:35px;height:35px"></lord-icon>
        </button>
        <button id="config" title="Guardar cambios">
            <lord-icon src="https://cdn.lordicon.com/lomfljuq.json" trigger="hover" style="width:35px;height:35px"></lord-icon>
        </button>
        <div id="config-container">
            <button id="info" title="Más información">
                <lord-icon src="https://cdn.lordicon.com/fikcyfpp.json" trigger="hover" style="width:35px;height:35px"></lord-icon>
            </button>
        </div>
    </div>
`;}
   else     { 
    console.log(productoSeleccionado.responsable)
const DatosFormula = productoSeleccionado.oftamologia;
    const OFTAMOLOGIA = `
    <div class="opti-card-container">
    <h3 class="opti-card-title">Examen Oftalmológico</h3>
    
    <div class="opti-card-grid">
        <!-- OJO DERECHO (OD) -->
        <div class="opti-card-column">
            <div class="opti-card-header-col od">Ojo Derecho (O.D.)</div>
            <ul class="opti-card-list">
                <li><span class="opti-card-label">Lejos</span><span class="opti-card-value" id="opti-od-lejos">${ DatosFormula.OD.Lejos|| 0}</span></li>
                <li><span class="opti-card-label">Cerca</span><span class="opti-card-value" id="opti-od-cerca">${DatosFormula.OD.Cerca || 0}</span></li>
                <li><span class="opti-card-label">PIO</span><span class="opti-card-value" id="opti-od-pio">${DatosFormula.OD.PIO || 0}</span></li>
                <li><span class="opti-card-label">DNP_L</span><span class="opti-card-value" id="opti-od-dnpl">${DatosFormula.OD.DNP_L|| 0}</span></li>
                <li><span class="opti-card-label">DNP_C</span><span class="opti-card-value" id="opti-od-dnpc">${DatosFormula.OD.DNP_C || 0}</span></li>
                <li><span class="opti-card-label">DV</span><span class="opti-card-value" id="opti-od-dv">${DatosFormula.OD.DV || 0}</span></li>
                <li><span class="opti-card-label">AP</span><span class="opti-card-value" id="opti-od-ap">${DatosFormula.OD.AP || 0}</span></li>
                <li><span class="opti-card-label">AF</span><span class="opti-card-value" id="opti-od-af">${DatosFormula.OD.AF || 0}</span></li>
            </ul>
        </div>

        <!-- OJO IZQUIERDO (OI) -->
        <div class="opti-card-column">
            <div class="opti-card-header-col oi">Ojo Izquierdo (O.I.)</div>
            <ul class="opti-card-list">
                <li><span class="opti-card-label">Lejos</span><span class="opti-card-value" id="opti-oi-lejos">${DatosFormula.OI.Lejos || 0}</span></li>
                <li><span class="opti-card-label">Cerca</span><span class="opti-card-value" id="opti-oi-cerca">${DatosFormula.OI.Cerca || 0}</span></li>
                <li><span class="opti-card-label">PIO</span><span class="opti-card-value" id="opti-oi-pio">${DatosFormula.OI.PIO || 0}</span></li>
                <li><span class="opti-card-label">DNP_L</span><span class="opti-card-value" id="opti-oi-dnpl">${DatosFormula.OI.DNP_L || 0}</span></li>
                <li><span class="opti-card-label">DNP_C</span><span class="opti-card-value" id="opti-oi-dnpc">${DatosFormula.OI.DNP_C  || 0}</span></li>
                <li><span class="opti-card-label">DV</span><span class="opti-card-value" id="opti-oi-dv">${DatosFormula.OI.DV || 0}</span></li>
                <li><span class="opti-card-label">AP</span><span class="opti-card-value" id="opti-oi-ap">${ DatosFormula.OI.AP|| 0}</span></li>
                <li><span class="opti-card-label">AF</span><span class="opti-card-value" id="opti-oi-af">${ DatosFormula.OI.AF || 0}</span></li>
            </ul>
        </div>
    </div>
</div>
    `;
    padre.innerHTML = `                        
    <div id="descripcion">      
        <h3 class="seccion-titulo">Datos del Paciente</h3>
        <div class="grid-datos-personales">
            <div class="campo">
                <p>Nombre:</p>
                <input class="input-datos" id="NombreActualizado" value="${productoSeleccionado.paciente || 'Sin nombre'}">
            </div>
            <div class="campo">
                <p>Cédula:</p>
                <input class="input-datos" id="CedulaActualizada" value="${productoSeleccionado.cedula || 0}">
            </div>
            <div class="campo">
                <p>Teléfono:</p>
                <input class="input-datos" id="TelefonoActualizado" value="${productoSeleccionado.telefono || 0}">
            </div>
            <div class="campo">
                <p>Edad:</p>
                <input class="input-datos" id="EdadActualizada" value="${productoSeleccionado.edad || 0}">
            </div>
            <div class="campo full-width">
                <p>Patología:</p>
                <input class="input-datos" id="PatologiaActualizada" value="${productoSeleccionado.patologia || 'Ninguna'}">
            </div>
        </div>

        
        <h3 class="seccion-titulo">Graduación (Fórmula)</h3>
        <div class="tabla-wrapper">
            <table class="tabla-clinica">
                <thead>
                    <tr>
                        <th>Ojo</th>
                        <th>Esfera</th>
                        <th>Cilindro</th>
                        <th>Eje</th>
                        <th>Adición</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>O.D.</strong></td>
                        <td><input type="text" class="input-tabla" id="od_esfera" value="${productoSeleccionado.formula?.od?.esfera || '0.00'}"></td>
                        <td><input type="text" class="input-tabla" id="od_cilindro" value="${productoSeleccionado.formula?.od?.cilindro || '0.00'}"></td>
                        <td><input type="text" class="input-tabla" id="od_eje" value="${productoSeleccionado.formula?.od?.eje || '0'}"></td>
                        <td><input type="text" class="input-tabla" id="od_adicion" value="${productoSeleccionado.formula?.od?.adicion || '0.00'}"></td>
                    </tr>
                    <tr>
                        <td><strong>O.I.</strong></td>
                        <td><input type="text" class="input-tabla" id="oi_esfera" value="${productoSeleccionado.formula?.oi?.esfera || '0.00'}"></td>
                        <td><input type="text" class="input-tabla" id="oi_cilindro" value="${productoSeleccionado.formula?.oi?.cilindro || '0.00'}"></td>
                        <td><input type="text" class="input-tabla" id="oi_eje" value="${productoSeleccionado.formula?.oi?.eje || '0'}"></td>
                        <td><input type="text" class="input-tabla" id="oi_adicion" value="${productoSeleccionado.formula?.oi?.adicion || '0.00'}"></td>
                    </tr>
                </tbody>
            </table>
        </div>

    
        <h3 class="seccion-titulo">Especificaciones Técnicas</h3>
        <div class="tabla-wrapper">
            <table class="tabla-clinica tabla-tecnica">
                <thead>
                    <tr>
                        <th>Tipo de Cristales</th>
                        <th>Tratamiento</th>
                        <th>D.P. (mm)</th>
                        <th>Altura</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><input type="text" class="input-tabla wide" id="CristalesActualizado" value="${productoSeleccionado.formula?.cristales || 'Sin definir'}"></td>
                        <td><input type="text" class="input-tabla wide" id="TratamientoActualizado" value="${productoSeleccionado.formula?.tratamiento || 'Sin tratamiento'}"></td>
                        <td><input type="text" class="input-tabla" id="DPActualizado" value="${productoSeleccionado.formula?.dp || 0}"></td>
                        <td><input type="text" class="input-tabla" id="AlturaActualizada" value="${productoSeleccionado.formula?.altura || 0}"></td>
                    </tr>
                </tbody>
            </table>
        </div>
  ${OFTAMOLOGIA}

        <div class="grid-datos-personales" style="margin-top: 20px;">
            <div class="campo">
                <p>Montura:</p>
                <input class="input-datos" id="MonturaActualizada" value="${productoSeleccionado.montura || 'Sin montura'}">
            </div>
            <div class="campo">
                <p>Resultados:</p>
                <input class="input-datos" id="ResultadosActualizado" value="${productoSeleccionado.resultados || 'Sin observaciones'}">
                                <p>Responsable:</p>

                <input class="input-datos" id="ResponsableActualizado" value="${productoSeleccionado.responsable?.nombre || 'Sin observaciones'}">
            </div>
        </div>
        
        <div class="fecha-footer">
            <p>Fecha de Registro: <span>${FechaLocal || 'Sin fecha'}</span></p>
        </div>
    </div>

    <div id="container-boton">
        <button id="config-delete" title="Eliminar">
            <lord-icon src="https://cdn.lordicon.com/zxvuvcnc.json" trigger="hover" style="width:35px;height:35px"></lord-icon>
        </button>
        <button id="config" title="Guardar cambios">
            <lord-icon src="https://cdn.lordicon.com/lomfljuq.json" trigger="hover" style="width:35px;height:35px"></lord-icon>
        </button>
        <div id="config-container">
            <button id="info" title="Más información">
                <lord-icon src="https://cdn.lordicon.com/fikcyfpp.json" trigger="hover" style="width:35px;height:35px"></lord-icon>
            </button>
        </div>
    </div>
`
}
                }
            } else {
                // Si ya tiene la clase container-mas, agregar más detalles o editar el contenido y filtarr
                const productoActual = productos.find(producto => producto.id === padre.id);
padre.classList.remove("container-mas")
                if (productoActual) {
                    padre.innerHTML = `
                        <div id="p-datos">
                            <input class="input-datos" value="${productoActual.paciente|| 'Sin nombre'}" readonly></input>
                            <input class="input-datos" value="${productoActual.cedula || 0}" readonly></input>
                            <input class="input-datos" value="${productoActual.fecha || 0}" readonly></input>

                            <button id="config-delete">
                                <lord-icon src="https://cdn.lordicon.com/zxvuvcnc.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                            </button>
                            <button id="config">
                                <lord-icon src="https://cdn.lordicon.com/lomfljuq.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                            </button>
                            <div id="config-container">
                                <button id="info">
                                    <lord-icon src="https://cdn.lordicon.com/fikcyfpp.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                                </button>
                            </div>
                        </div>`;
                }
            }
        }
    });
});
   

        document.addEventListener("DOMContentLoaded", () => {
            document.addEventListener("click", async e => {
                if (e.target && (e.target.id === "config-delete" || e.target.closest('#config-delete'))) {
                    e.preventDefault(); // Evita el comportamiento predeterminado del evento
        
                    try {
                        // Obtén y muestra el padre del botón
                        const boton = e.target.closest('#config-delete');
                        const padre = boton.parentElement.parentElement;


                        console.log(padre.id); // Imprime el ID del div padre

                        await axios.delete(`/api/todos/${padre.id}`);
                      padre.remove();
                    } catch (error) {
                        console.error(error);
                    }
                }
            });
        });


        const buscar = document.querySelector("#buscar");
        const buscarBtn = document.querySelector("#buscar-btn");
        
        buscarBtn.addEventListener("click", async (e) => {
            console.log("El usuario seleccionó el campo de búsqueda");
        
            try {
                // Solicitar datos al backend
                const { data } = await axios.get('/api/todos'); // Ajustar para obtener 'data'
                console.log("Datos obtenidos:", data);
        
                // Filtrar los resultados según el valor de búsqueda
                const valorBusqueda = buscar.value.trim(); // Eliminar espacios en blanco
                let resultados = data.filter(paciente =>
                    paciente.paciente.includes(valorBusqueda)
                );
                console.log(valorBusqueda)
                if ( resultados.length === 0) {
                  resultados =   data.filter(paciente =>
                    paciente.cedula.includes(valorBusqueda)
                );
                }
                console.log(resultados);
        
                console.log("Resultados encontrados:", resultados);
        
                // Mostrar los resultados filtrados en el contenedor
                const listaResultados = document.querySelector("#sugerencias");
                listaResultados.innerHTML = ``; // Limpiar resultados anteriores
        
                resultados.forEach(item => {
                    const listItem = document.createElement("div");
                    listItem.id = item.id; // Asegúrate de que 'id' esté presente y sea único
                    listItem.innerHTML += `
                        <div id="p-datos">
                            <input class="input-datos" value="${item.paciente || 'Sin nombre'}" readonly></input>
                            <input class="input-datos" value="${item.cedula || 0}" readonly></input>
                            <input class="input-datos" value="${item.telefono || 0}" readonly></input>

                            <button id="config-delete">
                                <lord-icon src="https://cdn.lordicon.com/zxvuvcnc.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                            </button>
                            <button id="config">
                                <lord-icon src="https://cdn.lordicon.com/lomfljuq.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                            </button>
                            <div id="config-container">
                                <button id="info">
                                    <lord-icon src="https://cdn.lordicon.com/fikcyfpp.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                                </button>
                            </div>
                        </div>
                    `;
                    listaResultados.appendChild(listItem);
                });
            } catch (error) {
                console.error("Error al obtener datos:", error.message);
            }
        });
        
        
        
        
// Menu despegable 

HomeBtn.addEventListener("click", e => {
    window.location.pathname = "/Casa"

})
RegistroBtn.addEventListener("click", e => {
    window.location.pathname = "/Inventario"

})

ProductosBtn.addEventListener("click", e => {
    window.location.pathname = "/Productos"

})

MensajeBtn.addEventListener("click", e => {
    window.location.pathname = "/Facturacion"
  
  })

ConfiguracionBtn.addEventListener("click", e => {
    window.location.pathname = "/Configuracion"

})

const HistorialBtn = document.querySelector("#mensaje-historial")
HistorialBtn.addEventListener("click", e => {
    window.location.pathname = "/Historial"

})

    
function N(N,B){

  N.addEventListener("click", e => {
      window.location.pathname = `/${B}`
})
}
const AdminBtn = document.querySelector("#administrador-btn");
N(AdminBtn,'Administrador')


const presupuestoBtn = document.querySelector("#Presupuesto-btn");
N(presupuestoBtn,'Presupuesto')

const PedidoBtn = document.querySelector("#Pedidos-btn");
N(PedidoBtn,'Pedidos')
    



// Papelera 
function crearHTMLProducto2(todos) {
    const contenedor = document.querySelector("#cuerpoPapelera");
    
 
    // Si no hay productos, podemos poner un mensaje o salir
    if (!todos || todos.length === 0) {
        contenedor.innerHTML = "<p>La papelera está vacía</p>";
        return;
    }
 
    const htmlFinal = todos.data.map((todo) => {
        const cantidad = Number(todo.stock?.actual) || 0;
        const estaAgotado = cantidad <= 0;
        const minimo = cantidad <= 4;

        // Lógica de imagen
        let imagenSrc = '../img/OptiGest.png'; 
              console.log(todo)
        if (todo.imagen && todo.imagen.data) {
       
            try {
                const bufferData = todo.imagen.data.data || todo.imagen.data;
                const base64String = btoa(
                    new Uint8Array(bufferData)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                imagenSrc = `data:${todo.imagen.contentType};base64,${base64String}`;
            } catch (e) {
                console.error("Error en imagen:", todo.paciente);
            }
        }

       return `
       
    <div class="p-datos-item-papelera ${estaAgotado ? 'agotado-mini' : ''}" data-id="${todo.id}">
      

        <div class="mini-info">
            <span class="mini-nombre">${todo.paciente || 'Sin nombre'}</span>
            <span class="mini-cat">${todo.categoria || 'Sin cat.'}</span>
        </div>
        
        <div class="mini-stats">
            <span class="mini-stock ${todo.edad ? 'rojo' : ''}"> Edad:${todo.edad || 'error' }</span>
            <span class="mini-precio">${todo.cedula || 0}</span>
        </div>

        <button class="btn-solo-restaurar"  title="Restaurar">
            <lord-icon src="https://cdn.lordicon.com/lomfljuq.json" trigger="hover" style="width:25px;height:25px"></lord-icon>
        </button>
    </div>
`;
    }).join('');

    // OPCIÓN A: Reemplazar todo el contenido (Recomendado para refrescar listas)
    contenedor.innerHTML = htmlFinal;

    // OPCIÓN B: Si quieres AGREGAR al final sin borrar lo anterior, usa:
    // contenedor.insertAdjacentHTML('beforeend', htmlFinal);
}

  /// papelera flotante 
const CerrarP = document.getElementById('cerrarPapeleraFlotante');
  
const btn = document.getElementById('btnAbrirPapelera');
const ventana = document.getElementById('PapeleraFlota');

btn.addEventListener('click', async (e) => {
    e.stopPropagation(); // Evita que el clic cierre la ventana inmediatamente
try {    ventana.style.display = 'flex'

const respuesta = await axios.get('/api/todos/Papelera');
console.log(respuesta)
actualizarContadorPapelera()
    crearHTMLProducto2(respuesta)

}

catch(error) {


}
});
const Cuerpo = document.querySelector('#cuerpoPapelera')
const btnBorrarPapelera = document.querySelector(".btn-Borrar")
btnBorrarPapelera.addEventListener('click', async (e) => {
    try {
const respuesta = axios.delete("/api/todos/Papelera");
console.log(respuesta)

Cuerpo.innerHTML = '';
actualizarContadorPapelera()
    } catch(error) {
        mostrarNotificacion(error.data);
    }
});

CerrarP.addEventListener('click',  (e) => {
    e.stopPropagation(); // Evita que el clic cierre la ventana inmediatamente
ventana.style.display = 'none'
});

/// render de productos 

function crearHTMLProducto(todo) {
    const Contenedor = document.querySelector("#sugerencias")
    // 1. Manejo de la cantidad (ahora está en todo.stock.actual)
let Comprobacion;
  Comprobacion  =  Contenedor.querySelector(`[data-id="${todo._id}"]`) ||Contenedor.querySelector(`[id="${todo._id}"]`)   ;
console.log(todo._id,Comprobacion)
if (Comprobacion) {
        mostrarNotificacion("Ya existe en la lista");
        return false; 
    }
 
    
   
         return `
        <div id="p-datos" 
  data-id="${todo._id}">
       

            <input class="input-datos" value="${todo.paciente || 'Sin nombre'}" readonly title="Nombre">
            <input class="input-datos" value="${todo.cedula || 'Sin categoría'}" readonly title="Categoría">
                   <input class="input-datos" value="${todo.fecha || 'Sin categoría'}" readonly title="Categoría">     
            
            

            

            
            <button id="config-delete" title="Eliminar">
                <lord-icon src="https://cdn.lordicon.com/zxvuvcnc.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
            </button>
            <button id="config" title="Actualizar Datos">
                <lord-icon src="https://cdn.lordicon.com/lomfljuq.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
            </button>
            <div id="config-container">
                <button id="info" title="Ver Detalles">
                    <lord-icon src="https://cdn.lordicon.com/fikcyfpp.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                </button>
            </div>
        </div>
    `;

}
// 1. Escuchamos el clic en todo el documento (o en el contenedor de tu lista)
document.addEventListener('click', async (e) => {
    // 1. Detectar si se hizo clic en el botón de restaurar
    const btnRestaurar = e.target.closest(".btn-solo-restaurar");

    // Si no es el botón, no hacer nada
    if (!btnRestaurar) return;

    // 2. Detener comportamiento por defecto (evita recargas de página)
    e.preventDefault();

    // 3. Obtener la tarjeta del producto (padre) y su ID
    const tarjetaProducto = btnRestaurar.parentElement.getAttribute("data-id")

    if (tarjetaProducto) {
        const id = tarjetaProducto;

        try {
            // 4. Petición al servidor (Asegúrate de que la ruta sea correcta)
            const { data } = await axios.patch(`/api/todos/restaurar/${id}`);
  const datos = document.querySelector('#sugerencias')



// 1. Creamos un elemento DIV real en memoria
let listItem = document.createElement('div');

// 2. Le asignamos el ID de MongoDB como ID del elemento (para que sea único)
listItem.id = data._id; 

// 3. Le ponemos una clase para el diseño (sustituyendo el ID "p-datos" que tenías)


// 4. Inyectamos el contenido generado por tu función
const K= crearHTMLProducto(data)
listItem.innerHTML = K;

// 5. Ahora sí, appendChild funcionará porque listItem es un OBJETO, no un string
if (K){
    datos.appendChild(listItem);

            // 5. Notificación de éxito
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion("Paciente restaurado correctamente", "success");
            }
// Seleccionamos todos los items dentro de la papelera
const idsParaEliminar = [  `${listItem.id}`];
const items = document.querySelectorAll('.p-datos-item-papelera');

items.forEach(item => {
    if (idsParaEliminar.includes(item.dataset.id)) {
        item.remove();
    }
});
}
            
        } catch (error) {
            console.error("Error al restaurar:", error);
            const mensaje = error.response?.data?.error || "Error al restaurar";
            
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion(mensaje, "error");
            }
        }
    }
});
  
const PedidosBTN = document.querySelector("#Pedidos-btn");

const ClienteBTN = document.querySelector("#Clientes-btn");
const configurarBoton = (btn, ruta) => {
    if (btn) btn.addEventListener("click", () => window.location.pathname = ruta);
};


configurarBoton(ClienteBTN , "/Clientes");

configurarBoton(PedidosBTN , "/Pedidos");
const ControlGastosBTN = document.querySelector("#controlGastos-btn");
configurarBoton( ControlGastosBTN , "/Control/Gastos"); 
// aislamiento
// AGUDEZA VISUAL OFTAMOLOGIA
const LejosAVOD= document.getElementById("Lejos(AV)OD");
const CercaAvOd = document.getElementById("Cerca(AV)OD");
const PIO_OD = document.getElementById("PIOOD");
const LejosAVOI  = document.getElementById("Lejos(AV)OI");
const CercaAvOI = document.getElementById("Cerca(AV)OI");
const  PIO_OI = document.getElementById("PIO(AV)OI");
// segundo apartado de examen oftamologico
const VerticeOD = document.getElementById("VerticeOD");
const   VerticeOI= document.getElementById("VerticeOI");
const PantoscopicoOD = document.getElementById("PantoscopicoOD");
const   PantoscopicoOI = document.getElementById("PantoscopicoOI"); 
const   AnguloFacialOD = document.getElementById("AFOD"); 
const   AnguloFacialOI = document.getElementById("AFOI"); 
// guardado de inputst
const Optometrico_Oftamologico =  document.querySelector("#Optometria_Oftamologia");
const  AgudezaVisual  =   document.querySelector("#AgudezaVisual");
const  AgudezaVisual2  =   document.querySelector("#AgudezaVisual2");
const  AgudezaVisual3  =   document.querySelector("#AgudezaVisual3");
const  AgudezaVisual4  =   document.querySelector("#AgudezaVisual4");
const  AgudezaVisual5  =   document.querySelector("#AgudezaVisual5");
// DISTANCIA NASO PUPILAR 

const   NasoPupilarOD_L = document.getElementById("DNP-OD-L"); 
const    NasoPupilarOD_C= document.getElementById("DNP-OD-C"); 
// IZquierdo
const   NasoPupilarOI_L = document.getElementById("DNP-OI-L"); 
const    NasoPupilarOI_C= document.getElementById("DNP-OI-C"); 

Optometrico_Oftamologico.addEventListener("change" , (e) => {

if (!e.target.checked) {
AgudezaVisual.style.display = 'none';
AgudezaVisual2.style.display = 'none';
AgudezaVisual3.style.display = 'none';
AgudezaVisual4.style.display = 'none';
AgudezaVisual5.style.display = 'none';
} else {
AgudezaVisual.style.display = 'block';
AgudezaVisual2.style.display = 'block';
AgudezaVisual3.style.display = 'block';
AgudezaVisual4.style.display = 'block';
AgudezaVisual5.style.display = 'block';

}
});


// form importanteee 




form.addEventListener("submit", async (e) => {

    e.preventDefault();

    // Validar campos vacíos
   // Cambia esto en tu array de validación:
  const n  = document.getElementById('nombre-cliente');
   const cedula = document.getElementById('tel-cliente');
    const telefono   =  document.getElementById('telefono-cliente');
    const Edad  =  document.getElementById('Edad');
  const  EOD =document.getElementById("EsferaOD");
  const EOI =document.getElementById("EsferaOI");
const CilindroD = document.getElementById("CilindroD");
const CilindroI = document.getElementById("CilindroI");
const EjeD = document.getElementById("EjeD");
  const EjeI = document.getElementById("EjeI");
  const AdicionD =  document.getElementById('AdicionD');
      const AdicionI=     document.getElementById('AdicionI');
   const DP=      document.getElementById('DP');
   const Altura=   document.getElementById('Altura');// <--- Asegúrate que diga Altura1
const tratamiento =   document.getElementById('tratamientos');// <--- Asegúrate que diga Altura1
   const Resultados =       document.getElementById('Resultados');
      const Cristales =       document.getElementById('Cristales');


    try {

 // ==========================================
// 1. VALIDACIÓN PRINCIPAL (Al dar clic en Guardar)
// ==========================================
// Obtienes el estado del checkbox
const inputSwitch = document.getElementById("Optometria_Oftamologia");

// Si está marcado (true), digamos que es Oftalmología; si no (false), es Optometría
const especialidadSeleccionada = inputSwitch.checked ? "Oftalmología" : "Optometría";


    const AgudezaVisual = {
    LejosAVOD : LejosAVOD.value.trim(),
  CercaAvOd  : CercaAvOd.value.trim() ,
   PIO_OD: PIO_OD.value.trim(),
   LejosAVOI :  LejosAVOI.value.trim()  ,
   CercaAvOI :  CercaAvOI.value.trim(),
    PIO_OI  :   PIO_OI.value.trim() ,
      VerticeOD :    VerticeOD.value.trim() ,
      VerticeOI :   VerticeOI.value.trim(),
       PantoscopicoOD  :   PantoscopicoOD.value.trim() ,
       PantoscopicoID  :     PantoscopicoOI.value.trim() ,
       AnguloFacialOD :         AnguloFacialOD.value.trim() ,
              AnguloFacialOI :         AnguloFacialOI.value.trim() ,
              NasoPupilarOD_L:  NasoPupilarOD_L.value ,
               NasoPupilarOD_C:  NasoPupilarOD_C.value   ,
                NasoPupilarOI_L:  NasoPupilarOI_L.value ,
                 NasoPupilarOI_C:  NasoPupilarOI_C.value ,
};



const validarFormulario = () => {
    const campos = {
        "Nombre": document.getElementById('nombre-cliente'),
        "Cédula": document.getElementById('tel-cliente'),
        "Teléfono": document.getElementById('telefono-cliente'),
        "Edad": document.getElementById('Edad'),
        "Esfera OD": document.getElementById("EsferaOD"),
        "Esfera OI": document.getElementById("EsferaOI"),
        "Cilindro D": document.getElementById("CilindroD"),
        "Cilindro I": document.getElementById("CilindroI"),
        "Eje D": document.getElementById("EjeD"),
        "Eje I": document.getElementById("EjeI"),
        "Adición D": document.getElementById('AdicionD'),
        "Adición I": document.getElementById('AdicionI'),
        "DP": document.getElementById('DP'),
        "Altura": document.getElementById('Altura'),
        "Resultados": document.getElementById('Resultados'),
        "Cristales": document.getElementById('Cristales')
     

    };

    // --- LIMPIEZA TOTAL ---
    Object.values(campos).forEach(el => {
        if (el) {
            el.classList.remove('input-success', 'input-error');
            el.style.border = ""; 
        }
    });

    // --- VALIDACIÓN DE VACÍOS ---
    for (let nombre in campos) {
        const el = campos[nombre];
        if (!el) continue;

        if (!el.value.trim()) {
            mostrarNotificacion(`⚠️ El campo "${nombre}" es obligatorio.`);
            el.classList.add('input-error');
            el.focus();
            return false; 
        }
    }
const regex = /^[VEJGP]\d{7,12}$/;
    // --- VALIDACIONES ESPECIALES ---
    // Cédula: Solo números, entre 8 y 14 dígitos
    const vCedula = campos["Cédula"];
    if (!regex.test(vCedula.value.trim())) {
        mostrarNotificacion("⚠️ Formato inválido. Debe iniciar con V, E, J, G o P seguido de 7 a 12 dígitos (Ej: V12345678)");
        vCedula.classList.add('input-error');
        vCedula.focus();
        return false;
    }

    // Teléfono: Operadora venezolana (4 dígitos) + 7 dígitos extra = 11 en total
    const vTel = campos["Teléfono"];
    if (!/^(0412|0414|0424|0416|0426)\d{7}$/.test(vTel.value.trim())) {
     mostrarNotificacion("❌ Teléfono inválido. Debe empezar por 0412, 0414, 0424, 0416 o 0426 y tener exactamente 11 dígitos.");
        vTel.classList.add('input-error');
        vTel.focus();
        return false;
    }

    // --- ÉXITO TOTAL ---
    Object.values(campos).forEach(el => el.classList.add('input-success'));
    return true; 
};

if (Cristales.value === 'none'){
    return mostrarNotificacion("Falta el Tipo de Cristal.")
}

// ==========================================
// 2. VALIDACIÓN EN TIEMPO REAL (Mientras escribe)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    const aplicarColor = (elemento, esValido) => {
        // console.log(`Validando ${elemento.id}: esValido = ${esValido}`); // Descomenta esto para ver qué pasa internamente
        if (esValido) {
            elemento.classList.remove('input-error');
            elemento.classList.add('input-success');
        } else {
            elemento.classList.remove('input-success');
            elemento.classList.add('input-error');
        }
    };

    // 1. Cédula
    const inputCedula = document.getElementById('tel-cliente');
    if (inputCedula) {
        inputCedula.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, ''); 
            const valor = e.target.value.trim(); // <-- trim() añadido
            const esValido = /^\d{8,14}$/.test(valor);
            aplicarColor(e.target, esValido);
        });
    }

    // 2. Teléfono
    const inputTelefono = document.getElementById('telefono-cliente');
    if (inputTelefono) {
        inputTelefono.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, ''); 
            const valor = e.target.value.trim(); // <-- trim() añadido
            const esValido = /^(0412|0414|0424|0416|0426)\d{7}$/.test(valor);
            aplicarColor(e.target, esValido);
        });
    }

    // 3. Demás inputs
    const inputsGenerales = document.querySelectorAll('#form input:not(#tel-cliente):not(#telefono-cliente), #form select');
    inputsGenerales.forEach(input => {
        input.addEventListener('input', (e) => {
            const esValido = e.target.value.trim() !== "";
            aplicarColor(e.target, esValido);
        });
    });
});
   if ( validarFormulario() === false) {
    return ;
   }

        console.log("--- Datos del Formulario ---");
console.table({
    paciente: n.value,
    Edad: Edad.value,
    cedula: cedula.value,
    telefono: telefono.value,

    OD:  EOD.value,
    OI:  EOI.value,
    
 CilindroD: CilindroD.value  ,
  CilindroI:  CilindroI.value ,
       
            AdicionI: AdicionI.value,
            AdicionD: AdicionD.value, 
            EjeD: EjeD.value,
            EjeI: EjeI.value, 
Altura: Altura.value,
 
            
    DP: DP.value,
    Resultados: Resultados.value,

    Cristales: Cristales.value,
 
});
        // Enviar datos al backend
        const { data } = await axios.post('/api/todos', {
            AgudezaVisual,
            // Mandas la especialidad o un booleano que indique si es oftalmología o no
    especialidad: document.getElementById("Optometria_Oftamologia").checked ? "Oftalmología" : "Optometría",
          paciente: n.value,
    Edad: Edad.value,
    cedula: cedula.value,
    telefono: telefono.value,

    OD:  EOD.value,
    OI:  EOI.value,
    
 CilindroD: CilindroD.value  ,
  CilindroI:  CilindroI.value ,
       
            AdicionI: AdicionI.value,
            AdicionD: AdicionD.value, 
            EjeD: EjeD.value,
            EjeI: EjeI.value, 
Altura: Altura.value,
 
            
    DP: DP.value,
    Resultados: Resultados.value,

    Cristales: Cristales.value,
    tratamiento: tratamiento.value,
    
        });
        console.log("Tarea guardada:", data);

        // Agregar tarea al DOM
        const tabl2 = document.querySelector("#sugerencias");
        if (!tabl2) {
            console.error("El contenedor #sugerencias no existe.");
            return;
        }

        const listItem = document.createElement("div");
        listItem.id = data.id;
        listItem.innerHTML = `
             <div id="p-datos">
                            <input class="input-datos"  value="${data.paciente || 'Sin nombre'}" readonly></input>
                            <input class="input-datos" value="${data.cedula || 0}" readonly></input>
                            <input class="input-datos" value="${data.telefono|| 0}" readonly></input>

                            <button id="config-delete">
                                <lord-icon src="https://cdn.lordicon.com/zxvuvcnc.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                            </button>
                            <button id="config">
                                <lord-icon src="https://cdn.lordicon.com/lomfljuq.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                            </button>
                            <div id="config-container">
                                <button id="info">
                                    <lord-icon src="https://cdn.lordicon.com/fikcyfpp.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                                </button>
                            </div>
                        </div>
        `;
        tabl2.prepend(listItem);

        // Reiniciar formulario
        document.querySelector("#formulario").reset();

        
    } catch (error) {
console.error("Error al agregar tarea:", error); 
// Al hacer clic en la flecha en la consola, verás el "stack" y el número de línea.
    }
});
