
import { FlavorStatus, CustardShop } from '../types';

const DATA_URL = import.meta.env.PROD 
  ? 'https://storage.googleapis.com/mke-custard-data-manifest-sum/data.json' 
  : '/data.json';

export function getShopStatus(shop: CustardShop) {
  if (shop.temporaryClosure) {
    return { isOpen: false, statusMessage: shop.temporaryClosure };
  }
  
  if (!shop.hours) return { isOpen: undefined, statusMessage: "Hours unavailable" };

  const now = new Date();
  const day = now.getDay();
  const hours = shop.hours[day];

  if (!hours) return { isOpen: undefined, statusMessage: "Closed today" };

  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const openTime = openH * 60 + openM;
  
  // Handle midnight as 24:00
  let closeTime = closeH * 60 + closeM;
  if (closeTime === 0) closeTime = 24 * 60;

  const isOpen = currentTime >= openTime && currentTime < closeTime;

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  let statusMessage = "";
  if (isOpen) {
    statusMessage = `Open until ${formatTime(closeH, closeM)}`;
  } else {
    statusMessage = currentTime < openTime 
      ? `Closed • Opens ${formatTime(openH, openM)}`
      : `Closed for the day`;
  }

  return { isOpen, statusMessage };
}

export async function fetchAllFlavors(): Promise<Record<string, FlavorStatus>> {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error('Failed to load flavor data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching flavor data:", error);
    return {};
  }
}

export async function fetchMetadata(): Promise<{ flavors: string[] }> {
  const url = import.meta.env.PROD 
    ? 'https://storage.googleapis.com/mke-custard-data-manifest-sum/metadata.json' 
    : '/metadata.json';
  
  try {
    const response = await fetch(url);
    if (!response.ok) return { flavors: [] };
    return response.json();
  } catch {
    return { flavors: [] };
  }
}
