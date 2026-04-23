import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, ArrowRight, Briefcase, Building2, Calculator, FileText } from "lucide-react";

const USER_LOGIN_TYPES = [
  {
    id: "merchant_banker",
    title: "Merchant Banker",
    description: "Add multiple projects under your firm",
    icon: Briefcase,
    accent: "#1DA1F2",
    tintBg: "bg-blue-50",
    tintBorder: "hover:border-blue-300",
    iconColor: "text-[#1DA1F2]",
    iconBg: "bg-blue-100",
  },
  {
    id: "company",
    title: "Company",
    description: "Add and manage your own corporate DRHP",
    icon: Building2,
    accent: "#059669",
    tintBg: "bg-emerald-50",
    tintBorder: "hover:border-emerald-300",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  {
    id: "ca_firm",
    title: "CA Firm",
    description: "Add multiple projects under your firm",
    icon: Calculator,
    accent: "#D97706",
    tintBg: "bg-amber-50",
    tintBorder: "hover:border-amber-300",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
  },
];

const DRHPUserTypeSelector = ({ user, apiClient }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="drhp-user-type-selector">
      <Sidebar user={user} apiClient={apiClient} />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
              data-testid="drhp-selector-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1DA1F2] rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-black">DRHP Builder</h1>
                <p className="text-xs text-muted-foreground">Select your user profile to continue</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">How are you using SETU today?</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose your profile — your DRHP workspace will be scoped to projects you create under it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {USER_LOGIN_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <Card
                    key={t.id}
                    onClick={() => navigate(`/drhp/${t.id}`)}
                    className={`border border-gray-200 bg-white ${t.tintBorder} hover:shadow-md transition-all duration-200 cursor-pointer group`}
                    data-testid={`drhp-user-type-${t.id}`}
                  >
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 ${t.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-6 h-6 ${t.iconColor}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{t.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-5">{t.description}</p>
                      <div
                        className="inline-flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all"
                        style={{ color: t.accent }}
                      >
                        Continue <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DRHPUserTypeSelector;
