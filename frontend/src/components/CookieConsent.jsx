import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X, ScrollText, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";

const STORAGE_KEY = "setu_cookie_consent_v2";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Cookie + Terms consent banner.
 * Server-backed:
 *   • On mount, asks the backend whether the visitor (by IP and/or logged-in user)
 *     has already accepted at the current clause version. If yes, banner stays hidden.
 *   • "Accept all & agree" POSTs the consent payload to /api/consent which
 *     records IP + user_id + user_email + UA + timestamp, and stamps a "skip"
 *     ledger so future visits/logins from the same IP or user skip the banner.
 *   • "Essential only" is NOT recorded as skip → the banner re-appears on the
 *     next login / new session (per requirement).
 */
const CookieConsent = ({ user }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Decide whether to show the banner. We re-run when login state changes
  // so that a logged-in user who previously dismissed as "essential" sees
  // the banner again post-login.
  useEffect(() => {
    let cancelled = false;
    const decide = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/consent/status`, { withCredentials: true });
        if (cancelled) return;
        const shouldShow = res.data?.should_show !== false;
        if (!shouldShow) {
          setOpen(false);
          // Mirror backend decision into local cache so subsequent navigations
          // don't even hit the network.
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice: "all", server_skip: true, ts: new Date().toISOString(), v: 2 })); } catch {}
          return;
        }
        // Server says show → defer 600 ms so the banner doesn't compete with hero animations
        const t = setTimeout(() => !cancelled && setOpen(true), 600);
        return () => clearTimeout(t);
      } catch {
        // Backend unreachable — fall back to local localStorage flag
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          const parsed = saved ? JSON.parse(saved) : null;
          if (!parsed || parsed.choice !== "all") {
            const t = setTimeout(() => !cancelled && setOpen(true), 600);
            return () => clearTimeout(t);
          }
        } catch {
          if (!cancelled) setOpen(true);
        }
      }
    };
    decide();
    return () => { cancelled = true; };
  }, [user?.user_id]);

  const persist = async (choice) => {
    setSubmitting(true);
    const accepted = choice === "all";
    const payload = {
      choice,
      accepted_terms: accepted,
      accepted_indemnity: accepted,
      accepted_liability_cap: accepted,
      accepted_as_is: accepted,
    };

    // Local cache (so the banner doesn't flash on next nav within the same session)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, ts: new Date().toISOString(), v: 2 }));
    } catch { /* storage may be blocked */ }

    // Server-side ledger (records IP, user_id if logged in, user-agent, timestamp)
    try {
      await axios.post(`${BACKEND_URL}/api/consent`, payload, { withCredentials: true });
    } catch (err) {
      // Best-effort: even if the server call fails, dismiss the banner so we
      // don't trap the user. Local cache will still hide it for this session.
      console.warn("[consent] server log failed, kept local-only:", err?.message || err);
    } finally {
      setSubmitting(false);
      setOpen(false);
    }
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
          disabled={submitting}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
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
            <Clause icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />} title="1. Indemnification" testid="clause-indemnity">
              To the maximum extent permitted by applicable law, the User agrees to indemnify, defend, and hold harmless
              <strong> IPO Labs AI Private Limited</strong>, its employees, its Directors, its subsidiaries and owners from
              and against any and all claims, damages, losses, liabilities, costs, or expenses (including attorney fees)
              arising from, or related to, their use of the platform, including but not limited to any delays, fines, or
              court cases, regardless of whether such claims arise before, during, or after the period of use.
            </Clause>
            <Clause icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />} title="2. Limitation of Liability" testid="clause-liability">
              Under no circumstances shall <strong>IPO Labs AI Private Limited</strong>, its employees, its Directors,
              its subsidiaries and owners be held liable for any indirect, incidental, consequential, special, or
              exemplary damages, including but not limited to financial losses, delays, or legal proceedings, arising
              out of or in connection with the use or inability to use the platform.
            </Clause>
            <Clause icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />} title="3. 'As-Is' &amp; User-Risk Disclaimer" testid="clause-as-is">
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
            disabled={submitting}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full text-xs h-9"
            data-testid="cookie-reject"
          >
            Essential only
          </Button>
          <Button
            onClick={() => persist("all")}
            disabled={submitting}
            className="flex-1 bg-[#003366] hover:bg-[#002244] text-white rounded-full text-xs h-9 shadow-md"
            data-testid="cookie-accept"
          >
            {submitting ? "Saving…" : "Accept all & agree"}
          </Button>
        </div>

        <p className="mt-2 text-[10px] text-gray-400 leading-snug text-center">
          Choosing "Essential only" will keep the site working — but the banner will reappear at your next login. Full use requires acceptance.
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
