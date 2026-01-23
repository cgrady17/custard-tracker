import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeGeorgiePorgies = async () => {
  const url = "https://georgieporgies.com/";
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const flavors = [];
    const seen = new Set();
    
    // Look for images with alt text containing "Flavor of the Day"
    $('img').each((i, el) => {
      const altText = $(el).attr('alt') || $(el).attr('title') || "";
      let flavorName = "";
      let type = 'daily';
      
      if (altText.toLowerCase().includes('flavor of the day')) {
        flavorName = altText.replace(/flavor of the day/i, '').replace(/^[-\s]+|georgie porgies?/i, '').replace(/^[-\s]+/, '').trim();
      } else if (altText.toLowerCase().includes('sundae of the month')) {
        flavorName = altText.replace(/sundae of the month/i, '').replace(/^[-\s]+|georgie porgies?/i, '').replace(/^[-\s]+/, '').trim();
        type = 'monthly_sundae';
      }

      if (flavorName && !seen.has(flavorName.toLowerCase())) {
        let description = "";
        const $wrapper = $(el).closest('a, span');
        const $details = $wrapper.next('.pac_dih__image_details');
        if ($details.length) {
            description = $details.text().trim();
        }

        flavors.push({
            name: flavorName,
            description: description,
            type: type
        });
        seen.add(flavorName.toLowerCase());
      }
    });

    return { flavors };
  } catch (e) {
    console.error(`[SCRAPER_ERROR] Georgie Porgie's failed: ${e.message}`);
    return { flavors: [] };
  }
};
