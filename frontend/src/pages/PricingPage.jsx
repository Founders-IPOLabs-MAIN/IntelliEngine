import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Check, Sparkles, ShieldCheck,
  FileText, Scale, Users, CheckCircle2, FileDown,
  HelpCircle, Loader2,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Visual map by plan_id — controls icon, gradient, and group label
const PLAN_VISUALS = {
  drhp_starter: {
    group: "DRHP Builder",
    icon: FileText,
    accent: "from-blue-50 to-white",
    iconBg: "bg-blue-100", iconColor: "text-[#003366]",
  },
  drhp_professional: {
    group: "DRHP Builder",
    icon: FileText,
    accent: "from-cyan-50 to-white",
    iconBg: "bg-cyan-100", iconColor: "text-[#00D1FF]",
  },
  valuation_pro: {
    group: "Business Valuation",
    icon: Scale,
    accent: "from-amber-50 to-white",
    iconBg: "bg-amber-100", iconColor: "text-amber-600",
  },
  matchmaker_premium: {
    group: "Match-Making",
    icon: Users,
    accent: "from-purple-50 to-white",
    iconBg: "bg-purple-100", iconColor: "text-purple-600",
  },
  assessment_premium: {
    group: "IPO Readiness",
    icon: CheckCircle2,
    accent: "from-emerald-50 to-white",
    iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
  },
};

const FAQS = [
  {
    q: "Are the prices inclusive of GST?",
    a: "All prices listed are exclusive of 18% GST. The applicable GST (CGST 9% + SGST 9% for Maharashtra customers, IGST 18% for other states) is added at checkout, and a GST-compliant tax invoice is auto-generated after payment.",
  },
  {
    q: "Is this a subscription or a one-time payment?",
    a: "All plans listed here are one-time payments for the specific module. We do not auto-renew. Subscription billing is offered separately for enterprise customers — contact our sales team for details.",
  },
  {
    q: "Which payment methods are accepted?",
    a: "We accept all major payment methods through our Razorpay-powered checkout: UPI (GPay, PhonePe, Paytm, BHIM and 200+ more), Credit/Debit Cards (Visa, Mastercard, RuPay, Amex, Diners), Net Banking from 55+ Indian banks, Wallets, EMI, and PayLater.",
  },
  {
    q: "Can I get a customised plan for my company?",
    a: "Absolutely. For larger engagements, custom-built DRHPs, multi-module bundles, or enterprise rollouts, please reach out to our sales team via the Contact Sales button on the home page. We'll tailor a plan and pricing that fits your exact needs.",
  },
  {
    q: "Is my payment data secure?",
    a: "Yes. Payments are processed through Razorpay's PCI-DSS Level-1 certified vault over a 256-bit SSL encrypted connection. We never see or store your card or UPI credentials.",
  },
  {
    q: "Do I get a tax invoice for B2B input credit?",
    a: "Yes. Provide your company's GSTIN at checkout and we'll generate a tax invoice with all the required GST particulars — ready for your input tax credit claim.",
  },
];

const ALWAYS_INCLUDED = [
  "GST-compliant tax invoice",
  "Razorpay secure checkout",
  "Email + on-platform support",
  "Cancel any time before access",
];

const PricingPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/payments/plans`)
      .then((r) => setPlans(r.data?.plans || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const goCheckout = (planId) => {
    navigate(`/login?redirect=/payments&plan=${encodeURIComponent(planId)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col" data-testid="pricing-page">
      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b px-8 lg:px-16 py-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8" data-testid="pricing-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center -mt-3">
            <img src="/setu-logo.svg" alt="SETU Labs" className="h-[190px] w-auto object-contain p-0 -my-8" />
          </div>
        </div>
        <Button
          onClick={() => navigate("/login")}
          className="bg-[#003366] hover:bg-[#002244] text-white rounded-full px-5 text-sm h-9"
          data-testid="pricing-signin-btn"
        >
          Sign In
        </Button>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-r from-[#001a33] via-[#003366] to-[#002244] text-white py-12 px-8 lg:px-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-20 w-48 h-48 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-32 w-72 h-72 bg-[#00D1FF] rounded-full blur-3xl opacity-30" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="bg-white/10 text-white border border-white/20 hover:bg-white/15 mb-4 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 mr-1" /> Transparent · One-time pricing
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight mb-3">
            Simple pricing.{" "}
            <span className="bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
              No surprises.
            </span>
          </h1>
          <p className="text-white/70 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Pay only for the modules you need. Every plan is a one-time fee, GST-compliant invoice included,
            and cancellation-friendly until you start using the module.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-xs text-white/60">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#00D1FF]" /> 256-bit SSL · PCI-DSS</span>
            <span className="flex items-center gap-1.5"><FileDown className="w-3.5 h-3.5 text-[#00D1FF]" /> GST tax invoice on every order</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#00D1FF]" /> 5+ payment methods via Razorpay</span>
          </div>
        </div>
      </section>

      {/* ── PRICING GRID ── */}
      <section className="px-6 lg:px-12 py-14 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading plans…
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <p className="text-sm tracking-[0.18em] uppercase text-[#003366] font-semibold mb-2">Plans &amp; pricing</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#003366]">Pick the module that's right for you</h2>
              <p className="text-gray-600 mt-2 text-sm max-w-xl mx-auto">
                All prices in INR · 18 % GST applied at checkout · Sequential tax invoice auto-generated.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {plans.map((p) => {
                const v = PLAN_VISUALS[p.plan_id] || PLAN_VISUALS.drhp_starter;
                const Icon = v.icon;
                const popular = !!p.highlight;
                const cleanName = p.name.replace(`${v.group} — `, "").replace(`${v.group} `, "").trim();
                return (
                  <div
                    key={p.plan_id}
                    className={`relative flex flex-col rounded-2xl bg-gradient-to-b ${v.accent} border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      popular
                        ? "border-[#00D1FF] shadow-lg shadow-cyan-200/40 ring-2 ring-[#00D1FF]/20"
                        : "border-gray-200 hover:border-[#003366]/30"
                    }`}
                    data-testid={`pricing-card-${p.plan_id}`}
                  >
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-[#FF6B1A] to-[#ff8c4a] text-white shadow-md text-[10px] tracking-[0.15em] uppercase px-3 py-1">
                          <Sparkles className="w-3 h-3 mr-1" /> Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-1">
                      <div className={`w-11 h-11 rounded-xl ${v.iconBg} flex items-center justify-center mb-4`}>
                        <Icon className={`w-5 h-5 ${v.iconColor}`} />
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-semibold mb-1">{v.group}</div>
                      <h3 className="text-lg font-bold text-[#003366] leading-tight mb-2">{cleanName || p.name}</h3>
                      <p className="text-xs text-gray-600 mb-5 leading-relaxed">{p.description}</p>

                      <div className="mb-5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-[#003366]">
                            ₹{Number(p.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">+ 18 % GST · One-time</div>
                      </div>

                      <ul className="space-y-2 mb-6 text-xs text-gray-700 flex-1">
                        {(p.features || []).map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="leading-snug">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => goCheckout(p.plan_id)}
                        className={`w-full rounded-full font-semibold text-sm h-10 ${
                          popular
                            ? "bg-[#003366] hover:bg-[#002244] text-white shadow-md"
                            : "bg-white border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white"
                        }`}
                        data-testid={`pricing-cta-${p.plan_id}`}
                      >
                        Get this plan
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom amount strip */}
            <div className="mt-10 rounded-2xl bg-white border-2 border-dashed border-[#003366]/25 p-6 flex flex-col md:flex-row items-center justify-between gap-4" data-testid="pricing-custom-cta">
              <div>
                <h4 className="text-base font-bold text-[#003366]">Need a custom engagement?</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Pay any amount for advisory hours, retainers, or bespoke modules — same secure checkout, same GST invoice.
                </p>
              </div>
              <Button
                onClick={() => navigate("/login?redirect=/payments")}
                variant="outline"
                className="border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white rounded-full"
                data-testid="pricing-custom-btn"
              >
                Pay custom amount <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </>
        )}
      </section>

      {/* ── INCLUDED-IN-EVERY-PLAN ── */}
      <section className="px-6 lg:px-12 pb-12 max-w-5xl mx-auto w-full">
        <div className="rounded-2xl bg-white border border-gray-200 p-6 lg:p-8">
          <div className="text-center mb-5">
            <p className="text-xs tracking-[0.18em] uppercase text-[#003366] font-semibold mb-1">Always included</p>
            <h3 className="text-xl font-bold text-[#003366]">What every plan ships with</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ALWAYS_INCLUDED.map((label) => (
              <div key={label} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50/70 border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-700 leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 lg:px-12 pb-16 max-w-3xl mx-auto w-full" data-testid="pricing-faq">
        <div className="text-center mb-6">
          <p className="text-xs tracking-[0.18em] uppercase text-[#003366] font-semibold mb-1">FAQ</p>
          <h3 className="text-2xl font-bold text-[#003366]">Frequently asked questions</h3>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-xl border border-gray-200 bg-white px-4 data-[state=open]:border-[#003366]/30 data-[state=open]:shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline text-left text-sm font-semibold text-[#003366] py-4" data-testid={`faq-q-${i}`}>
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#00D1FF] flex-shrink-0" /> {f.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-700 leading-relaxed pb-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── BOTTOM CTA STRIP ── */}
      <section className="px-6 lg:px-12 pb-16 max-w-5xl mx-auto w-full">
        <div className="rounded-2xl bg-gradient-to-r from-[#001a33] via-[#003366] to-[#002244] text-white p-8 lg:p-10 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#00D1FF]/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-12 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h3 className="text-2xl lg:text-3xl font-bold mb-2">Ready to start your IPO journey?</h3>
            <p className="text-white/70 text-sm max-w-xl mx-auto mb-6">
              Sign in, pick your module, pay securely with UPI / Cards / Net Banking — and get instant access plus a GST invoice in your inbox.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate("/login?redirect=/payments")}
                className="bg-[#00D1FF] hover:bg-[#00b8e6] text-[#003366] font-semibold rounded-full px-7 h-11"
                data-testid="pricing-bottom-cta-pay"
              >
                Continue to Payment Gateway <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="bg-transparent border-white/40 text-white hover:bg-white/10 rounded-full px-7 h-11"
                data-testid="pricing-bottom-cta-back"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
