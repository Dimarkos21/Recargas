// Función para crear la ventana flotante de forma automática en cualquier página
function mostrarModalBloqueado(mensaje = "Tu plan actual no incluye esta funcionalidad.") {
    // Si ya existe un modal anterior, lo borramos para evitar duplicados
    const modalExistente = document.getElementById('modal-bloqueo-plan');
    if (modalExistente) modalExistente.remove();

    // Fondo oscuro transparente que cubre toda la pantalla
    const overlay = document.createElement('div');
    overlay.id = 'modal-bloqueo-plan';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        font-family: Arial, sans-serif;
    `;

    // Caja blanca central de la ventana flotante
    const caja = document.createElement('div');
    caja.style.cssText = `
        background: #ffffff;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;

    // Contenido interno del anuncio
    caja.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 10px;">🔒</div>
        <h2 style="color: #e74c3c; margin-top: 0; margin-bottom: 10px; font-size: 22px;">Módulo Bloqueado</h2>
        <p style="color: #555; font-size: 14px; line-height: 1.5; margin-bottom: 25px;">${mensaje}</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="btn-cerrar-modal" style="
                background: #95a5a6; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px;
            ">Entendido</button>
            <a href="/Casa" style="
                background: #3498db; 
                color: white; 
                text-decoration: none; 
                padding: 10px 20px; 
                border-radius: 6px; 
                font-size: 14px;
                display: inline-block;
            ">Actualizar Plan</a>
        </div>
    `;

    overlay.appendChild(caja);
    document.body.appendChild(overlay);

    // Acción para cerrar la ventana flotante al hacer clic en "Entendido"
    document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
        overlay.remove();
    });
}


axios.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente la devuelve
    return response;
  },
  (error) => {
    // Extrae el código de estado (status) si existe la respuesta
    const status = error.response ? error.response.status : null;

    // Rutas de redirección: ['/Planes', '/Login', '/Casa']
  const currentPath = window.location.pathname; // Detecta dónde estás
const mensajeServidor =  "Tu plan actual no permite acceder a esta función.";
     if (status === 402) {
      mostrarModalBloqueado(mensajeServidor); // Manda a llamar la ventana flotante flotando sobre cualquier página
      return Promise.reject(error);
    }
  // Solo redirige a /Planes si el error es 411 Y NO estás ya en /Planes
  if (status === 411 && currentPath !== '/Planes/') {
    window.location.href = '/Planes';
    console.log("me active")
  }
  const iniciarSesion = document.querySelector("#authModalOverlay");
    if (status === 401 || status === 409) {
    iniciarSesion.style.display = "";
    
    } 
     if (status === 412) {
    
      window.location.href = '/Casa';
    }
     
    
    // Rechaza la promesa para que el error pueda ser manejado por el catch del cliente
    return Promise.reject(error);
  }
);