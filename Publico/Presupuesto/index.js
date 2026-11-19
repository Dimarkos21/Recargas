//Notificacon




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
// FORMULARIOS

document.querySelector("#infoLogo");

const nombreApellido = document.querySelector("#nombre-pellido");
const Edad = document.querySelector("#Edad");
const Telefono = document.querySelector("#Telefono");
const Cedula = document.querySelector("#Cedula");
const Direccion = document.querySelector("#Direccion");
const Resultados = document.querySelector("#Resultados");
const Montura = document.querySelector("#Montura");
const Cristales = document.querySelector("#Cristales");
const Costo  = document.querySelector("#Costo");
const form  = document.querySelector("#form");
const Crear = document.querySelector("#Crear");
// presupuesto frontend 
const Datos = document.querySelector("#Datos");
function CrearPresupuesto(datos) {


// Creamos una estructura HTML para mostrar el presupuesto recién creado
    const diseñoPresupuesto = `
        <div class="presupuesto-card" style="border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
            <h4>Presupuesto para: ${datos.cliente}</h4>
            <p><strong>Cédula:</strong> ${datos.cedula} | <strong>Teléfono:</strong> ${datos.telefono}</p>
            <p><strong>Montura:</strong> ${datos.montura} | <strong>Cristales:</strong> ${datos.cristales}</p>
            <p><strong>Total:</strong> $${datos.precio}</p>
            <small>ID de Registro: ${datos.id || 'Generando...'}</small>
        </div>
    `;

    // Lo agregamos al inicio de la lista
    Datos.innerHTML = diseñoPresupuesto + Datos.innerHTML;



}
// CONTAINEWR 
const container = document.querySelector("#Datos");
(async ()=>{

const Aviso = document.querySelector("#Aviso");
const Formulario = document.querySelector("#Formulario"); 


try {
    const respuesta = await axios.get("/api/presupuesto");

    const esGAY = respuesta.data.data;
    
esGAY.forEach(e => { 
        crearTarjetaPresupuesto(e, container )

    });
    //crearTarjetaPresupuesto()
    const BOTON = document.querySelector("#Boton");
 
} catch (error){
console.log(error)
}
 try {


    // console.log(respuesta)
const Negocio = await axios.get("/api/negocios/Logo");
console.log(12,Negocio)
Aviso.style.display = "flex";



if (Negocio.data.respuesta === "No tiene los datos"){
    Aviso.innerHTML = `
<form  id="Logo-form">

<h1> Datos importantes </h1>
<p>Sube el Logo: </p> <input type="file" id="Logo"  accept="image/*">
<p> Datos del pago movil </p>
<input placeholder="Banco" id="Banco">
<input placeholder="Telefono" id="Telefono1">
<input placeholder="Cedula o Rif" id="Celula"> 
<p>  Direccion: </p>
<input placeholder="Direccion" id="Direccion1"  > 
<input placeholder="Celular"   id="Celular"> 

<button type="submit" form="Logo-form"> Guardar </button>
</form>
`;

const formLogo = document.querySelector("#Logo-form");
const Banco  =  document.querySelector("#Banco");
const Telefono =  document.querySelector("#Telefono1"); 
const Cedula =  document.querySelector("#Celula");
const Logo  =  document.querySelector("#Logo");
const Direccion =  document.querySelector("#Direccion1");
const Celular =  document.querySelector("#Celular");
formLogo.addEventListener("submit" , async (e) => {
    e.preventDefault();
try {
 const formData = new FormData();

        // 2. Agregamos el archivo (SÓLO si el usuario seleccionó uno)
        // OJO: Cambié "file" por "logo". Si en tu backend usas multer de otra forma
        // ej: upload.single('image') o upload.single('file'), cambia "logo" por ese nombre.
   
            formData.append("logo", Logo.files[0]); 
        

        // 3. Agregamos el resto de los campos de texto
        formData.append("Banco", Banco.value);
        formData.append("Telefono", Telefono.value);
        formData.append("Cedula", Cedula.value);
        formData.append("Direccion", Direccion.value);
        formData.append("Celular", Celular.value);

        console.log("Enviando datos mediante FormData...");

        // 4. Enviamos el formData completo



const respuesta = await axios.patch("/api/negocios/Logo",  formData);

console.log(respuesta)

Aviso.style.display ="none";
} catch(error){

    // El servidor respondió con un código fuera del rango 2xx
    if (error.response.status === 422) {
        console.log(error.response)
         mostrarNotificacion("Formato No compantible");

      // Aquí manejas la lógica específica (ej. avisar al usuario que los datos cambiaron)
    }

    console.log(error);
}
});
} else {
    const fecha1 = new Date().toLocaleDateString('es-VE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});
    const TEXT = document.querySelector("#TText");
        const DText = document.querySelector("#DText");
          const Pagomovil = document.querySelector(".payment-details");
          const fecha = document.querySelector("#fecha");
          const   Loguio =               document.querySelector("#Loguio"); 
                 const   Rif =               document.querySelector(".rif");        
          Pagomovil.innerHTML = `
          <p> Banco:  ${Negocio.data.datos.Pagomovil.Banco}</p> 
          <p> Cedula:  ${Negocio.data.datos.Pagomovil.Cedula}</p>
                    <p> Telefono:  ${Negocio.data.datos.Pagomovil.Telefono}</p>`
                   TEXT.innerHTML = `    <p> Telefono:  ${Negocio.data.datos.Info.Celular}</p>`;
                   DText.innerHTML=  `    <p> Direccion:  ${Negocio.data.datos.Info.Direccion}</p>`;
                  fecha.value=  `     ${fecha1}`;
                    Loguio.src = `${Negocio.data.datos.imagen || '../img/OptiGesty.png'}`;
                    Rif.innerHTML= `${Negocio.data.datos.Info.rif}`
                   
console.log(Negocio)
}


} catch (error){
    console.log(error)
}




})();
// 1. Definir la constante con la expresión regular
const CEDULA_RIF_REGEX = /^[VEJPG]\d{8,10}$/;
// presupuesto creacion
form.addEventListener("submit" , async (e) => {
    e.preventDefault();
try {

  if (!Telefono || !Cedula || !Cristales ){ return mostrarNotificacion("Falta el numero y cedula")};
if (!CEDULA_RIF_REGEX.test(Cedula.value)) {
      return mostrarNotificacion('Cedula  no valida . ejemplo V3186900 o J4120040');
    }
  
    const Datos = {
        cliente: nombreApellido.value,
        edad: Edad.value,
        telefono: Telefono.value,
        cedula: Cedula.value,
        direccion: Direccion.value,
        evaluacion: Resultados.value,
        montura: Montura.value,
        cristales: Cristales.value,
        precio: Costo.value
    };


const respuesta  =  await axios.post("/api/presupuesto", Datos);

 crearTarjetaPresupuesto1(respuesta.data.data, container )
form.reset()
} catch(error){
 return mostrarNotificacion("Verifica el numero o cedula!")

}
});
/// CREADOR DE IN FO DE PRESUPUESTO
async function  crearTarjetaPresupuesto(datos, contenedorId) {
    console.log(11111111111111111111111111111111,datos.beneficiario.cedula);
  // Aseguramos valores por defecto en un solo nivel para evitar errores de desestructuración anidada
  const fecha = datos.fecha || new Date().toLocaleDateString('es-VE');
  const nombres = datos.nombres || datos.beneficiario?.nombre || 'Paciente Sin Nombre';
  const edad = datos.edad || datos.paciente?.edad || '1';
  const telefono = datos.telefono || datos.paciente?.telefono || '1';
  const cedula =   datos.beneficiario.cedula  || '1';
  const direccion = datos.direccion || datos.paciente?.direccion || '1';
  
  const resultados = datos.resultados || datos.evaluacion?.resultados || '1';
  const montura = datos.montura || datos.evaluacion?.montura || '';
  const cristales = datos.cristales || datos.evaluacion?.cristales || '1';
  
  const costoDivisa = datos.costoDivisa || datos.cotizacion.totalBs || 0;
  const banco = datos.banco || datos.pago?.banco || '1';
  const cedulaPago = datos.cedulaPago || datos.pago?.cedulaPago || '1';
  const telefonoPago = datos.telefonoPago || datos.pago?.telefonoPago || '1';
  
  const direccionEmpresa = datos.direccionEmpresa || 'dIMARKOS';
  const telefonoEmpresa = datos.telefonoEmpresa || '4242059100';

  
  // Generamos el ID único para el colapsable
  const idUnico =  cedula;

  const html = `
    <div  id="${datos._id}" style="font-family: system-ui, -apple-system, sans-serif; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); max-width: 480px; margin: 15px auto; overflow: hidden; transition: all 0.3s ease;">
      
      <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <div>
          <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #1e293b; font-weight: 700; text-transform: capitalize;">${nombres.toLowerCase()}</h3>
          <p style="margin: 0; font-size: 12px; color: #64748b;">CI: ${cedula} • ${fecha}</p>
        </div>
        <div style="text-align: right;">
          <span style="display: block; font-size: 18px; font-weight: 800; color: #1d4ed8;">$${costoDivisa}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; tracking: 0.5px;">Tasa BCV</span>
        </div>
      </div>

      <div id="${idUnico}" style="display: none; padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; line-height: 1.6; background: #ffffff;">
        
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0;"><strong>Edad:</strong> ${edad} años</p>
          <p style="margin: 0 0 4px 0;"><strong>Teléfono:</strong> ${telefono}</p>
          <p style="margin: 0;"><strong>Dirección:</strong> ${direccion}</p>
        </div>
        
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-bottom: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Detalles del Lente</h4>
          <p style="margin: 0 0 4px 0;"><strong>Evaluación:</strong> ${resultados}</p>
          <p style="margin: 0 0 4px 0;"><strong>Montura:</strong> ${montura}</p>
          <p style="margin: 0;"><strong>Cristales:</strong> ${cristales}</p>
        </div>

        <div style="background: #eff6ff; padding: 10px; border-radius: 8px; font-size: 12px; color: #1e40af; border: 1px solid #bfdbfe;">
          <h4 style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; font-weight: 700;">Datos de Pago Móvil:</h4>
          <p style="margin: 0 0 2px 0;"><strong>Banco:</strong> ${banco}</p>
          <p style="margin: 0 0 2px 0;"><strong>Cédula:</strong> ${cedulaPago}</p>
          <p style="margin: 0;"><strong>Teléfono:</strong> ${telefonoPago}</p>
        </div>
        
        <div style="margin-top: 12px; text-align: right; font-size: 10px; color: #94a3b8; font-weight: 500;">
          ${direccionEmpresa} — ${telefonoEmpresa}
        </div>
      </div>

      <button 
       id='Boton'
        el.style.display='block'; this.innerText='Ver menos'; this.style.background='#f1f5f9'; }else{ el.style.display='none'; this.innerText='Ver detalles completos'; this.style.background='#ffffff'; }"
        style="width: 100%; padding: 12px; background: #ffffff; border: none; color: #2563eb; font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.2s; display: block; text-align: center; outline: none;"
        onmouseover="this.style.background='#f8fafc'" 
        onmouseout="if(document.getElementById('${idUnico}').style.display==='none') this.style.background='#ffffff'"
      >
        Ver detalles completos
      </button>

    </div>
  `;

  const contenedor = contenedorId;
  if (contenedor) {
    contenedor.innerHTML += html;
  } else {
    console.warn(`No se encontró el contenedor con ID: ${contenedorId}`);
  }


}

async function  crearTarjetaPresupuesto1(datos, contenedorId) {

  // Aseguramos valores por defecto en un solo nivel para evitar errores de desestructuración anidada
  const fecha = datos.fecha || new Date().toLocaleDateString('es-VE');
  const nombres = datos.nombres || datos.beneficiario?.nombre || 'Paciente Sin Nombre';
  const edad = datos.edad || datos.paciente?.edad || '1';
  const telefono = datos.telefono || datos.paciente?.telefono || '1';
  const cedula =   datos.beneficiario.cedula  || '1';
  const direccion = datos.direccion || datos.paciente?.direccion || '1';
  
  const resultados = datos.resultados || datos.evaluacion?.resultados || '1';
  const montura = datos.montura || datos.evaluacion?.montura || '';
  const cristales = datos.cristales || datos.evaluacion?.cristales || '1';
  
  const costoDivisa = datos.costoDivisa || datos.cotizacion.totalBs || 0;
  const banco = datos.banco || datos.pago?.banco || '1';
  const cedulaPago = datos.cedulaPago || datos.pago?.cedulaPago || '1';
  const telefonoPago = datos.telefonoPago || datos.pago?.telefonoPago || '1';
  
  const direccionEmpresa = datos.direccionEmpresa || 'dIMARKOS';
  const telefonoEmpresa = datos.telefonoEmpresa || '4242059100';

  
  // Generamos el ID único para el colapsable
  const idUnico =  cedula;

  const html = `
    <div  id="${datos._id}" style="font-family: system-ui, -apple-system, sans-serif; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); max-width: 480px; margin: 15px auto; overflow: hidden; transition: all 0.3s ease;">
      
      <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <div>
          <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #1e293b; font-weight: 700; text-transform: capitalize;">${nombres.toLowerCase()}</h3>
          <p style="margin: 0; font-size: 12px; color: #64748b;">CI: ${cedula} • ${fecha}</p>
        </div>
        <div style="text-align: right;">
          <span style="display: block; font-size: 18px; font-weight: 800; color: #1d4ed8;">$${costoDivisa}</span>
          <span style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; tracking: 0.5px;">Tasa BCV</span>
        </div>
      </div>

      <div id="${idUnico}" style="display: none; padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; line-height: 1.6; background: #ffffff;">
        
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0;"><strong>Edad:</strong> ${edad} años</p>
          <p style="margin: 0 0 4px 0;"><strong>Teléfono:</strong> ${telefono}</p>
          <p style="margin: 0;"><strong>Dirección:</strong> ${direccion}</p>
        </div>
        
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-bottom: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Detalles del Lente</h4>
          <p style="margin: 0 0 4px 0;"><strong>Evaluación:</strong> ${resultados}</p>
          <p style="margin: 0 0 4px 0;"><strong>Montura:</strong> ${montura}</p>
          <p style="margin: 0;"><strong>Cristales:</strong> ${cristales}</p>
        </div>

        <div style="background: #eff6ff; padding: 10px; border-radius: 8px; font-size: 12px; color: #1e40af; border: 1px solid #bfdbfe;">
          <h4 style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; font-weight: 700;">Datos de Pago Móvil:</h4>
          <p style="margin: 0 0 2px 0;"><strong>Banco:</strong> ${banco}</p>
          <p style="margin: 0 0 2px 0;"><strong>Cédula:</strong> ${cedulaPago}</p>
          <p style="margin: 0;"><strong>Teléfono:</strong> ${telefonoPago}</p>
        </div>
        
        <div style="margin-top: 12px; text-align: right; font-size: 10px; color: #94a3b8; font-weight: 500;">
          ${direccionEmpresa} — ${telefonoEmpresa}
        </div>
      </div>

      <button 
       id='Boton'
        el.style.display='block'; this.innerText='Ver menos'; this.style.background='#f1f5f9'; }else{ el.style.display='none'; this.innerText='Ver detalles completos'; this.style.background='#ffffff'; }"
        style="width: 100%; padding: 12px; background: #ffffff; border: none; color: #2563eb; font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.2s; display: block; text-align: center; outline: none;"
        onmouseover="this.style.background='#f8fafc'" 
        onmouseout="if(document.getElementById('${idUnico}').style.display==='none') this.style.background='#ffffff'"
      >
        Ver detalles completos
      </button>

    </div>
  `;

  const contenedor = contenedorId;
  if (contenedor) {
   // 'afterbegin' inserta el HTML al principio del contenedor
    contenedor.insertAdjacentHTML('afterbegin', html);
  
  } else {
    console.warn(`No se encontró el contenedor con ID: ${contenedorId}`);
  }


}
document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", async (e) => {
        if (e.target.closest("#Boton")) {
            const boton = e.target.closest("#Boton");
        
         // 1. Intentamos la primera opción (parentElement)
let padre = boton.parentElement;

// Verificamos: ¿Existe el padre Y tiene un ID?
if (!padre || !padre.id) {
    // Si falló, intentamos la segunda opción (closest por clase)
    padre = boton.closest('.container-mas');
}
            const  { data }   = await axios.get(`/api/presupuesto/${padre.id}`);
  console.log(1,padre)

            
            // CONSOLE.LOG SOLICITADO: Muestra la data completa de la API
            console.log("Data completa de /api/facturacion:", data);
            
            
            if (!padre.classList.contains("container-mas")) {
       
      const productoSeleccionado = data ;
                if (productoSeleccionado) {
               
                    
                    // CONSOLE.LOG SOLICITADO: Muestra el array 'productos' de la factura seleccionada
                    console.log("Productos de la factura seleccionada:", productoSeleccionado);
                    const info =  productoSeleccionado.data;
                    // 1. Generar el HTML para la lista de productos
             const DIVCONTAINER = document.querySelector("#DIVCONTAINER");
            DIVCONTAINER.innerHTML = `<div class="modal-overlay">
    <div class="modal-container">
        
        <div class="modal-header">
            <div class="modal-title-area">
                <h2>Detalle de Orden Clínico</h2>
                <p class="modal-subtitle">ID:${ info._id|| "error"}</p>
            </div>
            <div class="header-badges">
                <span class="badge-status">Presupuesto</span>
                <span class="text-date">📅 ${ info.fecha|| "error"}</span>
            </div>
        </div>

        <div class="modal-body">
            
            <div class="grid-section full-width">
                <h3>👤 Datos del Beneficiario</h3>
                <div class="beneficiary-subgrid">
                    <div class="data-row">
                        <span class="data-label">Nombre:</span>
                        <span class="data-value">${  info.beneficiario.nombre   || "error"}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Cédula:</span>
                        <span class="data-value">${  info.beneficiario.cedula   || "error"}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Edad:</span>
                        <span class="data-value">${  info.beneficiario.edad  || "error"}</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Teléfono:</span>
                        <span class="data-value">${  info.beneficiario.telefono || "error"}</span>
                    </div>
                </div>
            </div>

            <div class="grid-section">
                <h3>👓 Fórmula y Especificaciones</h3>
                <div class="data-row">
                    <span class="data-label">Montura:</span>
                    <span class="data-value">${  info.especificaciones.montura || "error"}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Cristales:</span>
                    <span class="data-value">${  info.especificaciones.cristales|| "error"}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Evaluación:</span>
                    <span class="data-value">${  info.evaluacion || "error"}</span>
                </div>
            </div>

            <div class="grid-section total-highlight">
                <h3>💵 Resumen Económico</h3>
                <div class="data-row">
                    <span class="data-label">Precio Base:</span>
                    <span class="data-value">${  info.cotizacion.precioBase|| "error"}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Tasa BCV:</span>
                    <span class="data-value">0.00 Bs</span>
                </div>
                <div class="data-row divider-top">
                    <span class="data-label main-label">Total General:</span>
                    <span class="data-value">
                    ${  info.cotizacion.precioBase|| "error"}
</span>
                </div>
            </div>

            <div class="grid-section full-width text-footer-internal">
                <span><strong>Asesor Técnico:</strong> Vendedor</span>
                <span><strong>Última Sincronización:</strong> 2026-05-11 23:06:12</span>
            </div>

        </div>

        <div class="modal-footer">
        <button id="Aprobado" data_id=" ${info._id || "error"}">Proximamente</button>
            <button id="cerrarVentana" class="btn btn-secondary">Cerrar ventana</button>
                <button  id="Imprimir" class="btn btn-primary1">Imprimir</button>
            <button  class="btn btn-primary">Procesar Orden</button>

          
        </div>

    </div>
</div>`; //Inprimir
const Imprimir = document.querySelector("#Imprimir");
Imprimir.addEventListener("click", async e =>{
 


try {
  // Intentamos obtener el logo desde tu API
  const Respuesta = await axios.get("/api/negocios/Logo");
  const logoBase64 = Respuesta.data;

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    encryption: {
      userPassword: null,
      ownerPassword: "locura123",
      userPermissions: ["print"] // Solo permite impresión, bloquea edición
    }
  });

  // --- COLORES CORPORATIVOS DE ÓPTICA TURRÓ ---
  const AZUL_OSCURO = [11, 23, 74];    // #0B174A - Azul de las ondas oscuras
  const AZUL_CLARO = [197, 221, 233];  // #C5DDE9 - Celeste de fondo de las esquinas
  const TEXTO_NEGRO = [20, 20, 20];
  const AZUL_TEXTO = [24, 76, 120];    // Color para resaltar los datos de ejemplo

  // ==========================================
  // 1. DISEÑO DE ONDAS SUPERIORES CORREGIDO
  // ==========================================
  // Fondo celeste superior izquierdo
  doc.setFillColor(AZUL_CLARO[0], AZUL_CLARO[1], AZUL_CLARO[2]);
  doc.rect(0, 0, 75, 48, "F");
  
  // Bloque azul oscuro superior
  doc.setFillColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.rect(0, 0, 210, 24, "F");
  // Caída de la onda superior (simulada con un triángulo estilizado nítido)
  doc.triangle(0, 24, 0, 48, 140, 24, "F");

  // ==========================================
  // 2. ENCABEZADO Y LOGO
  // ==========================================
  if (logoBase64.datos.Info.logo) {

  try {
      // Descargamos la imagen como un archivo binario (blob)
      const imagenResponse = await axios.get(urlLogoRemoto, { responseType: 'blob' });
      
      // Creamos una promesa para leer el archivo y transformarlo a Base64
      const base64Logo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imagenResponse.data);
      });

      // Insertamos el Base64 limpio directamente en el PDF
      doc.addImage(base64Logo, "WEBP", 10, 6, 48, 22);

    } catch (e) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(`Optica ${logoBase64.datos.nombre}`, 12, 14);
  
    }
  } else {
    // Si no viene logo de la API, pintamos el texto blanco sobre el fondo oscuro
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("Óptica", 12, 10);
    doc.text("Turró", 12, 16);
    doc.text("Visión", 12, 22);
    doc.setFontSize(8.5);
    doc.text(`Rif: ${logoBase64.datos.Info.rif}`, 12, 27);
  }

  // Campo de Fecha con ejemplo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(TEXTO_NEGRO[0], TEXTO_NEGRO[1], TEXTO_NEGRO[2]);
  doc.text("Fecha: __________________", 115, 38);
  
  // TEXTO EJEMPLO: Fecha
  doc.setFont("helvetica", "bold");
  doc.setTextColor(AZUL_TEXTO[0], AZUL_TEXTO[1], AZUL_TEXTO[2]);
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.text(data.data.fecha, 132, 37.5);

  // Título Central
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(TEXTO_NEGRO[0], TEXTO_NEGRO[1], TEXTO_NEGRO[2]);
  doc.text("PRESUPUESTO PARA LENTES", 105, 56, { align: "center" });

  // ==========================================
  // 3. DATOS DEL BENEFICIARIO
  // ==========================================
  doc.setFontSize(10);
  doc.text("Nombres y apellidos del beneficiario: _______________________________________________", 15, 72);
  doc.text("Edad: ________", 15, 80);
  doc.text("Teléfono: _______________________", 48, 80);
  doc.text("Cédula: _______________________", 112, 80);
  doc.text("Dirección: ____________________________________________________________________", 15, 88);

  // TEXTOS EJEMPLO: Datos Personales
  doc.setFont("helvetica", "normal");
  doc.setTextColor(AZUL_TEXTO[0], AZUL_TEXTO[1], AZUL_TEXTO[2]);
  doc.text(data.data.beneficiario.nombre, 82, 71.5);
  doc.text(`${data.data.beneficiario.edad
}`, 28, 79.5);
  doc.text(`${data.data.beneficiario.telefono
}`, 66, 79.5);
  doc.text(`${data.data.beneficiario.cedula
}`, 128, 79.5);
  doc.text(`${data.data.beneficiario.direccion
}`, 34, 87.5);

  // ==========================================
  // 4. EVALUACIÓN VISUAL Y ESPECIFICACIONES
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXTO_NEGRO[0], TEXTO_NEGRO[1], TEXTO_NEGRO[2]);
  doc.text("Resultados de evaluación visual del paciente: ", 15, 102);
  doc.setTextColor(AZUL_TEXTO[0], AZUL_TEXTO[1], AZUL_TEXTO[2]);

 const xMargenIzquierdo = 15; // El margen donde empiezan tus títulos ("Nombres", "Edad", etc.)
