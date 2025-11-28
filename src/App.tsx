import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { AppSidebar } from "./components/AppSidebar";
import { TopBar } from "./components/TopBar";
import { LandingPage } from "./components/LandingPage";
import { GlobalChatPanel } from "./components/GlobalChatPanel";
import { FriendsPage } from "./components/FriendsPage";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState("home");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  if (!isLoggedIn) {
    // When not logged in, show either Login or Register
    return isRegistering ? (
      <RegisterPage
        onLogin={(name) => {
          setUsername(name);
          setIsLoggedIn(true);
        }}
        onSwitch={() => setIsRegistering(false)}
      />
    ) : (
      <LoginPage
        onLogin={(name) => {
          setUsername(name);
          setIsLoggedIn(true);
        }}
        onSwitch={() => setIsRegistering(true)}
      />
    );
  }

  return (
    <div className="h-screen flex bg-white">
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col">
        <TopBar
          onLogout={() => {
            setIsLoggedIn(false);
            setUsername("");
            setIsRegistering(false);
          }}
        />

        {activeView === "home" && <LandingPage username={username} />}
        {activeView === "globalchat" && <GlobalChatPanel />}
        {activeView === "friends" && <FriendsPage />}
      </div>
    </div>
  );
}
