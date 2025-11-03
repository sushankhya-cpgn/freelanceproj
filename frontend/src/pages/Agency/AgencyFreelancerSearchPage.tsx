import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, DollarSign, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AGENCY_NAV_ITEMS } from "@/constants/navigation";

export default function AgencyFreelancerSearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    skills: "",
    minRate: "",
    maxRate: "",
    location: "",
  });

  const handleSearch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filters.skills) params.append("skills", filters.skills);
      if (filters.minRate) params.append("minRate", filters.minRate);
      if (filters.maxRate) params.append("maxRate", filters.maxRate);
      if (filters.location) params.append("location", filters.location);
      
      const response = await axiosInstance.get(`/agencies/freelancers/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFreelancers(response.data.freelancers || []);
    } catch (err: any) {
      console.error("Error searching freelancers:", err);
      toast.error("Failed to search freelancers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={AGENCY_NAV_ITEMS} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Freelancers</h1>
          <p className="text-muted-foreground">
            Search and connect with talented freelancers
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Search by name, title, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Skills (e.g., React, Node.js)"
                  value={filters.skills}
                  onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Min Rate ($/hr)"
                  value={filters.minRate}
                  onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max Rate ($/hr)"
                  value={filters.maxRate}
                  onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                />
                <Input
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading && freelancers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : freelancers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No freelancers found. Try adjusting your search criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freelancers.map((freelancer) => (
              <Card key={freelancer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white text-2xl font-bold">
                      {freelancer.User?.firstName?.[0]}{freelancer.User?.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {freelancer.User?.firstName} {freelancer.User?.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{freelancer.title || "Freelancer"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {freelancer.bio || "No bio available"}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {freelancer.hourlyRate && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${freelancer.hourlyRate}/hr</span>
                      </div>
                    )}
                    {freelancer.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{freelancer.location}</span>
                      </div>
                    )}
                    {freelancer.stats?.totalEarnings && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span>${freelancer.stats.totalEarnings.toLocaleString()} earned</span>
                      </div>
                    )}
                  </div>

                  {freelancer.skills && freelancer.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {freelancer.skills.slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {freelancer.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{freelancer.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/freelancerprofile/${freelancer.id}`)}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
