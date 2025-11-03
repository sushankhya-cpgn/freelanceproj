import { useEffect, useState } from 'react';
import { Inbox } from '@novu/react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';

export function NovuInbox() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscriberId, setSubscriberId] = useState<string | null>(null);
  const appId = import.meta.env.VITE_NOVU_APP_ID || "";
  const backendUrl = import.meta.env.VITE_NOVU_BACKEND_URL || "https://api.novu.co";
  const socketUrl = import.meta.env.VITE_NOVU_SOCKET_URL || "https://ws.novu.co";

  useEffect(() => {
    try {
      if (user && (user as any).id) {
        setSubscriberId(String((user as any).id));
      } else {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u && u.id) setSubscriberId(u.id.toString());
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, [user]);

  // Don't render until we have subscriber ID
  if (!subscriberId) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!appId) {
    return null; // cannot render inbox without app id
  }

  return (
    <Inbox
      applicationIdentifier={appId}
      subscriberId={subscriberId as string}
      routerPush={(path) => navigate(path)}
      backendUrl={backendUrl}
      socketUrl={socketUrl}
      appearance={{
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorPrimaryForeground: 'hsl(var(--primary-foreground))',
          colorBackground: 'hsl(var(--background))',
          colorForeground: 'hsl(var(--foreground))',
          colorNeutral: 'hsl(var(--muted))',
        },
      }}
      onNotificationClick={(notification) => {
        if (notification.data?.jobPostId) {
          navigate(`/jobs/${notification.data.jobPostId}`);
        }
      }}
    />
  );
}