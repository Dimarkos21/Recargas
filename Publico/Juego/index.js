
const catalogo = document.getElementById('catalogoContainer');
const JuegosId = {
    "call-of-duty-mobile" : 260, 
    "arena-breakout": 243,
    "arena-breakout-infinite": 307,
    "discord":  1494, 
    "genshin-impact": 3,
    "oxide-survival-island": 322,
  "acecraft":    312 ,
    "asphalt-9-legends":329,
    "roblox":  1042,

};

// METODOS DE PAGO

const metodoDePago = document.querySelector(".payment-grid");

const METODOSDEPAGOCONTAINER = document.querySelector("#MetodosDePagoPaso3");

//  INput ID PLAYER CONTAINER
const idCOntainer = document.querySelector("#COntainerPlayerID");
// NOmbre del producto
const NombredelProducto = document.getElementById('NombredelProducto');
// Productos Container Bonos
const ProductosBonos = document.getElementById('ProductosBonos');
// Container paquetes
const PaqueteContainer = document.getElementById("PaqueteContainer");
// CONTAINER NUMEROS DE PASOS 1 a 3
const Numberaciondepasos = document.getElementById("Numberaciondepasos");

// 1. ESTADO GLOBAL DEL PRODUCTO SELECCIONADO
let productoSeleccionado = {
    id: null,
    nombre: 'Selecciona un paquete',
    precioUnitario: 0,
    cantidad: 1
};
// 3. MENSAJE
/**
 * Muestra una notificación flotante estilo Scorpion Gaming.
 * @param {string} message - El texto del mensaje.
 * @param {string} type - 'success', 'error' o 'info'.
 * @param {number} duration - Duración en ms (por defecto 4000).
 */
