import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, DollarSign, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";

interface ContractData {
  type: 'contract';
  contractId: number;
  workTitle: string;
  totalAmount: number;
  contractStartDate: string;
  contractEndDate: string;
  message: string;
  contractStatus?: string;
}

interface ContractMessageProps {
  data: ContractData;
  contractId: number;
  isSender?: boolean;
}

export function ContractMessage({ data, contractId, isSender = false }: ContractMessageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [contractStatus, setContractStatus] = useState(data.contractStatus || 'draft');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleAcceptContract = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.put(
        `/contracts/${contractId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContractStatus('accepted');
      toast.success("Contract accepted! Job started.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to accept contract");
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineContract = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.put(
        `/contracts/${contractId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContractStatus('declined');
      toast.info("Contract declined");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to decline contract");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (contractStatus === 'accepted') {
      return <Badge className="bg-green-500">Accepted</Badge>;
    }
    if (contractStatus === 'declined') {
      return <Badge variant="destructive">Declined</Badge>;
    }
    if (contractStatus === 'draft') {
      return <Badge variant="secondary">Pending</Badge>;
    }
    return null;
  };

  return (
    <Card 
      className={`border-2 p-4 cursor-pointer hover:shadow-lg transition-shadow ${
        isSender ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
      }`}
      onClick={() => navigate(`/contracts?id=${contractId}`)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-base text-slate-900 break-words">
                {data.workTitle}
              </h4>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {isSender ? 'Contract Sent' : 'New Contract Received'}
            </p>
          </div>
        </div>

        {/* Contract Details */}
        <div className="space-y-2 pl-7">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-slate-700">
              <span className="font-medium">Amount:</span> {formatAmount(data.totalAmount)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-slate-700">
              <span className="font-medium">Start:</span> {formatDate(data.contractStartDate)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-slate-700">
              <span className="font-medium">End:</span> {formatDate(data.contractEndDate)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 pl-7">
          {!isSender && contractStatus === 'draft' ? (
            <div className="flex gap-2">
              <Button 
                onClick={handleAcceptContract}
                className="flex-1 sm:flex-none"
                variant="default"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Accept
              </Button>
              <Button 
                onClick={handleDeclineContract}
                className="flex-1 sm:flex-none"
                variant="outline"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Decline
              </Button>
            </div>
          ) : (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/contracts?id=${contractId}`);
              }}
              className="w-full sm:w-auto"
              variant={isSender ? "outline" : "default"}
            >
              View Contract Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
