import axios from 'axios';
import * as cheerio from 'cheerio';
import { format, isBefore, startOfDay, parse } from 'date-fns';

function getOscarsStatus() {
  const now = new Date();
  const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const day = centralTime.getDay();
  const hour = centralTime.getHours();
  const minute = centralTime.getMinutes();
  
  const totalMinutes = hour * 60 + minute;
  const openTime = 10 * 60 + 30;
  
  let closeTime;
  if (day === 5 || day === 6) {
    closeTime = 24 * 60; 
  } else {
    closeTime = 22 * 60; 
  }
  
  const isOpen = totalMinutes >= openTime && totalMinutes < closeTime;
  const closeTimeStr = (day === 5 || day === 6) ? "Midnight" : "10:00 PM";
  const openTimeStr = "10:30 AM";
  
  let statusMessage = isOpen ? `Open until ${closeTimeStr}` : `Closed • Opens ${openTimeStr}`;
  
  return { isOpen, statusMessage };
}

export async function scrapeOscars() {
  const flavorsUrl = 'https://oscarscustard.com/index.php/flavors/';
  const homeUrl = 'https://www.oscarscustard.com/';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  let flavors = [];
  const upcoming = [];
  let isOpen = false;
  let statusMessage = "";

  // 1. Fetch Daily & Upcoming Flavors from Table
  try {
    const { data } = await axios.get(flavorsUrl, { headers });
    const $ = cheerio.load(data);
    const today = startOfDay(new Date());
    const currentMonthStr = format(today, 'MMMM yyyy'); // e.g. "January 2026"
    
    $('tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
            const dateCell = $(cells[0]);
            const flavorCell = $(cells[1]);
            const dateText = dateCell.text().trim();
            
            // Try to parse date from "1", "2", or "Sunday 1"
            const dayMatch = dateText.match(/(\d+)$/);
            if (dayMatch) {
                const dayNum = dayMatch[1];
                const flavorDate = parse(`${currentMonthStr} ${dayNum}`, 'MMMM yyyy d', new Date());
                
                if (!isNaN(flavorDate.getTime())) {
                    const fullFlavorText = flavorCell.text().trim();
                    if (!fullFlavorText) return;

                    // Split flavors by "-or-" or "&"
                    const flavorNames = fullFlavorText.split(/\s+-or-\s+|\s+&\s+/i).map(n => n.trim());
                    const dailyFlavors = [];

                    flavorNames.forEach(flavorName => {
                        let imageUrl = "";
                        let description = "Flavor of the Day";

                        // Try to find image and description in overlays by matching flavor name
                        const links = flavorCell.find('a');
                        links.each((j, linkEl) => {
                            const $link = $(linkEl);
                            if ($link.text().trim().toLowerCase() === flavorName.toLowerCase()) {
                                const linkId = $link.attr('id');
                                if (linkId && linkId.startsWith('overlay_unique_id_')) {
                                    const id = linkId.replace('overlay_unique_id_', '');
                                    const contentDiv = $(`#overlay-describedby-${id}`);
                                    if (contentDiv.length) {
                                        const img = contentDiv.find('.et_pb_image_wrap img');
                                        if (img.length) imageUrl = img.attr('src');
                                        
                                        const textInner = contentDiv.find('.et_pb_text_inner');
                                        if (textInner.length) {
                                            let descText = textInner.text().replace(flavorName, '').trim();
                                            if (descText) description = descText;
                                        }
                                    }
                                }
                            }
                        });

                        // Fallback if no overlay link matched
                        if (!imageUrl) {
                            const img = flavorCell.find('img');
                            if (img.length) imageUrl = img.attr('src');
                        }

                        dailyFlavors.push({
                            name: flavorName,
                            imageUrl,
                            description,
                            type: 'daily'
                        });
                    });

                    const dateISO = format(flavorDate, 'yyyy-MM-dd');
                    const todayISO = format(today, 'yyyy-MM-dd');

                    if (dateISO === todayISO) {
                        flavors = dailyFlavors;
                    } else if (!isBefore(flavorDate, today)) {
                        upcoming.push({
                            date: dateISO,
                            flavors: dailyFlavors
                        });
                    }
                }
            }
        }
    });

    const status = getOscarsStatus();
    isOpen = status.isOpen;
    statusMessage = status.statusMessage;

  } catch (e) {
    console.error(`[SCRAPER_ERROR] Oscars failed: ${e.message}`);
  }

  // 2. Fetch Monthly Features from Homepage
  try {
    const { data } = await axios.get(homeUrl, { headers });
    const $ = cheerio.load(data);
    const features = $('#features');
    
    if (features.length) {
        features.find('.et_pb_blurb').each((i, el) => {
            const headerText = $(el).find('.et_pb_module_header').text().trim().toLowerCase();
            const descDiv = $(el).find('.et_pb_blurb_description');
            
            if (headerText.includes('shake of the month') || headerText.includes('sundae of the month')) {
                const name = descDiv.find('h3, strong').first().text().trim();
                let desc = descDiv.find('p').first().text().trim();
                if (!desc) desc = descDiv.text().replace(name, '').trim();

                if (name) {
                    flavors.push({
                        name,
                        description: desc || (headerText.includes('shake') ? "Shake of the Month" : "Sundae of the Month"),
                        type: headerText.includes('shake') ? 'monthly_shake' : 'monthly_sundae'
                    });
                }
            }
        });
    }
  } catch (e) {
    console.error(`[SCRAPER_ERROR] Oscars features failed: ${e.message}`);
  }

  return {
    flavors,
    upcoming: upcoming.sort((a, b) => a.date.localeCompare(b.date)),
    isOpen,
    statusMessage: statusMessage || (flavors.length > 0 ? "Open" : "Update failed")
  };
}