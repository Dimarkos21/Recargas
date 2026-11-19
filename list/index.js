const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

// Configuración del cliente de Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Exportamos para que lo puedas usar en productos.js
module.exports = { s3Client };