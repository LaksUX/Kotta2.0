import React, { useState } from "react";
import { AppState, User } from "../types";
import { X, LogOut, Check, Phone, User as UserIcon, ShieldCheck, ArrowRight } from "lucide-react";
import { initials } from "../lib/storage";

interface AuthModalProps {
  state: AppState;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  onRegisterUser: (newUser: User) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  state,
  onClose,
  onSelectUser,
  onRegisterUser,
  onLogout,
}) => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const currentUser = state.currentUser;
  const usersList = Object.values(state.users || {}) as User[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    if (!cleanPhone) {
      setError("Please enter a valid phone number.");
      return;
    }

    const existing = state.users[cleanPhone];
    if (existing) {
      onSelectUser(existing);
      onClose();
      return;
    }

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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {currentUser ? "Account Profile" : "Player Sign In"}
              </h2>
              <p className="text-[11px] text-[#8E95A5]">
                {currentUser ? "Logged in session" : "One-time simple setup"}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8E95A5] hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Current Logged-In Card */}
        {currentUser && (
          <div className="bg-[#181B24] border border-amber-400/40 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full text-black font-black text-sm flex items-center justify-center font-mono shadow-md"
                style={{ backgroundColor: currentUser.avatarColor || "#F3D375" }}
              >
                {initials(currentUser.name)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white">{currentUser.name}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                    Active
                  </span>
                </div>
                <p className="text-xs text-[#8E95A5] font-mono">{currentUser.phone}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onLogout();
                setPhone("");
                setName("");
              }}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
            >
              <LogOut size={13} /> Log Out
            </button>
          </div>
        )}

        {/* Unified Form */}
        {!currentUser && (
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {error && (
              <div className="bg-amber-400/10 border border-amber-400/30 p-2.5 rounded-xl text-xs text-amber-300 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Your Name
              </label>
              <div className="flex items-center bg-[#181B24] border border-white/15 rounded-xl px-3 py-2.5">
                <UserIcon size={16} className="text-[#8E95A5] mr-2" />
                <input
                  type="text"
                  placeholder="e.g. Lakshmesh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Phone Number
              </label>
              <div className="flex items-center bg-[#181B24] border border-white/15 rounded-xl px-3 py-2.5">
                <Phone size={16} className="text-[#8E95A5] mr-2" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all mt-2"
            >
              <span>Continue</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* Quick Account Switcher */}
        {usersList.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="text-xs font-bold text-[#8E95A5] uppercase block">
              Saved Profiles
            </label>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {usersList.map((u) => {
                const isCurrent = currentUser?.phone === u.phone;

                return (
                  <button
                    key={u.phone}
                    type="button"
                    onClick={() => {
                      onSelectUser(u);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isCurrent
                        ? "bg-amber-400/15 border-amber-400 text-amber-300 font-bold"
                        : "bg-[#181B24] border-white/10 text-white hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg text-black font-extrabold text-xs flex items-center justify-center font-mono shrink-0"
                        style={{ backgroundColor: u.avatarColor || "#F3D375" }}
                      >
                        {initials(u.name)}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-white truncate">{u.name}</h4>
                        <span className="text-[10px] text-[#8E95A5] font-mono block truncate">
                          {u.phone}
                        </span>
                      </div>
                    </div>

                    {isCurrent && <Check size={16} className="text-amber-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
