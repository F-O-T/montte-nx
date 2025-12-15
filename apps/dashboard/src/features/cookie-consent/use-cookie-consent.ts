import { useEffect, useState } from "react";

const STORAGE_KEY = "montte-cookie-consent";

export type ConsentStatus = "accepted" | "declined" | null;

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") {
      setConsent(stored as ConsentStatus);
    }
    setIsHydrated(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setConsent("declined");
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConsent(null);
  };

  return { consent, accept, decline, reset, isHydrated };
}
