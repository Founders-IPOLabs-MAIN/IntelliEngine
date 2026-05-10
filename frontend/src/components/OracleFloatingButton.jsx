import { useNavigate, useLocation } from "react-router-dom";
import { Bot } from "lucide-react";

/**
 * Tiny floating "Oracle (IPO.GPT)" robot button.
 * Rendered inside ProtectedRoute so it appears on every authenticated page.
 * Hidden on the Oracle page itself.
 */
const OracleFloatingButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname.startsWith("/oracle")) return null;

  return (
    <button
      onClick={() => navigate("/oracle")}
      className="fixed top-[112px] right-[44px] z-40 group flex items-center gap-2.5 pl-3.5 pr-5 py-2.5 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
      data-testid="oracle-floating-btn"
      title="Ask Oracle (IPO.GPT)"
    >
      <span className="relative">
        <Bot className="w-5 h-5 text-[#1DA1F2] group-hover:text-blue-700 transition-colors" strokeWidth={2.2} />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
      </span>
      <span className="text-[14px] font-semibold text-gray-700 group-hover:text-blue-800 hidden sm:inline">
        Ask Oracle
      </span>
    </button>
  );
};

export default OracleFloatingButton;
