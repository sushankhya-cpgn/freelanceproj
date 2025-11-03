import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, Edit, Trash2, Users } from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AGENCY_NAV_ITEMS } from "@/constants/navigation";

export default function AgencyJobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/jobs/my-jobs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyJobs(response.data.jobs || []);
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Job deleted successfully");
      fetchMyJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete job");
    }
  };

  const filteredJobs = myJobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header navItems={AGENCY_NAV_ITEMS} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={AGENCY_NAV_ITEMS} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Jobs</h1>
            <p className="text-muted-foreground">
              Manage your job postings and view applications
            </p>
          </div>
          <Button onClick={() => navigate("/client/postjob")}>
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({myJobs.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
          >
            Active ({myJobs.filter(j => j.status === 'active').length})
          </Button>
          <Button
            variant={filter === 'closed' ? 'default' : 'outline'}
            onClick={() => setFilter('closed')}
          >
            Closed ({myJobs.filter(j => j.status === 'closed').length})
          </Button>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No jobs found</p>
              <Button onClick={() => navigate("/client/postjob")}>
                <Plus className="mr-2 h-4 w-4" />
                Post Your First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                        {job.hireType && (
                          <Badge variant="outline">
                            Hiring: {job.hireType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{job.applicationCount || 0} Applications</span>
                      </div>
                      <div>
                        <span className="font-semibold">
                          ${job.budget?.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {job.budgetType}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobapplications/${job.id}`)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Applications
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/client/postjob?edit=${job.id}`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
