import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MILWAUKEE_SHOPS } from './constants';
import { ViewType, FlavorStatus, SyncMetadata } from './types';
import ShopCard from './components/ShopCard';
import { fetchAllFlavors } from './services/dataService';
import { trackEvent, trackPageView } from './services/analytics';

const MapView = React.lazy(() => import('./components/MapView'));

const PULL_THRESHOLD = 70;

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('list');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('mke_custard_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('mke_custard_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [flavors, setFlavors] = useState<Record<string, FlavorStatus>>(() => {
    const saved = localStorage.getItem('mke_custard_flavors');
    return saved ? JSON.parse(saved) : {};
  });
  const [syncMeta, setSyncMeta] = useState<SyncMetadata>(() => {
    const saved = localStorage.getItem('mke_custard_sync_meta');
    return saved ? JSON.parse(saved) : { lastGlobalSync: null, isSyncing: false };
  });
  
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(!!navigator.geolocation);

  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.log('Location access denied or error:', error);
          setIsLocating(false);
        },
        { timeout: 10000 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  // Theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('mke_custard_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('mke_custard_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('mke_custard_flavors', JSON.stringify(flavors));
  }, [flavors]);

  useEffect(() => {
    localStorage.setItem('mke_custard_sync_meta', JSON.stringify(syncMeta));
  }, [syncMeta]);

  const displayedShops = useMemo(() => {
    let filtered = MILWAUKEE_SHOPS.filter(shop => {
      const status = flavors[shop.id];
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           shop.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChain = selectedChain ? shop.chain === selectedChain : true;
      const matchesFavorites = (showOnlyFavorites || view === 'favorites') ? favorites.includes(shop.id) : true;
      
      // If we don't have status data yet, don't filter out 'Closed' shops
      const matchesOpen = showOpenOnly ? (status?.isOpen ?? true) : true;
      
      return matchesSearch && matchesChain && matchesFavorites && matchesOpen;
    });

    if (userLocation) {
      filtered = filtered.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.lat - userLocation.lat, 2) + Math.pow(a.lng - userLocation.lng, 2));
        const distB = Math.sqrt(Math.pow(b.lat - userLocation.lat, 2) + Math.pow(b.lng - userLocation.lng, 2));
        return distA - distB;
      });
    }

    return filtered;
  }, [searchQuery, selectedChain, showOnlyFavorites, favorites, view, userLocation, flavors, showOpenOnly]);

  const performGlobalSync = async () => {
    if (!navigator.onLine || syncMeta.isSyncing) return;

    setSyncMeta(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const allFlavors = await fetchAllFlavors();
      setFlavors(prev => ({ ...prev, ...allFlavors }));
      
      setSyncMeta({
        lastGlobalSync: new Date().toISOString(),
        isSyncing: false
      });
    } catch (err) {
      console.error("Sync failed", err);
      setSyncMeta(prev => ({ ...prev, isSyncing: false }));
    }
  };

  // Legacy support for single update (just triggers global sync as it is cheap now)
  const updateFlavor = async (id: string) => {
     await performGlobalSync();
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD) {
      trackEvent('refresh_flavors', { method: 'pull_to_refresh' });
      performGlobalSync();
    }
    setPullDistance(0);
    startY.current = null;
  };

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const onTouchStart = (e: TouchEvent) => {
      if (main.scrollTop === 0 && !syncMeta.isSyncing) {
        startY.current = e.touches[0].pageY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || syncMeta.isSyncing) return;
      const currentY = e.touches[0].pageY;
      const diff = currentY - startY.current;
      if (diff > 0) {
        const dampedDiff = Math.pow(diff, 0.85);
        setPullDistance(Math.min(dampedDiff, 100));
        if (diff > 10 && main.scrollTop <= 0) {
          if (e.cancelable) e.preventDefault();
        }
      } else {
        startY.current = null;
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => handleTouchEnd();

    main.addEventListener('touchstart', onTouchStart, { passive: true });
    main.addEventListener('touchmove', onTouchMove, { passive: false });
    main.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      main.removeEventListener('touchstart', onTouchStart);
      main.removeEventListener('touchmove', onTouchMove);
      main.removeEventListener('touchend', onTouchEnd);
    };
  }, [syncMeta.isSyncing, pullDistance]);

  useEffect(() => {
    const checkFreshness = async () => {
      if (syncMeta.isSyncing || !navigator.onLine) {
        return;
      }
      
      const lastSync = syncMeta.lastGlobalSync ? new Date(syncMeta.lastGlobalSync) : null;
      const now = new Date();
      
      if (!lastSync) {
          await performGlobalSync();
          return;
      }

      const isNewDay = lastSync.getDate() !== now.getDate() || lastSync.getMonth() !== now.getMonth();
      const isStale = (now.getTime() - lastSync.getTime() > 6 * 60 * 60 * 1000); 

      if (isNewDay || isStale) {
        console.log("Auto-refreshing stale data...");
        await performGlobalSync();
      }
    };

    // Initial check (small delay to allow hydration)
    const initialTimer = setTimeout(checkFreshness, 1000);

    // Check when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkFreshness();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Check periodically (every 10 minutes)
    const interval = setInterval(checkFreshness, 10 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [syncMeta.lastGlobalSync, syncMeta.isSyncing]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const chains = useMemo(() => {
    const chainSet = new Set<string>();
    MILWAUKEE_SHOPS.forEach(shop => {
      if (shop.chain) chainSet.add(shop.chain);
    });
    return Array.from(chainSet).sort();
  }, []);

  useEffect(() => {
    trackPageView(view);
    // Force scroll reset at both element and window level
    const resetScroll = () => {
      window.scrollTo(0, 0);
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
    };
    
    // Execute immediately and also on next frame to be safe
    resetScroll();
    requestAnimationFrame(resetScroll);
  }, [view]);

  return (
    <div className="min-h-screen flex flex-col pb-24 mx-auto relative transition-colors duration-300 bg-cream-city dark:bg-midnight-lake">
      {isOffline && (
        <div className="bg-mke-blue text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest animate-pulse sticky top-0 z-50">
          Offline Mode • Viewing Cached Data
        </div>
      )}

      <header className="px-4 sm:px-6 pt-8 pb-4 bg-lake-blue dark:bg-mke-blue sticky top-0 z-30 shadow-lg transition-colors overflow-hidden">
        {/* Flag Sunrise Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-white/10 dark:bg-sunrise-gold/5 rounded-b-full -translate-y-12 blur-2xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto w-full relative">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => {
                setView('list');
                setSearchQuery('');
                setSelectedChain(null);
                setShowOnlyFavorites(false);
                mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left active:scale-95 transition-transform"
              aria-label="MKE Scoop Home"
            >
              <div className="relative">
                <h1 className="text-3xl sm:text-4xl font-black text-white leading-none flex items-center gap-2 drop-shadow-md dark:neon-text-gold">
                  <span className="text-sunrise-gold">MKE</span> Scoop
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-[1px] w-6 bg-sunrise-gold"></div>
                  <p className="text-white/90 font-bold text-[9px] uppercase tracking-[0.2em]">Cream City Custard</p>
                </div>
              </div>
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-white/10 dark:bg-stone-900/50 flex items-center justify-center text-white transition-all active:scale-90 hover:bg-white/20"
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-base`}></i>
              </button>
              <button 
                onClick={() => performGlobalSync()}
                disabled={syncMeta.isSyncing || isOffline}
                className={`w-10 h-10 rounded-xl bg-sunrise-gold flex items-center justify-center text-mke-blue transition-all active:scale-90 ${(syncMeta.isSyncing || isOffline) ? 'opacity-50 grayscale' : 'hover:scale-105 shadow-lg shadow-sunrise-gold/20'}`}
                aria-label="Refresh flavor data"
              >
                <i className={`fas fa-sync-alt text-base ${syncMeta.isSyncing ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center mb-2">
            <div className="relative flex-1 w-full">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50"></i>
              <input 
                type="text"
                placeholder="Search stands..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 3) {
                    trackEvent('search', { query: e.target.value });
                  }
                }}
                className="w-full bg-white/10 dark:bg-stone-900/50 border-white/10 border-2 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-white/40 focus:ring-2 focus:ring-sunrise-gold focus:outline-none transition-all"
              />
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-2 w-full md:w-auto pb-2 md:pb-0">
              <button 
                onClick={() => {
                  setShowOpenOnly(!showOpenOnly);
                  trackEvent('filter_toggle', { filter: 'open_only', value: !showOpenOnly });
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 border-2 ${showOpenOnly ? 'bg-white border-white text-lake-blue' : 'bg-transparent border-white/20 text-white/80'}`}
              >
                <i className="fas fa-clock"></i>
                Open Now
              </button>

              <button 
                onClick={() => {
                  setShowOnlyFavorites(!showOnlyFavorites);
                  trackEvent('filter_toggle', { filter: 'favorites_only', value: !showOnlyFavorites });
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 border-2 ${showOnlyFavorites ? 'bg-brick-red border-brick-red text-white' : 'bg-transparent border-white/20 text-white/80'}`}
              >
                <i className="fas fa-heart"></i>
                Favs
              </button>

              <button 
                onClick={() => setSelectedChain(null)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-black transition-all border-2 ${selectedChain === null ? 'bg-mke-blue border-mke-blue text-white' : 'bg-transparent border-white/20 text-white/80'}`}
              >
                All
              </button>

              {chains.map(chain => (
                <button 
                  key={chain}
                  onClick={() => setSelectedChain(selectedChain === chain ? null : chain)}
                  className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-black transition-all border-2 ${selectedChain === chain ? 'bg-sunrise-gold border-sunrise-gold text-mke-blue' : 'bg-transparent border-white/20 text-white/80'}`}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main 
        ref={mainRef}
        className="flex-1 overflow-y-auto pt-8 relative min-h-[500px] touch-pan-y"
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6">
          <div 
            className="absolute left-0 right-0 flex flex-col items-center justify-center transition-all duration-75 overflow-hidden z-10"
            style={{ height: `${pullDistance}px`, top: `-${pullDistance}px`, transform: `translateY(${pullDistance}px)` }}
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-stone-800 shadow-lg border border-sunrise-gold flex items-center justify-center text-sunrise-gold transition-transform" style={{ transform: `rotate(${pullDistance * 4}deg)` }}>
              <i className={`fas fa-ice-cream ${pullDistance >= PULL_THRESHOLD ? 'scale-125' : 'scale-100'}`}></i>
            </div>
            {pullDistance >= PULL_THRESHOLD && (
              <p className="text-[10px] font-black uppercase text-sunrise-gold mt-2 tracking-widest animate-bounce">Release to Refresh</p>
            )}
          </div>

          {syncMeta.isSyncing && pullDistance === 0 && (
            <div className="flex justify-center py-4 animate-in fade-in zoom-in duration-300 h-16">
              <div className="w-8 h-8 rounded-full bg-sunrise-gold/20 flex items-center justify-center">
                 <i className="fas fa-sync-alt animate-spin text-sunrise-gold"></i>
              </div>
            </div>
          )}

          {view === 'list' && (
            <div className="animate-in fade-in duration-300 min-h-[400px]">
              <div className="flex justify-between items-center mb-8 h-8 px-1">
                <div className="flex items-center gap-3">
                  <h2 className="font-black text-mke-blue dark:text-stone-400 uppercase tracking-[0.2em] text-[10px] sm:text-xs">
                    {selectedChain ? `${selectedChain} Locations` : 'Milwaukee Area Stands'} ({isInitialLoading ? '...' : displayedShops.length})
                  </h2>
                  {isLocating && (
                    <div className="flex items-center gap-1.5 animate-pulse">
                      <div className="w-1.5 h-1.5 bg-sunrise-gold rounded-full"></div>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-sunrise-gold">Locating...</span>
                    </div>
                  )}
                  {userLocation && !isLocating && (
                    <div className="flex items-center gap-1">
                      <i className="fas fa-location-arrow text-[8px] text-green-500"></i>
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-stone-500 dark:text-stone-400">Sorted by proximity</span>
                    </div>
                  )}
                </div>
              </div>
              
              {displayedShops.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedShops.map((shop, index) => (
                    <ShopCard 
                      key={shop.id}
                      shop={shop}
                      status={flavors[shop.id] || { shopId: shop.id, flavors: [], isLoading: true }}
                      isFavorite={favorites.includes(shop.id)}
                      onToggleFavorite={toggleFavorite}
                      onRefresh={updateFlavor}
                      isPriority={index < 2}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-search text-stone-300 dark:text-stone-700 text-2xl"></i>
                  </div>
                  <h3 className="font-bold text-stone-800 dark:text-stone-200">No matches found</h3>
                  <p className="text-stone-400 dark:text-stone-600 text-sm max-w-[200px] mt-1 italic">
                    Try adjusting your filters or search query.
                  </p>
                </div>
              )}
            </div>
          )}

          {view === 'favorites' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-8">
                <i className="fas fa-heart text-red-500 text-2xl"></i>
                <h2 className="font-bold text-stone-800 dark:text-stone-100 text-2xl">Favorite Stands</h2>
              </div>
              
              {displayedShops.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedShops.map((shop, index) => (
                    <ShopCard 
                      key={`fav-view-${shop.id}`}
                      shop={shop}
                      status={flavors[shop.id]}
                      isFavorite={true}
                      onToggleFavorite={toggleFavorite}
                      onRefresh={updateFlavor}
                      isPriority={index < 2}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-stone-50 dark:bg-stone-800/50 rounded-3xl border-2 border-dashed border-stone-200 dark:border-stone-800">
                  <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <i className="fas fa-heart text-stone-200 dark:text-stone-700 text-2xl"></i>
                  </div>
                  <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-1">No Favorites Found</h3>
                  <p className="text-stone-500 dark:text-stone-500 text-sm italic">
                    Tap the heart on any custard stand to add it to your favorites.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {view === 'map' && (
          <div className="absolute inset-0 z-0">
             <React.Suspense fallback={
               <div className="flex items-center justify-center h-full bg-cream-city dark:bg-stone-900">
                 <div className="w-8 h-8 border-4 border-sunrise-gold border-t-transparent rounded-full animate-spin"></div>
               </div>
             }>
               <MapView shops={displayedShops} flavors={flavors} onRefresh={updateFlavor} isDarkMode={isDarkMode} />
             </React.Suspense>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-16 text-center border-t border-stone-200 dark:border-stone-800 transition-colors">
        <div className="mb-6 flex justify-center gap-4 opacity-20 grayscale">
           <div className="w-8 h-8 bg-lake-blue rounded-full"></div>
           <div className="w-8 h-8 bg-sunrise-gold rounded-full"></div>
           <div className="w-8 h-8 bg-mke-blue rounded-full"></div>
        </div>
        <p className="text-xs font-black text-mke-blue dark:text-stone-600 uppercase tracking-[0.3em] mb-3">
          © {new Date().getFullYear()} Connor Grady • Milwaukee, WI
        </p>
        <p className="text-[10px] text-mke-blue/60 dark:text-stone-700 italic font-bold uppercase tracking-widest">
          The Real Cream City
        </p>
      </footer>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-mke-blue/95 dark:bg-mke-blue/90 backdrop-blur-xl border border-white/10 px-6 py-4 flex justify-between items-center z-40 shadow-2xl rounded-[2rem] transition-colors duration-300 dark:neon-glow-gold">
        <button 
          onClick={() => { setView('list'); setShowOnlyFavorites(false); }}
          className={`flex-1 flex flex-col items-center gap-1 transition-all ${view === 'list' ? 'text-sunrise-gold drop-shadow-[0_0_8px_rgba(255,183,3,0.4)]' : 'text-white/40'}`}
        >
          <i className={`fas fa-ice-cream text-xl ${view === 'list' ? 'scale-110' : ''}`}></i>
          <span className="text-[9px] font-black uppercase tracking-widest">Stands</span>
        </button>
        
        <button 
          onClick={() => { setView('favorites'); setShowOnlyFavorites(false); }}
          className={`flex-1 flex flex-col items-center gap-1 transition-all ${view === 'favorites' ? 'text-sunrise-gold drop-shadow-[0_0_8px_rgba(255,183,3,0.4)]' : 'text-white/40'}`}
        >
          <i className={`fas fa-heart text-xl ${view === 'favorites' ? 'scale-110' : ''}`}></i>
          <span className="text-[9px] font-black uppercase tracking-widest">Favs</span>
        </button>

        <button 
          onClick={() => setView('map')}
          className={`flex-1 flex flex-col items-center gap-1 transition-all ${view === 'map' ? 'text-sunrise-gold drop-shadow-[0_0_8px_rgba(255,183,3,0.4)]' : 'text-white/40'}`}
        >
          <i className={`fas fa-map-marked-alt text-xl ${view === 'map' ? 'scale-110' : ''}`}></i>
          <span className="text-[10px] font-bold uppercase tracking-widest">Map</span>
        </button>
      </nav>
    </div>
  );
};

export default App;