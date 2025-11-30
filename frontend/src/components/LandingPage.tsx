import { Avatar, AvatarFallback } from "./ui/avatar";

interface LandingPageProps {
  username: string;
}

const recentChats = [
  {
    id: "1",
    name: "Sarah Johnson",
    lastMessage: "Thanks for the update! Looking forward to...",
    time: "2 min ago",
    unread: 2,
    avatarColor: "bg-blue-500",
    initials: "SJ",
    isOnline: true
  },
  {
    id: "2",
    name: "Global Chat",
    lastMessage: "Michael Chen: Excited to be part of this workspace...",
    time: "5 min ago",
    unread: 5,
    avatarColor: "bg-purple-500",
    initials: "GC",
    isOnline: false
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    lastMessage: "Can we schedule a meeting for tomorrow?",
    time: "1 hour ago",
    unread: 0,
    avatarColor: "bg-orange-500",
    initials: "ER",
    isOnline: true
  },
  {
    id: "4",
    name: "David Kim",
    lastMessage: "I've just uploaded the new designs",
    time: "2 hours ago",
    unread: 0,
    avatarColor: "bg-green-500",
    initials: "DK",
    isOnline: false
  },
  {
    id: "5",
    name: "Lisa Anderson",
    lastMessage: "Great work on the presentation!",
    time: "3 hours ago",
    unread: 1,
    avatarColor: "bg-pink-500",
    initials: "LA",
    isOnline: true
  },
  {
    id: "6",
    name: "Michael Chen",
    lastMessage: "Let's connect tomorrow to discuss the project",
    time: "Yesterday",
    unread: 0,
    avatarColor: "bg-indigo-500",
    initials: "MC",
    isOnline: false
  }
];

export function LandingPage({ username }: LandingPageProps) {
  return (
    <div className="flex-1 bg-[#F3F2F1] overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Good afternoon, {username}</h1>
          <p className="text-gray-600">Welcome to your workspace</p>
        </div>

        {/* Recent Chats Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-gray-900">Recent Chats</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentChats.map((chat) => (
              <div
                key={chat.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
              >
                <div className="relative">
                  <Avatar className={`h-10 w-10 ${chat.avatarColor}`}>
                    <AvatarFallback className={`${chat.avatarColor} text-white`}>
                      {chat.initials}
                    </AvatarFallback>
                  </Avatar>
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-gray-900">{chat.name}</span>
                    <span className="text-gray-500 text-xs">{chat.time}</span>
                  </div>
                  <p className="text-gray-600 text-xs truncate">{chat.lastMessage}</p>
                </div>
                
                {chat.unread > 0 && (
                  <div className="bg-[#6264A7] text-white text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}