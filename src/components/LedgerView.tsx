import React from "react";
import { AppState, Game, User } from "../types";
import { Receipt, ArrowUpRight, ArrowDownLeft, ShieldCheck, Share2, Scale } from "lucide-react";
import { colorForPhone, initials } from "../lib/storage";

interface LedgerViewProps {
  state: AppState;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ state }) => {
  const currentUserPhone = state.currentUser?.phone || "9876543210";
  const closedGames = (Object.values(state.games) as Game[]).filter((g) => g.status === "closed");

  // Calculate net balances per player across closed games
  const balances: Record<string, number> = {};

  closedGames.forEach((game) => {
    if (game.results) {
      Object.entries(game.results).forEach(([phone, res]) => {
        balances[phone] = (balances[phone] || 0) + res.net;
      });
    }
  });

  return (
    <div className="p-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* Ledger Overview Header */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 grid grid-cols-2 gap-3 text-center shadow-lg">
        <div>
          <span className="text-[10px] font-bold text-[#8E95A5] uppercase tracking-wider block">
            Settled Games
          </span>
          <span className="text-2xl font-black text-white font-mono">{closedGames.length}</span>
        </div>

        <div className="border-l border-white/10">
          <span className="text-[10px] font-bold text-[#8E95A5] uppercase tracking-wider block">
            My Net Balance
          </span>
          <span
            className={`text-2xl font-black font-mono ${
              (balances[currentUserPhone] || 0) >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {(balances[currentUserPhone] || 0) >= 0
              ? `+${balances[currentUserPhone] || 0}`
              : balances[currentUserPhone] || 0}{" "}
            <span className="text-xs">Banks</span>
          </span>
        </div>
      </div>

      {/* Global Standings / Balances */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider px-1">
          Global Player Net Ledgers
        </h3>

        <div className="space-y-2">
          {(Object.entries(state.users) as [string, User][]).map(([phone, user]) => {
            const net = balances[phone] || 0;
            const avatarBg = colorForPhone(phone);

            return (
              <div
                key={phone}
                className="bg-[#181B24] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full text-black font-extrabold text-xs flex items-center justify-center font-mono"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {initials(user.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{user.name}</h4>
                    <span className="text-xs text-[#8E95A5] font-mono">{phone}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-mono font-black ${
                      net > 0 ? "text-emerald-400" : net < 0 ? "text-red-400" : "text-white/60"
                    }`}
                  >
                    {net > 0 ? `+${net}` : net} Banks
                  </span>
                  <span className="text-[10px] text-[#8E95A5] block">
                    {net > 0 ? "Overall Winner" : net < 0 ? "In Debt" : "Settled"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Closed Games History List */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider px-1">
          Past Game Ledgers
        </h3>

        {closedGames.map((game) => (
          <div
            key={game.id}
            className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div>
                <h4 className="text-sm font-extrabold text-white">{game.title}</h4>
                <p className="text-xs text-[#8E95A5]">{game.date} • {game.venue}</p>
              </div>

              <span className="text-xs font-mono font-bold text-amber-300">
                Rake: {game.rake} Banks
              </span>
            </div>

            {/* Individual results */}
            <div className="space-y-1.5">
              {game.results &&
                (Object.entries(game.results) as [string, { cashout: number; buyin: number; net: number; totalBuyins: number }][]).map(([pPhone, r]) => {
                  const u = state.users[pPhone] || { name: pPhone };
                  return (
                    <div
                      key={pPhone}
                      className="flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-white/80">{u.name}</span>
                      <span
                        className={
                          r.net > 0 ? "text-emerald-400 font-bold" : r.net < 0 ? "text-red-400 font-bold" : "text-white/60"
                        }
                      >
                        {r.net > 0 ? `+${r.net}` : r.net} Banks
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
