import { UserPlus, Search, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";

const friends = [
  { id: 1, name: "Sarah Johnson", status: "Online", color: "bg-blue-500", initials: "SJ" },
  { id: 2, name: "Michael Chen", status: "Away", color: "bg-green-500", initials: "MC" },
  { id: 3, name: "Emily Rodriguez", status: "Online", color: "bg-orange-500", initials: "ER" },
  { id: 4, name: "David Kim", status: "Offline", color: "bg-purple-500", initials: "DK" },
  { id: 5, name: "Lisa Anderson", status: "Online", color: "bg-pink-500", initials: "LA" },
  { id: 6, name: "James Wilson", status: "Away", color: "bg-indigo-500", initials: "JW" },
];

export function FriendsPage() {
  return (
    <div className="flex h-full bg-[#F3F2F1]">
      {/* Friends List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-900">Friends</h2>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search friends..."
              className="pl-9 h-9 bg-[#F3F2F1]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            >
              <div className="relative">
                <Avatar className={`h-10 w-10 ${friend.color}`}>
                  <AvatarFallback className={`${friend.color} text-white text-xs`}>
                    {friend.initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    friend.status === "Online"
                      ? "bg-green-500"
                      : friend.status === "Away"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 truncate">{friend.name}</h3>
                <p className="text-gray-500 truncate">{friend.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex items-center justify-center bg-[#F3F2F1]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
            <MessageCircle className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-gray-900 mb-2">Select a conversation</h2>
          <p className="text-gray-500">Choose a friend from the list to start chatting</p>
        </div>
      </div>
    </div>
  );
}