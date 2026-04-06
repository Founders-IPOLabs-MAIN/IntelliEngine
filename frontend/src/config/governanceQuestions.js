// Governance/Compliance Questions for IPO Readiness Assessment
// Source: SEBI IPO Readiness Framework

const GOVERNANCE_QUESTIONS = [
  {
    id: "gc_1",
    category: "Corporate Structure",
    question: "Is the company already a public limited company or capable of conversion before IPO?",
    positiveAnswer: "yes",
    tooltip: "Public company structure is mandatory before filing DRHP/RHP."
  },
  {
    id: "gc_2",
    category: "Corporate Structure",
    question: "Are there pending mergers, demergers, restructuring or subsidiary rationalisation exercises?",
    positiveAnswer: "no",
    tooltip: "May delay IPO due to need for restated financials, approvals and revised disclosures."
  },
  {
    id: "gc_3",
    category: "Promoter Background",
    question: "Are any promoters/directors disqualified under Companies Act or SEBI regulations?",
    positiveAnswer: "no",
    tooltip: "Major red flag. IPO may be delayed or become ineligible until issue is resolved."
  },
  {
    id: "gc_4",
    category: "Promoter Background",
    question: "Are promoters/directors wilful defaulters, fugitive economic offenders or involved in fraud matters?",
    positiveAnswer: "no",
    tooltip: "Serious disqualification risk under SEBI ICDR Regulations."
  },
  {
    id: "gc_5",
    category: "Share Capital History",
    question: "Have all allotments, ESOPs, rights issues and share transfers been completed properly?",
    positiveAnswer: "yes",
    tooltip: "Clean capital history is important for due diligence and DRHP disclosures."
  },
  {
    id: "gc_6",
    category: "Share Capital History",
    question: "Are there any pending shareholding disputes or undocumented transfers?",
    positiveAnswer: "no",
    tooltip: "May delay IPO and create legal/title concerns."
  },
  {
    id: "gc_7",
    category: "Share Capital / Dematerialisation",
    question: "Have all existing equity shares been dematerialised and available in electronic form with a depository?",
    positiveAnswer: "yes",
    tooltip: "Dematerialisation of all shares is mandatory before IPO."
  },
  {
    id: "gc_8",
    category: "Share Capital / Dematerialisation",
    question: "Has the company entered into tripartite agreements with both depositories and a registrar and transfer agent (RTA)?",
    positiveAnswer: "yes",
    tooltip: "Tripartite agreements with NSDL/CDSL and the RTA are mandatory for demat connectivity before IPO."
  },
  {
    id: "gc_9",
    category: "ROC Compliance",
    question: "Are there any pending ROC penalties, adjudications or compounding matters?",
    positiveAnswer: "no",
    tooltip: "These need to be disclosed and resolved before IPO."
  },
  {
    id: "gc_10",
    category: "Board Composition",
    question: "Does the company have adequate board strength including woman director and independent directors?",
    positiveAnswer: "yes",
    tooltip: "Mandatory for listed company readiness and SEBI LODR compliance."
  },
  {
    id: "gc_11",
    category: "Board Committees",
    question: "Have Audit Committee, NRC, SRC and CSR Committee been properly formed?",
    positiveAnswer: "yes",
    tooltip: "Required before IPO and listing."
  },
  {
    id: "gc_12",
    category: "Secretarial Compliance",
    question: "Are statutory registers, minutes books and approvals maintained properly?",
    positiveAnswer: "yes",
    tooltip: "Smoothens legal due diligence and secretarial audit."
  },
  {
    id: "gc_13",
    category: "Senior Management",
    question: "Does the company have a full-time CFO with adequate listed company / IPO experience?",
    positiveAnswer: "yes",
    tooltip: "A CFO is critical for financial controls, investor confidence, due diligence and IPO execution."
  },
  {
    id: "gc_14",
    category: "Senior Management",
    question: "Does the company have a full-time Company Secretary?",
    positiveAnswer: "yes",
    tooltip: "A full-time CS is generally essential for secretarial compliance, SEBI filings and listing readiness."
  },
  {
    id: "gc_15",
    category: "Senior Management",
    question: "Does the company have a compliance officer identified for future listed company obligations?",
    positiveAnswer: "yes",
    tooltip: "Required under SEBI LODR and insider trading regulations after listing."
  },
  {
    id: "gc_16",
    category: "Senior Management",
    question: "Does the company have an internal finance and accounts team rather than complete dependence on external consultants?",
    positiveAnswer: "yes",
    tooltip: "Strong internal team improves data readiness and investor confidence."
  },
  {
    id: "gc_17",
    category: "Board Composition",
    question: "Does the company have at least one woman director?",
    positiveAnswer: "yes",
    tooltip: "Mandatory for listed entities under the Companies Act and SEBI LODR."
  },
  {
    id: "gc_18",
    category: "Board Composition",
    question: "Does the company have at least two independent directors?",
    positiveAnswer: "yes",
    tooltip: "Independent directors are essential for governance credibility and listing compliance."
  },
  {
    id: "gc_19",
    category: "Board Composition",
    question: "Does the company have an independent chairperson or non-executive chairperson?",
    positiveAnswer: "yes",
    tooltip: "Improves governance perception among investors."
  },
  {
    id: "gc_20",
    category: "Board Composition",
    question: "Does the company have directors with expertise in finance, legal, industry and governance matters?",
    positiveAnswer: "yes",
    tooltip: "Diverse board composition is viewed favourably by merchant bankers and investors."
  },
  {
    id: "gc_21",
    category: "Board Composition",
    question: "Are there any promoter relatives on the board without relevant qualifications or active role?",
    positiveAnswer: "no",
    tooltip: "Investors may perceive this as weak governance or promoter dominance."
  },
  {
    id: "gc_22",
    category: "Committees",
    question: "Does the Audit Committee include financially literate independent directors?",
    positiveAnswer: "yes",
    tooltip: "Mandatory and critical for strong financial oversight."
  },
  {
    id: "gc_23",
    category: "Committees",
    question: "Does the Nomination and Remuneration Committee have independent oversight on promoter/KMP remuneration?",
    positiveAnswer: "yes",
    tooltip: "Reduces governance concerns regarding excessive promoter compensation."
  },
  {
    id: "gc_24",
    category: "Committees",
    question: "Does the company have a Risk Management Committee or framework in place?",
    positiveAnswer: "yes",
    tooltip: "Particularly useful for larger companies and Main Board IPOs."
  },
  {
    id: "gc_25",
    category: "Governance Policies",
    question: "Does the company have a formal code of conduct for directors and senior management?",
    positiveAnswer: "yes",
    tooltip: "Indicates readiness for listed company governance requirements."
  },
  {
    id: "gc_26",
    category: "Governance Policies",
    question: "Does the company have an insider trading policy and code for unpublished price sensitive information (UPSI)?",
    positiveAnswer: "yes",
    tooltip: "Mandatory before listing and important for SEBI compliance."
  },
  {
    id: "gc_27",
    category: "Governance Policies",
    question: "Does the company have a related party transaction policy?",
    positiveAnswer: "yes",
    tooltip: "Helps manage promoter group dealings and investor concerns."
  },
  {
    id: "gc_28",
    category: "Governance Policies",
    question: "Does the company have a documented whistleblower / vigil mechanism policy?",
    positiveAnswer: "yes",
    tooltip: "Enhances governance credibility."
  },
  {
    id: "gc_29",
    category: "Governance Policies",
    question: "Does the company have a documented succession plan for key promoters and senior management?",
    positiveAnswer: "yes",
    tooltip: "Reduces promoter dependency risk."
  },
  {
    id: "gc_30",
    category: "Internal Controls",
    question: "Does the company have an internal auditor appointed?",
    positiveAnswer: "yes",
    tooltip: "Internal audit is important for identifying gaps before IPO due diligence."
  },
  {
    id: "gc_31",
    category: "Internal Controls",
    question: "Does the company have ERP/accounting systems capable of monthly MIS and segment reporting?",
    positiveAnswer: "yes",
    tooltip: "Strong systems improve reporting quality and DRHP preparation."
  },
  {
    id: "gc_32",
    category: "Internal Controls",
    question: "Does the company close monthly books within 10-15 days of month-end?",
    positiveAnswer: "yes",
    tooltip: "Timely financial reporting is expected by investors and merchant bankers."
  },
  {
    id: "gc_33",
    category: "Human Resources",
    question: "Does the company have formal HR policies, employment agreements and ESOP documentation?",
    positiveAnswer: "yes",
    tooltip: "Organised HR framework improves governance quality."
  },
  {
    id: "gc_34",
    category: "Human Resources",
    question: "Are key employees locked in through employment contracts, ESOPs or retention plans?",
    positiveAnswer: "yes",
    tooltip: "Helps assure continuity post-IPO."
  },
  {
    id: "gc_35",
    category: "Promoter Dependence",
    question: "Is the business heavily dependent on one promoter for customer relationships, operations or approvals?",
    positiveAnswer: "no",
    tooltip: "High promoter dependency is viewed as a risk factor."
  },
  {
    id: "gc_36",
    category: "Promoter Funding",
    question: "Have promoters given unsecured loans to the company?",
    positiveAnswer: "no",
    tooltip: "May require conversion, repayment or proper documentation before IPO."
  },
  {
    id: "gc_37",
    category: "KMP Stability",
    question: "Has there been frequent resignation of CFO, CS, auditors or senior management in the last 3 years?",
    positiveAnswer: "no",
    tooltip: "Frequent exits create governance concerns for investors."
  },
  {
    id: "gc_38",
    category: "Statutory Audit",
    question: "Has the company changed statutory auditors frequently in the past few years?",
    positiveAnswer: "no",
    tooltip: "Frequent auditor changes may raise concerns regarding financial reporting quality."
  },
  {
    id: "gc_39",
    category: "Peer Review Audit",
    question: "Have the restated financial statements been prepared by a peer-reviewed auditor?",
    positiveAnswer: "yes",
    tooltip: "Required for IPO documentation and DRHP filing."
  },
  {
    id: "gc_40",
    category: "Investor Readiness",
    question: "Has the company prepared an investor presentation, business plan and growth roadmap?",
    positiveAnswer: "yes",
    tooltip: "Indicates readiness for investor discussions and valuation support."
  },
  {
    id: "gc_41",
    category: "Auditor Matters",
    question: "Have auditors issued qualified reports, adverse remarks or emphasis of matter paragraphs?",
    positiveAnswer: "no",
    tooltip: "These issues may reduce valuation and need detailed explanation."
  },
  {
    id: "gc_42",
    category: "Financial Reporting",
    question: "Are there material deviations between management accounts and audited accounts?",
    positiveAnswer: "no",
    tooltip: "Raises reliability concerns on financial reporting."
  },
  {
    id: "gc_43",
    category: "Loans and Borrowings",
    question: "Are all borrowings properly documented without defaults or covenant breaches?",
    positiveAnswer: "yes",
    tooltip: "Indicates financial discipline."
  },
  {
    id: "gc_44",
    category: "Loans and Borrowings",
    question: "Are there personal guarantees by promoters on major loans?",
    positiveAnswer: "no",
    tooltip: "May require release/restructuring before IPO."
  },
  {
    id: "gc_45",
    category: "Fixed Assets and Title Documents",
    question: "Are all title deeds, leases and property records available in company name?",
    positiveAnswer: "yes",
    tooltip: "Essential for legal due diligence."
  },
  {
    id: "gc_46",
    category: "Fixed Assets and Title Documents",
    question: "Are there disputed properties or assets not registered in company name?",
    positiveAnswer: "no",
    tooltip: "May require rectification before IPO."
  },
  {
    id: "gc_47",
    category: "Employee Benefits",
    question: "Has the company made proper gratuity provision in books as per the Payment of Gratuity Act, 1972 and applicable accounting standards?",
    positiveAnswer: "yes",
    tooltip: "Proper gratuity provisioning indicates sound HR and accounting compliance."
  },
  {
    id: "gc_48",
    category: "Employee Benefits",
    question: "Has the company obtained actuarial valuation for gratuity liability wherever required?",
    positiveAnswer: "yes",
    tooltip: "Required under applicable accounting standards for proper disclosure of employee benefit obligations."
  },
  {
    id: "gc_49",
    category: "Data Protection / IT Systems",
    question: "Does the company have adequate cyber security and data protection systems?",
    positiveAnswer: "yes",
    tooltip: "Important for technology, fintech and SaaS companies."
  },
  {
    id: "gc_50",
    category: "ESG and Sustainability",
    question: "Are there environmental or social non-compliances?",
    positiveAnswer: "no",
    tooltip: "ESG risks are increasingly scrutinised by investors."
  },
  {
    id: "gc_51",
    category: "Customer / Vendor Concentration",
    question: "Is the company dependent on one or two major customers or vendors?",
    positiveAnswer: "no",
    tooltip: "High concentration risk may affect valuation."
  },
  {
    id: "gc_52",
    category: "Dividend History",
    question: "Has the company maintained a consistent dividend policy where applicable?",
    positiveAnswer: "yes",
    tooltip: "Indicates stable cash generation, though not mandatory."
  },
  {
    id: "gc_53",
    category: "Contingent Liabilities",
    question: "Are there material guarantees, disputed liabilities or indemnities?",
    positiveAnswer: "no",
    tooltip: "May reduce valuation and increase investor caution."
  },
  {
    id: "gc_54",
    category: "Insurance Coverage",
    question: "Does the company have adequate insurance for assets, employees, D&O and cyber risks?",
    positiveAnswer: "yes",
    tooltip: "Strong risk management framework."
  },
  {
    id: "gc_55",
    category: "Whistleblower / Ethics Framework",
    question: "Does the company have whistleblower, anti-bribery, insider trading and code of conduct policies?",
    positiveAnswer: "yes",
    tooltip: "Strong governance framework helps in listing readiness."
  }
];

// Get unique categories in order of appearance
export const GOVERNANCE_CATEGORIES = [...new Set(GOVERNANCE_QUESTIONS.map(q => q.category))];

export default GOVERNANCE_QUESTIONS;
