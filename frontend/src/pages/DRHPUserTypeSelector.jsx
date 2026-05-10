import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowRight, Briefcase, Building2, Calculator, Sparkles, Shield,
  HelpCircle, Loader2,
} from "lucide-react";

const CARDS = [
  {
    id: "merchant_banker",
    title: "Merchant Banker",
    desc: "Add multiple projects under your firm. Manage DRHP filings across your portfolio of IPO mandates.",
    icon: Briefcase,
    accent: "#00D1FF",
    iconGrad: "from-[#003366] to-[#0052A3]",
    cta: "Continue",
    testid: "drhp-user-type-merchant_banker",
  },
  {
    id: "company",
    title: "Company",
    desc: "Add and manage your own corporate DRHP. Build your prospectus with SEBI-compliant templates.",
    icon: Building2,
    accent: "#34D399",
    iconGrad: "from-emerald-500 to-teal-600",
    cta: "Continue",
    testid: "drhp-user-type-company",
  },
  {
    id: "ca_firm",
    title: "CA Firm",
    desc: "Add multiple projects under your firm. Review and certify financial statements for DRHP filings.",
    icon: Calculator,
    accent: "#FB923C",
    iconGrad: "from-amber-500 to-orange-600",
    cta: "Continue",
    testid: "drhp-user-type-ca_firm",
  },
];

const REFERRAL_OPTIONS = ["Friends", "Google", "Event", "Reference"];

