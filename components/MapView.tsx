
import React, { useEffect, useRef, useState } from 'react';
import { CustardShop, FlavorStatus } from '../types';

interface MapViewProps {
  shops: CustardShop[];
  flavors: Record<string, FlavorStatus>;
  onRefresh: (id: string) => void;
  isDarkMode: boolean;
}

const MapView: React.FC<MapViewProps> = ({ shops, flavors, onRefresh, isDarkMode }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const userMarkerRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const center: [number, number] = [43.0389, -87.9065];
    
    if (!mapRef.current) {
      mapRef.current = (window as any).L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(center, 11);

      (window as any).L.control.zoom({
        position: 'topright'
      }).addTo(mapRef.current);
    }
  }, []);

  // Update Tile Layer when theme changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const lightTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    
    tileLayerRef.current = (window as any).L.tileLayer(isDarkMode ? darkTiles : lightTiles, {
      maxZoom: 20
    }).addTo(mapRef.current);

  }, [isDarkMode]);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current) return;

    const currentShopIds = new Set(shops.map(s => s.id));
    
    Object.keys(markersRef.current).forEach(id => {
      if (!currentShopIds.has(id)) {
        mapRef.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    shops.forEach(shop => {
      if (markersRef.current[shop.id]) {
        mapRef.current.removeLayer(markersRef.current[shop.id]);
      }

      const status = flavors[shop.id];
      const hasFlavors = status?.flavors && status.flavors.length > 0;
      
      const dailyFlavors = hasFlavors ? status.flavors.filter(f => !f.type || f.type === 'daily') : [];
      const monthlyFlavors = hasFlavors ? status.flavors.filter(f => f.type && f.type !== 'daily') : [];
      const firstFlavor = dailyFlavors.length > 0 ? dailyFlavors[0] : null;
      
      const isLoading = status?.isLoading;
      const statusMessage = status?.statusMessage || (status?.isOpen ? 'Open' : (status?.isOpen === false ? 'Closed' : ''));
      const statusColor = status?.isOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
      const statusBg = status?.isOpen ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';

      const markerColor = shop.brandColor || '#ffb703';
      
      const iconHtml = shop.logoUrl 
        ? `<div style="background-image: url('${shop.logoUrl}'); background-size: cover; background-position: center; background-color: white; width: 18px; height: 18px; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.4); border: 2px solid white;"></div>`
        : `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border: 2px solid ${isDarkMode ? '#292524' : 'white'}; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`;

      const customIcon = (window as any).L.divIcon({
        className: 'custom-div-icon',
        html: iconHtml,
        iconSize: shop.logoUrl ? [18, 18] : [14, 14],
        iconAnchor: shop.logoUrl ? [9, 9] : [7, 7]
      });

      // Rich Popup Content
      let flavorContent = '';
      if (isLoading) {
        flavorContent = `
          <div class="flex flex-col items-center justify-center py-4 space-y-2">
            <div class="w-4 h-4 border-2 border-sunrise-gold border-t-transparent rounded-full animate-spin"></div>
            <p class="text-[9px] text-sunrise-gold font-bold uppercase tracking-widest">Loading...</p>
          </div>
        `;
      } else if (dailyFlavors.length > 0 && firstFlavor) {
        flavorContent = `
          ${firstFlavor.imageUrl ? `
            <div class="relative h-24 w-full bg-stone-100 dark:bg-stone-700 rounded-lg overflow-hidden mb-2">
              <img src="${firstFlavor.imageUrl}" class="w-full h-full object-cover" alt="${firstFlavor.name}" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          ` : ''}
          <h5 class="text-xs font-black text-stone-900 dark:text-stone-100 leading-tight mb-1">${firstFlavor.name}</h5>
          ${dailyFlavors.length > 1 ? `<p class="text-[9px] font-bold text-lake-blue mb-1">+ ${dailyFlavors.length - 1} more</p>` : ''}
          ${firstFlavor.description ? `<p class="text-[9px] text-stone-500 dark:text-stone-400 italic leading-relaxed line-clamp-2">${firstFlavor.description}</p>` : ''}
        `;
      } else if (monthlyFlavors.length > 0) {
         flavorContent = `
           <div class="bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg text-center mb-2">
             <p class="text-[9px] text-stone-400 italic">No daily specials posted.</p>
           </div>
         `;
      } else {
         flavorContent = `
           <div class="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg text-center">
             <p class="text-[9px] text-stone-400 italic">No flavor data available</p>
           </div>
         `;
      }

      let monthlyContent = '';
      if (monthlyFlavors.length > 0) {
         const itemsHtml = monthlyFlavors.map(f => {
             let iconClass = 'fa-calendar-alt';
             if (f.type === 'monthly_shake') iconClass = 'fa-wine-glass-alt';
             else if (f.type === 'monthly_sundae') iconClass = 'fa-ice-cream';
             
             // Escape name/desc for HTML string safety if needed, but basic text is usually fine in this context
             return `
               <div style="display: flex; gap: 6px; align-items: flex-start; margin-bottom: 6px;">
                  <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${isDarkMode ? 'rgba(255, 183, 3, 0.2)' : '#fffbeb'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ffb703;">
                     <i class="fas ${iconClass}" style="font-size: 8px;"></i>
                  </div>
                  <div style="min-width: 0;">
                     <p style="font-size: 9px; font-weight: 700; color: ${isDarkMode ? '#f5f5f4' : '#292524'}; margin: 0; line-height: 1.1;">${f.name}</p>
                     <p style="font-size: 8px; color: ${isDarkMode ? '#a8a29e' : '#78716c'}; margin: 0; font-style: italic; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
                        ${f.description && f.description !== "See website for details." && f.description !== "Flavor of the Month" ? f.description : 'Feature'}
                     </p>
                  </div>
               </div>
             `;
         }).join('');
  
         monthlyContent = `
           <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${isDarkMode ? '#44403c' : '#f5f5f4'};">
              <p style="font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${isDarkMode ? '#a8a29e' : '#a8a29e'}; margin-bottom: 6px;">Monthly Features</p>
              ${itemsHtml}
           </div>
         `;
      }

      const popupContent = `
        <div class="custom-popup overflow-hidden" style="min-width: 200px; max-width: 220px;">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
               ${shop.logoUrl 
                 ? `<img src="${shop.logoUrl}" class="w-4 h-4 rounded-full object-contain bg-white shadow-sm" alt="${shop.name} logo" />` 
                 : `<div class="w-2 h-2 rounded-full" style="background-color: ${shop.brandColor || '#ccc'}"></div>`
               }
               <h4 class="font-bold text-stone-800 dark:text-stone-100 text-sm truncate max-w-[120px]">${shop.name}</h4>
            </div>
            ${statusMessage ? `
              <div class="px-1.5 py-0.5 rounded-full ${statusBg} border border-transparent">
                <span class="text-[8px] font-bold ${statusColor} uppercase tracking-tight">${statusMessage}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="mb-3">
             ${flavorContent}
             ${monthlyContent}
          </div>

          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-700 hover:opacity-70 transition-opacity no-underline"
          >
             <p class="text-[9px] text-stone-400 dark:text-stone-500 truncate max-w-[130px] m-0">${shop.address}</p>
             <div class="flex items-center gap-1">
               <span class="text-[8px] font-black text-lake-blue uppercase">Directions</span>
               <i class="fas fa-chevron-right text-[8px] text-lake-blue"></i>
             </div>
          </a>
        </div>
      `;

      const marker = (window as any).L.marker([shop.lat, shop.lng], { icon: customIcon })
        .addTo(mapRef.current)
        .bindPopup(popupContent, { className: 'custom-popup' });
      
      markersRef.current[shop.id] = marker;
    });

  }, [shops, flavors, isDarkMode]);

  const centerOnUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const userLoc: [number, number] = [latitude, longitude];

        if (mapRef.current) {
          mapRef.current.setView(userLoc, 14);
          if (userMarkerRef.current) {
            mapRef.current.removeLayer(userMarkerRef.current);
          }
          userMarkerRef.current = (window as any).L.circle(userLoc, {
            radius: 50,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.4
          }).addTo(mapRef.current);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please check your permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full h-full relative overflow-hidden transition-colors duration-300">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <button 
        onClick={centerOnUser}
        disabled={isLocating}
        aria-label="Center on my location"
        className="absolute top-24 right-3 z-20 w-10 h-10 bg-white dark:bg-stone-800 rounded-lg shadow-md border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 active:scale-95 transition-all hover:bg-stone-50 dark:hover:bg-stone-700"
      >
        <i className={`fas ${isLocating ? 'fa-spinner fa-spin' : 'fa-location-arrow'} ${isLocating ? 'text-sunrise-gold' : ''}`}></i>
      </button>

      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800 flex items-center gap-3 transition-colors duration-300">
          <div className="w-8 h-8 rounded-full bg-sunrise-gold/20 flex items-center justify-center text-sunrise-gold">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Results</p>
            <p className="text-xs font-bold text-stone-800 dark:text-stone-200">{shops.length} stands shown</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
