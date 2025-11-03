import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Briefcase, Users, FileText, Loader2, Search, TrendingUp, Clock, Bell, Target, Award, BarChart3, Calendar, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AGENCY_NAV_ITEMS } from "@/constants/navigation";

export default function AgencyHomepage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [agencyProfile, setAgencyProfile] = useState<any>(null);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    activeContracts: 0,
    unreadMessages: 0,
    teamSize: 0,
    totalEarnings: 0,
    avgResponseTime: "2h",
    successRate: 95
  });

  // Fetch agency data
  const fetchAgencyData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch agency profile
      try {
        const profileResponse = await axiosInstance.get("/agencies/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAgencyProfile(profileResponse.data.agency);
      } catch (err) {
        console.log("Agency profile not found");
      }
      
      // Fetch agency's jobs
      const jobsResponse = await axiosInstance.get("/jobs/my-jobs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyJobs(jobsResponse.data.jobs || []);
      
      // Calculate stats
      const activeJobs = (jobsResponse.data.jobs || []).filter((job: any) => job.status === 'active').length;
      const totalApplications = (jobsResponse.data.jobs || []).reduce((sum: number, job: any) => sum + (job.applicationCount || 0), 0);
      
      // Fetch contracts
      const contractsResponse = await axiosInstance.get("/contracts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeContracts = (contractsResponse.data.contracts || []).filter((contract: any) => contract.contractStatus === 'active').length;
      
      setStats({
        activeJobs,
        totalApplications,
        activeContracts,
        unreadMessages: 0,
        teamSize: agencyProfile?.teamSize || 0,
        totalEarnings: 0,
        avgResponseTime: "2h",
        successRate: 95
      });
      
      // Set recent activity
      setRecentActivity([
        { type: 'application', title: 'New application received', time: '5m ago', job: jobsResponse.data.jobs?.[0]?.title },
        { type: 'contract', title: 'Contract signed', time: '1h ago', job: 'UI/UX Designer' },
        { type: 'job', title: 'Job posted', time: '2h ago', job: jobsResponse.data.jobs?.[0]?.title },
      ]);
      
    } catch (err: any) {
      console.error("Error fetching agency data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user, agencyProfile?.teamSize]);

  useEffect(() => {
    fetchAgencyData();
  }, [fetchAgencyData]);

  const statsArray = [
    { label: "Active Jobs", value: stats.activeJobs.toString(), icon: Briefcase, color: "text-blue-600", trend: "+12%", bgColor: "bg-blue-50" },
    { label: "Applications", value: stats.totalApplications.toString(), icon: Users, color: "text-green-600", trend: "+8%", bgColor: "bg-green-50" },
    { label: "Active Contracts", value: stats.activeContracts.toString(), icon: FileText, color: "text-purple-600", trend: "+5%", bgColor: "bg-purple-50" },
    { label: "Team Size", value: stats.teamSize.toString(), icon: Users, color: "text-orange-600", trend: "0%", bgColor: "bg-orange-50" },
    { label: "Success Rate", value: `${stats.successRate}%`, icon: Target, color: "text-emerald-600", trend: "+2%", bgColor: "bg-emerald-50" },
    { label: "Avg Response", value: stats.avgResponseTime, icon: Clock, color: "text-cyan-600", trend: "-15min", bgColor: "bg-cyan-50" },
  ];
  
  // Filter jobs based on selected filter
  const filteredJobs = myJobs.filter(job => {
    if (jobFilter === "all") return true;
    return job.status === jobFilter;
  }).filter(job => {
    if (!searchQuery) return true;
    return job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           job.description?.toLowerCase().includes(searchQuery.toLowerCase());
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {agencyProfile?.agencyName || `${user?.firstName} ${user?.lastName}`}!
          </h1>
          <p className="text-muted-foreground">
            Manage your agency, post jobs, and hire talented freelancers.
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statsArray.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: stat.color.replace('text-', '').includes('blue') ? '#3B82F6' : stat.color.replace('text-', '').includes('green') ? '#10B981' : stat.color.replace('text-', '').includes('purple') ? '#8B5CF6' : stat.color.replace('text-', '').includes('orange') ? '#F97316' : stat.color.replace('text-', '').includes('emerald') ? '#10B981' : '#06B6D4' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Feed & Notifications Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'application' ? 'bg-blue-100' :
                        activity.type === 'contract' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {activity.type === 'application' ? <Users className="h-4 w-4 text-blue-600" /> :
                         activity.type === 'contract' ? <FileText className="h-4 w-4 text-green-600" /> :
                         <Briefcase className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.job}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">New Messages</p>
                  <p className="text-xs text-blue-700 mt-1">3 unread conversations</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-900">Applications</p>
                  <p className="text-xs text-green-700 mt-1">{stats.totalApplications} pending reviews</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-900">Milestones Due</p>
                  <p className="text-xs text-purple-700 mt-1">2 contracts need attention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button 
            size="lg" 
            className="h-20 text-base hover:scale-105 transition-transform"
            onClick={() => navigate("/agency/jobs/new")}
          >
            <Plus className="mr-2 h-5 w-5" />
            Post Job
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="h-20 text-base hover:scale-105 transition-transform"
            onClick={() => navigate("/agency/freelancers")}
          >
            <Search className="mr-2 h-5 w-5" />
            Find Freelancers
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="h-20 text-base hover:scale-105 transition-transform"
            onClick={() => navigate("/agency/contracts")}
          >
            <FileText className="mr-2 h-5 w-5" />
            Contracts
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="h-20 text-base hover:scale-105 transition-transform"
            onClick={() => navigate("/agency/profile")}
          >
            <Award className="mr-2 h-5 w-5" />
            Profile
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="h-4 w-4" />
              My Jobs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2">
              <FileText className="h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <Users className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Your Posted Jobs</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {myJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No jobs posted yet</p>
                    <Button onClick={() => navigate("/agency/jobs/new")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Post Your First Job
                    </Button>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No jobs match your search</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredJobs.map((job) => (
                      <div 
                        key={job.id} 
                        className="border rounded-lg p-4 hover:shadow-md hover:border-primary/50 cursor-pointer transition-all group"
                        onClick={() => navigate(`/agency/jobs/${job.id}`)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{job.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {job.description}
                            </p>
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
                            <FileText className="h-4 w-4" />
                            <span>${job.budget} {job.budgetType}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                          {job.applicationCount > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="ml-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/agency/jobs/${job.id}/applications`);
                              }}
                            >
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
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Job Success Rate</span>
                      <span className="font-semibold">{stats.successRate}%</span>
                    </div>
                    <Progress value={stats.successRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Response Rate</span>
                      <span className="font-semibold">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Client Satisfaction</span>
                      <span className="font-semibold">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm">Total Jobs Posted</span>
                    <span className="text-lg font-bold">{myJobs.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm">Avg. Applications/Job</span>
                    <span className="text-lg font-bold">
                      {myJobs.length > 0 ? Math.round(stats.totalApplications / myJobs.length) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm">Active Contracts</span>
                    <span className="text-lg font-bold">{stats.activeContracts}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active contracts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agency Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {agencyProfile ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">Agency Name</h3>
                      <p className="text-muted-foreground">{agencyProfile.agencyName}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Description</h3>
                      <p className="text-muted-foreground">{agencyProfile.description || 'No description'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-1">Team Size</h3>
                        <p className="text-muted-foreground">{agencyProfile.teamSize || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Years in Business</h3>
                        <p className="text-muted-foreground">{agencyProfile.yearsInBusiness || 'Not specified'}</p>
                      </div>
                    </div>
                    <Button onClick={() => navigate("/agency/profile")}>
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Complete your agency profile</p>
                    <Button onClick={() => navigate("/agency/profile")}>
                      Create Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