function Mensaje(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Puedes agregar un icono o texto rápido según el tipo
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span style="font-size: 16px;">${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  // Activar animación
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remover notificación tras el tiempo indicado
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}
// 2. FUNCIÓN PARA ACTUALIZAR EL RESUMEN VISUAL EN LA UI
function actualizarResumenUI() {
    const itemTextEl = document.querySelector('.summary-item-selected .item-text');
    const cantidadEl = document.querySelector('.quantity-control span');
    const totalPriceEl = document.querySelector('.total-price');

    if (itemTextEl) itemTextEl.textContent = productoSeleccionado.nombre;
    if (cantidadEl) cantidadEl.textContent = productoSeleccionado.cantidad;

    const total = productoSeleccionado.precioUnitario * productoSeleccionado.cantidad;
    if (totalPriceEl) {
        totalPriceEl.textContent = `Bs. ${total.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}
// COmprar BOTON 
const ComprarBOTON  = document.querySelector("#Comprar");
//  CONTINUAR
const Continuar = document.querySelector("#Continuar");

// 4. CAMBIO DE INFORMACIÓN (BOTONES: Bonos / Paquetes)
const Boton_Bonos_Paquetes = document.querySelectorAll(".toggle-btn");

Boton_Bonos_Paquetes.forEach(button => {
    button.addEventListener('click', (e) => {
        METODOSDEPAGOCONTAINER.style.display = "none";
        Numberaciondepasos.innerHTML = "1";
        
        ComprarBOTON.style.display = "none";
        Continuar.style.display =  "";
         idCOntainer.style.display = "none";
        // Quitar clase active de todos
        Boton_Bonos_Paquetes.forEach(btn => btn.classList.remove('active'));
        
        // Poner clase active al presionado
        const clickedButton = e.currentTarget;
        clickedButton.classList.add('active');
        
        const textoBoton = clickedButton.textContent.trim();

        // Mostrar / Ocultar contenedores
        if (textoBoton === "Bonos") {
            ProductosBonos.style.display = "grid";
            PaqueteContainer.style.display = "none";
        } else if (textoBoton === "Paquetes" || textoBoton === "Paquete") {
            ProductosBonos.style.display = "none";
            PaqueteContainer.style.display = "grid";
        }
    });
});

// 5. FUNCIÓN GENÉRICA PARA MANEJAR EL CLIC EN CUALQUIER TARJETA
function manejarClickTarjeta(e) {
    const tarjeta = e.target.closest('.package-card');
    if (!tarjeta) return;

    // Obtenemos los datos
    const externalId = tarjeta.getAttribute('value');
    const nombrePaquete = tarjeta.querySelector('.package-amount').textContent.trim();
    const precioTexto = tarjeta.querySelector('.package-price').textContent.trim();
    
    // Convertimos el precio a número
    const precioNumerico = parseFloat(
        precioTexto.replace('Bs.', '').replace(/\./g, '').replace(',', '.').trim()
    ) || 0;

    // Actualizamos el estado global
    productoSeleccionado = {
        id: externalId,
        nombre: nombrePaquete,
        precioUnitario: precioNumerico,
        cantidad: 1 // Reiniciamos a 1 al cambiar de paquete
    };

    // Actualizamos la interfaz del resumen
    actualizarResumenUI();

    console.log("¡Tarjeta seleccionada!");
    console.log("ID del producto:", externalId);
    console.log("Nombre:", nombrePaquete);
    console.log("Precio:", precioTexto);

    // Manejo de clases visuales "selected"
    document.querySelectorAll('.package-card').forEach(card => card.classList.remove('selected'));
    tarjeta.classList.add('selected');
}

// Escuchamos los clics en los contenedores de tarjetas
if (ProductosBonos) ProductosBonos.addEventListener('click', manejarClickTarjeta);
if (PaqueteContainer) PaqueteContainer.addEventListener('click', manejarClickTarjeta);

// 6. CONTROLADORES DE CANTIDAD (+ y -) EN EL RESUMEN
const botonesCantidad = document.querySelectorAll('.quantity-control button');

if (botonesCantidad.length >= 2) {
    const btnRestar = botonesCantidad[0];
    const btnSumar = botonesCantidad[1];

    btnRestar.addEventListener('click', () => {
        if (productoSeleccionado.cantidad > 1) {
            productoSeleccionado.cantidad--;
            actualizarResumenUI();
        }
    });

    btnSumar.addEventListener('click', () => {
        productoSeleccionado.cantidad++;
        actualizarResumenUI();
    });
}

// AUTENTICAR 


const scorpionUser = document.querySelector(".scorpion-user-pseudo");
const scorpionMail = document.querySelector(".scorpion-f-mail");
const scorpionNombre = document.querySelector(".scorpion-f-name");
// BOTON INICIAR SESION
const iniciarSesion = document.querySelector("#boton");

const MenuIniciarSesion = document.querySelector("#authModalOverlay");
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
MenuIniciarSesion.style.display = "none";

// menu de iniciar sesion 
MenuIniciarSesion.classList.remove("auth-modal-overlay");
MenuIniciarSesion.classList.add("oculto");
     } 
     else if (response.status === 401){

        // no hacemos nada
     }
} catch ( error){

    console.log(error)
}
}
// IDJUEGO
let IDJUEGO = 0;
// 3. CARGA DINÁMICA DE PRODUCTOS DESDE LA API
(async () => {
    try {
        VerificaciondeusuarioDevolverPanel()
        const gameName = window.location.pathname.split('/').filter(Boolean).pop();
        if (!gameName || !JuegosId[gameName]) return;
IDJUEGO = JuegosId[gameName]
        const response = await axios.get(`/api/Game/1/${JuegosId[gameName]}`);
        console.log('Productos obtenidos:', response);
        
        NombredelProducto.textContent = response.data.nombre || 'Juego';

        // Limpiamos los contenedores antes de pintar
        ProductosBonos.innerHTML = '';
        PaqueteContainer.innerHTML = '';

        response.data.productos.forEach((p, index) => {
            // Asegúrate de cambiar 'p.price' por el nombre real de la propiedad de precio en tu API si es diferente (ej: p.precio)
            const precioFormateado = p.price ? Number(p.price).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.044,45';

            const htmlTarjeta = `
            <div class="package-card" value="${p.external_id}">
                <div class="package-info">
                    <span class="package-amount">${p.name} <small></small></span>
                </div>
                <div class="package-price">Bs. ${p.precio_bs}</div>
            </div>
            `;

            if (p.Bonos_o_Paquetes === "Bonos") {
                ProductosBonos.innerHTML += htmlTarjeta;
            } else if (p.Bonos_o_Paquetes === "Paquetes") {
                PaqueteContainer.innerHTML += htmlTarjeta;
            }
        });

        // Opcional: Seleccionar automáticamente el primer producto disponible al cargar
        const primeraTarjeta = document.querySelector('.package-card');
        if (primeraTarjeta) {
            primeraTarjeta.click();
        }

    } catch (error) {
        console.error('Error al obtener productos:', error);
    }
})();

// INICIAR SESION CON GOOGLE 

const Google = document.querySelector("#Google");


Google.addEventListener('click', (e) => {
        e.preventDefault(); // Previene cualquier comportamiento por defecto
        
        // Redirige al navegador del usuario hacia la ruta de tu backend en Node.js
        window.location.href = "https://www.scorpiongaming.com.ve/auth/google";
        


    });


// Menu de autenticado de compra


async function Comprar(){
    try {
         
        VerificaciondeusuarioDevolverPanel()
        PaqueteContainer.style.display = "none";
        ProductosBonos.style.display = "none";
            idCOntainer.style.display = "";
  iniciarSesion.style.display = "";
       

    } catch (error) {
        
    }
}


// VRIFICAR
const VerificarID = document.querySelector("#VerificarID");
// PLAYER ID
const PlayerID  = document.querySelector("#PlayerID");
Continuar.addEventListener("click" , e => {
     idCOntainer.style.display = "";
    
    Numberaciondepasos.innerHTML = "2";
    Continuar.style.display = "none"
     ComprarBOTON.style.display = ""
    ComprarBOTON.disabled = false;
METODOSDEPAGOCONTAINER.style.display = "";



Comprar();
});
// Verificar ID
const compactVerify = document.querySelector(".compact-verify");
const contenedorInput_BUTTON = document.querySelector(".input-wrapper");
// Selecciona el input de tipo radio que esté checked (marcado) dentro del contenedor
const metodoSeleccionado = document.querySelector('#MetodosDePagoPaso3 input[name="payment_method"]:checked');
let VERIFICACION_TRUE_OR_FALSE = false ;
VerificarID.addEventListener("click", async e => {
    // 1. Validar que se haya seleccionado un paquete
    const tarjetaSeleccionada = document.querySelector('.package-card.selected');
    if (!tarjetaSeleccionada) {
        Mensaje("Por favor selecciona un paquete antes de continuar.");
        return;
    }

    const idPaquete = tarjetaSeleccionada.getAttribute('value');
    const valorId = PlayerID.value.trim();

    // 2. Validar que el campo no esté vacío
    if (valorId.length === 0) {
        Mensaje("Por favor ingresa tu ID de jugador.");
        return;
    }

    // 3. Validar que no supere los 15 dígitos
    if (valorId.length > 15) {
        PlayerID.value = valorId.slice(0, 15); // Corta a 15 caracteres
        Mensaje("Verifique su ID, solo se permiten máximo 15 números.");
        return; // Detenemos la ejecución para que no haga la petición con error
    }

 if (valorId.length >=  15 

 ){
         Mensaje("Verifique su ID, solo se permiten máximo 5 a 15 números.");
        return; // Detenemos la ejecución para que no haga la petición con error
 }

    try { 
        
        // 4. Realizar la petición al backend con Axios
        const response = await axios.post(`/api/Game/PlayerID`, { 
            PlayerID: PlayerID.value, 
            JuegoID: idPaquete 
        });
        
        console.log("Verificación exitosa:", response.data);
        
        contenedorInput_BUTTON.style.display = "none";
        VERIFICACION_TRUE_OR_FALSE = true ;
        // Aquí puedes continuar con el siguiente paso (ej. mostrar el nombre del jugador)
Mensaje("ID Verificado");
// RENDERIZAR JUGADOR

compactVerify.innerHTML = ` 

    <img src="https://as1.ftcdn.net/v2/jpg/06/27/17/78/1000_F_627177845_t4i7TgJzx31LTvvfFebuKDtA7pCZaVmF.jpg" alt="Avatar" class="verify-avatar">
    <div class="verify-info">
        <div class="verify-header">
            <h4 class="player-name" id="playerName">${response.data.playerInfo.data.player_name}</h4>
            <span class="game-tag" id="gameTag">Global</span>
        </div>
        <div class="verify-details">
            <span class="player-id">ID: <span id="playerId">${response.data.playerInfo.data.player_id}</span></span>
            <div class="status-check">
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Verificado
            </div>
        </div>
    </div>
`;
// LOGICA DE COMPRA 



    } catch (error) {
        console.error("Error al verificar el ID:", error);
        Mensaje(error.response?.data?.error || "Verifica ID y Juego.");
    }
});
// id de la transaccion
let intentIdActual = null;
// 2. Evento independiente para procesar la compra y el pago
ComprarBOTON.addEventListener("click", async e => {
    if (VERIFICACION_TRUE_OR_FALSE === true){

           // Validar primero que el ID esté verificado


    // Capturar método de pago
    const metodoSeleccionado = document.querySelector('#MetodosDePagoPaso3 input[name="payment_method"]:checked');
    if (!metodoSeleccionado) {
        Mensaje("Por favor selecciona un método de pago.");
        return;
    }
if (VERIFICACION_TRUE_OR_FALSE === false)
{
       Mensaje("Verifica el ID.");
        return;
}


    const tipoPago = metodoSeleccionado.value; 
    const idPaquete = document.querySelector('.package-card.selected')?.getAttribute('value');
    const valorId = PlayerID.value.trim();
    const Cantidad_PRODUCTO  = document.querySelector("#Cantidad_PRODUCTO");
    const r4Container = document.querySelector("#r4-pago-widget");
    if ( !Cantidad_PRODUCTO|| !Number(Cantidad_PRODUCTO.textContent) ) {
        Mensaje("Hubo un error con la cantidad (No disponible)")
        return;
    }
if (tipoPago === "pago_movil") {
    r4Container.style.display = "";
            let pasoActual = 1; // 1: Solicitar OTP | 2: Procesar pago con el OTP recibido
            const form = document.getElementById("c2pForm");
            const btnAccion = document.getElementById("btnAccion");

            if (form) {
                // Evitamos múltiples listeners clonando el nodo o validando si ya fue inicializado
                form.onsubmit = async (e) => {
                    e.preventDefault(); 

                    const telefonoInput = document.getElementById("telefono");
                    const cedulaInput = document.getElementById("cedula");
                    const bancoSelect = document.getElementById("banco");
                    const otpInput = document.getElementById("otp");

                    const telefono = telefonoInput.value.trim().replace(/\s+|-/g, "");
                    let cedula = cedulaInput.value.trim().toUpperCase().replace(/\s+|-/g, "");
                    const banco = bancoSelect.value;
                    
                    const elementoConversion = document.getElementById("Conversion");
                    const textoMonto = elementoConversion ? elementoConversion.textContent : "35.00";
                    const montoVES = parseFloat(textoMonto.replace(/[^0-9.]/g, "")) || 35;

                    if (/^\d+$/.test(cedula)) {
                        cedula = `V${cedula}`;
                    }

                    // --- PASO 1: SOLICITAR CLAVE DINÁMICA (OTP) ---
                    if (pasoActual === 1) {
                        const regexTelefono = /^(0412|0414|0424|0416|0426)\d{7}$/;
                        if (!regexTelefono.test(telefono)) {
                            Mensaje("Por favor, ingresa un número de teléfono válido de 11 dígitos.");
                            telefonoInput.focus();
                            return;
                        }

                        const regexCedula = /^[VEJ]\d{6,9}$/;
                        if (!regexCedula.test(cedula)) {
                           Mensaje("Por favor, ingresa una cédula válida (Ej. V12345678).");
                            cedulaInput.focus();
                            return;
                        }

                        if (!banco) {
                          Mensaje("Por favor, selecciona el banco emisor.");
                            bancoSelect.focus();
                            return;
                        }

                        try {
                            btnAccion.disabled = true;
                            btnAccion.textContent = "Solicitando clave dinámica...";

                            const response = await axios.post("/api/Game/solicitar-otp", {
                                telefono,
                                cedula,
                                banco,
                                Metodo: tipoPago,
                                PlayerID: valorId,
                                JuegoID: idPaquete,
                                Cantidad: Number(Cantidad_PRODUCTO.textContent)
                            }, {
                                headers: { 'Content-Type': 'application/json' }
                            });

                            if (response.data.success) {
 intentIdActual = response.data.intentId
                                Mensaje(response.data.message || "Clave dinámica enviada.");

                                telefonoInput.disabled = true;
                                cedulaInput.disabled = true;
                                bancoSelect.disabled = true;

                                document.getElementById("grupoOtp").style.display = "flex";
                                otpInput.required = true;
                                otpInput.focus();

                                btnAccion.textContent = "Confirmar Pago y Activar Plan";
                                pasoActual = 2;
                            }
                        } catch (error) {
                            console.error("❌ Error al solicitar OTP:", error);
                            const mensajeError = error.response?.data?.error || "Error al solicitar la clave dinámica.";
                           Mensaje(mensajeError);
                        } finally {
                            btnAccion.disabled = false;
                            if (pasoActual === 1) {
                                btnAccion.textContent = "Solicitar Clave Dinámica";
                            }
                        }
                    } 
                    // --- PASO 2: CONFIRMAR C2P CON EL OTP ---
                    else if (pasoActual === 2) {
                        const otp = otpInput.value.trim();
                        
                        // Validamos de 6 a 8 dígitos según el banco
                        const regexOtp = /^\d{6,8}$/; 
                        if (!regexOtp.test(otp)) {
                            Notificacion("La clave dinámica (OTP) debe contener entre 6 y 8 números.");
                            otpInput.focus();
                            return;
                        }

                        try {
                            btnAccion.disabled = true;
                            btnAccion.textContent = "Procesando pago con el banco...";

                            // 💡 ENVIAMOS TODOS LOS DATOS NECESARIOS AL BACKEND
                            const response = await axios.post("/api/Game/confirmar-c2p", {
                                Metodo: tipoPago,
                                PlayerID: valorId,
                                JuegoID: idPaquete,
                                Cantidad: Number(Cantidad_PRODUCTO.textContent),
                                telefono: telefono,
                                cedula: cedula,
                                banco: banco,
                                intentId: intentIdActual,
                                otp: otp,
                                concepto: `Compra de ${Cantidad_PRODUCTO.textContent} ítems`
                            }, {
                                headers: { 'Content-Type': 'application/json' }
                            });

                            if (response.status === 200 && response.data.success) {
                              Mensaje(response.data.message);
                                window.location.href = "/Ordenes";
                            }
                                  if (response.status === 202 && response.data.success) {
                               Mensaje(response.data.message);
                                window.location.href = "/Ordenes";
                            }
     window.location.href = "/Ordenes";
                        } catch (error) {
                            console.error("❌ Error al procesar pago C2P:", error);
                            const mensajeError = error.response?.data?.error || "El banco rechazó la transacción o la OTP es incorrecta.";
                            Notificacion(mensajeError);
                            btnAccion.textContent = "Reintentar Confirmación";
                        } finally {
                            btnAccion.disabled = false;
                        }
                    }
                };
            }
        }
        // ==========================================
        // FLUJO DE BILLETERA INTERNA
        // ==========================================
 if (tipoPago === "Billetera"){
       try {
        Mensaje("Procesando pago...");

        const respuestaPago = await axios.post("/api/Game/Compra", {
             Metodo: tipoPago,
            PlayerID: valorId,
            JuegoID: idPaquete,
            Cantidad: Number(Cantidad_PRODUCTO.textContent)
        });


        console.log("Pago exitoso:", respuestaPago.data);
        Mensaje("¡Compra realizada con éxito!");
        window.location.href = "/Ordenes";

    } catch (error) {
        console.error("Error al procesar el pago:", error);
        Mensaje(error.response?.data?.error || "Hubo un error al procesar el pago.");
    }
 }
    } else {
     Mensaje("¡Verifica tu ID!");
     return;
    }

 
});
// BOTON CERRAR INICIO SESION

const  botoncerrar = document.querySelector(".auth-close-btn");

botoncerrar.addEventListener("click", e => {
MenuIniciarSesion.style.display = "none";
});



iniciarSesion.addEventListener("click", e => {
MenuIniciarSesion.style.display = "";

});




const BilleteraHtml = document.querySelector("#SaldoBilletera");
async function SaldoBilletera()
{
 try {
    const Billetera = await axios.get("/api/Game/TotalBilletera");
BilleteraHtml.textContent = `$${Billetera.data.Saldo}`  

 } catch (error){
    console.log(error , "Hubo PRoblema con el server")
 }
};
SaldoBilletera();

const  r4Container = document.querySelector("#cerrarR4");
const  r4ContainerDIV = document.querySelector("#r4-pago-widget");
r4Container.addEventListener("click", e => {
r4ContainerDIV.style.display = "none";
});