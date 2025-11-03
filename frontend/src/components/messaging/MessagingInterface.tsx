import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, X, FileText, Download, Loader2, Video } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Virtuoso } from "react-virtuoso";
import axiosInstance from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import centrifugoService from "@/services/centrifugo";
import { ContractMessage } from "./ContractMessage";
import { VideoCallModal } from "./VideoCallModal";
import { VideoCallInvitation } from "./VideoCallInvitation";

interface Message {
  id: number | string;
  sender: "me" | "them";
  text: string;
  time: string;
  files?: { 
    filename?: string;
    originalName?: string;
    name?: string;
    type?: string;
    mimetype?: string;
    url: string;
    size?: number;
  }[];
  messageType?: 'text' | 'image' | 'file' | 'contract' | 'video_call';
  contractId?: number;
  content?: string; // Raw content for contract messages
}

interface Conversation {
  id: number;
  name: string;
  img: string;
  messages: Message[];
  userType?: "freelancer" | "client" | "agency" | "admin";
}

export function MessagingInterface() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserId = searchParams.get("userId");
  const startVideo = searchParams.get("startVideo");
  const startRoom = searchParams.get("room");
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoomName, setVideoCallRoomName] = useState("");
  const ENV: any = (import.meta as any).env || {};
  const configuredDomain: string = ENV.VITE_JITSI_DOMAIN || 'meet.jit.si';
  const providedJwt: string | undefined = ENV.VITE_JITSI_JWT;
  const isJaasDomain = /(^|\.)8x8\.vc$|jaas/.test(configuredDomain);
  const jitsiDomain = (isJaasDomain && !providedJwt) ? 'meet.jit.si' : configuredDomain;
  // Default to opening in a new tab unless explicitly disabled
  const openInNewTab = ENV.VITE_JITSI_OPEN_IN_NEW_TAB !== 'false';
  const prejoinEnabled = ENV.VITE_JITSI_PREJOIN_ENABLED === 'true';

  const buildJitsiUrl = async (room: string, moderator: boolean): Promise<string> => {
    const baseDomain = jitsiDomain.includes('://') ? jitsiDomain : `https://${jitsiDomain}`;
    if (isJaasDomain) {
      const appId = ENV.VITE_JITSI_APP_ID; // required for JAAS path prefix
      const pathPrefix = appId ? `/vpaas-magic-cookie-${appId}` : '';
      let token = providedJwt as string | undefined;
      if (!token) {
        // Fetch a short-lived token from backend
        const resp = await fetch(`/api/jitsi/token?room=${encodeURIComponent(room)}&moderator=${moderator}&userName=${encodeURIComponent(`${user?.firstName || ''} ${user?.lastName || ''}`.trim())}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (resp.ok) {
          const data = await resp.json();
          token = data.token;
        } else {
          console.error('Failed to fetch JAAS token:', await resp.text());
        }
      }
      const base = `${baseDomain.replace(/\/$/, '')}${pathPrefix}`;
      const jwtQuery = token ? `?jwt=${encodeURIComponent(token)}` : '';
      return `${base}/${encodeURIComponent(room)}${jwtQuery}#config.prejoinPageEnabled=${prejoinEnabled}&config.prejoinConfig.enabled=${prejoinEnabled}`;
    }
    // meet.jit.si or self-hosted Jitsi
    const base = baseDomain.replace(/\/$/, '');
    return `${base}/${encodeURIComponent(room)}#config.prejoinPageEnabled=${prejoinEnabled}&config.prejoinConfig.enabled=${prejoinEnabled}`;
  };

  // Open in new tab with popup-safety: if delayed, open a blank tab synchronously then navigate later
  const openJitsiInNewTab = async (room: string, moderator: boolean, delayMs = 0) => {
    try {
      // For meet.jit.si or self-hosted domains, build URL synchronously and open immediately
      if (!isJaasDomain) {
        const baseDomain = jitsiDomain.includes('://') ? jitsiDomain : `https://${jitsiDomain}`;
        const base = baseDomain.replace(/\/$/, '');
        const url = `${base}/${encodeURIComponent(room)}#config.prejoinPageEnabled=${prejoinEnabled}&config.prejoinConfig.enabled=${prejoinEnabled}`;
        window.open(url, '_blank', 'noopener');
        return;
      }

      // JAAS: open a blank tab immediately (user gesture), then navigate after token is ready
      const win = window.open('about:blank', '_blank', 'noopener');
      try {
        if (win && !win.closed) {
          win.document.write('<!doctype html><title>Joining…</title><body style="font-family:sans-serif;padding:24px">Joining your call…</body>');
        }
      } catch {}

      const nav = async () => {
        try {
          const url = await buildJitsiUrl(room, moderator);
          if (win && !win.closed) win.location.href = url;
        } catch (e) {
          console.error('Failed to navigate Jitsi window:', e);
          try { if (win && !win.closed) win.close(); } catch {}
        }
      };

      if (delayMs > 0) {
        window.setTimeout(nav, delayMs);
      } else {
        nav();
      }
    } catch (e) {
      console.error('Failed to open Jitsi URL:', e);
    }
  };

  const centrifugoEnabled = (import.meta as any).env?.VITE_CENTRIFUGO_ENABLED === 'true';
  const hasInitialized = useRef(false);
  const urlProcessed = useRef(false);

  // Show loading initially if user is not loaded yet
  useEffect(() => {
    if (!user) {
      setLoadingConversations(true);
    }
  }, []);

  // 🚀 Fetch conversations when component mounts
  useEffect(() => {
    if (user && !hasInitialized.current) {
      console.log('🚀 Initializing messaging for user:', user.id);
      console.log('🔧 Centrifugo enabled:', centrifugoEnabled);
      console.log('🔧 Centrifugo URL:', (import.meta as any).env?.VITE_CENTRIFUGO_URL);
      hasInitialized.current = true;
      fetchAllConversations();
      
      // Connect to Centrifugo WebSocket if enabled
      if (centrifugoEnabled) {
        console.log('🔌 Attempting to connect to Centrifugo...');
        centrifugoService.connect(user.id.toString()).then(() => {
          // Subscribe to user channel for contract notifications
          console.log('📡 Subscribing to user channel for notifications');
          centrifugoService.subscribeToUserNotifications(user.id.toString(), (notification: any) => {
            console.log('🔔 User notification received:', notification);
            if (notification.type === 'contract_notification') {
              // Refresh conversations to show new contract message
              console.log('📨 Contract notification received, refreshing conversations');
              fetchAllConversations();
              toast.success(notification.data.title, {
                description: notification.data.message
              });
            }
          });
        }).catch(err => {
          console.error("❌ Failed to connect to Centrifugo:", err);
          toast.error("Failed to connect to real-time messaging");
        });
      } else {
        console.warn('⚠️ Centrifugo is disabled - real-time updates will not work');
      }
    }

    // Cleanup: DON'T disconnect - keep connection alive for app-wide messaging
    // Connection will be closed when user logs out or app unmounts
    return () => {
      // Only unsubscribe from current conversation, don't disconnect
      if (selectedConversationId && user) {
        console.log('🔕 Cleaning up conversation subscriptions');
      }
    };
  }, [user]);

  // If userId is provided in URL, open that conversation (only once)
  useEffect(() => {
    if (targetUserId && user && conversations.length > 0 && !urlProcessed.current) {
      console.log(`🔗 Opening conversation from URL: ${targetUserId}`);
      urlProcessed.current = true;
      const parsedId = parseInt(targetUserId);
      initiateConversationWithUser(parsedId).then(() => {
        // If request came from incoming call, auto-open modal
        if (startVideo === '1' && typeof startRoom === 'string' && startRoom.length > 0) {
          console.log('🎥 Auto-opening video modal from URL params');
          setVideoCallRoomName(startRoom);
          setShowVideoCall(true);
        }
        // Clear the URL parameter after using it
        setSearchParams({});
      });
    } else if (!selectedConversationId && conversations.length > 0 && !targetUserId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [targetUserId, conversations.length, user]);

  // 🔔 Subscribe to real-time messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId && user && centrifugoEnabled) {
      console.log('🔔 Subscribing to real-time messages for conversation:', selectedConversationId);
      console.log('🔔 Current user ID:', user.id, 'Other user ID:', selectedConversationId);
      console.log('🔔 Is Centrifugo connected?', centrifugoService.isConnected());
      
      // Subscribe to this conversation
      centrifugoService.subscribeToConversation(
        user.id.toString(),
        selectedConversationId.toString(),
        (messageData) => {
          console.log('📨 Real-time message received:', messageData);
          console.log('📨 Message for conversation:', messageData.senderId, '<->', messageData.receiverId);
          console.log('📨 Current selected conversation:', selectedConversationId);
          
          // Determine which conversation this message belongs to
          const otherUserId = messageData.senderId === user.id ? messageData.receiverId : messageData.senderId;
          console.log('📨 Message belongs to conversation with user:', otherUserId);
          
          // Prevent duplicate messages and handle optimistic message replacement
          setConversations(prev =>
            prev.map(c => {
              // Match by the other user's ID
              if (c.id === otherUserId) {
                // Check if real message with this ID already exists
                const realMessageExists = c.messages.some(m => 
                  typeof m.id === 'number' && m.id === messageData.id
                );
                
                if (realMessageExists) {
                  console.log('⚠️ Real message already exists, skipping');
                  return c;
                }
                
                console.log(`✅ Adding message to conversation ${c.id}`);
                
                // Handle system messages (contract status updates)
                if (messageData.type === 'system' && messageData.messageType === 'contract_status') {
                  const systemMessage: Message = {
                    id: Date.now(),
                    sender: "them", // System messages appear on the other side
                    text: messageData.content,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    messageType: 'text', // System messages are text, not contract
                    contractId: messageData.contractId,
                    content: messageData.content
                  };
                  toast.success(messageData.content);
                  
                  // Refetch messages to update contract statuses
                  setTimeout(() => {
                    fetchMessageHistory(otherUserId);
                  }, 1000);
                  
                  return { ...c, messages: [...c.messages, systemMessage] };
                }
                
                const newMessage: Message = {
                  id: messageData.id || Date.now(),
                  sender: messageData.senderId === user.id ? "me" : "them",
                  text: messageData.content,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  messageType: messageData.messageType || 'text',
                  contractId: messageData.contractId,
                  content: messageData.content,
                  files: messageData.attachments && messageData.attachments.length > 0 ? messageData.attachments : undefined
                };
                
                // Remove any optimistic message with same content (temp IDs start with 'temp_')
                const filteredMessages = c.messages.filter(m => 
                  !(typeof m.id === 'string' && m.id.startsWith('temp_') && 
                    m.text === messageData.content && 
                    m.sender === newMessage.sender)
                );
                
                return { ...c, messages: [...filteredMessages, newMessage] };
              }
              return c;
            })
          );

          // Silent notification - no toast popup
          // Messages appear instantly in the UI without popup notification
        }
      );

      // Cleanup: Don't unsubscribe immediately, keep subscription active
      // Only unsubscribe when component unmounts or user logs out
    }
  }, [selectedConversationId, user, centrifugoEnabled]);

  const fetchAllConversations = async () => {
    try {
      console.log("📥 Fetching conversations...");
      setLoadingConversations(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("❌ No token found");
        toast.error("Please login to view messages");
        setLoadingConversations(false);
        return;
      }
      
      const response = await axiosInstance.get("/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("✅ Fetched conversations:", response.data);

      const apiConversations = response.data.conversations || [];
      
      // Transform API conversations to UI format
      const formattedConversations: Conversation[] = apiConversations.map((conv: any) => ({
        id: conv.otherUser.id,
        name: `${conv.otherUser.firstName} ${conv.otherUser.lastName}`,
        img: `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.firstName}`,
        messages: [], // Will be loaded when conversation is selected
        userType: conv.otherUser.userType || conv.otherUser.role // Include user type for navigation logic
      }));

      setConversations(formattedConversations);
      console.log("✅ Set conversations:", formattedConversations.length);
      
      // If no conversation is selected and we have conversations, select the first one
      if (!selectedConversationId && formattedConversations.length > 0) {
        setSelectedConversationId(formattedConversations[0].id);
        fetchMessageHistory(formattedConversations[0].id);
      }
    } catch (err: any) {
      console.error("❌ Error fetching conversations:", err);
      console.error("❌ Error details:", err.response?.data);
      toast.error(err.response?.data?.error || "Failed to load conversations");
    } finally {
      console.log("✅ Loading complete");
      setLoadingConversations(false);
    }
  };

  const initiateConversationWithUser = async (userId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch user details
      console.log(`📥 Fetching user details for userId: ${userId}`);
      const userResponse = await axiosInstance.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ User response:`, userResponse.data);
      const targetUser = userResponse.data.data?.user || userResponse.data.user || userResponse.data.data || userResponse.data;
      console.log(`👤 Target user:`, targetUser);
      
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.id === userId);
      
      if (existingConv) {
        console.log(`✅ Conversation exists for user ${userId}, selecting it`);
        setSelectedConversationId(existingConv.id);
        // Fetch latest messages even if conversation exists
        fetchMessageHistory(userId);
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          id: userId,
          name: `${targetUser.firstName} ${targetUser.lastName}`,
          img: `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.firstName}`,
          messages: [],
          userType: targetUser.userType || targetUser.role // Include user type for navigation logic
        };
        
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversationId(userId);
        
        // Fetch message history
        fetchMessageHistory(userId);
      }
    } catch (err: any) {
      console.error("Error initiating conversation:", err);
      toast.error("Failed to start conversation");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageHistory = async (userId: number) => {
    try {
      console.log(`📥 Fetching message history for user ${userId}...`);
      const token = localStorage.getItem("token");
      // Fetch last 100 messages instead of default 50
      const response = await axiosInstance.get(`/messages/conversation/${userId}?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Received ${response.data.messages?.length || 0} messages from API`);
      
      if (response.data.messages) {
        const formattedMessages: Message[] = response.data.messages.map((msg: any) => ({
          id: msg.id,
          sender: msg.senderId === user?.id ? "me" : "them",
          text: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString(),
          messageType: msg.messageType || 'text',
          contractId: msg.contractId,
          content: msg.content, // Keep raw content for contract messages
          files: msg.attachments && msg.attachments.length > 0 ? msg.attachments : undefined
        }));
        
        console.log(`📨 Formatted messages:`, formattedMessages.map(m => ({ id: m.id, text: m.text.substring(0, 30), sender: m.sender })));
        
        setConversations(prev => prev.map(conv => 
          conv.id === userId ? { ...conv, messages: formattedMessages } : conv
        ));
        
        console.log(`✅ Messages added to conversation ${userId}`);
        
        // Mark messages as read
        await axiosInstance.put(
          `/messages/mark-read`,
          { senderId: userId },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...newFiles]);
    e.target.value = ''; // Reset input to allow re-selecting same files
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 📤 Send message via API (backend will broadcast via Centrifugo)
  const sendVideoCallInvitation = async (roomName: string) => {
    if (!selectedConversationId || !user) return;

    try {
      const token = localStorage.getItem("token");
      await axiosInstance.post(
        '/messages',
        {
          receiverId: selectedConversationId,
          content: JSON.stringify({
            type: 'video_call_invitation',
            roomName,
            callerName: `${user.firstName} ${user.lastName}`,
            callerId: user.id
          }),
          messageType: 'video_call'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success("Video call invitation sent");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send video call invitation");
    }
  };

  const sendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (!selectedConversationId) return;

    // Add optimistic message for immediate feedback
    const optimisticMsg: Message = {
      id: `temp_${Date.now()}`, // Use string ID to distinguish from real messages
      sender: "me",
      text: message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      messageType: attachments.length > 0 ? 'file' : 'text',
      files: attachments.length > 0 ? attachments.map(f => ({
        name: f.name,
        type: f.type,
        url: URL.createObjectURL(f)
      })) : undefined
    };
    
    setConversations(prev => prev.map(conv =>
      conv.id === selectedConversationId
        ? { ...conv, messages: [...conv.messages, optimisticMsg] }
        : conv
    ));    try {
      const token = localStorage.getItem("token");
      
      // Use FormData if files are attached
      if (attachments.length > 0) {
        const formData = new FormData();
        formData.append('receiverId', selectedConversationId.toString());
        formData.append('content', message || ''); // Content can be empty if only files
        
        // Append all files
        attachments.forEach(file => {
          formData.append('files', file);
        });
        
        await axiosInstance.post('/messages', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Send JSON for text-only messages
        await axiosInstance.post(
          '/messages',
          {
            receiverId: selectedConversationId,
            content: message
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
      
      // Centrifugo will broadcast to receiver and sender for real-time sync
      // The optimistic message will be replaced by the real message from broadcast
    } catch (err: any) {
      console.error('❌ Error sending message:', err);
      toast.error(err.response?.data?.error || "Failed to send message");
      
      // Remove optimistic message on error
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversationId
          ? { ...conv, messages: conv.messages.filter(m => m.id !== optimisticMsg.id) }
          : conv
      ));
    } finally {
      setMessage("");
      setAttachments([]);
    }
  };

  // Virtuoso handles auto-scrolling with followOutput="auto" and alignToBottom
  // No manual scroll handling needed

  // Show loading if still loading or user not available
  if (!user || loading || loadingConversations) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0 && !loadingConversations) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No conversations yet</p>
          <p className="text-sm text-muted-foreground">Send a message to start a conversation</p>
        </div>
      </div>
    );
  }

  if (!selectedConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 h-full p-4 max-w-full overflow-hidden">
      {/* Conversations List */}
      <Card className="md:col-span-1 flex flex-col h-full overflow-hidden min-w-0">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {conversations.map(conversation => {
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              return (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-accent transition rounded-md ${
                    selectedConversationId === conversation.id ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    console.log(`🔄 Selecting conversation ${conversation.id}, current messages: ${conversation.messages.length}`);
                    setSelectedConversationId(conversation.id);
                    // Always fetch latest messages when selecting a conversation
                    fetchMessageHistory(conversation.id);
                  }}
                >
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={conversation.img} />
                    <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{conversation.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage?.messageType === 'contract' ? (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Contract sent
                        </span>
                      ) : (
                        lastMessage?.text || (lastMessage?.files && `${lastMessage.files.length} file${lastMessage.files.length > 1 ? 's' : ''}`)
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{lastMessage?.time}</span>
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-2 flex flex-col overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedConversation.img} />
                <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
              </Avatar>
              <CardTitle>{selectedConversation.name}</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const userId = Number(user!.id);
                const otherUserId = selectedConversationId!;
                // Use a unique room per call attempt to avoid stale lobby/membersOnly state
                const roomName = `worklab-call-${Math.min(userId, otherUserId)}-${Math.max(userId, otherUserId)}-${Date.now()}`;
                setVideoCallRoomName(roomName);
                if (openInNewTab) {
                  openJitsiInNewTab(roomName, true, 0);
                } else {
                  setShowVideoCall(true);
                }
                
                // Send video call invitation message
                sendVideoCallInvitation(roomName);
              }}
              className="flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Start Video Call
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
          <Virtuoso
            data={selectedConversation.messages}
            style={{ height: '100%', padding: '1rem' }}
            followOutput="auto"
            alignToBottom
            itemContent={(_index, msg) => (
              <div
                className={`flex mb-4 ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                {msg.messageType === 'contract' && msg.content && msg.contractId ? (
                  <div className="max-w-[70%] min-w-0">
                    <ContractMessage 
                      data={JSON.parse(msg.content)} 
                      contractId={msg.contractId}
                      isSender={msg.sender === "me"}
                    />
                  </div>
                ) : msg.messageType === 'video_call' && msg.content ? (
                  <div className="max-w-[70%]">
                    <VideoCallInvitation
                      data={JSON.parse(msg.content)}
                      isSender={msg.sender === "me"}
                      onJoinCall={(roomName) => {
                        setVideoCallRoomName(roomName);
                        if (openInNewTab) {
                          // If this user is the receiver (not the sender), delay join slightly
                          const isSender = msg.sender === 'me';
                          // Apply delay only for JAAS to let caller become moderator; not needed for meet.jit.si here
                          const delayMs = (!isJaasDomain || isSender) ? 0 : 1500;
                          openJitsiInNewTab(roomName, isSender, delayMs);
                        } else {
                          setShowVideoCall(true);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className={`max-w-[70%] min-w-0 rounded-lg p-3 relative word-wrap break-words ${
                    msg.sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <>
                      {msg.files && msg.files.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {msg.files.map((file, index) => {
                            const fileType = file.type || file.mimetype || '';
                            const fileName = file.name || file.originalName || 'file';
                            const isImage = fileType.startsWith('image/');
                            
                            return (
                              <div key={index} className="flex flex-col gap-2">
                                {isImage ? (
                                  <div className="relative">
                                    <img src={file.url} alt={fileName} className="max-h-40 rounded-lg max-w-full" />
                                    <div className="flex items-center justify-between bg-muted rounded p-2 mt-1">
                                      <span className="truncate text-xs text-blue-500 flex-1 min-w-0">{fileName}</span>
                                      <a
                                        href={file.url}
                                        download={fileName}
                                        className="ml-2 text-blue-500 text-sm flex items-center gap-1 flex-shrink-0"
                                      >
                                        <Download className="w-4 h-4" />
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between bg-muted rounded p-2 min-w-0">
                                    <FileText className="mr-2 flex-shrink-0" />
                                    <span className="truncate text-blue-500 flex-1 min-w-0">{fileName}</span>
                                    <a
                                      href={file.url}
                                      download={fileName}
                                      className="ml-2 text-blue-500 text-sm flex-shrink-0"
                                    >
                                      Download
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-sm break-words">{msg.text}</p>
                      <span className={`text-xs mt-1 block ${
                        msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>{msg.time}</span>
                    </>
                  </div>
                )}
              </div>
            )}
          />

          <div className="border-t p-4 flex-shrink-0">
            <div className="flex gap-2 items-center flex-wrap min-w-0">
              <label htmlFor="attachment" className="cursor-pointer flex-shrink-0">
                <Button asChild variant="outline" size="icon">
                  <span>
                    <Paperclip className="w-4 h-4" />
                  </span>
                </Button>
              </label>
              <input
                type="file"
                id="attachment"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 min-w-0">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted p-1 px-2 rounded min-w-0">
                      <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeAttachment(index)} className="flex-shrink-0">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 min-w-0"
              />
              <Button onClick={sendMessage} className="flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Call Modal */}
      {showVideoCall && (
        <VideoCallModal
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          roomName={videoCallRoomName}
          userName={`${user?.firstName} ${user?.lastName}`}
          conversationId={selectedConversationId || undefined}
          onCallEnd={() => {
            setShowVideoCall(false);
            toast.info("Call ended");
          }}
        />
      )}
    </div>
  );
}
