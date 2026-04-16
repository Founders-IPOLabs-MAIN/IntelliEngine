import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/Sidebar";
import {
  Building2,
  FileText,
  TrendingUp,
  Users,
  CheckCircle2,
  Scale,
  ArrowRight
} from "lucide-react";

const Dashboard = ({ user, apiClient }) => {
  const navigate = useNavigate();

  const modules = [
    {
      id: "assessment",
      title: "Free IPO Assessment",
      description: "AI-powered readiness check with comprehensive gap analysis and recommendations",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      hoverBg: "hover:bg-green-50",
      hoverBorder: "hover:border-green-300",
      path: "/assessment"
    },
    {
      id: "drhp",
      title: "DRHP Builder",
      description: "End-to-end document generation with Centralised Corporate Repository",
      icon: FileText,
      color: "text-[#1DA1F2]",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-50",
      hoverBorder: "hover:border-blue-300",
      path: "/drhp1"
    },
    {
      id: "funding",
      title: "IPO Funding",
      description: "Human + AI powered capital orchestration platform for your IPO journey",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      hoverBg: "hover:bg-emerald-50",
      hoverBorder: "hover:border-emerald-300",
      path: "/funding1"
    },
    {
      id: "matchmaker",
      title: "IPO Match Maker",
      description: "Connect with verified CAs, CS, CFOs, Lawyers, and industry experts",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      hoverBg: "hover:bg-orange-50",
      hoverBorder: "hover:border-orange-300",
      path: "/matchmaker"
    }
  ];

  return (
    <div className="flex min-h-screen bg-white" data-testid="dashboard-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name || "User"}</p>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.picture} alt={user?.name} />
              <AvatarFallback className="bg-[#1DA1F2] text-white">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main Content - Flex grow to fill space */}
        <div className="flex-1 p-8 flex flex-col">
          {/* Welcome Banner */}
          <Card className="border border-border bg-gradient-to-r from-white to-gray-50 mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1DA1F2] rounded-2xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-black">
                    IntelliEngine Platform
                  </h2>
                  <p className="text-sm text-muted-foreground">by IPO Labs - Your complete IPO readiness solution</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules Grid - 2x2 with larger cards */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-lg font-semibold tracking-tight text-black mb-4">Platform Modules</h3>
            <div className="grid grid-cols-2 gap-5 flex-1">
              {modules.map((module) => (
                <Card
                  key={module.id}
                  className={`border border-border cursor-pointer transition-all duration-200 ${module.hoverBg} ${module.hoverBorder} hover:shadow-lg group`}
                  onClick={() => navigate(module.path)}
                  data-testid={`module-${module.id}`}
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 ${module.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                        <module.icon className={`w-7 h-7 ${module.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-black text-base mb-1">{module.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <span className={`text-sm font-medium ${module.color} flex items-center gap-1 group-hover:gap-2 transition-all`}>
                        Open Module <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Legal Links Section - Fixed at bottom */}
          <Card className="border border-border bg-gray-50 mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-8">
                <Link
                  to="/legal-disclaimer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1DA1F2] transition-colors font-medium"
                  data-testid="dashboard-legal-disclaimer"
                >
                  <Scale className="w-4 h-4" />
                  Legal Disclaimer
                </Link>
                <div className="w-px h-4 bg-border" />
                <Link
                  to="/terms-of-use"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1DA1F2] transition-colors font-medium"
                  data-testid="dashboard-terms-of-use"
                >
                  <FileText className="w-4 h-4" />
                  Terms of Use
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
