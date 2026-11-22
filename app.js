require('dotenv').config();

const findOrCreate = require('mongoose-findorcreate');
const User = require('./models/user');

const { log } = require('console');
const express = require('express');
const app = express();

// Obligatorio en Render para que Express reconozca HTTPS detrás del proxy
app.set('trust proxy', 1);

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==========================================
// CONFIGURACIÓN PASSPORT GOOGLE OAUTH 2.0
// ==========================================
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

// ==========================================
// 1. CONFIGURACIÓN DE SESIONES (Obligatorio antes de Passport)
// ==========================================
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// ==========================================
// 2. INICIALIZACIÓN DE PASSPORT
// ==========================================
app.use(passport.initialize());
app.use(passport.session());

const GOOGLE_CALLBACK_URL = process.env.NODE_ENV === 'production'
    ? '/auth/google/callback'
    : '/auth/google/callback';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    proxy: true
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      const emailUser = profile.emails && profile.emails[0] ? profile.emails[0].value : '';

      let user = await User.findOne({
        $or: [
          { googleId: profile.id },
          { email: emailUser }
        ]
      });

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: emailUser,
          verified: true
        });
      } else if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }

      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

// ==========================================
// 3. RUTAS DE GOOGLE OAUTH (Solo paths relativos en Express)
// ==========================================
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      const user = req.user;

      const userForToken = {
        id: user._id,
        rol: user.rol || 'usuario'
      };

      const token = jwt.sign(userForToken, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '2d',
      });

      res.cookie('accessToken', token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      });

      res.redirect('/');
    }
);

const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');

// Controladores
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');
const todosRouter = require('./controllers/todos');
const { userExtractor } = require('./middleware/auth');
const productosJuegosRouter = require('./controllers/Productos_Juegos_item');
const configuracionRouter = require('./controllers/configuracion');
const registerRouter = require('./controllers/registro');
const facturacionRouter = require('./controllers/facturacion');
const logoutRouter1 = require('./controllers/logout');
const HistorialRouter = require('./controllers/historial');
const statsRouter = require('./controllers/estadisticas');
const statsMiddleware = require('./middleware/statsMiddleware');
const PresupuestoRouter = require('./controllers/presupuesto');

const ProductoAgregarRouter = require('./controllers/productosAgregar');
const NegocioRouter = require('./controllers/negocio');
const { auditMiddleware } = require('./middleware/setAuditContext');
const authMaster = require('./middleware/authMaster');
const ProveedorRouter = require('./controllers/Proveedor');
const { checkSubscription } = require('./middleware/Mensualida');

const NegociosControlRouter = require('./AdminControllers/Negocios');

const pedidosRouter = require('./controllers/Pedidos');
const clientesRouter = require('./controllers/clientes');
const SucusalesRouter = require('./controllers/sucursales');

const GamesRouter = require('./controllers/Games');
const DeudasTotalesRouter = require('./controllers/DeudasTotales');

const { syncCatalogWithShop2TopUp } = require('./services/syncService');
const cron = require('node-cron');

// ==========================================
// PROGRAMAR TAREA DIARIA (CRON JOB)
// ==========================================
cron.schedule('0 0 * * *', () => {
  syncCatalogWithShop2TopUp();
});

// Conexión a Base de Datos con tolerancia a micro-cortes
(async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI_TEST, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
            maxPoolSize: 10
        });
        console.log('✅ Conectado a MongoDB correctamente');
    } catch (error) {
        console.log('❌ Error en conexión:', error);
    }
})();

// Middlewares generales
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan('tiny'));

