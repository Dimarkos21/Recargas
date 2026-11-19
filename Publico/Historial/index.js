// 1. CONFIGURACIÓN INICIAL
const socket = io(); 
let historialMemoria = []; // Guardamos los logs aquí para que el botón "info" sea instantáneo

// 2. ELEMENTOS DEL DOM
const TablaDatos = document.querySelector("#datos");
const Filtrador = document.querySelector("#Filtrador");
const notificacion = document.getElementById("notificacion");

// 3. UTILIDADES
const formatearFecha = (timestamp) => {
    if (!timestamp) return "N/A";
    const fecha = new Date(timestamp);
    return fecha.toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
};

function mostrarNotificacion(mensaje) {
    if (!notificacion) return;
    notificacion.textContent = mensaje;
    notificacion.classList.replace("oculto", "publico");
    setTimeout(() => notificacion.classList.replace("publico", "oculto"), 3000);
}

// 4. RENDERIZADO DE FILA BÁSICA
function crearFilaHTML(dato, alPrincipio = false) {
    console.log(dato);
    const item = document.createElement('div');
    item.id = dato._id;
    item.className = "item-contenedor"; // Para estilos CSS
    
    // Determinar color por acción
    const colores = { 'CREATED': 'verde', 'UPDATED': 'azul', 'DELETED': 'rojo' };
    const claseColor = colores[dato.action] || '';

    item.innerHTML = `
        <div id="p-datos" class="${claseColor}">
            <input class="input-datos" value="${dato.entityType || 'Entidad'}" readonly>
            <input class="input-datos" value="${dato.action || 'Acción'}" readonly>
            <input class="input-datos" value="${dato.UserAction?.Name || 'Sistema'}" readonly>
            <input class="input-datos" value="${formatearFecha(dato.
timestamp)}" readonly>
            <div id="config-container">
                <button id="info" title="Ver Detalles">
                    <lord-icon src="https://cdn.lordicon.com/fikcyfpp.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                </button>
            </div>
        </div>
    `;

    if (alPrincipio) TablaDatos.prepend(item);
    else TablaDatos.appendChild(item);
}
async function obtenerHTMLDetalladoAbono(log) {
    const detalles = log.details.data || log.details;
    console.log(detalles)
    let contenidoEspecifico = "";


 if (log.entityType === "Abono") {
// Asumimos que 'log' y 'detalles' ya vienen con la información del historial
 
    const d = log.details ; // Según tu estructura, los datos están en log.details
try {
    // Asumimos que 'log' y 'detalles' ya vienen con la información del historial
let respuesta = await axios.get(`/api/facturacion/historial1/${d.facturaID}`, {
        validateStatus: function (status) {
            // Acepta 200s y también el 404 sin lanzar error
            return (status >= 200 && status < 300) || status === 404;
        }
    });


   const factura = respuesta.data;
if (respuesta.status ===  404){
    respuesta = await axios.get(`/api/facturacion/historial/${d.facturaID}`);
}
// Generar la lista de productos dinámicamente
const listaProductos = factura.productos.map(p => `
    <div class="producto-item">
        <span>${p.nombre || 'Producto'}</span>
        <span class="producto-precio">${p.precio?.toFixed(2) || '0.00'} $</span>
    </div>
`).join('');

contenidoEspecifico = `
    <div class="abono-container">
        <div class="factura-header-top">
            <h3>💰 Comprobante de Abono</h3>
            <span class="badge-metodo">${d.nuevoSaldo === 0 ? 'PAGADO' : 'ABONO PARCIAL'}</span>
        </div>

        <div class="cliente-resumen-box">
            <div class="cliente-main-info">
                <strong>${factura.cliente || factura.paciente}</strong>
                <span>CI: ${factura.cedula}</span>
            </div>
            <div class="cliente-sub-info">
                <span>📞 ${factura.telefono}</span>
                <span>📄 Factura: ${factura.factura}</span>
            </div>
        </div>

        <div class="productos-seccion">
            <h4 class="titulo-detalle">Detalle de Compra</h4>
            <div class="productos-lista">
                ${listaProductos}
            </div>
            <div class="total-venta-linea">
                <span>Total de la Venta:</span>
                <strong>${factura.precio || factura.finanzas.totalVenta} $</strong>
            </div>
        </div>

        <div class="info-cliente-grid">
            <div class="info-item">
                <label>ID Operación</label>
                <span>#${log._id.toString().slice(-6).toUpperCase()}</span>
            </div>
            <div class="info-item">
                <label>Fecha</label>
                <span>${new Date(d.timestamp || log.timestamp).toLocaleString()}</span>
            </div>
        </div>

        <hr class="separador">

        <div class="finanzas-resumen">
            <div class="finanza-box">
                <label>Saldo Anterior</label>
                <p>${d.saldoAnterior?.toFixed(2) || '0.00'} $</p>
            </div>
            <div class="finanza-box destacada-abono">
                <label>Abono Recibido</label>
                <p>+ ${d.montoAbonado?.toFixed(2) || '0.00'} $</p>
            </div>
            <div class="finanza-box ${d.nuevoSaldo === 0 ? 'destacada-pagado' : 'destacada-deuda'}">
                <label>Nuevo Saldo</label>
                <p>${d.nuevoSaldo?.toFixed(2) || '0.00'} $</p>
            </div>
        </div>

        <div class="comentario-seccion">
            <h4 class="titulo-detalle">Nota del Abono</h4>
            <div class="comentario-box">
                <p>${d.comentario || 'Sin observaciones.'}</p>
            </div>
        </div>
        
        <div class="footer-auditoria">
            <small>Atendido por: ${factura.vendedor?.nombre || 'N/A'}</small><br>
            <small>ID: ${log.userId}</small>
        </div>
    </div>

    <style>
        .cliente-resumen-box {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            border-left: 5px solid #2196f3;
            margin-bottom: 20px;
        }
        .cliente-main-info { display: flex; justify-content: space-between; font-size: 1.1rem; }
        .cliente-sub-info { display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-top: 4px; }
        
        .productos-seccion { margin-bottom: 20px; background: #fff; border: 1px solid #eee; padding: 10px; border-radius: 8px; }
        .titulo-detalle { font-size: 0.9rem; color: #555; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .producto-item { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 4px 0; border-bottom: 1px dashed #f0f0f0; }
        .producto-precio { font-weight: 500; }
        
        .total-venta-linea { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 5px; font-size: 1rem; color: #333; }

        .finanzas-resumen { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
        .finanza-box { padding: 10px; border-radius: 8px; text-align: center; background: #fbfbfb; border: 1px solid #eee; }
        .finanza-box label { font-size: 0.75rem; color: #666; display: block; margin-bottom: 5px; }
        .finanza-box p { margin: 0; font-size: 1rem; font-weight: bold; }
        
        .destacada-abono { background: #e3f2fd; border-color: #2196f3; }
        .destacada-abono p { color: #1565c0; }
        .destacada-deuda { background: #fff3e0; border-color: #ff9800; }
        .destacada-deuda p { color: #e65100; }
        .destacada-pagado { background: #e8f5e9; border-color: #4caf50; }
        .destacada-pagado p { color: #2e7d32; }

        .comentario-box { background: #fdfdfd; padding: 10px; border-radius: 6px; border: 1px solid #eee; font-style: italic; font-size: 0.85rem; }
        .footer-auditoria { margin-top: 20px; text-align: right; color: #aaa; line-height: 1.2; }
        .info-cliente-grid { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.85rem; }
    </style>
`;
  

} catch (error) {
    console.log(error);
    
}

return contenidoEspecifico;
}


}
// 5. RENDERIZADO DE DETALLES (INFORMACIÓN COMPLETA)
function obtenerHTMLDetallado(log) {
    const detalles = log.details.data || log.details;

    let contenidoEspecifico = "";
if (log.entityType === "Producto") {
    // Extraemos los datos del producto guardados en el snapshot del log
    const producto = log.details?.data || {};
    const finanzas = producto.finanzas || {};
    const stock = producto.stock || {};
    const detalles = producto.detalles || {};

    contenidoEspecifico = `
        <div class="producto-eliminado-container">
            <div class="factura-header-top">
                <h3>🗑️ Producto Eliminado</h3>
                <span class="badge-metodo badge-eliminado">ELIMINADO</span>
            </div>

            <div class="cliente-resumen-box">
                <div class="cliente-main-info">
                    <strong>${producto.nombre || 'Sin nombre'}</strong>
                    <span>Código: ${producto.codigo || 'N/A'}</span>
                </div>
                <div class="cliente-sub-info">
                    <span>📦 Categoría: ${producto.categoria || 'N/A'}</span>
                    <span>🏷️ Marca: ${detalles.marca || 'N/A'}</span>
                </div>
            </div>

            <div class="productos-seccion">
                <h4 class="titulo-detalle">Detalles Financieros y Stock</h4>
                <div class="finanzas-resumen">
                    <div class="finanza-box">
                        <label>Costo</label>
                        <p>${finanzas.costo?.toFixed(2) || '0.00'} ${finanzas.moneda || 'USD'}</p>
                    </div>
                    <div class="finanza-box destacada-precio">
                        <label>Precio Venta</label>
                        <p>${finanzas.precio?.toFixed(2) || '0.00'} ${finanzas.moneda || 'USD'}</p>
                    </div>
                    <div class="finanza-box">
                        <label>Stock Actual</label>
                        <p>${stock.actual ?? '0'} un.</p>
                    </div>
                </div>
            </div>

            <div class="info-cliente-grid">
                <div class="info-item">
                    <label>ID Operación (Log)</label>
                    <span>#${log._id.toString().slice(-6).toUpperCase()}</span>
                </div>
                <div class="info-item">
                    <label>Fecha de Eliminación</label>
                    <span>${new Date(log.timestamp).toLocaleString()}</span>
                </div>
            </div>

            <hr class="separador">

            <div class="footer-auditoria">
                <small>Eliminado por: <strong>${log.UserAction?.Name || 'Usuario'}</strong> (${log.UserAction?.Correo || log.userId})</small>
            </div>
        </div>

        <style>
            .cliente-resumen-box {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 8px;
                border-left: 5px solid #f44336;
                margin-bottom: 20px;
            }
            .cliente-main-info { display: flex; justify-content: space-between; font-size: 1.1rem; }
            .cliente-sub-info { display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-top: 4px; }
            
            .productos-seccion { margin-bottom: 20px; background: #fff; border: 1px solid #eee; padding: 10px; border-radius: 8px; }
            .titulo-detalle { font-size: 0.9rem; color: #555; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            
            .finanzas-resumen { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 5px; }
            .finanza-box { padding: 10px; border-radius: 8px; text-align: center; background: #fbfbfb; border: 1px solid #eee; }
            .finanza-box label { font-size: 0.75rem; color: #666; display: block; margin-bottom: 5px; }
            .finanza-box p { margin: 0; font-size: 1rem; font-weight: bold; }
            
            .destacada-precio { background: #ffebee; border-color: #f44336; }
            .destacada-precio p { color: #c62828; }
            
            .badge-eliminado { background: #f44336; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
            .comentario-box { background: #fdfdfd; padding: 10px; border-radius: 6px; border: 1px solid #eee; font-style: italic; font-size: 0.85rem; }
            .footer-auditoria { margin-top: 20px; text-align: right; color: #aaa; line-height: 1.2; }
            .info-cliente-grid { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.85rem; }
        </style>
    `;
}
  if (log.entityType === "facturacion") {
    // Generamos las tarjetas de productos con un diseño más limpio
    let prods = (detalles.productos || []).map(p => `
        <div class="producto-card-detalle">
            <div class="prod-header">
                <span class="prod-nombre">📦 ${p.nombre || 'Producto'}</span>
                <span class="prod-cant">x${p.cantidad || 1}</span>
            </div>
            <div class="prod-body">
                <p>Precio Unit: <strong>${p.precio} ${detalles.moneda?.toUpperCase() || 'USD'}</strong></p>
                <p>Subtotal: <strong>${(p.precio * (p.cantidad || 1)).toFixed(2)}</strong></p>
            </div>
        </div>
    `).join('');

    let cristales = 0;
if (detalles.formula){
  cristales  =   `         <div class="producto-card-detalle">
            <div class="prod-header">
           <p>👓  Cristales</p>
               <span class="prod-cant">x${2}</span>

            </div>
            <div class="prod-body">
                    <table class="tabla-optica">
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
                            <td><strong>O.D.</strong> (Derecho)</td>
                            <td>${detalles.formula?.od?.esfera || '-'}</td>
                            <td>${detalles.formula?.od?.cilindro || '-'}</td>
                            <td>${detalles.formula?.od?.eje || '-'}</td>
                            <td>${detalles.formula?.od?.adicion || '-'}</td>
                        </tr>
                        <tr>
                            <td><strong>O.I.</strong> (Izquierdo)</td>
                            <td>${detalles.formula?.oi?.esfera || '-'}</td>
                            <td>${detalles.formula?.oi?.cilindro || '-'}</td>
                            <td>${detalles.formula?.oi?.eje || '-'}</td>
                            <td>${detalles.formula?.oi?.adicion || '-'}</td>
                        </tr>
                    </tbody>
                </table>
           <p> Precio: ${detalles.formula.precio}</p>
            </div>
        </div>`
}
    contenidoEspecifico = `
        <div class="factura-container">
            <div class="factura-header-top">
                <h3>📋 Detalle de Facturación</h3>
                <span class="badge-metodo">${detalles.metodoPago || detalles.metodo || 'Efectivo'}</span>
            </div>
            
            <div class="info-cliente-grid">
                <div class="info-item">
                    <label>Cliente</label>
                    <span>${log.details.data.cliente || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Cédula/RIF</label>
                    <span>${log.details.data.cedula || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Teléfono</label>
                    <span>${detalles.telefono || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Tipo</label>
                    <span>${detalles.factura || 'No-Fiscal'}</span>
                </div>
            </div>

            <hr class="separador">

            <div class="finanzas-resumen">
                <div class="finanza-box">
                    <label>Tasa del día</label>
                    <p>${detalles.tasa || '0.00'} Bs</p>
                </div>
                <div class="finanza-box destacada">
                    <label>Total en Divisas</label>
                    <p>${detalles.precio || '0.00'} ${detalles.moneda?.toUpperCase() || 'USD'}</p>
                </div>
                
                <div class="finanza-box destacada-bs">
                    <label>Total en Bolívares</label>
                    <p>${detalles.conversion || '0.00'} Bs</p>
                </div>
            </div>

            <h4 class="titulo-productos">Productos Facturados</h4>
            <div class="lista-productos-grid">

        ${cristales || ""}
  
                ${prods || '<p class="sin-datos">No hay productos registrados</p>'}
            </div>
        </div>
    `;

    return contenidoEspecifico;
} else if (log.entityType === "Pacientes") {
    const d = detalles || {};
    
    contenidoEspecifico = `
        <div class="paciente-container">
            <div class="factura-header-top">
                <h3>👤 Ficha de Paciente Eliminada</h3>
                <span class="badge-paciente">Historia Médica</span>
            </div>

            <div class="info-cliente-grid">
                <div class="info-item">
                    <label>Nombre del Paciente</label>
                    <span>${d.paciente || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Cédula</label>
                    <span>${d.cedula || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Edad</label>
                    <span>${d.edad || 'N/A'} años</span>
                </div>
                <div class="info-item">
                    <label>Fecha Registro</label>
                    <span>${formatearFecha(d.createdAt)}</span>
                </div>
            </div>

            <hr class="separador">
            <h4 class="titulo-productos">Fórmula Óptica (Receta)</h4>
            
            <div class="tabla-optica-container">
                <table class="tabla-optica">
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
                            <td><strong>O.D.</strong> (Derecho)</td>
                            <td>${d.formula?.od?.esfera || '-'}</td>
                            <td>${d.formula?.od?.cilindro || '-'}</td>
                            <td>${d.formula?.od?.eje || '-'}</td>
                            <td>${d.formula?.od?.adicion || '-'}</td>
                        </tr>
                        <tr>
                            <td><strong>O.I.</strong> (Izquierdo)</td>
                            <td>${d.formula?.oi?.esfera || '-'}</td>
                            <td>${d.formula?.oi?.cilindro || '-'}</td>
                            <td>${d.formula?.oi?.eje || '-'}</td>
                            <td>${d.formula?.oi?.adicion || '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="detalles-adicionales-grid">
                <div class="info-item">
                    <label>Cristales</label>
                    <span>${d.formula?.cristales || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Tratamiento</label>
                    <span>${d.formula?.tratamiento || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>D.P.</label>
                    <span>${d.formula?.dp || 'N/A'} mm</span>
                </div>
                <div class="info-item">
                    <label>Altura</label>
                    <span>${d.formula?.altura || 'N/A'} mm</span>
                </div>
            </div>
        </div>
    `;
} 
return contenidoEspecifico;

}


