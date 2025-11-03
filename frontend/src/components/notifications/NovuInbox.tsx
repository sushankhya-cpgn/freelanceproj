import { Inbox } from '@novu/react';
import { useAuth } from '@/context/AuthContext';

export function NovuInbox() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const applicationIdentifier = import.meta.env.VITE_NOVU_APP_ID;

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={user.id.toString()}
      appearance={{
        elements: {
          bellIcon: {
            // Customize bell icon style
            width: '24px',
            height: '24px',
          },
          notificationList: {
            // Customize notification list
            maxHeight: '400px',
          },
        },
      }}
    />
  );
}
