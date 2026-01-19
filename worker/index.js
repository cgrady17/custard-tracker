import { scrapeKopps } from './scrapers/kopps.js';
import { scrapeCulvers } from './scrapers/culvers.js';
import { scrapeGilles } from './scrapers/gilles.js';
import { scrapeOscars } from './scrapers/oscars.js';
import { scrapeLeons } from './scrapers/leons.js';
import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';

const storage = new Storage();
const BUCKET_NAME = process.env.GCP_BUCKET_NAME || 'mke-custard-data';

const SHOPS = [
  { id: 'kopps-greenfield', chain: "Kopp's", url: "https://kopps.com/flavor-preview" },
  { id: 'kopps-glendale', chain: "Kopp's", url: "https://kopps.com/flavor-preview" },
  { id: 'kopps-brookfield', chain: "Kopp's", url: "https://kopps.com/flavor-preview" },
  { id: 'culvers-shorewood', chain: "Culver's", oloID: "126141", url: "https://www.culvers.com/restaurants/shorewood" },
  { id: 'culvers-west-milwaukee', chain: "Culver's", oloID: "126216", url: "https://www.culvers.com/restaurants/west-milwaukee" },
  { id: 'culvers-milwaukee-fond-du-lac', chain: "Culver's", oloID: "126207", url: "https://www.culvers.com/restaurants/milwaukee-fond-du-lac" },
  { id: 'culvers-milwaukee-layton', chain: "Culver's", oloID: "126061", url: "https://www.culvers.com/restaurants/milwaukee-layton" },
  { id: 'culvers-glendale-wi-bayside-dr', chain: "Culver's", oloID: "171830", url: "https://www.culvers.com/restaurants/glendale-wi-bayside-dr" },
  { id: 'culvers-greenfield-wi-layton-ave', chain: "Culver's", oloID: "126250", url: "https://www.culvers.com/restaurants/greenfield-wi-layton-ave" },
  { id: 'culvers-west-allis', chain: "Culver's", oloID: "126270", url: "https://www.culvers.com/restaurants/west-allis" },
  { id: 'culvers-brookfield-124th', chain: "Culver's", oloID: "126190", url: "https://www.culvers.com/restaurants/brookfield-124th" },
  { id: 'culvers-milwaukee-good-hope', chain: "Culver's", oloID: "126353", url: "https://www.culvers.com/restaurants/milwaukee-good-hope" },
  { id: 'culvers-oak-creek', chain: "Culver's", oloID: "126002", url: "https://www.culvers.com/restaurants/oak-creek" },
  { id: 'culvers-elm-grove-wi', chain: "Culver's", oloID: "126434", url: "https://www.culvers.com/restaurants/elm-grove-wi" },
  { id: 'culvers-hales-corners', chain: "Culver's", oloID: "126020", url: "https://www.culvers.com/restaurants/hales-corners" },
  { id: 'culvers-new-berlin', chain: "Culver's", oloID: "125994", url: "https://www.culvers.com/restaurants/new-berlin" },
  { id: 'culvers-brown-deer', chain: "Culver's", oloID: "126077", url: "https://www.culvers.com/restaurants/brown-deer" },
  { id: 'culvers-franklin', chain: "Culver's", oloID: "126101", url: "https://www.culvers.com/restaurants/franklin" },
  { id: 'culvers-mequon', chain: "Culver's", oloID: "126176", url: "https://www.culvers.com/restaurants/mequon" },
  { id: 'culvers-brookfield-capitol', chain: "Culver's", oloID: "126021", url: "https://www.culvers.com/restaurants/brookfield-capitol" },
  { id: 'culvers-waukesha-hwy-164', chain: "Culver's", oloID: "126035", url: "https://www.culvers.com/restaurants/waukesha-hwy-164" },
  { id: 'culvers-muskego', chain: "Culver's", oloID: "125998", url: "https://www.culvers.com/restaurants/muskego" },
  { id: 'culvers-menomonee-falls', chain: "Culver's", oloID: "125975", url: "https://www.culvers.com/restaurants/menomonee-falls" },
  { id: 'culvers-waukesha-sunset', chain: "Culver's", oloID: "126007", url: "https://www.culvers.com/restaurants/waukesha-sunset" },
  { id: 'culvers-waukesha-grandview', chain: "Culver's", oloID: "125966", url: "https://www.culvers.com/restaurants/waukesha-grandview" },
  { id: 'culvers-sussex', chain: "Culver's", oloID: "126085", url: "https://www.culvers.com/restaurants/sussex" },
  { id: 'culvers-grafton', chain: "Culver's", oloID: "125987", url: "https://www.culvers.com/restaurants/grafton" },
  { id: 'culvers-racine-wi-douglas-ave', chain: "Culver's", oloID: "165150", url: "https://www.culvers.com/restaurants/racine-wi-douglas-ave" },
  { id: 'gilles', chain: "Gilles", url: "https://gillesfrozencustard.com/flavor-of-the-day" },
  { id: 'oscars-west-allis', chain: "Oscar's", url: "https://oscarscustard.com/index.php/flavors/" },
  { id: 'oscars-franklin', chain: "Oscar's", url: "https://oscarscustard.com/index.php/flavors/" },
  { id: 'oscars-waukesha', chain: "Oscar's", url: "https://oscarscustard.com/index.php/flavors/" },
  { id: 'leons', chain: "Leon's", url: "https://leonsfrozencustard.us" }
];

