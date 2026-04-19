import axios from 'axios';
import * as cheerio from 'cheerio';
import { format, startOfDay, parse } from 'date-fns';

function getGoldenGyrosStatus() {
  const now = new Date();
  const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const day = centralTime.getDay();
  const hour = centralTime.getHours();
  const minute = centralTime.getMinutes();
  
  const totalMinutes = hour * 60 + minute;
  const openTime = 11 * 60;
  
  // Hours: 11:00 am – 10:00 pm daily, except Sunday 9:30 pm
  let closeTime;
  let closeTimeStr;
  if (day === 0) { // Sunday
    closeTime = 21 * 60 + 30; // 9:30 PM
    closeTimeStr = "9:30 PM";
  } else {
    closeTime = 22 * 60; // 10:00 PM
    closeTimeStr = "10:00 PM";
  }
  
  const isOpen = totalMinutes >= openTime && totalMinutes < closeTime;
  const statusMessage = isOpen ? `Open until ${closeTimeStr}` : "Closed • Opens 11:00 AM";
  
  return { isOpen, statusMessage };
}

export async function scrapeGoldenGyros() {
  const url = 'https://goldengyro.com/daily-flavors';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  let flavors = [];
  const upcoming = [];

  try {
    const { data } = await axios.get(url, { headers });
    const $ = cheerio.load(data);
    const today = startOfDay(new Date());
    const currentYear = today.getFullYear();

    $('[data-aid^="MENU_SECTION_TITLE_"]').each((i, el) => {
        const dateText = $(el).text().trim(); // e.g. "April 19th"
        if (!dateText || dateText.toLowerCase().includes('menu')) return;

        // Remove ordinal suffixes (st, nd, rd, th) and extra spaces for parsing
        const cleanDateText = dateText.replace(/(st|nd|rd|th)/i, '').replace(/\s+/g, ' ');
        const flavorDate = parse(`${cleanDateText} ${currentYear}`, 'MMMM d yyyy', new Date());

        if (!isNaN(flavorDate.getTime())) {
            const dailyFlavors = [];
            
            // Find the associated item container
            let container = $(el).closest('[data-ux="Grid"]').next('[data-aid^="MENU_ITEM_CONTAINER"]');
            if (!container.length) {
                container = $(el).closest('div').nextAll('[data-aid^="MENU_ITEM_CONTAINER"]').first();
            }

            if (container.length) {
                container.find('[data-aid^="MENU_ITEM_"]').each((j, item) => {
                    const name = $(item).find('h4').text().trim();
                    const description = $(item).find('[data-aid$="_DESC"]').text().trim();
                    
                    if (name && name.toLowerCase() !== 'second flavor') {
                        dailyFlavors.push({
                            name,
                            description: description || "Flavor of the Day",
                            type: 'daily'
                        });
                    }
                });
            }

            const dateISO = format(flavorDate, 'yyyy-MM-dd');
            const todayISO = format(today, 'yyyy-MM-dd');

            if (dateISO === todayISO) {
                flavors = dailyFlavors;
            } else if (flavorDate > today) {
                // Avoid duplicates
                if (!upcoming.some(u => u.date === dateISO)) {
                  upcoming.push({
                      date: dateISO,
                      flavors: dailyFlavors
                  });
                }
            }
        }
    });

  } catch (e) {
    console.error(`[SCRAPER_ERROR] Golden Gyros failed: ${e.message}`);
  }

  const status = getGoldenGyrosStatus();

  return {
    flavors,
    upcoming: upcoming.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7),
    isOpen: status.isOpen,
    statusMessage: status.statusMessage
  };
}
