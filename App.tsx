import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MILWAUKEE_SHOPS } from './constants';
import { ViewType, FlavorStatus, SyncMetadata } from './types';
import ShopCard from './components/ShopCard';
import { fetchAllFlavors, fetchMetadata } from './services/dataService';
import { trackEvent, trackPageView } from './services/analytics';

const MapView = React.lazy(() => import('./components/MapView'));

const PULL_THRESHOLD = 70;

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('list');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('mke_custard_theme');
    if (saved) return saved === 'dark';
    // Default to Light Mode (Cream City) regardless of system preference
    return false;
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
  const [showFollowHint, setShowFollowHint] = useState(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') return false;
    return !localStorage.getItem('mke_custard_follow_hint_seen');
  });
  const [followedFlavors, setFollowedFlavors] = useState<string[]>([]);
  const [allFlavors, setAllFlavors] = useState<string[]>([]);
  const [flavorSearch, setFlavorSearch] = useState('');
  const [showFlavorSuggestions, setShowFlavorSuggestions] = useState(false);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const startY = useRef<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

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
      const searchLower = searchQuery.toLowerCase();
      
      const matchesShop = shop.name.toLowerCase().includes(searchLower) || 
                         shop.address.toLowerCase().includes(searchLower);
      
      // Deep search into flavors (daily and monthly)
      const matchesFlavors = status?.flavors?.some(f => 
        f.name.toLowerCase().includes(searchLower) || 
        f.description?.toLowerCase().includes(searchLower)
      ) ?? false;

      const matchesChain = selectedChain ? shop.chain === selectedChain : true;
      const matchesFavorites = (showOnlyFavorites || view === 'favorites') ? favorites.includes(shop.id) : true;
      
      // If we don't have status data yet, don't filter out 'Closed' shops
      const matchesOpen = showOpenOnly ? (status?.isOpen ?? true) : true;
      
      return (matchesShop || matchesFlavors) && matchesChain && matchesFavorites && matchesOpen;
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

  // Check if data is "stale" (from a previous day)
  const isDataStale = useMemo(() => {
    // Check the first shop that has data
    const shopWithData = Object.values(flavors).find((f: FlavorStatus) => f.lastUpdated) as FlavorStatus | undefined;
    if (!shopWithData) return false;

    const lastUpdate = new Date(shopWithData.lastUpdated);
    const now = new Date();
    
    return lastUpdate.getDate() !== now.getDate() || 
           lastUpdate.getMonth() !== now.getMonth() || 
           lastUpdate.getFullYear() !== now.getFullYear();
  }, [flavors]);

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
      // Only start tracking if we are at the absolute top
      if ((main.scrollTop <= 0 && window.scrollY <= 0) && !syncMeta.isSyncing) {
        startY.current = e.touches[0].pageY;
      } else {
        startY.current = null;
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

    const onScroll = () => {
      const scrollPos = main.scrollTop || window.scrollY;
      if (scrollPos > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Close flavor suggestions when clicking outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.relative.w-full.md\\:w-64')) {
        setShowFlavorSuggestions(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);

    main.addEventListener('touchstart', onTouchStart, { passive: true });
    main.addEventListener('touchmove', onTouchMove, { passive: false });
    main.addEventListener('touchend', onTouchEnd, { passive: true });
    main.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousedown', handleOutsideClick);
      main.removeEventListener('touchstart', onTouchStart);
      main.removeEventListener('touchmove', onTouchMove);
      main.removeEventListener('touchend', onTouchEnd);
      main.removeEventListener('scroll', onScroll);
    };
  }, [syncMeta.isSyncing, pullDistance]);

  useEffect(() => {
    // Check if location permission was already granted
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation();
        }
      });
    }
  }, []);

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

      // Strict check: Is the last sync from a different calendar day?
      const isDifferentDay = lastSync.getDate() !== now.getDate() || 
                            lastSync.getMonth() !== now.getMonth() || 
                            lastSync.getFullYear() !== now.getFullYear();
                            
      // Or has it been more than 4 hours?
      const isStale = (now.getTime() - lastSync.getTime() > 4 * 60 * 60 * 1000); 

      if (isDifferentDay || isStale) {
        console.log("Data is stale (new day or timeout). Refreshing...");
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
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('mke_custard_favorites', JSON.stringify(next));
      return next;
    });
  };

  const handleFollowClick = () => {
    setShowFollowHint(false);
    localStorage.setItem('mke_custard_follow_hint_seen', 'true');
  };

  const handleUnfollowFlavor = async (flavor: string) => {
    const mod = await import('./services/notificationService');
    await mod.unsubscribeFromFlavor(flavor);
    setFollowedFlavors(prev => prev.filter(f => f !== flavor));
  };

  const handleFollowManualFlavor = async (flavor: string) => {
    const mod = await import('./services/notificationService');
    try {
      await mod.subscribeToFlavor(flavor);
      setFollowedFlavors(prev => [...new Set([...prev, flavor.toLowerCase()])]);
      setFlavorSearch('');
      setShowFlavorSuggestions(false);
    } catch (err) {
      console.error("Manual follow failed", err);
    }
  };

  const filteredFlavorSuggestions = useMemo(() => {
    if (!flavorSearch || flavorSearch.length < 2 || !Array.isArray(allFlavors)) return [];
    const currentFollowed = Array.isArray(followedFlavors) ? followedFlavors : [];
    
    return allFlavors
      .filter(f => f && f.toLowerCase().includes(flavorSearch.toLowerCase()) && !currentFollowed.includes(f.toLowerCase()))
      .slice(0, 5);
  }, [flavorSearch, allFlavors, followedFlavors]);

  const refreshShop = async (id: string) => {
    // Logic for refreshing a specific shop
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chains = useMemo(() => {
    const chainSet = new Set<string>();
    MILWAUKEE_SHOPS.forEach(shop => {
      if (shop.chain) chainSet.add(shop.chain);
    });
    return Array.from(chainSet).sort();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        trackEvent('location_access', { status: 'granted' });
      },
      (error) => {
        console.log('Location access denied or error:', error);
        setIsLocating(false);
        trackEvent('location_access', { status: 'denied', error: error.message });
        if (error.code === 1) {
          alert('Location access was denied. Please enable it in your browser settings to sort by proximity.');
        }
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    trackPageView(view);
    
    // Dynamic Title Update
    const baseTitle = "MKE Scoop | Milwaukee Frozen Custard";
    const viewSuffix = view === 'map' ? "Map" : view === 'favorites' ? "Favorites" : "Flavor Tracker";
    document.title = `${baseTitle} - ${viewSuffix}`;

    const refreshWatchlist = () => {
      import('./services/notificationService').then(mod => {
        mod.getSubscribedFlavors().then(setFollowedFlavors).catch(() => {});
      });
    };

    if (view === 'favorites') {
      refreshWatchlist();
      // Fetch master list for suggestions
      fetchMetadata().then(meta => setAllFlavors(meta.flavors)).catch(() => {});
    }

    window.addEventListener('watchlist-updated', refreshWatchlist);

    // Force scroll reset
    const resetScroll = () => {
      window.scrollTo(0, 0);
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
    };
    
    // Execute immediately and also on next frame to be safe
    resetScroll();
    requestAnimationFrame(resetScroll);

    return () => {
      window.removeEventListener('watchlist-updated', refreshWatchlist);
    };
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
                placeholder="Search stands or flavors..."
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
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 border-2 min-w-[110px] justify-center ${showOpenOnly ? 'bg-white border-white text-lake-blue' : 'bg-transparent border-white/20 text-white/80'}`}
              >
                <i className="fas fa-clock"></i>
                Open Now
              </button>

              <button 
                onClick={() => {
                  setShowOnlyFavorites(!showOnlyFavorites);
                  trackEvent('filter_toggle', { filter: 'favorites_only', value: !showOnlyFavorites });
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 border-2 min-w-[90px] justify-center ${showOnlyFavorites ? 'bg-brick-red border-brick-red text-white' : 'bg-transparent border-white/20 text-white/80'}`}
              >
                <i className="fas fa-heart"></i>
                Favs
              </button>

              <button 
                onClick={() => setSelectedChain(null)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-black transition-all border-2 min-w-[70px] justify-center ${selectedChain === null ? 'bg-mke-blue border-mke-blue text-white' : 'bg-transparent border-white/20 text-white/80'}`}
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

          {isDataStale && !syncMeta.isSyncing && (
            <div className="mb-6 px-4 py-3 bg-midnight-lake/5 dark:bg-sunrise-gold/10 border border-midnight-lake/10 dark:border-sunrise-gold/20 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-500">
              <div className="w-8 h-8 rounded-full bg-midnight-lake/10 dark:bg-sunrise-gold/20 flex items-center justify-center flex-shrink-0 text-midnight-lake dark:text-sunrise-gold">
                <i className="fas fa-clock text-xs"></i>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-midnight-lake/60 dark:text-sunrise-gold/80 mb-0.5">Early Bird?</p>
                <p className="text-xs font-bold text-midnight-lake dark:text-stone-200 leading-tight">
                  Menus update around 10:30 AM. These are likely yesterday's flavors.
                </p>
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
                      <i className="fas fa-location-arrow text-[8px] text-lake-blue"></i>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-mke-blue/60 dark:text-stone-500">Nearby First</span>
                    </div>
                  )}
                  {!userLocation && !isLocating && (
                    <button 
                      onClick={requestLocation}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-lake-blue/10 hover:bg-lake-blue/20 text-lake-blue transition-colors group"
                    >
                      <i className="fas fa-location-arrow text-[8px] group-hover:animate-bounce"></i>
                      <span className="text-[9px] font-black uppercase tracking-tighter">Near Me</span>
                    </button>
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
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-12">
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <i className="fas fa-heart text-brick-red text-2xl"></i>
                  <h2 className="font-black text-mke-blue dark:text-stone-100 text-2xl uppercase tracking-tighter">Favorite Stands</h2>
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
                  <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-white dark:bg-stone-800/50 rounded-[2.5rem] border-2 border-dashed border-stone-200 dark:border-stone-800 shadow-sm">
                    <div className="w-16 h-16 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <i className="fas fa-heart text-stone-200 dark:text-stone-700 text-2xl"></i>
                    </div>
                    <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-1">No Favorites Yet</h3>
                    <p className="text-stone-500 dark:text-stone-500 text-sm italic">
                      Tap the heart on any custard stand to keep it here.
                    </p>
                  </div>
                )}
              </div>

              {/* Watchlist Section */}
              <div className="pt-8 border-t border-stone-200 dark:border-stone-800 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-bell text-sunrise-gold text-2xl"></i>
                    <h2 className="font-black text-mke-blue dark:text-stone-100 text-2xl uppercase tracking-tighter">Your Watchlist</h2>
                  </div>
                  
                  {/* Manual Flavor Search */}
                  <div className="relative w-full md:w-64">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Add a favorite flavor..."
                        value={flavorSearch}
                        onChange={(e) => {
                          setFlavorSearch(e.target.value);
                          setShowFlavorSuggestions(true);
                        }}
                        onFocus={() => setShowFlavorSuggestions(true)}
                        className="w-full bg-stone-100 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-white/5 rounded-xl py-2 px-4 text-sm font-bold placeholder-stone-400 focus:outline-none focus:border-sunrise-gold transition-colors"
                      />
                      <button 
                        onClick={() => flavorSearch && handleFollowManualFlavor(flavorSearch)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-sunrise-gold text-mke-blue rounded-lg flex items-center justify-center text-xs active:scale-90 transition-transform"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>

                    {showFlavorSuggestions && filteredFlavorSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-800 border-2 border-stone-100 dark:border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {filteredFlavorSuggestions.map(suggestion => (
                          <button
                            key={suggestion}
                            onClick={() => handleFollowManualFlavor(suggestion)}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/5 border-b border-stone-50 dark:border-white/5 last:border-0 transition-colors uppercase tracking-tight"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {followedFlavors.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {followedFlavors.map(flavor => (
                      <div 
                        key={flavor}
                        className="flex items-center gap-3 pl-4 pr-2 py-2 bg-white dark:bg-mke-blue/40 border-2 border-stone-100 dark:border-white/5 rounded-2xl shadow-sm animate-in zoom-in-95 duration-200"
                      >
                        <span className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-tighter">
                          {flavor}
                        </span>
                        <button 
                          onClick={() => handleUnfollowFlavor(flavor)}
                          className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-red-500 transition-colors flex items-center justify-center"
                          aria-label={`Unfollow ${flavor}`}
                        >
                          <i className="fas fa-times text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6 bg-stone-50/50 dark:bg-midnight-lake/20 rounded-[2.5rem] border-2 border-stone-100 dark:border-white/5">
                    <p className="text-stone-400 dark:text-stone-600 text-sm italic">
                      You aren't following any flavors yet.
                    </p>
                  </div>
                )}
                <p className="mt-6 text-[10px] text-stone-400 dark:text-stone-600 leading-relaxed max-w-md italic">
                  When any stand in Milwaukee churns a flavor from your watchlist, we'll send a ping to your lock screen.
                </p>
              </div>
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

      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-28 right-6 w-12 h-12 rounded-full bg-sunrise-gold text-mke-blue shadow-2xl flex items-center justify-center animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300 z-30 active:scale-90 transition-transform"
          aria-label="Scroll to top"
        >
          <i className="fas fa-arrow-up text-lg"></i>
        </button>
      )}

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
          Made with ❤️ and Custard in The Real Cream City
        </p>
        <p className="text-[10px] text-mke-blue/60 dark:text-stone-700 italic tracking-widest">
        MKEScoop.com is an independent, unofficial enthusiast website and is not affiliated with, endorsed by, sponsored by, or maintaining any commercial relationship with Culver’s Franchising System, Inc., Kopp’s Frozen Custard, Leon's Frozen Custard, or any other entities listed.
        <br /><br />
        All trademarks, service marks, and company names are the property of their respective owners. The flavor data presented here is aggregated from public sources for informational purposes only. While we aim for accuracy, menus are subject to change by the vendors without notice. Please verify availability directly with the shop.
        </p>
      </footer>

      {showFollowHint && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-cream-city dark:bg-mke-blue border-2 border-sunrise-gold rounded-3xl p-5 shadow-2xl z-40 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-sunrise-gold flex items-center justify-center flex-shrink-0 text-mke-blue shadow-lg animate-bounce">
              <i className="fas fa-bell text-lg"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter mb-1">Never Miss a Flavor</h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-tight mb-3">
                Tap the <i className="far fa-bell text-sunrise-gold"></i> next to any flavor to get an alert when it's churning!
              </p>
              <button 
                onClick={handleFollowClick}
                className="px-4 py-1.5 rounded-full bg-mke-blue text-white dark:bg-sunrise-gold dark:text-mke-blue text-[10px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-sm"
              >
                Got it!
              </button>
            </div>
            <button 
              onClick={handleFollowClick}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors h-fit p-1"
              aria-label="Dismiss hint"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>
      )}

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