export const scrapeCustard = async (req, res) => {
  console.log("Starting scrape job...");
  const results = {};
  
  // 1. Fetch shared data in parallel
  console.log("Fetching shared chain data...");
  const [koppsData, gillesData, oscarsData, leonsData] = await Promise.all([
      scrapeKopps().catch(e => { console.error(`[SCRAPER_ERROR] Kopps failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeGilles().catch(e => { console.error(`[SCRAPER_ERROR] Gilles failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeOscars().catch(e => { console.error(`[SCRAPER_ERROR] Oscars failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeLeons().catch(e => { console.error(`[SCRAPER_ERROR] Leons failed: ${e.message}`); return { error: e.message, flavors: [] }; })
  ]);

  // 2. Process all shops in parallel
  console.log("Processing all shops...");
  const tasks = SHOPS.map(async (shop) => {
      let data = null;
      try {
          if (shop.chain === "Kopp's") {
              data = { ...koppsData, shopId: shop.id };
          } else if (shop.chain === "Gilles") {
              data = { ...gillesData, shopId: shop.id };
          } else if (shop.chain === "Oscar's") {
              if (shop.id === 'oscars-waukesha') {
                  data = { 
                      shopId: shop.id, 
                      flavors: [], 
                      isOpen: false, 
                      statusMessage: "Temporarily Closed (Fire)" 
                  };
              } else {
                  data = { ...oscarsData, shopId: shop.id };
              }
          } else if (shop.chain === "Leon's") {
              data = { ...leonsData, shopId: shop.id };
          } else if (shop.chain === "Culver's") {
              // Culver's requires individual API calls per location
              try {
                data = await scrapeCulvers(shop.oloID);
                data.shopId = shop.id;
              } catch (e) {
                console.error(`[SCRAPER_ERROR] Culver's ${shop.id} failed: ${e.message}`);
                throw e;
              }
          }
      } catch (e) {
          data = { shopId: shop.id, flavors: [], error: "Update failed" };
      }

      if (data) {
          // Use current time for individual update timestamp
          data.lastUpdated = new Date().toISOString();
          results[shop.id] = data;
      }
  });

  await Promise.all(tasks);

  const finalJson = JSON.stringify(results, null, 2);

  if (process.env.GCP_PROJECT) {
      try {
        await storage.bucket(BUCKET_NAME).file('data.json').save(finalJson, {
            contentType: 'application/json',
            metadata: { cacheControl: 'public, max-age=300' }
        });
        console.log("Uploaded to GCS.");
        if (res) res.status(200).send('Scrape complete');
      } catch (e) {
          console.error(`[SCRAPER_CRITICAL] GCS Upload failed: ${e.message}`);
          if (res) res.status(500).send(e.message);
      }
  } else {
      console.log("Local run detected. Saving to ../public/data.json");
      fs.writeFileSync('../public/data.json', finalJson);
      if (res) res.status(200).send('Local save complete');
  }
};
