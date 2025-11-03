  const currency = (n?: number | string | null) => {
    if (n == null || n === '') return '';
    const x = typeof n === 'string' ? Number(n) : n;
    if (Number.isNaN(x)) return '';
    return `$${x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const wageText = (job?: JobSummary) => {
    if (!job) return '';
    if (job.budgetType === 'range') {
      return `${currency(job.minBudget)} - ${currency(job.maxBudget)}`;
    }
    if (job.budgetType === 'hourly') {
      return `${currency(job.budget)} / hr`;
    }
    if (job.budgetType === 'fixed') {
      return `${currency(job.budget)} fixed`;
    }
    if (job.salary) return `${currency(job.salary)} salary`;
    return '';
  };

  const descSnippet = (d?: string) => {
    if (!d) return '';
    const t = d.replace(/<[^>]+>/g, '');
    return t.length > 120 ? t.slice(0, 120) + '…' : t;
  };

import React, { useEffect, useState } from "react";
import axiosInstance from "@/api/axios";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FREELANCER_NAV_ITEMS } from "@/constants/navigation";

interface JobSummary {
  id?: number;
  title?: string;
  description?: string;
  budget?: number | string;
  budgetType?: 'fixed' | 'hourly' | 'range' | null;
  minBudget?: number | string | null;
  maxBudget?: number | string | null;
  salary?: number | string | null;
  client?: { id?: number; firstName?: string; lastName?: string; email?: string };
}

interface ContractInfo {
  id: number;
  workTitle: string;
  totalAmount: number;
  contractStatus: string;
  contractStartDate: string;
  contractEndDate?: string;
}

interface ApplicationItem {
  id: number;
  status?: string;
  jobPostId?: number;
  createdAt?: string;
  job?: JobSummary; // legacy
  jobPost?: JobSummary; // backend includes as 'jobPost'
  contract?: ContractInfo; // contract associated with this application
}

const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApplicationItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchApps = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get("/job-applications/my-applications", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: { page: 1, limit: 50 },
        });
        const data = res.data;
        const list: ApplicationItem[] = Array.isArray(data.applications)
          ? data.applications
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.items)
          ? data.items
          : [];
        setApps(list);
      } catch (e: any) {
        setError(e?.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const openDetails = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get(`/job-applications/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const app: ApplicationItem = res.data?.application || res.data?.data || res.data;
      
      // Check if there's a contract for this application
      try {
        const contractRes = await axiosInstance.get(`/contracts?jobApplicationId=${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const contracts = contractRes.data?.contracts || [];
        if (contracts.length > 0) {
          app.contract = contracts[0]; // Get the first contract for this application
        }
      } catch (contractErr) {
        console.log('No contract found for this application');
      }
      
      setSelected(app);
      setModalError(null);
    } catch (e) {
      console.error(e);
    }
  };

  // status edit is disabled for freelancers; reserved for clients

  const removeApplication = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axiosInstance.put(
        `/job-applications/${selected.id}/withdraw`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      setSelected(null);
      await fetchApps();
    } catch (e: any) {
      console.error(e);
      const apiMsg = e?.response?.data?.error || e?.message || "Failed to withdraw";
      // If already withdrawn, refresh and close
      if (typeof apiMsg === 'string' && /already withdrawn/i.test(apiMsg)) {
        await fetchApps();
        setSelected(null);
        return;
      }
      setModalError(apiMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={FREELANCER_NAV_ITEMS} showLogout />

      <div className="container mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl font-semibold">My Applications</h1>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && apps.length === 0 && (
          <p className="text-muted-foreground">You have not applied to any jobs yet.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((a) => {
            const jp = a.jobPost || a.job;
            const title = jp?.title || `Job #${a.jobPostId ?? ""}`;
            const clientName = jp?.client ? `${jp.client.firstName ?? ''} ${jp.client.lastName ?? ''}`.trim() : '';
            const wages = wageText(jp || undefined);
            const snippet = descSnippet(jp?.description);
            return (
              <Card key={a.id} className="cursor-pointer" onClick={() => openDetails(a.id)}>
                <CardContent className="p-4">
                  <div className="font-medium">{title}</div>
                  {clientName && (
                    <div className="text-sm text-muted-foreground">Client: {clientName}</div>
                  )}
                  {wages && (
                    <div className="text-sm text-muted-foreground">Wages: {wages}</div>
                  )}
                  {snippet && (
                    <div className="text-sm text-muted-foreground mt-1">{snippet}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">Status: {a.status || "submitted"}</div>
                  {a.createdAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Applied on {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border rounded-md w-full max-w-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Application #{selected.id}</h2>
                <button onClick={() => setSelected(null)} className="text-sm underline">Close</button>
              </div>
              <div className="space-y-2">
                <div className="text-lg font-medium">{selected.jobPost?.title || selected.job?.title || `Application #${selected.id}`}</div>
                {(() => {
                  const jp = selected.jobPost || selected.job;
                  const clientName = jp?.client ? `${jp.client.firstName ?? ''} ${jp.client.lastName ?? ''}`.trim() : '';
                  const wages = wageText(jp || undefined);
                  return (
                    <>
                      {clientName && <div className="text-sm text-muted-foreground">Client: {clientName}</div>}
                      {wages && <div className="text-sm text-muted-foreground">Wages: {wages}</div>}
                      {jp?.description && <div className="text-sm mt-1">{descSnippet(jp.description)}</div>}
                    </>
                  );
                })()}
                
                {/* Contract Information Section */}
                {selected.contract && (
                  <div className="mt-4 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Contract Received</h3>
                      <Badge 
                        className={
                          selected.contract.contractStatus === 'active' 
                            ? 'bg-green-500' 
                            : selected.contract.contractStatus === 'declined'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }
                      >
                        {selected.contract.contractStatus}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-medium text-blue-900">{selected.contract.workTitle}</div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">
                          <span className="font-medium">Amount:</span> ${selected.contract.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">
                          <span className="font-medium">Start:</span> {new Date(selected.contract.contractStartDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {selected.contract.contractEndDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">
                            <span className="font-medium">End:</span> {new Date(selected.contract.contractEndDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        <Button 
                          onClick={() => navigate(`/contracts?id=${selected.contract!.id}`)}
                          className="w-full"
                          variant="default"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          View Contract Details
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {modalError && (
                  <div className="text-sm text-red-600">{modalError}</div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="destructive" onClick={removeApplication} disabled={saving}>
                    {saving ? "Removing..." : "Withdraw"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;
