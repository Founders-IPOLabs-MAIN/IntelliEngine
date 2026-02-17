import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ChevronRight,
  Upload,
  Download,
  FileText,
  Trash2,
  Loader2,
  Save,
  Scan,
  Check,
  AlertCircle,
  Clock,
  Plus,
  X,
  Building,
  User,
  Phone,
  Mail,
  Globe,
  BookOpen,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  Scale,
  FileCheck
} from "lucide-react";

// Section-specific form configurations
const SECTION_FORMS = {
  "Cover Page": {
    description: "Basic information about the issuer including company name, logo, contact details, lead managers, and registrar.",
    fields: [
      { name: "company_name", label: "Company Name", type: "text", placeholder: "Enter company legal name", icon: Building },
      { name: "company_logo_url", label: "Company Logo URL", type: "text", placeholder: "https://...", icon: FileText },
      { name: "registered_address", label: "Registered Office Address", type: "textarea", placeholder: "Enter full registered address" },
      { name: "corporate_address", label: "Corporate Office Address", type: "textarea", placeholder: "Enter corporate office address" },
      { name: "contact_person", label: "Contact Person", type: "text", placeholder: "Name of contact person", icon: User },
      { name: "contact_email", label: "Contact Email", type: "email", placeholder: "email@company.com", icon: Mail },
      { name: "contact_phone", label: "Contact Phone", type: "text", placeholder: "+91 XXXXX XXXXX", icon: Phone },
      { name: "website", label: "Company Website", type: "text", placeholder: "https://www.company.com", icon: Globe },
      { name: "lead_managers", label: "Book Running Lead Managers (BRLMs)", type: "textarea", placeholder: "Enter lead manager names, one per line" },
      { name: "registrar", label: "Registrar to the Issue", type: "text", placeholder: "Enter registrar name" },
      { name: "legal_advisors", label: "Legal Advisors", type: "textarea", placeholder: "Enter legal advisor names" }
    ]
  },
  "Definitions and Abbreviations": {
    description: "List of technical terms and abbreviations used throughout the DRHP document for reference.",
    fields: [
      { name: "definitions", label: "Definitions", type: "textarea", placeholder: "Enter each definition on a new line in format: Term: Definition" },
      { name: "abbreviations", label: "Abbreviations", type: "textarea", placeholder: "Enter each abbreviation on a new line in format: ABBR: Full Form" },
      { name: "industry_terms", label: "Industry-Specific Terms", type: "textarea", placeholder: "Enter industry-specific terminology" }
    ]
  },
  "Risk Factors": {
    description: "Comprehensive disclosure of internal, external, business, regulatory, legal, and financial risks.",
    fields: [
      { name: "internal_risks", label: "Internal Risks", type: "textarea", placeholder: "Risks arising from within the company operations" },
      { name: "external_risks", label: "External Risks", type: "textarea", placeholder: "Risks from external market conditions" },
      { name: "business_risks", label: "Business Risks", type: "textarea", placeholder: "Risks related to business model and operations" },
      { name: "regulatory_risks", label: "Regulatory Risks", type: "textarea", placeholder: "Risks from regulatory changes and compliance" },
      { name: "legal_risks", label: "Legal Risks", type: "textarea", placeholder: "Risks from litigation and legal matters" },
      { name: "financial_risks", label: "Financial Risks", type: "textarea", placeholder: "Risks related to financial performance and liquidity" }
    ]
  },
  "Introduction and Summary": {
    description: "Overview of the offer, type of issue (fresh/OFS), summary of business, industry, and key financial metrics.",
    fields: [
      { name: "offer_overview", label: "Overview of the Offer", type: "textarea", placeholder: "Describe the IPO offer details" },
      { name: "issue_type", label: "Type of Issue", type: "select", options: ["Fresh Issue", "Offer for Sale (OFS)", "Fresh Issue + OFS"] },
      { name: "issue_size", label: "Issue Size (₹ Crores)", type: "text", placeholder: "Enter issue size" },
      { name: "price_band", label: "Price Band (₹)", type: "text", placeholder: "e.g., ₹100 - ₹120" },
      { name: "business_summary", label: "Summary of Business", type: "textarea", placeholder: "Brief description of the company's business" },
      { name: "industry_summary", label: "Summary of Industry", type: "textarea", placeholder: "Brief overview of the industry" },
      { name: "key_financials", label: "Key Financial Metrics", type: "textarea", placeholder: "Revenue, PAT, EBITDA, etc." }
    ]
  },
  "Capital Structure": {
    description: "Details of authorized capital, paid-up capital, pre-IPO and post-IPO shareholding patterns.",
    fields: [
      { name: "authorized_capital", label: "Authorized Share Capital (₹)", type: "text", placeholder: "Enter authorized capital" },
      { name: "paid_up_capital", label: "Paid-up Share Capital (₹)", type: "text", placeholder: "Enter paid-up capital" },
      { name: "face_value", label: "Face Value per Share (₹)", type: "text", placeholder: "e.g., ₹10" },
      { name: "pre_ipo_shareholding", label: "Pre-IPO Shareholding Pattern", type: "textarea", placeholder: "Promoter %, Public %, Employees %, etc." },
      { name: "post_ipo_shareholding", label: "Post-IPO Shareholding Pattern", type: "textarea", placeholder: "Expected post-IPO shareholding" },
      { name: "equity_non_cash", label: "Equity Shares for Consideration Other Than Cash", type: "textarea", placeholder: "Details of shares issued for non-cash consideration" }
    ]
  },
  "Objects of the Issue": {
    description: "How the company intends to use funds raised - debt repayment, expansion, capital expenditure, working capital.",
    fields: [
      { name: "total_proceeds", label: "Total Gross Proceeds (₹ Crores)", type: "text", placeholder: "Enter total proceeds" },
      { name: "debt_repayment", label: "Repayment/Prepayment of Debt (₹ Crores)", type: "text", placeholder: "Amount for debt repayment" },
      { name: "capex", label: "Capital Expenditure (₹ Crores)", type: "text", placeholder: "Amount for capex" },
      { name: "working_capital", label: "Working Capital Requirements (₹ Crores)", type: "text", placeholder: "Amount for working capital" },
      { name: "acquisition", label: "Acquisitions/Investments (₹ Crores)", type: "text", placeholder: "Amount for acquisitions" },
      { name: "general_corporate", label: "General Corporate Purposes (₹ Crores)", type: "text", placeholder: "Amount for general purposes" },
      { name: "objects_details", label: "Detailed Description of Objects", type: "textarea", placeholder: "Detailed breakdown of fund utilization" }
    ]
  },
  "Basis for Issue Price": {
    description: "Qualitative and quantitative factors justifying the issue price, with peer comparison analysis.",
    fields: [
      { name: "qualitative_factors", label: "Qualitative Factors", type: "textarea", placeholder: "Business strengths, market position, brand value, etc." },
      { name: "quantitative_factors", label: "Quantitative Factors", type: "textarea", placeholder: "Financial ratios, growth metrics, margins" },
      { name: "eps", label: "Earnings Per Share (EPS) - ₹", type: "text", placeholder: "Basic and diluted EPS" },
      { name: "pe_ratio", label: "Price to Earnings (P/E) Ratio", type: "text", placeholder: "P/E at floor and cap price" },
      { name: "roe", label: "Return on Equity (ROE) %", type: "text", placeholder: "ROE percentage" },
      { name: "ronw", label: "Return on Net Worth (RONW) %", type: "text", placeholder: "RONW percentage" },
      { name: "nav", label: "Net Asset Value (NAV) per Share - ₹", type: "text", placeholder: "NAV per share" },
      { name: "peer_comparison", label: "Comparison with Listed Peers", type: "textarea", placeholder: "Comparison table with similar listed companies" }
    ]
  },
  "Industry Overview": {
    description: "Market size, growth trends, demand drivers, and competitive landscape of the sector.",
    fields: [
      { name: "industry_name", label: "Industry/Sector Name", type: "text", placeholder: "Enter industry name" },
      { name: "market_size", label: "Market Size (₹ Crores)", type: "text", placeholder: "Current market size" },
      { name: "growth_rate", label: "Industry Growth Rate (CAGR %)", type: "text", placeholder: "Historical and projected CAGR" },
      { name: "growth_trends", label: "Growth Trends", type: "textarea", placeholder: "Key growth trends in the industry" },
      { name: "demand_drivers", label: "Key Demand Drivers", type: "textarea", placeholder: "Factors driving industry demand" },
      { name: "competitive_landscape", label: "Competitive Landscape", type: "textarea", placeholder: "Major players and market share" },
      { name: "entry_barriers", label: "Entry Barriers", type: "textarea", placeholder: "Barriers to entry in the industry" },
      { name: "regulatory_environment", label: "Regulatory Environment", type: "textarea", placeholder: "Key regulations governing the industry" }
    ]
  },
  "Business Overview": {
    description: "Company's business model, operations, products/services, strengths, strategies, and key customers.",
    fields: [
      { name: "business_model", label: "Business Model", type: "textarea", placeholder: "Describe the company's business model" },
      { name: "history", label: "Company History & Milestones", type: "textarea", placeholder: "Key milestones and history" },
      { name: "products_services", label: "Products/Services", type: "textarea", placeholder: "Description of products and services offered" },
      { name: "operations", label: "Operations", type: "textarea", placeholder: "Operational details, facilities, locations" },
      { name: "strengths", label: "Competitive Strengths", type: "textarea", placeholder: "Key competitive advantages" },
      { name: "strategies", label: "Business Strategies", type: "textarea", placeholder: "Growth and business strategies" },
      { name: "key_customers", label: "Key Customers", type: "textarea", placeholder: "Major customers and client relationships" },
      { name: "suppliers", label: "Key Suppliers", type: "textarea", placeholder: "Major suppliers and vendor relationships" }
    ]
  },
  "Management & Promoter Group": {
    description: "Information about directors, Key Managerial Personnel (KMPs), their experience, and promoter details.",
    fields: [
      { name: "promoters", label: "Promoter Details", type: "textarea", placeholder: "Name, age, qualifications, experience of promoters" },
      { name: "promoter_group", label: "Promoter Group Entities", type: "textarea", placeholder: "List of promoter group companies" },
      { name: "board_directors", label: "Board of Directors", type: "textarea", placeholder: "Name, designation, qualifications, experience of each director" },
      { name: "kmps", label: "Key Managerial Personnel (KMPs)", type: "textarea", placeholder: "CEO, CFO, CS and their details" },
      { name: "senior_management", label: "Senior Management Team", type: "textarea", placeholder: "Other key executives and their profiles" },
      { name: "compensation", label: "Compensation Details", type: "textarea", placeholder: "Remuneration of directors and KMPs" },
      { name: "interest_conflicts", label: "Interest & Conflicts", type: "textarea", placeholder: "Any interests or conflicts of promoters/directors" }
    ]
  },
  "Financial Information": {
    description: "Restated audited financials (3-5 years) including Balance Sheet, P&L, Cash Flow, and MD&A.",
    fields: [
      { name: "standalone_financials", label: "Restated Standalone Financials Summary", type: "textarea", placeholder: "Last 3-5 years standalone financial summary" },
      { name: "consolidated_financials", label: "Restated Consolidated Financials Summary", type: "textarea", placeholder: "Last 3-5 years consolidated financial summary" },
      { name: "revenue_trend", label: "Revenue Trend (₹ Crores)", type: "textarea", placeholder: "Year-wise revenue figures" },
      { name: "profit_trend", label: "Profit After Tax Trend (₹ Crores)", type: "textarea", placeholder: "Year-wise PAT figures" },
      { name: "balance_sheet_highlights", label: "Balance Sheet Highlights", type: "textarea", placeholder: "Key balance sheet items" },
      { name: "cash_flow_highlights", label: "Cash Flow Highlights", type: "textarea", placeholder: "Operating, investing, financing cash flows" },
      { name: "key_ratios", label: "Key Financial Ratios", type: "textarea", placeholder: "EBITDA margin, Net margin, ROE, ROCE, D/E ratio, etc." },
      { name: "mda", label: "Management Discussion & Analysis", type: "textarea", placeholder: "MD&A summary" }
    ]
  },
  "Legal and Regulatory Matters": {
    description: "Pending litigation, criminal proceedings, tax disputes, and regulatory actions disclosure.",
    fields: [
      { name: "pending_litigation", label: "Pending Litigation", type: "textarea", placeholder: "Details of pending civil cases" },
      { name: "criminal_proceedings", label: "Criminal Proceedings", type: "textarea", placeholder: "Any criminal cases against company/promoters" },
      { name: "tax_disputes", label: "Tax Disputes", type: "textarea", placeholder: "Outstanding tax demands and disputes" },
      { name: "regulatory_actions", label: "Regulatory Actions", type: "textarea", placeholder: "Actions by SEBI, RBI, or other regulators" },
      { name: "material_developments", label: "Material Developments", type: "textarea", placeholder: "Any material developments post balance sheet date" },
      { name: "contingent_liabilities", label: "Contingent Liabilities", type: "textarea", placeholder: "Contingent liabilities not provided for" }
    ]
  },
  "Other Information/Disclosures": {
    description: "Material contracts, important documents, statutory approvals, and other mandatory disclosures.",
    fields: [
      { name: "material_contracts", label: "Material Contracts", type: "textarea", placeholder: "Details of material contracts entered" },
      { name: "statutory_approvals", label: "Statutory and Government Approvals", type: "textarea", placeholder: "List of approvals obtained and pending" },
      { name: "related_party", label: "Related Party Transactions", type: "textarea", placeholder: "Details of related party transactions" },
      { name: "subsidiary_details", label: "Subsidiary & Associate Details", type: "textarea", placeholder: "Details of subsidiaries and associates" },
      { name: "documents_inspection", label: "Documents Available for Inspection", type: "textarea", placeholder: "List of documents available at registered office" },
      { name: "general_disclosures", label: "Other General Disclosures", type: "textarea", placeholder: "Any other mandatory disclosures" }
    ]
  }
};

