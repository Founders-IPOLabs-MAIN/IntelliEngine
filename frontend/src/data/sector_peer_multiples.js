// Indicative listed-peer EV/EBITDA, EV/Revenue and P/E multiples by sector,
// derived from public NSE/BSE filings & market data. Each sector now exposes
// its peer composition explicitly so the Comparable Company method shows the
// 3 Large Cap + 1 Mid Cap + Broad NIFTY-500 sector-median construction the
// user requested.
//
// Sources: NSE/BSE corporate filings, Screener.in, Tijori, Capitaline summaries
// (compiled and rounded for use as conservative benchmarks).

export const SECTOR_PEER_MULTIPLES = [
  {
    id: "edtech_training",
    label: "EdTech / Training & Maritime Education",
    large_caps: ["NIIT Ltd", "Aptech Ltd", "Veranda Learning"],
    mid_caps: ["Career Point"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Education)",
    ev_ebitda: 10.0, ev_revenue: 3.0, pe: 15.0,
  },
  {
    id: "it_services",
    label: "IT Services",
    large_caps: ["TCS", "Infosys", "HCL Tech"],
    mid_caps: ["Mphasis"],
    nifty500_median_label: "Broad NIFTY-500 sector median (IT)",
    ev_ebitda: 18.0, ev_revenue: 4.5, pe: 26.0,
  },
  {
    id: "specialty_chemicals",
    label: "Specialty Chemicals",
    large_caps: ["SRF", "PI Industries", "Aarti Industries"],
    mid_caps: ["Navin Fluorine"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Chemicals)",
    ev_ebitda: 16.0, ev_revenue: 3.5, pe: 28.0,
  },
  {
    id: "auto_components",
    label: "Auto & Auto Components",
    large_caps: ["Bosch", "Motherson", "Sundram Fasteners"],
    mid_caps: ["Endurance Tech"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Auto Components)",
    ev_ebitda: 12.0, ev_revenue: 1.5, pe: 22.0,
  },
  {
    id: "fmcg",
    label: "FMCG",
    large_caps: ["HUL", "Nestle India", "Britannia"],
    mid_caps: ["Marico"],
    nifty500_median_label: "Broad NIFTY-500 sector median (FMCG)",
    ev_ebitda: 28.0, ev_revenue: 5.0, pe: 45.0,
  },
  {
    id: "pharma_healthcare",
    label: "Pharma & Healthcare",
    large_caps: ["Sun Pharma", "Dr Reddy's", "Cipla"],
    mid_caps: ["Apollo Hospitals"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Pharma & Healthcare)",
    ev_ebitda: 18.0, ev_revenue: 3.5, pe: 30.0,
  },
  {
    id: "financial_services",
    label: "Financial Services / NBFC",
    large_caps: ["Bajaj Finance", "HDFC AMC", "Cholamandalam"],
    mid_caps: ["Muthoot Finance"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Financial Services)",
    ev_ebitda: 14.0, ev_revenue: 5.0, pe: 22.0,
  },
  {
    id: "real_estate",
    label: "Real Estate / Construction",
    large_caps: ["DLF", "Godrej Properties", "Oberoi Realty"],
    mid_caps: ["Prestige Estates"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Realty)",
    ev_ebitda: 14.0, ev_revenue: 2.5, pe: 25.0,
  },
  {
    id: "consumer_durables",
    label: "Consumer Durables / Retail",
    large_caps: ["Titan", "Havells", "Trent"],
    mid_caps: ["Voltas"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Consumer Durables)",
    ev_ebitda: 22.0, ev_revenue: 3.0, pe: 40.0,
  },
  {
    id: "manufacturing",
    label: "Manufacturing / Industrial Goods",
    large_caps: ["L&T", "Siemens", "ABB India"],
    mid_caps: ["Cummins India"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Capital Goods)",
    ev_ebitda: 15.0, ev_revenue: 2.0, pe: 28.0,
  },
  {
    id: "logistics",
    label: "Logistics & Supply Chain",
    large_caps: ["Container Corp", "Blue Dart", "Mahindra Logistics"],
    mid_caps: ["TCI Express"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Logistics)",
    ev_ebitda: 12.0, ev_revenue: 1.8, pe: 24.0,
  },
  {
    id: "renewable_energy",
    label: "Renewable Energy / Power",
    large_caps: ["Tata Power", "Adani Green", "JSW Energy"],
    mid_caps: ["Suzlon Energy"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Power)",
    ev_ebitda: 14.0, ev_revenue: 4.5, pe: 30.0,
  },
  {
    id: "media_entertainment",
    label: "Media & Entertainment",
    large_caps: ["Zee Entertainment", "Sun TV", "PVR Inox"],
    mid_caps: ["Saregama"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Media)",
    ev_ebitda: 11.0, ev_revenue: 2.5, pe: 22.0,
  },
  {
    id: "hospitality",
    label: "Hospitality / Travel",
    large_caps: ["Indian Hotels", "EIH", "Chalet Hotels"],
    mid_caps: ["Lemon Tree Hotels"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Hospitality)",
    ev_ebitda: 16.0, ev_revenue: 4.0, pe: 35.0,
  },
  {
    id: "agri_foodprocessing",
    label: "Agri & Food Processing",
    large_caps: ["Tata Consumer", "Adani Wilmar", "KRBL"],
    mid_caps: ["Avanti Feeds"],
    nifty500_median_label: "Broad NIFTY-500 sector median (Agri & Food)",
    ev_ebitda: 14.0, ev_revenue: 1.8, pe: 25.0,
  },
  {
    id: "other",
    label: "Other / General (Diversified)",
    large_caps: ["NIFTY-50 large-cap basket"],
    mid_caps: ["NIFTY MidCap-100 basket"],
    nifty500_median_label: "Broad NIFTY-500 median",
    ev_ebitda: 13.0, ev_revenue: 2.5, pe: 22.0,
  },
];

// 20–25% unlisted discount per the valuation tool prompt — we apply 22.5% mid.
export const UNLISTED_DISCOUNT = 0.225;

// Convenience accessor — returns a flat array of every peer the engine uses
// for a given sector ("3 Large Cap + 1 Mid Cap + NIFTY-500 median" composition).
export function buildPeerSet(sector_id) {
  const s = SECTOR_PEER_MULTIPLES.find((x) => x.id === sector_id);
  if (!s) return [];
  return [
    ...(s.large_caps || []).map((n) => ({ name: n, segment: "Large Cap" })),
    ...(s.mid_caps || []).map((n) => ({ name: n, segment: "Mid Cap" })),
    { name: s.nifty500_median_label || "Broad NIFTY-500 median", segment: "Sector Median" },
  ];
}
