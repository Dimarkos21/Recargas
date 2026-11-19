const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const config = require("./webpack.config.js"); 

console.log("🛠️  Iniciando proceso de generación (Estilo Modular)...");

// Paso extra: Limpiar dist para evitar conflictos de archivos viejos
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    // Borra archivos viejos pero mantiene la estructura
    console.log("🧹 Limpiando archivos antiguos en 'dist'...");
}

const compiler = webpack(config);

compiler.run((err, stats) => {
  if (err) {
    console.error("❌ Error de Webpack:", err);
    process.exit(1);
  }

  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.error("❌ Errores en la compilación:", info.errors);
    process.exit(1);
  }

  // Esto imprime qué archivos se crearon (útil para ver los nombres .js)
  console.log(stats.toString({
    chunks: false, 
    colors: true,
    modules: false
  }));

  console.log("✅ Archivos en 'dist' actualizados con éxito.");
  process.exit(0); 
});