import { MessageSquare, Users, Home } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, isActive, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-3 px-2 w-full transition-colors relative ${
        isActive
          ? "text-[#6264A7] bg-transparent"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#6264A7]" />}
      <div className="h-6 w-6">{icon}</div>
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  return (
    <div className="w-[68px] bg-[#F3F2F1] border-r border-gray-200 flex flex-col">
      <div className="flex-1 pt-2">
        <SidebarItem
          icon={<Home className="h-6 w-6" />}
          label="Home"
          isActive={activeView === "home"}
          onClick={() => onViewChange("home")}
        />
        <SidebarItem
          icon={<MessageSquare className="h-6 w-6" />}
          label="Global Chat"
          isActive={activeView === "globalchat"}
          onClick={() => onViewChange("globalchat")}
        />
        <SidebarItem
          icon={<Users className="h-6 w-6" />}
          label="Friends"
          isActive={activeView === "friends"}
          onClick={() => onViewChange("friends")}
        />
      </div>

      <div className="pb-2">
        <div className="h-12 w-12 mx-auto flex items-center justify-center">
          <Avatar className="h-8 w-8 bg-[#6264A7]">
            <AvatarFallback className="bg-[#6264A7] text-white text-xs">ME</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