const yFila = 102;         // Tu coordenada Y inicial
const xDatoPrimerRenglon = 95; // Donde empieza el texto azul en la primera línea (mídelo visualmente)
const altoLinea = 6;         // Separación vertical entre renglones

// 1. Calculamos cuánto espacio queda disponible SOLO para el primer renglón
// Si tu hoja mide 216mm de ancho y dejas 15mm de margen derecho, el límite es 201mm.
const anchoDisponiblePrimerRenglon = 201 - xDatoPrimerRenglon; 

// 2. Sacamos la primera línea de texto que quepa en ese pedacito derecho
const primerRenglonArray = doc.splitTextToSize(`${data.data.evaluacion}`, anchoDisponiblePrimerRenglon);
const primerRenglonTexto = primerRenglonArray[0]; // Guardamos solo el primer fragmento

// 3. Imprimimos el primer renglón en su sitio (al lado del título)
doc.setTextColor(29, 78, 216); // Este es el azul rey exacto (equivalente a #1d4ed8 de Tailwind)

doc.text(primerRenglonTexto, xDatoPrimerRenglon, yFila);

// 4. Obtenemos el resto del texto sobrante para mandarlo a la izquierda
// Cortamos el string original quitando lo que ya imprimimos arriba
const textoSobrante = `${data.data.evaluacion}`.substring(primerRenglonTexto.length).trim();

