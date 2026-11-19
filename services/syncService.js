require('dotenv').config();
const axios = require('axios');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Game = require('../models/Game');
const Product = require('../models/Product');
const GamePrincipal = require('../models/GamePrincipal');

// Configurar cliente de Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function calculateSellingPriceUSD(costUSD) {
  const markupUSD = 1.21; // 20% de ganancia
  const sellPriceUSD = Number((costUSD * markupUSD).toFixed(2));
  return { cost_price_usd: costUSD, sell_price_usd: sellPriceUSD };
}

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Extrae la región real analizando el texto (Solo acepta países/regiones válidas, filtra monedas como Riot Cash)
 */
function extractRegionFromText(text) {
  if (!text) return [];
  
  const validRegions = [
    'Global', 'USA', 'US', 'Latam', 'Europe', 'EU', 'Asia', 'Brazil', 'Brasil', 
    'Mexico', 'México', 'Australia', 'Turkey', 'Turquía', 'Argentina', 'Chile', 
    'Colombia', 'Peru', 'Perú', 'Southeast Asia', 'MENA', 'CIS'
  ];

  const found = validRegions.filter(reg => {
    const regex = new RegExp(`\\b${reg}\\b`, 'i');
    return regex.test(text);
  });

  if (found.length > 0) return [...new Set(found)];

  const parenthesisMatch = text.match(/\(([^)]+)\)/);
  if (parenthesisMatch) {
    const cleaned = parenthesisMatch[1].trim();
    const invalidWords = ['cash', 'points', 'diamonds', 'uc', 'topup', 'vp', 'RP', 'gcoins'];
    const isInvalid = invalidWords.some(w => cleaned.toLowerCase().includes(w));
    
    if (cleaned.length > 2 && !isInvalid) {
      return [cleaned];
    }
  }

  return [];
}

/**
 * Descarga la imagen y la sube a R2
 */
async function downloadAndUploadImageToR2(folderPath, imageFilename) {
  if (!imageFilename) return null;

  try {
    const BASE_IMAGE_URL = "https://shop2topup.com/storage/images/";
    const fetchUrl = `${BASE_IMAGE_URL}${imageFilename}`;

    const imageResponse = await axios.get(fetchUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageResponse.data);
    const r2Key = `${folderPath}/${imageFilename}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'imagenes optigest',
      Key: r2Key,
      Body: buffer,
      ContentType: 'image/webp'
    }));

    return r2Key;
  } catch (error) {
    console.warn(`⚠️ No se pudo descargar la imagen ${imageFilename} desde la API.`);
    return null;
  }
}

/**
 * Consulta los requisitos oficiales de la API para una categoría específica
 */
async function fetchCategoryRegionsFromAPI(categoryId) {
  try {
    const response = await axios.get(`https://shop2topup.com/api/endpoints/v1/catalog/category/${categoryId}/requirements`, {
      headers: { 'Authorization': `Bearer ${process.env.SHOP2TOPUP_API_KEY}` }
    });

    const requirements = response.data.requirements || [];
    
    const regionField = requirements.find(req => 
      req.field_name?.toLowerCase().includes('server') || 
      req.field_name?.toLowerCase().includes('region') ||
      req.field_name?.toLowerCase().includes('zone') ||
      req.field_name?.toLowerCase().includes('country')
    );

    if (regionField && regionField.select_options) {
      return regionField.select_options; 
    }

    return [];
  } catch (error) {
    return [];
  }
}

