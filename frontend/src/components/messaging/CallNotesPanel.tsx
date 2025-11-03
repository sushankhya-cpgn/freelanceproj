import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/api/axios";

interface CallNotesPanelProps {
  conversationId: number;
  roomName: string;
}

export function CallNotesPanel({ conversationId, roomName }: CallNotesPanelProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Load existing notes on mount
  useEffect(() => {
    loadNotes();
  }, [conversationId, roomName]);

  // Auto-save on note changes (debounced)
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    if (notes.trim() && !loading) {
      autoSaveTimer.current = setTimeout(() => {
        saveNotes(true); // silent save
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [notes]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get(
        `/api/call-notes?conversationId=${conversationId}&roomName=${encodeURIComponent(roomName)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data.length > 0) {
        const latestNote = response.data.data[0];
        setNotes(latestNote.notes || "");
      }
    } catch (error: any) {
      console.error("Failed to load notes:", error);
      // Don't show error toast on load failure - just start with empty notes
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async (silent = false) => {
    if (!notes.trim()) {
      if (!silent) toast.info("No notes to save");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.post(
        "/api/call-notes",
        {
          conversationId,
          roomName,
          notes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        if (!silent) {
          toast.success("Notes saved successfully");
        }
      }
    } catch (error: any) {
      console.error("Failed to save notes:", error);
      if (!silent) {
        toast.error(error.response?.data?.error || "Failed to save notes");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    saveNotes(false);
  };

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-4 h-4" />
          Call Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <Textarea
          placeholder="Take notes during your call..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 resize-none min-h-[200px] text-sm"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {saving ? "Saving..." : notes.trim() ? "Auto-saves every 2 seconds" : "Start typing to save notes"}
          </span>
          <Button
            onClick={handleSaveClick}
            disabled={saving || !notes.trim()}
            size="sm"
            className="flex items-center gap-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                Save Now
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
