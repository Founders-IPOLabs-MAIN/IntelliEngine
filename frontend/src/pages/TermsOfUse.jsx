import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Shield, Brain, Lock, Scale, AlertTriangle } from "lucide-react";

const TermsOfUse = ({ user, apiClient }) => {
  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="terms-of-use-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Terms of Use</h1>
                <p className="text-gray-300">Service Provider Terms & Professional Code of Conduct</p>
              </div>
            </div>
            <p className="text-gray-400">
              By registering as a Service Provider on our platform, you agree to the following terms.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Section 1 */}
          <Card className="border border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                1. Representation of Professional Standing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>By registering as a Service Provider on IntelliEngine, you represent and warrant that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  You hold a valid and subsisting license/registration from your respective regulatory body (e.g., <strong className="text-black">SEBI, ICAI, ICSI, Bar Council of India</strong>).
                </li>
                <li>
                  You have not been debarred or blacklisted by any regulatory authority or stock exchange in the last five years.
                </li>
                <li>
                  Every "IPO Track Record" entry added to your profile is authentic and can be verified against public filings.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card className="border border-border mb-6 border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-3 text-xl text-red-800">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                2. Strict Prohibition of Illegal Solicitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground pt-6">
              <p>The Service Provider explicitly agrees <strong className="text-red-600">NOT</strong> to use the Platform, its Match Making Module, or the Video Consultation feature to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Solicit investments for unregulated schemes, including but not limited to Ponzi schemes, unauthorized Portfolio Management Services (PMS), or "Guarantee Return" private placements.
                </li>
                <li>
                  Act as an unregistered investment advisor or provide "Stock Tips" that violate <strong className="text-black">SEBI (Prohibition of Fraudulent and Unfair Trade Practices) Regulations</strong>.
                </li>
                <li>
                  Misrepresent their role in past IPOs to secure new business.
                </li>
              </ul>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mt-4">
                <p className="text-red-800 font-semibold text-sm">
                  ⚠️ Any violation of this clause will result in immediate permanent deactivation and reporting to the relevant regulatory authorities.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card className="border border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-cyan-600" />
                </div>
                3. Integrity of AI-Human Interaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h4 className="font-semibold text-black mb-2">Transcription Accuracy</h4>
                <p>
                  You acknowledge that the AI-generated transcription and "Action Items" are aids for your record-keeping. You are solely responsible for verifying the accuracy of these notes before acting upon them for regulatory filings.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-black mb-2">Recording Consent</h4>
                <p>
                  You agree to the recording of consultation sessions for the purpose of transparency and user record-keeping. You must explicitly inform the SME at the start of every call if you intend to use the recording for internal firm processing.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card className="border border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-600" />
                </div>
                4. Confidentiality & Data Protection (DPDP Act 2023)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h4 className="font-semibold text-black mb-2">SME Data Privacy</h4>
                <p>
                  You shall treat all MSME financial data, DRHP drafts, and business strategies as <strong className="text-black">Highly Confidential</strong>.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-black mb-2">Non-Compete</h4>
                <p>
                  You agree not to bypass the Platform's matchmaking engine to contact users for independent solicitation once a lead has been established through IntelliEngine, for a period of <strong className="text-black">12 months</strong> from the date of the first consultation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card className="border border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-purple-600" />
                </div>
                5. Indemnity & Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>You agree to indemnify and hold IPO Labs AI Private Limited, its team, and all its subsidiaries harmless against any claims, losses, or legal actions arising from:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Deficiencies in the professional services provided by you to the MSME.</li>
                <li>Any regulatory penalties imposed due to your non-compliance with professional standards.</li>
                <li>Data breaches occurring at your firm's end of the communication.</li>
                <li>Any long term, short term financial, non-financial, legal, personal, or criminal liabilities arising during, before or after the use of our website, services, platform or other services.</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-amber-800 font-semibold">
                  Payment once made are non-refundable.
                </p>
              </div>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <p className="text-gray-700 text-sm">
                  All Laws are restricted to the <strong>Courts of Mumbai</strong> and Laws of the land of <strong>Republic of India and Bharat</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} IPO Labs Private Limited. All rights reserved.</p>
            <p className="mt-2">Last updated: February 2026</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfUse;
