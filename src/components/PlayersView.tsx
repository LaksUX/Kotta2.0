import React, { useState } from "react";
import { AppState, User, BankrollGoal, Game } from "../types";
import { Users, Phone, Plus, Share2, Search, Check, Target, ShieldCheck, Edit3, Award } from "lucide-react";
import { colorForPhone, initials } from "../lib/storage";

interface PlayersViewProps {
  state: AppState;
  onAddPlayer: (name: string, phone: string) => void;
  onUpdateBankrollGoal?: (goal: BankrollGoal) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  state,
  onAddPlayer,
  onUpdateBankrollGoal,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Bankroll Goal editing state
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [targetAmount, setTargetAmount] = useState(state.bankrollGoal?.targetAmount || 5000);
  const [targetStakes, setTargetStakes] = useState(state.bankrollGoal?.targetStakes || "2/5 NLH High Stakes");

  const playersList = (Object.values(state.users) as User[]).filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm)
  );

  // Compute total bankroll net balance
  const closedGames = (Object.values(state.games || {}) as Game[]).filter((g) => g.status === "closed");
  let totalNetProfit = 2250; // default initial bankroll base

  closedGames.forEach((g) => {
    if (g.results && state.currentUser && g.results[state.currentUser.phone]) {
      totalNetProfit += g.results[state.currentUser.phone].net;
    }
  });

  const goalTarget = state.bankrollGoal?.targetAmount || 5000;
  const goalProgressPercent = Math.min(100, Math.round((totalNetProfit / goalTarget) * 100));

  // Risk of Ruin Buy-in count (standard buy-in = 100 BBs / 200 Banks)
  const buyinsAvailable = (totalNetProfit / 200).toFixed(1);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      onAddPlayer(name.trim(), phone.trim());
      setName("");
      setPhone("");
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBankrollGoal) {
      onUpdateBankrollGoal({
        targetAmount: Number(targetAmount) || 5000,
        targetStakes: targetStakes.trim(),
      });
    }
    setShowEditGoal(false);
  };

  const handleCopyInvite = (pPhone: string, pName: string) => {
    const text = `Hey ${pName}! Join our Home Poker games on Host Poker App: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedPhone(pPhone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="p-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* Fitness-style Bankroll Goal & Move-Up Tracker Card */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-amber-300" />
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Bankroll Move-Up Goal
              </h2>
              <p className="text-[11px] text-[#8E95A5]">{state.bankrollGoal?.targetStakes || "2/5 NLH Level-up"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEditGoal(!showEditGoal)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10"
          >
            <Edit3 size={14} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white font-extrabold">{totalNetProfit} Banks</span>
            <span className="text-[#8E95A5]">{goalTarget} Banks Target</span>
          </div>

          <div className="w-full bg-[#0B0D11] rounded-full h-3 p-0.5 border border-white/10 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500 shadow-md shadow-amber-400/30"
              style={{ width: `${goalProgressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-[#8E95A5]">
            <span>{goalProgressPercent}% Completed</span>
            <span className="text-emerald-400 font-bold font-mono">
              {goalTarget - totalNetProfit > 0 ? `${goalTarget - totalNetProfit} Banks Remaining` : "Goal Achieved! 🎉"}
            </span>
          </div>
        </div>

        {/* Risk of Ruin Gauge */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
          <span className="text-[#8E95A5] flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" /> Bankroll Health:
          </span>
          <span className="text-white font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-300">
            {buyinsAvailable} Buy-ins (Low Risk)
          </span>
        </div>

        {/* Edit Goal Drawer Form */}
        {showEditGoal && (
          <form onSubmit={handleSaveGoal} className="pt-3 border-t border-white/10 space-y-2.5 animate-in fade-in">
            <h4 className="text-xs font-bold text-white uppercase">Edit Target Bankroll</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#8E95A5] uppercase block mb-1">Target Amount</label>
                <input
                  type="number"
                  step={500}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="w-full bg-[#0B0D11] border border-white/15 rounded-xl p-2 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8E95A5] uppercase block mb-1">Target Stakes</label>
                <input
                  type="text"
                  value={targetStakes}
                  onChange={(e) => setTargetStakes(e.target.value)}
                  className="w-full bg-[#0B0D11] border border-white/15 rounded-xl p-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-400 text-black font-extrabold text-xs rounded-xl"
            >
              Update Bankroll Target
            </button>
          </form>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-3.5 text-[#656C7C]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search players by name or phone..."
          className="w-full bg-[#181B24] border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-[#656C7C] focus:border-amber-400 focus:outline-none shadow-md"
        />
      </div>

      {/* Add New Player Card */}
      <form onSubmit={handleAdd} className="bg-[#181B24] border border-white/10 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add New Player Contact</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#0B0D11] border border-white/15 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
          <input
            type="tel"
            required
            placeholder="10-digit Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-[#0B0D11] border border-white/15 rounded-xl p-2.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-white hover:bg-slate-100 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
        >
          <Plus size={16} /> Save Contact
        </button>
      </form>

      {/* Players Directory List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider px-1">
          Registered Players Directory ({playersList.length})
        </h3>

        <div className="space-y-2">
          {playersList.map((user) => {
            const avatarBg = colorForPhone(user.phone);

            return (
              <div
                key={user.phone}
                className="bg-[#181B24] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full text-black font-extrabold text-xs flex items-center justify-center font-mono shadow-md"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {initials(user.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{user.name}</h4>
                    <span className="text-xs text-[#8E95A5] font-mono flex items-center gap-1">
                      <Phone size={11} /> {user.phone}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyInvite(user.phone, user.name)}
                  className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-amber-400/50 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1 active:scale-95"
                >
                  {copiedPhone === user.phone ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                  <span>{copiedPhone === user.phone ? "Copied!" : "Invite"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
