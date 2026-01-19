
import axios from 'axios';
import * as cheerio from 'cheerio';
import { format, addDays } from 'date-fns';

function getGillesStatus() {
  const now = new Date();
  const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const hour = centralTime.getHours();
  const minute = centralTime.getMinutes();
  
  const totalMinutes = hour * 60 + minute;
  const openTime = 11 * 60;
  const closeTime = 22 * 60;
  
  const isOpen = totalMinutes >= openTime && totalMinutes < closeTime;
  
  let statusMessage = "Closed";
  if (isOpen) {
      statusMessage = "Open until 10:00 PM";
  } else {
      statusMessage = "Closed • Opens 11:00 AM";
  }
  
  return { isOpen, statusMessage };
}

async function getFlavorForDate($, date, fetchDescription = false) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const selector = `#flavors_calendar-${dateStr}-0`;
  const contentCell = $(selector);
  
  if (!contentCell.length) return null;

  const links = contentCell.find('a');
  if (!links.length) return null;

  let flavorName = "";
  let imageUrl = "";
  let detailUrl = "";

  links.each((i, el) => {
    const $link = $(el);
    const $img = $link.find('img');
    
    if ($img.length) {
      imageUrl = $img.attr('src') || imageUrl;
      if (!flavorName) flavorName = $img.attr('alt') || $img.attr('title');
    }
    
    const text = $link.text().trim();
    if (text && text.length > 2) {
      flavorName = text;
    }

    if ($link.attr('href')) {
      detailUrl = $link.attr('href');
    }
  });

  if (!flavorName || flavorName === "See Image") flavorName = "Flavor of the Day";
  
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `https://gillesfrozencustard.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  let description = "Flavor of the Day";
  if (fetchDescription && detailUrl) {
    try {
      const absoluteDetailUrl = detailUrl.startsWith('http') ? detailUrl : `https://gillesfrozencustard.com${detailUrl}`;
      const { data: detailData } = await axios.get(absoluteDetailUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 5000
      });
      const $detail = cheerio.load(detailData);
      const body = $detail('.field-name-body .field-item p').first().text().trim() || $detail('.field-name-body').text().trim();
      if (body) description = body;
    } catch (err) {
      console.warn(`[SCRAPER_ERROR] Failed to fetch Gilles detail for ${flavorName}: ${err.message}`);
    }
  }
  
  return { 
    name: flavorName, 
    imageUrl, 
    description,
    type: 'daily' 
  };
}

export async function scrapeGilles() {
  const url = 'https://gillesfrozencustard.com/flavor-of-the-day';
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const today = new Date();
    
    // Today's Flavor (with description)
    const todayFlavor = await getFlavorForDate($, today, true);
    const flavors = todayFlavor ? [todayFlavor] : [];

    // Upcoming (Next 7 days, with descriptions)
    const upcoming = [];
    for (let i = 1; i <= 7; i++) {
      const futureDate = addDays(today, i);
      const flavor = await getFlavorForDate($, futureDate, true);
      if (flavor) {
        upcoming.push({
          date: format(futureDate, 'yyyy-MM-dd'),
          flavors: [flavor]
        });
      }
    }

    // Extract Flavor of the Month
    let fomName = "";
    $('div, p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.toLowerCase().startsWith("flavor of the month:")) {
            const clean = text.replace(/flavor of the month:/i, '').trim();
            if (clean.length > 0 && clean.length < 50) {
                fomName = clean;
                return false;
            }
        }
    });

    if (fomName) {
        flavors.push({ 
            name: fomName, 
            description: "Flavor of the Month", 
            type: 'monthly_flavor' 
        });
    }

    const status = getGillesStatus();

    return {
      flavors,
      upcoming,
      isOpen: status.isOpen,
      statusMessage: status.statusMessage
    };

  } catch (e) {
    console.error(`[SCRAPER_ERROR] Gilles failed: ${e.message}`);
    return { flavors: [], upcoming: [], isOpen: false, error: e.message };
  }
}
