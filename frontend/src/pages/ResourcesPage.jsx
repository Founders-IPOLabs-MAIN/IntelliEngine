import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Search, Clock, User, ArrowRight, ChevronRight,
  BookOpen, TrendingUp, Shield, Lightbulb, Building2, Scale,
  Globe, Fuel, BarChart3
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "compliance", label: "Compliance" },
  { id: "technology", label: "Technology" },
  { id: "funding", label: "Funding" },
  { id: "best-practices", label: "Best Practices" },
  { id: "governance", label: "Governance" },
  { id: "process", label: "Process" },
  { id: "strategy", label: "Strategy" },
  { id: "market-update", label: "Market Update" }
];

const ARTICLES = [
  // --- April 2026 New Articles ---
  {
    id: "iran-war-indian-markets-2026",
    title: "Iran War & the Strait of Hormuz: How the 2026 Conflict Reshaped Indian Capital Markets",
    description: "Analyzing the impact of the 2026 Iran war on Sensex, Nifty, crude oil prices, FII flows, and what it means for IPO-bound companies navigating SEBI compliance in volatile markets.",
    category: "market-update",
    date: "2026-04-18",
    month: "April 2026",
    readTime: "12 min read",
    author: "IPO Labs Research",
    featured: true,
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    content: `The 2026 Iran war has been the defining geopolitical event for global and Indian capital markets this year. When Iran closed the Strait of Hormuz on March 4, 2026, Brent crude surged from ~$72/barrel to nearly $120/barrel — a 66% spike that sent shockwaves through every emerging market, with India bearing a disproportionate impact as the world's third-largest oil importer.\n\nBy mid-April 2026, following Iran's ceasefire announcement on April 17 declaring the Strait "completely open," oil prices corrected over 10% to ~$88/barrel. However, the damage to market sentiment was already done — FII outflows accelerated, the rupee faced pressure, and IPO pipelines across BSE and NSE saw multiple deferrals.\n\nFor IPO-bound companies, the key takeaway is clear: geopolitical risk must now be factored into DRHP risk factor disclosures. SEBI's ICDR regulations require comprehensive risk factor enumeration, and companies filing DRHPs in H1 2026 must explicitly address energy price volatility, supply chain disruptions, and forex risk arising from the conflict.\n\nThe Sensex surged over 2% on April 1 on easing tensions and aggressive FII buying, only to see sharp intraday declines on April 2 as West Asian tensions re-escalated. Bank Nifty gained 3%+ on credit growth optimism, while auto and pharma stocks declined on rising fuel cost concerns.\n\nWhat does this mean for your IPO timeline? Companies with strong fundamentals and low oil-price sensitivity are seeing this as a window of opportunity — merchant bankers report that well-prepared issuers with clean DRHPs can still achieve premium valuations despite market volatility.`
  },
  {
    id: "us-tariff-policy-india-ipo-2026",
    title: "Trump's 2026 Tariff Policies: Impact on Indian IPO Valuations & Cross-Border Capital Flows",
    description: "How the latest US trade policies, reciprocal tariffs, and dollar strengthening are affecting Indian IPO pricing, FII sentiment, and SEBI-regulated public offerings on NSE and BSE.",
    category: "market-update",
    date: "2026-04-15",
    month: "April 2026",
    readTime: "10 min read",
    author: "IPO Labs Research",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
    content: `The Trump administration's aggressive tariff posture in 2026 has created a complex landscape for Indian companies planning IPOs. With reciprocal tariffs on Indian goods ranging from 26-54%, export-oriented sectors face margin compression that directly impacts IPO valuations.\n\nFII flows into Indian equities have been volatile — April 2026 saw alternating weeks of net inflows and outflows as global fund managers reassessed India's growth premium versus tariff headwinds. The MSCI India index has underperformed MSCI Emerging Markets by ~200bps in Q1 2026.\n\nFor companies preparing DRHPs, the US policy environment must be addressed in multiple sections: Risk Factors (trade policy uncertainty), Business Overview (export market diversification), and Management Discussion & Analysis (tariff impact on financials). SEBI's latest circular emphasizes that material risks from changing trade policies must be quantified where possible.\n\nMerchant bankers are advising IPO-bound companies to: (1) stress-test financial projections against worst-case tariff scenarios, (2) highlight domestic revenue streams, and (3) showcase China+1 beneficiary positioning where applicable. The NSE and BSE listing committees are scrutinizing international exposure disclosures more rigorously than ever.`
  },
  {
    id: "crude-oil-india-ipo-readiness-2026",
    title: "Crude Oil at $88-105: What Every IPO-Bound Indian Company Must Know About Energy Risk Disclosure",
    description: "A practical guide for Indian companies filing DRHPs on how to address crude oil price volatility, its impact on working capital, and SEBI-compliant risk factor disclosure for NSE/BSE listings.",
    category: "compliance",
    date: "2026-04-12",
    month: "April 2026",
    readTime: "8 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1513828583688-c52571021e11?w=800&q=80",
    content: `With Brent crude oscillating between $88-105/barrel in April 2026, energy costs have become the single largest variable in IPO financial projections across sectors. India imports ~85% of its crude oil requirements, making every listed and to-be-listed company vulnerable to price shocks.\n\nSEBI's ICDR regulations mandate that DRHPs include a comprehensive Risk Factors section. For 2026 filings, SEBI review teams are specifically flagging DRHPs that fail to quantify oil price impact on: (a) raw material costs, (b) logistics and transportation, (c) forex exposure on oil imports, and (d) downstream pricing power.\n\nPractical steps for IPO-bound companies: Include sensitivity analysis showing P&L impact for every $10/barrel movement. Detail your hedging strategy (if any). Quantify the working capital impact of rising input costs. Show how you plan to maintain margins through pricing adjustments or cost optimization.\n\nMerchant bankers on Dalal Street report that SEBI's review cycle for DRHPs has extended by 2-3 weeks in Q1 2026, primarily due to inadequate risk disclosures related to energy costs and geopolitical factors.`
  },
  {
    id: "nifty-sensex-recovery-april-2026",
    title: "Nifty at 24,350 & Sensex at 78,493: Is the April 2026 Recovery Sustainable for IPO Markets?",
    description: "Technical and fundamental analysis of the Indian stock market recovery in mid-April 2026, and its implications for upcoming IPO listings, SEBI approvals, and merchant banker pipeline on BSE & NSE.",
    category: "market-update",
    date: "2026-04-17",
    month: "April 2026",
    readTime: "9 min read",
    author: "IPO Labs Research",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
    content: `The April 17 session saw Nifty50 close above 24,350 and Sensex at 78,493.54, up 500+ points on positive global cues following the Iran ceasefire announcement. Bank Nifty continued its outperformance with a 3%+ gain, driven by strong credit growth outlook and stable RBI rate expectations.\n\nBut is this rally sustainable enough to support a healthy IPO market? The answer depends on three factors: (1) Duration of the Iran ceasefire and its impact on oil prices, (2) FII flow trajectory — April has seen net FII outflows of approximately Rs 12,000 crore despite sporadic buying sessions, and (3) Q4 FY26 earnings season, which kicks off this week.\n\nFor IPO-bound companies, the current market window presents a tactical opportunity. Historically, IPOs launched during market recovery phases (post-correction) have delivered stronger listing day gains. SEBI approval data shows 15+ companies have received final observations in March-April 2026, suggesting a pipeline buildup for May-June listings.\n\nKey sectors to watch for upcoming IPOs: Fintech (strong domestic consumption story), Specialty Chemicals (China+1 beneficiary), Healthcare (resilient margins despite oil costs), and Renewable Energy (government policy tailwind). The merchant banker community expects 8-12 mainboard IPOs in Q1 FY27 on NSE and BSE.`
  },
  {
    id: "sebi-ipo-reforms-2026",
    title: "SEBI's 2026 IPO Reforms: New Disclosure Norms, Faster Approvals & What Changes for Your DRHP",
    description: "Breaking down SEBI's latest regulatory updates for IPO-bound companies in 2026, including enhanced ESG disclosure requirements, streamlined DRHP review timelines, and updated ICDR guidelines.",
    category: "compliance",
    date: "2026-04-08",
    month: "April 2026",
    readTime: "11 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1507679799987-c73b1a8312ad?w=800&q=80",
    content: `SEBI has introduced several significant reforms in 2026 aimed at modernizing the IPO process while strengthening investor protection. Key changes include: enhanced ESG (Environmental, Social, Governance) disclosure requirements in DRHPs, a streamlined review timeline targeting 30-day turnaround for compliant filings, and updated ICDR guidelines addressing digital asset disclosures.\n\nThe new ESG framework requires IPO-bound companies to include a dedicated section on carbon footprint, diversity metrics, and governance practices. This aligns with India's commitment to sustainable capital markets and follows similar reforms by stock exchanges globally.\n\nFor companies on the NSE/BSE listing track, the practical impact is significant: DRHPs filed after April 1, 2026 must comply with the new format. Companies using AI-powered platforms like SETU can automate much of this compliance through template-based section generation.\n\nMerchant bankers and legal advisors report that the new norms, while initially adding complexity, are ultimately beneficial — they reduce the back-and-forth with SEBI during the observation period, as comprehensive upfront disclosure minimizes queries. Early adopters of the new format are seeing approval timelines of 25-28 days versus the previous 45-60 day average.`
  },
  // --- Existing ipo-labs.com Articles ---
  {
    id: "best-practices-drhp-submission",
    title: "Best Practices Before Submitting an IPO DRHP",
    description: "Essential steps and compliance requirements every company must complete before filing their Draft Red Herring Prospectus with SEBI. A comprehensive checklist for CFOs and company secretaries.",
    category: "best-practices",
    date: "2026-03-15",
    month: "March 2026",
    readTime: "8 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
    content: `Filing a Draft Red Herring Prospectus (DRHP) with SEBI is the most critical milestone in any company's IPO journey. A well-prepared DRHP not only accelerates the regulatory review process but also builds investor confidence.\n\nKey best practices include: (1) Ensure all financial statements are restated as per SEBI ICDR requirements for at least 3 completed fiscal years. (2) Complete all pending statutory filings — ROC annual returns, GST returns, income tax filings. (3) Resolve any pending litigation or make comprehensive disclosures. (4) Appoint all required board members including independent directors. (5) Ensure your cap table is clean with no ambiguous shareholding arrangements.\n\nCommon mistakes that delay SEBI approval: incomplete risk factor disclosures, missing material contract details, unresolved related party transactions, and inadequate management discussion & analysis sections. Companies using the SETU platform can leverage AI-powered compliance checks to identify gaps before submission.`
  },
  {
    id: "pre-funding-ipo-impact",
    title: "Impact of Pre-Funding During an IPO Process",
    description: "Analyzing how pre-IPO funding rounds affect valuation, dilution, and overall IPO strategy for Indian companies listing on NSE and BSE.",
    category: "funding",
    date: "2026-03-10",
    month: "March 2026",
    readTime: "10 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1758518727600-2c5f48419eac?w=800&q=80",
    content: `Pre-IPO funding rounds have become a strategic tool for companies preparing for public listings on Indian stock exchanges. The timing, structure, and quantum of pre-IPO capital can significantly influence your IPO pricing and investor appetite.\n\nKey considerations: Pre-IPO rounds at higher valuations create a floor for IPO pricing but may limit upside for public investors. Conversely, conservative pre-IPO valuations can generate listing day gains that attract retail participation. SEBI's ICDR regulations require full disclosure of all pre-IPO transactions within 18 months of filing.\n\nStrategic approach: Align pre-IPO funding with your intended issue size. Use pre-IPO capital to strengthen the balance sheet metrics that SEBI evaluates — net worth, net tangible assets, and profitability track record. Consider the lock-in implications for pre-IPO investors under SEBI norms.`
  },
  {
    id: "sebi-icdr-regulations-guide",
    title: "Understanding SEBI (ICDR) Regulations: A Complete Guide",
    description: "A comprehensive overview of SEBI regulations governing Initial Public Offerings in India and key compliance requirements for NSE and BSE listings.",
    category: "compliance",
    date: "2026-03-05",
    month: "March 2026",
    readTime: "12 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    content: `The SEBI (Issue of Capital and Disclosure Requirements) Regulations form the backbone of India's IPO regulatory framework. Understanding these regulations is essential for every company, merchant banker, and legal advisor involved in the IPO process.\n\nKey eligibility criteria for mainboard listing: Net tangible assets of at least Rs 3 crore in each of the preceding 3 full years. Net worth of at least Rs 1 crore in each of the preceding 3 full years. Average operating profit of at least Rs 15 crore during any 3 of the preceding 5 years.\n\nFor SME listings on NSE Emerge or BSE SME platform: Minimum post-issue paid-up capital of Rs 3 crore (mainboard) or Rs 1 crore (SME). The DRHP must contain all prescribed disclosures including risk factors, business overview, financial information, and legal matters.`
  },
  {
    id: "ai-powered-ipo-readiness",
    title: "AI-Powered IPO Readiness: The Future of Public Listings",
    description: "How artificial intelligence is transforming IPO preparation by automating compliance checks, DRHP generation, and identifying gaps in real-time for SEBI filings.",
    category: "technology",
    date: "2026-02-28",
    month: "February 2026",
    readTime: "7 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1758599543378-ba892b220c89?w=800&q=80",
    content: `Artificial intelligence is revolutionizing how companies prepare for IPOs. From automated DRHP generation to real-time compliance monitoring, AI tools are reducing the time and cost of going public while improving accuracy.\n\nKey AI applications in IPO preparation: Automated extraction of financial data from audit reports and regulatory filings. Real-time gap analysis against SEBI ICDR requirements. Intelligent document management with version control and audit trails. AI-powered risk factor identification and drafting assistance.\n\nThe SETU platform leverages GPT-powered analysis to help companies identify compliance gaps, generate DRHP sections, and manage the complex documentation requirements of an Indian IPO. This technology is particularly valuable for SME companies listing on NSE Emerge or BSE SME platforms where resources are limited.`
  },
  {
    id: "cap-table-ipo-success",
    title: "Building Your Cap Table for IPO Success",
    description: "Strategic guidance on structuring your capitalization table to meet SEBI requirements and maximize IPO valuation on NSE and BSE.",
    category: "strategy",
    date: "2026-02-20",
    month: "February 2026",
    readTime: "9 min read",
    author: "IPO Labs - Founders",
    image: "https://images.pexels.com/photos/5849572/pexels-photo-5849572.jpeg?w=800&q=80",
    content: `A clean, well-structured capitalization table is fundamental to a successful IPO. SEBI's ICDR regulations require detailed disclosure of your shareholding pattern, and any irregularities can delay or derail your listing.\n\nKey principles: Ensure clear title documentation for all shares. Resolve any pending ESOP exercises before DRHP filing. Address any historical irregularities in share transfers or allotments. Consider the impact of promoter reclassification on minimum public shareholding norms.\n\nStrategic cap table planning should begin 18-24 months before the intended DRHP filing. This gives adequate time to resolve legacy issues, complete any necessary corporate restructuring, and ensure compliance with SEBI's lock-in requirements for promoter and pre-IPO shareholders.`
  },
  {
    id: "independent-directors-governance",
    title: "The Role of Independent Directors in IPO Governance",
    description: "Why appointing qualified independent directors is critical for IPO success and how to find the right candidates for SEBI compliance.",
    category: "governance",
    date: "2026-02-15",
    month: "February 2026",
    readTime: "6 min read",
    author: "IPO Labs - Founders",
    image: "https://images.pexels.com/photos/3727513/pexels-photo-3727513.jpeg?w=800&q=80",
    content: `SEBI mandates that listed companies have at least one-third of their board comprising independent directors. For IPO-bound companies, appointing the right independent directors is both a compliance requirement and a strategic advantage.\n\nIndependent directors bring credibility with institutional investors, provide governance oversight that SEBI values, and can open doors to strategic relationships. Key qualifications to look for: industry expertise, listed company experience, clean regulatory record, and availability for board and committee meetings.\n\nThe SETU Match-Making Platform connects IPO-bound companies with experienced independent directors who have track records of successful IPO governance.`
  },
  {
    id: "document-management-ipo",
    title: "Document Management Best Practices for IPO Preparation",
    description: "Essential strategies for organizing, versioning, and maintaining audit-ready documentation throughout your IPO journey on NSE and BSE.",
    category: "best-practices",
    date: "2026-02-10",
    month: "February 2026",
    readTime: "8 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
    content: `Managing hundreds of documents across multiple stakeholders is one of the biggest challenges in IPO preparation. A robust document management system ensures nothing falls through the cracks during SEBI's review process.\n\nBest practices: Implement a centralized document repository with role-based access control. Maintain version history for all critical documents. Use standardized naming conventions across all DRHP chapters. Enable real-time collaboration between merchant bankers, legal advisors, and company teams.\n\nThe SETU platform's Centralised Corporate Repository provides AI-powered document management specifically designed for IPO preparation, including OCR-based data extraction and automated cross-referencing between DRHP sections.`
  },
  {
    id: "financial-audits-ipo",
    title: "Financial Audits and IPO Readiness: What You Need to Know",
    description: "Understanding the audit requirements for IPO-bound companies and how to prepare your financial statements for SEBI scrutiny.",
    category: "compliance",
    date: "2026-01-25",
    month: "January 2026",
    readTime: "11 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    content: `Financial audits form the bedrock of any IPO filing. SEBI requires restated financial statements audited by a peer-reviewed chartered accountant firm. The quality and completeness of your financial disclosures directly impact investor confidence and pricing.\n\nKey requirements: Restated financials for at least 3 completed fiscal years. Statement on the impact of any qualifications in audit reports. Related party transaction disclosures with arm's length pricing justification. Segment-wise financial information if applicable.\n\nCommon audit issues that delay IPOs: unresolved audit qualifications, inconsistent accounting policies across years, incomplete related party disclosures, and inadequate internal financial controls documentation.`
  },
  {
    id: "material-contracts-drhp",
    title: "Navigating Material Contracts Disclosure in Your DRHP",
    description: "A detailed guide on identifying, documenting, and disclosing material contracts as required by SEBI regulations for IPO filings.",
    category: "compliance",
    date: "2026-01-15",
    month: "January 2026",
    readTime: "7 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    content: `Material contracts disclosure is a critical component of the DRHP that often catches companies off-guard during SEBI's review. A material contract is any agreement that is significant to the company's business operations or financial condition.\n\nSEBI expects disclosure of: all contracts not in the ordinary course of business, contracts involving related parties, agreements with key customers or suppliers representing more than 10% of revenue, technology licensing agreements, and any contracts with onerous terms.\n\nBest practice: Begin identifying material contracts 12 months before DRHP filing. Create a comprehensive contract register and have your legal team classify each contract for materiality.`
  },
  {
    id: "ipo-timeline-planning",
    title: "Timeline Planning: From IPO Decision to Listing Day",
    description: "A realistic timeline of the IPO process in India, including key milestones, regulatory checkpoints, and common delays to anticipate.",
    category: "process",
    date: "2026-01-05",
    month: "January 2026",
    readTime: "10 min read",
    author: "IPO Labs - Founders",
    image: "https://images.unsplash.com/photo-1737442528819-5526652236e8?w=800&q=80",
    content: `The typical IPO timeline in India spans 12-18 months from decision to listing. Understanding each phase helps companies plan resources and avoid last-minute scrambles.\n\nPhase 1 (Months 1-6): Pre-IPO preparation — board restructuring, financial restatement, merchant banker appointment, legal due diligence. Phase 2 (Months 6-9): DRHP drafting — content creation for all sections, data verification, legal vetting. Phase 3 (Months 9-12): SEBI filing and review — observation period, query responses, final approvals. Phase 4 (Months 12-14): Marketing and pricing — roadshow, book building, allotment, listing.\n\nCommon delays: SEBI queries on incomplete disclosures (add 4-8 weeks), pending litigation resolution (variable), market conditions requiring timing adjustments (variable). Companies using AI-powered platforms can compress Phases 1-2 by 30-40%.`
  }
];

