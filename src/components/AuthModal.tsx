import React, { useState } from "react";
import { AppState, User } from "../types";
import { X, LogIn, Check, Phone, ShieldCheck, UserCheck } from "lucide-react";
import { initials } from "../lib/storage";

interface AuthModalProps {
  state: AppState;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  state,
  onClose,
  onSelectUser,
}) => {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim()) {
      const existing = state.users[phone.trim()];
      if (existing) {
        onSelectUser(existing);
      } else {
        const newUser: User = {
          phone: phone.trim(),
          name: `User ${phone.slice(-4)}`,
          pinHash: pin || "1234",
          avatarColor: "#F3D375",
        };
        onSelectUser(newUser);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-amber-300" />
            <h2 className="text-lg font-extrabold text-white">Switch Account / Login</h2>
          </div>
          <button onClick={onClose} className="text-[#8E95A5] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Quick Demo Profile Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider block">
            Select Active Profile
          </label>

          <div className="space-y-2">
            {(Object.values(state.users) as User[]).map((u) => {
              const isCurrent = state.currentUser?.phone === u.phone;

              return (
                <button
                  key={u.phone}
                  type="button"
                  onClick={() => {
                    onSelectUser(u);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isCurrent
                      ? "bg-amber-400/15 border-amber-400 text-amber-300 shadow-md"
                      : "bg-[#181B24] border-white/10 text-white hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full text-black font-extrabold text-xs flex items-center justify-center font-mono"
                      style={{ backgroundColor: u.avatarColor || "#F3D375" }}
                    >
                      {initials(u.name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{u.name}</h4>
                      <span className="text-xs text-[#8E95A5] font-mono">{u.phone}</span>
                    </div>
                  </div>

                  {isCurrent && <Check size={18} className="text-amber-300" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Phone Login Form */}
        <form onSubmit={handleCustomLogin} className="pt-2 border-t border-white/10 space-y-3">
          <label className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider block">
            Or Login with Phone & PIN
          </label>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
            />
            <input
              type="password"
              placeholder="PIN (1234)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-white hover:bg-slate-100 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
          >
            <LogIn size={15} /> Login to Session
          </button>
        </form>
      </div>
    </div>
  );
};
