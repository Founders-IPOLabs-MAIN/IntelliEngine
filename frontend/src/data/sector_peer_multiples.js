// Indicative listed-peer EV/EBITDA, EV/Revenue and P/E multiples by sector,
// derived from public NSE/BSE filings & market data. These are MEDIAN listed
// multiples for the sector — the BV Engine applies a 20–25% unlisted discount
// before using them in the Comparable Company method.
//
// Sources: NSE/BSE corporate filings, Screener.in, Tijori, Capitaline summaries
// (compiled and rounded for use as conservative benchmarks).

export const SECTOR_PEER_MULTIPLES = [
  {
    id: "edtech_training",
    label: "EdTech / Training & Maritime Education",
    peers: ["NIIT Ltd", "Aptech Ltd", "Career Point", "Veranda Learning"],
    ev_ebitda: 10.0, ev_revenue: 3.0, pe: 15.0,
  },
  {
    id: "it_services",
    label: "IT Services",
    peers: ["TCS", "Infosys", "Wipro", "HCL Tech", "Tech Mahindra"],
    ev_ebitda: 18.0, ev_revenue: 4.5, pe: 26.0,
  },
  {
    id: "specialty_chemicals",
    label: "Specialty Chemicals",
    peers: ["SRF", "Aarti Industries", "Navin Fluorine", "PI Industries"],
    ev_ebitda: 16.0, ev_revenue: 3.5, pe: 28.0,
  },
  {
    id: "auto_components",
    label: "Auto & Auto Components",
    peers: ["Bosch", "Sundram Fasteners", "Endurance Tech", "Motherson"],
    ev_ebitda: 12.0, ev_revenue: 1.5, pe: 22.0,
  },
  {
    id: "fmcg",
    label: "FMCG",
    peers: ["HUL", "Nestle India", "Britannia", "Marico", "Dabur"],
    ev_ebitda: 28.0, ev_revenue: 5.0, pe: 45.0,
  },
  {
    id: "pharma_healthcare",
    label: "Pharma & Healthcare",
    peers: ["Sun Pharma", "Dr Reddy's", "Cipla", "Lupin", "Apollo Hospitals"],
    ev_ebitda: 18.0, ev_revenue: 3.5, pe: 30.0,
  },
  {
    id: "financial_services",
    label: "Financial Services / NBFC",
    peers: ["Bajaj Finance", "HDFC AMC", "Cholamandalam", "Muthoot"],
    ev_ebitda: 14.0, ev_revenue: 5.0, pe: 22.0,
  },
  {
    id: "real_estate",
    label: "Real Estate / Construction",
    peers: ["DLF", "Godrej Properties", "Oberoi Realty", "Prestige"],
    ev_ebitda: 14.0, ev_revenue: 2.5, pe: 25.0,
  },
  {
    id: "consumer_durables",
    label: "Consumer Durables / Retail",
    peers: ["Titan", "Voltas", "Havells", "Bata", "Trent"],
    ev_ebitda: 22.0, ev_revenue: 3.0, pe: 40.0,
  },
  {
    id: "manufacturing",
    label: "Manufacturing / Industrial Goods",
    peers: ["L&T", "Siemens", "ABB India", "Cummins India"],
    ev_ebitda: 15.0, ev_revenue: 2.0, pe: 28.0,
  },
  {
    id: "logistics",
    label: "Logistics & Supply Chain",
    peers: ["Container Corp", "Blue Dart", "Mahindra Logistics", "TCI Express"],
    ev_ebitda: 12.0, ev_revenue: 1.8, pe: 24.0,
  },
  {
    id: "renewable_energy",
    label: "Renewable Energy / Power",
    peers: ["Tata Power", "Adani Green", "JSW Energy", "Suzlon"],
    ev_ebitda: 14.0, ev_revenue: 4.5, pe: 30.0,
  },
  {
    id: "media_entertainment",
    label: "Media & Entertainment",
    peers: ["Zee Entertainment", "Sun TV", "PVR Inox", "Saregama"],
    ev_ebitda: 11.0, ev_revenue: 2.5, pe: 22.0,
  },
  {
    id: "hospitality",
    label: "Hospitality / Travel",
    peers: ["Indian Hotels", "EIH", "Lemon Tree", "Chalet Hotels"],
    ev_ebitda: 16.0, ev_revenue: 4.0, pe: 35.0,
  },
  {
    id: "agri_foodprocessing",
    label: "Agri & Food Processing",
    peers: ["Tata Consumer", "Adani Wilmar", "Avanti Feeds", "KRBL"],
    ev_ebitda: 14.0, ev_revenue: 1.8, pe: 25.0,
  },
  {
    id: "other",
    label: "Other / General (Diversified)",
    peers: ["Broad NIFTY-500 median"],
    ev_ebitda: 13.0, ev_revenue: 2.5, pe: 22.0,
  },
];

// 20–25% unlisted discount per the valuation tool prompt — we apply 22.5% mid.
export const UNLISTED_DISCOUNT = 0.225;
