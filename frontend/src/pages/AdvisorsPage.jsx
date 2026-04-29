import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Award, Scale, Building2, Briefcase } from "lucide-react";

const ADVISORS = [
  {
    id: "pradeep-kumar-jain",
    name: "Pradeep Kumar Jain",
    title: "Managing Partner",
    firm: "Singhania & Co.",
    image: "https://singhania.com/img/pradeep-kumar.jpg",
    qualifications: ["M.Sc.", "LL.B. (Hons.)", "CS"],
    expertise: [
      "Company Laws & M&A",
      "SEBI/RBI Compliance",
      "Financial Restructuring",
      "Takeovers & Mutual Funds",
    ],
    bio: "Mr. Pradeep Jain is the Managing Partner at Singhania & Co. with extensive expertise in company laws, mergers & acquisitions, joint ventures, financial restructuring, and SEBI/RBI/IRDA/FIPB compliance. He advises clients on takeovers, mutual funds, asset management, trusteeship, and foreign institutional investors. A qualified Advocate, Company Secretary, and associate member of the Chartered Institute of Securities & Investments.",
    memberships: ["Bar Council of India", "ICSI", "Bombay High Court", "ASSOCHAM", "TiE", "FICCI"],
    profileUrl: "https://www.singhania.com/profile/pradeep-kumar-jain-11",
  },
];

const AdvisorsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="advisors-page">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b px-8 lg:px-16 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8" data-testid="advisors-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center">
            <img src="/setu-logo.png" alt="SETU Labs" className="h-[100px] w-auto object-contain" data-testid="advisors-logo" />
          </div>
          <span className="text-muted-foreground mx-1 text-sm">/</span>
          <span className="font-semibold text-base text-black">Advisors</span>
        </div>
        <Button
          onClick={() => navigate("/login")}
          className="bg-[#003366] hover:bg-[#002244] text-white rounded-full px-5 text-sm h-9"
          data-testid="advisors-get-started-btn"
        >
          Get Started
        </Button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-8 lg:px-16 py-12 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-[#003366]" />
            <p className="text-xs tracking-[0.2em] uppercase text-[#003366] font-semibold">Board of Advisors</p>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-black mb-3" data-testid="advisors-title">
            Our Advisors
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-2xl">
            A curated network of industry-leading professionals who guide IPO Labs' strategic direction and ensure the highest standards of regulatory compliance and governance.
          </p>
        </div>

        {/* Advisors Grid */}
        <div className="grid gap-8">
          {ADVISORS.map((advisor) => (
            <Card key={advisor.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow" data-testid={`advisor-card-${advisor.id}`}>
              <CardContent className="p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    <img
                      src={advisor.image}
                      alt={advisor.name}
                      className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl object-cover border-2 border-gray-100"
                      data-testid={`advisor-image-${advisor.id}`}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h2 className="text-xl lg:text-2xl font-bold text-black" data-testid={`advisor-name-${advisor.id}`}>
                          {advisor.name}
                        </h2>
                        <p className="text-sm text-[#003366] font-medium mt-0.5">
                          {advisor.title}, <span className="text-gray-600">{advisor.firm}</span>
                        </p>
                      </div>
                      <a
                        href={advisor.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#003366] hover:text-[#00D1FF] transition-colors border border-gray-200 rounded-full px-3 py-1.5 hover:border-[#00D1FF]"
                        data-testid={`advisor-profile-link-${advisor.id}`}
                      >
                        View Profile <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {advisor.bio}
                    </p>

                    {/* Qualifications & Expertise */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Qualifications */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Scale className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Qualifications</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {advisor.qualifications.map((q) => (
                            <span key={q} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">{q}</span>
                          ))}
                        </div>
                      </div>

                      {/* Expertise */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expertise</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {advisor.expertise.map((e) => (
                            <span key={e} className="text-xs bg-blue-50 text-[#003366] px-2 py-0.5 rounded-md font-medium">{e}</span>
                          ))}
                        </div>
                      </div>

                      {/* Memberships */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Memberships</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {advisor.memberships.map((m) => (
                            <span key={m} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium">{m}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="bg-gray-900 text-white/50 py-4 px-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} IPO Labs AI Private Limited. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AdvisorsPage;
