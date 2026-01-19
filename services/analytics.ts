
/**
 * Analytics utility for tracking user interactions in MKE Scoop
 */

export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};

export const trackPageView = (pageName: string) => {
  trackEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href,
    page_path: window.location.pathname
  });
};
