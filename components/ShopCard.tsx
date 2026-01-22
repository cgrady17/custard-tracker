import React, { useState, useRef, useLayoutEffect, useEffect, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { CustardShop, FlavorStatus, FlavorDetail } from '../types';
import { trackEvent } from '../services/analytics';
import { getShopStatus } from '../services/dataService';

const ScheduleModal = lazy(() => import('./ScheduleModal'));

interface ShopCardProps {
  shop: CustardShop;
  status?: FlavorStatus;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onRefresh: (id: string) => void;
  compact?: boolean;
  isPriority?: boolean;
}

const ImageModal: React.FC<{ src: string; alt: string; name: string; description?: string; onClose: () => void }> = ({ src, alt, name, description, onClose }) => {
  return createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors z-10"
      >
        <i className="fas fa-times"></i>
      </button>
      
      <div className="relative max-w-4xl w-full flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
        />
        
        <div className="text-center space-y-2 animate-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {name}
          </h2>
          {description && (
            <p className="text-sm sm:text-base text-stone-300 italic max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const FlavorItem: React.FC<{ flavor: FlavorDetail; isSingle: boolean; index: number; isPriority: boolean }> = ({ flavor, isSingle, index, isPriority }) => {
  const [showDesc, setShowDesc] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkSub = () => {
      import('../services/notificationService').then(mod => {
        mod.getSubscribedFlavors().then(subs => {
          if (subs.includes(flavor.name.toLowerCase())) {
            setIsSubscribed(true);
          } else {
            setIsSubscribed(false);
          }
        }).catch(() => {});
      });
    };

    // Initial check with delay for environment ready
    const timer = setTimeout(checkSub, 1500);

    // Listen for updates from other cards
    window.addEventListener('watchlist-updated', checkSub);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('watchlist-updated', checkSub);
    };
  }, [flavor.name]);

  const handleToggleSubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { subscribeToFlavor, unsubscribeFromFlavor } = await import('../services/notificationService');
      if (isSubscribed) {
        await unsubscribeFromFlavor(flavor.name);
        setIsSubscribed(false);
      } else {
        await subscribeToFlavor(flavor.name);
        setIsSubscribed(true);
      }
      window.dispatchEvent(new CustomEvent('watchlist-updated'));
    } catch (err) {
      console.error("Subscription failed", err);
    }
  };

  useLayoutEffect(() => {
    const element = descriptionRef.current;
    if (element) {
      setIsOverflowing(element.scrollHeight > element.offsetHeight);
    }
  }, [flavor.description]);

  return (
    <>
      <div className={`flex flex-col bg-white dark:bg-midnight-lake/50 rounded-2xl overflow-hidden border border-stone-100 dark:border-white/5 shadow-sm transition-all ${isSingle ? 'w-full' : 'flex-1 min-w-[140px]'}`}>
        {flavor.imageUrl && (
          <div 
            className="relative w-full bg-stone-100 dark:bg-stone-800 overflow-hidden group cursor-pointer aspect-[16/9]" 
            onClick={() => setShowModal(true)}
          >
            <img 
              src={flavor.imageUrl} 
              alt={flavor.name}
              width="400"
              height="225"
              loading={isPriority && index === 0 ? "eager" : "lazy"}
              fetchPriority={isPriority && index === 0 ? "high" : "auto"}
              decoding="async"
              sizes="(max-width: 640px) 100vw, 400px"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="p-3 flex flex-col justify-between flex-1">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-sm font-black text-stone-900 dark:text-stone-100 leading-tight pr-2">{flavor.name}</h4>
              <button 
                onClick={handleToggleSubscribe}
                className={`flex-shrink-0 transition-colors ${isSubscribed ? 'text-sunrise-gold' : 'text-stone-300 dark:text-stone-700 hover:text-stone-400'}`}
                aria-label={isSubscribed ? "Unsubscribe from flavor" : "Notify me when this flavor is available"}
              >
                <i className={`${isSubscribed ? 'fas' : 'far'} fa-bell text-[10px]`}></i>
              </button>
            </div>
            {flavor.description && (
              <div className="relative">
                <p 
                  ref={descriptionRef}
                  className={`text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed italic ${showDesc ? '' : 'line-clamp-2'}`}
                >
                  {flavor.description}
                </p>
                {(isOverflowing || showDesc) && (
                  <button 
                    onClick={() => setShowDesc(!showDesc)}
                    className="text-[9px] font-bold text-lake-blue dark:text-sunrise-gold uppercase mt-1"
                  >
                    {showDesc ? 'Less' : 'More...'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {showModal && flavor.imageUrl && (
        <ImageModal 
          src={flavor.imageUrl} 
          alt={flavor.name} 
          name={flavor.name}
          description={flavor.description}
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
};

const MonthlyFeatureItem: React.FC<{ feature: FlavorDetail }> = ({ feature }) => {
  const [showDesc, setShowDesc] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const element = descriptionRef.current;
    if (element) {
      setIsOverflowing(element.scrollHeight > element.offsetHeight);
    }
  }, [feature.description]);

  return (
    <div className="flex items-start gap-2.5 bg-white dark:bg-midnight-lake/50 p-2.5 rounded-xl border border-stone-100 dark:border-white/5">
      <div className="w-6 h-6 rounded-full bg-sunrise-gold/20 flex items-center justify-center flex-shrink-0 text-sunrise-gold mt-0.5">
          {feature.type === 'monthly_shake' ? <i className="fas fa-wine-glass-alt text-[10px]"></i> : 
           feature.type === 'monthly_sundae' ? <i className="fas fa-ice-cream text-[10px]"></i> :
           <i className="fas fa-calendar-alt text-[10px]"></i>}
      </div>
      <div className="min-w-0 w-full">
          <p className="text-[10px] font-bold text-stone-800 dark:text-stone-200 leading-tight mb-0.5">{feature.name}</p>
          <div className="relative">
            <p 
              ref={descriptionRef}
              className={`text-[9px] text-stone-400 dark:text-stone-500 leading-snug italic ${showDesc ? '' : 'line-clamp-2'}`}
            >
                {feature.description !== "See website for details." && feature.description !== "Flavor of the Month" && feature.description !== "Shake of the Month" && feature.description !== "Sundae of the Month" 
                 ? feature.description 
                 : (feature.type?.replace('monthly_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Feature')}
            </p>
            {(isOverflowing || showDesc) && (
              <button 
                onClick={() => setShowDesc(!showDesc)}
                className="text-[8px] font-bold text-lake-blue dark:text-sunrise-gold uppercase mt-0.5 hover:text-lake-blue dark:hover:text-sunrise-gold"
              >
                {showDesc ? 'Less' : 'More...'}
              </button>
            )}
          </div>
      </div>
    </div>
  );
};

const ShopCard: React.FC<ShopCardProps> = ({ 
  shop, 
  status, 
  isFavorite, 
  onToggleFavorite,
  onRefresh,
  compact = false,
  isPriority = false
}) => {
  const [selectedDateISO, setSelectedDateISO] = useState<string>('today');
  const [showSchedule, setShowSchedule] = useState(false);
  
  const { isOpen, statusMessage } = getShopStatus(shop);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`;
  
  const hasFlavors = status?.flavors && status.flavors.length > 0;
  const hasUpcoming = status?.upcoming && status.upcoming.length > 0;

  const dailyFlavors = status?.flavors.filter(f => !f.type || f.type === 'daily') || [];
  const monthlyFlavors = status?.flavors.filter(f => f.type && f.type !== 'daily') || [];

  const getDisplayedFlavors = () => {
    if (selectedDateISO === 'today') {
      return dailyFlavors;
    }
    const found = status?.upcoming?.find(u => u.date === selectedDateISO);
    return found?.flavors || [];
  };

  const currentFlavors = getDisplayedFlavors();

  if (compact) {
    return (
      <div className="flex-shrink-0 w-64 bg-white dark:bg-mke-blue/40 rounded-3xl p-4 shadow-sm border border-stone-100 dark:border-white/10 mr-3 transition-[transform,background-color] active:scale-[0.98] touch-pan-y">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 truncate pr-2">
            <div className="flex items-center gap-1.5 mb-0.5">
               <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 truncate">{shop.name}</h3>
               {typeof isOpen !== 'undefined' && (
                 <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
               )}
            </div>
            {statusMessage && (
              <p className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-tight truncate">{statusMessage}</p>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(shop.id); }}
            className="text-red-500 text-sm"
          >
            <i className="fas fa-heart"></i>
          </button>
        </div>
        <div className="bg-sunrise-gold/10 dark:bg-sunrise-gold/5 rounded-xl p-3 min-h-[60px] flex flex-col justify-center">
          {status?.isLoading ? (
            <div className="w-4 h-4 border-2 border-sunrise-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          ) : (
            <p className="text-xs font-bold text-stone-900 dark:text-stone-200 line-clamp-2 text-center">
              {dailyFlavors.length > 0 ? dailyFlavors.map(f => f.name).join(" & ") : (hasFlavors ? "Check Monthly Features" : "Refresh to check")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-mke-blue/40 rounded-3xl p-5 shadow-sm border-2 transition-all flex flex-col h-full ${
      isFavorite 
        ? 'border-brick-red/20 dark:border-brick-red/40 shadow-brick-red/5 dark:neon-glow-red' 
        : 'border-stone-100 dark:border-toasted-cream/20'
    } ${isOpen ? 'dark:neon-glow-gold' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative w-5 h-5 flex-shrink-0">
              <div 
                className="absolute inset-0 rounded-full" 
                style={{ backgroundColor: shop.brandColor || '#d4a373' }}
              />
              {shop.logoUrl && (
                <img 
                  src={shop.logoUrl} 
                  alt={`${shop.name} logo`} 
                  width="20"
                  height="20"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full rounded-full object-contain bg-white shadow-sm p-[1px] transition-opacity duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '0';
                  }} 
                />
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 truncate">{shop.name}</h3>
            {isFavorite && (
              <span className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                Fav
              </span>
            )}
          </div>
          
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-2 leading-tight truncate">{shop.address}</p>
          
          <div className="flex items-center gap-2">
            {statusMessage ? (
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${isOpen ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-wider truncate">{statusMessage}</span>
              </div>
            ) : (
               <div className="text-[9px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest italic">Hours unavailable</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 ml-2">
          <button 
            onClick={() => {
              onToggleFavorite(shop.id);
              trackEvent('favorite_toggle', { shop_id: shop.id, shop_name: shop.name, value: !isFavorite });
            }}
            className={`text-xl transition-all ${isFavorite ? 'text-red-500 scale-110' : 'text-stone-300 dark:text-stone-700 hover:text-stone-400 dark:hover:text-stone-600'}`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <i className={isFavorite ? "fas fa-heart" : "far fa-heart"}></i>
          </button>
        </div>
      </div>

      <div className="bg-cream-city dark:bg-midnight-lake/40 rounded-2xl p-4 min-h-[180px] flex flex-col relative border border-cream-city-dark dark:border-white/5 flex-1">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
             <i className="fas fa-ice-cream text-sunrise-gold text-xs"></i>
             <p className="text-[9px] uppercase tracking-[0.2em] text-mke-blue/60 dark:text-stone-400 font-black">
               {selectedDateISO === 'today' ? "Today's Flavors" : "Upcoming Flavor"}
             </p>
          </div>
          
          {hasUpcoming && (
            <button 
              onClick={() => {
                setShowSchedule(true);
                trackEvent('view_full_schedule', { shop_id: shop.id, shop_name: shop.name });
              }}
              className="text-[8px] font-black text-mke-blue/40 dark:text-stone-500 hover:text-sunrise-gold uppercase tracking-widest transition-colors"
            >
              Full Schedule <i className="fas fa-calendar-alt ml-1"></i>
            </button>
          )}
        </div>

        {hasUpcoming && (
          <div className="flex flex-wrap gap-1.5 mb-4 pb-1 scroll-smooth snap-x snap-mandatory">
            <button 
              onClick={() => {
                setSelectedDateISO('today');
                trackEvent('select_flavor_date', { shop_id: shop.id, date: 'today' });
              }}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all flex-shrink-0 snap-start ${selectedDateISO === 'today' ? 'bg-sunrise-gold text-mke-blue shadow-sm' : 'bg-white dark:bg-stone-800 text-mke-blue/40 dark:text-stone-500 border border-stone-100 dark:border-stone-700'}`}
            >
              Today
            </button>
            {status?.upcoming?.slice(0, 6).map((day) => (
              <button 
                key={day.date}
                onClick={() => {
                  setSelectedDateISO(day.date);
                  trackEvent('select_flavor_date', { shop_id: shop.id, date: day.date });
                }}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all flex-shrink-0 snap-start ${selectedDateISO === day.date ? 'bg-sunrise-gold text-mke-blue shadow-sm' : 'bg-white dark:bg-stone-800 text-mke-blue/40 dark:text-stone-500 border border-stone-100 dark:border-stone-700'}`}
              >
                {new Date(day.date + 'T12:00:00').toLocaleDateString([], { weekday: 'short' })}
              </button>
            ))}
          </div>
        )}

        {status?.isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-12 flex-1">
            <div className="w-6 h-6 border-4 border-sunrise-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[9px] text-sunrise-gold font-black uppercase tracking-widest">Scanning Stand...</p>
          </div>
        ) : currentFlavors.length > 0 ? (
          <div className="flex flex-col gap-3 flex-1 animate-in fade-in slide-in-from-right-2 duration-300" key={selectedDateISO}>
            {currentFlavors.map((flavor, idx) => (
              <FlavorItem key={`${selectedDateISO}-${idx}`} flavor={flavor} isSingle={currentFlavors.length === 1} index={idx} isPriority={isPriority && selectedDateISO === 'today'} />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center flex-1 flex items-center justify-center">
             <p className="text-stone-400 dark:text-stone-500 text-xs italic font-medium">No flavor data posted for this date.</p>
          </div>
        )}

        {selectedDateISO === 'today' && monthlyFlavors.length > 0 && !status?.isLoading && (
            <div className="mt-4 pt-3 border-t border-stone-200/50 dark:border-stone-800">
                <p className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3 pl-1">Monthly Features</p>
                <div className="grid gap-2">
                    {monthlyFlavors.map((f, idx) => (
                        <MonthlyFeatureItem key={idx} feature={f} />
                    ))}
                </div>
            </div>
        )}

        <div className="flex flex-col justify-between items-start mt-4 pt-3 border-t border-stone-200/50 dark:border-stone-800 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {status?.lastUpdated && (
              <p className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-tighter">
                Checked: {new Date(status.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {status?.sources && status.sources.length > 0 && (
              <a 
                href={status.sources[0].uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[8px] sm:text-[9px] bg-white dark:bg-stone-800 px-2 py-1 rounded-md text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors font-bold flex items-center gap-1"
              >
                <i className="fas fa-link text-[7px]"></i> Sources
              </a>
            )}
          </div>

          <div className="flex items-center gap-4 w-full justify-between">
            <a 
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('get_directions', { shop_id: shop.id, shop_name: shop.name })}
              className="text-[10px] sm:text-[11px] font-black text-mke-blue dark:text-stone-300 hover:text-lake-blue dark:hover:text-stone-100 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 shadow-sm transition-all"
            >
              <i className="fas fa-directions text-lake-blue"></i>
              DIRECTIONS
            </a>
            
            {shop.website && (
              <a 
                href={shop.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('visit_website', { shop_id: shop.id, shop_name: shop.name })}
                className="text-[10px] sm:text-[11px] font-black text-lake-blue dark:text-sunrise-gold hover:text-mke-blue dark:hover:text-white flex items-center gap-1"
              >
                WEBSITE <i className="fas fa-chevron-right text-[8px]"></i>
              </a>
            )}
          </div>
        </div>
      </div>
      {showSchedule && status?.upcoming && (
        <Suspense fallback={null}>
          <ScheduleModal 
            shop={shop} 
            upcoming={status.upcoming} 
            onClose={() => setShowSchedule(false)} 
          />
        </Suspense>
      )}
    </div>
  );
};

export default ShopCard;