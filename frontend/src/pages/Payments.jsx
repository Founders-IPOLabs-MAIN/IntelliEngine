import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, ShieldCheck, Loader2, CheckCircle2,
  Download, Sparkles, AlertCircle, IndianRupee,
  Check, Rocket, Layers, Crown,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

// 36 Indian states/UTs with GST state codes
const INDIAN_STATES = [
  ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"],
  ["04", "Chandigarh"], ["05", "Uttarakhand"], ["06", "Haryana"],
  ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"],
  ["13", "Nagaland"], ["14", "Manipur"], ["15", "Mizoram"],
  ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"],
  ["19", "West Bengal"], ["20", "Jharkhand"], ["21", "Odisha"],
  ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"],
  ["27", "Maharashtra"], ["29", "Karnataka"], ["30", "Goa"],
  ["32", "Kerala"], ["33", "Tamil Nadu"], ["34", "Puducherry"],
  ["35", "Andaman & Nicobar"], ["36", "Telangana"], ["37", "Andhra Pradesh"],
  ["38", "Ladakh"],
];

const fmt = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const Payments = ({ user, apiClient }) => {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    company_name: "",
    gstin: "",
    address_line1: "",
    city: "",
    state: "Maharashtra",
    state_code: "27",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // Fetch plans on mount
  useEffect(() => {
    let active = true;
    apiClient
      .get("/payments/plans")
      .then((r) => {
        if (!active) return;
        setPlans(r.data.plans || []);
        const def = (r.data.plans || []).find((p) => p.highlight) || r.data.plans?.[0];
        if (def) setSelectedPlanId(def.plan_id);
      })
      .catch(() => toast.error("Failed to load pricing plans"))
      .finally(() => active && setLoadingPlans(false));
    return () => { active = false; };
  }, [apiClient]);

  const baseAmount = useMemo(() => {
    if (selectedPlanId === "__custom__") {
      const n = parseFloat(customAmount);
      return Number.isFinite(n) && n > 0 ? n : 0;
    }
    const p = plans.find((x) => x.plan_id === selectedPlanId);
    return p ? p.price : 0;
  }, [selectedPlanId, customAmount, plans]);

  const breakdown = useMemo(() => {
    const subtotal = baseAmount;
    const gst = +(subtotal * 0.18).toFixed(2);
    const sameState = form.state_code === "27";
    const cgst = sameState ? +(gst / 2).toFixed(2) : 0;
    const sgst = sameState ? +(gst - cgst).toFixed(2) : 0;
    const igst = sameState ? 0 : gst;
    const total = +(subtotal + gst).toFixed(2);
    return { subtotal, cgst, sgst, igst, gst, total, sameState };
  }, [baseAmount, form.state_code]);

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Invalid email";
    if (!/^[6-9]\d{9}$/.test(form.phone)) err.phone = "Enter a valid 10-digit Indian mobile";
    if (!form.address_line1.trim()) err.address_line1 = "Required";
    if (!form.city.trim()) err.city = "Required";
    if (!/^\d{6}$/.test(form.pincode)) err.pincode = "6-digit pincode";
    if (form.gstin && !GSTIN_REGEX.test(form.gstin.toUpperCase())) err.gstin = "Invalid GSTIN format";
    if (selectedPlanId === "__custom__") {
      const n = parseFloat(customAmount);
      if (!Number.isFinite(n) || n < 1) err.customAmount = "Enter amount ≥ ₹1";
      if (n > 1000000) err.customAmount = "Max ₹10,00,000";
    } else if (!selectedPlanId) {
      err.plan = "Select a plan";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const onProceed = () => {
    setGlobalError("");
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirmAndPay = async () => {
    setConfirmOpen(false);
    setProcessing(true);
    setGlobalError("");

    const ok = await loadRazorpay();
    if (!ok) {
      setProcessing(false);
      setGlobalError("Failed to load Razorpay checkout. Check your internet connection.");
      return;
    }

    let order;
    try {
      const payload = {
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company_name: form.company_name.trim() || undefined,
          gstin: form.gstin.trim().toUpperCase() || undefined,
          address_line1: form.address_line1.trim(),
          city: form.city.trim(),
          state: form.state,
          state_code: form.state_code,
          pincode: form.pincode.trim(),
        },
      };
      if (selectedPlanId === "__custom__") {
        payload.custom_amount = parseFloat(customAmount);
      } else {
        payload.plan_id = selectedPlanId;
      }
      const res = await apiClient.post("/payments/create-order", payload);
      order = res.data;
    } catch (e) {
      setProcessing(false);
      const msg = e?.response?.data?.detail || "Failed to create payment order";
      setGlobalError(msg);
      return;
    }

    const options = {
      key: order.key_id,
      amount: order.amount_paise,
      currency: order.currency,
      order_id: order.order_id,
      name: "IPO Labs AI Pvt Ltd",
      description: order.plan_name,
      image: "/setu-logo.png",
      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone,
      },
      notes: {
        gstin: form.gstin || "",
        company: form.company_name || "",
      },
      theme: { color: "#003366" },
      method: { upi: true, card: true, netbanking: true, wallet: true, emi: true, paylater: true },
      handler: async (resp) => {
        try {
          const v = await apiClient.post("/payments/verify", {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          setSuccessData({
            transaction_id: v.data.transaction_id,
            invoice_number: v.data.invoice_number,
            payment_id: resp.razorpay_payment_id,
            plan_name: order.plan_name,
            total: order.breakdown.total,
          });
          setProcessing(false);
        } catch (e) {
          setProcessing(false);
          setGlobalError(e?.response?.data?.detail || "Payment verification failed. Please contact support.");
        }
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          toast.info("Payment cancelled");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
      setProcessing(false);
      const desc = resp?.error?.description || "Payment failed";
      const code = resp?.error?.code || "";
      setGlobalError(`${desc}${code ? ` (${code})` : ""}`);
    });
    rzp.open();
  };

  const downloadInvoice = async () => {
    if (!successData?.transaction_id) return;
    setDownloadingInvoice(true);
    try {
      const res = await apiClient.get(`/payments/invoice/${successData.transaction_id}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${successData.invoice_number.replace(/\//g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // ============ SUCCESS STATE ============
  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col" data-testid="payments-success-page">
        <nav className="flex items-center gap-4 px-8 lg:px-16 py-5 border-b bg-white">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="payments-back-home">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-xl font-bold text-[#003366]">Payment Successful</span>
        </nav>
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-xl w-full p-10 text-center shadow-xl border-2 border-green-200 bg-white" data-testid="payment-success-card">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-12 h-12 text-green-600" strokeWidth={2.2} />
            </div>
            <h2 className="text-3xl font-bold text-[#003366] mb-2" data-testid="payment-success-title">Payment Successful</h2>
            <p className="text-gray-600 mb-6">Thank you. Your transaction has been completed and a tax invoice has been generated.</p>

            <div className="text-left bg-gray-50 rounded-lg p-5 space-y-2 mb-6 border border-gray-200">
              <Row label="Plan" value={successData.plan_name} />
              <Row label="Amount Paid" value={fmt(successData.total)} />
              <Row label="Invoice #" value={successData.invoice_number} testid="success-invoice-no" />
              <Row label="Payment ID" value={successData.payment_id} mono />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={downloadInvoice}
                disabled={downloadingInvoice}
                className="flex-1 bg-[#003366] hover:bg-[#002244] text-white"
                data-testid="download-invoice-btn"
              >
                {downloadingInvoice ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download Invoice (PDF)
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")} data-testid="success-go-dashboard">
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ============ CHECKOUT FORM ============
  return (
    <div className="min-h-screen bg-[#F5F7FA]" data-testid="payments-page">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-8 lg:px-16 py-5 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="payments-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-xl font-bold text-[#003366]">Secure Checkout</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>256-bit SSL · PCI-DSS via Razorpay</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1.55fr_1fr] gap-10 lg:gap-14 items-start">
          {/* ─────────── LEFT — Plan Modules ─────────── */}
          <div data-testid="plan-section">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0E1E3A] tracking-tight mb-3">
              Choose your plan
            </h1>
            <p className="text-base text-gray-600 mb-10 max-w-lg">
              Start with the tier that fits today, scale tomorrow. Or pay any custom amount for advisory & consulting services.
            </p>

            {loadingPlans ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading plans…
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {plans.map((p, idx) => (
                  <PlanCard
                    key={p.plan_id}
                    plan={p}
                    index={idx}
                    active={selectedPlanId === p.plan_id}
                    onSelect={() => setSelectedPlanId(p.plan_id)}
                  />
                ))}

                {/* Custom amount card */}
                <button
                  type="button"
                  onClick={() => setSelectedPlanId("__custom__")}
                  className={`text-left rounded-2xl p-7 border-2 border-dashed transition-all bg-white flex flex-col ${
                    selectedPlanId === "__custom__"
                      ? "border-[#4361EE] shadow-lg ring-4 ring-[#4361EE]/10"
                      : "border-gray-300 hover:border-[#4361EE]/60 hover:shadow-md"
                  }`}
                  data-testid="plan-card-custom"
                >
                  <div className="w-12 h-12 mb-5 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-[#FF6B1A]" strokeWidth={2.4} />
                  </div>
                  <div className="text-lg font-bold text-[#0E1E3A] mb-1">Custom</div>
                  <div className="text-xs text-gray-500 mb-5 leading-relaxed">
                    Pay any amount for advisory, consulting or services
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      type="number"
                      placeholder="Amount in INR"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setSelectedPlanId("__custom__"); }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white border-gray-200"
                      data-testid="custom-amount-input"
                    />
                  </div>
                  {errors.customAmount && <p className="text-xs text-red-600 mb-2">{errors.customAmount}</p>}
                  <div className="mt-auto">
                    <span className={`block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition ${
                      selectedPlanId === "__custom__"
                        ? "bg-[#4361EE] text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {selectedPlanId === "__custom__" ? "Selected" : "Choose Custom"}
                    </span>
                  </div>
                </button>
              </div>
            )}
            {errors.plan && <p className="text-xs text-red-600 mt-3">{errors.plan}</p>}

            {/* Enterprise CTA strip — Maze-inspired */}
            <div className="mt-10 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5">
              <div>
                <div className="text-sm font-semibold text-[#0E1E3A]">Need more than this?</div>
                <div className="text-xs text-gray-500 mt-0.5">Get a tailored enterprise quote with dedicated support.</div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/contact")}
                className="text-sm font-semibold text-[#4361EE] hover:underline"
                data-testid="enterprise-talk-to-sales"
              >
                Talk to sales →
              </button>
            </div>
          </div>

          {/* ─────────── RIGHT — Order Summary + Billing Details ─────────── */}
          <aside className="self-start" data-testid="payment-summary">
            <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Order Summary */}
              <div className="p-7 bg-gradient-to-br from-[#0E1E3A] to-[#1a2e54] text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[#00D1FF]" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#00D1FF]">Order Summary</span>
                </div>
                <div className="text-2xl font-bold mt-2 mb-5" data-testid="summary-plan-name">
                  {selectedPlanId === "__custom__"
                    ? "Custom Payment"
                    : plans.find((p) => p.plan_id === selectedPlanId)?.name || "—"}
                </div>

                <div className="space-y-2.5 text-sm">
                  <SummaryRow label="Subtotal" light>{fmt(breakdown.subtotal)}</SummaryRow>
                  {breakdown.sameState ? (
                    <>
                      <SummaryRow label="CGST (9%)" light>{fmt(breakdown.cgst)}</SummaryRow>
                      <SummaryRow label="SGST (9%)" light>{fmt(breakdown.sgst)}</SummaryRow>
                    </>
                  ) : (
                    <SummaryRow label="IGST (18%)" light>{fmt(breakdown.igst)}</SummaryRow>
                  )}
                  <div className="border-t border-white/15 pt-3 mt-3 flex justify-between items-center">
                    <span className="font-semibold text-white/90">Total</span>
                    <span className="text-3xl font-bold" data-testid="summary-total">{fmt(breakdown.total)}</span>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="p-7">
                <div className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 mb-1">Billing Details</div>
                <div className="text-sm text-gray-500 mb-5">Required for GST-compliant invoice generation.</div>

                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Full Name *" error={errors.name}>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="bg-gray-50 border-gray-200 focus-visible:ring-[#4361EE]/40"
                      data-testid="kyc-name" />
                  </Field>
                  <Field label="Email *" error={errors.email}>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="bg-gray-50 border-gray-200 focus-visible:ring-[#4361EE]/40"
                      data-testid="kyc-email" />
                  </Field>
                  <Field label="Mobile *" error={errors.phone}>
                    <Input value={form.phone} maxLength={10} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                      className="bg-gray-50 border-gray-200 focus-visible:ring-[#4361EE]/40"
                      data-testid="kyc-phone" />
                  </Field>
                  <Field label="Pincode *" error={errors.pincode}>
                    <Input value={form.pincode} maxLength={6}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                      className="bg-gray-50 border-gray-200 focus-visible:ring-[#4361EE]/40"
                      data-testid="kyc-pincode" />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Company name (optional)">
                      <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        className="bg-gray-50 border-gray-200 focus-visible:ring-[#4361EE]/40"
                        data-testid="kyc-company" />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="GSTIN (optional, for B2B invoice)" error={errors.gstin}>
                      <Input value={form.gstin} maxLength={15}
                        onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                        placeholder="22AAAAA0000A1Z5"
                        className="bg-gray-50 border-gray-200 focus-visible:ring-[#4361EE]/40"
                        data-testid="kyc-gstin" />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Address *" error={errors.address_line1}>
                      <Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                        className="bg-gray-50 border-gray-200 focus-visible:ring-[#4361EE]/40"
                        data-testid="kyc-address" />
                    </Field>
                  </div>
                  <Field label="City *" error={errors.city}>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="bg-gray-50 border-gray-200 focus-visible:ring-[#4361EE]/40"
                      data-testid="kyc-city" />
                  </Field>
                  <Field label="State *">
                    <select
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/40"
                      value={form.state_code}
                      onChange={(e) => {
                        const found = INDIAN_STATES.find(([c]) => c === e.target.value);
                        setForm({ ...form, state_code: e.target.value, state: found ? found[1] : form.state });
                      }}
                      data-testid="kyc-state"
                    >
                      {INDIAN_STATES.map(([code, name]) => (
                        <option key={code} value={code}>{name} ({code})</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {globalError && (
                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2" data-testid="payment-error">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-red-800">{globalError}</div>
                  </div>
                )}

                <Button
                  onClick={onProceed}
                  disabled={processing || baseAmount <= 0}
                  className="w-full mt-6 bg-[#4361EE] hover:bg-[#3651d1] text-white font-semibold py-6 text-base rounded-xl disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                  data-testid="proceed-pay-btn"
                >
                  {processing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing…</>
                  ) : (
                    <>Review &amp; Pay {fmt(breakdown.total)}</>
                  )}
                </Button>

                <p className="text-[11px] text-gray-500 mt-4 leading-relaxed text-center">
                  By continuing you agree to our Terms. Powered by <strong>Razorpay</strong>.
                  Pay via <strong>UPI</strong>, <strong>Cards</strong>, <strong>Netbanking</strong>, <strong>Wallets</strong>, EMI &amp; PayLater.
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* CONFIRM DIALOG */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent data-testid="confirm-dialog">
          <DialogHeader>
            <DialogTitle className="text-[#003366]">Confirm payment</DialogTitle>
            <DialogDescription>
              Please review the final terms below. After confirmation you will be redirected to Razorpay's secure checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm border my-2">
            <Row label="Plan" value={selectedPlanId === "__custom__" ? "Custom Payment" : plans.find(p => p.plan_id === selectedPlanId)?.name || "—"} />
            <Row label="Subtotal" value={fmt(breakdown.subtotal)} />
            {breakdown.sameState ? (
              <>
                <Row label="CGST (9%)" value={fmt(breakdown.cgst)} />
                <Row label="SGST (9%)" value={fmt(breakdown.sgst)} />
              </>
            ) : (
              <Row label="IGST (18%)" value={fmt(breakdown.igst)} />
            )}
            <div className="flex justify-between pt-2 border-t font-semibold text-[#003366]">
              <span>Total Payable</span><span>{fmt(breakdown.total)}</span>
            </div>
            <div className="text-xs text-gray-600 pt-2 border-t">
              Billing: <strong>{form.name}</strong> · {form.email} · {form.phone}
              {form.gstin && <> · GSTIN <strong>{form.gstin}</strong></>}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} data-testid="confirm-cancel">
              Cancel
            </Button>
            <Button onClick={onConfirmAndPay} className="bg-[#003366] hover:bg-[#002244] text-white" data-testid="confirm-pay">
              Confirm &amp; Pay {fmt(breakdown.total)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" data-testid="processing-overlay">
          <Card className="p-8 max-w-sm text-center bg-white">
            <Loader2 className="w-12 h-12 animate-spin text-[#003366] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#003366] mb-1">Processing payment</h3>
            <p className="text-sm text-gray-600">Please don't close this window…</p>
          </Card>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, error, children }) => (
  <div>
    <Label className="text-xs font-medium text-gray-700 mb-1 block">{label}</Label>
    {children}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

const SummaryRow = ({ label, children, light }) => (
  <div className={`flex justify-between ${light ? "text-white/70" : "text-gray-700"}`}>
    <span>{label}</span>
    <span className={`font-medium ${light ? "text-white" : ""}`}>{children}</span>
  </div>
);

// ── Maze-inspired plan card ────────────────────────────────────────────────
const PLAN_ICONS = [Rocket, Layers, Crown];
const PLAN_ACCENTS = [
  { bg: "from-blue-100 to-blue-200",   fg: "text-[#4361EE]" },
  { bg: "from-violet-100 to-violet-200", fg: "text-[#7C3AED]" },
  { bg: "from-amber-100 to-amber-200", fg: "text-[#D97706]" },
];

const PlanCard = ({ plan, index, active, onSelect }) => {
  const Icon = PLAN_ICONS[index % PLAN_ICONS.length];
  const accent = PLAN_ACCENTS[index % PLAN_ACCENTS.length];
  const features = Array.isArray(plan.features) && plan.features.length
    ? plan.features.slice(0, 4)
    : ["GST-compliant invoice", "Email + chat support", "Cancel anytime"];

  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`plan-card-${plan.plan_id}`}
      className={`relative text-left bg-white rounded-2xl p-7 border transition-all flex flex-col ${
        active
          ? "border-[#4361EE] shadow-xl ring-4 ring-[#4361EE]/10 -translate-y-0.5"
          : plan.highlight
            ? "border-gray-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            : "border-gray-100 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-2.5 right-5 bg-[#FF6B1A] text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase shadow-sm">
          Popular
        </span>
      )}

      <div className={`w-12 h-12 mb-5 rounded-xl bg-gradient-to-br ${accent.bg} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${accent.fg}`} strokeWidth={2.2} />
      </div>

      <div className="text-lg font-bold text-[#0E1E3A] mb-1">{plan.name}</div>
      <p className="text-xs text-gray-500 mb-5 leading-relaxed min-h-[32px]">{plan.description}</p>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-[#0E1E3A]">
            ₹{Number(plan.price).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5">+ 18% GST · one-time</div>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-snug">
            <Check className="w-3.5 h-3.5 text-[#4361EE] mt-0.5 flex-shrink-0" strokeWidth={3} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <span className={`mt-auto block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition ${
        active
          ? "bg-[#4361EE] text-white"
          : plan.highlight
            ? "bg-[#0E1E3A] text-white hover:bg-[#1a2e54]"
            : "bg-gray-100 text-[#0E1E3A] hover:bg-gray-200"
      }`}>
        {active ? "Selected" : `Choose ${plan.name}`}
      </span>
    </button>
  );
};

const Row = ({ label, value, mono, testid }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">{label}</span>
    <span className={`text-gray-900 ${mono ? "font-mono text-xs" : "font-medium"}`} data-testid={testid}>{value}</span>
  </div>
);


export default Payments;
