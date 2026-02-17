import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Briefcase,
  Building2,
  Mail,
  Phone,
  Video,
  Globe,
  CheckCircle2,
  Award,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Loader2,
  ChevronRight,
  Send
} from "lucide-react";

const ProfessionalProfile = ({ user, apiClient }) => {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnquiryDialog, setShowEnquiryDialog] = useState(false);
  const [showConsultDialog, setShowConsultDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [enquiryData, setEnquiryData] = useState({
    subject: "",
    message: "",
    company_name: "",
    contact_email: user?.email || "",
    contact_phone: ""
  });
  
  const [consultData, setConsultData] = useState({
    preferred_date: "",
    preferred_time: "",
    consultation_type: "video",
    topic: "",
    notes: ""
  });
  
  const [reviewData, setReviewData] = useState({
    rating: 5,
    review_text: "",
    reviewer_name: user?.name || ""
  });

  useEffect(() => {
    fetchProfessional();
  }, [professionalId]);

  const fetchProfessional = async () => {
    try {
      const response = await apiClient.get(`/matchmaker/professionals/${professionalId}`);
      setProfessional(response.data);
    } catch (error) {
      console.error("Failed to fetch professional:", error);
      toast.error("Professional not found");
      navigate("/matchmaker");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEnquiry = async () => {
    if (!enquiryData.subject || !enquiryData.message || !enquiryData.contact_email) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      await apiClient.post("/matchmaker/enquiry", {
        professional_id: professionalId,
        ...enquiryData
      });
      toast.success("Enquiry sent successfully!");
      setShowEnquiryDialog(false);
      setEnquiryData({ subject: "", message: "", company_name: "", contact_email: user?.email || "", contact_phone: "" });
    } catch (error) {
      console.error("Failed to send enquiry:", error);
      toast.error("Failed to send enquiry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookConsultation = async () => {
    if (!consultData.preferred_date || !consultData.preferred_time || !consultData.topic) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      await apiClient.post("/matchmaker/consultation", {
        professional_id: professionalId,
        ...consultData
      });
      toast.success("Consultation request submitted!");
      setShowConsultDialog(false);
      setConsultData({ preferred_date: "", preferred_time: "", consultation_type: "video", topic: "", notes: "" });
    } catch (error) {
      console.error("Failed to book consultation:", error);
      toast.error("Failed to book consultation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewData.review_text) {
      toast.error("Please write a review");
      return;
    }
    
    setSubmitting(true);
    try {
      await apiClient.post(`/matchmaker/professionals/${professionalId}/review`, {
        professional_id: professionalId,
        ...reviewData
      });
      toast.success("Review submitted successfully!");
      setShowReviewDialog(false);
      fetchProfessional(); // Refresh to show new review
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, size = "w-5 h-5") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} apiClient={apiClient} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DA1F2]" />
        </main>
      </div>
    );
  }

  if (!professional) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="professional-profile-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </button>
        </header>

        <div className="max-w-5xl mx-auto px-8 py-8">
          {/* Profile Header Card */}
          <Card className="border border-border mb-6">
            <CardContent className="p-8">
              <div className="flex gap-8">
                {/* Avatar */}
                <Avatar className="w-32 h-32 rounded-2xl">
                  <AvatarImage src={professional.profile_picture} alt={professional.name} />
                  <AvatarFallback className="bg-[#1DA1F2] text-white text-4xl rounded-2xl">
                    {professional.name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-black">{professional.name}</h1>
                        {professional.is_verified && (
                          <Badge className="bg-blue-500 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            VERIFIED
                          </Badge>
                        )}
                      </div>
                      {professional.agency_name && (
                        <p className="text-lg text-muted-foreground flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {professional.agency_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        {renderStars(professional.average_rating)}
                        <span className="text-lg font-semibold text-black">{professional.average_rating.toFixed(1)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{professional.ratings_count} reviews</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">
                    {professional.professional_summary || "Experienced IPO professional ready to assist with your needs."}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {professional.years_experience} years experience
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {professional.locations?.join(", ")}
                    </span>
                    {professional.ipo_track_record?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {professional.ipo_track_record.length} IPOs managed
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {professional.expertise_tags?.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                <Dialog open={showConsultDialog} onOpenChange={setShowConsultDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1DA1F2] hover:bg-[#1a8cd8] gap-2 flex-1" data-testid="book-consultation-btn">
                      <Video className="w-4 h-4" />
                      Book Consultation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Book a Consultation</DialogTitle>
                      <DialogDescription>Schedule a video or audio call with {professional.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Preferred Date *</Label>
                          <Input
                            type="date"
                            value={consultData.preferred_date}
                            onChange={(e) => setConsultData({ ...consultData, preferred_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preferred Time *</Label>
                          <Input
                            type="time"
                            value={consultData.preferred_time}
                            onChange={(e) => setConsultData({ ...consultData, preferred_time: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Consultation Type</Label>
                        <Select value={consultData.consultation_type} onValueChange={(v) => setConsultData({ ...consultData, consultation_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Video Call</SelectItem>
                            <SelectItem value="audio">Audio Call</SelectItem>
                            <SelectItem value="in-person">In-Person</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Topic of Discussion *</Label>
                        <Input
                          placeholder="e.g., IPO readiness assessment"
                          value={consultData.topic}
                          onChange={(e) => setConsultData({ ...consultData, topic: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Notes</Label>
                        <Textarea
                          placeholder="Any specific points you'd like to discuss..."
                          value={consultData.notes}
                          onChange={(e) => setConsultData({ ...consultData, notes: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowConsultDialog(false)}>Cancel</Button>
                      <Button onClick={handleBookConsultation} disabled={submitting} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Book Consultation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showEnquiryDialog} onOpenChange={setShowEnquiryDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 flex-1" data-testid="send-enquiry-btn">
                      <Mail className="w-4 h-4" />
                      Send Enquiry
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Enquiry</DialogTitle>
                      <DialogDescription>Get in touch with {professional.name} for your IPO needs</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Subject *</Label>
                        <Input
                          placeholder="e.g., IPO Advisory Services"
                          value={enquiryData.subject}
                          onChange={(e) => setEnquiryData({ ...enquiryData, subject: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Your Company Name</Label>
                        <Input
                          placeholder="Enter your company name"
                          value={enquiryData.company_name}
                          onChange={(e) => setEnquiryData({ ...enquiryData, company_name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={enquiryData.contact_email}
                            onChange={(e) => setEnquiryData({ ...enquiryData, contact_email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            placeholder="+91 XXXXX XXXXX"
                            value={enquiryData.contact_phone}
                            onChange={(e) => setEnquiryData({ ...enquiryData, contact_phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Message *</Label>
                        <Textarea
                          placeholder="Describe your requirements..."
                          rows={4}
                          value={enquiryData.message}
                          onChange={(e) => setEnquiryData({ ...enquiryData, message: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowEnquiryDialog(false)}>Cancel</Button>
                      <Button onClick={handleSendEnquiry} disabled={submitting} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Send Enquiry
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Services */}
              {professional.services?.length > 0 && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#1DA1F2]" />
                      Services Offered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {professional.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-black">{service.name}</span>
                          {service.price && (
                            <span className="text-muted-foreground">{service.price}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* IPO Track Record */}
              {professional.ipo_track_record?.length > 0 && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#1DA1F2]" />
                      IPO Track Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {professional.ipo_track_record.map((ipo, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-[#1DA1F2]/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[#1DA1F2]" />
                          </div>
                          <div>
                            <h4 className="font-medium text-black">{ipo.company_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {ipo.year} • Issue Size: ₹{ipo.issue_size} Cr • Role: {ipo.role}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              <Card className="border border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#1DA1F2]" />
                    Reviews ({professional.ratings_count})
                  </CardTitle>
                  <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="write-review-btn">Write a Review</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Write a Review</DialogTitle>
                        <DialogDescription>Share your experience with {professional.name}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setReviewData({ ...reviewData, rating: star })}
                                className="p-1"
                              >
                                <Star
                                  className={`w-8 h-8 ${star <= reviewData.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Your Name</Label>
                          <Input
                            value={reviewData.reviewer_name}
                            onChange={(e) => setReviewData({ ...reviewData, reviewer_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Your Review *</Label>
                          <Textarea
                            placeholder="Share your experience..."
                            rows={4}
                            value={reviewData.review_text}
                            onChange={(e) => setReviewData({ ...reviewData, review_text: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmitReview} disabled={submitting} className="bg-[#1DA1F2] hover:bg-[#1a8cd8]">
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Submit Review
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {professional.reviews?.length > 0 ? (
                    <div className="space-y-4">
                      {professional.reviews.map((review, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-black">{review.reviewer_name}</span>
                            {renderStars(review.rating, "w-4 h-4")}
                          </div>
                          <p className="text-muted-foreground text-sm">{review.review_text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review!</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {professional.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-black">{professional.email}</p>
                      </div>
                    </div>
                  )}
                  {professional.mobile && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-black">{professional.mobile}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              {(professional.sebi_registration || professional.ca_cs_membership) && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {professional.sebi_registration && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">SEBI Registered</p>
                          <p className="text-xs text-green-600">{professional.sebi_registration}</p>
                        </div>
                      </div>
                    )}
                    {professional.ca_cs_membership && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Award className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">CA/CS Member</p>
                          <p className="text-xs text-blue-600">{professional.ca_cs_membership}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Pricing */}
              {professional.pricing_model && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#1DA1F2]" />
                      Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground capitalize">{professional.pricing_model}</p>
                    {professional.hourly_rate && (
                      <p className="text-2xl font-bold text-black mt-2">
                        ₹{professional.hourly_rate.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/hour</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Clients */}
              {professional.clients?.length > 0 && (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#1DA1F2]" />
                      Past Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {professional.clients.map((client, index) => (
                        <Badge key={index} variant="outline">{client}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalProfile;
