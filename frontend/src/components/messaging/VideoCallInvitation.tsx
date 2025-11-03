import { Button } from "@/components/ui/button";
import { Video, Phone } from "lucide-react";

interface VideoCallInvitationProps {
  data: {
    type: string;
    roomName: string;
    callerName: string;
    callerId: number;
  };
  isSender?: boolean;
  onJoinCall?: (roomName: string) => void;
}

export function VideoCallInvitation({ data, isSender = false, onJoinCall }: VideoCallInvitationProps) {
  const handleJoinCall = () => {
    if (onJoinCall) {
      onJoinCall(data.roomName);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 max-w-md">
      <div className="flex items-start gap-3">
        <div className="bg-blue-500 rounded-full p-3">
          <Video className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">
            {isSender ? "You started a video call" : `${data.callerName} is calling...`}
          </h3>
          
          <p className="text-sm text-blue-700 mb-3">
            {isSender 
              ? "Waiting for the other person to join"
              : "Join the video call to connect"
            }
          </p>
          
          {!isSender && (
            <Button
              onClick={handleJoinCall}
              className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Join Call
            </Button>
          )}
          
          {isSender && (
            <Button
              onClick={handleJoinCall}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Rejoin Call
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
