import { sanitizeHtml } from "@/utils/sanitizeHtml";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/layout/Header";
import { toast } from "sonner";
import { CLIENT_NAV_ITEMS } from "@/constants/navigation";
import { 
  Loader2, 
  FileText, 
  DollarSign, 
  Calendar,
  Eye,
  Plus,
  Star
} from "lucide-react";

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
  clientRating: number | null;
  clientReview: string | null;
  ratedAt: string | null;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  freelancer: {
    id: number;
    firstName: string;
    lastName: string;
    freelancerUser: {
      id: number;
      firstName: string;
      lastName: string;
      profileImage: string | null;
      email: string;
    };
  };
  jobApplication: any;
}

const ClientContractsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [ratingContract, setRatingContract] = useState<Contract | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axiosInstance.get("/client/contracts", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const contracts = response.data.contracts || [];
      setContracts(contracts);
    } catch (err: any) {
      console.error("Error fetching contracts:", err);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const openRatingDialog = (contract: Contract) => {
    setRatingContract(contract);
    setRating(0);
    setReview("");
  };

  const submitRating = async () => {
    if (!ratingContract) return;
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmittingRating(true);
      const token = localStorage.getItem("token");
      
      await axiosInstance.post(
        `/contracts/${ratingContract.id}/rate`,
        { rating, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Rating submitted successfully!");
      
      // Update the contract in the list
      setContracts(contracts.map(c => 
        c.id === ratingContract.id 
          ? { ...c, clientRating: rating, clientReview: review, ratedAt: new Date().toISOString() }
          : c
      ));
      
      // Close the dialog
      setRatingContract(null);
      setRating(0);
      setReview("");
    } catch (err: any) {
      console.error("Error submitting rating:", err);
      toast.error(err.response?.data?.error || "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadge = (contract: Contract) => {
    // Use contractStatus if available, fallback to status
    const status = contract.contractStatus || contract.status || 'pending';
    const statusConfig: Record<string, { variant: any; label: string; color: string }> = {
      pending: { variant: "secondary", label: "Pending Review", color: "text-yellow-600" },
      draft: { variant: "secondary", label: "Sent to Freelancer", color: "text-blue-600" },
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
      <Header navItems={CLIENT_NAV_ITEMS} showLogout />

      <main className="max-w-7xl mx-auto py-8 px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Contracts</h1>
          <div className="flex gap-3">
            <Badge variant="outline">{contracts.length} Total</Badge>
            <Button onClick={() => navigate("/freelancers")}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Contract
            </Button>
          </div>
        </div>

        {contracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No contracts yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by finding talented freelancers and sending them contract offers!
              </p>
              <Button onClick={() => navigate("/freelancers")}>
                Find Freelancers
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
                            To: {contract.freelancer?.freelancerUser?.firstName || contract.freelancer?.firstName} {contract.freelancer?.freelancerUser?.lastName || contract.freelancer?.lastName}
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
                      {contract.contractStatus === 'completed' && !contract.clientRating && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openRatingDialog(contract)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Rate Freelancer
                        </Button>
                      )}
                      {contract.clientRating && (
                        <Badge variant="outline" className="text-yellow-600">
                          Rated {contract.clientRating}/5 ⭐
                        </Badge>
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

              {/* Freelancer Info */}
              <div>
                <h4 className="font-semibold mb-2">Freelancer</h4>
                <p>
                  {selectedContract.freelancer?.freelancerUser?.firstName || selectedContract.freelancer?.firstName}{' '}
                  {selectedContract.freelancer?.freelancerUser?.lastName || selectedContract.freelancer?.lastName}
                </p>
                {selectedContract.freelancer?.freelancerUser?.email && (
                  <p className="text-sm text-muted-foreground">
                    {selectedContract.freelancer.freelancerUser.email}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Project Description</h4>
                {/* Render HTML safely. In production, use a robust sanitizer like DOMPurify. */}
                <div
                  className="text-sm prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedContract.workDescription) }}
                />
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
                  <div className="bg-muted p-4 rounded-md">
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
                </div>
              )}

              {/* Terms */}
              {selectedContract.terms && (
                <div>
                  <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm">{selectedContract.terms}</p>
                  </div>
                </div>
              )}

              {/* Milestones */}
              {selectedContract.milestones && Array.isArray(selectedContract.milestones) && selectedContract.milestones.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Milestones</h4>
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    {selectedContract.milestones.map((milestone, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm">{milestone.title || `Milestone ${index + 1}`}</span>
                        <span className="text-sm font-medium">${milestone.amount || 'TBD'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rating Dialog */}
      {ratingContract && (
        <Dialog open={!!ratingContract} onOpenChange={() => setRatingContract(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rate Freelancer</DialogTitle>
              <DialogDescription>
                Rate your experience with{" "}
                {ratingContract.freelancer?.freelancerUser?.firstName || ratingContract.freelancer?.firstName}{" "}
                {ratingContract.freelancer?.freelancerUser?.lastName || ratingContract.freelancer?.lastName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {rating} out of 5 stars
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Review (Optional)</label>
                <Textarea
                  placeholder="Share your experience working with this freelancer..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRatingContract(null)}
                disabled={submittingRating}
              >
                Cancel
              </Button>
              <Button
                onClick={submitRating}
                disabled={submittingRating || rating === 0}
              >
                {submittingRating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientContractsPage;