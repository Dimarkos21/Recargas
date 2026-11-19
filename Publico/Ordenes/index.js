// ==========================================
// 1. ELEMENTOS DEL DOM (PANEL DE USUARIO Y MODAL)
// ==========================================
const scorpionUser = document.querySelector(".scorpion-user-pseudo");
const scorpionMail = document.querySelector(".scorpion-f-mail");
const scorpionNombre = document.querySelector(".scorpion-f-name");
const nav_menu = document.querySelector(".scorpion-nav-menu");

const iniciarSesion = document.querySelector("#boton");
const MenuIniciarSesion = document.querySelector("#authModalOverlay");
const botoncerrar = document.querySelector(".auth-close-btn");
const btnGoogle = document.querySelector("#Google");

// ==========================================
// 2. VERIFICAR SESIÓN ACTIVA Y MOSTRAR DATOS
// ==========================================
async function VerificaciondeusuarioDevolverPanel() {
    try {
        const response = await axios.get("/api/users/SesionACTIVA", {
            withCredentials: true // Envía las cookies de sesión al backend
        });

        if (response.status === 200) {
            if (scorpionUser) scorpionUser.textContent = response.data.name;
            if (scorpionNombre) scorpionNombre.textContent = response.data.email;
            if (scorpionMail) scorpionMail.textContent = response.data.name;

            if (nav_menu) nav_menu.classList.remove("oculto");
            if (iniciarSesion) iniciarSesion.style.display = "none";

            if (MenuIniciarSesion) {
                MenuIniciarSesion.style.display = "none";
                MenuIniciarSesion.classList.remove("auth-modal-overlay");
                MenuIniciarSesion.classList.add("oculto");
            }
        }
    } catch (error) {
        // Si devuelve 401 (no autenticado) o hay error, se mantiene la vista de invitado
        console.log("Usuario no autenticado o error de sesión:", error);
    }
}

// Ejecutar automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    VerificaciondeusuarioDevolverPanel();
});

// ==========================================
// 3. EVENTOS BÁSICOS DEL MODAL DE LOGIN (OPCIONAL)
// ==========================================
if (iniciarSesion && MenuIniciarSesion) {
    iniciarSesion.addEventListener("click", () => {
        MenuIniciarSesion.style.display = "";
    });
}

if (botoncerrar && MenuIniciarSesion) {
    botoncerrar.addEventListener("click", () => {
        MenuIniciarSesion.style.display = "none";
    });
}

if (btnGoogle) {
    btnGoogle.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "http://localhost:3006/auth/google";
    });
}

const BilleteraHtml = document.querySelector("#SaldoBilletera");
const Monto = document.querySelector("#monto");
async function SaldoBilletera()
{
 try {
    const Billetera = await axios.get("/api/Game/TotalBilletera");
BilleteraHtml.textContent = `$${Billetera.data.Saldo}`  
Monto.textContent = `$${Billetera.data.Saldo}`   

 } catch (error){
    console.log(error , "Hubo PRoblema con el server")
 }
};
SaldoBilletera();


