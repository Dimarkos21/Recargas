
// --- SELECCIÓN DE ELEMENTOS ---
const HomeBtn = document.querySelector("#Home-btn");
const RegistroBtn = document.querySelector("#Registro-btn");

const MensajeBtn = document.querySelector("#mensaje-btn");
const ConfiguracionBtn = document.querySelector("#config-btn");
const HistorialBtn = document.querySelector("#mensaje-historial");
const administradorBtn = document.querySelector("#administrador-btn");
const  ProductosBTN = document.querySelector("#producto-btn");
const  botonMenu = document.querySelector("#boton-menu");
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
// barra de navegacion
      const container2 = document.querySelector("#menu-desplegable");
        
 botonMenu.addEventListener("click" , e => {
 
       
      
            if ( container2.classList.contains("visible") ===true) {
                container2.classList.remove("visible")
              
              
            }else { 
                container2.classList.add("visible")
        
        }
            
            });





(async () => {
    try {
        console.log("Intentando obtener la tabla...");
        const respuesta = await axios.get("/api/presupuesto/");
        
        // Manejo flexible por si viene array u objeto directo
        const P = respuesta.data.data[0] || respuesta.data.data;

        if (!P) return;

        console.log("Datos recibidos:", P);

        // --- ASIGNACIÓN DE VALORES ---

        // Visión Sencilla
        document.getElementById('Vision_sencilla').value = P.Vision_sencilla || 0;
        document.getElementById('Vision_sencilla_Tratamiento').value = P.Vision_sencilla_Tratamiento || 0;
        document.getElementById('Vision_sencilla_Tratamiento_Foto').value = P.Vision_sencilla_Tratamiento_Foto || 0;
        document.getElementById('Vision_sencilla_Poli').value = P.Vision_sencilla_Poli || 0;

        // Visión Tallada
        document.getElementById('Vision_Tallado').value = P.Vision_Tallado || 0;
        document.getElementById('Vision_Tallado_Tratamiento').value = P.Vision_Tallado_Tratamiento || 0;
        document.getElementById('Vision_Tallado_Tratamiento_Foto').value = P.Vision_Tallado_Tratamiento_Foto || 0;
        document.getElementById('Vision_Tallado_Poli').value = P.Vision_Tallado_Poli || 0;

        // Visión Fórmula Alta
        document.getElementById('Visión_Formula_Alta').value = P.Vision_Formula_Alta || 0;
        document.getElementById('Visión_Formula_Alta_AR').value = P.Vision_Formula_Alta_AR || 0;
        document.getElementById('Visión_Formula_Alta_Foto').value = P.Vision_Formula_Alta_Foto || 0;
        document.getElementById('Visión_Formula_Alta_Poli').value = P.Vision_Formula_Alta_Poli || 0;

        // Bifocales
        document.getElementById('Bifocales').value = P.Bifocales || 0;
        document.getElementById('Bifocales_Tratamiento').value = P.Bifocales_Tratamiento || 0;
        document.getElementById('Bifocales_Tratamiento_Foto').value = P.Bifocales_Tratamiento_Foto || 0;
        document.getElementById('Bifocales_Poli').value = P.Bifocales_Poli || 0;

        // Bifocales Tallados
        document.getElementById('Bifocales_Tallados').value = P.Bifocales_Tallados || 0;
        document.getElementById('Bifocales_Tallados_Tratamiento').value = P.Bifocales_Tallados_Tratamiento || 0;
        document.getElementById('Bifocales_Tallados_Tratamiento_Foto').value = P.Bifocales_Tallados_Tratamiento_Foto || 0;
        document.getElementById('Bifocales_Tallados_Poli').value = P.Bifocales_Tallados_Poli || 0;

        // Bifocales Fórmula Alta
        document.getElementById('Bifocales_Formula_Alta').value = P.Bifocales_Alta || 0;
        document.getElementById('Bifocales_Formula_Alta_AR').value = P.Bifocales_Alta_AR || 0;
        document.getElementById('Bifocales_Formula_Alta_Foto').value = P.Bifocales_Alta_Foto|| 0;
        document.getElementById('Bifocales_Formula_Alta_Poli').value = P.Bifocales_Alta_Poli || 0;

        // Multifocal
        document.getElementById('Multifocales').value = P.Multifocales || 0;
        document.getElementById('Multifocales_Tratamiento').value = P.Multifocales_Tratamiento || 0;
        document.getElementById('Multifocales_Tratamiento_Foto').value = P.Multifocales_Tratamiento_Foto || 0;
        document.getElementById('Multifocales_Poli').value = P.Multifocales_Poli || 0;

        // Multifocal Tallado
        document.getElementById('Multifocales_Tallados').value = P.Multifocales_Tallados || 0;
        document.getElementById('Multifocales_Tallados_Tratamiento').value = P.Multifocales_Tallados_Tratamiento || 0;
        document.getElementById('Multifocales_Tallados_Tratamiento_Foto').value = P.Multifocales_Tallados_Tratamiento_Foto || 0;
        document.getElementById('Multifocales_Tallados_Poli').value = P.Multifocales_Tallados_Poli || 0;

        // Multifocal Fórmula Alta
        document.getElementById('Multifocal_Formula_Alta').value = P.Multifocales_Alta || 0;
        document.getElementById('Multifocal_Formula_AR').value = P.Multifocales_Alta_AR || 0;
        document.getElementById('Multifocal_Formula_Alta_Foto').value = P.
Multifocales_Alta_Foto || 0;
        document.getElementById('Multifocal_Formula_Alta_Poli').value = P.Multifocales_Alta_Poli|| 0;

        console.log("✅ Interfaz actualizada con éxito.");

    } catch (error) {
        console.error("Error en la petición GET:", error.message);
    }
})();
const Actualizar = document.querySelector("#Actualizar");

