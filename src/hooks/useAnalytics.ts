import { useCallback } from "react";

type EventParams = Record<string, string | number | boolean>;

export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, params?: EventParams) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, params || {});
      // Opcional: para depurar en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.log(`[GA4] Event: ${eventName}`, params);
      }
    }
  }, []);

  return { trackEvent };
};
