import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Calendar, DollarSign } from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { AGENCY_NAV_ITEMS } from "@/constants/navigation";

export default function AgencyContractsPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/contracts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContracts(response.data.contracts || []);
    } catch (err: any) {
      console.error("Error fetching contracts:", err);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header navItems={AGENCY_NAV_ITEMS} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={AGENCY_NAV_ITEMS} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Contracts</h1>
          <p className="text-muted-foreground">
            View and manage your contracts with freelancers
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contracts.filter(c => c.contractStatus === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contracts.filter(c => c.contractStatus === 'completed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${contracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts List */}
        {contracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No contracts found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card key={contract.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{contract.title}</CardTitle>
                        <Badge variant={getStatusColor(contract.contractStatus)}>
                          {contract.contractStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        With: {contract.Freelancer?.User?.firstName} {contract.Freelancer?.User?.lastName}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-semibold">${contract.totalAmount?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-semibold">
                          {new Date(contract.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-semibold">
                          {new Date(contract.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  {contract.description && (
                    <p className="text-sm text-muted-foreground mt-4">
                      {contract.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
