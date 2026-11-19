let chartMetodosPagoBarra = null;
let chartMetodosPagoLinea = null;

function renderizarGraficosPago(datos) {
    if (typeof Chart === 'undefined') return;
    console.log(datos);

    // --- Aseguramos que los métodos de pago existan o tengan un objeto por defecto ---
    const pagos = datos.metodosPago || {
        Efectivo_Bs: datos.Efectivo_Bs || 0,
        Efectivo_Dolares: datos.Efectivo_Dolares || 0,
        PagoMovil: datos.PagoMovil || 0,
        Punto_Venta: datos.Punto_Venta || 0,
        Zelle: datos.Zelle || 0,
        Transferencia: datos.Transferencia || 0,
        Binance: datos.Binance || 0
    };

    // --- Gráfico de Barras (Métodos de Pago) ---
    const ctxD = document.getElementById('MetodosDePago');
    if (ctxD) {
        if (chartMetodosPagoBarra) chartMetodosPagoBarra.destroy();
        chartMetodosPagoBarra = new Chart(ctxD, {
            type: 'bar',
            data: {
                labels: [
                    'Efectivo Bs', 
                    'Efectivo Dólares', 
                    'Pago Móvil', 
                    'Punto de Venta', 
                    'Zelle', 
                    'Transferencia', 
                    'Binance'
                ],
                datasets: [{
                    label: 'Monto',
                    data: [
                        pagos.Efectivo_Bs || 0,
                        pagos.Efectivo_Dolares || 0,
                        pagos.PagoMovil || 0,
                        pagos.Punto_Venta || 0,
                        pagos.Zelle || 0,
                        pagos.Transferencia || 0,
                        pagos.Binance || 0
                    ],
                    backgroundColor: [
                        "#f3a807", // Efectivo Bs
                        "#10b981", // Efectivo Dólares
                        "#3b82f6", // Pago Móvil
                        "#8b5cf6", // Punto de Venta
                        "#ec4899", // Zelle
                        "#64748b", // Transferencia
                        "#eab308"  // Binance
                    ],
                    borderRadius: 6,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    // Este plugin muestra el valor numérico exacto encima de cada barra
                    tooltip: { enabled: true }
                },
                scales: {
                    y: {
                        type: 'logarithmic', // <--- LA CLAVE: Evita que los números pequeños se aplasten ante los grandes
                        beginAtZero: false,    // Las escalas logarítmicas empiezan mejor desde un valor base mayor a 0
                        grid: {
                            color: 'rgba(0, 0, 0, 0.04)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            },
            // Plugin incorporado para dibujar el número exacto arriba de cada barra
            plugins: [{
                id: 'customCanvasLabels',
                afterDatasetsDraw: (chart) => {
                    const { ctx } = chart;
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const value = dataset.data[index];
                            if (value > 0) { // Solo dibuja si hay monto mayor a 0
                                ctx.fillStyle = '#4b5563';
                                ctx.font = 'bold 11px sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(value.toLocaleString(), bar.x, bar.y - 5);
                            }
                        });
                    });
                }
            }]
        });
    }

    // --- Gráfico de Líneas (Historial) ---
  
  
    
}
const sucursales  = document.querySelector("#SucursalContenedor");
   async function  Sucursales(){
    try {

        const response = await axios.get("/api/sucursales");

     
        const  memoria = `     <div class="sucursal-card">
                <div class="sucursal-icon">🏢</div>
                <div class="sucursal-info">
                    <h3>Sucursal Norte</h3>
                    <p class="sucursal-amount">$00</p>
                    <span class="sucursal-trend positive">+12% vs mes anterior</span>
                </div>
            </div>

            <!-- Sucursal 2 -->
            <div class="sucursal-card">
                <div class="sucursal-icon">🏢</div>
                <div class="sucursal-info">
                    <h3>Sucursal Sur</h3>
                    <p class="sucursal-amount">$0</p>
                    <span class="sucursal-trend negative">-3% vs mes anterior</span>
                </div>
            </div>

            <!-- Sucursal 3 -->
            <div class="sucursal-card">
                <div class="sucursal-icon">🏢</div>
                <div class="sucursal-info">
                    <h3>Sucursal Este</h3>
                    <p class="sucursal-amount">$0</p>
                    <span class="sucursal-trend positive">+18% vs mes anterior</span>
                </div>
            </div>

            <!-- Sucursal 4 -->
            <div class="sucursal-card">
                <div class="sucursal-icon">🏢</div>
                <div class="sucursal-info">
                    <h3>Sucursal Oeste</h3>
                    <p class="sucursal-amount">$0</p>
                    <span class="sucursal-trend positive">+5% vs mes anterior</span>
                </div>
            </div>`
        if (response){
             response.data.data.forEach(d => {
          
             sucursales.innerHTML +=`    
            <div class="sucursal-card">
                <div class="sucursal-icon">🏢</div>
                <div class="sucursal-info">
                    <h3>${d.nombre}</h3>
                    <p class="sucursal-amount" id="${d._id}">0</p>
                    <span class="sucursal-trend positive">+Proximamente</span>
                </div>
            </div>`
        });
             console.log("22"  ,response)
response.data.Estadisticas.forEach(E => {
const Total  = document.getElementById(`${E.sucursal}`);
  console.log("Esto es E" , E)
if (Total) {
    // Usamos textContent para actualizar el texto dentro del <p>
  
    Total.textContent = E.metricas.TotalFacturado || 0;
  }
});
        } else {
            sucursales.innerHTML = `<p>Sin Sucursales </p>`
        }

    }catch (error){
        console.log(error)
    }
} 
Sucursales()
/// ACTUALIZACION DE STOCK
const listaStock = document.querySelector("#lista-alertas");

(async function Stock() {
    const listaStock = document.querySelector("#lista-alertas");
    
    // Si no encuentra el ID, no hace nada para evitar errores
    if (!listaStock) return;

    try {
        // 1. Petición a la API
        const respuesta = await axios.get("/api/productos/minimo");
     
        const productos = respuesta.data; 

        console.log("Datos cargados automáticamente:", productos);

        // 3. Limpiar la lista antes de llenar
        listaStock.innerHTML = "";
        

        // 4. Llenar la lista
        productos.forEach(todo => {
            listaStock.innerHTML += `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; margin-bottom: 8px; background: #fff; border-left: 5px solid #ffa500; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <span style="font-weight: 500; color: #333;">${todo.nombre}</span>
                    <span style="background: #ffa500; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.85em;">
                        ${todo.stock.actual} unid.
                    </span>
                </li>
            `;
        });

    } catch (error) {
        console.error("Error al iniciar stock:", error);
    }
})(); // <-- Esos paréntesis finales hacen que se inicie sola

// ARCHIVO: Publico/js/dashboard.js (o el que uses)

// 1. Configurar el interceptor APENAS carga el script

// 2. Tu función normal (ahora está protegida)

const cargarDashboard = async () => {
    const res = await axios.get('/api/stats/mensual?mes=1&anio=2026');
   
    // Si da 403, el código de arriba se activa y te saca de aquí
    console.log(res.data);
 
};


// --- 1. CONFIGURACIÓN DE SOCKET.IO ---
// Se conecta automáticamente al servidor configurado en index.js
const socket = io(); 

// Verificación de conexión en consola para depuración
socket.on('connect', () => {
    console.log("✅ Sistema de tiempo real conectado. ID:", socket.id);
});

// ESCUCHADOR DE EVENTOS: Actualiza la pantalla cuando el servidor emite un cambio
socket.on('actualizarDashboard', (nuevasStats) => {
    console.log("🚀 ¡Actualización recibida en tiempo real!");
    actualizarInterfaz(nuevasStats);
console.log(nuevasStats)
        // Graficos de lso pagos 
if (nuevasStats.metodosPago){
            renderizarGraficosPago(nuevasStats );

}
        // 2. Extraer el array (Axios siempre usa .data)
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
let chartVentas, chartDoughnut;

/**
 * Función central para actualizar el DOM con nuevos datos
 */
function actualizarInterfaz(stats,Deuda) {
    if (!stats) return;

    const resumen = stats.resumenFinanciero || { ingresos: 0, egresos: 0, ganancia: 0 };
    const metricas = stats.metricas || { productosVendidos: 0, cuotasPendientes: 0, totalFacturado: 0 };
const totalcobrado = stats.metricas.totalCobrado;
    // 1. Actualizar Tarjetas de Estadísticas (Original)
    const elementos = {
        "#total-facturado": `$${(metricas.totalFacturado || 0).toLocaleString()}`,
        "#total-cobrado": `$${(totalcobrado || 0).toLocaleString()}`,
        "#total-pendiente": `$${(Deuda || 0).toLocaleString()}`,
        "#total-productos": metricas.productosVendidos || 0,
        "#Cristale-precio" : metricas.CristalesTotalPrecio || 0
    }; 
    const containerBS = document.querySelector("#containerBS");
    containerBS.innerHTML = `${stats.metricas.BOLIVAR || 0 } bs`
    for (const [id, valor] of Object.entries(elementos)) {
        const el = document.querySelector(id);
        if (el) el.innerText = valor;
    }

    // --- NUEVO: RENDERIZAR RANKING DE VENDEDORES ---
    const rankingBody = document.querySelector("#ranking-body");
    if (rankingBody && stats.rankingVendedores) {
        rankingBody.innerHTML = "";
        // Convertimos el objeto en array y ordenamos por monto
        const vendedoresSorted = Object.entries(stats.rankingVendedores)
            .sort((a, b) => b[1].montoGenerado - a[1].montoGenerado);


        vendedoresSorted.forEach((nombre, data, index) => {
        console.log(nombre)
            const nombreVendedor = nombre[0] || 'Sin Nombre';
            const row = `
                <tr class="rank-${  1}">
                    <td><span class="medal">${ 1}</span></td>
                    <td class="vendedor-info">
                        <div class="avatar"></div>
                        <span>${ nombreVendedor}</span>
                    </td>
                    <td>${nombre[1].cantidadVentas
}</td>
                    <td class="monto">$${parseFloat(nombre[1].montoGenerado).toFixed(2)}</td>
                    <td><div class="progress-bar"><div class="progress" style="width: ${Math.min((data.montoGenerado / metricas.totalFacturado) * 100, 100)}%"></div></div></td>
                </tr>`;
            rankingBody.innerHTML += row;
        });
    }

    // --- NUEVO: RENDERIZAR PRODUCTOS MÁS VENDIDOS ---
    const productosBody = document.querySelector("#ranking-productos-body");
    if (productosBody && stats.rankingProductos) {
        productosBody.innerHTML = "";
        const productosSorted = Object.values(stats.rankingProductos)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5); // Solo los 5 mejores

        productosSorted.forEach(prod => {
            productosBody.innerHTML += `
                <tr style="border-bottom: 1px solid #f8fafc;">
                    <td style="padding: 8px 0;">${prod.nombre}</td>
                    <td>${prod.cantidad}</td>
                    <td>$${prod.ingresos.toLocaleString()}</td>
                </tr>`;
        });
    }

    // --- NUEVO: RENDERIZAR CATEGORÍAS (ÓPTICA) ---
    const categoriasCont = document.querySelector("#categorias-container");
    if (categoriasCont && stats.ventasPorCategoria) {
        categoriasCont.innerHTML = "";
        Object.entries(stats.ventasPorCategoria).forEach(([cat, data]) => {
            categoriasCont.innerHTML += `
                <div style="background: #f8fafc; padding: 10px; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-weight: bold; font-size: 0.8rem;">${cat}</span>
                        <span style="color: #64748b; font-size: 0.8rem;">$${data.ingresos.toLocaleString()}</span>
                    </div>
                    <div class="progress-bar" style="height: 6px;"><div class="progress" style="width: ${(data.ingresos / metricas.totalFacturado) * 100}%"></div></div>
                </div>`;
        });
    }

    // Actualizar Gráficos (Original)
    renderizarGraficos({
        ingresos: resumen.ingresos,
        egresos: resumen.egresos,
        ganancia: resumen.ganancia,
        historial: stats.historial || [],
        Gastos : metricas || 0,
    });
}

/**
 * Carga inicial y activación del túnel (Sala de Socket)
 */
const cargarDashboardSimplificado = async (mes = null, anio = null) => {
    try {
        const m = mes || (new Date().getMonth() + 1);
        const a = anio || new Date().getFullYear();

        const respuesta = await axios.get(`/api/stats/mensual?mes=${m}&anio=${a}`);
         const deudaTotal = await axios.get("/api/DeudasTotales/DeudasTotales");
         let montoPendiente = 0;
         if (deudaTotal )
{   montoPendiente = deudaTotal?.data?.montoTotalPendiente || 0;}
        const data = respuesta.data || {};

        // PASO CLAVE: Decirle al socket a qué negocio pertenecemos para recibir sus avisos
        if (data.negocio) {
            console.log("🏠 Uniéndose a la sala del negocio:", data.negocio);
            socket.emit('unirseNegocio', data.negocio);
        }
           renderizarGraficosPago(data ,montoPendiente)
           

        actualizarInterfaz(data ,montoPendiente);
    } catch (error) {
        console.error('❌ Error cargando Dashboard:', error.message);
    }
};

/**
 * Renderizado de Chart.js con actualización dinámica
 */
function renderizarGraficos(datos) {
    if (typeof Chart === 'undefined') return;
console.log(datos)
    // --- Gráfico de Dona ---
    const ctxD = document.getElementById('chartProductos');
    if (ctxD) {
        if (chartDoughnut) chartDoughnut.destroy();
        chartDoughnut = new Chart(ctxD, {
            type: 'doughnut',
            data: {
                labels: ['Inversion', 'Ganancia', "Gastos"],
                datasets: [{
                    data: [datos.egresos, datos.ganancia, datos.Gastos.GastoDolar || 0],
                    backgroundColor: ["#f3a807", '#10b981' ,'#b91010'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '75%',
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            },
            plugins: [{
                id: 'centerText',
                afterDraw: (chart) => {
                    const { ctx, width, height } = chart;
                    ctx.save();
                    ctx.font = "bold 1.5em sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(`$${datos.ingresos.toLocaleString()}`, width / 2, height / 2 - 5);
                    ctx.font = "0.8em sans-serif";
                    ctx.fillText("Ingreso Total", width / 2, height / 2 + 20);
                    ctx.restore();
                }
            }]
        });
    }

    // --- Gráfico de Líneas ---
    const ctxL = document.getElementById('chartFacturacion');
    if (ctxL) {
        if (chartVentas) chartVentas.destroy();
        const historial = datos.historial || [];
        chartVentas = new Chart(ctxL, {
            type: 'line',
            data: {
                labels: historial.length ? historial.map(h => new Date(h.fecha).toLocaleDateString()) : ['Sin datos'],
                datasets: [{
                    label: 'Movimientos ($)',
                    data: historial.length ? historial.map(h => h.monto || h.ingresos || 0) : [0],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { maintainAspectRatio: false }
        });
    }
}

// --- NAVEGACIÓN Y FILTROS ---
const inputFecha = document.querySelector("#filtro-fecha");
if (inputFecha) {
    inputFecha.addEventListener("change", (e) => {
        const [anio, mes] = e.target.value.split("-");
        if (anio && mes) cargarDashboardSimplificado(mes, anio);
    });
}

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
};

// Inicio al cargar el DOM
document.addEventListener('DOMContentLoaded', cargarDashboardSimplificado);
// Ejemplo de datos (esto vendría de tu backend/socket)
const productosStockBajo = [
    { nombre: "OptiGest", cantidad: 2 },
 
 
];

function actualizarStockBajo(productos) {
    const lista = document.getElementById('lista-alertas');
    
    // Limpiamos la lista antes de agregar (evita duplicados al refrescar)
    lista.innerHTML = '';

    if (productos.length === 0) {
        lista.innerHTML = '<li style="color: gray; padding: 10px;">✅ Todo el stock está al día.</li>';
        return;
    }

    productos.forEach(prod => {
        const li = document.createElement('li');
        
        // Estilo dinámico: Rojo si es 0, Naranja si es bajo
        const colorAlerta = prod.cantidad === 0 ? '#ff4d4d' : '#ffa500';
        
        li.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            margin-bottom: 8px;
            background: #fdfdfd;
            border-left: 5px solid ${colorAlerta};
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        `;

        li.innerHTML = `
            <span style="font-weight: 500; color: #333;">${prod.nombre}</span>
            <span style="background: ${colorAlerta}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.85em;">
                ${prod.cantidad} unid.
            </span>
        `;
        
        lista.appendChild(li);
    });
}

// Llamamos a la función
actualizarStockBajo(productosStockBajo);
// Stock del Producto
const ContainerStock = document.querySelector("#container-stock");


