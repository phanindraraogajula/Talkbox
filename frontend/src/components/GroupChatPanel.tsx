import { useState } from "react";
import { Hash, Pin, Bell, Users, MoreVertical, Send, Paperclip, Smile, Bold, Italic, Underline, Link, List } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";

interface Message {
  id: string;
  author: string;
  time: string;
  message: string;
  avatarColor: string;
  initials: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    author: "Sarah Johnson",
    time: "10:30 AM",
    message: "Hey everyone! Welcome to the group.",
    avatarColor: "bg-blue-500",
    initials: "SJ"
  },
  {
    id: "2",
    author: "Michael Chen",
    time: "10:45 AM",
    message: "Thanks for adding me! Excited to chat with you all.",
    avatarColor: "bg-green-500",
    initials: "MC"
  }
];

interface GroupChatPanelProps {
  groupName: string;
  memberCount: number;
}

export function GroupChatPanel({ groupName, memberCount }: GroupChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [activeUsers] = useState(3); // Mock number of active users
  const [typingUsers] = useState([
    { initials: "SJ", color: "bg-blue-500" }
  ]); // Mock typing users

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        author: "You",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: message,
        avatarColor: "bg-indigo-500",
        initials: "YO"
      };
      setMessages([...messages, newMessage]);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Channel Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-600" />
          <span>{groupName}</span>
          <span className="text-xs text-gray-500">({memberCount} members)</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pin className="h-4 w-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Users className="h-4 w-4 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 hover:bg-gray-50 -mx-4 px-4 py-2 rounded">
              <Avatar className={`h-8 w-8 ${msg.avatarColor} flex-shrink-0`}>
                <AvatarFallback className={`${msg.avatarColor} text-white text-xs`}>{msg.initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-900">{msg.author}</span>
                  <span className="text-gray-500 text-xs">{msg.time}</span>
                </div>
                <p className="text-gray-700 mt-0.5">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Compose Box */}
      <div className="border-t border-gray-200 p-4">
        {/* Typing indicator and active users */}
        <div className="mb-2 flex items-center justify-between">
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {typingUsers.map((user, index) => (
                  <div
                    key={index}
                    className={`${user.color} w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] border-2 border-white shadow-sm`}
                  >
                    {user.initials}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}
          <span className="text-xs text-gray-500 ml-auto">{activeUsers} people active</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="border border-gray-300 rounded-lg focus-within:border-[#6264A7] focus-within:ring-1 focus-within:ring-[#6264A7]">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <Bold className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <Italic className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <Underline className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <Link className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <List className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <Smile className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            {/* Text Input */}
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              className="min-h-[80px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none rounded-t-none"
            />

            {/* Send Button */}
            <div className="flex justify-end p-2">
              <Button
                type="submit"
                size="sm"
                className="bg-[#6264A7] hover:bg-[#5558A0]"
                disabled={!message.trim()}
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