const DRHPUserTypeSelector = ({ user, apiClient }) => {
  const navigate = useNavigate();

  const [bootstrapping, setBootstrapping] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingType, setPendingType] = useState(null);  // type chosen at click
  const [savedProfile, setSavedProfile] = useState(null); // existing onboarding doc, if any
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    full_name: user?.name || "",
    mobile: user?.phone || "",
    email: user?.email || "",
    website: "",
    referral_source: "",
    firm_address: "",
    firm_logo_url: "",
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

  const isAdmin = user?.is_admin === true;

  // On mount: check if user has already onboarded → redirect, else show selector.
  // Admins are always given the full selector with all 3 modules — no auto-redirect, no modal.
  useEffect(() => {
    if (isAdmin) {
      setBootstrapping(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await apiClient.get("/account/drhp-onboarding");
        if (cancelled) return;
        if (r.data?.completed && r.data?.user_login_type) {
          navigate(`/drhp/${r.data.user_login_type}`, { replace: true });
          return;
        }
        if (r.data?.completed) {
          // capture saved values so we don't ask again on subsequent clicks
          setSavedProfile(r.data);
          setForm((f) => ({
            ...f,
            company_name: r.data.company_name || f.company_name,
            full_name: r.data.full_name || f.full_name,
            mobile: r.data.mobile || f.mobile,
            email: r.data.email || f.email,
            website: r.data.website || "",
            referral_source: r.data.referral_source || "",
            firm_address: r.data.firm_address || "",
            firm_logo_url: r.data.firm_logo_url || "",
          }));
        }
      } catch {
        // first-time user — leave selector visible
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiClient, navigate, isAdmin]);

  const handleCardClick = (typeId) => {
    // Admins: full access, no popup, no persisted type — straight to the chosen module.
    if (isAdmin) {
      navigate(`/drhp/${typeId}`);
      return;
    }
    // Already onboarded once? Skip the form, just persist the chosen type and route.
    if (savedProfile) {
      apiClient.post("/account/drhp-onboarding", { ...savedProfile, user_login_type: typeId }).catch(() => {});
      navigate(`/drhp/${typeId}`);
      return;
    }
    setPendingType(typeId);
    setShowOnboarding(true);
  };

  const validateForm = () => {
    const errors = [];
    const isFirmType = pendingType === "merchant_banker" || pendingType === "ca_firm";
    if (isFirmType) {
      // New firm onboarding: only Firm Name + Address required (Website + Logo are optional)
      if (!form.company_name.trim()) errors.push("Firm Name");
      if (!form.firm_address.trim()) errors.push("Address");
    } else {
      if (!form.company_name.trim()) errors.push("Company name");
      if (!form.full_name.trim()) errors.push("Full name");
      if (!form.mobile.trim()) errors.push("Mobile");
      if (!form.email.trim()) errors.push("Email");
    }
    if (errors.length) {
      toast.error(`${errors.join(", ")} — required`);
      return false;
    }
    return true;
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Logo must be 5 MB or smaller"); return; }
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiClient.post("/account/drhp-onboarding/logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, firm_logo_url: res.data.logo_url }));
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Logo upload failed");
    }
    setLogoUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const removeLogo = () => setForm((f) => ({ ...f, firm_logo_url: "" }));

  const handleSubmit = async () => {
    if (!validateForm() || !pendingType) return;
    setSubmitting(true);
    try {
      // Default identity fields when the firm-onboarding flow doesn't ask for them
      const payload = {
        user_login_type: pendingType,
        ...form,
        full_name: form.full_name || user?.name || form.company_name || "Firm Admin",
        mobile: form.mobile || user?.phone || "",
        email: form.email || user?.email || "",
      };
      await apiClient.post("/account/drhp-onboarding", payload);
      toast.success("Profile saved — taking you in.");
      navigate(`/drhp/${pendingType}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save your profile");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCard = CARDS.find((c) => c.id === pendingType);

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Checking your profile…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white" data-testid="drhp-user-type-selector">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64 relative overflow-hidden">
        <div className="relative z-10 min-h-screen flex flex-col">
          <header
            className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-gray-200 px-8 lg:px-16 py-4 flex items-center justify-between"
            data-testid="drhp-header"
          >
            <h1
              className="text-lg lg:text-xl font-semibold tracking-tight text-gray-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              DRHP Builder
            </h1>
          </header>

          <section className="px-8 lg:px-16 pt-12 lg:pt-16 pb-8 max-w-5xl" data-testid="drhp-hero">
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-semibold tracking-tight text-gray-900 leading-[1.08]">
              Build Audit-Ready DRHPs with{" "}
              <span className="text-[#00D1FF]">SEBI-Grade Precision.</span>
            </h2>
            <p className="mt-5 text-gray-900/75 text-[13px] lg:text-sm leading-relaxed max-w-2xl">
              Manage &quot;Multiple&quot; DRHP&apos;s through &quot;Multiple&quot; Project Teams remotely.
            </p>
          </section>

          <section className="px-8 lg:px-16 pb-12 flex-1" data-testid="drhp-cards">
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 flex gap-4">
                {CARDS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <Card
                      key={c.id}
                      onClick={() => handleCardClick(c.id)}
                      className="bg-white border border-gray-200 backdrop-blur-xl border-2 border-gray-200 hover:bg-blue-50 cursor-pointer group shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full"
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.boxShadow = `0 20px 40px -10px ${c.accent}40`; }}
                      data-testid={c.testid}
                    >
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.iconGrad} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-gray-900" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug mb-1.5">
                          {c.title}
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3 flex-1">
                          {c.desc}
                        </p>
                        <div
                          className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all"
                          style={{ color: c.accent }}
                        >
                          {c.cta} <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="space-y-4">
                <Card className="bg-white border border-gray-200 backdrop-blur-xl border border-gray-200">
                  <CardContent className="p-4">
                    <h3 className="text-xs font-semibold text-gray-900 mb-3">How It Works</h3>
                    <div className="space-y-3">
                      {["Choose Profile", "Create Workspace", "Upload Documents", "Build DRHP"].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-cyan-400">{i + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-xs">{step}</h4>
                            <p className="text-[10px] text-gray-400">
                              {i === 0 && "Merchant Banker, Company, or CA Firm"}
                              {i === 1 && "Secure, role-based project environment"}
                              {i === 2 && "Upload corporate documents & financials"}
                              {i === 3 && "SEBI-compliant DRHP generation"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-600/80 to-blue-700/80 backdrop-blur-xl border border-cyan-400/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs font-medium text-gray-900">Quick Start</span>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-2">New to DRHP?</h3>
                    <p className="text-[10px] text-cyan-100 mb-3">
                      Select &quot;Company&quot; profile to start building your DRHP with guided templates.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleCardClick("company")}
                      className="w-full bg-white text-cyan-700 hover:bg-cyan-50 gap-1.5 h-8 text-xs"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Start as Company
                    </Button>
                  </CardContent>
                </Card>

                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800">
                      All documents are encrypted and stored securely. SEBI compliance verified at every step.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ─── First-time onboarding modal ─── */}
      <Dialog open={showOnboarding} onOpenChange={(o) => !submitting && setShowOnboarding(o)}>
        <DialogContent className="sm:max-w-lg" data-testid="drhp-onboarding-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingCard?.icon && (
                <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${pendingCard.iconGrad} flex items-center justify-center`}>
                  <pendingCard.icon className="w-4 h-4 text-white" />
                </span>
              )}
              {pendingType === "merchant_banker" || pendingType === "ca_firm"
                ? `Set up your ${pendingCard?.title} firm`
                : <>Welcome — let&apos;s set up your {pendingCard?.title || "DRHP"} workspace</>}
            </DialogTitle>
            <DialogDescription>
              {pendingType === "merchant_banker" || pendingType === "ca_firm"
                ? "Tell us about your firm. We'll use this branding across your Corporate Admin Panel and DRHP outputs."
                : "We'll only ask once. Your details stay with us, encrypted and never shared."}
            </DialogDescription>
          </DialogHeader>

          {(pendingType === "merchant_banker" || pendingType === "ca_firm") ? (
            // ─── FIRM ONBOARDING (Merchant Banker / CA Firm) ───
            <div className="space-y-3.5 py-2">
              <FormField
                label="Firm Name" required
                value={form.company_name}
                onChange={(v) => setForm((f) => ({ ...f, company_name: v }))}
                placeholder={pendingType === "merchant_banker" ? "Acme Capital Pvt Ltd" : "Acme & Associates LLP"}
                testid="onboard-firm-name"
              />
              <FormField
                label="Website"
                value={form.website}
                onChange={(v) => setForm((f) => ({ ...f, website: v }))}
                placeholder="https://yourfirm.com"
                testid="onboard-firm-website"
              />
              <div>
                <label className="text-[11px] font-semibold text-gray-700 mb-1 block">
                  Address <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={form.firm_address}
                  onChange={(e) => setForm((f) => ({ ...f, firm_address: e.target.value }))}
                  placeholder="Registered office address — building, street, city, state, PIN"
                  className="min-h-[72px] text-sm border-gray-300 focus-visible:ring-[#1DA1F2]"
                  data-testid="onboard-firm-address"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-700 mb-1 block">
                  Upload Logo <span className="text-gray-400 font-normal">(PNG, JPG, WEBP, SVG · max 5 MB)</span>
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg,image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  data-testid="onboard-firm-logo-input"
                />
                {form.firm_logo_url ? (
                  <div className="flex items-center gap-3 p-2.5 border border-blue-200 bg-blue-50/40 rounded-md" data-testid="onboard-firm-logo-preview">
                    <img src={form.firm_logo_url} alt="Firm logo" className="w-12 h-12 object-contain rounded bg-white border" />
                    <span className="text-[12px] text-gray-700 flex-1">Logo uploaded</span>
                    <button onClick={() => logoInputRef.current?.click()} className="text-[11px] text-[#1DA1F2] hover:text-blue-700 font-semibold">Replace</button>
                    <button onClick={removeLogo} className="text-gray-400 hover:text-red-500" title="Remove">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="w-full flex items-center justify-center gap-2 h-20 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#1DA1F2] hover:bg-blue-50/40 transition text-[12px] text-gray-600"
                    data-testid="onboard-firm-logo-upload-btn"
                  >
                    {logoUploading
                      ? <><Loader2 className="w-4 h-4 animate-spin text-[#1DA1F2]" /> Uploading…</>
                      : <><ImageIcon className="w-4 h-4 text-[#1DA1F2]" /> <Upload className="w-3.5 h-3.5 text-gray-400" /> Click to upload your firm logo</>
                    }
                  </button>
                )}
              </div>
            </div>
          ) : (
            // ─── COMPANY ONBOARDING (existing flow) ───
            <div className="grid grid-cols-2 gap-3 py-2">
              <FormField label="Company name" required value={form.company_name}
                onChange={(v) => setForm((f) => ({ ...f, company_name: v }))}
                placeholder="Your company name"
                testid="onboard-company_name" />
              <FormField label="Full name" required value={form.full_name}
                onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
                placeholder="Your full name"
                testid="onboard-full_name" />
              <FormField label="Mobile" required value={form.mobile} type="tel"
                onChange={(v) => setForm((f) => ({ ...f, mobile: v }))}
                placeholder="+91 XXXXX XXXXX"
                testid="onboard-mobile" />
              <FormField label="Email" required value={form.email} type="email"
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="you@company.com"
                testid="onboard-email" />
              <div className="col-span-2">
                <FormField label="Website" value={form.website}
                  onChange={(v) => setForm((f) => ({ ...f, website: v }))}
                  placeholder="https://yourcompany.com"
                  testid="onboard-website" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-gray-700 mb-1 block">
                  How did you hear about us?
                </label>
                <select
                  value={form.referral_source}
                  onChange={(e) => setForm((f) => ({ ...f, referral_source: e.target.value }))}
                  className="w-full h-9 text-sm border border-gray-300 rounded-md px-3 bg-white"
                  data-testid="onboard-referral_source"
                >
                  <option value="">Select an option…</option>
                  {REFERRAL_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              disabled={submitting}
              onClick={() => setShowOnboarding(false)}
              data-testid="onboard-cancel"
            >
              Not now
            </Button>
            <Button
              className="bg-[#1DA1F2] hover:bg-[#0c7abf] text-white"
              disabled={submitting || logoUploading}
              onClick={handleSubmit}
              data-testid="onboard-submit"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Submit &amp; continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FormField = ({ label, required, value, onChange, placeholder, type = "text", testid }) => (
  <div>
    <label className="text-[11px] font-semibold text-gray-700 mb-1 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      placeholder={placeholder}
      className="h-9 text-sm"
      data-testid={testid}
    />
  </div>
);

export default DRHPUserTypeSelector;
