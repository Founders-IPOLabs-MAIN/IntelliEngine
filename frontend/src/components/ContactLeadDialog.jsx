import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2, Send, HeadphonesIcon, Briefcase } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MODULE_OPTIONS = [
  "Free IPO Assessment",
  "DRHP Builder",
  "IPO Funding",
  "Match-Making Platform",
  "Business Valuation",
];

export const ContactLeadDialog = ({ open, onOpenChange, leadType = "support" }) => {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [moduleChoice, setModuleChoice] = useState("");
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset form on close
      setFullName(""); setMobile(""); setEmail("");
      setModuleChoice(""); setQuery("");
    }
  }, [open]);

  const isSales = leadType === "sales";
  const title = isSales ? "Contact Sales" : "Contact Support";
  const subtitle = isSales
    ? "Tell us about your IPO goals — our sales team will reach out within 1 business day."
    : "Our support team is here to help. Share your query and we'll get back to you shortly.";
  const Icon = isSales ? Briefcase : HeadphonesIcon;
  const accent = isSales ? "#003366" : "#0A8F5B";

  const validate = () => {
    if (!fullName.trim()) return "Full name is required";
    if (!mobile.trim() || mobile.trim().length < 7) return "A valid mobile number is required";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) return "A valid email address is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/contact/lead`, {
        full_name: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        module: moduleChoice || null,
        query: query.trim(),
        lead_type: leadType,
      });
      toast.success(res.data?.message || "Request submitted successfully!");
      onOpenChange(false);
    } catch (e) {
      const msg = e?.response?.data?.detail || "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]" data-testid={`contact-${leadType}-dialog`}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accent}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="text-sm">{subtitle}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div>
            <Label htmlFor="lead-fullname" className="text-sm">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="lead-fullname"
              data-testid="lead-fullname-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lead-mobile" className="text-sm">Mobile <span className="text-red-500">*</span></Label>
              <Input
                id="lead-mobile"
                data-testid="lead-mobile-input"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^\d+\-\s()]/g, ""))}
                placeholder="+91 98765 43210"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lead-email" className="text-sm">Email <span className="text-red-500">*</span></Label>
              <Input
                id="lead-email"
                data-testid="lead-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lead-module" className="text-sm">Module of Interest <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Select value={moduleChoice} onValueChange={setModuleChoice}>
              <SelectTrigger id="lead-module" data-testid="lead-module-select" className="mt-1">
                <SelectValue placeholder="Select a module" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m} data-testid={`lead-module-option-${m.toLowerCase().replace(/\s+/g, "-")}`}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lead-query" className="text-sm">Your Query <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Textarea
              id="lead-query"
              data-testid="lead-query-textarea"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isSales ? "Tell us about your company, timeline, and what you're looking to achieve..." : "Describe your question or issue..."}
              rows={4}
              className="mt-1 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              data-testid="lead-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="text-white"
              style={{ backgroundColor: accent }}
              data-testid="lead-submit-btn"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Submit</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactLeadDialog;
