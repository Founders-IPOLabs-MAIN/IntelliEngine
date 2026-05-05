import { useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, AlertTriangle, Download, FileText, Building2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ELIGIBILITY_CHECKLISTS, BOARD_LABELS } from "@/data/sme_eligibility_checklists";
import jsPDF from "jspdf";

// Treat unanswered or "no" as failing per spec (#4: items left out / no selection = NO)
const isPass = (val) => val === "yes";

const computeAnalysis = (checklist, answers) => {
  const all = checklist.flatMap((sec) => sec.items.map((it) => ({ ...it, category: sec.category })));
  const total = all.length;
  const passed = all.filter((it) => isPass(answers[it.id])).length;
  const failed = all.filter((it) => !isPass(answers[it.id]));
  const score = total ? Math.round((passed / total) * 100) : 0;
  let band = "Not Ready";
  let bandColor = "text-rose-300";
  let bandHint = "Material gaps remain. Address the to-do list before initiating filings.";
  if (score >= 90) { band = "Filing-Ready"; bandColor = "text-emerald-300"; bandHint = "Almost there. Verify the few remaining items with your merchant banker."; }
  else if (score >= 75) { band = "Substantially Ready"; bandColor = "text-lime-300"; bandHint = "Strong position. Close the open items and you're set."; }
  else if (score >= 50) { band = "Partially Ready"; bandColor = "text-amber-300"; bandHint = "Significant work needed across multiple areas."; }
  return { total, passed, failed, score, band, bandColor, bandHint };
};

const COMPANY_INFO = {
  name: "IPO Labs AI Pvt Ltd",
  email: "founders@ipo-labs.com",
  mobile: "+91 9967816957",
  logoPath: "/setu-logo.png",
};

const BOARD_NUMBERS = {
  bse: { headline: "Post-issue paid-up capital ≤ Rs. 25 cr  •  Net worth ≥ Rs. 1 cr (2 yrs)  •  NTA ≥ Rs. 3 cr  •  EBIDT ≥ Rs. 1 cr (2 of 3 FY)" },
  nse: { headline: "Post-issue paid-up capital ≤ Rs. 25 cr  •  Operating profit ≥ Rs. 1 cr (2 of 3 FY)  •  Positive net worth & FCFE  •  3-yr track record" },
};