let ySiguienteBloque = yFila + 10; // Variable para saber dónde terminará todo

if (textoSobrante.length > 0) {
  // El ancho para el resto del texto ya puede usar toda la hoja (desde margen izquierdo 15 hasta 201)
  const anchoMaximoResto = 201 - xMargenIzquierdo; 
  const restoLineasArray = doc.splitTextToSize(textoSobrante, anchoMaximoResto);
  
  // Imprimimos el bloque de texto sobrante pegado a la izquierda (X = 15) y una línea más abajo
  doc.text(restoLineasArray, xMargenIzquierdo, yFila + altoLinea);
  
  // Calculamos la Y final dependiendo de cuántas líneas salieron a la izquierda
  ySiguienteBloque = yFila + altoLinea + (restoLineasArray.length * altoLinea) + 4;
} else {
  // Si no hubo texto sobrante porque era cortito, el siguiente bloque va normal abajo
  ySiguienteBloque = yFila + 12;
}

// 5. Dibujamos tu siguiente campo ("Montura") usando la Y dinámica
doc.setTextColor('#000000');


  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXTO_NEGRO[0], TEXTO_NEGRO[1], TEXTO_NEGRO[2]);
  doc.text("Montura: __________________________________________", 15, 126);
  doc.text("Cristales: __________________________________________", 15, 138);

  // TEXTOS EJEMPLO: Producto
  doc.setFont("helvetica", "normal");
  doc.setTextColor(AZUL_TEXTO[0], AZUL_TEXTO[1], AZUL_TEXTO[2]);
  doc.text(`${data.data.especificaciones.montura}`, 33, 125.5);
  doc.text(`${data.data.especificaciones.cristales}`, 33, 137.5);

  // Costo e indicaciones de tasa cambaría
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXTO_NEGRO[0], TEXTO_NEGRO[1], TEXTO_NEGRO[2]);
  doc.text("Costo total expresado en divisa $: _________________", 15, 152);
  doc.text("equivalente a tasa BCV del día de su pago.", 108, 152);

  // TEXTO EJEMPLO: Precio
  doc.setTextColor(AZUL_TEXTO[0], AZUL_TEXTO[1], AZUL_TEXTO[2]);
  doc.text(`${data.data.cotizacion.precioBase}`, 76, 151.5);

  // ==========================================
  // 5. DATOS DE PAGO
  // ==========================================
  let yPago = 175;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXTO_NEGRO[0], TEXTO_NEGRO[1], TEXTO_NEGRO[2]);
  doc.text("Pago por transferencias:", 15, yPago);
  
