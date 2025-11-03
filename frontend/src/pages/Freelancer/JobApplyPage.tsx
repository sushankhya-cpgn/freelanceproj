import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Coins, AlertCircle } from "lucide-react";
import { type JobPost } from "@/type/job/jobpost";
import { FREELANCER_NAV_ITEMS } from "@/constants/navigation";

const JobApplyPage: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobPost | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingConnects, setLoadingConnects] = useState(true);
  const [bid, setBid] = useState<number | "">("");
  const [coverLetter, setCoverLetter] = useState("");
  const [timeline, setTimeline] = useState("");
  const [userConnects, setUserConnects] = useState(0);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [useClientBudget, setUseClientBudget] = useState(false);

  // Fetch user's connect balance
  const fetchUserConnects = async () => {
    try {
      setLoadingConnects(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setConnectError("Please log in to view your connects");
        return;
      }

      const response = await axiosInstance.get("/connects/statistics", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setUserConnects(response.data.currentBalance || 0);
        setConnectError(null);
      } else {
        setConnectError("Failed to fetch connect balance");
      }
    } catch (err: any) {
      console.error("Error fetching connects:", err);
      setConnectError(err.response?.data?.message || "Failed to fetch connect balance");
    } finally {
      setLoadingConnects(false);
    }
  };

  // ✅ Fetch single job from API
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoadingJob(true);
        const res = await axiosInstance.get<{ success: boolean; job: JobPost }>(
          `/jobs/${jobId}`
        );
        if (res.data.success) setJob(res.data.job);
        else toast.error("Job not found");
      } catch (err) {
        toast.error("Failed to fetch job");
        console.log(err);
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
    fetchUserConnects();
  }, [jobId]);

  if (loadingJob) return <p className="text-center mt-12">Loading job...</p>;
  if (!job) return null;

  const handleSubmit = async () => {
    const plainCover = coverLetter.replace(/<[^>]*>/g, "").trim();
    if ((!useClientBudget && bid === "") || !plainCover) {
      toast.error("Please fill in all fields!");
      return;
    }
    if (userConnects < (job.connectRequired || 0)) {
      toast.error("You don't have enough connects!");
      return;
    }

    try {
      setLoadingSubmit(true);
      const token = localStorage.getItem("token");
      // decide proposed rate
      const clientBudgetValue = job.budget
        ? Number(job.budget)
        : job.minBudget
        ? Number(job.minBudget)
        : 0;

      const proposedRateToSend = useClientBudget ? clientBudgetValue : bid;

      const res = await axiosInstance.post(
        `/job-applications`,
        { 
          jobPostId: job.id,
          proposedRate: proposedRateToSend,
          coverLetter,
          proposedTimeline: timeline || "To be discussed"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.message) {
        setUserConnects((prev) => prev - (job.connectRequired || 0));
        navigate("/jobs");
      } else {
        toast.error(res.data.error || "Failed to submit proposal");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error submitting proposal");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
        <Header navItems={FREELANCER_NAV_ITEMS} showLogout />
      <main className="max-w-3xl mx-auto py-12 px-6 w-full">
        <Card className="shadow-lg rounded-2xl border border-border/60">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Submit Your Proposal
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              You are applying for <span className="font-medium">{job.title}</span>
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border border-border/30">
              <div>
                <p className="text-sm text-muted-foreground">
                  Required Connects:{" "}
                  <Badge variant="secondary" className="ml-1">
                    {job.connectRequired || 0}
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your Connects:{" "}
                  <Badge
                    variant={
                      userConnects >= (job.connectRequired || 0)
                        ? "default"
                        : "destructive"
                    }
                    className="ml-1"
                  >
                    {userConnects}
                  </Badge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  Budget Range: ${job.minBudget || 0} - ${job.maxBudget || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {job.projectDuration || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bid" className="text-sm font-medium">
                Your Bid ($)
              </Label>
              <div className="flex items-center gap-2 mb-1">
                <input
                  id="useClientBudget"
                  type="checkbox"
                  checked={useClientBudget}
                  onChange={(e) => setUseClientBudget(e.target.checked)}
                />
                <label htmlFor="useClientBudget" className="text-sm text-muted-foreground">
                  Use client's budget instead of custom bid
                </label>
              </div>
              <Input
                id="bid"
                type="number"
                placeholder="Enter your proposed amount"
                value={bid}
                onChange={(e) => setBid(e.target.value ? Number(e.target.value) : "")}
                disabled={useClientBudget}
                className="focus:ring-2 focus:ring-primary/50 transition-all"
              />
              {useClientBudget && (
                <p className="text-xs text-muted-foreground">
                  Applying with client's budget: ${job.budget || job.minBudget || 0}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter" className="text-sm font-medium">
                Cover Letter
              </Label>
              <div className="prose max-w-none">
                <CKEditor
                  editor={ClassicEditor as any}
                  data={coverLetter}
                  onChange={(_: any, editor: any) => {
                    const data = editor.getData();
                    setCoverLetter(data);
                  }}
                  onReady={(editor: any) => {
                    // Increase editor height
                    editor.editing.view.change((writer: any) => {
                      writer.setStyle('min-height', '280px', editor.editing.view.document.getRoot());
                    });
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button
                onClick={handleSubmit}
                disabled={loadingSubmit || userConnects < (job.connectRequired || 0)}
                className="min-w-[160px] transition-all"
              >
                {loadingSubmit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Proposal"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default JobApplyPage;
