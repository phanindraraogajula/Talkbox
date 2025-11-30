import { useState } from "react";
import { Hash, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";

interface GroupChatPanelProps {
  groupName: string;
  memberCount: number;
}

interface GroupMessage {
  id: number;
  author: string;
  content: string;
  time: string;
}

export function GroupChatPanel({ groupName, memberCount }: GroupChatPanelProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([
    {
      id: 1,
      author: "System",
      content: `Welcome to ${groupName}!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [draft, setDraft] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    const newMessage: GroupMessage = {
      id: Date.now(),
      author: "You",
      content: draft.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-gray-600" />
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{groupName}</span>
            <span className="text-xs text-gray-500">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-900">{msg.author}</span>
                  <span className="text-xs text-gray-500">{msg.time}</span>
                </div>
                <p className="text-sm text-gray-800">{msg.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Input Box */}
      <div className="border-t border-gray-200 p-3">
        <form onSubmit={handleSend}>
          <div className="border border-gray-300 rounded-lg focus-within:border-[#6264A7] focus-within:ring-1 focus-within:ring-[#6264A7]">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${groupName}`}
              className="min-h-[60px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none rounded-b-none"
            />
            <div className="flex justify-end p-2">
              <Button
                type="submit"
                size="sm"
                className="bg-[#6264A7] hover:bg-[#5558A0]"
                disabled={!draft.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
