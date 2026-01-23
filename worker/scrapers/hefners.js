import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeHefners = async () => {
  const url = "https://www.hefnerscustard.com/";
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const flavors = [];
    
    // Target the specific flavor-text block
    const $container = $('.flavor-text');
    if ($container.length) {
        const flavorName = $container.find('h3').first().text().trim();
        
        // Description is often in a span inside nested p tags
        let flavorDescription = $container.find('span').first().text().trim();
        
        // Fallback: if no span, try just the p text but exclude any headers
        if (!flavorDescription) {
             flavorDescription = $container.find('p').text().trim();
        }

        if (flavorName) {
            flavors.push({
                name: flavorName,
                description: flavorDescription,
                type: 'daily'
            });
        }
    }

    return { flavors };
  } catch (e) {
    console.error(`[SCRAPER_ERROR] Hefner's failed: ${e.message}`);
    return { flavors: [] };
  }
};
