import axios from 'axios';
import { format } from 'date-fns';
import { getMilwaukeeDate } from '../utils/date.js';

export async function scrapeCulvers(oloID) {
  const url = `https://www.culvers.com/api/restaurants/getDetails?oloID=${oloID}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  };

  try {
    const { data } = await axios.get(url, { headers });
    
    if (!data.isSuccessful || !data.data || !data.data.restaurant || !data.data.restaurant.getRestaurantDetails) {
        throw new Error("Invalid API response");
    }

    const details = data.data.restaurant.getRestaurantDetails;
    const todayStr = format(getMilwaukeeDate(), 'yyyy-MM-dd');
    
    // Calculate Status Message
    let statusMessage = details.isOpenNow ? "Open" : "Closed";
    
    try {
        if (details.isOpenNow && details.currentTimes && details.currentTimes.dineInTimes) {
            const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
            // getMilwaukeeDate returns a Date object representing current time in MKE
            const nowMke = getMilwaukeeDate();
            const dayName = dayNames[nowMke.getDay()];
            
            const todayHours = details.currentTimes.dineInTimes.find(t => t.dayOfWeek === dayName);
            if (todayHours) {
                statusMessage = `Open until ${todayHours.closes}`;
            }
        }
    } catch (err) {
        console.error("Error calculating Culver's status message", err);
    }

    // Find today's flavor
    const todayFlavor = details.flavors.find(f => f.calendarDate.startsWith(todayStr));
    
    if (!todayFlavor) {
        return {
          flavors: [{ name: "Visit Website to View", description: "No flavor data for today.", imageUrl: "" }],
          isOpen: details.isOpenNow,
          statusMessage: statusMessage
        };
    }

    return {
      flavors: [{
        name: todayFlavor.name,
        description: todayFlavor.description,
        imageUrl: todayFlavor.image.imagePath
      }],
      isOpen: details.isOpenNow,
      statusMessage: statusMessage
    };

  } catch (e) {
    console.error(`Culvers API failed for ${oloID}: ${e.message}`);
    return { 
      flavors: [{name: "Visit Website to View", description: "Update failed.", imageUrl: ""}], 
      isOpen: true,
      error: e.message 
    };
  }
}
