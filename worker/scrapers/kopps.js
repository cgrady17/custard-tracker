import axios from 'axios';
import * as cheerio from 'cheerio';
import { format, addDays, parse } from 'date-fns';

function getKoppsStatus() {
  const now = new Date();
  const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const day = centralTime.getDay();
  const hour = centralTime.getHours();
  const minute = centralTime.getMinutes();
  
  const totalMinutes = hour * 60 + minute;
  const openTime = 10 * 60 + 30;
  
  let closeTime = (day === 5 || day === 6) ? 23 * 60 : 22 * 60;
  const isOpen = totalMinutes >= openTime && totalMinutes < closeTime;
  const closeTimeStr = (day === 5 || day === 6) ? "11:00 PM" : "10:00 PM";
  
  return { isOpen, statusMessage: isOpen ? `Open until ${closeTimeStr}` : `Closed • Opens 10:30 AM` };
}

export async function scrapeKopps() {
  const url = 'https://kopps.com/flavor-preview';
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    let flavors = [];
    const upcoming = [];
    const today = new Date();

    $('h2').each((i, el) => {
      const headerText = $(el).text().trim().toLowerCase();
      const row = $(el).next('.row');
      
      if (!row.length) return;

      const currentFlavors = [];
      row.find('.flavor-card').each((j, card) => {
        const name = $(card).find('h3').text().trim();
        const imageUrl = $(card).find('img').attr('src');
        const description = $(card).find('p').text().trim();
        if (name) {
          currentFlavors.push({
            name,
            imageUrl,
            description: description || "See website for details.",
            type: 'daily'
          });
        }
      });

      if (currentFlavors.length > 0) {
        if (headerText.includes('today')) {
          flavors = currentFlavors;
        } else {
          // Parse date from header (e.g., "Monday 1/19" or "Tomorrow")
          let flavorDate = null;
          if (headerText.includes('tomorrow')) {
            flavorDate = addDays(today, 1);
          } else {
            const dateMatch = headerText.match(/(\d+\/\d+)/);
            if (dateMatch) {
              flavorDate = parse(dateMatch[1], 'M/d', new Date());
            }
          }

          if (flavorDate && !isNaN(flavorDate.getTime())) {
            upcoming.push({
              date: format(flavorDate, 'yyyy-MM-dd'),
              flavors: currentFlavors
            });
          }
        }
      }
    });

    // Extract Monthly Features
    $('h2').each((i, el) => {
       const text = $(el).text().trim().toLowerCase();
       const card = $(el).next('.flavor-card');
       if (text.includes("shake of the month")) {
           flavors.push({ name: card.find('h3').text().trim(), description: "Shake of the Month", type: 'monthly_shake' });
       } else if (text.includes("sundae of the month")) {
           flavors.push({ name: card.find('h3').text().trim(), description: card.find('p').text().trim() || "Sundae of the Month", type: 'monthly_sundae' });
       }
    });

    const status = getKoppsStatus();

    return {
      flavors,
      upcoming: upcoming.sort((a, b) => a.date.localeCompare(b.date)),
      isOpen: status.isOpen,
      statusMessage: status.statusMessage
    };

  } catch (e) {
    console.error(`[SCRAPER_ERROR] Kopps failed: ${e.message}`);
    return { flavors: [], upcoming: [], isOpen: false, error: e.message };
  }
}