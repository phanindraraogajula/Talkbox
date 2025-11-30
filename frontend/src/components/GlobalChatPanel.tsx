import { useState, useEffect, useRef } from "react";
import {
  Hash,
  Pin,
  Bell,
  Users,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Bold,
  Italic,
  Underline,
  Link,
  List,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { backend } from "../../constants";
import { io, type Socket } from "socket.io-client";

interface Message {
  id: string;
  author: string;
  time: string;
  message: string;
  avatarColor: string;
  initials: string;
}

interface SocketMessage {
  id: number | string;
  content: string;
  senderUsername: string;
  timestamp: string;
}

interface GlobalChatPanelProps {
  username: string; // must be the userId (e.g. "karthik01")
}

const API_BASE = `http://${backend.IP}:${backend.PORT}`;

// single socket.io client for this module
const socket: Socket = io(API_BASE, {
  transports: ["websocket"],
});

// DEBUG – see connection state in console
socket.on("connect", () => {
  console.log("🔌 Socket connected:", socket.id);
});
socket.on("disconnect", () => {
  console.log("❌ Socket disconnected");
});
socket.on("connect_error", (err) => {
  console.error("⚠️ Socket connect_error:", err.message || err);
});

function getAvatarProps(username: string) {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];

  const safeName = username || "User";
  const initials = safeName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const charCodeSum = safeName
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const color = colors[charCodeSum % colors.length];

  return { initials, color };
}

function mapSocketMessage(msg: SocketMessage): Message {
  const { initials, color } = getAvatarProps(msg.senderUsername);

  return {
    id: String(msg.id),
    author: msg.senderUsername,
    time: new Date(msg.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
      message: msg.content,
      avatarColor: color,
      initials,
  };
}

export function GlobalChatPanel({ username }: GlobalChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  const typingUserAvatars = typingUsers.slice(0, 3).map((name) => {
    const { initials, color } = getAvatarProps(name);
    return { initials, color };
  });

  // 1️⃣ Register socket listeners (recentMessages, receiveMessage, activeUsers, typingUsers)
  useEffect(() => {
    let isMounted = true;

    const handleRecentMessages = (msgs: SocketMessage[]) => {
      if (!isMounted) return;
      console.log("📚 recentMessages:", msgs);
      setMessages(msgs.map(mapSocketMessage));
    };

    const handleReceiveMessage = (msg: SocketMessage) => {
      if (!isMounted) return;
      console.log("📩 receiveMessage:", msg);
      const mapped = mapSocketMessage(msg);
      setMessages((prev) => [...prev, mapped]);
    };

    const handleActiveUsers = (users: string[]) => {
      if (!isMounted) return;
      console.log("👥 activeUsers:", users);
      setOnlineUsers(users);
    };

    const handleTypingUsers = (users: string[]) => {
      if (!isMounted) return;
      console.log("⌨️ typingUsers:", users);
      // exclude myself from typing list
      const filtered = users.filter((u) => u !== username);
      setTypingUsers(filtered);
    };

    socket.on("recentMessages", handleRecentMessages);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("activeUsers", handleActiveUsers);
    socket.on("typingUsers", handleTypingUsers);

    // optional: also fetch once via REST so UI is not empty before socket events arrive
    (async () => {
      try {
        const [msgRes, onlineRes, typingRes] = await Promise.all([
          fetch(`${API_BASE}/chat/messages`),
          fetch(`${API_BASE}/chat/online-users`),
          fetch(`${API_BASE}/chat/typing-users`),
        ]);

        if (!isMounted) return;

        if (msgRes.ok) {
          const data: SocketMessage[] = await msgRes.json();
          console.log("🌐 REST /chat/messages:", data);
          setMessages(data.map(mapSocketMessage));
        }
        if (onlineRes.ok) {
          const data = await onlineRes.json();
          console.log("🌐 REST /chat/online-users:", data);
          if (Array.isArray(data.onlineUsers)) {
            setOnlineUsers(data.onlineUsers);
          }
        }
        if (typingRes.ok) {
          const data = await typingRes.json();
          console.log("🌐 REST /chat/typing-users:", data);
          if (Array.isArray(data.typingUsers)) {
            const filtered = data.typingUsers.filter(
              (u: string) => u !== username
            );
            setTypingUsers(filtered);
          }
        }
      } catch (err) {
        console.error("❌ Error fetching initial chat data:", err);
      }
    })();

    return () => {
      isMounted = false;
      socket.off("recentMessages", handleRecentMessages);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("activeUsers", handleActiveUsers);
      socket.off("typingUsers", handleTypingUsers);
    };
  }, [username]);

  // 2️⃣ Register the logged-in user with the backend
  useEffect(() => {
    if (!username) return;

    const register = () => {
      console.log("📝 registerUser:", username);
      socket.emit("registerUser", username); // userId string
    };

    socket.on("connect", register);

    if (socket.connected) {
      register();
    }

    return () => {
      socket.off("connect", register);
    };
  }, [username]);

  // 3️⃣ Send a message (Socket.IO sendMessage)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    console.log("📤 sendMessage:", { content: trimmed });
    socket.emit("sendMessage", { content: trimmed });

    // Clear input
    setMessage("");
    // Stop typing
    if (isTyping) {
      socket.emit("typing", false);
      setIsTyping(false);
    }
  };

  // 4️⃣ Typing indicator (socket.emit("typing", true/false))
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // simple "typing" state using timeout
    if (!isTyping && value.trim().length > 0) {
      setIsTyping(true);
      socket.emit("typing", true);
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit("typing", false);
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const activeUsersCount = onlineUsers.length;

  return (
    // 🔥 IMPORTANT: min-h-0 so children can scroll instead of pushing footer
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
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

      {/* Messages – scrollable area */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex gap-3 hover:bg-gray-50 -mx-4 px-4 py-2 rounded"
              >
                <Avatar
                  className={`h-8 w-8 ${msg.avatarColor} flex-shrink-0`}
                >
                  <AvatarFallback
                    className={`${msg.avatarColor} text-white text-xs`}
                  >
                    {msg.initials}
                  </AvatarFallback>
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
      </div>

      {/* Composer – stays pinned at bottom */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        {/* typing + active users */}
        <div className="mb-2 flex items-center justify-between">
          {typingUserAvatars.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {typingUserAvatars.map((user, index) => (
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
                  <span
                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </div>
            </div>
          )}
          <span className="text-xs text-gray-500 ml-auto">
            {activeUsersCount} {activeUsersCount === 1 ? "person" : "people"}{" "}
            active
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="border border-gray-300 rounded-lg focus-within:border-[#6264A7] focus-within:ring-1 focus-within:ring-[#6264A7]">
            {/* Toolbar */}
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

            {/* Textarea */}
            <Textarea
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              className="min-h-[80px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none rounded-t-none"
            />

            {/* Send button */}
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
