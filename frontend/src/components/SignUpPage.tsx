import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { motion } from "motion/react";
import { backend } from "../../constants";

interface SignUpPageProps {
  onSignUp: (username: string) => void;
  onBackToLogin: () => void;
}

export function SignUpPage({ onSignUp, onBackToLogin }: SignUpPageProps) {
  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const body = {
        userId,
        firstName,
        lastName,
        password,
      };

      console.log("Sending:", body);

      const res = await fetch(`http://${backend.IP}:${backend.PORT}/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (data.detail as string) ||
          (data.message as string) ||
          "Registration failed.";
        setError(msg);
        return;
      }

      // Auto login if backend returns useful data
      onSignUp(userId);
    } catch (err) {
      console.error(err);
      setError("Unable to reach server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#6264A7] via-[#7B7DB8] to-[#8B8CC7] relative overflow-hidden">

      {/* Background Animation */}
      <motion.div
        className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 mx-4 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#6264A7] to-[#8B8CC7] rounded-2xl mb-4 shadow-lg"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            <motion.svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </motion.svg>
          </motion.div>

          <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-[#6264A7] to-[#8B8CC7] mb-2">
            Talkbox
          </h1>
          <h2 className="text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Fill your details to join Talkbox</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* UserId */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="text"
              placeholder="karthik01"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="h-11"
            />
          </motion.div>

          {/* First Name */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Karthik"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="h-11"
            />
          </motion.div>

          {/* Last Name */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Mangineni"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="h-11"
            />
          </motion.div>

          {/* Password */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </motion.div>

          {/* Confirm Password */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11"
            />
          </motion.div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Submit Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6264A7] to-[#7B7DB8] h-11 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </motion.div>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <span className="text-gray-600">Already have an account? </span>
          <button
            onClick={onBackToLogin}
            className="text-[#6264A7] hover:underline"
          >
            Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
}
