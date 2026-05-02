import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "setu_cookie_consent_v1";

/**
 * Standard cookie consent banner.
 * - Shows once per visitor until accepted/rejected (localStorage-persisted).
 * - "Accept All"  → stores { choice: "all", ts }
 * - "Essential only" → stores { choice: "essential", ts }
 * - Privacy link → /disclaimer (the existing Privacy Policy / Disclaimer page).
 */
const CookieConsent = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Defer 600 ms so the banner doesn't compete with hero animations
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const persist = (choice) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, ts: new Date().toISOString() })
      );
    } catch { /* storage may be blocked — fine */ }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-500"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      data-testid="cookie-banner"
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 relative">
        <button
          type="button"
          onClick={() => persist("essential")}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss (essential only)"
          data-testid="cookie-close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#003366] mb-1">We value your privacy</h3>
            <p className="text-xs text-gray-600 leading-relaxed pr-4">
              We use cookies to keep you signed in, remember your preferences, and analyse traffic so we can improve SETU.
              You can accept all cookies or continue with only the ones essential for the site to work.
              Read our{" "}
              <button
                type="button"
                onClick={() => navigate("/disclaimer")}
                className="text-[#003366] underline underline-offset-2 hover:text-[#00D1FF] font-medium"
                data-testid="cookie-privacy-link"
              >
                Privacy Policy
              </button>
              {" "}for details.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => persist("essential")}
            variant="outline"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs h-9"
            data-testid="cookie-reject"
          >
            Essential only
          </Button>
          <Button
            onClick={() => persist("all")}
            className="flex-1 bg-[#003366] hover:bg-[#002244] text-white rounded-full text-xs h-9 shadow-md"
            data-testid="cookie-accept"
          >
            Accept all cookies
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
