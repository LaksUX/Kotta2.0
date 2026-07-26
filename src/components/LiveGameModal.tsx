import React, { useState } from "react";
import { AppState, Game, Buyin, User } from "../types";
import {
  X,
  Share2,
  CheckCircle2,
  XCircle,
  Plus,
  DollarSign,
  AlertTriangle,
  Scale,
  Users,
  Clock,
  Copy,
  Check,
  Award,
} from "lucide-react";
import { initials, colorForPhone } from "../lib/storage";

interface LiveGameModalProps {
  game: Game;
  state: AppState;
  onClose: () => void;
  onApproveBuyin: (buyinId: string) => void;
  onRejectBuyin: (buyinId: string) => void;
  onRequestBuyin: (gameId: string, amount: number) => void;
  onUpdateCashout: (gameId: string, phone: string, amount: number) => void;
  onOpenSettlement: (game: Game) => void;
}

export const LiveGameModal: React.FC<LiveGameModalProps> = ({
  game,
  state,
  onClose,
  onApproveBuyin,
  onRejectBuyin,
  onRequestBuyin,
  onUpdateCashout,
  onOpenSettlement,
}) => {
  const isHost = state.currentUser?.phone === game.hostPhone;
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [rebuyAmount, setRebuyAmount] = useState<number>(game.initialBuyin);
  const [showRebuyModal, setShowRebuyModal] = useState(false);

  // Buyins for this game
  const gameBuyins = (Object.values(state.buyins) as Buyin[]).filter((b) => b.gameId === game.id);
  const approvedBuyins = gameBuyins.filter((b) => b.status === "approved");
  const pendingBuyins = gameBuyins.filter((b) => b.status === "pending");

  // Get list of unique players who have buyins
  const playerPhones = Array.from(new Set(approvedBuyins.map((b) => b.phone)));

  // Calculate player totals
  const playerStats = playerPhones.map((phone) => {
    const user = state.users[phone] || { phone, name: `Player ${phone.slice(-4)}` };
    const totalBuyin = approvedBuyins
      .filter((b) => b.phone === phone)
      .reduce((sum, b) => sum + b.amount, 0);
    const buyinCount = approvedBuyins.filter((b) => b.phone === phone).length;
    const cashout = game.liveCashouts?.[phone] ?? 0;
    const net = cashout - totalBuyin;

    return {
      phone,
      user,
      totalBuyin,
      buyinCount,
      cashout,
      net,
    };
  });

  // Table calculations
  const totalTableBuyins = approvedBuyins.reduce((sum, b) => sum + b.amount, 0);
  const totalTableCashouts = (Object.values(game.liveCashouts || {}) as number[]).reduce(
    (sum, val) => sum + val,
    0
  );
  const hostRake = game.rake || 0;
  const tableVariance = totalTableBuyins - (totalTableCashouts + hostRake);

  // WhatsApp Invite Link Generator
  const handleCopyWhatsAppInvite = () => {
    const text = `♠ *HOST POKER GAME INVITE* ♠\n\n📌 *${game.title}*\n📅 *Date:* ${game.date}\n⏰ *Time:* ${game.time}\n📍 *Venue:* ${game.venue}\n💵 *Buy-in:* ${game.initialBuyin} Banks\n🏷 *Host:* ${game.hostName}\n\nJoin & RSVP via Host Poker App: https://ais-dev-cyjprv4qoyruzefmzbxhso-444915931990.asia-east1.run.app?gameId=${game.id}`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-extrabold text-white">{game.title}</h2>
            </div>
            <p className="text-xs text-[#8E95A5]">
              {game.date} • {game.venue}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-[#8E95A5] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* WhatsApp Share & Action Bar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyWhatsAppInvite}
            className="flex-1 py-2.5 px-3 bg-[#181B24] border border-white/10 hover:border-amber-400/50 rounded-xl text-xs font-extrabold text-amber-300 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {copiedInvite ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            <span>{copiedInvite ? "Copied Invite Text!" : "Share WhatsApp Invite"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRebuyModal(true)}
            className="py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-300 text-black rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> Re-Buy
          </button>
        </div>

        {/* Table Overview Stat Cards */}
        <div className="grid grid-cols-3 gap-2 bg-[#181B24] border border-white/10 rounded-2xl p-3 text-center">
          <div>
            <span className="text-[9px] font-bold text-[#8E95A5] uppercase tracking-wider block">
              Total Buy-ins
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              {totalTableBuyins}
            </span>
          </div>

          <div className="border-x border-white/10">
            <span className="text-[9px] font-bold text-[#8E95A5] uppercase tracking-wider block">
              Live Cashouts
            </span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              {totalTableCashouts}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-[#8E95A5] uppercase tracking-wider block">
              Host Rake
            </span>
            <span className="text-base font-extrabold text-amber-300 font-mono">
              {hostRake}
            </span>
          </div>
        </div>

        {/* Balance & Variance Checker */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            tableVariance === 0
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Scale size={18} />
            <span>
              {tableVariance === 0
                ? "Table Balanced (0 Banks Variance)"
                : `Variance: ${tableVariance > 0 ? `+${tableVariance}` : tableVariance} Banks`}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-black/30 px-2 py-0.5 rounded-full">
            {tableVariance === 0 ? "PASSED" : "CHECK CHIPS"}
          </span>
        </div>

        {/* Pending Re-Buy Approval Queue (Host View) */}
        {pendingBuyins.length > 0 && (
          <div className="space-y-2 bg-amber-400/10 border border-amber-400/20 rounded-2xl p-3">
            <h3 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} /> Pending Re-Buy Approvals ({pendingBuyins.length})
            </h3>

            <div className="space-y-2">
              {pendingBuyins.map((b) => {
                const u = state.users[b.phone] || { name: b.phone };

                return (
                  <div
                    key={b.id}
                    className="bg-[#181B24] border border-white/10 rounded-xl p-2.5 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-extrabold text-white">{u.name}</span>
                      <span className="text-xs font-mono text-amber-300 block">
                        +{b.amount} Banks
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onApproveBuyin(b.id)}
                        className="px-3 py-1 bg-emerald-500 text-black font-extrabold text-xs rounded-lg flex items-center gap-1 hover:bg-emerald-400 active:scale-95"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectBuyin(b.id)}
                        className="px-2 py-1 bg-white/10 text-red-400 hover:text-white font-bold text-xs rounded-lg active:scale-95"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Players Roster & Cashout Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider">
              Players at Table ({playerStats.length})
            </h3>
            <span className="text-[10px] text-[#8E95A5]">Enter cashouts at exit</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {playerStats.map((p) => {
              const avatarBg = colorForPhone(p.phone);

              return (
                <div
                  key={p.phone}
                  className="bg-[#181B24] border border-white/[0.08] rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full text-black font-extrabold text-xs flex items-center justify-center font-mono shadow-md"
                        style={{ backgroundColor: avatarBg }}
                      >
                        {initials(p.user.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-white">
                            {p.user.name}
                          </span>
                          {p.phone === game.hostPhone && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded-md">
                              HOST
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#8E95A5] font-mono">
                          Buy-in: {p.totalBuyin} Banks ({p.buyinCount}x)
                        </span>
                      </div>
                    </div>

                    {/* Cashout Input */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-[#8E95A5] block">Cashout</span>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          value={p.cashout || ""}
                          onChange={(e) =>
                            onUpdateCashout(
                              game.id,
                              p.phone,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="w-20 bg-[#0B0D11] border border-white/15 rounded-lg py-1 px-2 text-sm font-mono font-extrabold text-right text-emerald-400 focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Net P/L */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-xs font-mono font-bold">
                    <span className="text-[#8E95A5]">Net Outcome:</span>
                    <span
                      className={
                        p.net > 0
                          ? "text-emerald-400"
                          : p.net < 0
                          ? "text-red-400"
                          : "text-white"
                      }
                    >
                      {p.net > 0 ? `+${p.net}` : p.net} Banks
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Host Settle Button */}
        {isHost && (
          <button
            type="button"
            onClick={() => onOpenSettlement(game)}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 text-black font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all mt-2"
          >
            <CheckCircle2 size={18} />
            <span>End & Generate Debt Settlement Matrix</span>
          </button>
        )}

        {/* Player Re-Buy Modal Drawer */}
        {showRebuyModal && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-center p-4">
            <div className="bg-[#181B24] border border-white/15 rounded-2xl p-5 space-y-4 max-w-sm mx-auto w-full">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-base font-extrabold text-white">Request Buy-in / Re-buy</h3>
                <button onClick={() => setShowRebuyModal(false)} className="text-[#8E95A5]">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8E95A5] uppercase">Amount in Banks</label>
                <input
                  type="number"
                  step={50}
                  value={rebuyAmount}
                  onChange={(e) => setRebuyAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0B0D11] border border-white/15 rounded-xl p-3 text-lg font-mono font-bold text-amber-300 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (state.currentUser?.phone) {
                    onRequestBuyin(game.id, rebuyAmount);
                    setShowRebuyModal(false);
                  }
                }}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl shadow-md"
              >
                Submit Re-buy Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
