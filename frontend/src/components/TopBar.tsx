import { Search, Settings, MoreVertical, LogOut } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface TopBarProps {
  onLogout: () => void;
}

export function TopBar({ onLogout }: TopBarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search"
            className="pl-9 h-9 bg-[#F3F2F1] border-0 focus-visible:ring-1 focus-visible:ring-[#6264A7]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-5 w-5 text-gray-600" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVertical className="h-5 w-5 text-gray-600" />
        </Button>
        <div className="h-8 w-px bg-gray-200 mx-1" />
        <Button
          onClick={onLogout}
          className="h-9 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white gap-2 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
