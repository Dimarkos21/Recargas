const datos = document.querySelector("#Data");


const totalbalance = document.querySelector("#total-balance");
// mostrar notificacion 
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
   const Bs = document.querySelector("#total-bs");
(async () => {
  try {
    const  respuesta = await axios.get("/api/control_gatos");
       const  total = await axios.get("/api/control_gatos/Total");
    console.log(respuesta)

  const respuestaFormata    =   respuesta.data;

   respuestaFormata.forEach(gasto => {
    const fecha = new Date(gasto.fecha);

// 1. Formato local predeterminado (ej: 27/7/2026)
console.log(fecha.toLocaleDateString("es-ES"));

// 2. Formato personalizado largo
const opciones = { 
    year: "numeric", 
    month: "long", 
    day: "numeric", 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Caracas" // Ajusta según la zona horaria deseada
};
console.log(fecha.toLocaleDateString("es-ES", opciones));

// 3. Formato personalizado corto (DD/MM/YYYY HH:mm)
const dia = String(fecha.getUTCDate()).padStart(2, '0');
const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
const anio = fecha.getUTCFullYear();
const hora = String(fecha.getUTCHours()).padStart(2, '0');
const minuto = String(fecha.getUTCMinutes()).padStart(2, '0');

console.log(`${dia}/${mes}/${anio} ${hora}:${minuto}`);
       datos.innerHTML  += `<div class="item-card">
    <div class="item-header">
        <strong class="item-nombre">${gasto.nombre}</strong>
        <span class="item-categoria">${gasto.categoria}</span>
    </div>
    
    <div class="item-body">
        <div class="rate-item">
         
            <span class="rate-label">Tasa del día:</span>
            <span class="rate-value">${fecha.toLocaleDateString("es-ES", opciones) || 0}</span>
        </div>
        <div class="rate-item">
         
            <span class="rate-label">Tasa del día:</span>
            <span class="rate-value">${gasto.tasaCambioDia || 0}</span>
        </div>
        <div class="rate-item">
            <span class="rate-label">Tasa de cambio:</span>
            <span class="rate-value">${gasto.tasaCambio || 0}</span>
        </div>
    </div>

    <div class="item-footer">
        <span class="precio-label">Precio:</span>
        <span class="item-precio">$${gasto.precio.toFixed(2)}</span>
    </div>
</div>
            
    `;
   
    });
console.log(total.data)
   totalbalance.innerHTML= `$${total.data.estadisticaControl.metricas.GastoDolar}`;

    Bs.innerHTML= `${total.data.estadisticaControl.metricas.GastoBolivar}bs`;
   
  }catch (error) {

    console.error('Error al cargar los productos:', error);
  }
})();



document.getElementById('precio').addEventListener('input', function (e) {
    // Reemplaza cualquier cosa que no sea un dígito o un punto
    this.value = this.value.replace(/[^0-9.]/g, '');
    
    // Evita que el usuario escriba más de un punto decimal
    const partes = this.value.split('.');
    if (partes.length > 2) {
        this.value = partes[0] + '.' + partes.slice(1).join('');
    }
});

async function handleAdd() {
    const descInput = document.getElementById('descInput');
    const amtInput = document.getElementById('amountInput');
    
    if (!descInput.value || !amtInput.value) {
        alert("Por favor completa los campos.");
        return;
    }

    const nuevoGasto = {
        nombre: descInput.value,
        precio: parseFloat(amtInput.value),
        categoria: selectedCat,
        fecha: new Date(),
        checked: false
    };

    const btn = document.getElementById('addBtn');
    btn.disabled = true;

    try {
        const response = await fetch('/api/gastos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoGasto)
        });

        if (response.ok) {
            descInput.value = '';
            amtInput.value = '';
            console.log("Gasto registrado");
            // Aquí puedes llamar a una función para actualizar tu lista:
            // actualizarLista(); 
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        btn.disabled = false;
    }
}


// Seleccionamos todos los botones con la clase .categoria-btn
const buttons = document.querySelectorAll('.categoria-btn');

buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. Quitamos la clase 'active' de todos los botones primero
        buttons.forEach(b => b.classList.remove('active'));
        
        // 2. Agregamos la clase 'active' solo al botón clicado
        btn.classList.add('active');
        
        // Opcional: Si necesitas guardar el valor seleccionado
        console.log("Categoría seleccionada:", btn.innerText.trim());
    });
});

