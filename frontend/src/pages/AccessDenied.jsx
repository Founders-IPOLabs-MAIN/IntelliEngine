import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, ArrowLeft, Home } from "lucide-react";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8" data-testid="access-denied-page">
      <Card className="w-full max-w-md border border-border">
        <CardContent className="flex flex-col items-center py-12 px-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            You don't have permission to access this module. Please contact your administrator to request access.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </Button>
            <Button onClick={() => navigate("/dashboard")} className="bg-[#003366] hover:bg-[#002244] gap-2" data-testid="access-denied-dashboard-btn">
              <Home className="w-4 h-4" /> Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
