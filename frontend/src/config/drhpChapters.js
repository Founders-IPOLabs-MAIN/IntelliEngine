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
        id: "general-terms",
        title: "General Terms",
        columns: ["Term", "Definition"],
        description: "General terms related to the company and its operations",
        defaultRows: [
          ["Our Company or the Company or the Issuer", '"_____", "we", "us" or "our" - Unless the context otherwise indicates or implies, refers to our Company and our Subsidiaries (as defined below), collectively.']
        ]
      },
      {
        id: "company-terms",
        title: "Company Related Terms",
        columns: ["Term", "Definition"],
        description: "Company-specific terms, committees, and key personnel",
        defaultRows: [
          ["Articles or Articles of Association", "The articles of association of our Company, as amended from time to time."],
          ["Associate", "____"],
          ["Audit Committee", 'The audit committee of our Board, as described in "Our Management – Board Committees – Audit Committee" on page ___.'],
          ["Board or Board of Directors", "The board of directors of our Company. For details, see \"Our Management\" on page ___."],
          ["Bonus CCPS", "Bonus compulsorily convertible preference shares having face value of ₹10 each."],
          ["Chief Executive Officer or CEO", "The chief executive officer of our Company. For details, see \"Our Management\" on page ___."],
          ["Chief Financial Officer or CFO", "The chief financial officer of our Company. For details, see \"Our Management\" on page ___."],
          ["Class A equity shares", "Class A equity shares having face value of ₹2 each."],
          ["Company Secretary and Compliance Officer", "The company secretary and compliance officer of our Company. For details, see \"Our Management\" on page ___."],
          ["Chief Operating Officer or COO", "The chief operating officer of our Company. For details, see \"Our Management\" on page ___."],
          ["Chief Technology Officer or CTO", "The chief technology officer of our Company. For details, see \"Our Management\" on page ___."],
          ["Director(s)", "The director(s) on our Board. For details, see \"Our Management\" on page ___."],
          ["Equity Shares", "The equity shares of our Company of face value of ₹___ each."],
          ["ESOP Scheme", "____"],
          ["Group Company or Our group company or companies", "____"],
          ["Independent Director(s)", "The independent director(s) on our Board. For details, see \"Our Management\" on page ___."],
          ["Investor Selling Shareholders", "Collectively: ____"],
          ["IPO Committee", "The IPO committee of our Board for the purpose of the Offer."],
          ["Key Managerial Personnel", 'The key managerial personnel of our Company in terms of Regulation 2(1)(bb) of the SEBI ICDR Regulations and as disclosed in "Our Management – Key Managerial Personnel and Senior Management – Key Managerial Personnel" on page ___.'],
          ["Materiality Policy", "Policy for identification of (i) companies to be disclosed as group companies; (ii) material outstanding civil litigation proceedings involving our Company, our Subsidiaries, our Promoters, our Directors, and our Group Company, and (iii) material creditors of the Company, pursuant to the disclosure requirements under SEBI ICDR Regulations, as adopted by the Board pursuant to its resolution dated ___."],
          ["Material Subsidiaries", "____"],
          ["Memorandum of Association", "The memorandum of association of our Company, as amended from time to time."],
          ["Nomination and Remuneration Committee", 'The nomination and remuneration committee of our Board, as described in "Our Management – Board Committees – Nomination and Remuneration Committee" on page ___.'],
          ["Nominee Director", 'As disclosed in "Our Management" on page ___.'],
          ["Preference Shares", "____"],
          ["Promoter Group", 'The individuals and entities constituting the promoter group of our Company in terms of Regulation 2(1)(pp) of the SEBI ICDR Regulations. For details, see "Our Promoters and Promoter Group" on page ___.'],
          ["Promoter Selling Shareholders", "Collectively, ____"],
          ["Promoters", "The promoters of our Company, namely, ____"],
          ["Registered Office or Registered and Corporate Office", "The registered office of our Company is situated at ___."],
          ["Registrar of Companies or RoC", "The Registrar of Companies, ___."],
          ["Restated Consolidated Financial Information", "The restated consolidated financial information of our Company for the ___ ended ___."],
          ["Risk Management Committee", 'The risk management committee of our Board, as described in "Our Management – Board Committees – Risk Management Committee" on page ___.'],
          ["Scheme of Amalgamation", "Scheme of amalgamation amongst our Company, ___."],
          ["Selling Shareholders", "Collectively, the Promoter Selling Shareholders and the Investor Selling Shareholders."],
          ["Senior Management", 'The senior management of our Company in terms of Regulation 2(1)(bbbb) of the SEBI ICDR Regulations and as disclosed in "Our Management – Key Managerial Personnel and Senior Management – Senior Management" on page ___.'],
          ["Series A1 CCPS", "Series A1 compulsorily convertible preference shares having face value ₹10 each."],
          ["Series A2 CCPS", "Series A2 compulsorily convertible preference shares having face value ₹10 each."],
          ["Series B CCPS", "Series B compulsorily convertible preference shares having face value ₹10 each."],
          ["Series C1 CCPS", "Series C1 compulsorily convertible preference shares having face value ₹10 each."],
          ["Series D CCPS", "Series D compulsorily convertible preference shares having face value ₹10 each."],
          ["Series E CCPS", "Series E compulsorily convertible preference shares having face value ₹10 each."],
          ["SHA", "Shareholders Agreement dated ___."],
          ["Shareholders", "The equity shareholders and preference shareholders of our Company from time to time."],
          ["Stakeholders' Relationship Committee", 'The stakeholders\' relationship committee of our Board, as described in "Our Management – Board Committees – Stakeholders\' Relationship Committee" on page ___.'],
          ["Statutory Auditor", "The current statutory auditor of our Company, namely, ___."],
          ["Subsidiaries", "The subsidiaries of our Company, namely ___."],
          ["Whole-time Director(s)", 'The executive director(s) on our Board. For details, see "Our Management" on page ___.']
        ]
      },
      {
        id: "offer-terms",
        title: "Offer Related Terms",
        columns: ["Term", "Definition"],
        description: "Terms related to the IPO offer, bidding, and allotment process",
        defaultRows: [
          ["Abridged Prospectus", "Abridged prospectus means a memorandum containing such salient features of the prospectus as may be specified by SEBI in this regard."],
          ["Acknowledgement Slip", "The slip or document issued by the relevant Designated Intermediary(ies) to the Bidder as proof of registration of the Bid cum Application Form."],
          ["Allot or Allotment or Allotted", "Unless the context otherwise requires, allotment or transfer, as the case may be of Equity Shares offered pursuant to the Fresh Issue and transfer of the Offered Shares by the Selling Shareholders pursuant to the Offer for Sale to the successful Bidders."],
          ["Allotment Advice", "Advice or intimation of Allotment sent to the successful Bidders who have Bid in the Offer or are to be Allotted the Equity Shares after the Basis of Allotment has been approved by the Designated Stock Exchange."],
          ["Allottee", "A successful Bidder to whom an Allotment is made."],
          ["Anchor Investor", "____"],
          ["Allocation Price", "The price at which Equity Shares will be allocated to Anchor Investors according to the terms of the Red Herring Prospectus, which will be decided by our Company in consultation with the BRLMs during the Anchor Investor Bid/Offer Period."],
          ["Anchor Investor Application Form", "The form used by an Anchor Investor to make a Bid in the Anchor Investor Portion and which will be considered as an application for Allotment in terms of the Red Herring Prospectus and under the SEBI ICDR Regulations."],
          ["Anchor Investor Bid/Offer Period", "The date, one Working Day prior to the Bid/Offer Opening Date, on which Bids by Anchor Investors shall be submitted."],
          ["Anchor Investor Offer Price", "The price at which the Equity Shares will be Allotted to Anchor Investors in terms of the Red Herring Prospectus and the Prospectus."],
          ["Anchor Investor Pay-in Date", "With respect to Anchor Investor(s), it shall be the Anchor Investor Bidding Date, and in the event the Anchor Investor Allocation Price is lower than the Offer Price, not later than two Working Days after the Bid/Offer Closing Date."],
          ["Anchor Investor Portion", "Up to 60% of the QIB Portion which may be allocated by our Company in consultation with the BRLMs, to Anchor Investors on a discretionary basis."],
          ["ASBA Account", "Account maintained with an SCSB which may be blocked by such SCSB to the extent of the Bid Amount of the ASBA Bidder."],
          ["ASBA Bid", "A Bid made by an ASBA Bidder."],
          ["ASBA Bidder(s)", "Any Bidder (other than an Anchor Investor) in the Offer."],
          ["ASBA Form", "An application form, whether physical or electronic, used by ASBA Bidders which will be considered as the application for Allotment in terms of the Red Herring Prospectus and the Prospectus."],
          ["ASBA or Application Supported by Blocked Amount", "An application, whether physical or electronic, used by ASBA Bidders, other than Anchor Investors, to make a Bid and authorising an SCSB to block the Bid Amount in the specified bank account."],
          ["Banker(s) to the Offer", "Collectively, the Escrow Collection Bank(s), the Refund Bank(s), the Public Offer Account Bank(s) and the Sponsor Bank(s), as the case may be."],
          ["Basis of Allotment", 'Basis on which Equity Shares will be Allotted to successful Bidders under the Offer, described in "Offer Procedure" on page ___.'],
          ["Bid Amount", "The highest value of optional Bids indicated in the Bid cum Application Form, and payable by the Bidder or blocked in the ASBA Account of the ASBA Bidder."],
          ["Bid cum Application Form", "The Anchor Investor Application Form or the ASBA Form, as the context requires."],
          ["Bid Lot", "[●] Equity Shares of face value of ₹___ each and in multiples of [●] Equity Shares thereafter."],
          ["Bid(s)", "An indication by a ASBA Bidder to make an offer during the Bid/Offer Period pursuant to submission of the ASBA Form."],
          ["Bid/Offer Closing Date", "Except in relation to any Bids received from the Anchor Investors, the date after which the Designated Intermediaries will not accept any Bids."],
          ["Bid/Offer Opening Date", "Except in relation to any Bids received from the Anchor Investors, the date on which the Designated Intermediaries shall start accepting Bids."],
          ["Bid/Offer Period", "Except in relation to Anchor Investors, the period between the Bid/Offer Opening Date and the Bid/Offer Closing Date, inclusive of both days."],
          ["Bidder or Applicant", "Any prospective investor who makes a Bid pursuant to the terms of the Red Herring Prospectus and the Bid cum Application Form."],
          ["Book Building Process", "Book building process, as provided in Schedule XIII of the SEBI ICDR Regulations, in terms of which the Offer is being made."],
          ["Book Running Lead Managers or BRLMs", "The book running lead managers to the Offer, being ___."],
          ["Cap Price", "The higher end of the Price Band, subject to any revisions thereto, above which the Offer Price and Anchor Investor Offer Price will not be finalised."],
          ["Cut-Off Price", "Offer Price, which shall be any price within the Price Band, finalised by our Company in consultation with the BRLMs."],
          ["Designated Date", "The date on which the Escrow Collection Bank(s) transfer funds from the Escrow Account to the Public Offer Account."],
          ["Designated Stock Exchange", "____"],
          ["Floor Price", "The lower end of the Price Band, subject to any revision thereto, not being less than the face value of the Equity Shares."],
          ["Fresh Issue", "The issue of ___ Equity Shares of face value of ₹___ each, at ₹___ per Equity Share aggregating up to ₹___ by our Company."],
          ["Gross Proceeds", "The gross proceeds of the Fresh Issue that will be available to our Company."],
          ["Monitoring Agency", "____"],
          ["Mutual Fund Portion", "The portion of the Offer being 5% of the Net QIB Portion, which shall be available for allocation to Mutual Funds only."],
          ["Net Proceeds", "Proceeds of the Fresh Issue less our Company's share of the Offer expenses."],
          ["Net QIB Portion", "The QIB Portion less the number of Equity Shares Allotted to the Anchor Investors."],
          ["Non-Institutional Bidder(s) or NIB(s)", "Bidders that are not QIBs or RIIs and who have Bid for Equity Shares for an amount more than ₹___."],
          ["Non-Institutional Portion", "The portion of the Offer being not more than 15% of the Offer, available for allocation to Non-Institutional Bidders."],
          ["Offer", "Initial public offering of [●] Equity Shares of face value of ₹___ each, for cash at a price of ₹[●] per Equity Share."],
          ["Offer Agreement", "The agreement dated ___ among our Company, the Selling Shareholders and the BRLMs."],
          ["Offer for Sale", "The offer for sale of up to ___ Equity Shares of face value of ₹___ each, aggregating up to ₹___ by the Selling Shareholders."],
          ["Offer Price", "The final price at which Equity Shares will be Allotted to successful Bidders other than Anchor Investors."],
          ["Price Band", "The price band ranging from the Floor Price of ₹___ per Equity Share to the Cap Price of ₹___ per Equity Share."],
          ["Pricing Date", "The date on which our Company in consultation with the BRLMs, will finalise the Offer Price."],
          ["Prospectus", "The Prospectus to be filed with the RoC on or after the Pricing Date in accordance with Section 26 of the Companies Act, 2013."],
          ["QIB Portion", "The portion of the Offer being not less than 75% of the Offer, available for allocation to QIBs."],
          ["QIBs or Qualified Institutional Buyers", "Qualified institutional buyers as defined under Regulation 2(1)(ss) of the SEBI ICDR Regulations."],
          ["Red Herring Prospectus or RHP", "The Red Herring Prospectus to be issued in accordance with Section 32 of the Companies Act, 2013."],
          ["Registrar to the Offer or Registrar", "____"],
          ["Retail Individual Bidder(s) or RII(s)", "Individual Bidders, who have Bid for the Equity Shares for an amount which is not more than ₹___."],
          ["Retail Portion", "The portion of the Offer being not more than 10% of the Offer, available for allocation to Retail Individual Investors."],
          ["UPI", "Unified Payments Interface, which is an instant payment mechanism, developed by NPCI."],
          ["UPI Bidders", "Collectively, individual investors applying as Retail Individual Investors and Non-Institutional Investors under UPI Mechanism."],
          ["Working Day", "All days other than second and fourth Saturday of the month, Sunday or a public holiday, on which commercial banks in Mumbai are open for business."]
        ]
      },
      {
        id: "technical-terms",
        title: "Technical / Industry and Business-Related Terms",
        columns: ["Abbreviation", "Full Form / Definition"],
        description: "Industry-specific abbreviations and business terms",
        defaultRows: [
          ["AAEC", "An adverse effect on competition"],
          ["ADTO", "Average Daily Turnover"],
          ["AI", "Artificial intelligence"],
          ["AMC", "Asset Management Companies"],
          ["ARPU", "Average Revenue per User"],
          ["ASM", "Additional surveillance measures"],
          ["Budget", "Union Budget for the Financial Year ___"],
          ["CAPEX", "Capital expenditure"],
          ["DII", "Domestic Institutional Investors"],
          ["DIY", "Do-It-Yourself"],
          ["DLP", "Digital lending platforms"],
          ["DPI", "Digital Public Infrastructure"],
          ["eKYC", "Electronic Know Your Customer"],
          ["ETF", "Exchange Traded Fund"],
          ["FPO", "Follow-on Public Offers"],
          ["GDP", "Gross Domestic Product"],
          ["GSM", "Graded surveillance measures"],
          ["HNI", "High net-worth individuals"],
          ["IFAs", "Independent financial advisors"],
          ["IMF", "International Monetary Fund"],
          ["IPO", "Initial Public Offerings"],
          ["LAS", "Loans against security"],
          ["ML", "Machine learning"],
          ["MTF", "Margin Trading Facility"],
          ["NAV", "Net Asset Value"],
          ["NFO", "New Fund Offering"],
          ["NPA", "Non-performing asset"],
          ["PMS", "Portfolio Management Services"],
          ["QSB", "Qualified Stock Broker"],
          ["SIPs", "Systematic Investment Plans"],
          ["SME", "Small and medium enterprises"],
          ["STT", "Securities Transaction Tax"],
          ["TAM", "Total Addressable Market"]
        ]
      },
      {
        id: "conventional-terms",
        title: "Conventional and General Terms / Abbreviations",
        columns: ["Abbreviation", "Full Form / Definition"],
        description: "Standard legal, regulatory, and financial abbreviations",
        defaultRows: [
          ["₹ or Rs. or Rupees or INR", "Indian rupees."],
          ["AGM", "Annual General Meeting."],
          ["AIF", "An alternative investment fund as defined in and registered with SEBI under the Securities and Exchange Board of India (Alternative Investment Funds) Regulations, 2012."],
          ["BSE", "BSE Limited."],
          ["CAGR", "Compound annual growth rate."],
          ["Category I FPI", 'FPIs registered as "Category I foreign portfolio investors" under the Securities and Exchange Board of India (Foreign Portfolio Investors) Regulations, 2019.'],
          ["Category II FPI", 'FPIs registered as "Category II foreign portfolio investors" under the Securities and Exchange Board of India (Foreign Portfolio Investors) Regulations, 2019.'],
          ["CCI", "Competition Commission of India"],
          ["CCPS", "Compulsorily convertible preference shares."],
          ["CDSL", "Central Depository Services (India) Limited."],
          ["CIN", "Corporate Identity Number."],
          ["Companies Act", "The Companies Act, 1956 and the Companies Act, 2013, as applicable."],
          ["Companies Act, 2013", "Companies Act, 2013, along with the relevant rules, regulations, clarifications, circulars and notifications issued thereunder, as amended."],
          ["Competition Act", "The Competition Act, 2002"],
          ["CSR", "Corporate social responsibility"],
          ["Depositories Act", "The Depositories Act, 1996, read with regulations framed thereunder."],
          ["DIN", "Director Identification Number."],
          ["DP ID", "Depository Participant's Identity Number."],
          ["DP or Depository Participant", "A depository participant as defined under the Depositories Act."],
          ["DPDPA", "Digital Personal Data Protection Act, 2023"],
          ["EGM", "Extraordinary General Meeting."],
          ["EPS", "Earnings Per Share."],
          ["ESOP", "Employee stock option plan"],
          ["FDI", "Foreign Direct Investment."],
          ["FDI Policy", "The consolidated FDI Policy, issued by the Department of Promotion of Industry and Internal Trade, Ministry of Commerce and Industry, Government of India."],
          ["FEMA", "The Foreign Exchange Management Act, 1999, read with rules and regulations thereunder."],
          ["Financial Year or Fiscal or FY", "The period of 12 months commencing on April 1 of the immediately preceding calendar year and ending on March 31 of that particular calendar year."],
          ["FPI(s)", "Foreign portfolio investors as defined under the SEBI FPI Regulations."],
          ["FVCI", "Foreign venture capital investors as defined and registered under the SEBI FVCI Regulations."],
          ["GoI or Government", "The Government of India."],
          ["GST", "Goods and services tax."],
          ["HUF", "Hindu undivided family."],
          ["ICAI", "The Institute of Chartered Accountants of India."],
          ["IFRS", "International Financial Reporting Standards of the International Accounting Standards Board."],
          ["Income Tax Act", "The Income-tax Act, 1961, read with the rules framed thereunder."],
          ["Ind AS", "The Indian Accounting Standards specified under section 133 of the Companies Act, 2013."],
          ["India", "Republic of India."],
          ["IST", "Indian Standard Time."],
          ["IT Act", "The Information Technology Act, 2000"],
          ["MCA", "The Ministry of Corporate Affairs, Government of India."],
          ["Mn or mn", "Million."],
          ["N.A.", "Not applicable."],
          ["NBFC", "Non-banking financial company"],
          ["NEFT", "National Electronic Fund Transfer."],
          ["NPCI", "National Payments Corporation of India."],
          ["NRI", "A person resident outside India, who is a citizen of India or an overseas citizen of India cardholder."],
          ["NSDL", "National Securities Depository Limited."],
          ["NSE", "The National Stock Exchange of India Limited."],
          ["P/E Ratio", "Price / earnings ratio."],
          ["PAN", "Permanent account number."],
          ["RBI", "Reserve Bank of India."],
          ["RTGS", "Real time gross settlement."],
          ["SCORES", "SEBI complaints redress system."],
          ["SCRA", "The Securities Contracts (Regulation) Act, 1956."],
          ["SCRR", "The Securities Contracts (Regulation) Rules, 1957."],
          ["SEBI", "The Securities and Exchange Board of India constituted under the SEBI Act, 1992."],
          ["SEBI Act", "The Securities and Exchange Board of India Act, 1992."],
          ["SEBI ICDR Regulations", "The Securities and Exchange Board of India (Issue of Capital and Disclosure Requirements) Regulations, 2018."],
          ["SEBI Listing Regulations", "The Securities and Exchange Board of India (Listing Obligations and Disclosure Requirements) Regulations, 2015."],
          ["Stock Exchanges", "Collectively, the BSE and NSE."],
          ["Takeover Regulations", "The Securities and Exchange Board of India (Substantial Acquisition of Shares and Takeovers) Regulations, 2011."],
          ["TAN", "Tax deduction account number."],
          ["U.S.", "The United States of America."],
          ["U.S. Dollar(s) or USD", "United States Dollar."],
          ["VCFs", "Venture capital funds as defined in and registered with SEBI under the SEBI VCF Regulations and the SEBI AIF Regulations."],
          ["Year/Calendar Year/CY", "The 12-month period ending December 31."]
        ]
      },
      {
        id: "kpi-terms",
        title: "Key Performance Indicators",
        columns: ["KPI", "Definition"],
        description: "GAAP and Non-GAAP financial measures",
        defaultRows: [
          ["Revenue from operations", "Revenue from operations as presented in the Restated Consolidated Financial Information."],
          ["Profit/(loss) for the period/year", "Profit/(loss) for the period/year, as presented in the Restated Consolidated Financial Information."],
          ["EBITDA (excluding Other income)", "EBITDA (excluding Other income) is defined as profit/(loss) for the period/year plus (i) Total tax expense, (ii) Finance costs, and (iii) Depreciation and amortisation expense less Other income."],
          ["Adjusted EBITDA", "Adjusted EBITDA is defined as profit/(loss) for the period/year plus (i) Total tax expense, (ii) Finance costs, (iii) Depreciation and amortisation expense, (iv) Exceptional item (taxes), (v) Share based payments, less Other income."],
          ["Adjusted EBITDA Margin", "Refers to Adjusted EBITDA, as a percentage of Revenue from operations."],
          ["Contribution Margin", "Contribution Margin is defined as Revenue from operations minus Software, server and technology expenses and Transaction and other related charges."],
          ["Contribution Margin (%)", "Refers to Contribution Margin, as a percentage of Revenue from operations."],
          ["Profit/(loss) for the period/year Margin", "Refers to Profit/(loss) for the period/year, as a percentage of Total income."]
        ]
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