// 1. Asegúrate de usar "click" en minúscula
// 1. Asegúrate de usar "click" en minúscula
Actualizar.addEventListener("click", async (e) => {
    e.preventDefault(); 

    try {
        // 2. Recolección de datos incluyendo Policarbonato
       const payload = {
    // --- Visión Sencilla ---
    Vision_sencilla: parseFloat(document.getElementById('Vision_sencilla').value) || 0,
    Vision_sencilla_Tratamiento: parseFloat(document.getElementById('Vision_sencilla_Tratamiento').value) || 0,
    Vision_sencilla_Tratamiento_Foto: parseFloat(document.getElementById('Vision_sencilla_Tratamiento_Foto').value) || 0,
    Vision_sencilla_Poli: parseFloat(document.getElementById('Vision_sencilla_Poli').value) || 0,
    
    // Visión Tallada
    Vision_Tallado: parseFloat(document.getElementById('Vision_Tallado').value) || 0,
    Vision_Tallado_Tratamiento: parseFloat(document.getElementById('Vision_Tallado_Tratamiento').value) || 0,
    Vision_Tallado_Tratamiento_Foto: parseFloat(document.getElementById('Vision_Tallado_Tratamiento_Foto').value) || 0,
    Vision_Tallado_Poli: parseFloat(document.getElementById('Vision_Tallado_Poli').value) || 0,

    // Visión Fórmula Alta (Sincronizado con Backend)
    Vision_Formula_Alta: parseFloat(document.getElementById('Visión_Formula_Alta').value) || 0,
    Vision_Formula_Alta_AR: parseFloat(document.getElementById('Visión_Formula_Alta_AR').value) || 0,
    Vision_Formula_Alta_Foto: parseFloat(document.getElementById('Visión_Formula_Alta_Foto').value) || 0,
    Vision_Formula_Alta_Poli: parseFloat(document.getElementById('Visión_Formula_Alta_Poli').value) || 0,
    Vision_Alta_Tratamiento_Foto: parseFloat(document.getElementById('Visión_Formula_Alta_Foto').value) || 0, // Campo duplicado según tu backend

    // --- Bifocales ---
    Bifocales: parseFloat(document.getElementById('Bifocales').value) || 0,
    Bifocales_Tratamiento: parseFloat(document.getElementById('Bifocales_Tratamiento').value) || 0,
    Bifocales_Tratamiento_Foto: parseFloat(document.getElementById('Bifocales_Tratamiento_Foto').value) || 0,
    Bifocales_Poli: parseFloat(document.getElementById('Bifocales_Poli').value) || 0,

    // Bifocales Tallados
    Bifocales_Tallados: parseFloat(document.getElementById('Bifocales_Tallados').value) || 0,
    Bifocales_Tallados_Tratamiento: parseFloat(document.getElementById('Bifocales_Tallados_Tratamiento').value) || 0,
    Bifocales_Tallados_Tratamiento_Foto: parseFloat(document.getElementById('Bifocales_Tallados_Tratamiento_Foto').value) || 0,
    Bifocales_Tallados_Poli: parseFloat(document.getElementById('Bifocales_Tallados_Poli').value) || 0,

    // Bifocales Alta (Cambiado de 'Bifocales_Formula_Alta' a 'Bifocales_Alta')
    Bifocales_Alta: parseFloat(document.getElementById('Bifocales_Formula_Alta').value) || 0,
    Bifocales_Alta_AR: parseFloat(document.getElementById('Bifocales_Formula_Alta_AR').value) || 0,
    Bifocales_Alta_Foto: parseFloat(document.getElementById('Bifocales_Formula_Alta_Foto').value) || 0,
    Bifocales_Alta_Poli: parseFloat(document.getElementById('Bifocales_Formula_Alta_Poli').value) || 0,

    // --- Multifocales ---
    Multifocales: parseFloat(document.getElementById('Multifocales').value) || 0,
    Multifocales_Tratamiento: parseFloat(document.getElementById('Multifocales_Tratamiento').value) || 0,
    Multifocales_Tratamiento_Foto: parseFloat(document.getElementById('Multifocales_Tratamiento_Foto').value) || 0,
    Multifocales_Poli: parseFloat(document.getElementById('Multifocales_Poli').value) || 0,

    // Multifocal Tallado
    Multifocales_Tallados: parseFloat(document.getElementById('Multifocales_Tallados').value) || 0,
    Multifocales_Tallados_Tratamiento: parseFloat(document.getElementById('Multifocales_Tallados_Tratamiento').value) || 0,
    Multifocales_Tallados_Tratamiento_Foto: parseFloat(document.getElementById('Multifocales_Tallados_Tratamiento_Foto').value) || 0,
    Multifocales_Tallados_Poli: parseFloat(document.getElementById('Multifocales_Tallados_Poli').value) || 0,

    // Multifocal Alta (Cambiado de 'Multifocal_Formula_Alta' a 'Multifocales_Alta')
    Multifocales_Alta: parseFloat(document.getElementById('Multifocal_Formula_Alta').value) || 0,
    Multifocales_Alta_AR: parseFloat(document.getElementById('Multifocal_Formula_AR').value) || 0,
    Multifocales_Alta_Foto: parseFloat(document.getElementById('Multifocal_Formula_Alta_Foto').value) || 0,
    Multifocales_Alta_Poli: parseFloat(document.getElementById('Multifocal_Formula_Alta_Poli').value) || 0,

    checked: true
};

        console.log("Enviando datos:", payload);

        // 3. Petición Axios
        const respuesta = await axios.patch("/api/presupuesto", payload);
        
        console.log("Respuesta del servidor:", respuesta.data);
        alert("✅ Tarifas actualizadas correctamente");

    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("❌ Error al guardar los cambios. Revisa la consola.");
    }
});