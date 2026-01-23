export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia('(display-mode: standalone)').matches) || ((window as any).navigator.standalone === true);
};
