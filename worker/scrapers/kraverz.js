import axios from 'axios';
import * as cheerio from 'cheerio';
import { format, addDays } from 'date-fns';

export const scrapeKraverz = async () => {
  const url = "https://www.kraverzcustard.com/FlavorSchedule";
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const flavors = [];
    const upcoming = [];
    const today = new Date();
    
    // Check today + next 7 days
    for (let i = 0; i < 8; i++) {
        const targetDate = addDays(today, i);
        const dateStr = format(targetDate, 'MM/dd'); // 01/23
        
        $('.Flavor').each((j, el) => {
            const dateText = $(el).find('.flavorDate').text().trim();
            if (dateText === dateStr) {
                const flavorName = $(el).find('.flavorName').text().trim();
                if (flavorName) {
                    if (i === 0) {
                        flavors.push({ name: flavorName, type: 'daily' });
                    } else {
                        upcoming.push({
                            date: format(targetDate, 'yyyy-MM-dd'),
                            flavors: [{ name: flavorName, type: 'daily' }]
                        });
                    }
                }
            }
        });
    }

    return { flavors, upcoming };
  } catch (e) {
    console.error(`[SCRAPER_ERROR] Kraverz failed: ${e.message}`);
    return { flavors: [] };
  }
};
