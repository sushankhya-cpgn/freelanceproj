import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, X, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
  file?: { name: string; type: string; url: string };
}

interface Conversation {
  id: number;
  name: string;
  img: string;
  messages: Message[];
}

const initialConversations: Conversation[] = [
  {
    id: 1,
    name: "Anita Sharma",
    img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita",
    messages: [{ id: 1, sender: "them", text: "Thank you! I'll start working on the wireframes.", time: "2m ago" }],
  },
  {
    id: 2,
    name: "Ramesh Karki",
    img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh",
    messages: [{ id: 2, sender: "them", text: "Sure, I can have that done by tomorrow.", time: "1h ago" }],
  },
];

export function MessagingInterface() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<number>(1);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)!;

  const sendMessage = () => {
    if (!message.trim() && !attachment) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: "me",
      text: message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      file: attachment
        ? { name: attachment.name, type: attachment.type, url: URL.createObjectURL(attachment) }
        : undefined,
    };

    setConversations(prev =>
      prev.map(c =>
        c.id === selectedConversationId ? { ...c, messages: [...c.messages, newMessage] } : c
      )
    );

    setMessage("");
    setAttachment(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation.messages]);

  return (
    
    <div className="grid md:grid-cols-3 gap-6 h-screen p-4">
      {/* Conversations List */}
      <Card className="md:col-span-1 flex flex-col overflow-y-scroll">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
            {conversations.map(conversation => {
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              return (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-accent transition rounded-md ${
                    selectedConversationId === conversation.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.img} />
                    <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{conversation.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage?.text || lastMessage?.file?.name}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{lastMessage?.time}</span>
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-2 flex flex-col overflow-y-scroll ">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={selectedConversation.img} />
              <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
            </Avatar>
            <CardTitle>{selectedConversation.name}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {selectedConversation.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] rounded-lg p-3 relative ${
                    msg.sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {msg.file && (
                      <div className="mb-2">
                        {msg.file.type.startsWith("image") ? (
                          <img src={msg.file.url} alt={msg.file.name} className="max-h-40 rounded-lg" />
                        ) : (
                          <div className="flex items-center justify-between bg-muted rounded p-2 mb-1">
                            <FileText className="mr-2" />
                            <span className="truncate">{msg.file.name}</span>
                            <a
                              href={msg.file.url}
                              download={msg.file.name}
                              className="ml-2 text-blue-500 text-sm"
                            >
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm">{msg.text}</p>
                    <span className={`text-xs mt-1 block ${
                      msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2 items-center">
              <label htmlFor="attachment">
                <Button variant="outline" size="icon">
                  <Paperclip className="w-4 h-4" />
                </Button>
              </label>
              <input
                type="file"
                id="attachment"
                className="hidden"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
              {attachment && (
                <div className="flex items-center gap-2 bg-muted p-1 px-2 rounded">
                  <span className="text-xs truncate">{attachment.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => setAttachment(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