const MONTHS = [...new Set(ARTICLES.map(a => a.month))];

const ResourcesPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filtered = ARTICLES.filter(a => {
    const matchCat = activeCategory === "all" || a.category === activeCategory;
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredArticle = ARTICLES.find(a => a.featured);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-white" data-testid="article-page">
        <nav className="sticky top-0 z-20 bg-white border-b px-8 lg:px-16 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#003366] rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">IP</span></div>
            <span className="font-bold text-[#003366]">IPO Labs</span>
          </div>
          <span className="text-muted-foreground mx-2">/</span>
          <span className="text-sm text-muted-foreground">Resources</span>
        </nav>
        <article className="max-w-3xl mx-auto px-8 py-10">
          <Badge variant="outline" className="mb-4 capitalize">{selectedArticle.category.replace("-", " ")}</Badge>
          <h1 className="text-3xl font-bold text-black leading-tight mb-4">{selectedArticle.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedArticle.author}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedArticle.readTime}</span>
            <span>{new Date(selectedArticle.date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-72 object-cover rounded-xl mb-8" />
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            {selectedArticle.content.split("\n\n").map((p, i) => <p key={i} className="mb-5">{p}</p>)}
          </div>
          <div className="border-t mt-12 pt-8">
            <Button onClick={() => setSelectedArticle(null)} variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Resources</Button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col" data-testid="resources-page">
      {/* SEO Meta — rendered in head via Helmet or just semantic HTML */}
      <header className="sr-only">
        <h1>IPO Resources & Insights | India IPO, SEBI, NSE, BSE, Stock Market, DRHP, Merchant Bankers Guide</h1>
        <p>Expert guidance on Indian IPO process, SEBI ICDR compliance, NSE BSE listing, DRHP preparation, merchant banker selection, capital market regulations, and stock market analysis for IPO-bound companies.</p>
      </header>

      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-white border-b px-8 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#003366] rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">IP</span></div>
            <span className="font-bold text-[#003366]">IPO Labs</span>
          </div>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="font-semibold text-black">Resources & Insights</span>
        </div>
        <Button onClick={() => navigate("/login")} className="bg-[#003366] hover:bg-[#002244] text-white rounded-full px-6 text-sm">Sign In</Button>
      </nav>

      {/* Hero */}
      <section className="bg-[#003366] text-white py-14 px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-3">Resources & Insights</h2>
          <p className="text-white/70 text-lg max-w-2xl">Expert guidance on India's IPO ecosystem — SEBI compliance, DRHP preparation, NSE & BSE listing strategies, capital market analysis, and best practices for merchant bankers and issuers.</p>
          <div className="relative mt-6 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <Input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search articles on IPO, SEBI, NSE, BSE..."
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20"
              data-testid="resources-search"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 lg:px-16 py-8 flex gap-8 flex-1">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Topics</h3>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === cat.id ? "bg-[#003366] text-white font-medium" : "text-gray-600 hover:bg-gray-100"}`}
                    data-testid={`cat-${cat.id}`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            {/* By Month */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Archive</h3>
              <div className="space-y-1">
                {MONTHS.map(m => (
                  <button key={m} onClick={() => { setActiveCategory("all"); setSearchQuery(m.split(" ")[0]); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {/* SEO Keywords Section */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Popular Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {["IPO", "SEBI", "NSE", "BSE", "DRHP", "Merchant Bankers", "Stock Market", "India IPO", "ICDR", "Capital Markets"].map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0.5 cursor-pointer hover:bg-gray-100"
                    onClick={() => setSearchQuery(tag)}>{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Article Grid */}
        <main className="flex-1 min-w-0">
          {/* Category Pills (Mobile) */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 lg:hidden">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ? "bg-[#003366] text-white" : "bg-gray-100 text-gray-600"}`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Featured Article */}
          {activeCategory === "all" && !searchQuery && featuredArticle && (
            <Card className="mb-8 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group border-0 shadow-sm"
              onClick={() => setSelectedArticle(featuredArticle)} data-testid="featured-article">
              <div className="grid md:grid-cols-2">
                <img src={featuredArticle.image} alt={featuredArticle.title} className="w-full h-48 md:h-full object-cover" />
                <CardContent className="p-5">
                  <Badge className="bg-[#003366] text-white w-fit mb-2">Featured</Badge>
                  <h3 className="text-lg font-bold text-black mb-1.5 group-hover:text-[#003366] transition-colors leading-tight line-clamp-2">{featuredArticle.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{featuredArticle.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{featuredArticle.author}</span>
                    <span>{featuredArticle.readTime}</span>
                  </div>
                </CardContent>
              </div>
            </Card>
          )}

          {/* Article Count */}
          <p className="text-sm text-muted-foreground mb-4">{filtered.length} article{filtered.length !== 1 ? "s" : ""}</p>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map(article => (
              <Card key={article.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group border-0 shadow-sm"
                onClick={() => setSelectedArticle(article)} data-testid={`article-${article.id}`}>
                <img src={article.image} alt={article.title} className="w-full h-44 object-cover" />
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-2 text-[10px] capitalize">{article.category.replace("-", " ")}</Badge>
                  <h3 className="font-semibold text-black text-sm mb-2 group-hover:text-[#003366] transition-colors leading-snug line-clamp-2">{article.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{article.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{article.author}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No articles found</p>
              <p className="text-sm">Try a different search term or category</p>
            </div>
          )}
        </main>
      </div>

      {/* CTA Section */}
      <section className="bg-[#003366] text-white py-12 px-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to Start Your IPO Journey?</h2>
        <p className="text-white/70 mb-6 max-w-lg mx-auto">Let SETU by IPO Labs guide you through every step with AI-powered automation</p>
        <Button onClick={() => navigate("/login")} className="bg-white text-[#003366] hover:bg-gray-100 rounded-full px-8 font-semibold">Get Started</Button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white/60 py-6 px-8 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} IPO Labs Private Limited. All rights reserved. | India IPO, SEBI, NSE, BSE, DRHP, Merchant Bankers, Stock Market, Capital Markets</p>
      </footer>
    </div>
  );
};

export default ResourcesPage;