// elementos importantes para el formulario
const form = document.querySelector("#form"); // Asegúrate que este ID coincida con tu form
const nombre = document.querySelector("#nombre");
const precio = document.querySelector("#precio");
const contenedor = document.querySelector("#Data");
form.addEventListener("submit", async (e) => {
    e.preventDefault(); // ¡Muy importante! Evita recargar la página

    // 1. Buscamos el botón activo
    const btnActivo = document.querySelector(".categoria-btn.active");
    
    // 2. Extraemos el valor del data-id
    const categoriaSeleccionada = btnActivo ? btnActivo.dataset.id : null;

    if (!categoriaSeleccionada) {
        alert("Por favor, selecciona una categoría");
        return;
    }
if (!precio.value ){
    return  mostrarNotificacion("Datos faltantes.");
}
if (precio.value <= 0 ){
    return  mostrarNotificacion("El Gasto  tiene que ser mayor a 0.");
}
if (!nombre.value ){
    return mostrarNotificacion("Datos faltantes.");
}

    try {
        const subida = {
            nombre: nombre.value,
            precio: parseFloat(precio.value), // Convertimos a número
            categoria: categoriaSeleccionada
        };

        // 3. Enviamos el objeto subida como segundo argumento
        const respuesta = await axios.post("/api/control_gatos", subida);
         const  total = await axios.get("/api/control_gatos/Total");
         const mostrar  = respuesta.data;
     
        console.log("Éxito:", respuesta.data);
contenedor.insertAdjacentHTML('afterbegin', `<div class="item-card">
    <div class="item-header">
        <strong class="item-nombre">${mostrar.nombre}</strong>
        <span class="item-categoria">${mostrar.categoria}</span>
    </div>
    
    <div class="item-body">
        <div class="rate-item">
            <span class="rate-label">Tasa del día:</span>
            <span class="rate-value">${mostrar.tasaCambioDia || 0}</span>
        </div>
        <div class="rate-item">
            <span class="rate-label">Tasa de cambio:</span>
            <span class="rate-value">${mostrar.tasaCambio || 0}</span>
        </div>
    </div>

    <div class="item-footer">
        <span class="precio-label">Precio:</span>
        <span class="item-precio">$${mostrar.precio.toFixed(2)}</span>
    </div>
</div>`);
         totalbalance.innerHTML= `$${ total.data.estadisticaControl.metricas.GastoDolar}`;
             Bs.innerHTML= `${total.data.estadisticaControl.metricas.GastoBolivar}bs`;
   form.reset(); } catch (error) {
        console.error(error);
      return  mostrarNotificacion('Error en el servidor , revisa tu internet'); 

    }
});



// --- SELECCIÓN DE ELEMENTOS ---
const HomeBtn = document.querySelector("#Home-btn");
const RegistroBtn = document.querySelector("#Registro-btn");
const botonMenu = document.querySelector("#boton-menu");
const MensajeBtn = document.querySelector("#mensaje-btn");
const ConfiguracionBtn = document.querySelector("#config-btn");
const HistorialBtn = document.querySelector("#mensaje-historial");
const administradorBtn = document.querySelector("#administrador-btn");
const  ProductosBTN = document.querySelector("#producto-btn");
const  PresupuestoBTN = document.querySelector("#Presupuesto-btn");
const PedidosBTN = document.querySelector("#Pedidos-btn");
//Logica de la  barra de navegacion atento 

const configurarBoton = (btn, ruta) => {
    if (btn) btn.addEventListener("click", () => window.location.pathname = ruta);
};

if (botonMenu) {
    botonMenu.addEventListener("click", () => {
        document.querySelector("#menu-desplegable").classList.toggle("visible");
    });
};
configurarBoton(HomeBtn, "/Casa");
configurarBoton(RegistroBtn, "/Inventario");
configurarBoton(MensajeBtn, "/Facturacion");
configurarBoton(ConfiguracionBtn, "/Configuracion");
configurarBoton(administradorBtn, "/Administrador");
configurarBoton(HistorialBtn, "/Historial");
configurarBoton(PresupuestoBTN, "/Presupuesto");
configurarBoton(ProductosBTN, "/Productos");
configurarBoton(PedidosBTN, "/Pedidos");
const ClienteBTN = document.querySelector("#Clientes-btn");
configurarBoton(ClienteBTN , "/Clientes");