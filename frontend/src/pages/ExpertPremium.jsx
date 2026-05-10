import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft, Loader2, Crown, CheckCircle2, ShieldCheck, CreditCard,
  Upload, Trash2, FileText, Lock, Building2,
} from "lucide-react";
import { toast } from "sonner";

const ExpertPremium = ({ user, apiClient }) => {
  const navigate = useNavigate();

  // Step machine: "payment" → "advanced" → done(redirect)
  const [step, setStep] = useState("loading");
  const [pricing, setPricing] = useState(null);
  const [profile, setProfile] = useState(null);

  // Payment state
  const [orderId, setOrderId] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  // Catalog & Advanced Data form state
  const [catalog, setCatalog] = useState([]);
  const [firmName, setFirmName] = useState("");
  const [primaryArea, setPrimaryArea] = useState("");
  const [primaryValues, setPrimaryValues] = useState({});
  const [secondaryValues, setSecondaryValues] = useState({});
  const [files, setFiles] = useState([]);   // [{file_id, identifier_key, identifier_type, filename}]

  const [showConfirm, setShowConfirm] = useState(false);
  const [confidentialityAccepted, setConfidentialityAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const init = async () => {
    try {
      const [profRes, priceRes, catRes, dataRes] = await Promise.all([
        apiClient.get("/matchmaker/expert/my-profile"),
        apiClient.get("/matchmaker/expert/premium/pricing"),
        apiClient.get("/matchmaker/expert/premium/expertise-catalog"),
        apiClient.get("/matchmaker/expert/premium/my-data").catch(() => ({ data: {} })),
      ]);
      const p = profRes.data.profile;
      if (!p) { toast.error("Please complete basic registration first"); navigate("/matchmaker/experts/register"); return; }
      setProfile(p);
      setPricing(priceRes.data);
      setCatalog(catRes.data.areas || []);

      // Existing premium data prefill
      const pd = dataRes.data?.premium_data;
      if (pd) {
        setFirmName(pd.firm_name || "");
        setPrimaryArea(pd.primary_area || "");
        setPrimaryValues(pd.primary_identifiers || {});
        setSecondaryValues(pd.secondary_identifiers || {});
      }
      setFiles(dataRes.data?.files || []);

      // If already premium → skip straight to advanced data section
      setStep(p.is_premium ? "advanced" : "payment");
    } catch (e) {
      toast.error("Failed to load premium flow");
    }
  };

  // ────────────────────── PAYMENT ──────────────────────
  const handlePayClick = async () => {
    setPayLoading(true);
    try {
      const orderRes = await apiClient.post("/matchmaker/expert/premium/initiate-order");
      const newOrderId = orderRes.data.order_id;
      setOrderId(newOrderId);

      // MOCK Razorpay UI: simulate the gateway popup with a 1.2s "processing" pause
      await new Promise(r => setTimeout(r, 1200));

      const verifyRes = await apiClient.post("/matchmaker/expert/premium/verify-payment", {
        order_id: newOrderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: "mock_signature",
      });
      toast.success("Payment successful! Premium activated.");
      // Reload profile to reflect premium flag
      const profRes = await apiClient.get("/matchmaker/expert/my-profile");
      setProfile(profRes.data.profile);
      setStep("advanced");
      void verifyRes;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Payment failed");
    }
    setPayLoading(false);
  };

  // ────────────────────── ADVANCED DATA ──────────────────────
  const currentSpec = catalog.find(a => a.id === primaryArea);

  const onPickArea = (id) => {
    setPrimaryArea(id);
    // Reset only if user picks a NEW area
    setPrimaryValues({});
    setSecondaryValues({});
  };

  const updatePrimary = (key, val) => setPrimaryValues(p => ({ ...p, [key]: val }));
  const updateSecondary = (key, val) => setSecondaryValues(p => ({ ...p, [key]: val }));

  const filesByIdentifier = (key) => files.filter(f => f.identifier_key === key);

  const onUploadFile = async (identifierKey, identifierType, fileObj) => {
    if (!fileObj) return;
    if (fileObj.size > 5 * 1024 * 1024) { toast.error("Each file must be 5 MB or smaller"); return; }
    if (!primaryArea) { toast.error("Pick your Primary Area of Expertise first"); return; }
    const fd = new FormData();
    fd.append("identifier_key", identifierKey);
    fd.append("identifier_type", identifierType);
    fd.append("primary_area", primaryArea);
    fd.append("file", fileObj);
    try {
      const res = await apiClient.post("/matchmaker/expert/premium/upload-file", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFiles(prev => [...prev, res.data.file]);
      toast.success("File uploaded");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Upload failed");
    }
  };

  const onDeleteFile = async (fileId) => {
    try {
      await apiClient.delete(`/matchmaker/expert/premium/file/${fileId}`);
      setFiles(prev => prev.filter(f => f.file_id !== fileId));
      toast.success("File scheduled for deletion (30-day retention)");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Delete failed");
    }
  };

  const validateForSubmit = () => {
    if (!primaryArea) { toast.error("Please pick a Primary Area of Expertise"); return false; }
    const missing = (currentSpec?.primary || []).filter(f => !(primaryValues[f.key] || "").trim());
    if (missing.length) {
      toast.error(`Mandatory: ${missing.map(m => m.label).join(", ")}`);
      return false;
    }
    return true;
  };

  const onSubmitClick = () => {
    if (!validateForSubmit()) return;
    setShowConfirm(true);
  };

  const onConfirmSubmit = async () => {
    if (!confidentialityAccepted) { toast.error("Please accept the confidentiality terms"); return; }
    setSubmitting(true);
    try {
      await apiClient.post("/matchmaker/expert/premium/save-advanced-data", {
        firm_name: firmName,
        primary_area: primaryArea,
        primary_identifiers: primaryValues,
        secondary_identifiers: secondaryValues,
        confidentiality_accepted: true,
      });
      toast.success("Advanced data saved! Welcome to Premium.");
      setShowConfirm(false);
      // Skip the welcome-gate so the user lands directly on their new premium profile data.
      navigate("/matchmaker/experts/dashboard?premium=just-activated");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Submit failed");
    }
    setSubmitting(false);
  };

  // ────────────────────── RENDER ──────────────────────
  if (step === "loading") {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="expert-premium-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Premium Membership
          </h1>
          {profile?.is_premium && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Active</Badge>}
        </header>

        {/* Step indicator */}
        <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center gap-6 text-sm">
          <StepDot done={step === "advanced" || profile?.is_premium} active={step === "payment"} num={1} label="Payment" />
          <div className="flex-1 h-px bg-gray-200" />
          <StepDot done={false} active={step === "advanced"} num={2} label="Advanced Data" />
        </div>

        <div className="max-w-3xl mx-auto p-8">
          {step === "payment" && pricing && (
            <PaymentStep pricing={pricing} loading={payLoading} onPay={handlePayClick} />
          )}

          {step === "advanced" && (
            <AdvancedDataStep
              catalog={catalog}
              firmName={firmName} setFirmName={setFirmName}
              primaryArea={primaryArea} onPickArea={onPickArea}
              currentSpec={currentSpec}
              primaryValues={primaryValues} updatePrimary={updatePrimary}
              secondaryValues={secondaryValues} updateSecondary={updateSecondary}
              filesByIdentifier={filesByIdentifier}
              onUploadFile={onUploadFile} onDeleteFile={onDeleteFile}
              onSubmit={onSubmitClick}
            />
          )}
        </div>

        {/* Confidentiality Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="max-w-lg" data-testid="confidentiality-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#1DA1F2]" /> Confidentiality &amp; Data-Sharing Confirmation
              </DialogTitle>
              <DialogDescription className="pt-2 text-[13px] text-gray-600 leading-relaxed">
                By submitting this advanced data you acknowledge that:
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-4">
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#1DA1F2] mt-0.5 flex-shrink-0" />
                Your identifiers and uploaded documents will be stored under your private user header on encrypted infrastructure.</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#1DA1F2] mt-0.5 flex-shrink-0" />
                SETU may share verification status (not raw documents) with corporates browsing matchmaker leads.</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#1DA1F2] mt-0.5 flex-shrink-0" />
                Every change is recorded in an audit log; deletions are retained for 30 days before permanent purge.</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#1DA1F2] mt-0.5 flex-shrink-0" />
                You can request a full export or hard delete by emailing privacy@setu.app.</li>
            </ul>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="confidentiality"
                checked={confidentialityAccepted}
                onCheckedChange={setConfidentialityAccepted}
                data-testid="confidentiality-checkbox"
              />
              <Label htmlFor="confidentiality" className="text-[13px] text-gray-700 cursor-pointer leading-snug">
                I have read and accept SETU&rsquo;s standard confidentiality, data-storage and data-sharing terms.
              </Label>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={submitting} data-testid="cancel-confirm-btn">
                Cancel
              </Button>
              <Button
                onClick={onConfirmSubmit}
                disabled={!confidentialityAccepted || submitting}
                className="bg-[#1DA1F2] hover:bg-[#0C7ABF]"
                data-testid="confirm-submit-btn"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Submitting…</>
                  : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm &amp; Submit</>
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

// ─────────────────────── PAYMENT STEP ───────────────────────
const PaymentStep = ({ pricing, loading, onPay }) => (
  <Card className="border-gray-200 shadow-sm">
    <CardContent className="p-7">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{pricing.plan_name}</h2>
          <p className="text-[12.5px] text-gray-500 mt-0.5">
            Unlock priority listing, verified badge, IPO-leads access &amp; direct corporate messages.
          </p>
        </div>
      </div>

      {/* Pricing breakdown */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-[13px]">
        <Row label="Premium membership (1 year)" value={`₹${pricing.base_price.toLocaleString("en-IN")}`} />
        <Row label={`GST @ ${pricing.gst_percent}%`} value={`₹${pricing.gst_amount.toLocaleString("en-IN")}`} />
        <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Total payable</span>
          <span className="text-lg font-bold text-gray-900" data-testid="total-amount">
            ₹{pricing.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Razorpay banner */}
      <div className="mt-4 flex items-center gap-2 text-[12px] text-gray-500 bg-white border border-gray-200 rounded-md p-3">
        <CreditCard className="w-4 h-4 text-blue-500" />
        Secure payment via <span className="font-semibold text-gray-700">Razorpay</span>
        <span className="ml-auto text-[10.5px] uppercase tracking-wider text-gray-400">Test Mode</span>
      </div>

      <Button
        onClick={onPay}
        disabled={loading}
        className="w-full h-12 mt-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[14px] font-semibold shadow-md gap-2"
        data-testid="pay-now-btn"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing payment…</>
          : <><Crown className="w-4 h-4" /> Pay ₹{pricing.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} &amp; Continue</>
        }
      </Button>
    </CardContent>
  </Card>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

const StepDot = ({ done, active, num, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold border ${
      done ? "bg-green-100 text-green-700 border-green-300"
        : active ? "bg-blue-100 text-[#1DA1F2] border-blue-300"
        : "bg-gray-100 text-gray-400 border-gray-200"
    }`}>
      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : num}
    </div>
    <span className={`text-[12.5px] font-medium ${active ? "text-gray-900" : "text-gray-500"}`}>{label}</span>
  </div>
);

// ─────────────────────── ADVANCED DATA STEP ───────────────────────
const AdvancedDataStep = ({
  catalog, firmName, setFirmName, primaryArea, onPickArea, currentSpec,
  primaryValues, updatePrimary, secondaryValues, updateSecondary,
  filesByIdentifier, onUploadFile, onDeleteFile, onSubmit,
}) => (
  <div className="space-y-5">
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Advanced Data</h2>
          <p className="text-[12.5px] text-gray-500 mt-0.5">
            Provide your firm details &amp; primary expertise identifiers. Required fields are marked with *.
          </p>
        </div>

        {/* Firm Name */}
        <div>
          <Label className="text-[12.5px] font-semibold text-gray-700">
            Firm Name <span className="text-gray-400 font-normal">(if applicable)</span>
          </Label>
          <Input
            value={firmName}
            onChange={e => setFirmName(e.target.value)}
            placeholder="e.g. ABC &amp; Associates LLP"
            className="mt-1.5"
            data-testid="firm-name-input"
          />
        </div>

        {/* Primary Area Dropdown */}
        <div>
          <Label className="text-[12.5px] font-semibold text-gray-700">
            Primary Area of Expertise <span className="text-red-500">*</span>
          </Label>
          <p className="text-[11.5px] text-gray-400 mt-0.5">Select the area in which you primarily practise.</p>
          <Select value={primaryArea} onValueChange={onPickArea}>
            <SelectTrigger className="mt-1.5" data-testid="primary-area-select">
              <SelectValue placeholder="Choose your primary expertise" />
            </SelectTrigger>
            <SelectContent>
              {catalog.map(a => (
                <SelectItem key={a.id} value={a.id} data-testid={`primary-area-option-${a.id}`}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    {/* Identifiers — render once primary area is selected */}
    {currentSpec && (
      <>
        <Card className="border-gray-200 shadow-sm" data-testid="primary-identifiers-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#1DA1F2]" />
              <h3 className="text-[14px] font-semibold text-gray-900">Primary Identifiers</h3>
              <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">All required</Badge>
            </div>
            <p className="text-[12px] text-gray-500 mb-4">Regulator: {currentSpec.regulator}</p>
            <div className="space-y-4">
              {currentSpec.primary.map(f => (
                <IdentifierRow
                  key={f.key}
                  field={f}
                  type="primary"
                  required
                  value={primaryValues[f.key] || ""}
                  onChange={v => updatePrimary(f.key, v)}
                  files={filesByIdentifier(f.key)}
                  onUpload={(file) => onUploadFile(f.key, "primary", file)}
                  onDelete={onDeleteFile}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm" data-testid="secondary-identifiers-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h3 className="text-[14px] font-semibold text-gray-900">Secondary / Firm Identifiers</h3>
              <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px]">Optional</Badge>
            </div>
            <p className="text-[12px] text-gray-500 mb-4">Fill these if applicable to your practice or firm.</p>
            <div className="space-y-4">
              {currentSpec.secondary.map(f => (
                <IdentifierRow
                  key={f.key}
                  field={f}
                  type="secondary"
                  value={secondaryValues[f.key] || ""}
                  onChange={v => updateSecondary(f.key, v)}
                  files={filesByIdentifier(f.key)}
                  onUpload={(file) => onUploadFile(f.key, "secondary", file)}
                  onDelete={onDeleteFile}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    )}

    <Button
      onClick={onSubmit}
      disabled={!primaryArea}
      className="w-full h-12 bg-[#1DA1F2] hover:bg-[#0C7ABF] text-white font-semibold gap-2"
      data-testid="advanced-submit-btn"
    >
      <CheckCircle2 className="w-4 h-4" /> Submit Advanced Data
    </Button>
  </div>
);

const IdentifierRow = ({ field, type, required, value, onChange, files, onUpload, onDelete }) => {
  const fileInputRef = useRef(null);
  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start" data-testid={`identifier-row-${field.key}`}>
      <div>
        <Label className="text-[12px] font-semibold text-gray-700">
          {field.label}{required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <p className="text-[11px] text-gray-400 mt-0.5">{field.hint}</p>
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="mt-1.5"
          placeholder={field.hint}
          data-testid={`identifier-input-${field.key}`}
        />
        {/* Uploaded files */}
        {files.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {files.map(f => (
              <div key={f.file_id} className="flex items-center gap-2 text-[11.5px] bg-blue-50 border border-blue-100 rounded px-2 py-1">
                <FileText className="w-3.5 h-3.5 text-[#1DA1F2] flex-shrink-0" />
                <span className="truncate flex-1 text-gray-700">{f.filename}</span>
                <button
                  type="button"
                  onClick={() => onDelete(f.file_id)}
                  className="text-red-500 hover:text-red-700"
                  data-testid={`delete-file-${f.file_id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 pt-5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
          data-testid={`file-input-${field.key}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerUpload}
          className="border-blue-200 text-[#1DA1F2] hover:bg-blue-50 gap-1.5 h-8 text-[11.5px]"
          data-testid={`upload-btn-${field.key}`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </Button>
        <p className="text-[10px] text-gray-400 text-center">PDF/JPG/PNG/DOC · 5MB</p>
      </div>
    </div>
  );
};

export default ExpertPremium;
