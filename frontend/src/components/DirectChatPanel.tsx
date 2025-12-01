import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { backend } from "../../constants";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { io, Socket } from "socket.io-client";

const API_BASE = `http://${backend.IP}:${backend.PORT}`;

/* ---------- SOCKET SINGLETON ---------- */

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("[DirectChatPanel] 🔌 Socket connected:", socket?.id);
    });
    socket.on("disconnect", () => {
      console.log("[DirectChatPanel] ❌ Socket disconnected");
    });
    socket.on("connect_error", (err) => {
      console.error(
        "[DirectChatPanel] ⚠️ Socket connect_error:",
        (err as Error).message || err
      );
    });
  }
  return socket;
}

/* ---------- TYPES ---------- */

// Exact shape from your console log
interface SocketPrivateMessage {
  id: number | string;
  content: string;
  senderUsername: string;
  receiverUsername: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  receiver: string;
  timestamp: string;
  raw?: any;
}

interface DirectChatPanelProps {
  currentUserId: string;     // e.g. "sri"
  friendUserId: string;      // e.g. "kart"
  friendDisplayName: string; // shown in header
}

/* ---------- HELPERS ---------- */

function mapSocketMessage(raw: SocketPrivateMessage): ChatMessage {
  return {
    id: String(raw.id),
    content: raw.content,
    sender: raw.senderUsername,
    receiver: raw.receiverUsername,
    timestamp: raw.timestamp || new Date().toISOString(),
    raw,
  };
}

/* ============================================================
   DIRECT CHAT PANEL (SOCKET-ONLY, REALTIME)
============================================================ */

export function DirectChatPanel({
  currentUserId,
  friendUserId,
  friendDisplayName,
}: DirectChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [lastRaw, setLastRaw] = useState<any | null>(null);

  const hasValidIds = Boolean(currentUserId && friendUserId);

  /* ------------------------------------------------------------
    1️⃣ SOCKET SETUP (JOIN PRIVATE + LISTEN)
  ------------------------------------------------------------ */

  useEffect(() => {
    if (!hasValidIds) return;

    const s = getSocket();

    console.log("[DirectChatPanel] joinPrivate:", currentUserId);
    s.emit("joinPrivate", currentUserId);

    const handleReceive = (raw: SocketPrivateMessage) => {
      console.log("[DirectChatPanel] receivePrivateMessage:", raw);
      setLastRaw(raw);

      // Map using senderUsername / receiverUsername
      const mapped = mapSocketMessage(raw);

      // Store ALL messages in state
      setMessages((prev) => [...prev, mapped]);
      console.log("[DirectChatPanel] messages state now:", [...messages, mapped]);
    };

    s.on("receivePrivateMessage", handleReceive);

    return () => {
      s.off("receivePrivateMessage", handleReceive);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, friendUserId, hasValidIds]);

  /* ------------------------------------------------------------
    2️⃣ SEND MESSAGE (SOCKET)
    Backend expects:
    socket.emit("sendPrivateMessage", {
      sender: "siri",
      receiver: "kart",
      content: "Hello Kart, this is private!"
    });
  ------------------------------------------------------------ */

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !hasValidIds) return;

    const s = getSocket();
    const payload = {
      sender: currentUserId,
      receiver: friendUserId,
      content: trimmed,
    };

    console.log("[DirectChatPanel] sendPrivateMessage:", payload);

    try {
      setSending(true);
      s.emit("sendPrivateMessage", payload);
      setContent(""); // backend will echo via receivePrivateMessage
    } catch (err) {
      console.error("[DirectChatPanel] Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  /* ------------------------------------------------------------
    GUARD IF IDS MISSING
  ------------------------------------------------------------ */

  if (!hasValidIds) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        No friend selected or user ID missing.
      </div>
    );
  }

  /* ------------------------------------------------------------
    FILTER MESSAGES FOR THIS DM (sri ↔ kart)
    We keep ALL in state, but only render those for this pair.
  ------------------------------------------------------------ */

  const conversationMessages = messages.filter(
    (m) =>
      (m.sender === currentUserId && m.receiver === friendUserId) ||
      (m.sender === friendUserId && m.receiver === currentUserId)
  );

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="h-12 border-b border-gray-200 flex items-center px-4 justify-between">
        <div>
          <span className="font-medium">{friendDisplayName}</span>
          <span className="text-xs text-gray-500 ml-2">@{friendUserId}</span>
        </div>
        <div className="text-[10px] text-gray-400">
          You: <strong>{currentUserId}</strong>
        </div>
      </div>

      {/* DEBUG BAR */}
      <div className="border-b border-gray-200 bg-gray-50 text-xs px-3 py-2">
        <div className="font-semibold mb-1">Debug</div>
        <div>
          currentUserId: <code>{currentUserId}</code>
        </div>
        <div>
          friendUserId: <code>{friendUserId}</code>
        </div>
        <div>
          messages.length: <code>{messages.length}</code>
        </div>
        {lastRaw && (
          <details className="mt-1">
            <summary className="cursor-pointer text-blue-600">
              Last socket message (raw)
            </summary>
            <pre className="mt-1 bg-white border border-gray-200 rounded p-2 max-h-40 overflow-auto">
{JSON.stringify(lastRaw, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {conversationMessages.length === 0 && (
              <div className="text-sm text-gray-500">
                No messages yet. Say hi 👋
              </div>
            )}

            {conversationMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-md max-w-[80%] ${
                  msg.sender === currentUserId
                    ? "bg-[#6264A7] text-white ml-auto"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="text-[11px] opacity-70 mb-1">
                  {msg.sender} ➜ {msg.receiver}
                </div>
                <p>{msg.content}</p>
                {msg.timestamp && (
                  <div className="text-[10px] opacity-70 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 p-3 flex gap-2"
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message"
          className="flex-1 min-h-[45px] resize-none"
        />
        <Button
          type="submit"
          className="bg-[#6264A7] hover:bg-[#5558A0]"
          disabled={!content.trim() || sending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
