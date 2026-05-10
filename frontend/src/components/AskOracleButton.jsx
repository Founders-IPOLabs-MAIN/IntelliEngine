import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Reusable "💡 Ask Oracle about this" CTA.
 *
 * Pre-fills the Oracle chat input with a contextual question and (optionally)
 * sets the desired tab. The OraclePage reads ?q= and ?mode= from the URL.
 *
 * Props:
 *   - question: string  — the query to pre-fill (required)
 *   - mode:    "general"|"drhp"|"application"  — default "general"
 *   - label:   string  — visible label (default "Ask Oracle")
 *   - variant: "pill" | "ghost" | "card"   — visual style
 *   - className: extra classes
 *   - testid:    data-testid value
 */
const AskOracleButton = ({
  question,
  mode = "general",
  label = "Ask Oracle",
  variant = "pill",
  className = "",
  testid = "ask-oracle-btn",
}) => {
  const navigate = useNavigate();

  const open = (e) => {
    e?.stopPropagation?.();
    if (!question) return;
    const params = new URLSearchParams({ q: question, mode });
    navigate(`/oracle?${params.toString()}`);
  };

  if (variant === "ghost") {
    return (
      <button
        onClick={open}
        type="button"
        className={`inline-flex items-center gap-1 text-[11px] text-[#1DA1F2] hover:text-blue-700 hover:underline transition ${className}`}
        data-testid={testid}
        title={`Ask Oracle: ${question}`}
      >
        <Sparkles className="w-3 h-3" /> 💡 {label}
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        onClick={open}
        type="button"
        className={`group flex items-start gap-2 text-left p-2.5 rounded-lg border border-blue-100 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 hover:shadow-[0_0_15px_rgba(29,161,242,0.1)] transition ${className}`}
        data-testid={testid}
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#1DA1F2] to-blue-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">💡 {label}</div>
          <div className="text-[12px] text-gray-700 truncate group-hover:text-blue-800">{question}</div>
        </div>
      </button>
    );
  }

  // Default — small pill button
  return (
    <button
      onClick={open}
      type="button"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-200 bg-white text-[11px] font-semibold text-[#1DA1F2] hover:bg-blue-50 hover:border-blue-300 hover:shadow-[0_0_12px_rgba(29,161,242,0.15)] transition ${className}`}
      data-testid={testid}
      title={`Ask Oracle: ${question}`}
    >
      <Sparkles className="w-3 h-3" /> 💡 {label}
    </button>
  );
};

export default AskOracleButton;
