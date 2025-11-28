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
    message: "Welcome to the Global Chat! Feel free to share updates, ask questions, or collaborate with the team.",
    avatarColor: "bg-blue-500",
    initials: "SJ"
  },
  {
    id: "2",
    author: "Michael Chen",
    time: "10:45 AM",
    message: "Thanks Sarah! Excited to be part of this workspace. Looking forward to collaborating with everyone.",
    avatarColor: "bg-green-500",
    initials: "MC"
  },
  {
    id: "3",
    author: "Emily Rodriguez",
    time: "11:15 AM",
    message: "Has anyone reviewed the latest project documentation? I have some suggestions for improvements.",
    avatarColor: "bg-orange-500",
    initials: "ER"
  },
  {
    id: "4",
    author: "David Kim",
    time: "11:30 AM",
    message: "I've just uploaded the new designs to the shared folder. Please take a look and let me know your thoughts!",
    avatarColor: "bg-purple-500",
    initials: "DK"
  },
  {
    id: "5",
    author: "Lisa Anderson",
    time: "12:00 PM",
    message: "Great work on the presentation yesterday, team! The client was very impressed with our progress.",
    avatarColor: "bg-pink-500",
    initials: "LA"
  }
];

export function GlobalChatPanel() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");

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
          <Hash className="h-5 w-5 text-gray-600" />
          <span>Global Chat</span>
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