// 6. FLUJO DE DATOS (API + SOCKET)
(async () => {
    try {
        const { data } = await axios.get("/api/historial");
      
        // Ajustamos según como venga tu respuesta (dt.data.facturacion o dt.data)
        historialMemoria = Array.isArray(data) ? data : (data.facturacion || []);
        
        TablaDatos.innerHTML = "";
        historialMemoria.forEach(log => crearFilaHTML(log));
    } catch (error) {
        console.error("Error inicial:", error);
        // window.location = "/login";
    }
})();

// Escuchar cambios en tiempo real (Usando tu IDN)
if (typeof IDN !== 'undefined') {
    socket.on(IDN, (nuevoLog) => {
        historialMemoria.unshift(nuevoLog); // Guardar en memoria al inicio
        crearFilaHTML(nuevoLog, true);      // Pintar en tabla al inicio
        mostrarNotificacion(`Nuevo movimiento: ${nuevoLog.action}`);
    });
}

// 7. EVENTOS DE INTERACCIÓN (INFO Y EXPANDIR)
document.addEventListener("click",async (e) => {
    const btnInfo = e.target.closest("#info");
    const btnCerrar = e.target.closest(".btn-cerrar");

    if (btnInfo) {
        const padre = btnInfo.closest(".item-contenedor");
    try {const  respuesta111 =  await axios.get(`/api/historial/${padre.id}`)

           if (respuesta111.data[0]) {
            padre.classList.add("container-mas");
            if  (respuesta111.data[0].entityType === 'Abono')  {
                const html = await obtenerHTMLDetalladoAbono(respuesta111.data[0]); 
                    padre.innerHTML = html;
            ;
            } else {
     padre.innerHTML =      obtenerHTMLDetallado(respuesta111.data[0]);
            }
        
            console.log(respuesta111.data[0])
        }
    } catch (error) {
        console.log(error)
    }
     
    }

    if (btnCerrar) {
        const padre = btnCerrar.closest(".item-contenedor");
        const log = historialMemoria.find(h => h._id === padre.id);
        if (log) {
            padre.classList.remove("container-mas");
            // Restaurar fila original
            padre.innerHTML = ""; // Limpiar para recrear
            const tempDiv = document.createElement('div');
            crearFilaHTML(log); // Reusamos la lógica
            padre.replaceWith(TablaDatos.lastChild); // Reubicamos
        }
    }
});