const SectionEditor = ({ user, apiClient }) => {
  const { projectId, sectionId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [section, setSection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState({});
  const [formData, setFormData] = useState({});
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("form");

  useEffect(() => {
    fetchData();
  }, [projectId, sectionId]);

  const fetchData = async () => {
    try {
      const [projectRes, sectionRes, docsRes] = await Promise.all([
        apiClient.get(`/projects/${projectId}`),
        apiClient.get(`/projects/${projectId}/sections/${sectionId}`),
        apiClient.get(`/documents?section_id=${sectionId}`)
      ]);
      setProject(projectRes.data);
      setSection(sectionRes.data);
      setDocuments(docsRes.data);
      
      // Load existing content into form data
      const content = sectionRes.data.content || {};
      setFormData(content.fields || {});
      setNotes(content.notes || "");
    } catch (error) {
      console.error("Failed to fetch data:", error);
      navigate(`/drhp-builder/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/projects/${projectId}/sections/${sectionId}`, {
        content: { fields: formData, notes: notes },
        status: section.status
      });
      toast.success("Section saved successfully");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await apiClient.put(`/projects/${projectId}/sections/${sectionId}`, {
        status: newStatus
      });
      setSection(response.data);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("project_id", projectId);
        formDataUpload.append("section_id", sectionId);
        
        const response = await apiClient.post("/documents/upload", formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        setDocuments(prev => [...prev, response.data]);
        toast.success(`${file.name} uploaded successfully`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await apiClient.get(`/documents/${doc.document_id}/download`, {
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDownloadLatest = async () => {
    if (documents.length === 0) {
      toast.error("No documents to download");
      return;
    }
    // Download the most recently uploaded document
    const latestDoc = documents[documents.length - 1];
    await handleDownload(latestDoc);
  };

  const handleDelete = async (docId) => {
    try {
      await apiClient.delete(`/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.document_id !== docId));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleOCR = async (doc) => {
    setOcrProcessing(prev => ({ ...prev, [doc.document_id]: true }));
    try {
      const response = await apiClient.post(`/documents/${doc.document_id}/ocr`, {
        document_id: doc.document_id,
        prompt: `Extract all text, tables, and structured data from this document for the ${section?.section_name} section of a DRHP. Organize the output clearly with appropriate headings.`
      });
      
      // Append OCR text to notes
      setNotes(prev => prev + (prev ? "\n\n" : "") + "--- OCR Extracted Text ---\n" + response.data.ocr_text);
      
      // Update document in list
      setDocuments(prev => prev.map(d => 
        d.document_id === doc.document_id 
          ? { ...d, ocr_status: "completed", ocr_text: response.data.ocr_text }
          : d
      ));
      
      toast.success("OCR completed - text added to notes");
      setActiveTab("notes");
    } catch (error) {
      console.error("OCR failed:", error);
      toast.error("OCR processing failed");
    } finally {
      setOcrProcessing(prev => ({ ...prev, [doc.document_id]: false }));
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const getOcrStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-green-600" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const sectionConfig = SECTION_FORMS[section?.section_name] || {
    description: "Section content and documents",
    fields: [{ name: "content", label: "Content", type: "textarea", placeholder: "Enter section content" }]
  };

  const renderField = (field) => {
    const value = formData[field.name] || "";
    const IconComponent = field.icon;
    
    if (field.type === "select") {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium">{field.label}</Label>
          <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger id={field.name} data-testid={`field-${field.name}`}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    if (field.type === "textarea") {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium">{field.label}</Label>
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[120px] resize-none"
            data-testid={`field-${field.name}`}
          />
        </div>
      );
    }
    
    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name} className="text-sm font-medium">{field.label}</Label>
        <div className="relative">
          {IconComponent && (
            <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
          <Input
            id={field.name}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={IconComponent ? "pl-10" : ""}
            data-testid={`field-${field.name}`}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white" data-testid="section-editor-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => navigate("/dashboard")} className="hover:text-black">Dashboard</button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => navigate(`/drhp-builder/${projectId}`)} className="hover:text-black">DRHP Builder</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-black font-medium">{section?.section_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black">
                {section?.section_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {sectionConfig.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={section?.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32" data-testid="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2"
                data-testid="save-btn"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-4 h-4" />Save</>
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="form" className="gap-2">
                    <FileCheck className="w-4 h-4" />
                    Structured Form
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Notes & OCR
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="form" className="mt-0">
                  <Card className="border border-border">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold">Section Details</CardTitle>
                      <CardDescription>Fill in the structured information for this section</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {sectionConfig.fields.map(renderField)}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notes" className="mt-0">
                  <Card className="border border-border">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold">Notes & OCR Content</CardTitle>
                      <CardDescription>Additional notes and OCR-extracted content from documents</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes, extracted OCR text, or any additional content here..."
                        className="min-h-[500px] font-mono text-sm resize-none"
                        data-testid="notes-textarea"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Documents Panel */}
            <div className="space-y-6">
              {/* Upload Zone */}
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Documents
                    </CardTitle>
                    {documents.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-8"
                        onClick={handleDownloadLatest}
                        data-testid="download-latest-btn"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Latest
                      </Button>
                    )}
                  </div>
                  <CardDescription>Upload documents for OCR scanning and reference</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`drop-zone rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? "drag-over" : ""}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="upload-zone"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                    />
                    {uploading ? (
                      <Loader2 className="w-8 h-8 mx-auto text-[#1DA1F2] animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {uploading ? "Uploading..." : "Drop files here or click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Word, Excel, Images
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Document List */}
              {documents.length > 0 && (
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Uploaded Files ({documents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[350px]">
                      <div className="divide-y divide-border">
                        {documents.map((doc, index) => (
                          <div key={doc.document_id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-black truncate" title={doc.filename}>
                                  {doc.filename}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.file_size)}
                                  </span>
                                  <span className="text-xs flex items-center gap-1" title={`OCR: ${doc.ocr_status}`}>
                                    {getOcrStatusIcon(doc.ocr_status)}
                                    <span className="text-muted-foreground capitalize">{doc.ocr_status}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 flex-1"
                                onClick={() => handleOCR(doc)}
                                disabled={ocrProcessing[doc.document_id]}
                                data-testid={`ocr-btn-${index}`}
                              >
                                {ocrProcessing[doc.document_id] ? (
                                  <><Loader2 className="w-3 h-3 animate-spin" />Processing</>
                                ) : (
                                  <><Scan className="w-3 h-3" />OCR Scan</>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleDownload(doc)}
                                data-testid={`download-btn-${index}`}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(doc.document_id)}
                                data-testid={`delete-btn-${index}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Help Card */}
              <Card className="border border-border bg-blue-50/50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm text-black mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#1DA1F2]" />
                    Tips for this Section
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Upload relevant documents and use OCR to extract text</li>
                    <li>• Fill structured form fields for organized data</li>
                    <li>• Use Notes tab for additional content and OCR output</li>
                    <li>• Save frequently to avoid losing work</li>
                    <li>• Change status to "Review" when ready for verification</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SectionEditor;