// --- SEGURIDAD HELMET (Configuración PWA 2026) ---
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "default-src": ["'self'", "https://*.google.com", "https://*.googlesyndication.com"],
      "script-src": [
        "'self'",
        "https://pagead2.googlesyndication.com",
        "https://googleads.g.doubleclick.net",
        "https://*.adtrafficquality.google",
        "https://static.cloudflareinsights.com",
        "https://optigest.com.ve",
        "https://www.paypal.com",
        "https://*.paypal.com",
        "https://cdn.lordicon.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "https://accounts.google.com",
        "https://www.gstatic.com",
        "https://translate.google.com",
        "https://translate.googleapis.com",
        "'unsafe-inline'",
        "'unsafe-eval'"
      ],
      "connect-src": [
        "'self'",
        "https://th.bing.com",
        "https://*.r2.cloudflarestorage.com",
        "https://cdnjs.cloudflare.com",
        "https://www.paypal.com",
        "https://*.paypal.com",
        "https://cdn.lordicon.com",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://cdn-icons-png.flaticon.com",
        "https://*.giphy.com",
        "https://www.trazodecoracion.com",
        "https://ve.dolarapi.com",
        "https://accounts.google.com",
        "https://www.gstatic.com",
        "https://translate.google.com",
        "https://translate.googleapis.com",
        "https://*.adtrafficquality.google",
        "https://pagead2.googlesyndication.com",
        "data:"
      ],
      "frame-src": [
        "'self'",
        "https://www.paypal.com",
        "https://*.paypal.com",
        "https://accounts.google.com",
        "https://www.gstatic.com",
        "https://translate.google.com",
        "https://*.doubleclick.net",
        "https://googleads.g.doubleclick.net",
        "https://*.adtrafficquality.google",
        "https://www.google.com"
      ],
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "https://static1-es.millenium.gg/articles/7/27/62/7/@/127390-genshinpic004-1620x800-article_cover_bd-1.jpg",
        "https://i.playground.ru/e/ZiVMN8BdZQfIY_mU6dZwNg.jpeg",
        "https://www.uptoplay.net/imagescropped/oxidesurvivalislandicon128.jpgplus.webp",
        "https://ares.shiftdelete.net/2022/09/discord-tema-degistirme-nasil-yapilir.jpg",
        "https://tse3.mm.bing.net/th/id/OIP.FqU_sDagEInUGJ86Ccv-XQHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        "bigctg_arena_breakout_infinite.webp",
        "https://tse3.mm.bing.net/th/id/OIP.kqkQ8HIIe29nRaieym5SuwHaEi?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        "https://tse3.mm.bing.net/th/id/OIP.YLPU7sfaOn0ZihtMk4wWLgHaED?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        "https://coremission.net/wp-content/uploads/2021/02/battleroyale17.jpg",
        "https://as1.ftcdn.net/v2/jpg/06/27/17/78/1000_F_627177845_t4i7TgJzx31LTvvfFebuKDtA7pCZaVmF.jpg",
        "https://iwant.games/wp-content/uploads/arena-breakout-infinite-thumb-468x702.jpg",
        "https://tse4.mm.bing.net/th/id/OIP.9GZBF1M2cvWqodq0cDBsGAHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        "https://wallpapercave.com/wp/wp13111973.jpg",
        "https://www.meditips.com",
        "https://static.vecteezy.com/system/resources/thumbnails/000/366/695/small_2x/r2er_fs2b_150709.jpg",
        "https://images.unsplash.com",
        "https://*.lafam.com.co",
        "https://pagead2.googlesyndication.com",
        "https://*.adtrafficquality.google",
        "https://img.freepik.com",
        "https://*.r2.cloudflarestorage.com",
        "https://www.paypalobjects.com",
        "https://*.giphy.com",
        "https://cdn.lordicon.com",
        "https://www.bing.com",
        "https://th.bing.com",
        "https://www.trazodecoracion.com",
        "https://cdn-icons-png.flaticon.com",
        "https://www.gstatic.com"
      ],
      "worker-src": [
        "'self'",
        "blob:",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com"
      ],
      "manifest-src": ["'self'"],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://www.gstatic.com"
      ],
      "font-src": [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      "object-src": ["'none'"],
      "upgrade-insecure-requests": []
    }
  })
);

app.get('/panel-maestro', authMaster, (req, res) => {
    res.sendFile(path.join(__dirname, 'SuperUsuario', 'index.html'));
});

app.use('/SuperUsuario', authMaster, express.static(path.join(__dirname, 'SuperUsuario')));

// --- RUTAS CRÍTICAS PWA ---
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Publico', 'manifest.json'));
});

app.get('/axiosStatus.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.sendFile(path.resolve(__dirname, 'Publico', 'axiosStatus.js'));
});

app.get('/sw.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.sendFile(path.resolve(__dirname, 'Publico', 'sw.js'));
});

