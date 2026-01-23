import axios from 'axios';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';
import { getMilwaukeeDate } from '../utils/date.js';

export const scrapeRoberts = async () => {
  const url = "https://robertsfrozencustard.com/flavor.html";
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const flavors = [];
    const today = getMilwaukeeDate();
    // Format: "Fri, January 23, 2026"
    const dateStr = format(today, 'EEE, MMMM d, yyyy');
    
    // Find the "Flavor Calendar" header
    const $flavorHeader = $('h1').filter((i, el) => $(el).text().trim() === 'Flavor Calendar');
    
    const upcoming = [];
    
    if ($flavorHeader.length) {
        // The list is in the next <ul> sibling (or inside the next td/div structure)
        const $flavorList = $flavorHeader.siblings('ul').first();
        
        let foundToday = false;
        
        $flavorList.find('li').each((i, el) => {
            const text = $(el).text(); 
            // "Peanut Butter CupFri, January 23, 2026"
            
            let flavorName = "";
            let itemDateStr = "";

            // Try to separate Flavor from Date
            // Usually separated by <br>, but in text it's smashed
            // We can regex for the date part
            const dateMatch = text.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), ([a-zA-Z]+) (\d+), (\d{4})/);
            
            if (dateMatch) {
                itemDateStr = dateMatch[0]; // "Fri, January 23, 2026"
                flavorName = text.replace(itemDateStr, '').trim();
            }

            if (flavorName) {
                // Is this today?
                if (itemDateStr === dateStr) {
                    flavors.push({ name: flavorName, type: 'daily' });
                    foundToday = true;
                } 
                // Is this in the future?
                else if (foundToday) {
                    // Parse date to YYYY-MM-DD
                    const itemDate = new Date(itemDateStr);
                    if (!isNaN(itemDate.getTime())) {
                        upcoming.push({
                            date: format(itemDate, 'yyyy-MM-dd'),
                            flavors: [{ name: flavorName, type: 'daily' }]
                        });
                    }
                }
            }
        });
    }

    return { flavors, upcoming };
  } catch (e) {
    console.error(`[SCRAPER_ERROR] Robert's failed: ${e.message}`);
    return { flavors: [] };
  }
};
