import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Briefcase, Users, MessageSquare, FileText, Search, Loader2, TrendingUp, Clock, DollarSign, Star, Target, CheckCircle2, Filter, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FreelancerSearch } from "@/components/client/FreelancerSearch";
import { JobPostForm } from "@/components/client/JobPostForm";
import { MessagingInterface } from "@/components/client/MessagingInterface";
import { ContractForm } from "@/components/client/ContractForm";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
// import { useNotifications } from "@/context/NotificationContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { CLIENT_NAV_ITEMS } from "@/constants/navigation";

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // const { addNotification } = useNotifications();
  
  const [showJobPostForm, setShowJobPostForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);
  
  // Dynamic state
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [savedFreelancers, setSavedFreelancers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [jobFilter, setJobFilter] = useState("all");
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    activeContracts: 0,
    unreadMessages: 0,
    totalSpent: 0,
    avgProjectCost: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch client data
  const fetchClientData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch client's jobs
      const jobsResponse = await axiosInstance.get("/jobs/my-jobs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyJobs(jobsResponse.data.jobs || []);
      
      // Calculate stats from jobs
      const activeJobs = (jobsResponse.data.jobs || []).filter((job: any) => job.status === 'active').length;
      const totalApplications = (jobsResponse.data.jobs || []).reduce((sum: number, job: any) => sum + (job.applicationCount || 0), 0);
      
      // Fetch contracts
      const contractsResponse = await axiosInstance.get("/contracts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeContracts = (contractsResponse.data.contracts || []).filter((contract: any) => contract.contractStatus === 'active').length;
      
      // Fetch unread messages count
      const messagesResponse = await axiosInstance.get("/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unreadMessages = (messagesResponse.data.conversations || []).reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
      
      setStats({
        activeJobs,
        totalApplications,
        activeContracts,
        unreadMessages,
        totalSpent: 0,
        avgProjectCost: 0,
        completionRate: 85
      });
      
      // Mock data for saved freelancers and activity
      setSavedFreelancers([
        { id: 1, name: 'John Doe', skills: ['React', 'Node.js'], rating: 4.8 },
        { id: 2, name: 'Jane Smith', skills: ['UI/UX', 'Figma'], rating: 4.9 },
      ]);
      
      setRecentActivity([
        { type: 'job', title: 'New job posted', time: '2h ago', detail: jobsResponse.data.jobs?.[0]?.title },
        { type: 'application', title: 'Application received', time: '5h ago', detail: 'Full Stack Developer' },
        { type: 'message', title: 'New message', time: '1d ago', detail: 'From John Doe' },
      ]);
      
    } catch (err: any) {
      console.error("Error fetching client data:", err);
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  // Dynamic stats array with enhanced metrics
  const statsArray = [
    { label: "Active Jobs", value: stats.activeJobs.toString(), icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-50", trend: "+3" },
    { label: "Applications", value: stats.totalApplications.toString(), icon: Users, color: "text-green-600", bgColor: "bg-green-50", trend: "+12" },
    { label: "Active Contracts", value: stats.activeContracts.toString(), icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50", trend: "+2" },
    { label: "Messages", value: stats.unreadMessages.toString(), icon: MessageSquare, color: "text-orange-600", bgColor: "bg-orange-50", trend: "0" },
    { label: "Total Spent", value: `$${stats.totalSpent}`, icon: DollarSign, color: "text-emerald-600", bgColor: "bg-emerald-50", trend: "+$2.5k" },
    { label: "Completion Rate", value: `${stats.completionRate}%`, icon: Target, color: "text-cyan-600", bgColor: "bg-cyan-50", trend: "+5%" },
  ];
  
  // Filter jobs
  const filteredJobs = myJobs.filter(job => {
    if (jobFilter === "all") return true;
    return job.status === jobFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header navItems={CLIENT_NAV_ITEMS} showLogout />

      {/* Hero Section */}
      <section className="py-16 text-center bg-gradient-to-br from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Find the Perfect Freelancer</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with thousands of talented professionals ready to bring your projects to life
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <div className="flex w-full max-w-md items-center space-x-2">
              <Input 
                type="search"
                placeholder="Search for skills, designers, developers..." 
                className="bg-card border-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const searchValue = (e.target as HTMLInputElement).value;
                    if (searchValue.trim()) {
                      window.location.href = `/freelancers?search=${encodeURIComponent(searchValue)}`;
                    }
                  }
                }}
              />
              <Button
                onClick={(e) => {
                  const searchInput = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  if (searchInput?.value.trim()) {
                    window.location.href = `/freelancers?search=${encodeURIComponent(searchInput.value)}`;
                  }
                }}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={() => setShowJobPostForm(true)} size="lg" className="shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Post a Job
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Cards */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {loading ? (
            // Loading state
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                  <div className="h-4 bg-muted animate-pulse rounded w-16 mb-2"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-20"></div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            // Error state
            <Card className="col-span-full">
              <CardContent className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="mt-2"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Enhanced stats with trends
            statsArray.map((stat) => (
              <Card key={stat.label} className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: stat.color.replace('text-', '').includes('blue') ? '#3B82F6' : stat.color.replace('text-', '').includes('green') ? '#10B981' : stat.color.replace('text-', '').includes('purple') ? '#8B5CF6' : stat.color.replace('text-', '').includes('orange') ? '#F97316' : stat.color.replace('text-', '').includes('emerald') ? '#10B981' : '#06B6D4' }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Saved Freelancers & Activity Section */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saved Freelancers */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Saved Freelancers
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/freelancers")}>View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {savedFreelancers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">No saved freelancers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedFreelancers.map((freelancer) => (
                    <div key={freelancer.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
                          {freelancer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{freelancer.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {freelancer.skills.slice(0, 2).map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{freelancer.rating}</span>
                        </div>
                        <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[220px]">
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                      <div className={`p-2 rounded-full h-fit ${
                        activity.type === 'job' ? 'bg-blue-100' :
                        activity.type === 'application' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {activity.type === 'job' ? <Briefcase className="h-4 w-4 text-blue-600" /> :
                         activity.type === 'application' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                         <MessageSquare className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.detail}</p>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-muted">
            <TabsTrigger value="browse" className="data-[state=active]:bg-card">
              <Users className="w-4 h-4 mr-2" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-card">
              <Briefcase className="w-4 h-4 mr-2" />
              My Jobs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-card">
              <Target className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="contracts" className="data-[state=active]:bg-card">
              <FileText className="w-4 h-4 mr-2" />
              Contracts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-0">
            <FreelancerSearch
              onHireFreelancer={(freelancer) => {
                setSelectedFreelancer(freelancer);
                setShowContractForm(true);
              }}
            />
          </TabsContent>

          <TabsContent value="jobs" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Your Posted Jobs</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={jobFilter} onValueChange={setJobFilter}>
                      <SelectTrigger className="w-32">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowJobPostForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Post Job
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  // Loading state
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="h-6 bg-muted animate-pulse rounded w-48 mb-3"></div>
                        <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  // Error state
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
                  </div>
                ) : myJobs.length === 0 ? (
                  // Empty state
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No jobs posted yet</h3>
                    <p className="text-muted-foreground mb-6">Start by posting your first job</p>
                    <Button onClick={() => setShowJobPostForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Your First Job
                    </Button>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No jobs match your filter</p>
                  </div>
                ) : (
                  // Jobs list
                  <div className="space-y-3">
                    {filteredJobs.map((job) => (
                      <div 
                        key={job.id} 
                        className="border rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all group cursor-pointer"
                        onClick={() => window.location.href = `/job-applications/${job.id}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{job.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{job.description}</p>
                          </div>
                          <Badge variant={job.status === 'active' ? 'default' : job.status === 'draft' ? 'secondary' : 'outline'}>
                            {job.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{job.applicationCount || 0} applications</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>${job.budget}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                          {job.applicationCount > 0 && (
                            <Button size="sm" variant="outline" className="ml-auto" onClick={(e) => e.stopPropagation()}>
                              View Applications
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Analytics Tab */}
          <TabsContent value="analytics" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-semibold">{stats.completionRate}%</span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">On-Time Delivery</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Satisfaction Score</span>
                      <span className="font-semibold">4.7/5.0</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm">Avg. Response Time</span>
                    <span className="text-lg font-bold">2.4h</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm">Projects Completed</span>
                    <span className="text-lg font-bold">{Math.floor(myJobs.length * 0.6)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm">Avg. Project Budget</span>
                    <span className="text-lg font-bold">${stats.avgProjectCost}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FreelancePro. Built for businesses.
      </footer>

      <JobPostForm
        open={showJobPostForm}
        onClose={() => setShowJobPostForm(false)}
      />

      <ContractForm
        open={showContractForm}
        freelancer={selectedFreelancer}
        onClose={() => {
          setShowContractForm(false);
          setSelectedFreelancer(null);
        }}
      />
    </div>
  );
}
