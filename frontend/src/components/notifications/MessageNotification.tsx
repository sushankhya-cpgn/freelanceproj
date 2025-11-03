import React, { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Notification {
  id: number;
  type: "message" | "application" | "contract";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  senderId?: number;
  senderName?: string;
}

interface MessageNotificationProps {
  userType?: "freelancer" | "client";
}

const MessageNotification: React.FC<MessageNotificationProps> = ({ userType = "freelancer" }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("MessageNotification: No token found");
        return;
      }

      console.log("MessageNotification: Fetching notifications...");

      // Fetch unread conversations
      const conversationsResponse = await axiosInstance.get("/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("MessageNotification: API Response:", conversationsResponse.data);

      const conversations = conversationsResponse.data.conversations || [];
      console.log("MessageNotification: Conversations:", conversations);
      
      // Create notifications from conversations with unread messages
      const messageNotifications: Notification[] = conversations
        .filter((conv: any) => conv.unreadCount > 0)
        .map((conv: any) => ({
          id: conv.id,
          type: "message" as const,
          title: "New Message",
          message: `${conv.otherUser?.firstName || "Someone"} sent you a message`,
          isRead: false,
          createdAt: conv.lastMessageAt || new Date().toISOString(),
          senderId: conv.otherUser?.id,
          senderName: `${conv.otherUser?.firstName} ${conv.otherUser?.lastName}`
        }));

      console.log("MessageNotification: Message notifications:", messageNotifications);
      console.log("MessageNotification: Unread count:", messageNotifications.length);

      setNotifications(messageNotifications);
      setUnreadCount(messageNotifications.length);
    } catch (err) {
      console.error("MessageNotification: Error fetching notifications:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === "message" && notification.senderId) {
      // Navigate to messages with the sender
      const messagePath = userType === "client" ? "/clientmessages" : "/messages";
      navigate(`${messagePath}?userId=${notification.senderId}`);
      
      // Mark as read (remove from notifications)
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = () => {
    setNotifications([]);
    setUnreadCount(0);
    toast.success("All notifications cleared");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {notification.type === "message" && (
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default MessageNotification;

