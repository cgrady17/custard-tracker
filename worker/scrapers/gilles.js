import axios from 'axios';
import * as cheerio from 'cheerio';
import { format, parse } from 'date-fns';

export const scrapeGilles = async () => {
  const url = "https://gillesfrozencustard.com/flavor-of-the-day";
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const flavors = [];
    const upcoming = [];
    const todayStr = format(new Date(), 'yyyy-MM-dd'); // "2026-01-23"

    // Helper to extract flavor from a calendar cell
    const extractFlavorFromCell = ($cell) => {
        let dailyFlavor = null;
        let monthlyFlavors = [];
        
        $cell.find('.item').each((i, item) => {
            const $item = $(item);
            const label = $item.find('.views-field-php .flavor.month').text().trim();
            const name = $item.find('.views-field-title a').text().trim();
            const imgUrl = $item.find('.views-field-field-flavor-image img').attr('src');

            if (!name || name.toLowerCase().includes('closed')) return;

            if (label && label.toLowerCase().includes('flavor of the day')) {
                dailyFlavor = {
                    name: name,
                    imageUrl: imgUrl,
                    type: 'daily'
                };
            } else {
                // If it's in the cell but NOT "Flavor of the day", assume it's a monthly special
                // Gilles usually puts Flavor of the Month here too
                monthlyFlavors.push({
                    name: name,
                    imageUrl: imgUrl,
                    type: 'monthly_flavor',
                    description: "Flavor of the Month" // Reasonable default
                });
            }
        });
        return { daily: dailyFlavor, monthly: monthlyFlavors };
    };

    // 1. Find Today
    const $todayCell = $(`td.single-day[data-date="${todayStr}"]`);
    if ($todayCell.length) {
        const { daily, monthly } = extractFlavorFromCell($todayCell);
        if (daily) flavors.push(daily);
        if (monthly.length > 0) flavors.push(...monthly);
    }

    // 2. Find Upcoming (Next 7 days)
    // Iterate all future cells
    $('td.single-day.future').each((i, el) => {
        const dateAttr = $(el).attr('data-date'); // "2026-01-24"
        if (dateAttr) {
            const { daily } = extractFlavorFromCell($(el));
            if (daily) {
                upcoming.push({
                    date: dateAttr,
                    flavors: [daily]
                });
            }
        }
    });

    return { flavors, upcoming };

  } catch (e) {
    console.error(`[SCRAPER_ERROR] Gilles failed: ${e.message}`);
    return { flavors: [] };
  }
};