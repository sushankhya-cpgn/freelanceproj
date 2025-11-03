import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type JobPost } from "@/type/job/jobpost";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";

interface JobDetailModalProps {
  job: JobPost | null;
  open: boolean;
  onClose: () => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, open, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);

  // Reset state when modal opens/closes or job changes
  React.useEffect(() => {
    if (open && job) {
      setSuccess(false);
      setError(null);
      setHasApplied(false);
      checkIfAlreadyApplied();
    }
  }, [open, job?.id]);

  // Check if user has already applied for this job
  const checkIfAlreadyApplied = async () => {
    if (!user || !job) return;
    
    try {
      setCheckingApplication(true);
      const token = localStorage.getItem("token");
      
      // Try to get user's applications
      const response = await axiosInstance.get(`/job-applications/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // If we get applications back, check if any match this job
      if (response.data && response.data.applications) {
        const applied = response.data.applications.some(
          (app: any) => app.jobPostId === job.id
        );
        setHasApplied(applied);
      }
    } catch (err) {
      // If error, assume not applied (user can try and backend will validate)
      console.error("Error checking application status:", err);
    } finally {
      setCheckingApplication(false);
    }
  };

  if (!job) return null;

  // ✅ Handle job apply - Navigate to detailed application page
  const handleApply = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Navigate to the job application page with full form
    navigate(`/apply/${job.id}`);
  };

  // ✅ Quick apply (one-click application)
  const handleQuickApply = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const token = localStorage.getItem("token");

      const response = await axiosInstance.post(
        `/job-applications`,
        {
          jobPostId: job.id,
          proposedRate: 0, // Default rate, user can update later
          coverLetter: "Applied via job listing",
          proposedTimeline: "To be discussed"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.message) {
        setSuccess(true);
        setHasApplied(true);
      } else {
        const errorMsg = response.data.error || "Failed to apply for job";
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Something went wrong";
      setError(errorMsg);
      
      // If error is "already applied", update the state
      if (errorMsg.toLowerCase().includes('already applied')) {
        setHasApplied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{job.title}</DialogTitle>
          <DialogDescription className="text-gray-500">
            {job.location || "Remote"} • {job.experienceLevel || "Any level"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <p className="text-gray-700">{job.description}</p>

          {/* 💰 Budget Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
            <div>
              <p className="font-semibold">
                {job.budgetType === "fixed"
                  ? `$${job.budget}`
                  : `$${job.minBudget} - $${job.maxBudget}`}
              </p>
              <p className="text-sm text-gray-500 capitalize">{job.budgetType || "N/A"}</p>
            </div>
            <div>
              <p className="font-semibold">{job.experienceLevel}</p>
              <p className="text-sm text-gray-500">Experience Level</p>
            </div>
            <div>
              <p className="font-semibold">{job.projectDuration}</p>
              <p className="text-sm text-gray-500">Project Duration</p>
            </div>
            <div>
              <p className="font-semibold flex items-center gap-1">
                <Badge variant="secondary">{job.connectRequired || 0}</Badge>
              </p>
              <p className="text-sm text-gray-500">Connects Required</p>
            </div>
          </div>

          {/* 🧠 Skills */}
          {job.skills && job.skills.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Skills & Expertise</h4>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 text-gray-800 px-3 py-1 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 👤 Client Info */}
          {job.client && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">About the client</h4>
              <p className="text-gray-800">
                {job.client.firstName} {job.client.lastName}
              </p>
              <p className="text-sm text-gray-600">
                Email: <span className="font-semibold">{job.client.email}</span>
              </p>
            </div>
          )}

          {/* 🧾 Status messages */}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {success && (
            <p className="text-green-600 text-center">✅ Successfully applied for this job!</p>
          )}
          {hasApplied && !success && (
            <p className="text-blue-600 text-center">ℹ️ You have already applied for this job</p>
          )}
        </div>

        {/* 🔘 Buttons */}
        <DialogFooter className="flex justify-between gap-2 mt-6">
          <div className="flex gap-2">
            <Button 
              onClick={handleApply} 
              disabled={success || hasApplied || checkingApplication} 
              variant="default"
            >
              {hasApplied ? "Already Applied" : "Apply with Proposal"}
            </Button>
            <Button 
              onClick={handleQuickApply} 
              disabled={loading || success || hasApplied || checkingApplication} 
              variant="outline"
            >
              {checkingApplication ? "Checking..." : loading ? "Applying..." : success || hasApplied ? "Applied ✓" : "Quick Apply"}
            </Button>
          </div>
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailModal;
