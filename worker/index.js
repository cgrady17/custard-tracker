import { scrapeKopps } from './scrapers/kopps.js';
import { scrapeCulvers } from './scrapers/culvers.js';
import { scrapeGilles } from './scrapers/gilles.js';
import { scrapeOscars } from './scrapers/oscars.js';
import { scrapeLeons } from './scrapers/leons.js';
import { scrapeLeducs } from './scrapers/leducs.js';
import { scrapeHefners } from './scrapers/hefners.js';
import { scrapeGeorgiePorgies } from './scrapers/georgie.js';
import { scrapeMurfs } from './scrapers/murfs.js';
import { scrapeRoberts } from './scrapers/roberts.js';
import { scrapeKraverz } from './scrapers/kraverz.js';
import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import admin from 'firebase-admin';

// Initialize Firebase Admin (uses default service account in GCP)
if (process.env.GCP_PROJECT) {
  admin.initializeApp();
}

const sanitize = (str) => {
  if (!str) return "";
  // Strip HTML tags and limit length
  return str.replace(/<[^>]*>?/gm, '').substring(0, 500).trim();
};

const storage = new Storage();
const BUCKET_NAME = process.env.GCP_BUCKET_NAME || 'mke-custard-data';

export const SHOPS = [
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
  { id: 'leons', chain: "Leon's", url: "https://leonsfrozencustard.us" },
  { id: 'leducs', chain: "LeDuc's", url: "https://leducscustard.com/custard-calendar/" },
  { id: 'hefners', chain: "Hefner's", url: "https://www.hefnerscustard.com/" },
  { id: 'georgie-porgies', chain: "Georgie Porgie's", url: "https://georgieporgies.com/" },
  { id: 'murfs', chain: "Murf's", url: "https://www.murfsfrozencustard.com/" },
  { id: 'roberts', chain: "Robert's", url: "https://robertsfrozencustard.com/flavor.html" },
  { id: 'kraverz', chain: "Kraverz", url: "https://www.kraverzcustard.com/FlavorSchedule" }
];

