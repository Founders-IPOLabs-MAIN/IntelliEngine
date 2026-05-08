import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Mail, Phone, MapPin } from "lucide-react";

const LAST_UPDATED = "21 April 2026";

const SECTIONS = [
  { id: "general", label: "General Disclaimer" },
  { id: "sebi", label: "SEBI Disclosures" },
  { id: "exchange", label: "NSE / BSE Disclaimers" },
  { id: "drhp", label: "DRHP & IPO Warnings" },
  { id: "no-advice", label: "No Investment Advice" },
  { id: "dpdpa", label: "DPDPA Compliance" },
  { id: "gdpr-ccpa", label: "GDPR & CCPA" },
  { id: "rbi", label: "RBI Data Localisation" },
  { id: "it-act", label: "IT Act & Safe Harbour" },
  { id: "ai-disclosure", label: "AI / SGI Disclosure" },
  { id: "ip", label: "Intellectual Property" },
  { id: "limitation", label: "Limitation of Liability" },
  { id: "retention", label: "Data Retention" },
  { id: "grievance", label: "Grievance Redressal" },
];

const DisclaimerPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("general");

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="disclaimer-page">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-white border-b px-8 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center justify-center gap-2 -mt-3">
            <img src="/setu-logo.svg" alt="SETU Labs" className="h-[150px] w-auto object-contain p-3" />
          </div>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="font-semibold text-black">Legal Disclaimers & Regulatory Compliance</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#003366] text-white py-10 px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Legal Disclaimers & Regulatory Compliance</h1>
          <p className="text-white/70 text-sm">IPO Labs AI Private Limited &mdash; Comprehensive Legal, Regulatory & Data Protection Disclosures</p>
          <p className="text-white/50 text-xs mt-2">Last Updated: {LAST_UPDATED} &nbsp;|&nbsp; Effective: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 lg:px-16 py-8 flex gap-10 flex-1">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Contents</h3>
            <div className="space-y-0.5">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${activeSection === s.id ? "bg-[#003366] text-white font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 max-w-3xl">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-10">

            {/* 1. GENERAL DISCLAIMER */}
            <section id="general">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">1. General Disclaimer</h2>
              <p>This website, <strong>SETU</strong> (accessible at <em>ipo-labs.com</em> and all associated subdomains), is owned, operated, and maintained by <strong>IPO Labs AI Private Limited</strong> ("IPO Labs", "the Company", "we", "us", or "our"), a company incorporated under the Companies Act, 2013 and registered with the Registrar of Companies, Mumbai, Maharashtra, India.</p>
              <p>By accessing, browsing, or using this website and/or any of its services, applications, tools, or content (collectively, "Services"), you ("User", "you", or "your") acknowledge that you have read, understood, and unconditionally agree to be bound by these Legal Disclaimers & Regulatory Compliance terms, our Privacy Policy, and our Terms of Use. If you do not agree, you must immediately cease all use of the Services.</p>
              <p>The information, data, analyses, articles, reports, tools, and other materials available on this website are provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis, strictly for general informational, educational, and research purposes only. Nothing contained herein constitutes, or shall be construed as constituting, an offer, solicitation, recommendation, endorsement, or advice to buy, sell, hold, or deal in any security, financial product, or investment instrument.</p>
              <p className="text-xs text-gray-500 italic">This document is governed by and construed in accordance with the laws of India. Any dispute arising hereunder shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra.</p>
            </section>

            {/* 2. SEBI DISCLOSURES */}
            <section id="sebi">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">2. SEBI Disclosures & Securities Market Compliance</h2>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">2.1 Registration Status</h3>
              <p>IPO Labs AI Private Limited is <strong>NOT</strong> a SEBI-registered Investment Adviser (IA), Research Analyst (RA), Stock Broker, Portfolio Manager, Merchant Banker, or any other category of intermediary registered with the Securities and Exchange Board of India ("SEBI") under the SEBI Act, 1992 or any regulations framed thereunder. We do not hold any SEBI registration number.</p>
              <p>The Company operates as a technology platform providing software tools for document management, compliance workflow automation, and informational resources related to the Indian Initial Public Offering (IPO) ecosystem. <strong>We do not provide investment advisory services, portfolio management services, or research analyst services as defined under SEBI regulations.</strong></p>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">2.2 Standard Market Risk Warning</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-3">
                <p className="text-red-800 font-bold text-sm mb-2">IMPORTANT WARNING — INVESTMENTS ARE SUBJECT TO MARKET RISK</p>
                <p className="text-red-700 text-xs">Investments in securities markets are subject to market risks. Please read all related documents, including the offer document, DRHP, RHP, and scheme information documents, carefully before investing. Past performance is not indicative of future results. There is no assurance or guarantee that any investment objective will be achieved. The value of investments and the income from them can go down as well as up, and investors may not get back the amount originally invested.</p>
              </div>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">2.3 SEBI Circular — February 2026 (EoDI Social Media Disclosures)</h3>
              <p>In compliance with the spirit of SEBI Circular No. <strong>HO/(79)2026-MIRSD-PODMMC</strong> dated 26 February 2026 ("Ease of Doing Investment — Disclosure of Registered Name and Registration Number by SEBI Regulated Entities and their Agents on Social Media Platforms"), effective 1 May 2026, we hereby confirm:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>IPO Labs AI Private Limited is <strong>not a SEBI-regulated entity</strong> and therefore is not subject to the mandatory registration number disclosure requirements prescribed under this circular.</li>
                <li>Any securities market-related content published by us on social media platforms (including but not limited to YouTube, Instagram, X/Twitter, LinkedIn, Facebook, Telegram, and WhatsApp) is <strong>informational and educational in nature only</strong> and does not constitute investment advice, research reports, or recommendations.</li>
                <li>Users are strongly advised to verify the SEBI registration status of any entity providing financial advice through social media by consulting the official SEBI Intermediary Search portal at <em>https://www.sebi.gov.in</em>.</li>
                <li>We do not impersonate, represent, or associate ourselves with any SEBI-registered intermediary, and any such representation by third parties is unauthorized and should be reported immediately.</li>
              </ul>
            </section>

            {/* 3. NSE / BSE DISCLAIMERS */}
            <section id="exchange">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">3. Stock Exchange Disclaimers (NSE & BSE)</h2>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-3">
                <p className="text-amber-900 font-bold text-xs uppercase tracking-wide mb-2">Mandatory Exchange Trademark & Affiliation Disclaimer</p>
                <p className="text-amber-800 text-xs leading-relaxed"><strong>"NSE", "National Stock Exchange", "NIFTY", "NIFTY 50", and all associated indices, logos, and trademarks are the registered trademarks and intellectual property of the National Stock Exchange of India Limited. "BSE", "Bombay Stock Exchange", "SENSEX", "S&P BSE SENSEX", and all associated indices, logos, and trademarks are the registered trademarks and intellectual property of BSE Limited. Company names, director names, KYC data, and related corporate information are the property of the respective entities. "Protean" (formerly NSDL e-Governance Infrastructure Limited) and its associated marks are the registered trademarks of Protean eGov Technologies Limited.</strong></p>
                <p className="text-amber-800 text-xs leading-relaxed mt-2"><strong>IPO-Labs.com, SETU, all connected persons, directors, employees, agents, and affiliates of IPO Labs AI Private Limited have NO official affiliation, endorsement, partnership, agency relationship, or sponsorship arrangement with the National Stock Exchange of India Limited, BSE Limited, Protean eGov Technologies Limited, or any of their subsidiaries, group companies, or associated entities.</strong></p>
              </div>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">3.1 Exchange Data Restrictions</h3>
              <p>Any market data, index values, stock prices, historical data, or other exchange-proprietary information displayed on this website is sourced from publicly available sources and/or third-party data providers, and is provided for informational purposes only. We make no representations regarding the accuracy, completeness, timeliness, or reliability of such data.</p>
              <p><strong>Prohibited Activities:</strong> The scraping, crawling, systematic downloading, redistribution, republication, retransmission, or commercial use of any exchange-proprietary data accessible through this website is strictly prohibited without the prior written consent of the respective stock exchange. Any unauthorised use may constitute a violation of the intellectual property rights of NSE, BSE, and/or their data licensors, and may result in civil and/or criminal liability.</p>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">3.2 No Exchange Endorsement</h3>
              <p>The listing of any security, the display of any index value, or the mention of any exchange-related term on this website does not imply any endorsement, verification, or approval by NSE, BSE, or any regulatory body. Users should independently verify all information through official exchange websites and SEBI-registered intermediaries.</p>
            </section>

            {/* 4. DRHP & IPO WARNINGS */}
            <section id="drhp">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">4. DRHP & IPO-Specific Warnings</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-3">
                <p className="text-blue-900 font-bold text-xs uppercase tracking-wide mb-2">Important Notice Regarding Draft Red Herring Prospectuses (DRHP)</p>
                <p className="text-blue-800 text-xs leading-relaxed">A Draft Red Herring Prospectus (DRHP) filed with SEBI is a <strong>preliminary document</strong> that is subject to change, amendment, revision, and SEBI observations before a final Red Herring Prospectus (RHP) is issued. The filing of a DRHP with SEBI does <strong>NOT</strong> constitute an offer, invitation, or solicitation to buy or subscribe to any securities. No investment decision should be made solely on the basis of a DRHP. SEBI's issuance of observations on a DRHP does not constitute its approval or endorsement of the IPO or the securities described therein.</p>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Any DRHP-related content, summaries, analyses, or tools provided on this platform are for <strong>educational and informational purposes only</strong>.</li>
                <li>DRHP documents may contain forward-looking statements that involve risks and uncertainties. Actual results may differ materially from those anticipated in such statements.</li>
                <li>Users must refer to the <strong>official DRHP filed with SEBI</strong> (available on the SEBI website and the websites of the lead merchant bankers) for the complete, authorised, and current version of any prospectus document.</li>
                <li>The Company's DRHP Builder tool is a <strong>workflow automation and document management tool</strong> and does not substitute for the professional services of SEBI-registered merchant bankers, legal advisors, or chartered accountants.</li>
                <li>Any financial projections, valuation models, or readiness assessments generated by the platform are <strong>indicative only</strong> and should not be relied upon as the sole basis for any business, legal, or financial decision.</li>
              </ul>
            </section>

            {/* 5. NO INVESTMENT ADVICE */}
            <section id="no-advice">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">5. No Investment Advice (DYOR Clause)</h2>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 my-3">
                <p className="text-gray-800 font-bold text-sm mb-2">DO YOUR OWN RESEARCH (DYOR)</p>
                <p className="text-gray-700 text-xs">All content on this website — including but not limited to articles, blog posts, research summaries, IPO readiness assessments, business valuation reports, financial analyses, interactive tools, AI-generated insights, and any other informational materials — is provided for <strong>general informational and educational purposes only</strong> and does <strong>NOT</strong> constitute: (a) investment advice; (b) financial advice; (c) tax advice; (d) legal advice; (e) an offer to buy or sell securities; (f) a recommendation or endorsement of any security, product, or strategy; or (g) a solicitation of an investment in any financial instrument or product.</p>
              </div>
              <p>Users should always consult with qualified, SEBI-registered professionals — including investment advisers, research analysts, chartered accountants, company secretaries, and legal counsel — before making any investment, financial, or business decision. Past performance, whether real or simulated, does not guarantee or indicate future results.</p>
              <p>The Company, its directors, officers, employees, and agents shall not be liable for any investment decisions made by users based on the information provided on this platform.</p>
            </section>

            {/* 6. DPDPA COMPLIANCE */}
            <section id="dpdpa">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">6. Data Privacy — DPDPA (India) Compliance</h2>
              <p>IPO Labs AI Private Limited operates as a <strong>"Data Fiduciary"</strong> under the Digital Personal Data Protection Act, 2023 ("DPDP Act") read with the Digital Personal Data Protection Rules, 2025 ("DPDP Rules"), and is committed to protecting the personal data of all users in accordance with the Act and Rules.</p>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">6.1 Lawful Basis for Processing</h3>
              <p>We process personal data only on the basis of: (a) <strong>explicit, free, specific, informed, and unambiguous consent</strong> of the Data Principal; or (b) <strong>certain legitimate uses</strong> as permitted under Section 7 of the DPDP Act (e.g., compliance with legal obligations, performance of a contract with the Data Principal, or response to a medical emergency).</p>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">6.2 Data Principal Rights</h3>
              <p>Under the DPDP Act, Data Principals (users) have the following rights:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Right to Access:</strong> Right to obtain a summary of personal data being processed and the processing activities undertaken.</li>
                <li><strong>Right to Correction & Completion:</strong> Right to have inaccurate or incomplete personal data corrected, completed, or updated.</li>
                <li><strong>Right to Erasure:</strong> Right to request erasure of personal data where consent has been withdrawn, the specified purpose has been fulfilled, or the data is no longer necessary. Upon receipt of a valid erasure request, we shall erase the data and direct all data processors to do the same, subject to applicable legal retention obligations.</li>
                <li><strong>Right to Grievance Redressal:</strong> Right to have grievances addressed by our designated Data Protection Officer / Grievance Officer.</li>
                <li><strong>Right to Nominate:</strong> Right to nominate another individual to exercise data rights in the event of the Data Principal's death or incapacity.</li>
              </ul>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">6.3 Consent Management</h3>
              <p>We obtain and record explicit consent for each purpose of data processing at the point of collection. Users may withdraw consent at any time through their account settings or by contacting our Data Protection Officer. Withdrawal of consent shall not affect the lawfulness of processing carried out prior to such withdrawal. Records of consent, including grants, modifications, and withdrawals, are maintained for a minimum period of one (1) year as mandated by Rule 6 of the DPDP Rules 2025.</p>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">6.4 Data Processing for Children</h3>
              <p>We do not knowingly process the personal data of children (individuals below the age of 18 years) without verifiable parental or guardian consent. If we become aware that we have inadvertently collected data from a child without appropriate consent, we will take immediate steps to delete such data.</p>
            </section>

            {/* 7. GDPR & CCPA */}
            <section id="gdpr-ccpa">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">7. Global Data Protection — GDPR (EU) & CCPA (USA)</h2>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">7.1 GDPR Compliance (European Economic Area Users)</h3>
              <p>For users located within the European Economic Area (EEA), the United Kingdom, or Switzerland, we process personal data in accordance with the General Data Protection Regulation (EU) 2016/679 ("GDPR"). In addition to rights provided under Indian law, EEA users enjoy:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Right to be Forgotten (Article 17):</strong> Right to erasure of personal data without undue delay where the data is no longer necessary, consent is withdrawn, or the data has been unlawfully processed.</li>
                <li><strong>Right to Data Portability (Article 20):</strong> Right to receive personal data in a structured, commonly used, and machine-readable format.</li>
                <li><strong>Right to Object (Article 21):</strong> Right to object to processing based on legitimate interests, direct marketing, or profiling.</li>
                <li><strong>Cross-Border Data Transfers:</strong> Any transfer of personal data outside the EEA is conducted pursuant to Standard Contractual Clauses (SCCs) approved by the European Commission, or other lawful transfer mechanisms under Chapter V of the GDPR.</li>
              </ul>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">7.2 CCPA Compliance (California Residents)</h3>
              <p>For users who are residents of the State of California, United States, we comply with the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA). California residents have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Know what personal information is collected, used, shared, or sold.</li>
                <li>Delete personal information held by the business and its service providers.</li>
                <li>Opt out of the sale or sharing of personal information.</li>
                <li>Non-discrimination for exercising any CCPA rights.</li>
              </ul>
              <p className="text-sm mt-2"><strong>We do not sell personal information</strong> as defined under the CCPA. To exercise your rights, contact our Data Protection Officer using the details provided in the Grievance Redressal section below.</p>
            </section>

            {/* 8. RBI DATA LOCALISATION */}
            <section id="rbi">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">8. Financial Data Storage & RBI Compliance</h2>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">8.1 Sensitive Personal Data & Financial Information</h3>
              <p>We classify the following as "Sensitive Personal Data or Information" (SPDI) under applicable Indian law and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011: passwords, financial information (bank account details, credit/debit card details, UPI identifiers), biometric data, and health data.</p>
              <p>In compliance with the <strong>Reserve Bank of India's (RBI) data localisation mandates</strong> and the <strong>RBI Digital Lending Directions, 2025</strong>:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>All payment-related data, card-on-file data, and financial transaction data of Indian users is stored <strong>exclusively on servers located within India</strong>.</li>
                <li>Where any financial data is processed outside India for operational purposes, such data is <strong>deleted from foreign servers within 24 hours</strong> of processing, and only the processed output is retained domestically.</li>
                <li>We comply with RBI's <strong>tokenisation mandates</strong> — no actual card data (card number, CVV, expiry date) is stored on our servers. All card data is tokenised through RBI-approved tokenisation service providers.</li>
                <li>We do not store biometric data unless explicitly consented to and permitted under applicable law.</li>
              </ul>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">8.2 Payment Processing</h3>
              <p>All payments on this platform are processed through <strong>RBI-licensed payment aggregators and payment gateways</strong>. We do not directly collect, store, or process payment card industry (PCI) data. Our payment processing partners are PCI-DSS Level 1 certified and comply with all applicable RBI regulations.</p>
            </section>

            {/* 9. IT ACT & SAFE HARBOUR */}
            <section id="it-act">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">9. Information Technology Act, 2000 & Intermediary Rules</h2>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">9.1 Intermediary Status & Safe Harbour</h3>
              <p>To the extent that the Company acts as an "intermediary" as defined under Section 2(1)(w) of the Information Technology Act, 2000 ("IT Act"), we claim the benefit of the <strong>safe harbour protections</strong> available under <strong>Section 79</strong> of the IT Act, read with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (as amended in 2023 and 2026).</p>
              <p>We do not initiate the transmission, select the receiver of, or modify the information contained in user-generated content. We are not liable for any third-party information, data, or communication hosted on or transmitted through our platform, provided we exercise due diligence and comply with the take-down obligations prescribed under the IT Act and Rules.</p>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">9.2 User-Generated Content</h3>
              <p>Any content uploaded, posted, or transmitted by users (including professional profiles, reviews, comments, and documents) is the sole responsibility of the user who authored or uploaded such content. We do not endorse, verify, or guarantee the accuracy, legality, or reliability of any user-generated content. Users are prohibited from uploading content that is defamatory, obscene, threatening, invasive of privacy, infringing of intellectual property, or in violation of any applicable law.</p>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">9.3 Compliance with IT Amendment Rules, 2026</h3>
              <p>In compliance with the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Amendment Rules, 2026</strong>, notified by the Ministry of Electronics and Information Technology (MeitY), effective 20 February 2026, we have implemented the following measures:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Enhanced quarterly user notification of platform terms and consequences of non-compliance, including account suspension and content removal.</li>
                <li>Mechanisms for users to declare and label Synthetically Generated Information (SGI) prior to upload or publication.</li>
                <li>Technical measures to detect, label, and where required, block unlawful SGI content in accordance with the prescribed categories.</li>
                <li>Compliance with shortened takedown timelines (including the revised 3-hour window for certain categories of unlawful content as prescribed under the 2026 Amendment Rules).</li>
              </ul>
            </section>

            {/* 10. AI / SGI DISCLOSURE */}
            <section id="ai-disclosure">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">10. Artificial Intelligence & Synthetically Generated Information (SGI) Disclosure</h2>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-3">
                <p className="text-purple-900 font-bold text-xs uppercase tracking-wide mb-2">AI Content Disclosure — MeitY 2026 Compliance</p>
                <p className="text-purple-800 text-xs leading-relaxed">This platform utilises Artificial Intelligence (AI) and Machine Learning (ML) models, including Large Language Models (LLMs), for various features and functionalities. In accordance with the MeitY IT Amendment Rules, 2026 and the requirement to disclose "Synthetically Generated Information" (SGI), we hereby inform all users that:</p>
              </div>

              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>AI-Powered Features:</strong> The following features on this platform utilise AI models to generate, summarise, analyse, or augment content: (a) IPO Readiness Assessment scoring and recommendations; (b) Business Valuation report generation (DCF, NAV, Comparable analyses); (c) DRHP section drafting assistance and compliance gap analysis; (d) Financial data extraction from uploaded documents (Excel, PDF); (e) Match-Making Platform AI recommendations; and (f) Blog articles and research summaries that may incorporate AI-generated or AI-assisted analysis.</li>
                <li><strong>Nature of AI Output:</strong> All AI-generated content is <strong>indicative, probabilistic, and subject to error</strong>. AI models may produce inaccurate, incomplete, outdated, or misleading output (commonly referred to as "hallucinations"). AI-generated content should <strong>never</strong> be treated as a substitute for professional human expertise, legal advice, financial advice, or audited financial statements.</li>
                <li><strong>Labelling:</strong> Where technically feasible, AI-generated or AI-assisted content on this platform is labelled with appropriate disclosures (e.g., "AI-Generated", "AI-Assisted", or equivalent notation). We embed metadata identifiers where technically practicable to enable traceability of synthetically generated content in compliance with the 2026 IT Amendment Rules.</li>
                <li><strong>Third-Party AI Models:</strong> We utilise third-party AI models and APIs (including but not limited to models provided by OpenAI, Google, and Anthropic) for content generation. The outputs of these models are subject to the terms, limitations, and disclaimers of the respective AI service providers. We do not control and cannot guarantee the accuracy, safety, or appropriateness of third-party AI model outputs.</li>
                <li><strong>No Autonomous Decision-Making:</strong> AI models on this platform do not make autonomous financial, legal, or business decisions on behalf of users. All AI-generated outputs are intended as <strong>decision-support tools</strong> that require independent human review, judgement, and professional validation before any action is taken.</li>
              </ul>
            </section>

            {/* 11. INTELLECTUAL PROPERTY */}
            <section id="ip">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">11. Intellectual Property Rights</h2>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">11.1 Company Intellectual Property</h3>
              <p>The trademarks, service marks, logos, trade names, and brand elements "IPO Labs", "SETU", "The Match-Making Platform", and all associated visual elements are the intellectual property of IPO Labs AI Private Limited. All rights are reserved.</p>
              <p>The website's source code, design, layout, software, algorithms, databases, text, graphics, images, and all other proprietary content are protected by Indian copyright law (Copyright Act, 1957), international copyright treaties, and other applicable intellectual property laws.</p>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">11.2 Third-Party Trademarks</h3>
              <p>All third-party trademarks, service marks, trade names, logos, and brand identifiers mentioned on this website — including but not limited to <strong>"NSE", "National Stock Exchange", "NIFTY", "NIFTY 50", "BSE", "Bombay Stock Exchange", "SENSEX", "S&P BSE SENSEX", "Protean", "NSDL", "CDSL", "SEBI", "RBI", "MCA", "GSTN"</strong> — are the registered trademarks and intellectual property of their respective owners. Their use on this website is for identification and informational purposes only and does not imply any affiliation, endorsement, or sponsorship.</p>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">11.3 Restrictions</h3>
              <p>Users may not reproduce, distribute, modify, create derivative works from, publicly display, transmit, sell, license, or exploit any content from this website without the prior written permission of IPO Labs AI Private Limited, except for personal, non-commercial use in accordance with applicable fair use / fair dealing provisions under Indian copyright law.</p>
            </section>

            {/* 12. LIMITATION OF LIABILITY */}
            <section id="limitation">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">12. Limitation of Liability & Indemnification</h2>
              <p>To the fullest extent permitted by applicable law:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>IPO Labs AI Private Limited, its directors, officers, employees, agents, consultants, partners, and affiliates shall <strong>NOT</strong> be liable for any direct, indirect, incidental, special, consequential, punitive, or exemplary damages arising out of or in connection with the use or inability to use this website, its services, content, or tools.</li>
                <li>This limitation applies to, but is not limited to: (a) investment losses; (b) loss of profits, revenue, data, or business opportunity; (c) reliance on information, analyses, or AI-generated content provided on this platform; (d) errors, inaccuracies, or omissions in any data or content; (e) service interruptions, security breaches, or technical failures; and (f) any actions taken by users based on DRHP analyses, valuation reports, readiness assessments, or any other content provided herein.</li>
                <li>Users agree to <strong>indemnify and hold harmless</strong> IPO Labs AI Private Limited and its personnel from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from the user's breach of these terms, violation of applicable law, or infringement of any third-party rights.</li>
              </ul>
            </section>

            {/* 13. DATA RETENTION */}
            <section id="retention">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">13. Data Retention & Deletion Policy</h2>
              <p>We retain personal data only for as long as necessary to fulfil the purposes for which it was collected, or as required by applicable law. Specific retention periods include:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Account Data:</strong> Retained for the duration of the active account and for a period of three (3) years following account deletion or inactivity, in accordance with the Third Schedule of the DPDP Rules 2025 (applicable to specified Data Fiduciaries). A 48-hour advance notice is provided before erasure pursuant to the inactivity provision.</li>
                <li><strong>Transaction Data:</strong> Retained for a minimum of eight (8) years in compliance with Indian tax laws (Income Tax Act, 1961), GST regulations, and RBI requirements.</li>
                <li><strong>Communication Logs:</strong> Retained for a period of one hundred and eighty (180) days from the date of the communication, in compliance with the Information Technology (Intermediary Guidelines) Rules requirement for intermediaries to retain information for law enforcement purposes, even after account deletion or content removal.</li>
                <li><strong>Consent Records:</strong> Records of consent grants, modifications, and withdrawals are retained for a minimum of one (1) year as mandated by Rule 6 of the DPDP Rules 2025.</li>
                <li><strong>Audit Logs:</strong> System and access logs are retained for a minimum of one hundred and eighty (180) days in compliance with IT Act requirements.</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-3">
                <p className="text-yellow-800 text-xs"><strong>Important Note on Right to Erasure vs. Legal Retention:</strong> While we respect and implement the right to erasure under the DPDP Act, GDPR, and CCPA, certain data may be retained beyond the erasure request where required by applicable Indian law — including the 180-day retention obligation under IT intermediary rules (for law enforcement cooperation), tax record requirements, and ongoing legal proceedings. In such cases, the retained data is archived securely with restricted access and is not used for any other purpose.</p>
              </div>
            </section>

            {/* 14. GRIEVANCE REDRESSAL */}
            <section id="grievance">
              <h2 className="text-xl font-bold text-black border-b pb-2 mb-4">14. Grievance Redressal & Contact Information</h2>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">14.1 Grievance Officer / Data Protection Officer</h3>
              <p>In compliance with Rule 3(2)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (as amended), and the DPDP Act 2023, the following officer has been designated as the Grievance Officer and Data Protection Officer:</p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 my-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#003366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-black">grievance@ipo-labs.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#003366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Founders / General Enquiries</p>
                    <p className="text-sm font-medium text-black">founders.ipolabs@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#003366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Registered Office</p>
                    <p className="text-sm font-medium text-black">IPO Labs AI Private Limited<br />Mumbai, Maharashtra, India</p>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">14.2 Grievance Resolution Timeline</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Acknowledgement:</strong> All grievances shall be acknowledged within <strong>24 hours</strong> of receipt.</li>
                <li><strong>Resolution:</strong> The Grievance Officer shall endeavour to resolve grievances within <strong>fifteen (15) days</strong> from the date of receipt, as mandated under the IT Rules.</li>
                <li><strong>Escalation:</strong> If unsatisfied with the resolution, users may escalate their complaint to the appropriate regulatory authority, including the Data Protection Board of India (for DPDP Act matters), the Appellate Tribunal under the IT Act, or the relevant consumer forum.</li>
              </ul>

              <h3 className="text-sm font-bold text-black mt-4 mb-2">14.3 Law Enforcement Requests</h3>
              <p>We cooperate with law enforcement agencies and regulatory authorities in accordance with applicable Indian law. Requests for user data or content removal by law enforcement agencies are processed in compliance with the IT Act, the Code of Criminal Procedure, 1973 (now Bharatiya Nagarik Suraksha Sanhita, 2023), and applicable court orders.</p>
            </section>

            {/* CLOSING */}
            <section className="border-t border-gray-200 pt-6 mt-10">
              <p className="text-xs text-gray-500 leading-relaxed">This Legal Disclaimers & Regulatory Compliance document constitutes a binding agreement between the User and IPO Labs AI Private Limited. The Company reserves the right to amend, modify, or update this document at any time without prior notice. Users are advised to review this page periodically. Continued use of the Services following any modification constitutes acceptance of the updated terms.</p>
              <p className="text-xs text-gray-400 mt-4">Document Version: 2.0 &nbsp;|&nbsp; Last Updated: {LAST_UPDATED} &nbsp;|&nbsp; Jurisdiction: Mumbai, Maharashtra, India &nbsp;|&nbsp; Governing Law: Laws of India</p>
              <p className="text-xs text-gray-400 mt-1">&copy; {new Date().getFullYear()} IPO Labs AI Private Limited. All rights reserved.</p>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
};

export default DisclaimerPage;
