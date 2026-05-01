import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, ShieldCheck, Loader2, CheckCircle2,
  Download, Sparkles, AlertCircle, IndianRupee,
  CreditCard, Smartphone, Building2, QrCode,
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
  const [preferredMethod, setPreferredMethod] = useState("card"); // card | upi | netbanking | qr

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
      method: (() => {
        // Honour user's preferred method choice; QR is handled via UPI's built-in QR flow
        switch (preferredMethod) {
          case "card":       return { card: true };
          case "upi":        return { upi: true };
          case "netbanking": return { netbanking: true };
          case "qr":         return { upi: true }; // Razorpay surfaces QR within UPI block
          default:           return { upi: true, card: true, netbanking: true, wallet: true, emi: true, paylater: true };
        }
      })(),
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" data-testid="payments-page">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-8 lg:px-16 py-5 border-b bg-white sticky top-0 z-30">
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

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 grid lg:grid-cols-[1.4fr_1fr] gap-10">
        {/* LEFT — Form */}
        <div className="space-y-8">
          {/* Plan selection */}
          <section data-testid="plan-section">
            <h2 className="text-2xl font-bold text-[#003366] mb-1">Choose your plan</h2>
            <p className="text-sm text-gray-600 mb-5">Predefined plans below or pay any custom amount.</p>

            {loadingPlans ? (
              <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading plans…</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {plans.map((p) => {
                  const active = selectedPlanId === p.plan_id;
                  return (
                    <button
                      key={p.plan_id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.plan_id)}
                      className={`text-left rounded-xl p-5 border-2 transition-all relative ${
                        active ? "border-[#00D1FF] bg-cyan-50/60 shadow-lg" : "border-gray-200 bg-white hover:border-[#003366]/40"
                      }`}
                      data-testid={`plan-card-${p.plan_id}`}
                    >
                      {p.highlight && (
                        <Badge className="absolute -top-2 right-3 bg-[#FF6B1A] hover:bg-[#FF6B1A] text-white text-[10px]">
                          <Sparkles className="w-3 h-3 mr-1" /> POPULAR
                        </Badge>
                      )}
                      <div className="font-semibold text-[#003366] mb-1">{p.name}</div>
                      <div className="text-xs text-gray-600 mb-3 leading-relaxed">{p.description}</div>
                      <div className="text-2xl font-bold text-[#003366]">
                        ₹{Number(p.price).toLocaleString("en-IN")}
                        <span className="text-xs font-normal text-gray-500 ml-1">+ 18% GST</span>
                      </div>
                    </button>
                  );
                })}

                {/* Custom amount card */}
                <button
                  type="button"
                  onClick={() => setSelectedPlanId("__custom__")}
                  className={`text-left rounded-xl p-5 border-2 border-dashed transition-all ${
                    selectedPlanId === "__custom__" ? "border-[#00D1FF] bg-cyan-50/60" : "border-gray-300 bg-white hover:border-[#003366]/40"
                  }`}
                  data-testid="plan-card-custom"
                >
                  <div className="font-semibold text-[#003366] mb-1">Custom Amount</div>
                  <div className="text-xs text-gray-600 mb-3">Pay any amount for advisory, consulting or services.</div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-gray-500" />
                    <Input
                      type="number"
                      placeholder="Amount in INR"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setSelectedPlanId("__custom__"); }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white"
                      data-testid="custom-amount-input"
                    />
                  </div>
                  {errors.customAmount && <p className="text-xs text-red-600 mt-1">{errors.customAmount}</p>}
                </button>
              </div>
            )}
            {errors.plan && <p className="text-xs text-red-600 mt-2">{errors.plan}</p>}
          </section>

          {/* Customer / KYC */}
          <section data-testid="kyc-section">
            <h2 className="text-2xl font-bold text-[#003366] mb-1">Billing details</h2>
            <p className="text-sm text-gray-600 mb-5">Required for GST-compliant invoice generation.</p>

            <Card className="p-6 bg-white border border-gray-200 grid sm:grid-cols-2 gap-4">
              <Field label="Full Name *" error={errors.name}>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="kyc-name" />
              </Field>
              <Field label="Email *" error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="kyc-email" />
              </Field>
              <Field label="Mobile (10 digits) *" error={errors.phone}>
                <Input value={form.phone} maxLength={10} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                  data-testid="kyc-phone" />
              </Field>
              <Field label="Company name (optional)">
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  data-testid="kyc-company" />
              </Field>
              <Field label="GSTIN (optional, for B2B invoice)" error={errors.gstin}>
                <Input value={form.gstin} maxLength={15}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  placeholder="22AAAAA0000A1Z5"
                  data-testid="kyc-gstin" />
              </Field>
              <Field label="Pincode *" error={errors.pincode}>
                <Input value={form.pincode} maxLength={6}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                  data-testid="kyc-pincode" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address *" error={errors.address_line1}>
                  <Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                    data-testid="kyc-address" />
                </Field>
              </div>
              <Field label="City *" error={errors.city}>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  data-testid="kyc-city" />
              </Field>
              <Field label="State *">
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/30"
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
            </Card>
          </section>

          {globalError && (
            <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3" data-testid="payment-error">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">{globalError}</div>
            </div>
          )}
        </div>

        {/* RIGHT — Sticky summary */}
        <aside className="lg:sticky lg:top-24 self-start" data-testid="payment-summary">
          <Card className="p-6 bg-white border-2 border-[#003366]/10 shadow-xl">
            <h3 className="text-lg font-bold text-[#003366] mb-4">Order Summary</h3>

            <div className="space-y-3 text-sm">
              <SummaryRow label="Item">
                {selectedPlanId === "__custom__"
                  ? "Custom Payment"
                  : plans.find((p) => p.plan_id === selectedPlanId)?.name || "—"}
              </SummaryRow>
              <SummaryRow label="Subtotal">{fmt(breakdown.subtotal)}</SummaryRow>
              {breakdown.sameState ? (
                <>
                  <SummaryRow label="CGST (9%)">{fmt(breakdown.cgst)}</SummaryRow>
                  <SummaryRow label="SGST (9%)">{fmt(breakdown.sgst)}</SummaryRow>
                </>
              ) : (
                <SummaryRow label="IGST (18%)">{fmt(breakdown.igst)}</SummaryRow>
              )}
              <div className="border-t pt-3 mt-3 flex justify-between items-center">
                <span className="font-semibold text-[#003366]">Total</span>
                <span className="text-2xl font-bold text-[#003366]" data-testid="summary-total">{fmt(breakdown.total)}</span>
              </div>
            </div>

            <Button
              onClick={onProceed}
              disabled={processing || baseAmount <= 0}
              className="w-full mt-6 bg-[#00D1FF] hover:bg-[#00b8e6] text-[#003366] font-semibold py-6 text-base disabled:opacity-50"
              data-testid="proceed-pay-btn"
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing…</>
              ) : (
                <>Review & Pay {fmt(breakdown.total)}</>
              )}
            </Button>

            <p className="text-[11px] text-gray-500 mt-4 leading-relaxed text-center">
              By continuing you agree to our Terms. Powered by <strong>Razorpay</strong>.
              Pay via <strong>UPI</strong>, <strong>Cards</strong>, <strong>Netbanking</strong>, <strong>Wallets</strong>, EMI &amp; PayLater.
            </p>

            <PaymentMethodPicker selected={preferredMethod} onSelect={setPreferredMethod} />
          </Card>
        </aside>
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

