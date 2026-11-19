

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone-tarifario');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name');
    const fileInfo = document.getElementById('file-info');
    const btnProcesar = document.getElementById('btn-procesar-lista');
    const btnCancelar = document.getElementById('btn-cancelar-carga');

    // 1. Click para abrir buscador de archivos
    dropZone.addEventListener('click', () => fileInput.click());

    // 2. Eventos de Arrastrar y Soltar (Drag & Drop)
    ['dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('active'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));

    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('active');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });

    // 3. Selección manual de archivo
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        if (file.type !== 'application/pdf') {
            alert("Por favor, sube solo archivos PDF.");
            return;
        }
        fileNameDisplay.textContent = `Seleccionado: ${file.name}`;
        fileInfo.classList.remove('hidden');
    }

    // 4. ENVÍO AL BACKEND CON AXIOS
    btnProcesar.addEventListener('click', async () => {
        const file = fileInput.files[0];
        const proveedor = document.getElementById('select-proveedor').value;
        const mes = document.getElementById('mes-vigencia').value;

        if (!file) return alert("Selecciona un archivo PDF primero.");

        // Feedback visual
        btnProcesar.disabled = true;
        btnProcesar.innerHTML = '<span class="spinner"></span> Procesando...';

        const formData = new FormData();
        formData.append('listaPdf', file); // El nombre 'listaPdf' debe coincidir con el backend
        formData.append('proveedor', proveedor);
        formData.append('mesVigencia', mes);

        try {
            // Llamada a tu ruta de Node.js
            const response = await axios.post('/facturacion/importar-pdf-inventario', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log("Datos extraídos:", response.data);
            alert(`¡Éxito! Se detectaron ${response.data.total_items} productos.`);
            
            // Aquí puedes llamar a una función para pintar una tabla con los resultados
            // mostrarResultadosEnTabla(response.data.productos);

        } catch (error) {
            console.error("Error al procesar:", error);
            alert(error.response?.data?.error || "Error al conectar con el servidor.");
        } finally {
            btnProcesar.disabled = false;
            btnProcesar.innerText = "Procesar Lista de Precios";
        }
    });

    
    // 5. Cancelar
    btnCancelar.addEventListener('click', () => {
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        alert("Carga cancelada.");
    });
});