//Boton  Filtrador
const Facturacion = document.querySelector("#Facturacion");
const Pacientes = document.querySelector("#Pacientes");
const Abono = document.querySelector("#Abonos");
// 8. FILTRADOR`
function crearFilaHTMLAbono(dato, alPrincipio = false) {
    console.log(dato);
    const item = document.createElement('div');
    item.id = dato._id;
    item.className = "item-contenedor"; // Para estilos CSS
    
    // Determinar color por acción
    const colores = { 'CREATED': 'verde', 'UPDATED': 'azul', 'DELETED': 'rojo' };
    const claseColor = colores[dato.action] || '';
console.log(dato)
    item.innerHTML = `
        <div id="p-datos" class="${claseColor}">
            <input class="input-datos" value="${dato.entityType || 'Entidad'}" readonly>
            <input class="input-datos" value="${dato.action || 'Acción'}" readonly>
            <input class="input-datos" value="${dato.UserAction?.Name || 'Sistema'}" readonly>
            <input class="input-datos" value="${formatearFecha(dato.
timestamp)}" readonly>
            <div id="config-container">
                <button id="info" title="Ver Detalles">
                    <lord-icon src="https://cdn.lordicon.com/fikcyfpp.json" trigger="hover" style="width:30px;height:30px"></lord-icon>
                </button>
            </div>
        </div>
    `;

    if (alPrincipio) TablaDatos.prepend(item);
    else TablaDatos.appendChild(item);
}
async function Busqueda(Boton,busqueda){
Boton.addEventListener("click", async () => {
    try {
        const { data } = await axios.get(`/api/historial/Filtrar/${busqueda}`);
        TablaDatos.innerHTML = "";

        data.forEach(log => crearFilaHTML(log));
    } catch (error) {
        mostrarNotificacion("Sin resultados.");
    }
});
}
async function Abono1(Boton,busqueda){
Boton.addEventListener("click", async () => {
    try {
        const { data } = await axios.get(`/api/historial/Filtrar/${busqueda}`);
        TablaDatos.innerHTML = "";

        data.forEach(log => crearFilaHTMLAbono(log));
    } catch (error) {
        mostrarNotificacion("Sin resultados.");
    }
});
}


Busqueda(Facturacion,"facturacion");
Busqueda(Pacientes , "Pacientes");
Abono1(Abono , "Abono");

// 9. NAVEGACIÓN
const asignarRuta = (id, ruta) => {
    const el = document.querySelector(id);
    if (el) el.onclick = () => window.location.pathname = ruta;
};

asignarRuta("#Home-btn", "/Casa");
asignarRuta("#Registro-btn", "/Inventario");
asignarRuta("#producto-btn", "/Productos");
asignarRuta("#mensaje-btn", "/Facturacion");
asignarRuta("#config-btn", "/Configuracion");
asignarRuta("#administrador-btn", "/Administrador");
asignarRuta("#Presupuesto-btn", "/Presupuesto");
asignarRuta("#Pedidos-btn", "/Pedidos");


asignarRuta("#Clientes-btn" , "/Clientes");

asignarRuta( "#controlGastos-btn" , "/Control/Gastos");
// Menú Desplegable
document.querySelector("#boton-menu").onclick = () => {
    document.querySelector("#menu-desplegable").classList.toggle("visible");
};