const SMESelfAssessment = ({ user, apiClient }) => {
  const [board, setBoard] = useState("bse");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [reportDate] = useState(new Date());

  const checklist = ELIGIBILITY_CHECKLISTS[board];
  const analysis = useMemo(() => computeAnalysis(checklist, answers), [checklist, answers]);

  const setAnswer = (id, val) => {
    setAnswers((p) => ({ ...p, [id]: val }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      const el = document.getElementById("sme-analysis-block");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  // ───────── PDF generation ────────────────────────────────────────────────
  const loadLogoDataUrl = async () => {
    try {
      const res = await fetch(COMPANY_INFO.logoPath);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result);
        r.onerror = () => resolve(null);
        r.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    if (!submitted) {
      toast.error("Please click 'Submit Assessment' first.");
      return;
    }
    try {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 40;
      let y = margin;

      // ── HEADER (logo + company info on every page top) ───────────────────
      const logoData = await loadLogoDataUrl();
      const drawHeader = () => {
        if (logoData) {
          try { pdf.addImage(logoData, "PNG", margin, margin - 10, 70, 36); } catch {}
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.setTextColor(20, 20, 20);
        pdf.text(COMPANY_INFO.name, pageW - margin, margin + 4, { align: "right" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Email: ${COMPANY_INFO.email}`, pageW - margin, margin + 18, { align: "right" });
        pdf.text(`Mobile: ${COMPANY_INFO.mobile}`, pageW - margin, margin + 30, { align: "right" });
        // Header divider
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, margin + 42, pageW - margin, margin + 42);
      };
      const ensureSpace = (need) => {
        if (y + need > pageH - margin) {
          pdf.addPage();
          y = margin;
          drawHeader();
          y = margin + 56;
        }
      };

      drawHeader();
      y = margin + 56;

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(15, 15, 15);
      pdf.text(`${BOARD_LABELS[board]} SME IPO — Eligibility Self Assessment`, margin, y);
      y += 18;

      // Sub line
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(90, 90, 90);
      const subParts = [
        companyName ? `Company: ${companyName}` : null,
        `Date: ${reportDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
        user?.email ? `Reviewed by: ${user.email}` : null,
      ].filter(Boolean);
      pdf.text(subParts.join("   |   "), margin, y);
      y += 22;

      // Score box
      const boxH = 60;
      pdf.setFillColor(244, 246, 251);
      pdf.setDrawColor(220, 226, 236);
      pdf.roundedRect(margin, y, pageW - margin * 2, boxH, 6, 6, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(28);
      pdf.setTextColor(20, 20, 20);
      pdf.text(`${analysis.score}%`, margin + 16, y + 38);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(analysis.band, margin + 90, y + 26);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      const passedLine = `Passed: ${analysis.passed} of ${analysis.total}    |    Open Items: ${analysis.failed.length}`;
      pdf.text(passedLine, margin + 90, y + 42);
      y += boxH + 18;

      // Summary line
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(10);
      pdf.setTextColor(70, 70, 70);
      const hint = pdf.splitTextToSize(analysis.bandHint, pageW - margin * 2);
      pdf.text(hint, margin, y);
      y += hint.length * 12 + 14;

      // To-Do checklist heading
      ensureSpace(40);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 15, 15);
      pdf.text(`To-Do Checklist (${analysis.failed.length} open items)`, margin, y);
      y += 14;
      pdf.setDrawColor(230, 230, 230);
      pdf.line(margin, y, pageW - margin, y);
      y += 12;

      if (analysis.failed.length === 0) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(50, 120, 50);
        pdf.text("All checkpoints satisfied. No open items.", margin, y);
        y += 16;
      } else {
        // Group failed by category
        const grouped = {};
        analysis.failed.forEach((it) => {
          if (!grouped[it.category]) grouped[it.category] = [];
          grouped[it.category].push(it);
        });
        let idx = 1;
        Object.entries(grouped).forEach(([cat, items]) => {
          ensureSpace(24);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10.5);
          pdf.setTextColor(30, 30, 60);
          pdf.text(cat, margin, y);
          y += 14;
          items.forEach((it) => {
            const text = `${idx}. ${it.q}`;
            const lines = pdf.splitTextToSize(text, pageW - margin * 2 - 12);
            ensureSpace(lines.length * 12 + 4);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9.5);
            pdf.setTextColor(50, 50, 50);
            // bullet square
            pdf.setDrawColor(180, 30, 30);
            pdf.setFillColor(255, 240, 240);
            pdf.rect(margin, y - 8, 8, 8, "FD");
            pdf.text(lines, margin + 14, y);
            y += lines.length * 12 + 4;
            idx += 1;
          });
          y += 4;
        });
      }

      // Full responses appendix
      y += 10;
      ensureSpace(30);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 15, 15);
      pdf.text("Full Response Log", margin, y);
      y += 14;
      pdf.setDrawColor(230, 230, 230);
      pdf.line(margin, y, pageW - margin, y);
      y += 10;

      checklist.forEach((sec) => {
        ensureSpace(20);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(30, 30, 60);
        pdf.text(sec.category, margin, y);
        y += 12;
        sec.items.forEach((it) => {
          const ans = isPass(answers[it.id]) ? "YES" : "NO";
          const color = ans === "YES" ? [40, 130, 70] : [180, 30, 30];
          const lines = pdf.splitTextToSize(it.q, pageW - margin * 2 - 40);
          ensureSpace(lines.length * 12 + 4);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          pdf.text(lines, margin + 4, y);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...color);
          pdf.text(ans, pageW - margin, y, { align: "right" });
          y += lines.length * 12 + 4;
        });
        y += 4;
      });

      // Footer disclaimer on last page
      ensureSpace(50);
      y = Math.max(y + 10, pageH - margin - 36);
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, y, pageW - margin, y);
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.setTextColor(110, 110, 110);
      const disc = "Disclaimer: This self-assessment is a preliminary indicative check based on the published BSE SME / NSE EMERGE criteria. It is not a substitute for professional legal, financial or merchant-banker advice. IPO Labs AI Pvt Ltd disclaims any liability arising from reliance on this report.";
      const dLines = pdf.splitTextToSize(disc, pageW - margin * 2);
      pdf.text(dLines, margin, y + 14);

      const fileName = `SME-Self-Assessment_${BOARD_LABELS[board].replace(/\s/g, "-")}_${reportDate.toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      toast.success("PDF downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF. Please retry.");
    }
  };

  // ───────── UI ────────────────────────────────────────────────────────────
  const renderChecklist = (board_key) => (
    <div className="space-y-4" data-testid={`sme-checklist-${board_key}`}>
      {ELIGIBILITY_CHECKLISTS[board_key].map((sec) => (
        <Card
          key={`${board_key}-${sec.category}`}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/10"
        >
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-white mb-4 tracking-tight">
              {sec.category}
            </h3>
            <div className="divide-y divide-white/5">
              {sec.items.map((it) => {
                const val = answers[it.id];
                return (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-4 py-3"
                    data-testid={`sme-q-${it.id}`}
                  >
                    <p className="text-[13px] text-white/80 leading-relaxed flex-1">
                      {it.q}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[
                        { key: "yes", label: "Yes", color: "emerald" },
                        { key: "no", label: "No", color: "rose" },
                      ].map((o) => {
                        const active = val === o.key;
                        return (
                          <button
                            key={o.key}
                            type="button"
                            onClick={() => setAnswer(it.id, o.key)}
                            className={[
                              "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                              active
                                ? o.key === "yes"
                                  ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                                  : "bg-rose-500/20 border-rose-400/50 text-rose-200"
                                : "bg-white/[0.03] border-white/10 text-white/55 hover:border-white/25 hover:text-white/80",
                            ].join(" ")}
                            data-testid={`sme-ans-${it.id}-${o.key}`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black" data-testid="sme-self-assessment-page">
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64 relative">
        {/* dark mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#111] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 25% 20%, rgba(99,102,241,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(34,211,238,0.3), transparent 45%)",
          }}
        />

        <div className="relative z-10 px-8 lg:px-12 py-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] tracking-[0.18em] uppercase text-white/55 mb-3">
                <Sparkles className="w-3 h-3 text-violet-300" />
                Self Assessment
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                BSE/NSE SME - Self Assessment
              </h1>
              <p className="text-sm text-white/55 mt-2 max-w-2xl">
                Tick Yes / No against every checkpoint sourced from the official
                exchange criteria. Items left blank are treated as <strong className="text-rose-300/80">No</strong>.
              </p>
            </div>
            <Building2 className="w-10 h-10 text-violet-400/60 hidden lg:block" />
          </div>

          {/* Company name capture */}
          <div className="mb-5 flex items-center gap-3">
            <label className="text-xs text-white/60 shrink-0">Company name (for the report):</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Acme Industries Pvt Ltd"
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              data-testid="sme-company-name"
            />
          </div>

          {/* Toggle — BSE / NSE */}
          <Tabs
            value={board}
            onValueChange={(v) => { setBoard(v); setSubmitted(false); }}
            className="w-full"
          >
            <TabsList
              className="bg-white/[0.04] border border-white/10 p-1 rounded-full mb-3"
              data-testid="sme-board-toggle"
            >
              <TabsTrigger
                value="bse"
                className="rounded-full px-5 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-black text-white/60"
                data-testid="sme-tab-bse"
              >
                BSE SME
              </TabsTrigger>
              <TabsTrigger
                value="nse"
                className="rounded-full px-5 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-black text-white/60"
                data-testid="sme-tab-nse"
              >
                NSE EMERGE
              </TabsTrigger>
            </TabsList>

            <p className="text-[11px] text-white/45 mb-5 italic">
              {BOARD_NUMBERS[board].headline}
            </p>

            <TabsContent value="bse" className="mt-0">
              {renderChecklist("bse")}
            </TabsContent>
            <TabsContent value="nse" className="mt-0">
              {renderChecklist("nse")}
            </TabsContent>
          </Tabs>

          {/* Sticky Action Row */}
          <div className="sticky bottom-4 z-20 mt-8 mb-2">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
              <div className="text-xs text-white/60">
                {analysis.passed} of {analysis.total} checkpoints answered{" "}
                <span className="text-emerald-300">Yes</span>{" "}
                {analysis.failed.length > 0 && (
                  <span className="ml-1 text-rose-300/80">
                    · {analysis.failed.length} open
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="bg-transparent border-white/15 text-white/70 hover:bg-white/5 rounded-full px-5 h-9 text-xs"
                  data-testid="sme-reset-btn"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white rounded-full px-6 h-9 text-xs font-medium"
                  data-testid="sme-submit-btn"
                >
                  Submit Assessment
                </Button>
                <Button
                  onClick={handleDownloadPdf}
                  className="bg-white text-black hover:bg-white/90 rounded-full px-6 h-9 text-xs font-medium gap-1.5"
                  data-testid="sme-download-pdf-btn"
                >
                  <Download className="w-3.5 h-3.5" /> Save PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Analysis block */}
          {submitted && (
            <div id="sme-analysis-block" className="mt-8 space-y-5" data-testid="sme-analysis-block">
              {/* Score Card */}
              <Card className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/15">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="text-5xl font-bold text-white tracking-tight">
                      {analysis.score}
                      <span className="text-2xl text-white/40">%</span>
                    </div>
                    <div className={`text-sm font-semibold mt-1 ${analysis.bandColor}`}>
                      {analysis.band}
                    </div>
                  </div>
                  <div className="h-14 w-px bg-white/10" />
                  <div className="flex-1">
                    <p className="text-sm text-white/75 mb-1">{analysis.bandHint}</p>
                    <div className="text-xs text-white/55">
                      {analysis.passed}/{analysis.total} checkpoints passed against{" "}
                      <strong className="text-white/75">{BOARD_LABELS[board]}</strong> criteria.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* To-Do list */}
              <Card className="bg-white/[0.04] backdrop-blur-xl border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    {analysis.failed.length === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      To-Do Checklist ({analysis.failed.length} open item{analysis.failed.length !== 1 ? "s" : ""})
                    </h3>
                  </div>

                  {analysis.failed.length === 0 ? (
                    <p className="text-sm text-emerald-300/85">
                      All checkpoints satisfied — your company appears aligned with{" "}
                      {BOARD_LABELS[board]} eligibility criteria. Validate residual nuances with
                      your merchant banker before filing.
                    </p>
                  ) : (
                    <ul className="space-y-2.5" data-testid="sme-todo-list">
                      {Object.entries(
                        analysis.failed.reduce((acc, it) => {
                          (acc[it.category] = acc[it.category] || []).push(it);
                          return acc;
                        }, {})
                      ).map(([cat, items]) => (
                        <li key={cat} className="bg-rose-500/[0.05] border border-rose-400/15 rounded-lg p-3">
                          <p className="text-[11px] uppercase tracking-[0.15em] text-rose-300/80 font-semibold mb-2">
                            {cat}
                          </p>
                          <ul className="space-y-1.5">
                            {items.map((it) => (
                              <li key={it.id} className="text-[13px] text-white/75 leading-relaxed flex gap-2">
                                <span className="text-rose-400/80 shrink-0">▢</span>
                                <span>{it.q}</span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <p className="text-[11px] text-white/35 italic flex items-start gap-1.5">
                <FileText className="w-3 h-3 mt-0.5" />
                Click <strong className="text-white/55">Save PDF</strong> to download a board-ready report stamped with your company name and IPO Labs branding.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SMESelfAssessment;
