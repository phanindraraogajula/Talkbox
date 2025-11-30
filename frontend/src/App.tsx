import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { SignUpPage } from "./components/SignUpPage";
import { AppSidebar } from "./components/AppSidebar";
import { TopBar } from "./components/TopBar";
import { LandingPage } from "./components/LandingPage";
import { GlobalChatPanel } from "./components/GlobalChatPanel";
import { FriendsPage } from "./components/FriendsPage";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "globalchat" | "friends">("home");
  const [username, setUsername] = useState("");

  // Not logged in: show login / signup
  if (!isLoggedIn) {
    if (showSignUp) {
      return (
        <SignUpPage
          onSignUp={(name) => {
            setUsername(name);      // this becomes userId for chat/friends APIs
            setIsLoggedIn(true);
            setShowSignUp(false);
          }}
          onBackToLogin={() => setShowSignUp(false)}
        />
      );
    }

    return (
      <LoginPage
        onLogin={(name) => {
          setUsername(name);        // this becomes userId for chat/friends APIs
          setIsLoggedIn(true);
        }}
        onSignUp={() => setShowSignUp(true)}
      />
    );
  }

  // Logged in: main app shell
  return (
    <div className="h-screen flex bg-white">
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col">
        <TopBar onLogout={() => setIsLoggedIn(false)} />

        {activeView === "home" && <LandingPage username={username} />}

        {activeView === "globalchat" && (
          <GlobalChatPanel username={username} />
        )}

        {activeView === "friends" && (
          <FriendsPage username={username} />
        )}
      </div>
    </div>
  );
}
