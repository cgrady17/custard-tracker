import axios from 'axios';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';
import { getMilwaukeeDate } from '../utils/date.js';

export const scrapeMurfs = async () => {
  const url = "https://www.murfsfrozencustard.com/";
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const flavors = [];
    const upcoming = [];
    const seen = new Set();
    const today = getMilwaukeeDate();
    // Normalize today for comparison
    today.setHours(0, 0, 0, 0);
    
    const currentYear = today.getFullYear();

    // Iterate all date containers
    $('.subDateSpan, .tomorrowDate').each((i, el) => {
      const dateText = $(el).text().trim(); // "Friday, Jan. 23"
      
      // Parse date: "Friday, Jan. 23" -> Date object
      // We assume current year. Edge case: Dec 31 -> Jan 1 needs year handling but simple logic is fine for now
      // Let's try to parse manually or with regex
      const match = dateText.match(/([a-zA-Z]+)\.?\s+(\d+)/); // Jan. 23
      
      if (match) {
          const monthStr = match[1]; // Jan
          const dayStr = match[2]; // 23
          
          const itemDate = new Date(`${monthStr} ${dayStr}, ${currentYear}`);
          if (isNaN(itemDate.getTime())) return;
          
          // Handle year rollover if needed (if today is Dec and item is Jan)
          if (itemDate < today && itemDate.getMonth() < today.getMonth()) {
              itemDate.setFullYear(currentYear + 1);
          }

          // Extract flavor
          const $parent = $(el).closest('div');
          let flavorName = $parent.find('.flavorOfDayWhiteSpan').text().trim();
          if (!flavorName) flavorName = $parent.find('.tomorrowFlavor').text().trim();
          if (!flavorName) {
               const $grandParent = $(el).parent().parent();
               flavorName = $grandParent.find('.flavorOfDayWhiteSpan, .tomorrowFlavor').text().trim();
          }

          if (flavorName && !seen.has(flavorName.toLowerCase() + itemDate.getTime())) {
              seen.add(flavorName.toLowerCase() + itemDate.getTime());
              
              const isToday = itemDate.getDate() === today.getDate() && itemDate.getMonth() === today.getMonth();
              
              if (isToday) {
                  flavors.push({ name: flavorName, type: 'daily' });
              } else if (itemDate > today) {
                  upcoming.push({
                      date: format(itemDate, 'yyyy-MM-dd'),
                      flavors: [{ name: flavorName, type: 'daily' }]
                  });
              }
          }
      }
    });

    return { flavors, upcoming };
  } catch (e) {
    console.error(`[SCRAPER_ERROR] Murf's failed: ${e.message}`);
    return { flavors: [] };
  }
};
