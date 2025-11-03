import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Header from "@/components/layout/Header";
import { useNotifications } from "@/context/NotificationContext";
import { toast } from "sonner";
import { 
  Loader2, 
  FileText, 
  DollarSign, 
  Calendar,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { FREELANCER_NAV_ITEMS } from "@/constants/navigation";

interface Contract {
  id: number;
  workTitle: string;
  workDescription: string;
  totalAmount: string;
  hourlyRate: string | null;
  paymentSchedule: string;
  contractStartDate: string;
  contractEndDate: string | null;
  contractStatus: string;
  status: string;
  deliverables: string[] | string;
  terms: string | null;
  milestones: any[] | string;
  createdAt: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  freelancer: {
    firstName: string;
    lastName: string;
    freelancerUser: {
      firstName: string;
      lastName: string;
    };
  };
  jobApplication: any;
}

const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  // Check for contractId in URL parameters and open that contract
  useEffect(() => {
    const contractId = searchParams.get('id');
    if (contractId && contracts.length > 0) {
      const contract = contracts.find(c => c.id === parseInt(contractId));
      if (contract) {
        setSelectedContract(contract);
        // Clear the URL parameter
        setSearchParams({});
      }
    }
  }, [contracts, searchParams, setSearchParams]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axiosInstance.get("/contracts", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const contracts = response.data.contracts || [];
      setContracts(contracts);
      
      // Add notification if there are new contracts
      const pendingContracts = contracts.filter((c: Contract) => c.contractStatus === 'draft' || c.status === 'pending');
      if (pendingContracts.length > 0) {
        addNotification({
          type: 'info',
          title: 'New Contract Received!',
          message: `You have ${pendingContracts.length} new contract${pendingContracts.length > 1 ? 's' : ''} waiting for your review.`,
          action: {
            label: 'View Contracts',
            onClick: () => window.location.reload()
          }
        });
      }
    } catch (err: any) {
      console.error("Error fetching contracts:", err);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptContract = async (contractId: number) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      await axiosInstance.put(
        `/contracts/${contractId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success("Contract accepted successfully!");
      
      // Add notification
      addNotification({
        type: 'success',
        title: 'Contract Accepted!',
        message: `You've accepted the contract "${selectedContract?.workTitle}". The deal is now active and you can start working!`,
        action: {
          label: 'View Contract',
          onClick: () => setSelectedContract(selectedContract)
        }
      });
      
      setSelectedContract(null);
      fetchContracts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to accept contract");
      
      // Add error notification
      addNotification({
        type: 'error',
        title: 'Contract Acceptance Failed',
        message: err.response?.data?.error || 'Failed to accept contract. Please try again.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectContract = async (contractId: number) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      await axiosInstance.put(
        `/contracts/${contractId}`,
        { status: "rejected" },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success("Contract rejected");
      setSelectedContract(null);
      fetchContracts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to reject contract");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (contract: Contract) => {
    // Use contractStatus if available, fallback to status
    const status = contract.contractStatus || contract.status || 'pending';
    const statusConfig: Record<string, { variant: any; label: string; color: string }> = {
      pending: { variant: "secondary", label: "Pending Review", color: "text-yellow-600" },
      draft: { variant: "secondary", label: "Draft", color: "text-gray-600" },
      active: { variant: "default", label: "Active", color: "text-green-600" },
      completed: { variant: "outline", label: "Completed", color: "text-blue-600" },
      cancelled: { variant: "destructive", label: "Cancelled", color: "text-red-600" },
      rejected: { variant: "destructive", label: "Rejected", color: "text-red-600" },
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
      <Header navItems={FREELANCER_NAV_ITEMS} showLogout />

      <main className="max-w-7xl mx-auto py-8 px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Contracts</h1>
          <Badge variant="outline">{contracts.length} Total</Badge>
        </div>

        {contracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No contracts yet. Apply for jobs to receive contract offers!
              </p>
              <Button className="mt-4" onClick={() => navigate("/jobs")}>
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{contract.workTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            From: {contract.client.firstName} {contract.client.lastName}
                          </p>
                        </div>
                        {getStatusBadge(contract)}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {contract.totalAmount ? `$${contract.totalAmount}` : ''}
                            {contract.hourlyRate ? `$${contract.hourlyRate}/hr` : ''}
                            {contract.paymentSchedule ? ` (${contract.paymentSchedule})` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>Start: {new Date(contract.contractStartDate).toLocaleDateString()}</span>
                        </div>
                        {contract.contractEndDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>End: {new Date(contract.contractEndDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                        {contract.workDescription}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedContract(contract)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>

                      {(contract.contractStatus === "draft" || contract.status === "pending") && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAcceptContract(contract.id)}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectContract(contract.id)}
                            disabled={actionLoading}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Contract Details Dialog */}
      {selectedContract && (
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedContract.workTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Status */}
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                {getStatusBadge(selectedContract)}
              </div>

              {/* Client Info */}
              <div>
                <h4 className="font-semibold mb-2">Client</h4>
                <p>{selectedContract.client.firstName} {selectedContract.client.lastName}</p>
                <p className="text-sm text-muted-foreground">{selectedContract.client.email}</p>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Project Description</h4>
                <p className="text-sm">{selectedContract.workDescription}</p>
              </div>

              {/* Payment Details */}
              <div>
                <h4 className="font-semibold mb-2">Payment Details</h4>
                <div className="bg-muted p-4 rounded-md space-y-2">
                  {selectedContract.totalAmount && (
                    <p className="text-sm">
                      <span className="font-medium">Total Amount:</span> ${selectedContract.totalAmount}
                    </p>
                  )}
                  {selectedContract.hourlyRate && (
                    <p className="text-sm">
                      <span className="font-medium">Hourly Rate:</span> ${selectedContract.hourlyRate}/hr
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Payment Schedule:</span> {selectedContract.paymentSchedule}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Start Date:</span>{" "}
                    {selectedContract.contractStartDate ? new Date(selectedContract.contractStartDate).toLocaleDateString() : 'Not set'}
                  </p>
                  {selectedContract.contractEndDate && (
                    <p className="text-sm">
                      <span className="font-medium">End Date:</span>{" "}
                      {new Date(selectedContract.contractEndDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Deliverables */}
              {selectedContract.deliverables && (
                <div>
                  <h4 className="font-semibold mb-2">Deliverables</h4>
                  {Array.isArray(selectedContract.deliverables) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {selectedContract.deliverables.map((item, index) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">{selectedContract.deliverables}</p>
                  )}
                </div>
              )}

              {/* Terms */}
              {selectedContract.terms && (
                <div>
                  <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedContract.terms}</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              {selectedContract.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectContract(selectedContract.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
                  </Button>
                  <Button
                    onClick={() => handleAcceptContract(selectedContract.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept Contract"}
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setSelectedContract(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ContractsPage;

