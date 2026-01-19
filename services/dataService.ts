
import { FlavorStatus } from '../types';

const DATA_URL = import.meta.env.PROD 
  ? 'https://storage.googleapis.com/mke-custard-data-manifest-sum/data.json' 
  : '/data.json';

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