const ordersTableBody = document.querySelector("#ordersTableBody");
// 1. Definición segura de los estilos de estado para evitar errores si no están declarados
const ESTILOS_ESTADO = {
    'Completado': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
    'Procesando': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
    'Cancelado': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }
};
function formatearFecha(fechaRaw) {
    if (!fechaRaw) return 'Pendiente';

    // Evita que fechas tipo "2026-11-17" (sin hora) resten un día por zona horaria UTC
    const valor = typeof fechaRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw.trim())
        ? `${fechaRaw.trim()}T00:00:00`
        : fechaRaw;

    const fechaObj = new Date(valor);

    // Si no es una fecha válida, devuelve el valor original sin romper la tabla
    if (Number.isNaN(fechaObj.getTime())) {
        return String(fechaRaw);
    }

    // Resultado ejemplo: "17/11/2026, 02:50 p. m."
    return fechaObj.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function actualizarTablaOrdenes(ordenes) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return; // Si la tabla no existe en esta vista, detiene la ejecución sin errores

    // Si no hay órdenes o el array está vacío, mostrar mensaje limpio
    if (!ordenes || ordenes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 24px 0; text-align: center; color: #8b9bb4; font-size: 13px;">
                    No hay órdenes recientes para mostrar.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = ordenes.map((orden, index) => {
        // Evita poner borde inferior en la última fila
        const borderStyle = index < ordenes.length - 1 ? 'border-bottom: 1px solid #1a2233;' : '';
        
        // Uso seguro de propiedades con encadenamiento opcional (?.)

      
        
        const rawId = String(orden?.id || '');
        const orderId = rawId.startsWith('#') ? rawId : `#${rawId}`;
        
        const monto = typeof orden?.monto === 'number'
            ? `Bs. ${orden.monto.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : (orden?.monto || 'Bs. 0.00');

        const icono = orden?.icono || '🎮';
        const producto = orden?.producto || 'Producto desconocido';
        const playerId = orden?.playerId || 'N/A';
        const UNA_HORA_MS = 60 * 60 * 1000; // 3,600,000 ms

let estadoActual = orden?.estado || 'Procesando';
     if (orden?.fechaPago && orden?.utilizado === true) {
    const fechaPagoObj = new Date(orden.fechaPago);
    
    // Si la fecha es válida y ya pasó más de 1 hora desde fechaPago
    if (!Number.isNaN(fechaPagoObj.getTime()) && (fechaPagoObj.getTime() + UNA_HORA_MS) < Date.now()) {
        estadoActual = 'Procesado';
    }
}
   if (orden?.fechaPago && orden?.utilizado === false) {
    const fechaPagoObj = new Date(orden.fechaPago);
    
    // Si la fecha es válida y ya pasó más de 1 hora desde fechaPago
    if (!Number.isNaN(fechaPagoObj.getTime()) && (fechaPagoObj.getTime() + UNA_HORA_MS) < Date.now()) {
        estadoActual = 'Rechazado';
    }
}

const badge = ESTILOS_ESTADO[estadoActual] || ESTILOS_ESTADO['Procesando'];
const fecha = formatearFecha(orden?.fechaPago);
        return `
            <tr data-order-id="${orderId}" style="${borderStyle}">
                <td style="padding: 16px 0; font-weight: 600; color: #ff2a2a;">${orderId}</td>
                <td style="padding: 16px 0;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 38px; height: 38px; background: #1a2233; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                            ${icono}
                        </div>
                        <div>
                            <strong style="display: block; color: #fff; font-size: 13px;">${orden.Producto}</strong>
                            <span style="font-size: 11px; color: #8b9bb4;">ID: ${orden.playerId}</span>
                        </div>
                    </div>
                </td>
                <td style="padding: 16px 0; color: #8b9bb4; font-size: 13px;">${fecha}</td>
                <td style="padding: 16px 0; font-weight: 600; color: #fff;">${orden.montoVES}</td>
                <td style="padding: 16px 0;">
                    <span class="status-badge" style="background: ${badge.bg}; color: ${badge.color}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">
                        ${estadoActual}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

async function CargarOrdenes_Juegos() {
    const tbody = document.getElementById('ordersTableBody');

    // Feedback visual de carga de manera segura
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 24px 0; text-align: center; color: #8b9bb4; font-size: 13px;">
                    Cargando órdenes...
                </td>
            </tr>
        `;
    }

    try {
        const ordenesRespuesta = await axios.get("/api/Game/Ordenes_Recargas");
        console.log( ordenesRespuesta )
        const responseData = ordenesRespuesta?.data;
        const listaOrdenes = responseData.Transferencia
      
console.log(listaOrdenes)
        actualizarTablaOrdenes(listaOrdenes);

    } catch (error) {
        console.error("Error al cargar órdenes:", error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 24px 0; text-align: center; color: #ff2a2a; font-size: 13px;">
                        No se pudieron cargar las órdenes.
                    </td>
                </tr>
            `;
        }
    }
}

// Inicialización controlada cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo ejecuta la carga de órdenes si el contenedor de la tabla existe en la página actual
    if (document.getElementById('ordersTableBody')) {
        CargarOrdenes_Juegos();
    }

    // Ejemplo de enlace seguro para elementos que podrían no estar presentes en todas las vistas
    const btnCerrarSesion = document.getElementById('CerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            // Tu lógica de cierre de sesión si aplica
        });
    }
});