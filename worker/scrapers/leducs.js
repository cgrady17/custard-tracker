import axios from 'axios';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';

export const scrapeLeducs = async () => {
  const url = "https://leducscustard.com/custard-calendar/";
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const flavors = [];
    
    // LeDuc's format: "Jan 21" or "Jan 01"
    // Note: The HTML debug showed "Wednesday, Jan 21"
    const today = new Date();
    const datePattern = format(today, 'MMM dd'); // e.g. "Jan 21"
    
    // Find the container with the list
    const $container = $('.em-events-list');
    const $paragraphs = $container.find('p');
    
    let foundDate = false;

    $paragraphs.each((i, el) => {
      const text = $(el).text().trim();
      
      if (!foundDate) {
        // Look for today's date in this paragraph
        if (text.includes(datePattern)) {
          foundDate = true;
          // The flavor is likely in the NEXT paragraph
        }
      } else {
        // We found the date in the previous iteration, so this P must be the flavor
        // Check if it's a date paragraph (safety check)
        if (text.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)day,/)) {
          // Oops, we hit the next date without finding a flavor? Reset.
          if (text.includes(datePattern)) {
             // It's actually today again? Unlikely but possible duplicate.
             foundDate = true; 
          } else {
             foundDate = false; // Stop looking for today's flavor
          }
          return;
        }

        let flavorName = text;
        // Clean up: Flavor is often inside an <a> tag
        const linkText = $(el).find('a').text().trim();
        if (linkText) flavorName = linkText;

        // Cleanup junk
        flavorName = flavorName.replace(/<\/?[^>]+(>|$)/g, "").trim();

        if (flavorName && !flavorName.toUpperCase().includes("CLOSED")) {
          flavors.push({
            name: flavorName,
            type: 'daily'
          });
        }
        
        // Reset foundDate so we don't grab the next paragraphs as flavors for today
        // (Assuming 1 flavor per day usually, or they are in the same P)
        foundDate = false; 
      }
    });

    return { flavors };

  } catch (e) {
    console.error(`[SCRAPER_ERROR] LeDuc's failed: ${e.message}`);
    return { flavors: [] };
  }
};