import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Search, Briefcase, DollarSign, Star, TrendingUp, Award, 
  Clock, Target, FileText, CheckCircle2, Users,
  MessageSquare, Loader2, BookmarkPlus, Zap
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { FREELANCER_NAV_ITEMS } from "@/constants/navigation";

function Homepage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [activeApplications, setActiveApplications] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeProposals: 0,
    completedJobs: 0,
    successRate: 0,
    profileViews: 0,
    responseRate: 0,
    avgRating: 0,
    availableJobs: 0
  });

  // Fetch freelancer dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch applications
      const applicationsResponse = await axiosInstance.get("/job-applications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveApplications(applicationsResponse.data.applications || []);
      
      // Fetch contracts/jobs
      const contractsResponse = await axiosInstance.get("/contracts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const completedJobs = (contractsResponse.data.contracts || []).filter(
        (contract: any) => contract.contractStatus === 'completed'
      ).length;
      
      // Fetch recommended jobs
      const jobsResponse = await axiosInstance.get("/jobs/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 5 }
      });
      setRecommendedJobs(jobsResponse.data.jobs || []);
      
      setStats({
        totalEarnings: 0,
        activeProposals: (applicationsResponse.data.applications || []).filter(
          (app: any) => app.status === 'pending'
        ).length,
        completedJobs,
        successRate: 85,
        profileViews: 124,
        responseRate: 92,
        avgRating: 4.7,
        availableJobs: (jobsResponse.data.jobs || []).length
      });
      
      // Mock recent activity
      setRecentActivity([
        { type: 'application', title: 'Applied to Web Development Project', time: '2h ago' },
        { type: 'view', title: 'Your profile was viewed', time: '5h ago' },
        { type: 'message', title: 'New message from client', time: '1d ago' },
      ]);
      
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statsArray = [
    { label: "Total Earnings", value: `$${stats.totalEarnings}`, icon: DollarSign, color: "text-emerald-600", bgColor: "bg-emerald-50", trend: "+$0" },
    { label: "Active Proposals", value: stats.activeProposals.toString(), icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50", trend: `+${stats.activeProposals}` },
    { label: "Completed Jobs", value: stats.completedJobs.toString(), icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50", trend: `+${stats.completedJobs}` },
    { label: "Success Rate", value: `${stats.successRate}%`, icon: Target, color: "text-purple-600", bgColor: "bg-purple-50", trend: "+5%" },
    { label: "Profile Views", value: stats.profileViews.toString(), icon: Users, color: "text-orange-600", bgColor: "bg-orange-50", trend: "+24" },
    { label: "Avg. Rating", value: stats.avgRating.toFixed(1), icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-50", trend: "+0.2" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header navItems={FREELANCER_NAV_ITEMS} showLogout />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={FREELANCER_NAV_ITEMS} showLogout />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your freelance journey today.
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statsArray.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: stat.color.replace('text-', '').includes('emerald') ? '#10B981' : stat.color.replace('text-', '').includes('blue') ? '#3B82F6' : stat.color.replace('text-', '').includes('green') ? '#10B981' : stat.color.replace('text-', '').includes('purple') ? '#8B5CF6' : stat.color.replace('text-', '').includes('orange') ? '#F97316' : '#EAB308' }}>
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

        {/* Quick Job Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for jobs, skills, or keywords..."
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button size="lg" onClick={() => navigate("/freelancer/jobs")}>
                <Search className="h-4 w-4 mr-2" />
                Find Jobs
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/freelancer/applications")}>
                <FileText className="h-4 w-4 mr-2" />
                My Proposals
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity & Recommended Jobs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                      <div className={`p-2 rounded-full h-fit ${
                        activity.type === 'application' ? 'bg-blue-100' :
                        activity.type === 'view' ? 'bg-purple-100' : 'bg-green-100'
                      }`}>
                        {activity.type === 'application' ? <FileText className="h-4 w-4 text-blue-600" /> :
                         activity.type === 'view' ? <Users className="h-4 w-4 text-purple-600" /> :
                         <MessageSquare className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recommended Jobs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recommended for You
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/freelancer/jobs")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                {recommendedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No jobs available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendedJobs.slice(0, 4).map((job) => (
                      <div 
                        key={job.id} 
                        className="border rounded-lg p-4 hover:shadow-md hover:border-primary/50 cursor-pointer transition-all group"
                        onClick={() => navigate(`/freelancer/jobs/${job.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
                            {job.title}
                          </h3>
                          <Badge variant="secondary">
                            ${job.budget}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {job.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {job.applicationCount || 0} proposals
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="proposals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="proposals" className="gap-2">
              <FileText className="h-4 w-4" />
              My Proposals
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Target className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2">
              <Award className="h-4 w-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <BookmarkPlus className="h-4 w-4" />
              Saved Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                {activeApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">No active proposals</p>
                    <Button onClick={() => navigate("/freelancer/jobs")}>
                      <Search className="h-4 w-4 mr-2" />
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeApplications.map((application) => (
                      <div key={application.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{application.jobTitle || 'Job Application'}</h3>
                          <Badge variant={
                            application.status === 'accepted' ? 'default' :
                            application.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {application.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Applied {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-semibold">{stats.successRate}%</span>
                    </div>
                    <Progress value={stats.successRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Response Rate</span>
                      <span className="font-semibold">{stats.responseRate}%</span>
                    </div>
                    <Progress value={stats.responseRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Profile Completion</span>
                      <span className="font-semibold">80%</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Earnings Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm">This Month</span>
                    <span className="text-lg font-bold">$0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm">Last Month</span>
                    <span className="text-lg font-bold">$0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm">All Time</span>
                    <span className="text-lg font-bold">${stats.totalEarnings}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">Complete your profile to showcase your skills</p>
                  <Button onClick={() => navigate("/freelancer/profile")}>
                    Update Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Saved Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookmarkPlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No saved jobs yet</p>
                  <Button onClick={() => navigate("/freelancer/jobs")}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Homepage;