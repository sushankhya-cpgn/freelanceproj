import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { Loader2, Search, MapPin, DollarSign, Clock, Briefcase } from "lucide-react";
import { AGENCY_NAV_ITEMS } from "@/constants/navigation";

interface Job {
  id: number;
  title: string;
  description: string;
  budget?: number;
  budgetType?: string;
  minBudget?: number;
  maxBudget?: number;
  skills?: string[];
  experienceLevel?: string;
  projectDuration?: string;
  location?: string;
  hireType: string;
  status: string;
  createdAt: string;
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
}

export default function AgencyJobSearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    budgetMin: "",
    budgetMax: "",
    experienceLevel: "",
    skills: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
  });

  useEffect(() => {
    searchJobs();
  }, [pagination.currentPage]);

  const searchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "12",
      });
      
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (filters.budgetMin) params.append("budgetMin", filters.budgetMin);
      if (filters.budgetMax) params.append("budgetMax", filters.budgetMax);
      if (filters.experienceLevel) params.append("experienceLevel", filters.experienceLevel);
      if (filters.skills.trim()) {
        const skillsArray = filters.skills.split(",").map(s => s.trim()).filter(Boolean);
        skillsArray.forEach(skill => params.append("skills[]", skill));
      }
      
      const response = await axiosInstance.get(`/jobs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Filter jobs to show only those where agency can apply (hireType = 'agency' or 'both')
        // and exclude jobs posted by agencies
        const filteredJobs = (response.data.jobs || []).filter((job: Job) => {
          const canApply = job.hireType === 'agency' || job.hireType === 'both';
          const isNotAgencyJob = job.client && 
            // We need to check if client is not an agency - for now we'll show all matching hireType
            true; // This would need userType on client object to filter properly
          return canApply && isNotAgencyJob;
        });
        
        setJobs(filteredJobs);
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          totalJobs: filteredJobs.length,
        });
      }
    } catch (err: any) {
      console.error("Error searching jobs:", err);
      toast.error(err.response?.data?.message || "Failed to search jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    searchJobs();
  };

  const handleViewJob = (jobId: number) => {
    navigate(`/agency/jobs/${jobId}`);
  };

  const handleApplyToJob = (jobId: number) => {
    navigate(`/agency/jobs/${jobId}/apply`);
  };

  if (!user || (user as any).userType !== 'agency') {
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
          <h1 className="text-3xl font-bold mb-2">Find Jobs</h1>
          <p className="text-muted-foreground">
            Browse and apply to client jobs that are open to agencies
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Filters</CardTitle>
            <CardDescription>Find jobs that match your agency's expertise</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="searchTerm">Search</Label>
                  <Input
                    id="searchTerm"
                    placeholder="Job title, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select
                    value={filters.experienceLevel || "all"}
                    onValueChange={(value) => setFilters({ ...filters, experienceLevel: value === "all" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any level</SelectItem>
                      <SelectItem value="entry">Entry</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="budgetMin">Min Budget ($)</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    placeholder="0"
                    value={filters.budgetMin}
                    onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Max Budget ($)</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    placeholder="10000"
                    value={filters.budgetMax}
                    onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Search Jobs
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({
                      budgetMin: "",
                      budgetMax: "",
                      experienceLevel: "",
                      skills: "",
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
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No jobs found matching your criteria</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search filters</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Found {pagination.totalJobs} job{pagination.totalJobs !== 1 ? 's' : ''} open to agencies
            </div>
            
            <div className="space-y-4 mb-8">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {job.description}
                        </CardDescription>
                      </div>
                      <Badge variant={job.hireType === 'agency' ? 'default' : 'secondary'}>
                        {job.hireType === 'agency' ? 'Agency Only' : 'Open to Agencies'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      {(job.budget || job.minBudget || job.maxBudget) && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {job.budgetType === 'range' && job.minBudget && job.maxBudget
                              ? `$${job.minBudget} - $${job.maxBudget}`
                              : job.budget
                                ? `$${job.budget}`
                                : 'Budget not specified'}
                            {job.budgetType === 'hourly' && '/hr'}
                          </span>
                        </div>
                      )}
                      
                      {job.experienceLevel && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span className="capitalize">{job.experienceLevel}</span>
                        </div>
                      )}
                      
                      {job.projectDuration && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{job.projectDuration}</span>
                        </div>
                      )}
                      
                      {job.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 5).map((skill, idx) => (
                          <Badge key={idx} variant="outline">{skill}</Badge>
                        ))}
                        {job.skills.length > 5 && (
                          <Badge variant="outline">+{job.skills.length - 5} more</Badge>
                        )}
                      </div>
                    )}
                    
                    {job.client && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Posted by</span>
                        <span className="font-medium">
                          {job.client.firstName} {job.client.lastName}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleViewJob(job.id)}
                      >
                        View Details
                      </Button>
                      <Button onClick={() => handleApplyToJob(job.id)}>
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
