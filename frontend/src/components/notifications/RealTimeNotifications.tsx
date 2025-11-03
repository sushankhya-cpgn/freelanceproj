import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import centrifugoService from '@/services/centrifugo';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const RealTimeNotifications: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const enabled = (import.meta as any).env?.VITE_CENTRIFUGO_ENABLED === 'true';
  const initializedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<number | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const [incomingCall, setIncomingCall] = useState<null | {
    roomName: string;
    callerName: string;
    callerId: number;
  }>(null);
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
      const appId = ENV.VITE_JITSI_APP_ID;
      const pathPrefix = appId ? `/vpaas-magic-cookie-${appId}` : '';
      let token = providedJwt as string | undefined;
      if (!token) {
        const resp = await fetch(`/api/jitsi/token?room=${encodeURIComponent(room)}&moderator=${moderator}&userName=${encodeURIComponent(`${user?.firstName || ''} ${user?.lastName || ''}`.trim())}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
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
    const base = baseDomain.replace(/\/$/, '');
    return `${base}/${encodeURIComponent(room)}#config.prejoinPageEnabled=${prejoinEnabled}&config.prejoinConfig.enabled=${prejoinEnabled}`;
  };

  const openJitsiInNewTab = async (room: string, moderator: boolean, delayMs = 0) => {
    try {
      // For meet.jit.si or self-hosted domains, open directly (no delay-induced blank tab)
      if (!isJaasDomain) {
        const baseDomain = jitsiDomain.includes('://') ? jitsiDomain : `https://${jitsiDomain}`;
        const base = baseDomain.replace(/\/$/, '');
        const url = `${base}/${encodeURIComponent(room)}#config.prejoinPageEnabled=${prejoinEnabled}&config.prejoinConfig.enabled=${prejoinEnabled}`;
        window.open(url, '_blank', 'noopener');
        return;
      }

      // JAAS: open a blank tab immediately, then navigate after token/delay
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

  // Try to unlock AudioContext on first user interaction (required on Safari/iOS)
  // Unlock audio function (can be called by user gesture or programmatically from a click handler)
  const unlockAudio = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current!;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Play a 1-frame silent buffer to fully unlock on iOS
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
      setAudioUnlocked(true);
      console.log('🔊 Audio context unlocked for ringtones');
      // If a call is already incoming, retry starting ringtone now that audio is unlocked
      if (incomingCall) {
        startRingtone();
      }
      return true;
    } catch (e) {
      console.warn('⚠️ Failed to unlock audio context:', e);
      return false;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handleFirstGesture = async () => {
      const ok = await unlockAudio();
      if (ok) {
        window.removeEventListener('pointerdown', handleFirstGesture);
        window.removeEventListener('keydown', handleFirstGesture);
        window.removeEventListener('touchstart', handleFirstGesture);
      }
    };

    // Attach listeners once; will auto-remove after first successful unlock
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [enabled]);

  // Simple WebAudio ringtone (no external assets)
  const startRingtone = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => {});
      }
      // If audio is not yet unlocked by user interaction, this may still be blocked
      stopRingtone();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, audioCtx.currentTime); // ring tone freq
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;

      // Pulse the ring: 1s on, 1s off
      const ringOn = () => {
        if (!audioCtxRef.current || !gainRef.current) return;
        const t = audioCtxRef.current.currentTime;
        gainRef.current.gain.cancelScheduledValues(t);
        gainRef.current.gain.setTargetAtTime(0.15, t, 0.01);
        // quick chirp
        setTimeout(() => {
          if (!audioCtxRef.current || !gainRef.current) return;
          const t2 = audioCtxRef.current.currentTime;
          gainRef.current.gain.setTargetAtTime(0.0, t2, 0.02);
        }, 800);
      };

      ringOn();
      ringIntervalRef.current = window.setInterval(ringOn, 1200);
    } catch (e) {
      // Autoplay may be blocked; ignore silently
      console.warn('Ringtone could not start (likely autoplay blocked).');
    }
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    try {
      gainRef.current?.disconnect();
    } catch {}
    try {
      oscRef.current?.stop();
      oscRef.current?.disconnect();
    } catch {}
    gainRef.current = null;
    oscRef.current = null;
  };

  useEffect(() => {
    if (!user || !enabled) return;
    if (!centrifugoService.isRealtimeEnabled() || centrifugoService.isSessionDisabled()) return;
    if (initializedRef.current) return;

    console.log('🔔 Setting up real-time notifications for user:', user.id);

    // Connect to Centrifugo and subscribe to user notifications
    const setupNotifications = async () => {
      try {
        if (!centrifugoService.isConnected()) {
          console.log('🔔 Attempting to connect to Centrifugo for user:', user.id);
          await centrifugoService.connect(user.id.toString());
        }
        
        // Subscribe to user notifications
        const sub = centrifugoService.subscribeToUserNotifications(
          user.id.toString(),
          (notificationData) => {
            console.log('🔔 Real-time notification received:', notificationData);
            console.log('🔔 Notification type:', notificationData.type);
            
            // Handle different types of notifications
            if (notificationData.type === 'contract_notification') {
              console.log('📋 Processing contract notification:', notificationData);
              const contractData = notificationData.data;
              
              console.log('📋 Contract data:', contractData);
              console.log('📋 Adding notification to UI...');
              
              addNotification({
                type: 'info',
                title: contractData.title,
                message: contractData.message,
                action: {
                  label: 'View Contract',
                  onClick: () => {
                    navigate('/contracts');
                  }
                }
              });
              
              console.log('✅ Contract notification added to UI');
            } else if (notificationData.type === 'message_notification') {
              console.log('💬 Processing message notification:', notificationData);
              const messageData = notificationData.data;
              
              console.log('💬 Message from:', messageData.sender);
              console.log('💬 Message content preview:', messageData.content?.substring(0, 50));
              console.log('💬 Adding toast notification...');
              
              // Navigate to correct messages page based on user type
              const messagesPath = user.userType === 'client' ? '/clientmessages' : '/messages';
              // Try to detect video call invitation
              try {
                if (messageData.messageType === 'video_call' && typeof messageData.content === 'string') {
                  const payload = JSON.parse(messageData.content);
                  if (payload?.type === 'video_call_invitation' && payload?.roomName) {
                    console.log('📞 Incoming video call detected');
                    setIncomingCall({
                      roomName: payload.roomName,
                      callerName: payload.callerName || `${messageData.sender?.firstName || 'Someone'}`,
                      callerId: Number(payload.callerId ?? messageData.senderId)
                    });
                    // Attempt to start ringtone (may be blocked by autoplay)
                    startRingtone();
                    return; // Don't add generic message toast
                  }
                }
              } catch (e) {
                console.warn('Failed to parse message content for call invite');
              }

              // Fallback: regular message notification
              addNotification({
                type: 'info',
                title: 'New Message',
                message: `You have a new message from ${messageData.sender?.firstName || 'Someone'}`,
                action: {
                  label: 'View Messages',
                  onClick: () => {
                    navigate(messagesPath);
                  }
                }
              });
              console.log('✅ Message notification toast added');
            } else {
              console.log('⚠️ Unknown notification type:', notificationData.type);
              console.log('⚠️ Full notification data:', notificationData);
            }
          }
        );
        if (!sub) return; // no logs if disabled/deferred
      } catch (error) {
        console.error('❌ Failed to setup real-time notifications:', error);
      }
    };

    // Avoid double-init in React StrictMode
    setupNotifications();
    initializedRef.current = true;

    // Cleanup on unmount
    return () => {
      if (user) {
        centrifugoService.unsubscribeFromUserNotifications(user.id.toString());
        centrifugoService.disconnect();
      }
      stopRingtone();
      initializedRef.current = false;
    };
  }, [user, addNotification, navigate, enabled]);

  const handleAcceptCall = () => {
    if (!incomingCall || !user) return;
    stopRingtone();
    if (openInNewTab) {
      // Apply delay only for JAAS where moderator sequencing matters; meet.jit.si can join immediately
      const delayMs = isJaasDomain ? 1500 : 0;
      openJitsiInNewTab(incomingCall.roomName, false, delayMs);
      // Optionally, still navigate to the conversation without auto-opening modal
      const messagesPath = user.userType === 'client' ? '/clientmessages' : '/messages';
      navigate(`${messagesPath}?userId=${incomingCall.callerId}`);
    } else {
      const messagesPath = user.userType === 'client' ? '/clientmessages' : '/messages';
      // Navigate to messages, open caller conversation, and auto-open video modal
      navigate(`${messagesPath}?userId=${incomingCall.callerId}&startVideo=1&room=${encodeURIComponent(incomingCall.roomName)}`);
    }
    setIncomingCall(null);
  };

  const handleDeclineCall = () => {
    stopRingtone();
    setIncomingCall(null);
  };

  return (
    <>
      {/* Incoming call dialog */}
      <Dialog open={!!incomingCall} onOpenChange={(open) => {!open && handleDeclineCall();}}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Incoming video call</DialogTitle>
            <DialogDescription>
              {incomingCall ? `${incomingCall.callerName || 'Someone'} is calling you…` : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={handleDeclineCall}>Decline</Button>
            <Button onClick={handleAcceptCall}>Answer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proactive audio unlock prompt */}
      {enabled && !audioUnlocked && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            background: 'var(--background, #fff)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: 12,
            maxWidth: 320
          }}
        >
          <div style={{ marginBottom: 8, fontSize: 14, color: 'var(--muted-foreground, #374151)' }}>
            Enable ringtone for incoming calls.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setAudioUnlocked(true)}>Dismiss</Button>
            <Button onClick={unlockAudio}>Enable ringtone</Button>
          </div>
        </div>
      )}
    </>
  );
};
