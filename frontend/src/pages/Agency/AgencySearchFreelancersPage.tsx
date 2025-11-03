import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { Loader2, Search, Star, MapPin, Briefcase, User } from "lucide-react";
import { AGENCY_NAV_ITEMS } from "@/constants/navigation";

interface Freelancer {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  profileImage?: string;
  expertise?: string;
  shortBio?: string;
  category?: string[];
  city?: string;
  country?: string;
  hourlyRate?: number;
  availability?: string;
  freelancerUser?: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage?: string;
    email: string;
  };
  stats?: {
    completedContracts: number;
    activeContracts: number;
    avgRating: number;
    reviewsCount: number;
  };
}

export default function AgencySearchFreelancersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    location: "",
    skills: "",
    hourlyRateMin: "",
    hourlyRateMax: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalFreelancers: 0,
  });

  useEffect(() => {
    searchFreelancers();
  }, [pagination.currentPage]);

  const searchFreelancers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "12",
      });
      
      if (searchTerm.trim()) params.append("searchTerm", searchTerm.trim());
      if (filters.location.trim()) params.append("location", filters.location.trim());
      if (filters.skills.trim()) {
        const skillsArray = filters.skills.split(",").map(s => s.trim()).filter(Boolean);
        skillsArray.forEach(skill => params.append("skills[]", skill));
      }
      if (filters.hourlyRateMin) params.append("hourlyRateMin", filters.hourlyRateMin);
      if (filters.hourlyRateMax) params.append("hourlyRateMax", filters.hourlyRateMax);
      
      const response = await axiosInstance.get(`/agencies/freelancers/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFreelancers(response.data.freelancers || []);
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          totalFreelancers: response.data.pagination?.totalFreelancers || 0,
        });
      }
    } catch (err: any) {
      console.error("Error searching freelancers:", err);
      toast.error(err.response?.data?.message || "Failed to search freelancers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    searchFreelancers();
  };

  const handleViewProfile = (freelancerId: number) => {
    navigate(`/agency/freelancers/${freelancerId}`);
  };

  const handleContactFreelancer = (freelancerUserId: number) => {
    navigate(`/agencymessages?userId=${freelancerUserId}`);
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

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={AGENCY_NAV_ITEMS} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Freelancers</h1>
          <p className="text-muted-foreground">
            Search and hire talented freelancers for your agency projects
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="searchTerm">Search</Label>
                  <Input
                    id="searchTerm"
                    placeholder="Name, expertise, bio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City or country"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma separated)</Label>
                  <Input
                    id="skills"
                    placeholder="React, Node.js, Python..."
                    value={filters.skills}
                    onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hourlyRateMin">Min Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRateMin"
                    type="number"
                    placeholder="0"
                    value={filters.hourlyRateMin}
                    onChange={(e) => setFilters({ ...filters, hourlyRateMin: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hourlyRateMax">Max Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRateMax"
                    type="number"
                    placeholder="200"
                    value={filters.hourlyRateMax}
                    onChange={(e) => setFilters({ ...filters, hourlyRateMax: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Search Freelancers
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({
                      location: "",
                      skills: "",
                      hourlyRateMin: "",
                      hourlyRateMax: "",
                    });
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : freelancers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No freelancers found matching your criteria</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search filters</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Found {pagination.totalFreelancers} freelancer{pagination.totalFreelancers !== 1 ? 's' : ''}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {freelancers.map((freelancer) => {
                const displayUser = freelancer.freelancerUser || freelancer;
                const fullName = `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim();
                
                return (
                  <Card key={freelancer.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={displayUser.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser.firstName}`} />
                          <AvatarFallback>{displayUser.firstName?.[0]}{displayUser.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{fullName}</CardTitle>
                          <CardDescription className="truncate">
                            {freelancer.expertise || 'Freelancer'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {freelancer.shortBio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {freelancer.shortBio}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm">
                        {freelancer.stats && freelancer.stats.avgRating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{freelancer.stats.avgRating.toFixed(1)}</span>
                            <span className="text-muted-foreground">({freelancer.stats.reviewsCount})</span>
                          </div>
                        )}
                      </div>
                      
                      {(freelancer.city || freelancer.country) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{[freelancer.city, freelancer.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      
                      {freelancer.stats && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="w-4 h-4" />
                          <span>{freelancer.stats.completedContracts} completed projects</span>
                        </div>
                      )}
                      
                      {freelancer.category && freelancer.category.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {freelancer.category.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="secondary">{skill}</Badge>
                          ))}
                          {freelancer.category.length > 3 && (
                            <Badge variant="outline">+{freelancer.category.length - 3} more</Badge>
                          )}
                        </div>
                      )}
                      
                      {freelancer.hourlyRate && (
                        <div className="text-lg font-semibold">
                          ${freelancer.hourlyRate}/hr
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleViewProfile(freelancer.id)}
                        >
                          View Profile
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => handleContactFreelancer(displayUser.id)}
                        >
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === 1}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
