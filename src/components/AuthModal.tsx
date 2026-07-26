import React, { useState } from "react";
import { AppState, User } from "../types";
import {
  X,
  LogIn,
  Check,
  Phone,
  ShieldCheck,
  UserCheck,
  UserPlus,
  LogOut,
  Sparkles,
  KeyRound,
  User as UserIcon,
} from "lucide-react";
import { initials, colorForPhone } from "../lib/storage";

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
  const [tab, setTab] = useState<"login" | "register" | "switch">("login");

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regColor, setRegColor] = useState("#F3D375");

  const currentUser = state.currentUser;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const cleanPhone = loginPhone.trim();
    if (!cleanPhone) return;

    const existing = state.users[cleanPhone];
    if (existing) {
      if (existing.pinHash && loginPin && existing.pinHash !== loginPin.trim()) {
        setLoginError("Invalid PIN entered for this account.");
        return;
      }
      onSelectUser(existing);
      onClose();
    } else {
      setLoginError("Account not found. Please register a new user.");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;

    const newUser: User = {
      phone: regPhone.trim(),
      name: regName.trim(),
      pinHash: regPin.trim() || "1234",
      avatarColor: regColor,
    };

    onRegisterUser(newUser);
    onSelectUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Account & Authentication</h2>
              <p className="text-[11px] text-[#8E95A5]">Secure Player Login & Profiles</p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8E95A5] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Current Logged-In Card */}
        {currentUser && (
          <div className="bg-[#181B24] border border-amber-400/40 rounded-2xl p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
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
                }}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
              >
                <LogOut size={13} /> Log Out
              </button>
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#181B24] p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`py-2 rounded-lg transition-all ${
              tab === "login"
                ? "bg-amber-400 text-black shadow-md font-extrabold"
                : "text-[#8E95A5] hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`py-2 rounded-lg transition-all ${
              tab === "register"
                ? "bg-amber-400 text-black shadow-md font-extrabold"
                : "text-[#8E95A5] hover:text-white"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setTab("switch")}
            className={`py-2 rounded-lg transition-all ${
              tab === "switch"
                ? "bg-amber-400 text-black shadow-md font-extrabold"
                : "text-[#8E95A5] hover:text-white"
            }`}
          >
            Accounts
          </button>
        </div>

        {/* TAB 1: LOGIN */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl text-xs text-red-400 font-medium">
                {loginError}
              </div>
            )}

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
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Security PIN
              </label>
              <div className="flex items-center bg-[#181B24] border border-white/15 rounded-xl px-3 py-2.5">
                <KeyRound size={16} className="text-[#8E95A5] mr-2" />
                <input
                  type="password"
                  placeholder="PIN (default 1234)"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all mt-2"
            >
              <LogIn size={15} /> Login to Account
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER / SIGN UP */}
        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Full Name
              </label>
              <div className="flex items-center bg-[#181B24] border border-white/15 rounded-xl px-3 py-2.5">
                <UserIcon size={16} className="text-[#8E95A5] mr-2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Daniel Vance"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
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
                  placeholder="e.g. 9887766554"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                  Create PIN
                </label>
                <input
                  type="password"
                  placeholder="PIN"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  className="w-full bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                  Avatar Color
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {["#F3D375", "#60A5FA", "#34D399", "#F472B6", "#A78BFA"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRegColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        regColor === c ? "scale-125 ring-2 ring-white" : "opacity-70"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all mt-2"
            >
              <UserPlus size={15} /> Create Account & Login
            </button>
          </form>
        )}

        {/* TAB 3: ACCOUNT SWITCHER */}
        {tab === "switch" && (
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-[#8E95A5] uppercase block">
              Quick Switch Local Roster
            </label>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {(Object.values(state.users) as User[]).map((u) => {
                const isCurrent = currentUser?.phone === u.phone;

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
                        className="w-8 h-8 rounded-full text-black font-black text-xs flex items-center justify-center font-mono"
                        style={{ backgroundColor: u.avatarColor || "#F3D375" }}
                      >
                        {initials(u.name)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{u.name}</h4>
                        <span className="text-[11px] text-[#8E95A5] font-mono">{u.phone}</span>
                      </div>
                    </div>

                    {isCurrent && <Check size={18} className="text-amber-300" />}
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
