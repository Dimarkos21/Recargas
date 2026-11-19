// 1. Función de Exportación a WhatsApp
// Definida fuera para que sea global y accesible desde el onclick


const Pedidos = document.querySelector("#Pedir");
const enLaboratorio = document.querySelector("#enLaboratorio");
const enLaboratorio1 = document.querySelector("#enLaboratorio");
const Completado = document.querySelector("#Completado");
const Completado1 = document.querySelector("#Completado");
const Entregado2 = document.querySelector("#Entregado");``
// 2. Carga de Pedidos desde el Backend
const container = document.querySelector("#datos"); // ✅ CAMBIO: usar "container" en vez de "d"

(async () => {
    try {
        const { data } = await axios.get('/api/pedidos');
        const listaPedidos = data.data; 

        container.innerHTML = ''; // ✅ AHORA SÍ USA LA VARIABLE CORRECTA

        if (listaPedidos.length === 0) {
            container.innerHTML = '<p class="text-center">No hay pedidos pendientes hoy.</p>';
        } else {
          

            listaPedidos.forEach(pedido => {
                const f = pedido.formula;
                  let reporteMensaje = '';
            if (f.oi.stock === true && f.od.stock === true) {
                reporteMensaje = ' ✅ Cristal Facturado y en stock en óptica.';
            }
             if (f.oi.stock === true && f.od.stock === false) {
                reporteMensaje = '⚠️ Falta el cristal del ojo derecho (OD).';
            }
             if (f.oi.stock === false && f.od.stock === true) {
                reporteMensaje = '⚠️ Falta el cristal del ojo izquierdo (OI).';
            } else {
                reporteMensaje = '❌ Cristal no facturado o no disponible.';
            }
                 
                // Serializamos el pedido para meterlo en el botón de forma segura
                const pedidoJSON = encodeURIComponent(JSON.stringify(pedido));

                container.innerHTML += `
                <div class="pedido-card">
                    <div class="card-header">
                        <div class="user-info">
                            <h3>${pedido.paciente}</h3>
                            <span><i class="fas fa-id-card"></i> ${pedido.cedula}</span>
                            <span><i class="fas fa-phone"></i> ${pedido.telefono}</span>
                              <span><i class="fas fa-edad"></i> Edad: ${pedido.edad || 0}</span>
                        </div>
                        <div class="badge">${pedido.Origen}</div>
                    </div>

                    <div class="formula-container">
                
                        <div class="ojo-column od">
                            <h4>OJO DERECHO (OD)</h4>
                            <div class="row"><span>Sph:</span> <strong>${f.od.esfera}</strong></div>
                            <div class="row"><span>Cyl:</span> <strong>${f.od.cilindro}</strong></div>
                            <div class="row"><span>Eje:</span> <strong>${f.od.eje}°</strong></div>
                            <div class="row"><span>Add:</span> <strong>${f.od.adicion}</strong></div>
                        </div>
                        <div class="ojo-column oi">
                            <h4>OJO IZQUIERDO (OI)</h4>
                            <div class="row"><span>Sph:</span> <strong>${f.oi.esfera}</strong></div>
                            <div class="row"><span>Cyl:</span> <strong>${f.oi.cilindro}</strong></div>
                            <div class="row"><span>Eje:</span> <strong>${f.oi.eje}°</strong></div>
                            <div class="row"><span>Add:</span> <strong>${f.oi.adicion}</strong></div>
                        </div>
                    </div>

                    <div class="specs-grid">
                        <div class="spec-item"><span>Tipo:</span> ${f.cristales}</div>
                        <div class="spec-item"><span>Tratamiento:</span> ${f.tratamiento}</div>
                        <div class="spec-item"><span>DP:</span> ${f.dp}</div>
                        <div class="spec-item"><span>Altura:</span> ${f.altura}</div>
                    </div>
    <div class="spec-item"><span>Estado:</span> ${reporteMensaje }</div>
                    <div class="card-footer" style="display: flex; gap: 10px; justify-content: space-between; align-items: center; padding-top: 15px;">
                        <span class="fecha"><i class="far fa-calendar-alt"></i> ${new Date(pedido.fecha).toLocaleDateString()}</span>
                        
                        <div class="btn-group" style="display: flex; gap: 5px;">
                            <button class="btn-whatsapp" 
                                    data-pedido="${pedidoJSON}" 
                                    id="enviarPorWhatsApp"
                                    style="background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </button>
                            
                            <button class="btn-entrega" id="${pedido._id}" data-estado="${pedido.checked}">
                                Listo
                            </button>
                            
                        </div>
                    </div>
                </div>
                `;
            });
        }

        const enviarPorWhatsApp = document.querySelector("#datos")
enviarPorWhatsApp.addEventListener("click" ,e => {

    // Buscamos si el clic (o el icono dentro del clic) pertenece al botón de WhatsApp
    const btn = e.target.closest('.btn-whatsapp');
    console.log(btn)
    // Si no es el botón de whatsapp, ignoramos el clic
    if (!btn) return;
    // Recuperamos los datos del atributo data-pedido
    const pedido = JSON.parse(decodeURIComponent(btn.getAttribute('data-pedido')));
    const f = pedido.formula;
        console.log(pedido.formula);
    // Construcción del mensaje con formato WhatsApp
    let mensaje = `*👓 ORDEN ÓPTICA: ${data.optica}* \n`;

mensaje += `*👓 ORDEN Paciente: ${pedido.paciente.toUpperCase()}* \n`;
    mensaje += `*----------------------------------*\n`;
  //  mensaje += `🆔 *C.I:* ${pedido.cedula}\n`;
  //  mensaje += `📞 *Telf:* ${pedido.telefono}\n`;
    mensaje += `📍 *Origen:* ${pedido.Origen}\n\n`;

    mensaje += `👁️ *OJO DERECHO (OD)*\n`;
    mensaje += `   Sph: *${f.od.esfera}* | Cyl: *${f.od.cilindro}*\n`;
    mensaje += `   Eje: *${f.od.eje}°* | Add: *${f.od.adicion}*\n\n`;

    mensaje += `👁️ *OJO IZQUIERDO (OI)*\n`;
    mensaje += `   Sph: *${f.oi.esfera}* | Cyl: *${f.oi.cilindro}*\n`;
    mensaje += `   Eje: *${f.oi.eje}°* | Add: *${f.oi.adicion}*\n\n`;

    mensaje += `🧪 *DETALLES TÉCNICOS*\n`;
    mensaje += `• *Cristal:* ${f.cristales}\n`;
    mensaje += `• *Tratamiento:* ${f.tratamiento}\n`;
    mensaje += `• *DP:* ${f.dp} mm | *Alt:* ${f.altura} mm\n`;
    mensaje += `*----------------------------------*\n`;
    mensaje += `📅 *Fecha:* ${new Date(pedido.fecha).toLocaleDateString()}\n`;
    mensaje += `🏢 *Enviado desde el Sistema OptiGest*`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}) 
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
    }
})();
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
// menu
const configurarBoton = (btn, ruta) => {
    if (btn) btn.addEventListener("click", () => window.location.pathname = ruta);
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
configurarBoton(ClienteBTN, "/Clientes");
const ControlGastosBTN = document.querySelector("#controlGastos-btn");

ControlGastosBTN.addEventListener("click", e => {
    window.location.pathname = "/Control/Gastos"

})
// otro

if (botonMenu) {
    botonMenu.addEventListener("click", () => {
        document.querySelector("#menu-desplegable").classList.toggle("visible");
    });
}

// 1. Creamos la función que mantiene EXACTAMENTE tu lógica
async function consultarPedidos(Pedido, enLaboratorio, Completado, Entregado) {
        console.log(Entregado, "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀");
    // TU ESTRUCTURA INTACTA:
    let Proceso = "";
    let classsista = "";
    console.log(Entregado,2 , "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀");
    if (Pedido) {
        Proceso = "PorPedir";
        classsista = "Pedir"
        
    } 
    else if (enLaboratorio) {
        Proceso = "enLaboratorio";
        classsista = "enLaboratorio"
    }
    else if (Completado) {
        Proceso = "Completado";
        classsista = "Completado"
    } else if (Entregado) {
        Proceso = "Entregado";
        classsista = "Entregado"
    }
    console.log(Proceso, classsista, "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀");


    if (Proceso) {
        try { 
                  const Button = document.querySelector(`#${classsista}`);
      if (Button) {
    
    // Si la pestaña activa es "Pedir"
    if (classsista === "Pedir") {
        console
        Button.classList.add("active"); // El botón actual se enciende

        // A los otros dos solo les quitamos el "active" (su clase "tab-btn" se queda quieta)
        enLaboratorio1.classList.remove("active");
        Completado1.classList.remove("active");
    }
    
    // Si la pestaña activa es "enLaboratorio"
    else if (classsista === "enLaboratorio") {
        Button.classList.add("active"); // El botón actual se enciende
Entregado2.classList.remove("active");
        Pedidos.classList.remove("active");
        Completado1.classList.remove("active");
    }
    
    // Si la pestaña activa es "Completado"
    else if (classsista === "Completado") {
        Button.classList.add("active"); // El botón actual se enciende
Entregado2.classList.remove("active");
        Pedidos.classList.remove("active");
        enLaboratorio1.classList.remove("active");
    }
 else if (classsista === "Entregado") {
        Button.classList.add("active"); // El botón actual se enciende

        Pedidos.classList.remove("active");
        enLaboratorio1.classList.remove("active");
           Completado1.classList.remove("active");
    }
}
   

            const Respuesta = await axios.get(`/api/Pedidos/${Proceso}`);
            console.log(Respuesta.data.data); // Axios guarda la respuesta en .data
            const Locura  = Respuesta.data.data;
            const  Datos = document.querySelector("#datos");

            // 1. Limpiamos el contenedor antes de renderizar los nuevos datos
Datos.innerHTML = "";
Locura.forEach(P => {
    console.log(P)
    // Extraemos 'formula' de P para no escribir P.formula a cada rato
    const f = P.formula; 
    
    // Convertimos el objeto completo a string seguro para el botón de WhatsApp
    const pedidoJSON = encodeURIComponent(JSON.stringify(P));

    Datos.innerHTML += `
        <div class="pedido-card">
            <div class="card-header">
                <div class="user-info">
                    <h3>${P.paciente}</h3>
                    <span><i class="fas fa-id-card"></i> ${P.cedula}</span>
                    <span><i class="fas fa-phone"></i> ${P.telefono}</span>
                </div>
                <div class="badge">${P.Origen}</div>
            </div>

            <div class="formula-container">
                <div class="ojo-column od">
                    <h4>OJO DERECHO (OD)</h4>
                    <div class="row"><span>Sph:</span> <strong>${f.od?.esfera || '-'}</strong></div>
                    <div class="row"><span>Cyl:</span> <strong>${f.od?.cilindro || '-'}</strong></div>
                    <div class="row"><span>Eje:</span> <strong>${f.od?.eje ? f.od.eje + '°' : '-'}</strong></div>
                    <div class="row"><span>Add:</span> <strong>${f.od?.adicion || '-'}</strong></div>
                </div>
                <div class="ojo-column oi">
                    <h4>OJO IZQUIERDO (OI)</h4>
                    <div class="row"><span>Sph:</span> <strong>${f.oi?.esfera || '-'}</strong></div>
                    <div class="row"><span>Cyl:</span> <strong>${f.oi?.cilindro || '-'}</strong></div>
                    <div class="row"><span>Eje:</span> <strong>${f.oi?.eje ? f.oi.eje + '°' : '-'}</strong></div>
                    <div class="row"><span>Add:</span> <strong>${f.oi?.adicion || '-'}</strong></div>
                </div>
            </div>

            <div class="specs-grid">
                <div class="spec-item"><span>Tipo:</span> ${f.cristales || 'No especifica'}</div>
                <div class="spec-item"><span>Tratamiento:</span> ${f.tratamiento || 'Ninguno'}</div>
                <div class="spec-item"><span>DP:</span> ${f.dp || '-'} mm</div>
                <div class="spec-item"><span>Altura:</span> ${f.altura || '-'} mm</div>
            </div>

            <div class="card-footer" style="display: flex; gap: 10px; justify-content: space-between; align-items: center; padding-top: 15px;">
                <span class="fecha">
                    <i class="far fa-calendar-alt"></i> ${new Date(P.fecha).toLocaleDateString()}
                </span>
                
                <div class="btn-group" style="display: flex; gap: 5px;">
                    <button class="btn-whatsapp" 
                            data-pedido="${pedidoJSON}" 
                            style="background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    
                    <button class="btn-entrega" id="${P.id}" >
                        Listo
                    </button>
                </div>
            </div>
        </div>
    `;
});

            // Aquí puedes llamar a la función que pinta tus datos en pantalla
            
        } catch (error) {
            console.log(error);
        }
    }
};

const btnEntrega = document.querySelector(".btn-entrega");
function borrarPedido(id, btn) {
    if (!id || !btn) {
        console.error("No se proporcionó un ID válido para borrar el pedido.");
        return;

    }

    const tarjetaPedido = btn.closest(".pedido-card");
    
    if (tarjetaPedido) {
        tarjetaPedido.remove();
    }

   

}

// 2. Al cargar la página, le asignas la función a tus 3 botones del HTML
document.addEventListener('DOMContentLoaded', () => {
    console.log("iniciado");

    // Botón 1: Ver Pedidos
    document.getElementById('Pedir').addEventListener('click', () => {
        // Ejecuta tu estructura pasando: Pedido = true, enLaboratorio = false, Completado = false
        consultarPedidos(true, false, false); 
    });

    // Botón 2: Ver En Laboratorio
    document.getElementById('enLaboratorio').addEventListener('click', () => {
        // Ejecuta tu estructura pasando: Pedido = false, enLaboratorio = true, Completado = false
        consultarPedidos(false, true, false);
    });

    // Botón 3: Ver Completados
    document.getElementById('Completado').addEventListener('click', () => {
        // Ejecuta tu estructura pasando: Pedido = false, enLaboratorio = false, Completado = true
        consultarPedidos(false, false, true);
    });
        document.getElementById('Completado').addEventListener('click', () => {
        // Ejecuta tu estructura pasando: Pedido = false, enLaboratorio = false, Completado = true
        consultarPedidos(false, false, true);
    });
       document.getElementById('Entregado').addEventListener('click', () => {
        // Ejecuta tu estructura pasando: Pedido = false, enLaboratorio = false, Completado = true
        consultarPedidos(false, false, false , true);
    });

});
let BtnEntrega1 = 0 ;
document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleccionamos el contenedor padre de las tarjetas
    const contenedorTabs = document.querySelector('#datos');

    // Elementos del modal para poder manipularlos
    const modal = document.getElementById('modal-gestion-pedido');
    const btnCerrarX = document.getElementById('btn-cerrar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    const btnConfirmar = document.getElementById('btn-confirmar-modal');

    if (contenedorTabs) {
        // 2. Un solo evento para todo el contenedor de pedidos
        contenedorTabs.addEventListener('click', async (e) => {
            
            // 3. Capturamos si se clickeó el botón "Listo"
            const botonClickeado = e.target.closest('.btn-entrega');
            
            // 4. Si se clickeó otra parte de la tarjeta, ignoramos
            if (!botonClickeado) return;
       
BtnEntrega1 = botonClickeado;
            // --- ¡Botón atrapado con éxito! ---
            const idPedido = botonClickeado.id; // Guarda el ID raro: "6a2ea565c704..."

            // 5. Buscamos los datos del paciente de la tarjeta donde se hizo clic
            const tarjetaPedido = botonClickeado.closest('.pedido-card');
            const nombrePaciente = tarjetaPedido.querySelector('.user-info h3').textContent;

            // 6. Averiguamos en qué pestaña/estado está parado el usuario actualmente
            // Buscamos cuál de tus botones de filtro principales tiene la clase 'active'
            const pestañaActiva = document.querySelector('.tab-btn.active');
            const estadoActual = pestañaActiva ? pestañaActiva.id : 'Pedir'; // Por defecto 'Pedir'

            // 7. Llamamos a la función para abrir el modal pasándole los datos dinámicos
      
            abrirModalGestion(idPedido, nombrePaciente, estadoActual);
        });
    }

    // --- LÓGICA PARA CONTROLAR EL MODAL ---

    function abrirModalGestion(idPedido, nombrePaciente, estadoActual) {
        document.getElementById('modal-paciente-nombre').textContent = nombrePaciente;
        
        const nodoPedir = document.getElementById('nodo-Pedir');
        const nodoLab = document.getElementById('nodo-enLaboratorio');
        const nodoCompleto = document.getElementById('nodo-Completado');
        const txtMensajeAccion = document.getElementById('modal-mensaje-accion');

        // Limpiamos estados visuales anteriores
        [nodoPedir, nodoLab, nodoCompleto].forEach(n => n.classList.remove('actual', 'siguiente'));
        
        // Configuramos el modal según el flujo real de OptiGest
        if (estadoActual === 'Pedir') {
            nodoPedir.classList.add('actual');
            nodoLab.classList.add('siguiente');
            txtMensajeAccion.innerHTML = `¿Confirmas que deseas enviar el pedido de <strong>${nombrePaciente}</strong> al <strong>Laboratorio</strong>?`;
        } else if (estadoActual === 'enLaboratorio') {
            nodoLab.classList.add('actual');
            nodoCompleto.classList.add('siguiente');
            txtMensajeAccion.innerHTML = `¿Confirmas que el laboratorio terminó el trabajo y el pedido de <strong>${nombrePaciente}</strong> está <strong>Completado</strong>?`;
        } else if (estadoActual === 'Completado') {
            nodoCompleto.classList.add('actual');
             nodoCompleto.classList.add('siguiente');
            txtMensajeAccion.innerHTML = `¿Confirmas que el pedido de <strong>${nombrePaciente}</strong> ha sido <strong>Entregado</strong> al paciente?`;
        }
         else if (estadoActual === 'Entregado') {
            nodoCompleto.classList.add('actual');
             nodoCompleto.classList.add('siguiente');
            txtMensajeAccion.innerHTML = `¿Confirmas que el pedido de <strong>${nombrePaciente}</strong> ha sido <strong>Entregado</strong> al paciente?`;
        }

        // Guardamos el ID del pedido en el botón de confirmar
        btnConfirmar.dataset.idTarget = idPedido;
        btnConfirmar.dataset.estadoOrigen = estadoActual; // Guardamos también el origen
        
        // Mostramos el modal
        modal.classList.add('active');
    }

    // Funciones para cerrar el modal de forma segura
    const cerrarModal = () => modal.classList.remove('active');
    btnCerrarX.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);

    // 8. ACCIÓN DEL BOTÓN CONFIRMAR DEL MODAL
    btnConfirmar.addEventListener('click', async () => {
        const idTarget = btnConfirmar.dataset.idTarget;
        const estadoOrigen = btnConfirmar.dataset.estadoOrigen;

        if (idTarget) {
            console.log(`Ejecutando actualización asíncrona para ID: ${idTarget} desde ${estadoOrigen}`);
            
            try {
const Actualizacion = await axios.patch(`/api/Pedidos/${estadoOrigen}` , {id : idTarget});

                console.log(estadoOrigen, Actualizacion);
                
                // Aquí ejecutas tu consulta real a tu backend/Base de datos
                // Ejemplo: await axios.post('/api/pedidos/actualizar-estado', { id: idTarget, origen: estadoOrigen });
                borrarPedido(Actualizacion.data.id,BtnEntrega1); // Usamos el ID devuelto por el backend para borrar la tarjeta
                cerrarModal();
                
                // Aquí vuelves a llamar a tu función para refrescar la lista de pedidos en pantalla
                // consultarPedidos(estadoOrigen); 

            } catch (error) {
                console.error("Error al actualizar el estado del pedido:", error);
            }
        }
    });
});