// 1. Configuramos el color y estilo para los TÍTULOS (Negrita y Negro)
doc.setFont("helvetica", "bold");
doc.setTextColor(20, 20, 20); // TEXTO_NEGRO

// Definimos los textos de los títulos
const t1 = "Cédula/Rif: ";
const t2 = "Teléfonos: ";
const t3 = "Banco: ";

// Dibujamos los títulos en su respectiva posición
doc.text(t1, 15, yPago + 24);
doc.text(t2, 15, yPago + 30);
doc.text(t3, 15, yPago + 36);

// 2. Calculamos el ancho de cada título para saber dónde empezará el dato
const anchoT1 = doc.getTextWidth(t1);
const anchoT2 = doc.getTextWidth(t2);
const anchoT3 = doc.getTextWidth(t3);

// 3. Configuramos el estilo para los DATOS RESALTADOS (Normal y Color Azul)
doc.setFont("helvetica", "normal");
doc.setTextColor(24, 76, 120); // AZUL_TEXTO (O el color de resalte que prefieras)

// Dibujamos los datos dinámicos justo al lado de donde terminó su título (15 + el ancho)
doc.text(`${logoBase64.datos.Pagomovil.Cedula}`, 15 + anchoT1, yPago + 24);
doc.text(`${logoBase64.datos.Pagomovil.Telefono}`, 15 + anchoT2, yPago + 30);
doc.text(`${logoBase64.datos.Pagomovil.Banco}`, 15 + anchoT3, yPago + 36);

