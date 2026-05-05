// Eligibility self-assessment checklists for BSE SME and NSE EMERGE.
// Sourced from BSE SME IPO Eligibility Criteria and NSE EMERGE IPO Eligibility Criteria
// documents (provided by the user). Each item is a yes/no checkpoint.
// `id` must be globally unique within a board.

export const BSE_SME_CHECKLIST = [
  {
    category: "Incorporation",
    items: [
      { id: "bse_inc_1", q: "Is the company incorporated under the Companies Act, 2013 (or 1956, as applicable)?" },
    ],
  },
  {
    category: "Post-Issue Paid-Up Capital",
    items: [
      { id: "bse_capital_1", q: "Does the post-issue paid-up capital not exceed Rs. 25 crores?" },
    ],
  },
  {
    category: "Net Worth",
    items: [
      { id: "bse_nw_1", q: "Does the company have minimum net worth of Rs. 1 crore in each of the two preceding full financial years?" },
      { id: "bse_nw_2", q: "If formed via conversion: did the predecessor entity maintain Rs. 1 crore net worth for the two preceding full financial years? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Net Tangible Assets",
    items: [
      { id: "bse_nta_1", q: "Does the company have net tangible assets of at least Rs. 3 crores in the last preceding full financial year?" },
    ],
  },
  {
    category: "Track Record",
    items: [
      { id: "bse_tr_1", q: "Does the company have a minimum operational track record of 3 years?" },
      { id: "bse_tr_2", q: "If a takeover of a sole-proprietorship / partnership / LLP: is the combined track record at least 3 years? (mark Yes if not applicable)" },
      { id: "bse_tr_3", q: "Has the company completed at least one full financial year of operations?" },
      { id: "bse_tr_4", q: "Are audited financial results available for at least one full financial year?" },
    ],
  },
  {
    category: "Alternative Route (if 3-year track record not met)",
    items: [
      { id: "bse_alt_1", q: "Has the project been appraised and funded by NABARD / SIDBI / Banks (excluding co-operative banks) / Financial Institutions? (mark Yes if not applicable / if 3-yr route taken)" },
    ],
  },
  {
    category: "Operational History After Incorporation",
    items: [
      { id: "bse_op_1", q: "Has the issuer completed at least one full financial year of operations after incorporation?" },
      { id: "bse_op_2", q: "If converted from proprietorship/partnership/LLP — do financial statements comply with Schedule III of the Companies Act, 2013? (mark Yes if not applicable)" },
      { id: "bse_op_3", q: "If converted — are statements certified by an auditor holding a valid ICAI Peer Review Board certificate? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Operating Profit (EBIDT)",
    items: [
      { id: "bse_ebidt_1", q: "Has the company / predecessor generated EBIDT of at least Rs. 1 crore from operations in 2 of the 3 latest financial years?" },
      { id: "bse_ebidt_2", q: "Has the company recorded an operating profit in at least one full FY immediately preceding application?" },
      { id: "bse_ebidt_3", q: "If project appraised by NABARD/SIDBI/Banks/FIs — is there positive EBIDT in at least one full preceding FY? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Leverage",
    items: [
      { id: "bse_lev_1", q: "Is the company's leverage ratio not exceeding 3:1?" },
    ],
  },
  {
    category: "Disciplinary Action / Defaults",
    items: [
      { id: "bse_disc_1", q: "Has no nationwide stock exchange taken regulatory action against promoter(s) or any companies promoted by them?" },
      { id: "bse_disc_2", q: "Do promoters/directors NOT hold positions of promoter or non-independent director in any compulsorily delisted or suspended company?" },
      { id: "bse_disc_3", q: "Has no director been disqualified or debarred by any regulatory authority?" },
      { id: "bse_disc_4", q: "Have the issuer, promoters, promoter group, directors, selling shareholders NOT been debarred by SEBI from accessing capital markets?" },
      { id: "bse_disc_5", q: "Are the issuer, promoters, directors NOT classified as wilful defaulter / fraudulent borrower / fugitive economic offender?" },
      { id: "bse_disc_6", q: "Are there no pending defaults in interest / principal payments to debenture / bond / fixed deposit holders by the company, promoters, promoting cos. and subsidiaries?" },
    ],
  },
  {
    category: "Name Change",
    items: [
      { id: "bse_name_1", q: "If the name was changed in the last year — is at least 50% of revenue (restated, consolidated) from the activity reflected in the new name? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Outstanding Convertible Securities",
    items: [
      { id: "bse_conv_1", q: "Does the company have NO outstanding convertible securities/rights (other than ESOPs) entitling subscription to equity at the time of filing?" },
    ],
  },
  {
    category: "OFS Restrictions",
    items: [
      { id: "bse_ofs_1", q: "Does the OFS component not exceed 20% of the total issue size?" },
      { id: "bse_ofs_2", q: "Do shares offered by each selling shareholder via OFS not exceed 50% of their pre-issue (fully diluted) shareholding?" },
    ],
  },
  {
    category: "Use of IPO Proceeds",
    items: [
      { id: "bse_use_1", q: "Are proceeds NOT being used (directly/indirectly) for repayment of loans/advances from promoters, promoter group or related parties?" },
      { id: "bse_use_2", q: "Is the General Corporate Purposes (GCP) earmark within 15% or Rs. 10 crores (whichever is lower) of amount raised?" },
      { id: "bse_use_3", q: "Does GCP + unidentified acquisitions in aggregate not exceed 25% of amount raised?" },
      { id: "bse_use_4", q: "Has firm financial arrangement been made (verifiable) for at least 75% of the means of finance (excluding the IPO proceeds and existing internal accruals)?" },
    ],
  },
  {
    category: "Functional Website & Demat",
    items: [
      { id: "bse_web_1", q: "Does the company have a functional website?" },
      { id: "bse_demat_1", q: "Is 100% of the promoter's shareholding held in dematerialised form?" },
      { id: "bse_demat_2", q: "Has the company entered into agreements with both depositories (NSDL & CDSL) to facilitate trading in demat?" },
    ],
  },
  {
    category: "Promoter Stability",
    items: [
      { id: "bse_pstab_1", q: "Has there been no change in promoters during the one year preceding the application date?" },
      { id: "bse_pstab_2", q: "If promoter ownership change exceeded 50% — has a 1-year waiting period from such change been observed? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Board / Net Worth",
    items: [
      { id: "bse_board_1", q: "Is board composition compliant with the Companies Act, 2013 at the time of in-principle approval?" },
      { id: "bse_nwc_1", q: "Is net worth computed as per the SEBI (ICDR) Regulations definition?" },
    ],
  },
  {
    category: "Promoter Contribution & Lock-in",
    items: [
      { id: "bse_lock_1", q: "Do promoters hold a minimum contribution of 20% of post-issue paid-up capital?" },
      { id: "bse_lock_2", q: "Is the minimum 20% promoter contribution locked-in for 3 years from the date of allotment?" },
      { id: "bse_lock_3", q: "Is excess promoter shareholding (beyond 20%) locked-in for 1 year from the date of allotment?" },
      { id: "bse_lock_4", q: "Is all pre-issue capital held by non-promoters subject to a 1-year lock-in from the date of allotment?" },
    ],
  },
  {
    category: "Underwriting & Market Maker",
    items: [
      { id: "bse_uw_1", q: "Is the issue 100% underwritten?" },
      { id: "bse_uw_2", q: "Does the Merchant Banker underwrite at least 15% of the issue size from their own account?" },
      { id: "bse_mm_1", q: "Is a Market Maker appointed for at least 3 years post-listing?" },
    ],
  },
  {
    category: "Monitoring Agency & Auditor Certificates",
    items: [
      { id: "bse_mon_1", q: "If issue size exceeds Rs. 50 crores — is a Monitoring Agency appointed? (mark Yes if not applicable)" },
      { id: "bse_aud_1", q: "Is a Statutory Auditor Certificate for fund utilisation submitted alongside quarterly financial filings?" },
      { id: "bse_aud_2", q: "If working capital as an object exceeds Rs. 5 crores — has the additional auditor certificate been obtained? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "DRHP Public Review",
    items: [
      { id: "bse_drhp_1", q: "Will the SME IPO DRHP undergo a 21-day public review?" },
      { id: "bse_drhp_2", q: "Will newspaper advertisements be published within 2 days of filing?" },
      { id: "bse_drhp_3", q: "Will a QR code be provided for seamless investor access?" },
    ],
  },
  {
    category: "Insolvency / Winding-up",
    items: [
      { id: "bse_ibc_1", q: "Has the company NOT been referred to NCLT under the Insolvency and Bankruptcy Code (IBC)?" },
      { id: "bse_wind_1", q: "Is there NO winding-up petition admitted by a court against the company?" },
    ],
  },
  {
    category: "Cooling-Off Period",
    items: [
      { id: "bse_cool_1", q: "If applicable — has a 6-month gap from a prior withdrawn/rejected issue been observed? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Investor Participation & Issue Structure",
    items: [
      { id: "bse_inv_1", q: "Will the SME IPO have at least 200 allottees at the time of allotment?" },
      { id: "bse_inv_2", q: "Will the minimum application size be Rs. 2 lakhs+ (i.e., a minimum of 2 lots)?" },
      { id: "bse_inv_3", q: "Will the company maintain minimum 25% public shareholding post-issue?" },
    ],
  },
  {
    category: "Special — Broking Companies (skip if not applicable)",
    items: [
      { id: "bse_brk_1", q: "If broking company: net worth Rs. 5 cr & PBT Rs. 5 cr in any 2 of 3 FYs OR net worth Rs. 25 cr in any 3 of 5 FYs satisfied? (mark Yes if not applicable)" },
      { id: "bse_brk_2", q: "If broking company: net tangible assets at least Rs. 3 crores per latest audited financials? (mark Yes if not applicable)" },
      { id: "bse_brk_3", q: "If broking company: post-issue paid-up capital at least Rs. 3 crores? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Special — Micro-Finance Companies (skip if not applicable)",
    items: [
      { id: "bse_mfi_1", q: "If micro-finance company: AUM at least Rs. 100 crores? (mark Yes if not applicable)" },
      { id: "bse_mfi_2", q: "If micro-finance company: client base of 10,000 or more? (mark Yes if not applicable)" },
      { id: "bse_mfi_3", q: "If micro-finance company: NO public deposits accepted/held? (mark Yes if not applicable)" },
    ],
  },
];

export const NSE_EMERGE_CHECKLIST = [
  {
    category: "Conditions Precedent to Listing",
    items: [
      { id: "nse_cp_1", q: "Has the issuer adhered to all conditions under the Securities Contracts (Regulations) Act, 1956?" },
      { id: "nse_cp_2", q: "Has the issuer adhered to all conditions under the Companies Act, 1956 / 2013?" },
      { id: "nse_cp_3", q: "Has the issuer adhered to all conditions under the SEBI Act, 1992?" },
      { id: "nse_cp_4", q: "Has the issuer adhered to all rules, regulations, circulars and clarifications under the foregoing statutes?" },
    ],
  },
  {
    category: "Incorporation",
    items: [
      { id: "nse_inc_1", q: "Is the issuer a company incorporated in India under the Companies Act, 1956 or 2013?" },
    ],
  },
  {
    category: "Post-Issue Paid-Up Capital",
    items: [
      { id: "nse_capital_1", q: "Does the post-issue paid-up capital (face value) not exceed Rs. 25 crores?" },
    ],
  },
  {
    category: "Track Record (3 years via one route)",
    items: [
      { id: "nse_tr_1", q: "Is a 3-year track record demonstrated via the applicant company OR its promoters/promoting company OR a sole-prop/partnership later converted?" },
      { id: "nse_tr_2", q: "Do promoters have minimum 3 years of experience in the same line of business?" },
      { id: "nse_tr_3", q: "Do promoters hold at least 20% of post-issue equity share capital (individually or severally)?" },
      { id: "nse_tr_4", q: "If converted from proprietorship/partnership/LLP — do financial statements comply with Schedule III of the Companies Act, 2013? (mark Yes if not applicable)" },
      { id: "nse_tr_5", q: "If converted — are statements certified by an auditor holding a valid ICAI Peer Review Board certificate? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Operational History After Incorporation",
    items: [
      { id: "nse_op_1", q: "Has the issuer completed at least one full financial year of operations after incorporation?" },
      { id: "nse_op_2", q: "Are audited financial statements available for that one full financial year?" },
    ],
  },
  {
    category: "Financial Criteria",
    items: [
      { id: "nse_fin_1", q: "Has the issuer had operating profit (EBIDT) of at least Rs. 1 crore from operations in any 2 of 3 previous FYs?" },
      { id: "nse_fin_2", q: "Is the company's net worth positive?" },
      { id: "nse_fin_3", q: "Has the company had positive Free Cash Flow to Equity (FCFE) for at least 2 of the 3 preceding FYs?" },
    ],
  },
  {
    category: "OFS Restrictions",
    items: [
      { id: "nse_ofs_1", q: "Does the OFS component not exceed 20% of the total issue size?" },
      { id: "nse_ofs_2", q: "Do selling shareholders not sell more than 50% of their pre-issue holding through OFS?" },
    ],
  },
  {
    category: "Outstanding Convertible Securities",
    items: [
      { id: "nse_conv_1", q: "Does the company have NO outstanding convertible securities/rights (other than ESOPs) entitling subscription to equity at the time of filing?" },
    ],
  },
  {
    category: "Promoter Contribution & Lock-in",
    items: [
      { id: "nse_lock_1", q: "Do promoters hold a minimum contribution of 20% of post-issue paid-up capital?" },
      { id: "nse_lock_2", q: "Is the minimum 20% promoter contribution locked-in for 3 years from allotment?" },
      { id: "nse_lock_3", q: "Is excess promoter shareholding locked-in in 2 phases (50% for 1 yr, remaining 50% for 2 yrs) from allotment?" },
      { id: "nse_lock_4", q: "Is all pre-issue non-promoter capital subject to a 6-month lock-in from allotment?" },
    ],
  },
  {
    category: "Underwriting & Market Maker",
    items: [
      { id: "nse_uw_1", q: "Is the issue 100% underwritten?" },
      { id: "nse_uw_2", q: "Does the Merchant Banker underwrite at least 15% of the issue size from their own account?" },
      { id: "nse_mm_1", q: "Is a Market Maker appointed for at least 3 years post-listing per the NSE Emerge Market Maker framework?" },
    ],
  },
  {
    category: "Use of IPO Proceeds",
    items: [
      { id: "nse_use_1", q: "Are proceeds NOT being used (directly/indirectly) for repayment of loans from promoters/promoter group/related parties?" },
      { id: "nse_use_2", q: "Is the GCP earmark within 15% or Rs. 10 crores (whichever is lower) of amount raised?" },
      { id: "nse_use_3", q: "Does GCP + unidentified acquisitions not exceed 25% of amount raised?" },
      { id: "nse_use_4", q: "Has firm financial arrangement been made (verifiable) for at least 75% of means of finance (excluding IPO proceeds & existing internal accruals)?" },
    ],
  },
  {
    category: "Disciplinary Action / Defaults",
    items: [
      { id: "nse_disc_1", q: "Has no nationwide stock exchange taken regulatory action against promoter(s) or companies promoted by them?" },
      { id: "nse_disc_2", q: "Do promoters/directors NOT hold positions of promoter or non-independent director in any compulsorily delisted or suspended company?" },
      { id: "nse_disc_3", q: "Has no director been disqualified or debarred by any regulatory authority?" },
      { id: "nse_disc_4", q: "Have the issuer, promoters, promoter group, directors, selling shareholders NOT been debarred by SEBI from accessing capital markets?" },
      { id: "nse_disc_5", q: "Are the issuer, promoters, directors NOT classified as wilful defaulter / fraudulent borrower / fugitive economic offender?" },
      { id: "nse_disc_6", q: "Are there NO pending defaults in interest/principal to debenture/bond/fixed deposit holders by the company, promoters, promoting cos. and subsidiaries?" },
    ],
  },
  {
    category: "Other Listing Conditions",
    items: [
      { id: "nse_oth_1", q: "Has the company NOT been referred to BIFR (erstwhile)?" },
      { id: "nse_oth_2", q: "Have NO IBC proceedings been admitted against the issuer or its promoting companies?" },
      { id: "nse_oth_3", q: "Is there NO winding-up petition admitted by NCLT or any court?" },
      { id: "nse_oth_4", q: "Has there been NO material regulatory or disciplinary action by any stock exchange / regulatory authority in the past 3 years?" },
      { id: "nse_oth_5", q: "Have NONE of the merchant bankers had an IPO Draft Offer Document returned in the past 6 months from the date of application?" },
    ],
  },
  {
    category: "Functional Website & Demat",
    items: [
      { id: "nse_web_1", q: "Does the company have a functional website?" },
      { id: "nse_demat_1", q: "Is 100% of the promoter's shareholding in dematerialised form?" },
      { id: "nse_demat_2", q: "Has the company entered into agreements with both depositories (NSDL & CDSL) to facilitate trading in demat?" },
    ],
  },
  {
    category: "Promoter Stability & Board",
    items: [
      { id: "nse_pstab_1", q: "Has there been no change in promoters during the one year preceding application?" },
      { id: "nse_pstab_2", q: "If promoter ownership change exceeded 50% — has the 1-year waiting period been observed? (mark Yes if not applicable)" },
      { id: "nse_board_1", q: "Is board composition compliant with the Companies Act, 2013 at the time of in-principle approval?" },
      { id: "nse_nwc_1", q: "Is net worth computed per the SEBI (ICDR) Regulations definition?" },
    ],
  },
  {
    category: "Monitoring Agency & Auditor Certificates",
    items: [
      { id: "nse_mon_1", q: "If issue size exceeds Rs. 50 crores — is a Monitoring Agency appointed? (mark Yes if not applicable)" },
      { id: "nse_aud_1", q: "Has a Statutory Auditor Certificate for fund utilisation been submitted alongside quarterly financial filings?" },
      { id: "nse_aud_2", q: "If working capital as an object exceeds Rs. 5 crores — has the additional auditor certificate been obtained? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "DRHP Public Review & QR Code",
    items: [
      { id: "nse_drhp_1", q: "Will the SME IPO DRHP undergo a 21-day public review?" },
      { id: "nse_drhp_2", q: "Will newspaper advertisements be published within 2 days of filing?" },
      { id: "nse_drhp_3", q: "Will a QR code be provided for seamless investor access?" },
    ],
  },
  {
    category: "Offer Document Disclosure Requirements",
    items: [
      { id: "nse_disc_doc_1", q: "Has any material regulatory/disciplinary action by a stock exchange or regulator in the past year against promoters / promoting cos. / group cos. been disclosed?" },
      { id: "nse_disc_doc_2", q: "Have defaults to debenture/bond/fixed deposit holders, banks or FIs in the past 3 years been disclosed (with auditor certificate to the Exchange)?" },
      { id: "nse_disc_doc_3", q: "Has the litigation record (incl. pending litigation) of the applicant, promoters, group cos. been disclosed?" },
      { id: "nse_disc_doc_4", q: "Has the status of criminal cases / charge-sheets against directors (e.g., serious crimes, economic offences) been disclosed with effect on business?" },
    ],
  },
  {
    category: "Cooling-Off Period",
    items: [
      { id: "nse_cool_1", q: "If applicable — has a minimum 6-month gap from any prior withdrawn/rejected issue been observed? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Investor Participation & Issue Structure",
    items: [
      { id: "nse_inv_1", q: "Will the SME IPO have at least 200 allottees at the time of allotment?" },
      { id: "nse_inv_2", q: "Will the minimum application size be Rs. 2 lakhs+ (a minimum of 2 lots)?" },
      { id: "nse_inv_3", q: "Will the company maintain minimum 25% public shareholding post-issue?" },
    ],
  },
  {
    category: "Special — Technology Startups (skip if not applicable)",
    items: [
      { id: "nse_ts_1", q: "If a technology startup — annual revenue at least Rs. 10 crores? (mark Yes if not applicable)" },
      { id: "nse_ts_2", q: "If a technology startup — annual growth at least 20% in the past year (users / revenue / customer base)? (mark Yes if not applicable)" },
      { id: "nse_ts_3", q: "If a technology startup — net worth positive? (mark Yes if not applicable)" },
      { id: "nse_ts_4", q: "If a technology startup — at least 10% pre-issue capital with QIBs OR with an Angel Network / PE Firm investing in 25+ startups & with aggregate investment > Rs. 50 crores? (mark Yes if not applicable)" },
    ],
  },
  {
    category: "Special — Institutional Trading Platform (skip if not applicable)",
    items: [
      { id: "nse_itp_1", q: "If ITP applicant (Category A — tech/IP-intensive): is at least 25% pre-issue capital held by QIBs as on filing date? (mark Yes if not applicable)" },
      { id: "nse_itp_2", q: "If ITP applicant (Category B — other entities): is at least 50% pre-issue capital held by QIBs as on filing date? (mark Yes if not applicable)" },
      { id: "nse_itp_3", q: "If ITP applicant: do company / promoters / group cos. / directors NOT appear on the RBI/CIBIL Wilful Defaulters List? (mark Yes if not applicable)" },
      { id: "nse_itp_4", q: "If ITP applicant: NO BIFR referral within 5 years prior to listing application? (mark Yes if not applicable)" },
      { id: "nse_itp_5", q: "If ITP applicant: NO regulatory action by SEBI / RBI / IRDAI / MCA against company, promoters, directors in past 5 years? (mark Yes if not applicable)" },
    ],
  },
];

export const ELIGIBILITY_CHECKLISTS = {
  bse: BSE_SME_CHECKLIST,
  nse: NSE_EMERGE_CHECKLIST,
};

export const BOARD_LABELS = {
  bse: "BSE SME",
  nse: "NSE EMERGE",
};
