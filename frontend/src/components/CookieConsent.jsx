import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X, ScrollText, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY = "setu_cookie_consent_v2";

/**
 * Cookie + Terms consent banner.
 * Acceptance ("Accept all & I agree") binds the user to:
 *   • Cookie usage (analytics, preferences, session)
 *   • Terms & Conditions of IPO Labs AI Private Limited
 *   • Indemnification / Limitation of Liability / "As-Is" disclaimers
 * Persists once per browser; choice & timestamp stored in localStorage.
 */
const CookieConsent = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
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
        JSON.stringify({
          choice,
          accepted_terms: choice === "all",
          accepted_indemnity: choice === "all",
          accepted_liability_cap: choice === "all",
          accepted_as_is: choice === "all",
          ts: new Date().toISOString(),
          v: 2,
        })
      );
    } catch { /* storage may be blocked */ }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-500"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent and terms acceptance"
      data-testid="cookie-banner"
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 relative max-h-[80vh] overflow-y-auto">
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
          <div className="flex-1 pr-4">
            <h3 className="text-sm font-bold text-[#003366] mb-1">Cookies &amp; Terms</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              By clicking <strong>"Accept all &amp; agree"</strong>, you consent to our use of cookies <em>and</em> agree to be bound by the
              <button
                type="button"
                onClick={() => navigate("/disclaimer")}
                className="mx-1 text-[#003366] underline underline-offset-2 hover:text-[#00D1FF] font-medium"
                data-testid="cookie-terms-link"
              >
                Terms of Use
              </button>
              and
              <button
                type="button"
                onClick={() => navigate("/disclaimer")}
                className="mx-1 text-[#003366] underline underline-offset-2 hover:text-[#00D1FF] font-medium"
                data-testid="cookie-privacy-link"
              >
                Privacy &amp; Disclaimer Policy
              </button>
              of <strong>IPO Labs AI Private Limited</strong>, including the legal clauses summarised below.
            </p>
          </div>
        </div>

        {/* Expand to view full legal clauses */}
        <button
          type="button"
          onClick={() => setShowTerms((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#003366] hover:text-[#00D1FF] transition-colors"
          data-testid="cookie-expand-terms"
        >
          <ScrollText className="w-3.5 h-3.5" />
          {showTerms ? "Hide" : "Read"} the full legal clauses you are accepting
          {showTerms ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showTerms && (
          <div
            className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3 text-[10.5px] leading-relaxed text-gray-700"
            data-testid="cookie-legal-clauses"
          >
            <Clause
              icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
              title="1. Indemnification"
              testid="clause-indemnity"
            >
              To the maximum extent permitted by applicable law, the User agrees to indemnify, defend, and hold harmless
              <strong> IPO Labs AI Private Limited</strong>, its employees, its Directors, its subsidiaries and owners from
              and against any and all claims, damages, losses, liabilities, costs, or expenses (including attorney fees)
              arising from, or related to, their use of the platform, including but not limited to any delays, fines, or
              court cases, regardless of whether such claims arise before, during, or after the period of use.
            </Clause>

            <Clause
              icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
              title="2. Limitation of Liability"
              testid="clause-liability"
            >
              Under no circumstances shall <strong>IPO Labs AI Private Limited</strong>, its employees, its Directors,
              its subsidiaries and owners be held liable for any indirect, incidental, consequential, special, or
              exemplary damages, including but not limited to financial losses, delays, or legal proceedings, arising
              out of or in connection with the use or inability to use the platform.
            </Clause>

            <Clause
              icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
              title="3. 'As-Is' &amp; User-Risk Disclaimer"
              testid="clause-as-is"
            >
              The platform is provided on an <strong>'as-is'</strong> and <strong>'as-available'</strong> basis. You agree
              that your use of the platform is at your sole risk, and we (<strong>IPO Labs AI Private Limited</strong>,
              its employees, its Directors, its subsidiaries and owners) assume no responsibility for any outcome,
              including legal or financial repercussions, arising from your use of this service.
            </Clause>
          </div>
        )}

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
            Accept all &amp; agree
          </Button>
        </div>

        <p className="mt-2 text-[10px] text-gray-400 leading-snug text-center">
          Choosing "Essential only" will keep the site working but you will not be able to use the full platform. Full use requires acceptance.
        </p>
      </div>
    </div>
  );
};

const Clause = ({ icon, title, children, testid }) => (
  <div className="flex items-start gap-2" data-testid={testid}>
    <div className="mt-0.5 flex-shrink-0">{icon}</div>
    <div>
      <div className="font-semibold text-gray-900 mb-0.5">{title}</div>
      <p>{children}</p>
    </div>
  </div>
);

export default CookieConsent;