// 4. IMPORTANTE: Regresar el color a negro por si sigues escribiendo abajo
doc.setTextColor(20, 20, 20);
  // 6. DISEÑO DE ONDAS INFERIORES CORREGIDO
  // ==========================================
  // Fondo celeste inferior derecho
  doc.setFillColor(AZUL_CLARO[0], AZUL_CLARO[1], AZUL_CLARO[2]);
  doc.rect(130, 245, 80, 52, "F");

  // Bloque azul oscuro inferior base
  doc.setFillColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
  doc.rect(0, 268, 210, 29, "F");
  // Subida de la onda inferior (Triángulo invertido)
  doc.triangle(210, 268, 210, 245, 60, 268, "F");

  // Bloque de Dirección (Abajo a la derecha sobre el bloque oscuro)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255); 
  
  let xDir = 132;
  let yDir = 264;
  doc.text(`Direccion: ${logoBase64.datos.Info.Direccion}`, xDir, yDir);
console.log(data.data , 22222222222222222222222222222222222)
  doc.text(`Telefono : ${logoBase64.datos.Info.Celular}`, xDir, yDir + 18);

  // Guardar el PDF bloqueado contra edición listo para descargar
  doc.save(`${logoBase64.datos.nombre}_${data.data.beneficiario.nombre}.pdf`);

} catch (error) {
  console.error("Error al procesar el PDF de Óptica Turró: ", error);
}

} );

                    /// cerrar ventana
