import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AboutPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col" data-testid="about-page">
      <nav className="flex items-center gap-4 px-8 lg:px-16 py-5 border-b bg-white">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
        <span className="text-xl font-bold text-[#003366]">About</span>
      </nav>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-lg">About page coming soon.</p>
      </div>
    </div>
  );
};

export default AboutPage;