const syncCatalogWithShop2TopUp = async () => {
  try {
    console.log('🔄 [CRON] Fase 1: Sincronizando catálogo completo (Categorías Principales, Juegos y Productos)...');

    // Descargamos subcategorías, categorías y categorías principales en paralelo
    const [subcategoriesRes, categoriesRes, bigCategoriesRes] = await Promise.all([
      axios.get('https://shop2topup.com/api/endpoints/v1/catalog/subcategories', {
        headers: { 'Authorization': `Bearer ${process.env.SHOP2TOPUP_API_KEY}` }
      }),
      axios.get('https://shop2topup.com/api/endpoints/v1/catalog/categories?for_ui=true', {
        headers: { 'Authorization': `Bearer ${process.env.SHOP2TOPUP_API_KEY}` }
      }),
      axios.get('https://shop2topup.com/api/endpoints/v1/catalog/big-categories?for_ui=true', {
        headers: { 'Authorization': `Bearer ${process.env.SHOP2TOPUP_API_KEY}` }
      })
    ]);

    const apiProducts = subcategoriesRes.data.subcategories || subcategoriesRes.data.data || [];
    const apiCategories = categoriesRes.data.categories || categoriesRes.data.data || [];
    const apiBigCategories = bigCategoriesRes.data.big_categories || bigCategoriesRes.data.data || [];

    if (apiProducts.length === 0) {
      console.log('⚠️ [CRON] La API no devolvió productos.');
      return;
    }

    let bigCatProcessedCount = 0;
    let gamesProcessedCount = 0;
    let productsProcessedCount = 0;

    const bigCatMap = new Map();
    const gameMap = new Map();

    // 0. Guardar Categorías Principales (GamePrincipal) usando external_id
    for (const bigCat of apiBigCategories) {
      const bigCatId = Number(bigCat.id || bigCat.external_id);
      const bigCatName = bigCat.name || 'General';

      if (!bigCatId || isNaN(bigCatId)) continue;

      const bigCatDoc = await GamePrincipal.findOneAndUpdate(
        { external_id: bigCatId },
        { 
          $set: {
            name: bigCatName,
            description: bigCat.description || '',
            image_url: bigCat.image_url || bigCat.imageUrl || ''
          },
          $setOnInsert: { external_id: bigCatId }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (bigCatDoc) {
        bigCatMap.set(bigCatId, bigCatDoc._id);
        bigCatProcessedCount++;
      }
    }

    // 1. Guardar todos los Juegos (Categorías) enlazados a su Categoría Principal
    for (const cat of apiCategories) {
      const catId = Number(cat.id);
      const catName = cat.name || 'General';
      const catImage = cat.image_url || cat.imageUrl || '';
      const catDesc = cat.description || '';
      const bigCatId = Number(cat.big_category_id);

      if (!catId || isNaN(catId)) continue;

      // Obtenemos el ID de MongoDB de la categoría principal para relacionarla
      const principalId = bigCatMap.get(bigCatId) || null;

      const gameSlug = slugify(catName);
      const folderPath = `juegos/${gameSlug}/logo`;

      if (catImage) {
        await downloadAndUploadImageToR2(folderPath, catImage);
      }

      const gameDoc = await Game.findOneAndUpdate(
        { external_id: catId },
        { 
          $set: {
            name: catName,
            description: catDesc,
            image_url: catImage,
            game_principal: principalId // Enlace con GamePrincipal (Asegúrate de agregarlo a tu esquema Game si deseas guardarlo físicamente)
          },
          $setOnInsert: { external_id: catId }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (gameDoc) {
        gameMap.set(catId, gameDoc._id);
        gamesProcessedCount++;
      }
    }

    // 2. Guardar todos los Productos (Subcategorías)
    for (const item of apiProducts) {
      const apiProductId = item.item_id || item.id;
      if (!apiProductId) continue; 

      const categoryId = Number(item.category_id);
      const categoryName = item.category_name || 'General';
      const costoBaseUsd = parseFloat(item.price) || 0;

      let gameId = gameMap.get(categoryId);
      
      if (!gameId) {
        const gameSlug = slugify(categoryName);
        const fallbackGame = await Game.findOneAndUpdate(
          { external_id: categoryId },
          { 
            $set: {
              name: categoryName,
              description: '',
              image_url: ''
            },
            $setOnInsert: { external_id: categoryId }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        gameId = fallbackGame._id;
        gameMap.set(categoryId, gameId);
      }

      const productImages = item.image_url || item.imageUrl || '';
      if (productImages) {
        const gameSlug = slugify(categoryName);
        const productFolderPath = `juegos/${gameSlug}/productos`;
        await downloadAndUploadImageToR2(productFolderPath, productImages);
      }

      const pricing = calculateSellingPriceUSD(costoBaseUsd);

      await Product.findOneAndUpdate(
        { external_id: apiProductId },
        { 
          $set: {
            name: item.name,
            cost_price_usd: pricing.cost_price_usd,
            sell_price_usd: pricing.sell_price_usd,
            game: gameId,
            category_id: categoryId,
            product_type: item.product_type || 'topup',
            is_available: true,
            lastSyncedAt: new Date()
          },
          $setOnInsert: { external_id: apiProductId }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      productsProcessedCount++;
    }

    console.log(`✅ [CRON] Fase 1 finalizada: ${bigCatProcessedCount} categorías principales, ${gamesProcessedCount} juegos y ${productsProcessedCount} productos guardados.`);

    // ==========================================
    // FASE 2: CONSULTAR Y ACTUALIZAR REGIONES 1 POR 1
    // ==========================================
    console.log('🔄 [CRON] Fase 2: Consultando regiones uno por uno...');

    const allGames = await Game.find({});
    
    for (const game of allGames) {
      let regions = await fetchCategoryRegionsFromAPI(game.external_id);

      if (regions.length === 0) {
        regions = extractRegionFromText(game.name);
      }

      await Game.updateOne({ _id: game._id }, { $set: { regions } });

      const associatedProducts = await Product.find({ game: game._id });
      
      for (const prod of associatedProducts) {
        let prodRegions = [...regions];
        
        if (prodRegions.length === 0) {
          prodRegions = extractRegionFromText(prod.name);
        }

        await Product.updateOne({ _id: prod._id }, { $set: { regions: prodRegions } });
      }
    }

    console.log('✅ [CRON] Fase 2 completada: Regiones asignadas correctamente a juegos y productos.');
    console.log('🏁 Sincronización total finalizada con éxito.');

  } catch (error) {
    console.error('❌ [CRON] Error crítico en la sincronización:', error.response?.data || error.message);
  }
};

module.exports = { syncCatalogWithShop2TopUp };