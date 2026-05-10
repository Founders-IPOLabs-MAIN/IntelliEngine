import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Brain, ShieldAlert } from "lucide-react";

/**
 * Reusable Deep-Tech "Coming Soon" page used by:
 *   /drhp-intelligence       (DRHP Intelligence)
 *   /fraud-risk-analytics    (Fraud & Risk Analytics)
 *
 * Both pages share the same layout — only the title, intro paragraph
 * and the list/items below differ.
 */
const DeepTechComingSoon = ({ user, apiClient, variant }) => {
  const navigate = useNavigate();

  const spec = variant === "fraud"
    ? {
        title: "Fraud & Risk Analytics",
        Icon: ShieldAlert,
        accentFrom: "from-fuchsia-500",
        accentTo: "to-rose-500",
        intro: "Separate models per typology:",
        items: [
          { tag: "a", emphasis: "Shell score",            rest: " — GBM on MCA compliance gaps, address entropy, director DIN age, GSTIN activity ratio." },
          { tag: "b", emphasis: "Circular trading",       rest: " — Graph Neural Network (GNN) on GSTIN transaction cycles using MCL community detection." },
          { tag: "c", emphasis: "Benami score",           rest: " — anomaly detection on PAN-to-demat ratios, linked-address clusters." },
          { tag: "d", emphasis: "Promoter anomaly",       rest: " — time-series model on shareholding-pattern deltas from quarterly BSE / NSE filings." },
        ],
      }
    : {
        title: "DRHP Intelligence",
        Icon: Brain,
        accentFrom: "from-[#1DA1F2]",
        accentTo: "to-indigo-500",
        intro:
          'Building Deep-Tech ability to Parse / Review "complex" DRHP / Offer Documents with LLM-assisted NLP Modules to be able to;',
        items: [
          { tag: "1", emphasis: "Extract", rest: " related-party transaction disclosures." },
          { tag: "2", emphasis: "Cross-validate", rest: " against MCA filings." },
          { tag: "3", emphasis: "Flag inconsistencies", rest: " between stated revenue and GST return data." },
          { tag: "4", emphasis: "Detect", rest: " boilerplate litigation disclosures or concealed material litigations." },
          { tag: "5", emphasis: "Identify", rest: " promoter-group membership omissions." },
        ],
      };

  const { title, Icon, accentFrom, accentTo, intro, items } = spec;

  return (
    <div className="flex min-h-screen bg-white" data-testid={`${variant === "fraud" ? "fraud-risk" : "drhp-intel"}-coming-soon`}>
      <Sidebar user={user} apiClient={apiClient} />
      <main className="flex-1 ml-64">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} data-testid="dt-back-btn">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${accentFrom} ${accentTo} flex items-center justify-center shadow-sm`}>
            <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-base font-bold text-gray-900">{title}</h1>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] font-bold text-[#1DA1F2] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full ml-2">
            <Sparkles className="w-3 h-3" /> Coming Soon
          </span>
        </header>

        {/* Centered content */}
        <div
          className="min-h-[calc(100vh-72px)] flex items-center justify-center px-6 py-16"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 30%, rgba(29,161,242,0.06), transparent 55%), linear-gradient(180deg, #fff 0%, #f8fbff 100%)",
          }}
        >
          <div className="max-w-4xl w-full text-center">
            {/* Large icon */}
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br ${accentFrom} ${accentTo} shadow-xl shadow-blue-500/15 mb-7 ring-8 ring-white`}>
              <Icon className="w-9 h-9 text-white" strokeWidth={2.2} />
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">{title}</h2>
            <p className="mt-3 text-[13px] font-semibold tracking-[0.22em] uppercase text-[#1DA1F2]">
              Deep-Tech Module · Launching Soon
            </p>

            {/* Intro paragraph */}
            <p className="mt-8 text-xl sm:text-2xl text-gray-800 font-medium leading-relaxed max-w-3xl mx-auto">
              {intro}
            </p>

            {/* Numbered / lettered items */}
            <div className="mt-10 max-w-3xl mx-auto space-y-3.5">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-[0_0_30px_rgba(29,161,242,0.04)] hover:border-[#1DA1F2]/40 hover:shadow-[0_0_30px_rgba(29,161,242,0.10)] transition text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-[#0c7abf] text-[14px] font-bold flex items-center justify-center flex-shrink-0">
                    {it.tag}
                  </div>
                  <p className="text-lg text-gray-800 leading-relaxed flex-1">
                    <span className="font-semibold text-gray-900">{it.emphasis}</span>{it.rest}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <p className="mt-10 text-sm text-gray-500">
              We&rsquo;ll notify you the moment this goes live. Until then, explore other modules.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="h-10 border-gray-300 text-gray-700 hover:bg-gray-50"
                data-testid="dt-dashboard-btn"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => navigate("/oracle")}
                className="h-10 bg-[#1DA1F2] hover:bg-[#0C7ABF] text-white gap-1.5"
                data-testid="dt-oracle-btn"
              >
                <Sparkles className="w-4 h-4" /> Ask Oracle in the meantime
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeepTechComingSoon;
