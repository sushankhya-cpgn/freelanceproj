import React, { useState, useEffect } from "react";
import axiosInstance from "@/api/axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobCard from "./JobCard";
import JobDetailModal from "./JobDetailModal";
import type { JobPost } from "@/type/job/jobpost";
// import type { JobPost } from "@/data/jd";

const JobsSection: React.FC = () => {
  const [featuredJobs, setFeaturedJobs] = useState<JobPost[]>([]);
  const [urgentJobs, setUrgentJobs] = useState<JobPost[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [activeTab, setActiveTab] = useState("featured");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch jobs (featured or urgent) depending on tab
  const fetchJobs = async (type: "featured" | "urgent") => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        type === "urgent"
          ? "/jobs/urgent"
          : "/jobs";

      const response = await axiosInstance.get(endpoint);

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch jobs");
      }

      if (type === "urgent") {
        setUrgentJobs(Array.isArray(data.jobs) ? data.jobs : [data.job]);
      } else {
        setFeaturedJobs(Array.isArray(data.jobs) ? data.jobs : [data.job]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch featured jobs on mount
  useEffect(() => {
    fetchJobs("featured");
  }, []);

  // ✅ When tab changes, load corresponding jobs if not already loaded
  useEffect(() => {
    if (activeTab === "urgent" && urgentJobs.length === 0) {
      fetchJobs("urgent");
    }
  }, [activeTab]);

  const renderJobs = (jobs: JobPost[]) => {
    if (loading) return <p>Loading jobs...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (jobs.length === 0) return <p>No jobs available at the moment.</p>;

    return jobs.map((job) => (
      <div key={job.id}>
        <JobCard job={job} onViewDetails={() => setSelectedJob(job)} />
        {selectedJob?.id === job.id && (
          <JobDetailModal
            job={job}
            open={selectedJob?.id === job.id}
            onClose={() => setSelectedJob(null)}
          />
        )}
      </div>
    ));
  };

  return (
    <section id="topjobs" className="max-w-6xl mx-auto flex justify-center">
      <div className="flex w-full max-w-4xl flex-col gap-6 justify-center">
        <h2 className="border-b pb-2 text-3xl font-semibold tracking-tight">
          Jobs You Might Like
        </h2>

        <Tabs defaultValue="featured" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="urgent">Urgent</TabsTrigger>
          </TabsList>

          <TabsContent value="featured">
            {renderJobs(featuredJobs)}
          </TabsContent>

          <TabsContent value="urgent">
            {renderJobs(urgentJobs)}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default JobsSection;