export const scrapeCustard = async (req, res) => {
  console.log("Starting scrape job...");
  const results = {};
  
  // 1. Fetch shared data in parallel
  console.log("Fetching shared chain data...");
  const [koppsData, gillesData, oscarsData, leonsData, leducsData, hefnersData, georgieData, murfsData, robertsData, kraverzData] = await Promise.all([
      scrapeKopps().catch(e => { console.error(`[SCRAPER_ERROR] Kopps failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeGilles().catch(e => { console.error(`[SCRAPER_ERROR] Gilles failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeOscars().catch(e => { console.error(`[SCRAPER_ERROR] Oscars failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeLeons().catch(e => { console.error(`[SCRAPER_ERROR] Leons failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeLeducs().catch(e => { console.error(`[SCRAPER_ERROR] LeDucs failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeHefners().catch(e => { console.error(`[SCRAPER_ERROR] Hefners failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeGeorgiePorgies().catch(e => { console.error(`[SCRAPER_ERROR] Georgie Porgies failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeMurfs().catch(e => { console.error(`[SCRAPER_ERROR] Murfs failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeRoberts().catch(e => { console.error(`[SCRAPER_ERROR] Roberts failed: ${e.message}`); return { error: e.message, flavors: [] }; }),
      scrapeKraverz().catch(e => { console.error(`[SCRAPER_ERROR] Kraverz failed: ${e.message}`); return { error: e.message, flavors: [] }; })
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
          } else if (shop.chain === "LeDuc's") {
              data = { ...leducsData, shopId: shop.id };
          } else if (shop.chain === "Hefner's") {
              data = { ...hefnersData, shopId: shop.id };
          } else if (shop.chain === "Georgie Porgie's") {
              data = { ...georgieData, shopId: shop.id };
          } else if (shop.chain === "Murf's") {
              data = { ...murfsData, shopId: shop.id };
          } else if (shop.chain === "Robert's") {
              data = { ...robertsData, shopId: shop.id };
          } else if (shop.chain === "Kraverz") {
              data = { ...kraverzData, shopId: shop.id };
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

      // Use current time for individual update timestamp
      if (data) {
          data.flavors = data.flavors.map(f => ({
            ...f,
            name: sanitize(f.name),
            description: sanitize(f.description)
          }));
          if (data.upcoming) {
            data.upcoming = data.upcoming.map(day => ({
              ...day,
              flavors: day.flavors.map(f => ({
                ...f,
                name: sanitize(f.name),
                description: sanitize(f.description)
              }))
            }));
          }
          data.lastUpdated = new Date().toISOString();
          results[shop.id] = data;

          // Success logging for this shop
          const flavorCount = data.flavors ? data.flavors.length : 0;
          const shopName = shop.chain || shop.id;
          console.log(`[SCRAPER_INFO] Successfully scraped ${shopName} (${shop.id}) and found ${flavorCount} flavor(s).`);
      }
  });

  await Promise.all(tasks);
  console.log(`[SCRAPER_INFO] Scrape phase complete. Processed ${Object.keys(results).length} shops.`);

  // 3. Check for matching subscriptions and notify
  if (process.env.GCP_PROJECT) {
    try {
      const db = admin.firestore();
      const messaging = admin.messaging();

      // Maintenance: Delete subscriptions older than 90 days
      try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const expiredQuery = await db.collection('subscriptions')
          .where('createdAt', '<', ninetyDaysAgo.toISOString())
          .limit(50)
          .get();
        
        if (!expiredQuery.empty) {
          const batch = db.batch();
          expiredQuery.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          console.log(`Cleaned up ${expiredQuery.size} expired subscriptions.`);
        }
      } catch (cleanupErr) {
        console.warn("Cleanup phase minor failure:", cleanupErr.message);
      }
      
      // 1. Map flavors to their shops
      const flavorToShops = {};
      Object.values(results).forEach(shopData => {
        const shopInfo = SHOPS.find(s => s.id === shopData.shopId);
        let shopName = "a local stand";
        
        if (shopInfo) {
          if (shopInfo.chain && shopInfo.chain !== "Other") {
            shopName = shopInfo.chain;
          } else if (shopInfo.name) {
            shopName = shopInfo.name.split(' - ')[0];
          }
        }

        shopData.flavors.forEach(f => {
          if (f.type === 'daily' || !f.type) {
            const name = sanitize(f.name).toLowerCase();
            if (!flavorToShops[name]) flavorToShops[name] = new Set();
            flavorToShops[name].add(shopName);
          }
        });
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const userMatches = {}; // { token: [{ flavor, shops }] }

      // 2. Find all matches and group by user
      for (const [flavor, shopSet] of Object.entries(flavorToShops)) {
        const subsQuery = await db.collection('subscriptions').where('flavorName', '==', flavor).get();
        subsQuery.forEach(doc => {
          const data = doc.data();
          // Skip if already notified today
          if (data.lastNotifiedDate === todayStr) return;

          if (!userMatches[data.token]) userMatches[data.token] = [];
          userMatches[data.token].push({ 
            flavor: flavor.toUpperCase(), 
            shops: Array.from(shopSet).join(" and "),
            docId: doc.id
          });
        });
      }

      // 3. Send consolidated notifications
      const tokens = Object.keys(userMatches);
      console.log(`Sending consolidated notifications to ${tokens.length} users...`);

      for (const token of tokens) {
        const matches = userMatches[token];
        let title = "Flavor Alert! 🍦";
        let body = "";

        if (matches.length === 1) {
          title = `${matches[0].flavor} is Churning!`;
          body = `Your favorite "${matches[0].flavor}" is available today at ${matches[0].shops}.`;
        } else {
          const flavorList = matches.map(m => m.flavor).join(", ");
          title = `${matches.length} Flavors Found!`;
          body = `Today's picks: ${flavorList}. Tap to see where!`;
        }

        try {
          await messaging.send({
            token,
            notification: { title, body },
            webpush: { fcmOptions: { link: 'https://mkescoop.com' } }
          });

          // Mark as notified today
          const batch = db.batch();
          matches.forEach(m => {
            batch.update(db.collection('subscriptions').doc(m.docId), { lastNotifiedDate: todayStr });
          });
          await batch.commit();
        } catch (e) {
          console.error(`Failed to notify token: ${e.message}`);
        }
      }
    } catch (e) {
      console.error(`[SCRAPER_ERROR] Notification phase failed: ${e.message}`);
    }
  }

  const finalJson = JSON.stringify(results, null, 2);

  // 4. Update Metadata (Master Flavor List)
  const allUniqueFlavors = new Set();
  const blackList = ["closed", "refresh", "none", "unknown", "see website"];
  
  Object.values(results).forEach(shopData => {
    shopData.flavors.forEach(f => {
      const sanitized = sanitize(f.name);
      if (sanitized && !blackList.some(b => sanitized.toLowerCase().includes(b))) {
        allUniqueFlavors.add(sanitized);
      }
    });
    if (shopData.upcoming) {
      shopData.upcoming.forEach(day => {
        day.flavors.forEach(f => {
          const sanitized = sanitize(f.name);
          if (sanitized && !blackList.some(b => sanitized.toLowerCase().includes(b))) {
            allUniqueFlavors.add(sanitized);
          }
        });
      });
    }
  });

  if (process.env.GCP_PROJECT) {
      try {
        const bucket = storage.bucket(BUCKET_NAME);
        
        // Try to get existing metadata to merge
        let masterList = Array.from(allUniqueFlavors);
        try {
          const [metadataContent] = await bucket.file('metadata.json').download();
          const existing = JSON.parse(metadataContent.toString());
          if (existing.flavors) {
            const merged = new Set([...existing.flavors, ...masterList]);
            masterList = Array.from(merged).sort();
          }
        } catch (downloadErr) {
          console.log("No existing metadata found, creating new.");
        }

        const metadataJson = JSON.stringify({ 
          flavors: masterList,
          lastUpdated: new Date().toISOString()
        }, null, 2);

        await bucket.file('data.json').save(finalJson, {
            contentType: 'application/json',
            metadata: { cacheControl: 'public, max-age=300' }
        });

        await bucket.file('metadata.json').save(metadataJson, {
          contentType: 'application/json',
          metadata: { cacheControl: 'public, max-age=3600' }
        });

        console.log("Uploaded data.json and metadata.json to GCS.");
        if (res) res.status(200).send('Scrape complete');
      } catch (e) {
          console.error(`[SCRAPER_CRITICAL] GCS Upload failed: ${e.message}`);
          if (res) res.status(500).send(e.message);
      }
  } else {
      console.log("Local run detected. Saving to ../public/data.json");
      fs.writeFileSync('../public/data.json', finalJson);
      fs.writeFileSync('../public/metadata.json', JSON.stringify({ flavors: Array.from(allUniqueFlavors).sort() }));
      if (res) res.status(200).send('Local save complete');
  }
};