const SummaryRow = ({ label, children }) => (
  <div className="flex justify-between text-gray-700">
    <span>{label}</span><span className="font-medium">{children}</span>
  </div>
);

const Row = ({ label, value, mono, testid }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">{label}</span>
    <span className={`text-gray-900 ${mono ? "font-mono text-xs" : "font-medium"}`} data-testid={testid}>{value}</span>
  </div>
);

// ============ PAYMENT METHOD PICKER ============
// Pre-selection UI inspired by leading Razorpay clients (CRED, BookMyShow, Myntra)
// User's choice is passed to Razorpay's `method` filter so checkout opens directly on that method.

const METHOD_TABS = [
  { id: "card",       label: "Cards",      icon: CreditCard },
  { id: "upi",        label: "UPI",        icon: Smartphone },
  { id: "netbanking", label: "Net Banking", icon: Building2 },
  { id: "qr",         label: "QR Code",    icon: QrCode },
];

const CARD_NETWORKS = [
  { name: "Visa",       sub: "Credit / Debit", color: "#1A1F71" },
  { name: "Mastercard", sub: "Credit / Debit", color: "#EB001B" },
  { name: "RuPay",      sub: "Debit",          color: "#097B3F" },
  { name: "Amex",       sub: "Credit",         color: "#006FCF" },
  { name: "Diners",     sub: "Credit",         color: "#0079BE" },
];

