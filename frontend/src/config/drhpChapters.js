// DRHP Chapters Configuration based on SEBI ICDR Regulations
// Structure matches standard Indian DRHP format

export const DRHP_CHAPTERS = [
  {
    id: "section-1",
    number: "I",
    title: "General",
    fullTitle: "Section I – General Definitions and Abbreviations",
    hasSubModules: true,
    subModules: [
      {
        id: "definitions-abbreviations",
        title: "Definitions and Abbreviations",
        description: "Industry-specific terms, legal definitions, and abbreviations used throughout the DRHP"
      },
      {
        id: "conventions-financial",
        title: "Certain Conventions, Use of Financial Information and Market Data",
        description: "Currency presentation, financial data sources, and market data conventions"
      },
      {
        id: "forward-looking",
        title: "Forward-Looking Statements",
        description: "Cautionary statements about projections and future performance"
      },
      {
        id: "summary-offer",
        title: "Summary of the Draft Offer Document",
        description: "Executive summary of the entire DRHP for quick reference"
      }
    ]
  },
  {
    id: "section-2",
    number: "II",
    title: "Risk Factors",
    fullTitle: "Section II – Risk Factors",
    hasSubModules: false,
    description: "Comprehensive disclosure of internal, external, and industry-specific risks"
  },
  {
    id: "section-3",
    number: "III",
    title: "Introduction",
    fullTitle: "Section III – Introduction",
    hasSubModules: true,
    subModules: [
      {
        id: "the-offer",
        title: "The Offer",
        description: "Details of the IPO including type, size, and structure of the offer"
      },
      {
        id: "summary",
        title: "Summary",
        description: "Brief overview of the company, business, and key financials"
      },
      {
        id: "financial-information-intro",
        title: "Financial Information",
        description: "Summary of key financial metrics and highlights"
      },
      {
        id: "general-information",
        title: "General Information",
        description: "Company details, registered office, advisors, and key contacts"
      },
      {
        id: "capital-structure",
        title: "Capital Structure",
        description: "Share capital details, shareholding pattern, and equity history"
      },
      {
        id: "objects-of-offer",
        title: "Objects of the Offer",
        description: "Intended use of IPO proceeds and fund deployment schedule"
      },
      {
        id: "basis-for-offer-price",
        title: "Basis for Offer Price",
        description: "Valuation methodology, peer comparison, and price justification"
      },
      {
        id: "statement-tax-benefits",
        title: "Statement of Special Tax Benefits",
        description: "Tax benefits available to company and shareholders"
      }
    ]
  },
  {
    id: "section-4",
    number: "IV",
    title: "About Our Company",
    fullTitle: "Section IV – About Our Company",
    hasSubModules: true,
    subModules: [
      {
        id: "industry-overview",
        title: "Industry Overview",
        description: "Market size, growth trends, competitive landscape, and regulatory environment"
      },
      {
        id: "our-business",
        title: "Our Business",
        description: "Business model, products/services, operations, and competitive strengths"
      },
      {
        id: "key-regulations",
        title: "Key Regulations and Policies in India",
        description: "Applicable laws, regulations, and compliance requirements"
      },
      {
        id: "history-corporate",
        title: "History and Certain Corporate Matters",
        description: "Company history, milestones, and material agreements"
      },
      {
        id: "our-management",
        title: "Our Management",
        description: "Board of Directors, Key Managerial Personnel, and organizational structure"
      },
      {
        id: "promoters-group",
        title: "Our Promoters and Promoter Group",
        description: "Promoter details, background, and group entities"
      },
      {
        id: "dividend-policy",
        title: "Dividend Policy",
        description: "Dividend history and future dividend policy"
      }
    ]
  },
  {
    id: "section-5",
    number: "V",
    title: "Financial Information",
    fullTitle: "Section V – Financial Information",
    hasSubModules: true,
    subModules: [
      {
        id: "restated-financials",
        title: "Restated Consolidated Financial Information",
        description: "Audited restated financial statements as per SEBI requirements"
      },
      {
        id: "other-financial",
        title: "Other Financial Information",
        description: "Pro forma financials, segment-wise data, and related party transactions"
      },
      {
        id: "mda",
        title: "Management's Discussion and Analysis",
        description: "MD&A of financial condition and results of operations"
      },
      {
        id: "capitalisation-statement",
        title: "Capitalisation Statement",
        description: "Pre and post-issue capitalization details"
      },
      {
        id: "financial-indebtedness",
        title: "Financial Indebtedness",
        description: "Borrowings, debt instruments, and repayment schedules"
      }
    ]
  },
  {
    id: "section-6",
    number: "VI",
    title: "Legal and Other Information",
    fullTitle: "Section VI – Legal and Other Information",
    hasSubModules: true,
    subModules: [
      {
        id: "outstanding-litigation",
        title: "Outstanding Litigation and Material Developments",
        description: "Pending cases, claims, and contingent liabilities"
      },
      {
        id: "government-approvals",
        title: "Government and Other Approvals",
        description: "Licenses, permits, and regulatory approvals"
      },
      {
        id: "group-company",
        title: "Our Group Company",
        description: "Details of group companies and subsidiaries"
      },
      {
        id: "other-statutory",
        title: "Other Regulatory and Statutory Disclosures",
        description: "Additional mandatory disclosures as per SEBI regulations"
      }
    ]
  },
  {
    id: "section-7",
    number: "VII",
    title: "Offer Information",
    fullTitle: "Section VII – Offer Information",
    hasSubModules: true,
    subModules: [
      {
        id: "terms-of-offer",
        title: "Terms of the Offer",
        description: "Offer terms, conditions, and ranking of equity shares"
      },
      {
        id: "offer-structure",
        title: "Offer Structure",
        description: "Category-wise allocation and reservation details"
      },
      {
        id: "offer-procedure",
        title: "Offer Procedure",
        description: "Application process, allotment basis, and refund procedures"
      },
      {
        id: "foreign-ownership",
        title: "Restrictions on Foreign Ownership",
        description: "FDI policy, sectoral caps, and foreign investment restrictions"
      }
    ]
  },
  {
    id: "section-8",
    number: "VIII",
    title: "Provisions of Articles",
    fullTitle: "Section VIII – Provisions of the Articles of Association",
    hasSubModules: false,
    description: "Key provisions of the Articles of Association relevant to shareholders"
  },
  {
    id: "section-9",
    number: "IX",
    title: "Other Information",
    fullTitle: "Section IX – Other Information",
    hasSubModules: true,
    subModules: [
      {
        id: "material-contracts",
        title: "Material Contracts and Documents for Inspection",
        description: "List of material agreements and documents available for inspection"
      },
      {
        id: "declaration",
        title: "Declaration",
        description: "Final declaration by the Board of Directors and Promoters"
      }
    ]
  }
];

