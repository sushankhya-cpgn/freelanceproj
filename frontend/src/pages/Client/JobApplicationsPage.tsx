import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/layout/Header";
import { useNotifications } from "@/context/NotificationContext";
import { toast } from "sonner";
import { 
  Loader2, 
  MessageCircle, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
  Calendar
} from "lucide-react";
import { CLIENT_NAV_ITEMS } from "@/constants/navigation";

interface Applicant {
  id: number;
  userId: number;
  jobPostId: number;
  proposedRate: number;
  coverLetter: string;
  proposedTimeline: string;
  status: string;
  appliedAt: string;
  applicant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
  };
}

interface JobPost {
  id: number;
  title: string;
  description: string;
  budget: number;
  budgetType: string;
  status: string;
}

const JobApplicationsPage: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  const [job, setJob] = useState<JobPost | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  useEffect(() => {
    fetchJobAndApplicants();
  }, [jobId]);

  const fetchJobAndApplicants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch job details
      const jobResponse = await axiosInstance.get(`/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJob(jobResponse.data.job);

      // Fetch applications for this job
      const applicationsResponse = await axiosInstance.get(
        `/job-applications/job/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const applications = applicationsResponse.data.applications || [];
      setApplicants(applications);
      
      // Add notification if there are new applications
      if (applications.length > 0) {
        addNotification({
          type: 'info',
          title: 'New Job Applications',
          message: `You have ${applications.length} application${applications.length > 1 ? 's' : ''} for "${jobResponse.data.job?.title}". Review them to find the right freelancer.`,
          action: {
            label: 'View Applications',
            onClick: () => window.location.reload()
          }
        });
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = (applicant: Applicant) => {
    const targetId = applicant.userId || applicant.applicant?.id;
    if (!targetId) {
      console.error('No applicant userId available');
      return;
    }
    navigate(`/clientmessages?userId=${targetId}`);
  };

  const handleSendContract = (applicant: Applicant) => {
    const targetId = applicant.userId || applicant.applicant?.id;
    if (!targetId) {
      console.error('No applicant userId available for contract');
      return;
    }
    navigate(`/contracts/create?jobId=${jobId}&freelancerId=${targetId}&applicationId=${applicant.id}`);
  };

  const handleStatusUpdate = async (applicationId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.put(
        `/job-applications/${applicationId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(`Application ${newStatus}`);
      fetchJobAndApplicants(); // Refresh list
    } catch (err: any) {
      toast.error("Failed to update application status");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      reviewed: { variant: "default", label: "Reviewed" },
      shortlisted: { variant: "default", label: "Shortlisted" },
      accepted: { variant: "default", label: "Accepted" },
      rejected: { variant: "destructive", label: "Rejected" },
      withdrawn: { variant: "outline", label: "Withdrawn" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={CLIENT_NAV_ITEMS} showLogout />
      
      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Job Header */}
        {job && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{job.title}</CardTitle>
              <p className="text-muted-foreground">{job.description}</p>
              <div className="flex gap-4 mt-4">
                <Badge variant="secondary">
                  ${job.budget} {job.budgetType}
                </Badge>
                <Badge variant="outline">{job.status}</Badge>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Applications List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Applications ({applicants.length})
            </h2>
          </div>

          {applicants.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No applications yet for this job.
                </p>
              </CardContent>
            </Card>
          ) : (
            applicants.map((applicant) => (
              <Card key={applicant.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    {/* Applicant Info */}
                    <div className="flex gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>
                          {applicant.applicant.firstName[0]}
                          {applicant.applicant.lastName[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {applicant.applicant.firstName} {applicant.applicant.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {applicant.applicant.email}
                        </p>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4" />
                            <span>Proposed Rate: ${applicant.proposedRate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>Timeline: {applicant.proposedTimeline}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>
                              Applied: {new Date(applicant.appliedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Cover Letter:</p>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                            {applicant.coverLetter}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col gap-3 items-end">
                      {getStatusBadge(applicant.status)}

                      <div className="flex flex-col gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChat(applicant)}
                          className="w-full"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>

                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSendContract(applicant)}
                          className="w-full"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Send Contract
                        </Button>

                        {applicant.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(applicant.id, "shortlisted")}
                              className="w-full"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Shortlist
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(applicant.id, "rejected")}
                              className="w-full"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default JobApplicationsPage;

