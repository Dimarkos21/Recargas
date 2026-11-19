// Navegación
const explorarJuegos = document.querySelector(".btn-primary");
if (explorarJuegos) {
    explorarJuegos.addEventListener("click", () => {
        window.location.href = "/";
    });
}

// AUTENTICACIÓN
const scorpionUser = document.querySelector(".scorpion-user-pseudo");
const scorpionMail = document.querySelector(".scorpion-f-mail");
const scorpionNombre = document.querySelector(".scorpion-f-name");
const iniciarSesion = document.querySelector("#boton");
const menuIniciarSesion = document.querySelector("#authModalOverlay");
const navMenu = document.querySelector(".scorpion-nav-menu");

// Si necesitas enviar cookies entre dominios/puertos en Axios:
axios.defaults.withCredentials = true;

async function verificacionDeUsuarioDevolverPanel() {
    try {
        const response = await axios.get("/api/users/SesionACTIVA");

        if (response.status === 200 && response.data) {
            if (scorpionUser) scorpionUser.textContent = response.data.name ?? "";
            if (scorpionNombre) scorpionNombre.textContent = response.data.name ?? "";
            if (scorpionMail) scorpionMail.textContent = response.data.email ?? "";

            if (navMenu) navMenu.classList.remove("oculto");
            if (iniciarSesion) iniciarSesion.style.display = "none";

            if (menuIniciarSesion) {
                menuIniciarSesion.style.display = "none";
                menuIniciarSesion.classList.remove("auth-modal-overlay");
                menuIniciarSesion.classList.add("oculto");
            }

            // Consultar billetera solo si hay sesión activa
            await saldoBilletera();
        }
    } catch (error) {
        if (error.response?.status === 401) {
            // Usuario no autenticado: no es un error inesperado
            return;
        }
        console.error("Error verificando sesión:", error);
    }
}

verificacionDeUsuarioDevolverPanel();

// INICIAR SESIÓN CON GOOGLE
const botonGoogle = document.querySelector("#Google");
if (botonGoogle) {
    botonGoogle.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/auth/google";
    });
}

// BILLETERA
const billeteraHtml = document.querySelector("#SaldoBilletera");
const montoHtml = document.querySelector("#monto");

async function saldoBilletera() {
    try {
        const response = await axios.get("/api/Game/TotalBilletera");
        const saldo = response.data?.Saldo ?? 0;

        if (billeteraHtml) billeteraHtml.textContent = `$${saldo}`;
        if (montoHtml) montoHtml.textContent = `$${saldo}`;
    } catch (error) {
        console.error("Hubo un problema con el servidor al obtener la billetera:", error);
    }
}