const UPI_APPS = [
  { name: "Google Pay",  short: "GPay",    bg: "bg-white",         text: "text-[#1a73e8]", border: "border-blue-200" },
  { name: "PhonePe",     short: "PhonePe", bg: "bg-[#5f259f]",     text: "text-white",     border: "border-[#5f259f]" },
  { name: "Paytm",       short: "Paytm",   bg: "bg-[#00BAF2]",     text: "text-white",     border: "border-[#00BAF2]" },
  { name: "BHIM",        short: "BHIM",    bg: "bg-[#ff7300]",     text: "text-white",     border: "border-[#ff7300]" },
  { name: "Amazon Pay",  short: "AmzPay",  bg: "bg-[#232F3E]",     text: "text-white",     border: "border-[#232F3E]" },
  { name: "CRED",        short: "CRED",    bg: "bg-black",         text: "text-white",     border: "border-black" },
  { name: "WhatsApp",    short: "WApay",   bg: "bg-[#25D366]",     text: "text-white",     border: "border-[#25D366]" },
  { name: "Other UPI",   short: "VPA",     bg: "bg-gray-100",      text: "text-gray-700",  border: "border-gray-300" },
];

const TOP_BANKS = [
  "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank",
  "Kotak Mahindra", "Yes Bank", "IDFC FIRST", "IndusInd Bank",
  "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank",
];

const PaymentMethodPicker = ({ selected, onSelect }) => (
  <div className="mt-5 border-t pt-5" data-testid="method-picker">
    <div className="text-xs font-semibold text-gray-700 mb-2 tracking-wide uppercase">Choose payment method</div>

    {/* Tabs */}
    <div className="grid grid-cols-4 gap-2" role="tablist">
      {METHOD_TABS.map((t) => {
        const active = selected === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(t.id)}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
              active
                ? "border-[#003366] bg-[#003366] text-white shadow-md"
                : "border-gray-200 bg-white text-gray-600 hover:border-[#003366]/40 hover:bg-gray-50"
            }`}
            data-testid={`method-tab-${t.id}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold leading-none">{t.label}</span>
          </button>
        );
      })}
    </div>

    {/* Panels */}
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 min-h-[140px]" data-testid={`method-panel-${selected}`}>
      {selected === "card" && (
        <div>
          <div className="text-[11px] font-semibold text-gray-600 mb-2 uppercase tracking-wide">Accepted cards</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CARD_NETWORKS.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2.5 py-2"
                data-testid={`card-network-${c.name.toLowerCase()}`}
              >
                <span
                  className="w-8 h-5 rounded-sm flex items-center justify-center text-[8px] font-bold text-white tracking-wider"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name.slice(0, 4).toUpperCase()}
                </span>
                <div className="leading-tight">
                  <div className="text-[11px] font-semibold text-gray-900">{c.name}</div>
                  <div className="text-[9px] text-gray-500">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-3 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-green-600" /> All cards processed via PCI-DSS Level-1 Razorpay vault
          </p>
        </div>
      )}

      {selected === "upi" && (
        <div>
          <div className="text-[11px] font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pay with any UPI app</div>
          <div className="grid grid-cols-4 gap-2">
            {UPI_APPS.map((u) => (
              <div
                key={u.name}
                className={`flex flex-col items-center justify-center rounded-lg border ${u.border} ${u.bg} ${u.text} px-1 py-2`}
                data-testid={`upi-app-${u.short.toLowerCase()}`}
                title={u.name}
              >
                <span className="text-[10px] font-bold leading-none">{u.short}</span>
                <span className="text-[8px] mt-1 opacity-80 leading-none">UPI</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-3">
            Enter your UPI ID or scan via app on Razorpay's checkout — works with 200+ banks.
          </p>
        </div>
      )}

      {selected === "netbanking" && (
        <div>
          <div className="text-[11px] font-semibold text-gray-600 mb-2 uppercase tracking-wide">Top banks</div>
          <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
            {TOP_BANKS.map((b) => (
              <div
                key={b}
                className="flex items-center gap-2 bg-white rounded-md border border-gray-200 px-2.5 py-1.5"
                data-testid={`bank-${b.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#003366] flex-shrink-0" />
                <span className="text-[10.5px] font-medium text-gray-800 truncate">{b}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-3">
            55+ banks available on Razorpay's secure checkout.
          </p>
        </div>
      )}

      {selected === "qr" && (
        <div className="text-center py-2">
          <div className="mx-auto w-24 h-24 rounded-xl border-2 border-dashed border-[#003366]/40 bg-white flex items-center justify-center mb-2 relative">
            <QrCode className="w-14 h-14 text-[#003366]" strokeWidth={1.4} />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#003366] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
              UPI
            </span>
          </div>
          <div className="text-[12px] font-semibold text-[#003366]">Scan & Pay with any UPI app</div>
          <p className="text-[10px] text-gray-500 mt-1.5 max-w-[220px] mx-auto leading-relaxed">
            A live, signed QR code will be generated on Razorpay's secure screen after you confirm.
          </p>
        </div>
      )}
    </div>
  </div>
);


export default Payments;
