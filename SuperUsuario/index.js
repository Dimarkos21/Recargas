
const Input = document.querySelector("#miInput");

const miBoton= document.querySelector("#miBoton");
miBoton.addEventListener("click", async (e) => {
    
     const Contabilidad = await axios.get("/api/negociosControl/Contabilidad",Input.value);
   console.log(Contabilidad)
});
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('business-grid');
    const totalNeg = document.getElementById('total-negocios');
    const totalDeu = document.getElementById('total-deudores');

    try {
        // Llamada a tu API (Axios usará el interceptor inyectado en el HTML)
        // const response = await axios.get('/api/tus-negocios');
        // const negocios = response.data;

        // Simulación para visualización:
     
     const response = await axios.get("/api/negociosControl");
     
     const hoy =  new Date();
console.log(    response.data.respuesta);
const DATOS =  response.data.respuesta;
        grid.innerHTML = ''; // Limpiamos el loader
     DATOS.forEach(biz => {
        console.log('esto ayuda', biz);

            const card = document.createElement('div');
            card.className = 'business-card';
            let Locura = 0;
          const RespueestaBooleanaMamagueva = biz?.planes?.vence ?  new Date(biz.planes.vence) : false;
    let diffTime =  undefined ; 
            if (RespueestaBooleanaMamagueva){
                   const      expirationDate = new Date(biz.planes.vence);
const currentDate = new Date();

// Diferencia en milisegundos
diffTime = expirationDate - currentDate;
if (new Date(biz.planes.vence
) <  hoy)
        { Locura = "Debe";}
else {
     Locura = 'Al dia';
} 
        } else {
            Locura = "Nuevo"
        }



// Convertir milisegundos a días (1000 ms * 60 s * 60 m * 24 h)
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            card.innerHTML = `<div id="${biz._id}">
                <h3>${biz.nombre}</h3>
                <p>Status: <span style="color:#ff4d4d"> ${Locura}</span></p>
                 <p>Tiempo restante: <span style="color:#ff4d4d"> ${diffDays || "Nuevo : 0" }</span></p>
                <button class="btn-detalle">Gestionar</button>

           </div> 
           
           `;
            grid.appendChild(card);
        });

    } catch (error) {
        grid.innerHTML = `<p class="error-msg">Error al conectar con el servidor maestro.</p>`;
        console.error("Error crítico:", error);
    }
});

document.addEventListener("click", async (e) => {
    // 1. Detectamos el clic en el botón de gestionar
    if (e.target.closest(".btn-detalle")) {
        const btn = e.target.closest(".btn-detalle");
        const cardOriginal = btn.parentElement; // La tarjeta del negocio

        // 2. Extraemos los datos del negocio (asumiendo que los guardaste en data-attributes)
        const idNegocio = btn.dataset.id;
        const nombreNegocio = btn.dataset.nombre;

        // 3. Transformamos la tarjeta en un formulario de edición
        // Usamos una clase para identificar que está en modo "edición"
        cardOriginal.innerHTML = `
            <h3>Gestionar: ${nombreNegocio}</h3>
            <div class="form-gestion">
                <input type="text" id="plan-${idNegocio}" placeholder="Plan Asignado">
                <input type="text" id="trans-${idNegocio}" placeholder="ID Transacción">
                <input type="date" id="vence-${idNegocio}">
                <input type="number" id="monto-${idNegocio}" placeholder="Monto Cobrado">
                
                <button class="btn-guardar" data-id="${idNegocio}">Guardar Cambios</button>
                <button class="btn-cancelar">Cancelar</button>
            </div>
        `;
    }

    // 4. Lógica para GUARDAR los datos (clic en el nuevo botón "btn-guardar")
    if (e.target.closest(".btn-guardar")) {
               const btn = e.target.closest(".btn-guardar");
        const ID = btn.parentElement.parentElement;
        const btnGuardar = e.target.closest(".btn-guardar");
        const id = btnGuardar.dataset.id;
console.log(ID)
        // Capturamos los valores de los inputs usando el ID único
        const cargamento = {
            id: ID.id,
            nombrePlan: document.querySelector(`#plan-${id}`).value,
            monto: document.querySelector(`#monto-${id}`).value,
            fechaPago: new Date(),
            vence: document.querySelector(`#vence-${id}`).value,
            transaccionId: document.querySelector(`#trans-${id}`).value,
          
        };

        try {
            // Corregido: axios.patch (no pacht)
            const respuesta = await axios.patch("/api/negociosControl", cargamento);
            
            alert("Negocio actualizado con éxito");
            location.reload(); // Recargamos para ver los cambios
        } catch (error) {
            console.error("Error al actualizar:", error);
            alert("No se pudo actualizar el negocio");
        }
    }
    
    // Botón cancelar para volver al estado inicial
    if (e.target.closest(".btn-cancelar")) {
        location.reload();
    }
});