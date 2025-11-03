import React, { useEffect, useState } from "react";
import axiosInstance from "@/api/axios";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Briefcase } from "lucide-react";

interface MyJobItem {
  id: number;
  title: string;
  description?: string;
  budget?: number;
  budgetType?: string;
  status?: string;
  applicationCount?: number;
  createdAt?: string;
}

const ClientApplicationsList: React.FC = () => {
  const [jobs, setJobs] = useState<MyJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nav = [
    { label: "Freelancer Search", href: "/freelancers" },
    { label: "Applications", href: "/client/applications" },
    { label: "Messages", href: "/clientmessages" },
  ];

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get("/jobs/my-jobs", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: { page: 1, limit: 50 },
        });
        const list: MyJobItem[] = res.data?.jobs || [];
        setJobs(list);
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const plain = (html?: string) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={nav} showLogout />

      <main className="max-w-7xl mx-auto py-8 px-6 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">My Posted Jobs</h1>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="h-6 bg-muted animate-pulse rounded w-48" />
                </CardHeader>
                <CardContent>
                  <div className="h-12 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center text-red-600">{error}</CardContent>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <div className="text-muted-foreground">You haven't posted any jobs yet.</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="group hover:shadow-sm transition">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <Badge variant={job.status === "active" ? "default" : "secondary"}>
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground line-clamp-2 max-w-3xl">
                      {plain(job.description)}
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Users className="w-4 h-4" />
                      <span className="text-sm text-muted-foreground">
                        {job.applicationCount || 0} applications
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={() => (window.location.href = `/job-applications/${job.id}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientApplicationsList;
