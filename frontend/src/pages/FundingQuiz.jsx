import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Brain,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Target,
  Trophy,
  AlertTriangle,
  Download,
  Calendar,
  Users
} from "lucide-react";

const FundingQuiz = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [fundingType, setFundingType] = useState(searchParams.get("type") || null);
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (fundingType) {
      fetchQuestions();
    }
  }, [fundingType]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/funding/quiz-questions?funding_type=${fundingType}`);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toast.error("Failed to load quiz questions");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (!answers[questions[currentStep].id]) {
      toast.error("Please select an answer");
      return;
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitQuiz();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const response = await apiClient.post("/funding/quiz-evaluate", {
        funding_type: fundingType,
        answers: answers
      });
      setResult(response.data);
      toast.success("Quiz completed!");
    } catch (error) {
      console.error("Quiz submission failed:", error);
      toast.error("Failed to evaluate quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case "high_readiness": return <Trophy className="w-12 h-12 text-green-500" />;
      case "potentially_ready": return <Target className="w-12 h-12 text-amber-500" />;
      case "early_stage": return <AlertTriangle className="w-12 h-12 text-orange-500" />;
      default: return <HelpCircle className="w-12 h-12 text-gray-500" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "high_readiness": return "bg-green-50 border-green-200";
      case "potentially_ready": return "bg-amber-50 border-amber-200";
      case "early_stage": return "bg-orange-50 border-orange-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  // Type Selection Screen
  if (!fundingType) {
    return (
      <div className="flex min-h-screen bg-gray-50" data-testid="funding-quiz-page">
        <Sidebar user={user} apiClient={apiClient} />
        
        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-border px-8 py-4">
            <button
              onClick={() => navigate("/funding")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Funding Engine
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Funding Eligibility Quiz</h1>
                <p className="text-muted-foreground">AI-powered assessment of your funding readiness</p>
              </div>
            </div>
          </header>

          <div className="max-w-2xl mx-auto px-8 py-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Brain className="w-4 h-4" />
                AI-Powered Assessment
              </div>
              <h2 className="text-xl font-bold text-black mb-2">Select Your Funding Stage</h2>
              <p className="text-muted-foreground">Choose the type of funding you're seeking</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="border-2 border-border hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg"
                onClick={() => setFundingType("pre_ipo")}
                data-testid="quiz-type-pre-ipo"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-black text-lg mb-2">Pre-IPO Funding</h3>
                  <p className="text-sm text-muted-foreground">
                    For companies preparing for their IPO journey
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="border-2 border-border hover:border-green-400 cursor-pointer transition-all hover:shadow-lg"
                onClick={() => setFundingType("post_ipo")}
                data-testid="quiz-type-post-ipo"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-black text-lg mb-2">Post-IPO Funding</h3>
                  <p className="text-sm text-muted-foreground">
                    For listed companies seeking growth capital
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading quiz...</p>
          </div>
        </main>
      </div>
    );
  }

  // Result Screen
  if (result) {
    return (
      <div className="flex min-h-screen bg-gray-50" data-testid="quiz-result-page">
        <Sidebar user={user} apiClient={apiClient} />
        
        <main className="flex-1 ml-64">
          <header className="bg-white border-b border-border px-8 py-4">
            <button
              onClick={() => navigate("/funding")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Funding Engine
            </button>
          </header>

          <div className="max-w-2xl mx-auto px-8 py-8">
            {/* Score Card */}
            <Card className={`border-2 ${getTierColor(result.tier)} mb-6`}>
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  {getTierIcon(result.tier)}
                </div>
                
                <div className="relative w-40 h-40 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="14" />
                    <circle
                      cx="80" cy="80" r="70" fill="none"
                      stroke={result.score >= 80 ? "#22c55e" : result.score >= 50 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${(result.score / 100) * 440} 440`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-black">{result.score}</span>
                    <span className="text-sm text-muted-foreground">out of 100</span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-black mb-2">{result.tier_label}</h2>
                <p className="text-muted-foreground mb-6">{result.tier_message}</p>
                
                {/* Action Buttons based on tier */}
                <div className="flex justify-center gap-3">
                  {result.tier_action === "vip_booking" && (
                    <Button className="bg-green-600 hover:bg-green-700 gap-2">
                      <Calendar className="w-4 h-4" />
                      Book VIP Consultation
                    </Button>
                  )}
                  {result.tier_action === "standard_booking" && (
                    <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
                      <Users className="w-4 h-4" />
                      Schedule Discovery Call
                    </Button>
                  )}
                  {result.tier_action === "toolkit_download" && (
                    <Button variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download IPO Toolkit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Summary */}
            <Card className="border border-border mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5 text-orange-600" />
                  AI Profile Summary
                </CardTitle>
                <CardDescription>Generated for your IPO consultant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {result.ai_summary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Answer Breakdown */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-lg">Your Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.answer_details.map((detail, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-black">{detail.question}</p>
                        <p className="text-xs text-muted-foreground">{detail.answer}</p>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600">
                        +{detail.score} pts
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Retake Button */}
            <div className="text-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setCurrentStep(0);
                  setFundingType(null);
                }}
              >
                Take Quiz Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Quiz Questions Screen
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="quiz-questions-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-border px-8 py-4">
          <button
            onClick={() => {
              if (currentStep === 0) {
                setFundingType(null);
              } else {
                handleBack();
              }
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 0 ? "Change Funding Type" : "Previous Question"}
          </button>
        </header>

        <div className="max-w-2xl mx-auto px-8 py-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-orange-600">
                {fundingType === "pre_ipo" ? "Pre-IPO" : "Post-IPO"} Assessment
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="border border-border">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-600">{currentStep + 1}</span>
                </div>
                <span className="text-sm text-muted-foreground">Question</span>
              </div>
              <CardTitle className="text-xl">{currentQuestion?.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion?.id] || ""}
                onValueChange={(value) => handleAnswer(currentQuestion?.id, value)}
                className="space-y-3"
              >
                {currentQuestion?.options.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      answers[currentQuestion?.id] === option.value
                        ? "border-orange-400 bg-orange-50"
                        : "border-border hover:border-orange-200"
                    }`}
                    onClick={() => handleAnswer(currentQuestion?.id, option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={submitting || !answers[currentQuestion?.id]}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : currentStep === questions.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Results
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FundingQuiz;
