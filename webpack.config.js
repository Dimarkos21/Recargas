const path = require("path");
const fs = require("fs");
const TerserPlugin = require("terser-webpack-plugin");
const WebpackObfuscator = require('webpack-obfuscator');
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // Nuevo

const getEntries = () => {
  const entries = {};
  const publicoPath = path.resolve(__dirname, "Publico");
  if (!fs.existsSync(publicoPath)) return entries;

  const carpetas = fs.readdirSync(publicoPath);
  carpetas.forEach((carpeta) => {
    const carpetaPath = path.join(publicoPath, carpeta);
    if (fs.lstatSync(carpetaPath).isDirectory()) {
      const jsPath = path.join(carpetaPath, "index.js");
      if (fs.existsSync(jsPath)) {
        entries[`${carpeta}/index`] = jsPath;
      }
    }
  });
  return entries;
};

module.exports = {
  mode: "production",
  entry: getEntries(),
  output: {
    filename: "[name].min.js", 
    path: path.resolve(__dirname, "dist"),
    clean: true, 
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"], // Extrae el CSS a archivos
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: { format: { comments: false } },
      extractComments: false
    })],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css", // Mantendrá la misma estructura: dist/Configuracion/index.css
    }),
    new WebpackObfuscator({
      compact: true,
      controlFlowFlattening: true,
      debugProtection: true,
      identifierNamesGenerator: 'hexadecimal',
      stringArray: true,
      rotateStringArray: true,
      unicodeEscapeSequence: true
    })
  ]
};