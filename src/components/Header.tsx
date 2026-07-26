import React from "react";
import { AppState, User, Game } from "../types";
import { Users, Plus, Shield, Sparkles, LogIn, Scale } from "lucide-react";
import { initials } from "../lib/storage";

interface HeaderProps {
  state: AppState;
  onOpenCreateGame: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onOpenCreateGame,
  onOpenAuth,
}) => {
  const activeGamesCount = (Object.values(state.games) as Game[]).filter(
    (g) => g.status === "active"
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0B0D11]/90 backdrop-blur-md border-b border-white/[0.08] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* App Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/20">
            ♠
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight text-white font-mono">
                HOST POKER
              </h1>
              {activeGamesCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8E95A5] font-medium">
              Frictionless Game & Chip Tracker
            </p>
          </div>
        </div>

        {/* Action Buttons & User Profile */}
        <div className="flex items-center gap-2">
          {/* Host New Game Button */}
          <button
            type="button"
            onClick={onOpenCreateGame}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-amber-400/10 active:scale-95 transition-all"
          >
            <Plus size={15} strokeWidth={3} />
            <span>Host</span>
          </button>

          {/* User Profile Switcher */}
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 p-1 bg-[#181B24] border border-white/10 rounded-xl hover:border-amber-400/40 transition-colors"
            title="Switch User / Account"
          >
            {state.currentUser ? (
              <div
                className="w-7 h-7 rounded-lg text-black font-bold text-xs flex items-center justify-center font-mono"
                style={{ backgroundColor: state.currentUser.avatarColor || "#F3D375" }}
              >
                {initials(state.currentUser.name)}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-white/10 text-[#8E95A5] flex items-center justify-center">
                <LogIn size={15} />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
