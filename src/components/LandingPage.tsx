import { MessageSquare, Users } from "lucide-react";
import { Card } from "./ui/card";

interface LandingPageProps {
  username: string;
}

export function LandingPage({ username }: LandingPageProps) {
  return (
    <div className="flex-1 bg-[#F3F2F1] overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Good afternoon, {username}</h1>
          <p className="text-gray-600">Welcome to your workspace</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-[#6264A7]">
            <MessageSquare className="h-8 w-8 text-[#6264A7] mb-3" />
            <h3 className="text-gray-900 mb-1">Global Chat</h3>
            <p className="text-gray-600">Join the conversation</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <Users className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="text-gray-900 mb-1">Friends</h3>
            <p className="text-gray-600">Connect with others</p>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded">
              <div className="w-2 h-2 bg-[#6264A7] rounded-full mt-2"></div>
              <div>
                <p className="text-gray-900">New message in Global Chat</p>
                <p className="text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-900">Sarah Johnson joined your workspace</p>
                <p className="text-gray-500">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-900">3 new friend requests</p>
                <p className="text-gray-500">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
