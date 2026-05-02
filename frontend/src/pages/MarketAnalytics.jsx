import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, Database, RefreshCw, Loader2, CheckCircle2, AlertCircle,
  Building2, Users, Wallet, Search, Sparkles, Clock, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const MarketAnalytics = ({ user, apiClient }) => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeRun, setActiveRun] = useState(null);
  const [history, setHistory] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    apiClient.get("/market-analytics/me/is-admin")
      .then(r => setIsAdmin(!!r.data?.is_admin))
      .catch(() => setIsAdmin(false));
  }, [apiClient]);

  const refreshStats = useCallback(async () => {
    try {
      const [s, st, h] = await Promise.all([
        apiClient.get("/market-analytics/stats"),
        apiClient.get("/market-analytics/refresh/status"),
        apiClient.get("/market-analytics/refresh/history"),
      ]);
      setStats(s.data);
      setActiveRun(st.data?.active ? st.data.run : null);
      setHistory(h.data?.runs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Poll while a run is active
  useEffect(() => {
    if (!activeRun) return;
    const t = setInterval(refreshStats, 4000);
    return () => clearInterval(t);
  }, [activeRun, refreshStats]);

  const triggerRefresh = async () => {
    try {
      await apiClient.post("/market-analytics/admin/refresh", {
        coverage_years: 7,
        sources: ["chittorgarh", "sebi", "amfi"],
      });
      toast.success("Refresh started — this runs in the background, you can keep using the app.");
      refreshStats();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to start refresh");
    }
  };

  const counts = stats?.counts || {};
  const lastRun = stats?.last_completed_run;

  return (
    <div className="flex min-h-screen bg-white" data-testid="market-analytics-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3 h-3 mr-1" /> Beta
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-[#003366]">Market Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              7 years of Indian IPO &amp; anchor-investor intelligence — refreshed monthly, sourced entirely from public filings.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Powered by SEBI · BSE · NSE · AMFI · Chittorgarh
          </div>
        </div>

        {/* Live job banner */}
        {activeRun && (
          <Card className="mb-6 p-4 bg-indigo-50 border-2 border-indigo-200 flex items-start gap-3" data-testid="ma-active-run">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-indigo-900">
                Refresh in progress · {activeRun.run_id}
              </div>
              <div className="text-xs text-indigo-700 mt-0.5">
                Phase: {activeRun.phases?.[activeRun.phases.length - 1]?.phase || "queued"} ·{" "}
                started {new Date(activeRun.started_at).toLocaleString("en-IN")}
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue={counts.issuers > 0 ? "explore" : "admin"} className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="explore" data-testid="ma-tab-explore">Explore</TabsTrigger>
            <TabsTrigger value="anchors" data-testid="ma-tab-anchors">Find Anchors</TabsTrigger>
            <TabsTrigger value="dashboards" data-testid="ma-tab-dashboards">Dashboards</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin" data-testid="ma-tab-admin">Admin</TabsTrigger>}
          </TabsList>

          {/* ── EXPLORE ── */}
          <TabsContent value="explore" className="space-y-6">
            {statsLoading ? (
              <Card className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></Card>
            ) : !stats?.is_seeded ? (
              <EmptyState
                title="Dataset not seeded yet"
                body={isAdmin
                  ? "Click Admin → Refresh Data Now to bootstrap 7 years of Indian IPO + anchor data."
                  : "Your admin needs to run the first data refresh."
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatTile label="Issuers tracked" value={counts.issuers} icon={Building2} hint={`${counts.issuers_main_board} Main · ${counts.issuers_sme} SME`} testid="stat-issuers" />
                  <StatTile label="Anchor records" value={counts.anchor_participations} icon={Wallet} testid="stat-participations" />
                  <StatTile label="Investors" value={counts.investors} icon={Users} testid="stat-investors" />
                  <StatTile label="Fund families" value={counts.fund_families} icon={Database} testid="stat-families" />
                </div>
                <ExploreSearch apiClient={apiClient} />
              </>
            )}
          </TabsContent>

          {/* ── FIND ANCHORS ── */}
          <TabsContent value="anchors">
            {!stats?.is_seeded ? (
              <EmptyState title="Dataset not seeded yet" body="Refresh data first to use this feature." />
            ) : (
              <FindAnchorsPanel apiClient={apiClient} />
            )}
          </TabsContent>

          {/* ── DASHBOARDS ── */}
          <TabsContent value="dashboards">
            <Card className="p-12 text-center">
              <BarChart3 className="w-8 h-8 mx-auto text-indigo-400 mb-3" />
              <h3 className="text-lg font-bold text-[#003366]">Dashboards — coming in Phase 3</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
                Top investors by deal count · Sector heatmap (industry × year) · City leaderboard · Yearly trends · QIB subscription patterns. All powered by Recharts on top of the live Mongo dataset.
              </p>
            </Card>
          </TabsContent>

          {/* ── ADMIN ── */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold text-[#003366] mb-1">Data Refresh Controls</h3>
                <p className="text-sm text-gray-600 mb-5">
                  Triggers the offline scrape pipeline inside this container. Runs all four sources in sequence; 30–60 minutes for a 7-year cold start, ~5 min for monthly incremental.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <Button
                    onClick={triggerRefresh}
                    disabled={!!activeRun}
                    className="bg-[#003366] hover:bg-[#002244] text-white"
                    data-testid="ma-trigger-refresh"
                  >
                    {activeRun ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running…</> : <><RefreshCw className="w-4 h-4 mr-2" /> Refresh Data Now</>}
                  </Button>
                  {lastRun && !activeRun && (
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Last completed: {new Date(lastRun.finished_at).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </Card>

              {/* Active run phase log */}
              {activeRun && (
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-[#003366] mb-3">Live phase log</h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {(activeRun.phases || []).slice().reverse().map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs border-l-2 border-indigo-300 pl-3">
                        <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{p.phase} <span className="text-gray-400">· {p.status}</span></div>
                          <div className="text-gray-500">{new Date(p.ts).toLocaleTimeString("en-IN")}</div>
                          {p.detail && Object.keys(p.detail).length > 0 && (
                            <pre className="text-[10px] bg-gray-50 rounded p-1.5 mt-1 overflow-x-auto">{JSON.stringify(p.detail, null, 2)}</pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* History */}
              <Card className="p-6">
                <h3 className="text-sm font-bold text-[#003366] mb-3">Refresh history</h3>
                {history.length === 0 ? (
                  <p className="text-xs text-gray-500">No runs yet.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((r) => (
                      <div key={r.run_id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50/60" data-testid={`ma-history-${r.run_id}`}>
                        {r.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : r.status === "failed" ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        )}
                        <div className="flex-1 text-xs">
                          <div className="font-medium text-gray-800">{r.run_id}</div>
                          <div className="text-gray-500">
                            {new Date(r.started_at).toLocaleString("en-IN")}
                            {r.finished_at && ` → ${new Date(r.finished_at).toLocaleTimeString("en-IN")}`}
                            {r.stats?.issuers ? ` · ${r.stats.issuers} issuers, ${r.stats.anchor_participations} participations` : ""}
                          </div>
                        </div>
                        <Badge className={
                          r.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : r.status === "failed" ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }>{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>
        </div>
      </main>
    </div>
  );
};

const StatTile = ({ label, value, icon: Icon, hint, testid }) => (
  <Card className="p-5 bg-white" data-testid={testid}>
    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2">
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
    <div className="text-3xl font-bold text-[#003366]">{(value ?? 0).toLocaleString("en-IN")}</div>
    {hint && <div className="text-[11px] text-gray-500 mt-1">{hint}</div>}
  </Card>
);

const EmptyState = ({ title, body }) => (
  <Card className="p-12 text-center bg-white">
    <Database className="w-10 h-10 mx-auto text-gray-300 mb-3" />
    <h3 className="text-lg font-bold text-[#003366]">{title}</h3>
    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">{body}</p>
  </Card>
);


// ════════════════════════════════════════════════════════════════
// EXPLORE — multi-facet search UI
// ════════════════════════════════════════════════════════════════
const ExploreSearch = ({ apiClient }) => {
  const [facets, setFacets] = useState(null);
  const [filters, setFilters] = useState({ q: "", industries: [], cities: [], boards: [], fys: [] });
  const [results, setResults] = useState({ total: 0, results: [], page: 1, page_size: 25 });
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("filing_date");
  const [sortDir, setSortDir] = useState(-1);

  useEffect(() => {
    apiClient.get("/market-analytics/facets").then((r) => setFacets(r.data));
  }, [apiClient]);

  const runSearch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const r = await apiClient.post("/market-analytics/search", {
        ...filters, sort_by: sortBy, sort_dir: sortDir, page, page_size: 25,
      });
      setResults(r.data);
    } finally { setLoading(false); }
  }, [apiClient, filters, sortBy, sortDir]);

  useEffect(() => { runSearch(1); }, [runSearch]);

  const toggleArr = (key, val) => setFilters(f => ({
    ...f,
    [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
  }));

  const totalPages = Math.max(1, Math.ceil(results.total / results.page_size));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5" data-testid="explore-search">
      {/* Filters */}
      <Card className="p-5 self-start sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-[#003366]" />
          <h3 className="text-sm font-bold text-[#003366]">Filters</h3>
        </div>
        <input
          type="text"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="Search issuer name…"
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
          data-testid="search-q"
        />

        <FilterGroup label="Board" options={(facets?.boards || []).map(b => [b, b.toUpperCase()])} selected={filters.boards} onToggle={(v) => toggleArr("boards", v)} testid="filter-board" />
        <FilterGroup label="Industry" options={(facets?.industries || []).map(i => [i, i])} selected={filters.industries} onToggle={(v) => toggleArr("industries", v)} testid="filter-industry" max={8} />
        <FilterGroup label="Financial Year" options={(facets?.fys || []).map(f => [f, f])} selected={filters.fys} onToggle={(v) => toggleArr("fys", v)} testid="filter-fy" />
        <FilterGroup label="City" options={(facets?.cities || []).map(c => [c, c])} selected={filters.cities} onToggle={(v) => toggleArr("cities", v)} testid="filter-city" max={6} />

        {(filters.industries.length || filters.cities.length || filters.boards.length || filters.fys.length || filters.q) ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters({ q: "", industries: [], cities: [], boards: [], fys: [] })}
            className="w-full mt-2 text-xs"
            data-testid="clear-filters"
          >
            Clear all filters
          </Button>
        ) : null}
      </Card>

      {/* Results */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{results.total.toLocaleString("en-IN")}</span> issuers found
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded px-2 py-1 text-xs" data-testid="sort-by">
              <option value="filing_date">Date</option>
              <option value="issue_size_cr">Issue Size</option>
              <option value="name">Name</option>
            </select>
            <button onClick={() => setSortDir(d => -d)} className="border rounded px-2 py-1 text-xs hover:bg-white" data-testid="sort-dir">
              {sortDir === -1 ? "↓ Desc" : "↑ Asc"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : results.results.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No issuers match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="results-table">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2.5">Issuer</th>
                  <th className="text-left px-4 py-2.5">Board</th>
                  <th className="text-left px-4 py-2.5">Industry</th>
                  <th className="text-left px-4 py-2.5">FY</th>
                  <th className="text-left px-4 py-2.5">City</th>
                  <th className="text-right px-4 py-2.5">Size (₹ Cr)</th>
                </tr>
              </thead>
              <tbody>
                {results.results.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-indigo-50/40 transition-colors" data-testid={`row-${i}`}>
                    <td className="px-4 py-2.5 font-medium text-[#003366]">{r.name}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={r.board === "main" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"}>
                        {(r.board || "—").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{r.industry || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.fy || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.city || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-800">{r.issue_size_cr ? r.issue_size_cr.toLocaleString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {results.total > results.page_size && (
          <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between text-xs">
            <div className="text-gray-500">Page {results.page} of {totalPages}</div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" disabled={results.page <= 1} onClick={() => runSearch(results.page - 1)} data-testid="page-prev">Prev</Button>
              <Button size="sm" variant="outline" disabled={results.page >= totalPages} onClick={() => runSearch(results.page + 1)} data-testid="page-next">Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const FilterGroup = ({ label, options, selected, onToggle, testid, max }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = max && !expanded ? options.slice(0, max) : options;
  return (
    <div className="mb-4" data-testid={testid}>
      <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">{label}</div>
      <div className="space-y-1">
        {visible.map(([val, lbl]) => (
          <label key={val} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 rounded px-1.5 py-1">
            <input type="checkbox" checked={selected.includes(val)} onChange={() => onToggle(val)} className="rounded" />
            <span className="text-gray-700">{lbl}</span>
          </label>
        ))}
      </div>
      {max && options.length > max && (
        <button onClick={() => setExpanded(e => !e)} className="text-[11px] text-indigo-600 hover:text-indigo-800 mt-1.5 font-medium">
          {expanded ? "Show less" : `+${options.length - max} more`}
        </button>
      )}
    </div>
  );
};


// ════════════════════════════════════════════════════════════════
// FIND ANCHORS — ranked anchor recommendations
// ════════════════════════════════════════════════════════════════
const FindAnchorsPanel = ({ apiClient }) => {
  const [facets, setFacets] = useState(null);
  const [issuerQuery, setIssuerQuery] = useState("");
  const [issuerOptions, setIssuerOptions] = useState([]);
  const [selectedIssuer, setSelectedIssuer] = useState(null);
  const [manualIndustry, setManualIndustry] = useState("");
  const [manualSize, setManualSize] = useState("");
  const [manualBoard, setManualBoard] = useState("main");
  const [similar, setSimilar] = useState(null);
  const [anchors, setAnchors] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get("/market-analytics/facets").then(r => setFacets(r.data));
  }, [apiClient]);

  // Type-ahead issuer search
  useEffect(() => {
    if (!issuerQuery || issuerQuery.length < 2) { setIssuerOptions([]); return; }
    const t = setTimeout(async () => {
      const r = await apiClient.post("/market-analytics/search", { q: issuerQuery, page: 1, page_size: 8 });
      setIssuerOptions(r.data.results || []);
    }, 250);
    return () => clearTimeout(t);
  }, [issuerQuery, apiClient]);

  const runRecommendation = async () => {
    setLoading(true);
    try {
      const payload = selectedIssuer
        ? { issuer_name: selectedIssuer.name, limit: 25 }
        : { industry: manualIndustry || "Other", issue_size_cr: parseFloat(manualSize) || 0, board: manualBoard, limit: 25 };
      const [s, a] = await Promise.all([
        selectedIssuer ? apiClient.post("/market-analytics/find-similar", { issuer_name: selectedIssuer.name, limit: 8 }) : Promise.resolve({ data: null }),
        apiClient.post("/market-analytics/find-anchors", payload),
      ]);
      setSimilar(s.data);
      setAnchors(a.data);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5" data-testid="find-anchors-panel">
      {/* Picker */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-[#003366] mb-3">Pick your DRHP target</h3>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-start">
          <div className="relative">
            <label className="text-xs text-gray-500 block mb-1">Search issuer (or use manual fields)</label>
            <input
              value={selectedIssuer ? selectedIssuer.name : issuerQuery}
              onChange={e => { setIssuerQuery(e.target.value); setSelectedIssuer(null); }}
              placeholder="e.g. Mamaearth, Zomato, Nykaa…"
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
              data-testid="issuer-search"
            />
            {issuerOptions.length > 0 && !selectedIssuer && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-72 overflow-y-auto">
                {issuerOptions.map((i, k) => (
                  <button
                    key={k}
                    onClick={() => { setSelectedIssuer(i); setIssuerQuery(""); setIssuerOptions([]); }}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm border-b last:border-0"
                    data-testid={`issuer-opt-${k}`}
                  >
                    <div className="font-medium text-[#003366]">{i.name}</div>
                    <div className="text-xs text-gray-500">{i.industry} · {i.fy} · {i.board?.toUpperCase()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Industry</label>
            <select value={manualIndustry} onChange={e => setManualIndustry(e.target.value)} className="w-full text-sm border rounded-md px-2 py-2 bg-white" data-testid="manual-industry">
              <option value="">(auto)</option>
              {(facets?.industries || []).map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Size (₹ Cr)</label>
            <input type="number" value={manualSize} onChange={e => setManualSize(e.target.value)} placeholder="e.g. 1500" className="w-full text-sm border rounded-md px-2 py-2" data-testid="manual-size" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Board</label>
            <select value={manualBoard} onChange={e => setManualBoard(e.target.value)} className="w-full text-sm border rounded-md px-2 py-2 bg-white" data-testid="manual-board">
              <option value="main">Main</option><option value="sme">SME</option>
            </select>
          </div>
          <div className="self-end">
            <Button onClick={runRecommendation} disabled={loading} className="bg-[#003366] hover:bg-[#002244] text-white" data-testid="run-find-anchors">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Find Anchors
            </Button>
          </div>
        </div>
        {selectedIssuer && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1.5">
            <span className="font-semibold text-indigo-900">Selected:</span>
            <span className="text-indigo-700">{selectedIssuer.name} · {selectedIssuer.industry} · {selectedIssuer.fy}</span>
            <button onClick={() => setSelectedIssuer(null)} className="text-indigo-600 hover:text-indigo-900">×</button>
          </div>
        )}
      </Card>

      {anchors && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          {/* Anchor recommendations */}
          <Card className="p-0 overflow-hidden" data-testid="anchor-results">
            <div className="px-5 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#003366]">Top {anchors.anchors?.length || 0} likely anchors</div>
                <div className="text-[11px] text-gray-600 mt-0.5">
                  Mode: <Badge className={anchors.mode === "empirical" ? "bg-emerald-100 text-emerald-800 ml-1" : "bg-amber-100 text-amber-800 ml-1"}>{anchors.mode}</Badge>
                  · Industry: {anchors.matched_on?.industry} · Board: {anchors.matched_on?.board?.toUpperCase()}
                </div>
              </div>
            </div>
            {anchors.note && (
              <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900">{anchors.note}</div>
            )}
            <div className="divide-y">
              {(anchors.anchors || []).map((a, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-4 hover:bg-gray-50/60" data-testid={`anchor-${i}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[#003366] text-sm">{a.investor}</span>
                      {a.aum_tier && a.aum_tier !== "Unknown" && (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px]">{a.aum_tier}</Badge>
                      )}
                      {a.investor_type && (
                        <Badge className="bg-gray-50 text-gray-700 border border-gray-200 text-[9px]">{a.investor_type}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed">{a.rationale}</div>
                    {a.issuers_backed?.length > 0 && (
                      <div className="text-[10px] text-gray-500 mt-1">Prior: {a.issuers_backed.slice(0, 4).join(" · ")}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-indigo-700">{Math.round(a.score * 10) / 10}</div>
                    <div className="text-[9px] uppercase tracking-wider text-gray-400">score</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Similar issuers panel */}
          <Card className="p-5" data-testid="similar-issuers">
            <h3 className="text-sm font-bold text-[#003366] mb-3">Similar issuers</h3>
            {!similar?.similar?.length ? (
              <p className="text-xs text-gray-500">Pick an existing issuer to see comparable IPOs.</p>
            ) : (
              <div className="space-y-2">
                {similar.similar.map((s, i) => (
                  <div key={i} className="border rounded-lg p-3 text-xs" data-testid={`similar-${i}`}>
                    <div className="font-semibold text-[#003366]">{s.name}</div>
                    <div className="text-gray-600 mt-0.5">{s.industry} · {s.fy} · {s.city || "—"}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-gray-500">{s.issue_size_cr ? `₹${s.issue_size_cr.toLocaleString("en-IN")} Cr` : "—"}</span>
                      <span className="text-indigo-600 font-semibold">{s.match_score}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketAnalytics;