const  cerrarVentana = document.querySelector("#cerrarVentana");
const modal =  document.querySelector(".modal-overlay");
cerrarVentana.addEventListener("click", e =>{

  modal.style.display = 'none';
} );
                    // APLICACIÓN DEL FIX: Usamos el Encadenamiento Opcional (?.) 
                    // para asegurar que productoSeleccionado.productos exista.
               

      
                }
            }
        }
    });
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
configurarBoton(ClienteBTN , "/Clientes");
const ControlGastosBTN = document.querySelector("#controlGastos-btn");
configurarBoton( ControlGastosBTN , "/Control/Gastos");
if (botonMenu) {
    botonMenu.addEventListener("click", () => {
        document.querySelector("#menu-desplegable").classList.toggle("visible");
    });
}
// Desbloqueo actualizacion de los datos del negocio

const INFO = document.querySelector("#infoLogo");

INFO.addEventListener('click', e => {

Aviso.style.setProperty('display', 'flex', 'important');
    Aviso.innerHTML = `
    
<form  id="Logo-form">

<h1> Datos importantes <button id='CerrarVentana'> Cerrar </button></h1>
<p>Sube el Logo: </p> <input type="file" id="Logo"  accept="image/*">
<p> Datos del pago movil </p>
<input placeholder="Banco" id="Banco">
<input placeholder="Telefono" id="Telefono1">
<input placeholder="Cedula o Rif" id="Celula"> 
<p>  Direccion: </p>
<input placeholder="Direccion" id="Direccion1"  > 
<input placeholder="Celular"   id="Celular"> 

<button type="submit" form="Logo-form"> Guardar </button>
</form>
`;


const formLogo = document.querySelector("#Logo-form");
const Banco  =  document.querySelector("#Banco");
const Telefono =  document.querySelector("#Telefono1"); 
const Cedula =  document.querySelector("#Celula");
const Logo  =  document.querySelector("#Logo");
const Direccion =  document.querySelector("#Direccion1");
const Celular =  document.querySelector("#Celular");
formLogo.addEventListener("submit" , async (e) => {
    e.preventDefault();
try {
 const formData = new FormData();

        // 2. Agregamos el archivo (SÓLO si el usuario seleccionó uno)
        // OJO: Cambié "file" por "logo". Si en tu backend usas multer de otra forma
        // ej: upload.single('image') o upload.single('file'), cambia "logo" por ese nombre.
   
            formData.append("logo", Logo.files[0]); 
        

        // 3. Agregamos el resto de los campos de texto
        formData.append("Banco", Banco.value);
        formData.append("Telefono", Telefono.value);
        formData.append("Cedula", Cedula.value);
        formData.append("Direccion", Direccion.value);
        formData.append("Celular", Celular.value);

        console.log("Enviando datos mediante FormData...");

        // 4. Enviamos el formData completo


const respuesta = await axios.patch("/api/negocios/Logo",  formData);

console.log(respuesta.data.data)

Banco.value = respuesta.data.data.Pagomovil.Banco;
Telefono.value = respuesta.data.data.Pagomovil.Telefono;
Cedula.value = respuesta.data.data.Info.Cedula;
Direccion.value = respuesta.data.data.Info.Direccion;
Celular.value = respuesta.data.data.Pagomovil.Celular;
Aviso.innerHTML = '';

} catch(error){

 // ✅ CORRECCIÓN: Validamos PRIMERO si existe 'error.response'
        if (error.response) {
            console.log("Datos de error del servidor:", error.response);

            if (error.response.status === 422) {
                mostrarNotificacion("Formato No compatible");
            }
            
            else if (error.response.status === 400) {
                mostrarNotificacion("Falta la imagen.");
            }
            
            else {
                mostrarNotificacion(`Error del servidor: Código ${error.response.status}`);
            }

        } else if (error.request) {
            // La petición se hizo pero el servidor nunca respondió
            console.log("El servidor no respondió:", error.request);
            mostrarNotificacion("No se pudo conectar con el servidor. Verifica tu internet.");
        } else {
            // Algo pasó al configurar la petición que disparó un error de código
            console.log("Error de configuración de código:", error.message);
        }
}
});
const CerrarVentana = document.querySelector("#CerrarVentana");
CerrarVentana.addEventListener('click', e => {

    Aviso.innerHTML = "";
})
});

// ACA PROCESAMIENTO DE PRESUPUESTO CUANDO LLEGUE EL MOMENTO