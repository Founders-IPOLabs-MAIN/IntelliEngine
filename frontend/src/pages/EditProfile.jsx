import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Loader2,
  Edit3,
  User,
  Building2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

const EditProfile = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Fetch user's existing professional profile
      const response = await apiClient.get("/matchmaker/my-profile");
      if (response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError("no_profile");
      } else {
        console.error("Failed to fetch profile:", error);
        setError("fetch_error");
      }
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="flex min-h-screen bg-gray-50" data-testid="edit-profile-page">
      <Sidebar user={user} apiClient={apiClient} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-border px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/matchmaker")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-black"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Match Maker
            </button>
            <div>
              <h1 className="text-lg font-bold text-black">Edit Professional Profile</h1>
              <p className="text-xs text-muted-foreground">Update your existing profile information</p>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-8">
          {error === "no_profile" ? (
            <Card className="border border-border">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-black mb-2">No Profile Found</h2>
                <p className="text-muted-foreground mb-6">
                  You haven't registered as a professional yet. Create your profile to get started.
                </p>
                <Button
                  onClick={() => navigate(categoryFromUrl ? `/matchmaker/register?category=${categoryFromUrl}` : "/matchmaker/register")}
                  className="bg-[#1DA1F2] hover:bg-[#1a8cd8]"
                >
                  <User className="w-4 h-4 mr-2" />
                  Register as Professional
                </Button>
              </CardContent>
            </Card>
          ) : error === "fetch_error" ? (
            <Card className="border border-border">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-black mb-2">Error Loading Profile</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't load your profile. Please try again.
                </p>
                <Button onClick={fetchUserProfile} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : profile ? (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Profile Found
                </CardTitle>
                <CardDescription>Your existing professional profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#1DA1F2]/10 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-[#1DA1F2]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-black">{profile.name}</h3>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      {profile.agency_name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {profile.agency_name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{profile.category_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Experience</p>
                      <p className="font-medium">{profile.years_experience} years</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Locations</p>
                      <p className="font-medium">{profile.locations?.join(", ") || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className={`font-medium ${profile.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                        {profile.status === 'active' ? 'Active' : 'Pending Review'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate(`/matchmaker/register?edit=${profile.professional_id}`)}
                    className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8]"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/matchmaker/profile/${profile.professional_id}`)}
                    className="flex-1"
                  >
                    View Public Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
