import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { Loader2, MapPin, Briefcase, Star, Mail, Calendar, DollarSign } from "lucide-react";
import { AGENCY_NAV_ITEMS } from "@/constants/navigation";

interface FreelancerProfile {
  id: number;
  userId: number;
  firstName?: string;
  lastName?: string;
  expertise?: string;
  shortBio?: string;
  category?: string[];
  city?: string;
  country?: string;
  hourlyRate?: number;
  availability?: string;
  education?: any[];
  experiences?: any[];
  languages?: any[];
  portfolioItems?: any[];
  freelancerUser?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    createdAt: string;
  };
  stats?: {
    completedContracts: number;
    activeContracts: number;
    totalContracts: number;
    avgRating: number;
    reviewsCount: number;
  };
}

export default function AgencyFreelancerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchFreelancerProfile();
    }
  }, [id]);

  const fetchFreelancerProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      
      const response = await axiosInstance.get(`/agencies/freelancers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFreelancer({
          ...response.data.freelancer,
          stats: response.data.stats || {
            completedContracts: 0,
            activeContracts: 0,
            totalContracts: 0,
            avgRating: 0,
            reviewsCount: 0,
          }
        });
      }
    } catch (err: any) {
      console.error("Error fetching freelancer profile:", err);
      const errorMsg = err.response?.data?.message || "Failed to load freelancer profile";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleContactFreelancer = () => {
    if (freelancer?.freelancerUser) {
      navigate(`/agencymessages?userId=${freelancer.freelancerUser.id}`);
    }
  };

  if (!user || user.userType !== 'agency') {
    return (
      <div className="min-h-screen bg-background">
        <Header navItems={AGENCY_NAV_ITEMS} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <p className="text-muted-foreground">Access denied. This page is for agencies only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header navItems={AGENCY_NAV_ITEMS} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !freelancer) {
    return (
      <div className="min-h-screen bg-background">
        <Header navItems={AGENCY_NAV_ITEMS} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{error || "Freelancer not found"}</p>
              <Button onClick={() => navigate("/agency/freelancers")} className="mt-4">
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayUser = freelancer.freelancerUser || {} as FreelancerProfile['freelancerUser'];
  const fullName = displayUser ? `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim() : 'Unknown';
  const memberSince = displayUser?.createdAt 
    ? new Date(displayUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={AGENCY_NAV_ITEMS} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={displayUser?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser?.firstName || 'user'}`} />
                <AvatarFallback className="text-2xl">{displayUser?.firstName?.[0]}{displayUser?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{fullName}</h1>
                  <p className="text-lg text-muted-foreground">{freelancer.expertise || 'Freelancer'}</p>
                </div>
                
                {freelancer.shortBio && (
                  <p className="text-muted-foreground">{freelancer.shortBio}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {(freelancer.city || freelancer.country) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{[freelancer.city, freelancer.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {memberSince}</span>
                  </div>
                  
                  {freelancer.stats && freelancer.stats.avgRating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{freelancer.stats.avgRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({freelancer.stats.reviewsCount} reviews)</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleContactFreelancer}>
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Freelancer
                  </Button>
                </div>
              </div>
              
              {freelancer.hourlyRate && (
                <div className="md:text-right">
                  <div className="flex items-center gap-2 md:justify-end">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-2xl font-bold">${freelancer.hourlyRate}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">per hour</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {freelancer.stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Projects</CardDescription>
                <CardTitle className="text-2xl">{freelancer.stats.totalContracts}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-2xl text-green-600">{freelancer.stats.completedContracts}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active</CardDescription>
                <CardTitle className="text-2xl text-blue-600">{freelancer.stats.activeContracts}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-2xl">
                  {freelancer.stats.totalContracts > 0 
                    ? `${Math.round((freelancer.stats.completedContracts / freelancer.stats.totalContracts) * 100)}%`
                    : 'N/A'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Details Tabs */}
        <Tabs defaultValue="skills" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                {freelancer.category && freelancer.category.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {freelancer.category.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No skills listed</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent>
                {freelancer.experiences && freelancer.experiences.length > 0 ? (
                  <div className="space-y-4">
                    {freelancer.experiences.map((exp: any, idx: number) => (
                      <div key={idx} className="border-b pb-4 last:border-0">
                        <div className="flex items-start gap-2">
                          <Briefcase className="w-5 h-5 mt-1 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold">{exp.title}</h3>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                            <p className="text-sm text-muted-foreground">{exp.duration}</p>
                            {exp.description && (
                              <p className="text-sm mt-2">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No work experience listed</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                {freelancer.education && freelancer.education.length > 0 ? (
                  <div className="space-y-4">
                    {freelancer.education.map((edu: any, idx: number) => (
                      <div key={idx} className="border-b pb-4 last:border-0">
                        <h3 className="font-semibold">{edu.degree}</h3>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        <p className="text-sm text-muted-foreground">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No education listed</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                {freelancer.portfolioItems && freelancer.portfolioItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {freelancer.portfolioItems.map((item: any, idx: number) => (
                      <Card key={idx} className="overflow-hidden">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          {item.description && (
                            <CardDescription>{item.description}</CardDescription>
                          )}
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No portfolio items</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
