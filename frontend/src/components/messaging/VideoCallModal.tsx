import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor,
  MonitorOff,
  Loader2,
  FileText,
  X
} from "lucide-react";
import { JitsiMeeting } from '@jitsi/react-sdk';
import { toast } from "sonner";
import { CallNotesPanel } from "./CallNotesPanel";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  userName: string;
  conversationId?: number;
  onCallEnd?: () => void;
}

export function VideoCallModal({ 
  isOpen, 
  onClose, 
  roomName, 
  userName,
  conversationId,
  onCallEnd 
}: VideoCallModalProps) {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJitsiLoaded, setIsJitsiLoaded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const jitsiApiRef = useRef<any>(null);

  // Resolve Jitsi domain with safe fallback if a JAAS domain is configured without JWT
  const ENV: any = (import.meta as any).env || {};
  const configuredDomain: string = ENV.VITE_JITSI_DOMAIN || 'meet.jit.si';
  const providedJwt: string | undefined = ENV.VITE_JITSI_JWT;
  const isJaasDomain = /(^|\.)8x8\.vc$|jaas/.test(configuredDomain);
  const jitsiDomain = (isJaasDomain && !providedJwt) ? 'meet.jit.si' : configuredDomain;
  const prejoinEnabled = ENV.VITE_JITSI_PREJOIN_ENABLED === 'true';
  const disableThirdParty = ENV.VITE_JITSI_DISABLE_THIRD_PARTY !== 'false'; // default true
  const jaasAppId: string | undefined = ENV.VITE_JITSI_APP_ID;
  const effectiveRoomName = (isJaasDomain && jaasAppId)
    ? `vpaas-magic-cookie-${jaasAppId}/${roomName}`
    : roomName;

  const handleJitsiApiReady = (api: any) => {
    jitsiApiRef.current = api;
    setIsJitsiLoaded(true);
    
    // Listen to events
    api.addListener('videoConferenceLeft', () => {
      handleEndCall();
    });

    api.addListener('audioMuteStatusChanged', ({ muted }: { muted: boolean }) => {
      setIsAudioMuted(muted);
    });

    api.addListener('videoMuteStatusChanged', ({ muted }: { muted: boolean }) => {
      setIsVideoMuted(muted);
    });

    api.addListener('screenSharingStatusChanged', ({ on }: { on: boolean }) => {
      setIsScreenSharing(on);
    });

    // Notify that the call started
    toast.success("Video call connected");
  };

  const handleEndCall = () => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.executeCommand('hangup');
      } catch (error) {
        console.error('Error hanging up:', error);
      }
    }
    
    if (onCallEnd) {
      onCallEnd();
    }
    
    onClose();
    toast.info("Call ended");
  };

  const toggleAudio = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

  const toggleScreenShare = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleShareScreen');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi API:', error);
        }
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Video Call - {roomName}</span>
            <div className="flex items-center gap-2">
              {!isJitsiLoaded && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </div>
              )}
              {conversationId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-1"
                >
                  {showNotes ? <X className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {showNotes ? 'Close Notes' : 'Notes'}
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">You are in a video call.</DialogDescription>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Jitsi Meeting Container */}
          <div className={`flex-1 relative ${showNotes ? 'w-2/3' : 'w-full'}`}>
            <JitsiMeeting
            domain={jitsiDomain}
            roomName={effectiveRoomName}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              disableModeratorIndicator: true,
              enableWelcomePage: prejoinEnabled,
              // Prejoin control via env
              prejoinPageEnabled: prejoinEnabled,
              prejoinConfig: { enabled: prejoinEnabled } as any,
              disableDeepLinking: true,
              // Reduce third-party requests (e.g., analytics like Amplitude) to avoid blocked calls/noise
              disableThirdPartyRequests: disableThirdParty,
              analytics: { disabled: disableThirdParty } as any,
              // Prefer P2P when possible to simplify local testing
              p2p: { enabled: true } as any,
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              TOOLBAR_BUTTONS: [
                'microphone',
                'camera',
                'desktop',
                'fullscreen',
                'chat',
                'settings',
                'videoquality',
                'filmstrip',
                'tileview',
              ],
            }}
            userInfo={{
              displayName: userName,
              email: '',
            }}
            // Supply JWT only when explicitly configured (required for JAAS domains)
            jwt={providedJwt && isJaasDomain ? providedJwt : undefined}
            onApiReady={handleJitsiApiReady}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
              // Ensure device access in iframe is allowed across browsers
              try {
                const existing = iframeRef.getAttribute('allow') || '';
                const needed = 'camera; microphone; fullscreen; display-capture; autoplay';
                if (!existing.includes('camera')) {
                  iframeRef.setAttribute('allow', `${existing ? existing + '; ' : ''}${needed}`);
                }
              } catch {}
            }}
          />
          </div>

          {/* Notes Panel - Slide In from Right */}
          {showNotes && conversationId && (
            <div className="w-1/3 border-l bg-background overflow-y-auto">
              <CallNotesPanel
                conversationId={conversationId}
                roomName={roomName}
              />
            </div>
          )}
        </div>

        {/* Custom Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isAudioMuted ? "destructive" : "secondary"}
              size="lg"
              onClick={toggleAudio}
              className="rounded-full w-14 h-14"
              title={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              variant={isVideoMuted ? "destructive" : "secondary"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full w-14 h-14"
              title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              onClick={toggleScreenShare}
              className="rounded-full w-14 h-14"
              title={isScreenSharing ? "Stop sharing" : "Share screen"}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full w-14 h-14"
              title="End call"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
