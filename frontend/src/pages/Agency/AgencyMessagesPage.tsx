import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { AGENCY_NAV_ITEMS } from "@/constants/navigation";

export default function AgencyMessagesPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.conversations || []);
    } catch (err: any) {
      console.error("Error fetching conversations:", err);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with freelancers and manage conversations
          </p>
        </div>

        {/* Messages Content */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Messages feature coming soon</p>
            <p className="text-sm text-muted-foreground">
              For now, please use the messaging feature from job applications
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