// Field definitions for each sub-module based on SEBI requirements
export const SUBMODULE_FIELDS = {
  "definitions-abbreviations": {
    tables: [
      {
        id: "industry-terms",
        title: "Industry Related Terms",
        columns: ["Term", "Definition"],
        description: "Industry-specific terminology and definitions"
      },
      {
        id: "company-terms",
        title: "Company Related Terms",
        columns: ["Term", "Definition"],
        description: "Company-specific terms and abbreviations"
      },
      {
        id: "general-terms",
        title: "General Terms",
        columns: ["Term", "Definition"],
        description: "Common business and legal terms"
      },
      {
        id: "abbreviations",
        title: "Abbreviations",
        columns: ["Abbreviation", "Full Form"],
        description: "Standard abbreviations used in the document"
      }
    ]
  },
  "conventions-financial": {
    fields: [
      { id: "currency_presentation", label: "Currency of Presentation", type: "text" },
      { id: "financial_year", label: "Financial Year", type: "text" },
      { id: "accounting_standards", label: "Accounting Standards", type: "textarea" },
      { id: "market_data_sources", label: "Market Data Sources", type: "textarea" },
      { id: "rounding_conventions", label: "Rounding Conventions", type: "textarea" }
    ]
  },
  "forward-looking": {
    fields: [
      { id: "forward_looking_text", label: "Forward-Looking Statements Disclaimer", type: "richtext" },
      { id: "risk_qualifiers", label: "Risk Qualifiers", type: "textarea" }
    ]
  },
  "summary-offer": {
    fields: [
      { id: "company_overview", label: "Company Overview", type: "richtext" },
      { id: "business_summary", label: "Business Summary", type: "richtext" },
      { id: "offer_summary", label: "Offer Summary", type: "richtext" },
      { id: "key_financials", label: "Key Financial Highlights", type: "richtext" }
    ]
  },
  "the-offer": {
    tables: [
      {
        id: "offer-details",
        title: "Offer Details",
        columns: ["Particulars", "Details"],
        defaultRows: [
          ["Offer Type", ""],
          ["Fresh Issue", ""],
          ["Offer for Sale", ""],
          ["Total Offer Size", ""],
          ["Price Band", ""],
          ["Face Value", ""],
          ["Bid Lot", ""],
          ["Minimum Order Quantity", ""]
        ]
      }
    ],
    fields: [
      { id: "offer_description", label: "Offer Description", type: "richtext" }
    ]
  },
  "capital-structure": {
    tables: [
      {
        id: "share-capital",
        title: "Share Capital",
        columns: ["Particulars", "Authorized Capital (₹)", "Issued Capital (₹)", "Paid-up Capital (₹)"],
        description: "Authorized, issued, subscribed, and paid-up share capital"
      },
      {
        id: "shareholding-pattern",
        title: "Shareholding Pattern",
        columns: ["Category", "Pre-IPO Shares", "Pre-IPO %", "Post-IPO Shares", "Post-IPO %"],
        description: "Pre and post-issue shareholding pattern"
      },
      {
        id: "equity-history",
        title: "History of Equity Share Capital",
        columns: ["Date", "No. of Shares", "Face Value", "Issue Price", "Nature of Consideration", "Reason/Allotment"],
        description: "Changes in equity share capital"
      }
    ]
  },
  "objects-of-offer": {
    tables: [
      {
        id: "use-of-proceeds",
        title: "Objects of the Offer",
        columns: ["Object", "Amount (₹ in millions)", "% of Total"],
        defaultRows: [
          ["Fresh Issue Proceeds", "", ""],
          ["Funding capital expenditure", "", ""],
          ["Working capital requirements", "", ""],
          ["Repayment of debt", "", ""],
          ["General corporate purposes", "", ""],
          ["Issue expenses", "", ""]
        ]
      }
    ],
    fields: [
      { id: "objects_details", label: "Detailed Objects Description", type: "richtext" }
    ]
  },
  "basis-for-offer-price": {
    tables: [
      {
        id: "peer-comparison",
        title: "Peer Comparison",
        columns: ["Company Name", "Revenue (₹ Cr)", "PAT (₹ Cr)", "P/E Ratio", "EV/EBITDA", "P/BV"],
        description: "Comparison with listed industry peers"
      },
      {
        id: "valuation-ratios",
        title: "Key Valuation Ratios",
        columns: ["Ratio", "At Floor Price", "At Cap Price"],
        defaultRows: [
          ["P/E Ratio", "", ""],
          ["P/BV Ratio", "", ""],
          ["EV/EBITDA", "", ""],
          ["Market Cap / Sales", "", ""]
        ]
      }
    ],
    fields: [
      { id: "price_justification", label: "Price Justification", type: "richtext" }
    ]
  },
  "industry-overview": {
    fields: [
      { id: "global_market", label: "Global Market Overview", type: "richtext" },
      { id: "indian_market", label: "Indian Market Overview", type: "richtext" },
      { id: "market_size", label: "Market Size and Growth", type: "richtext" },
      { id: "competitive_landscape", label: "Competitive Landscape", type: "richtext" },
      { id: "key_trends", label: "Key Industry Trends", type: "richtext" },
      { id: "regulatory_overview", label: "Regulatory Overview", type: "richtext" }
    ]
  },
  "our-business": {
    fields: [
      { id: "business_overview", label: "Business Overview", type: "richtext" },
      { id: "products_services", label: "Products and Services", type: "richtext" },
      { id: "competitive_strengths", label: "Competitive Strengths", type: "richtext" },
      { id: "business_strategy", label: "Business Strategy", type: "richtext" },
      { id: "operations", label: "Operations and Facilities", type: "richtext" },
      { id: "customers", label: "Key Customers", type: "richtext" },
      { id: "suppliers", label: "Key Suppliers", type: "richtext" }
    ]
  },
  "our-management": {
    tables: [
      {
        id: "board-of-directors",
        title: "Board of Directors",
        columns: ["Name", "DIN", "Designation", "Age", "Date of Appointment", "Qualifications", "Experience"],
        description: "Details of the Board of Directors"
      },
      {
        id: "kmp-details",
        title: "Key Managerial Personnel",
        columns: ["Name", "Designation", "Age", "Date of Joining", "Qualifications", "Experience", "Remuneration"],
        description: "Details of Key Managerial Personnel"
      }
    ]
  },
  "promoters-group": {
    tables: [
      {
        id: "promoter-details",
        title: "Promoter Details",
        columns: ["Name", "Age", "PAN", "Address", "Shareholding", "Nature of Interest"],
        description: "Details of Promoters"
      },
      {
        id: "promoter-group",
        title: "Promoter Group Entities",
        columns: ["Entity Name", "CIN/Registration", "Nature of Relationship", "Principal Business"],
        description: "Details of Promoter Group Companies"
      }
    ]
  },
  "restated-financials": {
    tables: [
      {
        id: "balance-sheet",
        title: "Restated Balance Sheet",
        columns: ["Particulars", "FY 2024", "FY 2023", "FY 2022"],
        description: "Summary restated balance sheet"
      },
      {
        id: "pnl",
        title: "Restated Statement of Profit and Loss",
        columns: ["Particulars", "FY 2024", "FY 2023", "FY 2022"],
        description: "Summary restated P&L statement"
      },
      {
        id: "cash-flow",
        title: "Restated Cash Flow Statement",
        columns: ["Particulars", "FY 2024", "FY 2023", "FY 2022"],
        description: "Summary restated cash flow statement"
      }
    ]
  },
  "mda": {
    fields: [
      { id: "overview", label: "Overview", type: "richtext" },
      { id: "significant_factors", label: "Significant Factors Affecting Results", type: "richtext" },
      { id: "revenue_analysis", label: "Revenue Analysis", type: "richtext" },
      { id: "expense_analysis", label: "Expense Analysis", type: "richtext" },
      { id: "profitability_analysis", label: "Profitability Analysis", type: "richtext" },
      { id: "liquidity", label: "Liquidity and Capital Resources", type: "richtext" }
    ]
  },
  "outstanding-litigation": {
    tables: [
      {
        id: "litigation-by-company",
        title: "Litigation by Company",
        columns: ["Case Details", "Forum", "Opposing Party", "Amount (₹)", "Current Status"],
        description: "Cases filed by the company"
      },
      {
        id: "litigation-against-company",
        title: "Litigation Against Company",
        columns: ["Case Details", "Forum", "Claimant", "Amount (₹)", "Current Status"],
        description: "Cases filed against the company"
      },
      {
        id: "litigation-promoters",
        title: "Litigation Involving Promoters/Directors",
        columns: ["Name", "Case Details", "Forum", "Amount (₹)", "Current Status"],
        description: "Cases involving promoters or directors"
      }
    ]
  },
  "government-approvals": {
    tables: [
      {
        id: "approvals-received",
        title: "Approvals Received",
        columns: ["Approval Type", "Issuing Authority", "Date of Issue", "Validity", "Remarks"],
        description: "Licenses and approvals already obtained"
      },
      {
        id: "approvals-pending",
        title: "Approvals Pending",
        columns: ["Approval Type", "Issuing Authority", "Date Applied", "Expected Date", "Status"],
        description: "Licenses and approvals pending"
      }
    ]
  },
  "terms-of-offer": {
    fields: [
      { id: "ranking_shares", label: "Ranking of Equity Shares", type: "richtext" },
      { id: "mode_of_payment", label: "Mode of Payment", type: "richtext" },
      { id: "market_lot", label: "Market Lot", type: "text" },
      { id: "nomination_facility", label: "Nomination Facility", type: "richtext" }
    ]
  },
  "offer-structure": {
    tables: [
      {
        id: "category-allocation",
        title: "Category-wise Allocation",
        columns: ["Category", "% of Offer", "No. of Shares", "Amount (₹)"],
        defaultRows: [
          ["QIBs", "", "", ""],
          ["NIIs", "", "", ""],
          ["Retail Individual Investors", "", "", ""],
          ["Employees", "", "", ""]
        ]
      }
    ]
  },
  "offer-procedure": {
    fields: [
      { id: "bid_process", label: "Bidding Process", type: "richtext" },
      { id: "basis_allotment", label: "Basis of Allotment", type: "richtext" },
      { id: "refund_procedure", label: "Refund Procedure", type: "richtext" },
      { id: "credit_of_shares", label: "Credit of Shares to Demat Account", type: "richtext" }
    ]
  },
  "material-contracts": {
    tables: [
      {
        id: "material-contracts-list",
        title: "Material Contracts",
        columns: ["Contract Name", "Parties", "Date", "Brief Description", "Material Terms"],
        description: "List of material contracts entered into"
      },
      {
        id: "documents-inspection",
        title: "Documents Available for Inspection",
        columns: ["Document", "Location", "Timing"],
        description: "Documents available for public inspection"
      }
    ]
  },
  "declaration": {
    fields: [
      { id: "declaration_text", label: "Declaration", type: "richtext", 
        defaultValue: "We hereby declare that all relevant provisions of the Companies Act, 2013 and the rules made thereunder, the Securities Contracts (Regulation) Act, 1956, the Securities and Exchange Board of India Act, 1992, the Securities and Exchange Board of India (Issue of Capital and Disclosure Requirements) Regulations, 2018, as amended, and all other applicable laws, rules, regulations and guidelines issued by the Government of India or the Securities and Exchange Board of India established under the Securities and Exchange Board of India Act, 1992, as the case may be, have been complied with and no statement made in this Draft Red Herring Prospectus is contrary to the provisions of the said Acts or rules or regulations or guidelines, as the case may be." 
      }
    ]
  }
};

export default DRHP_CHAPTERS;
