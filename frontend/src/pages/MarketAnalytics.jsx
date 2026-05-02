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
                  ? "Click Admin → Refresh Data Now to bootstrap 7 years of Indian IPO + anchor data. Takes ~30-60 minutes in the background."
                  : "Your admin needs to run the first data refresh. Once complete, all platform features will light up here."
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile label="Issuers tracked" value={counts.issuers} icon={Building2} hint={`${counts.issuers_main_board} Main · ${counts.issuers_sme} SME`} testid="stat-issuers" />
                <StatTile label="Anchor records" value={counts.anchor_participations} icon={Wallet} testid="stat-participations" />
                <StatTile label="Investors" value={counts.investors} icon={Users} testid="stat-investors" />
                <StatTile label="Fund families" value={counts.fund_families} icon={Database} testid="stat-families" />
              </div>
            )}

            {stats?.is_seeded && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-[#003366] flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5" /> Multi-facet search · coming in P2
                </h3>
                <p className="text-sm text-gray-600">
                  Coverage: {(stats.years_covered || []).join(", ") || "—"}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Phase 2 will unlock filters by industry, city, board (Main/SME), year, BRLM, AUM tier, anchor name, and similar-DRHP search.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* ── FIND ANCHORS ── */}
          <TabsContent value="anchors">
            <Card className="p-12 text-center">
              <Sparkles className="w-8 h-8 mx-auto text-indigo-400 mb-3" />
              <h3 className="text-lg font-bold text-[#003366]">Find Anchors — coming in Phase 2</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                Pick a DRHP from your projects → get a ranked list of likely anchor investors with rationale, prior similar-issue track record and suggested ticket size band.
              </p>
            </Card>
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

export default MarketAnalytics;