app.get('/.well-known/assetlinks.json', (req, res) => {
    res.status(200).json([{
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": "com.inventary.optica",
            "sha256_cert_fingerprints": ["BC:36:7B:C6:63:09:82:26:AA:AE:B1:4E:A2:4E:F2:3D:A0:A8:CA:46:4C:2C:E3:CC:33:13:85:9D:DF:9D:E3:D1"]
        }
    }]);
});

// --- SERVIR ARCHIVOS OFUSCADOS ---
app.use('/dist', express.static(path.resolve(__dirname, 'dist')));

// --- RUTAS FRONTEND ---
app.get('/ads.txt', (req, res) => {
    res.send('google.com, pub-9489161591508749, DIRECT, f08c47fec0942fa0');
});

app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    res.sendFile(path.resolve(__dirname, 'Publico', 'sitemap.xml'));
});

app.use('/', express.static(path.resolve('Publico', 'Home')));
app.use('/CContrasena', express.static(path.join(__dirname, 'Publico', 'CContrasena')));

app.use(['/login', '/login/', '/Login', '/Login/'], express.static(path.resolve('Publico', 'Login')));
app.use('/Recuperacion', express.static(path.resolve('Publico', 'recuperacion')));
app.use('/Registro', express.static(path.resolve('Publico', 'Registro')));
app.use('/Casa', express.static(path.resolve('Publico', 'Casa')));
app.use('/Crema-Piel', express.static(path.resolve('Publico', 'Articulo(Crema Piel)')));
app.use('/salud-visual', express.static(path.resolve('Publico', 'Salud')));
app.use('/Finanzas', express.static(path.resolve('Publico', 'Articulo(Financiero)')));
app.use('/Tipo-Cristales', express.static(path.resolve('Publico', 'Articulo(Tipo de cristales)')));
app.use('/Inventario', express.static(path.resolve('Publico', 'Inventario')));
app.use('/Presupuesto', express.static(path.resolve('Publico', 'Presupuesto')));
app.use('/perfil', express.static(path.resolve('Publico', 'Perfil')));

app.use('/juego/:name', express.static(path.resolve('Publico', 'Juego')));
app.use('/Proveedores', express.static(path.resolve('Publico', 'Proveedores')));
app.use('/Configuracion', express.static(path.resolve('Publico', 'Configuracion')));
app.use('/Ordenes', express.static(path.resolve('Publico', 'Ordenes')));
app.use('/Administrador', express.static(path.resolve('Publico', 'Administrador')));
app.use('/Pedidos', express.static(path.resolve('Publico', 'Pedidos')));
app.use('/Control/Gastos', express.static(path.resolve('Publico', 'Control-Gastos')));
app.use('/Historial', express.static(path.resolve('Publico', 'Historial')));
app.use('/img', express.static(path.resolve('Publico', 'img')));
app.use('/Clientes', express.static(path.resolve('Publico', 'Clientes')));

app.get('/reset-password/:id/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'Publico', 'CContrasena', 'index.html'));
});

// --- RUTAS API BACKEND (ABIERTAS) ---
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);
app.use('/api/logout', logoutRouter1);
app.use('/api/registro', registerRouter);
app.use('/api/Game', GamesRouter);

// --- RUTAS API BACKEND (PROTEGIDAS) ---
app.use('/api/presupuesto', userExtractor, checkSubscription, PresupuestoRouter);
app.use('/api/DeudasTotales', userExtractor, checkSubscription, DeudasTotalesRouter);
app.use('/api/todos', userExtractor, checkSubscription, auditMiddleware('Pacientes'), todosRouter);
app.use('/api/productosJuegosRouter', productosJuegosRouter);
app.use('/api/historial', userExtractor, checkSubscription, HistorialRouter);
app.use('/api/clientes', userExtractor, checkSubscription, clientesRouter);
app.use('/api/productosAgregar', userExtractor, checkSubscription, auditMiddleware('PRouter'), ProductoAgregarRouter);
app.use('/api/proveedor', userExtractor, checkSubscription, ProveedorRouter);
app.use('/api/sucursales', userExtractor, checkSubscription, SucusalesRouter);
app.use('/api/configuracion', userExtractor, checkSubscription, configuracionRouter);
app.use('/api/pedidos', userExtractor, pedidosRouter);

// Rutas API BACKEND ADMIN
app.use('/api/negociosControl', userExtractor, NegociosControlRouter);

module.exports = app;