const app = require('./app');
const http = require('http');
const { Server } = require('socket.io'); 

const server = http.createServer(app);

// 1. Configuración robusta de Socket.io
const io = new Server(server, {
    cors: { 
        origin: "*", // En producción, cámbialo por tu dominio real
        methods: ["GET", "POST", "PATCH"]
    },
    // Ayuda a mantener la conexión activa en redes inestables
    pingTimeout: 60000,
});

// 2. Hacer disponible 'io' para el Middleware
app.set('socketio', io);

// 3. Gestión de eventos en tiempo real
io.on('connection', (socket) => {
    console.log('✅ Dispositivo conectado:', socket.id);

    // Los clientes (Dashboard) DEBEN emitir este evento al cargar
    socket.on('unirseNegocio', (negocioId) => {
        if (negocioId) {
            const room = negocioId.toString();
            socket.join(room);
            console.log(`🏠 Cliente ${socket.id} entró a la sala del negocio: ${room}`);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Dispositivo desconectado:', socket.id, "Razón:", reason);
    });
});

// Rutas de WhatsApp (Asegúrate de que 'client' esté importado/definido)
app.post('/api/mensaje', (req, res) => {
    const { to, message } = req.body;
    if (typeof client !== 'undefined') {
        client.sendMessage(to, message)
            .then(() => res.status(200).send('Mensaje enviado.'))
            .catch(err => res.status(500).send(`Error: ${err}`));
    } else {
        res.status(500).send("Cliente de WhatsApp no inicializado");
    }
});

// 4. IMPORTANTE: El servidor HTTP (server) es el que escucha, NO 'app'
const PORT = 3006;
server.listen(PORT, () => {
    console.log(`🚀 Servidor operativo en http://localhost:${PORT}`);
    console.log(`📡 Socket.io listo para actualizaciones en tiempo real`);
});
