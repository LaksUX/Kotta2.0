import React, { useState } from "react";
import { AppState, User } from "../types";
import { Spade, LogIn, UserPlus, Phone, User as UserIcon, ShieldCheck, ArrowRight, Sparkles, Check } from "lucide-react";
import { initials } from "../lib/storage";

interface LoginScreenProps {
  state: AppState;
  onSelectUser: (user: User) => void;
  onRegisterUser: (newUser: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  state,
  onSelectUser,
  onRegisterUser,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const usersList = Object.values(state.users || {}) as User[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (isSignUp) {
      const cleanName = name.trim();
      if (!cleanName) {
        setError("Please enter your name.");
        return;
      }

      const newUser: User = {
        phone: cleanPhone,
        name: cleanName,
        pinHash: "1234",
        avatarColor: "#F3D375",
      };

      onRegisterUser(newUser);
      onSelectUser(newUser);
    } else {
      const existing = state.users[cleanPhone];
      if (existing) {
        onSelectUser(existing);
      } else {
        setIsSignUp(true);
        setError("No account found for this phone number. Enter your name below to sign up!");
      }
    }
  };

  return (
    <div className="p-6 min-h-[80vh] flex flex-col justify-center items-center max-w-md mx-auto space-y-6 text-center animate-in fade-in duration-300">
      {/* Brand Hero Visual */}
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 text-black flex items-center justify-center font-black text-3xl shadow-xl shadow-amber-400/20 mx-auto">
          ♠
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-mono">
            HOST POKER
          </h2>
          <p className="text-xs text-[#8E95A5] mt-1 font-medium">
            Private Tables • Chip Tracking • Fitness Log
          </p>
        </div>
      </div>

      {/* Main Authentication Box */}
      <div className="w-full bg-[#12151D] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl text-left">
        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1 bg-[#181B24] p-1 rounded-2xl border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError("");
            }}
            className={`py-2.5 rounded-xl transition-all ${
              !isSignUp
                ? "bg-amber-400 text-black font-extrabold shadow-md"
                : "text-[#8E95A5] hover:text-white"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError("");
            }}
            className={`py-2.5 rounded-xl transition-all ${
              isSignUp
                ? "bg-amber-400 text-black font-extrabold shadow-md"
                : "text-[#8E95A5] hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="bg-amber-400/10 border border-amber-400/30 p-3 rounded-2xl text-xs text-amber-300 font-medium leading-relaxed">
              {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Full Name
              </label>
              <div className="flex items-center bg-[#181B24] border border-white/15 rounded-2xl px-3.5 py-3 focus-within:border-amber-400 transition-colors">
                <UserIcon size={18} className="text-[#8E95A5] mr-2.5 shrink-0" />
                <input
                  type="text"
                  required={isSignUp}
                  placeholder="e.g. Daniel Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none placeholder:text-white/30"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
              Phone Number
            </label>
            <div className="flex items-center bg-[#181B24] border border-white/15 rounded-2xl px-3.5 py-3 focus-within:border-amber-400 transition-colors">
              <Phone size={18} className="text-[#8E95A5] mr-2.5 shrink-0" />
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none placeholder:text-white/30"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20 active:scale-95 transition-all"
          >
            {isSignUp ? (
              <>
                <UserPlus size={16} />
                <span>Create Account & Continue</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Log In to Host Poker</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Saved Player Switcher if saved users exist */}
        {usersList.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-white/10">
            <label className="text-[11px] font-bold text-[#8E95A5] uppercase block">
              Quick Log In As Saved Player
            </label>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {usersList.map((u) => (
                <button
                  key={u.phone}
                  type="button"
                  onClick={() => onSelectUser(u)}
                  className="w-full p-2.5 bg-[#181B24] hover:bg-white/10 border border-white/10 hover:border-amber-400/40 rounded-2xl flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl text-black font-extrabold text-xs flex items-center justify-center font-mono shadow-sm shrink-0"
                      style={{ backgroundColor: u.avatarColor || "#F3D375" }}
                    >
                      {initials(u.name)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        {u.name}
                      </h4>
                      <span className="text-[10px] text-[#8E95A5] font-mono block">
                        {u.phone}
                      </span>
                    </div>
                  </div>

                  <ArrowRight size={16} className="text-[#8E95A5] group-hover:text-amber-300 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#8E95A5] flex items-center gap-1 font-medium">
        <ShieldCheck size={14} className="text-amber-400" />
        Phone number acts as your unique player ID for game invites.
      </p>
    </div>
  );
};
