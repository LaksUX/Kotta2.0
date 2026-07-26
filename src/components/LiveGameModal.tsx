import React, { useState } from "react";
import { AppState, Game, Buyin, User } from "../types";
import {
  X,
  Share2,
  CheckCircle2,
  Plus,
  Users,
  Check,
  Shield,
  Eye,
  EyeOff,
  MessageSquare,
  Lock,
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
  onEndGame: (gameId: string) => void;
}

export const LiveGameModal: React.FC<LiveGameModalProps> = ({
  game,
  state,
  onClose,
  onApproveBuyin,
  onRejectBuyin,
  onRequestBuyin,
  onUpdateCashout,
  onEndGame,
}) => {
  const isHost = state.currentUser?.phone === game.hostPhone;
  const currentPhone = state.currentUser?.phone;

  const [copiedInvite, setCopiedInvite] = useState(false);
  const [rebuyAmount, setRebuyAmount] = useState<number>(game.initialBuyin || 1); // default 1 Bank
  const [showRebuyModal, setShowRebuyModal] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Buyins for this game
  const gameBuyins = (Object.values(state.buyins) as Buyin[]).filter((b) => b.gameId === game.id);
  const approvedBuyins = gameBuyins.filter((b) => b.status === "approved");

  // Get list of unique players who have buyins or cashouts
  const playerPhones = Array.from(
    new Set([
      ...approvedBuyins.map((b) => b.phone),
      ...Object.keys(game.liveCashouts || {}),
      ...(currentPhone ? [currentPhone] : []),
    ])
  );

  // Calculate player stats
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
      isSelf: phone === currentPhone,
    };
  });

  // Table totals
  const totalTableBuyins = approvedBuyins.reduce((sum, b) => sum + b.amount, 0);
  const totalTableCashouts = (Object.values(game.liveCashouts || {}) as number[]).reduce(
    (sum, val) => sum + val,
    0
  );

  // Share Invite Link via WhatsApp
  const handleWhatsAppShare = () => {
    const text = `♠ JOIN POKER GAME ♠\n\n📌 Title: ${game.title}\n📅 Date: ${game.date}\n📍 Location: ${game.venue}\n🎟 Buy-in: ${game.initialBuyin} Bank (10k Chips)\n⚡ Ratio: ${game.ratio || "1:1"}\n👑 Host: ${game.hostName}\n\nLive Game Tracker: ${window.location.origin}?gameId=${game.id}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyInvite = () => {
    const text = `♠ JOIN POKER GAME ♠\n\n📌 Title: ${game.title}\n📅 Date: ${game.date}\n📍 Location: ${game.venue}\n🎟 Buy-in: ${game.initialBuyin} Bank (10k Chips)\n⚡ Ratio: ${game.ratio || "1:1"}\n👑 Host: ${game.hostName}\n\nLive Game Tracker: ${window.location.origin}?gameId=${game.id}`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-extrabold text-white">{game.title}</h2>
              <span className="text-[10px] font-extrabold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-mono">
                {game.ratio || "1:1"}
              </span>
            </div>
            <p className="text-xs text-[#8E95A5]">
              {game.date} • {game.venue}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-[#8E95A5] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Share Invite & Log Buy-in */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex-1 py-2.5 px-3 bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-400 rounded-xl text-xs font-extrabold text-emerald-400 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <MessageSquare size={16} />
            <span>Invite via WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRebuyModal(true)}
            className="py-2.5 px-3 bg-amber-400 text-black rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md active:scale-95 shrink-0"
          >
            <Plus size={16} strokeWidth={3} /> Log Buy-in
          </button>
        </div>

        {/* Privacy Status Banner */}
        <div className="bg-[#181B24] border border-white/10 rounded-xl p-2.5 flex items-center gap-2 text-xs">
          <Shield size={16} className={isHost ? "text-amber-400" : "text-emerald-400"} />
          <p className="text-[11px] text-[#8E95A5]">
            {isHost ? (
              <span className="text-amber-300 font-bold">Host View: Full visibility on all player buy-ins & cashouts.</span>
            ) : (
              <span className="text-emerald-300 font-bold">Player View: Privacy enabled. You can only view your own buy-in & cashout.</span>
            )}
          </p>
        </div>

        {/* Table Totals Card (Host Only) */}
        {isHost ? (
          <div className="grid grid-cols-2 gap-2 bg-[#181B24] border border-white/10 rounded-2xl p-3 text-center">
            <div>
              <span className="text-[10px] font-bold text-[#8E95A5] uppercase block">
                Total Banks Bought In
              </span>
              <span className="text-xl font-black text-amber-300 font-mono">
                {totalTableBuyins} Banks <span className="text-xs font-normal text-[#8E95A5]">({totalTableBuyins * 10}k)</span>
              </span>
            </div>

            <div className="border-l border-white/10">
              <span className="text-[10px] font-bold text-[#8E95A5] uppercase block">
                Total Banks Cashed Out
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {totalTableCashouts} Banks <span className="text-xs font-normal text-[#8E95A5]">({totalTableCashouts * 10}k)</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#181B24] border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-[#8E95A5] uppercase block">
              1 Buy-in = 1 Bank (10,000 Chips)
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold">
              Table Ratio: {game.ratio || "1:1"}
            </span>
          </div>
        )}

        {/* Player Roster & Privacy Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider">
              Players at Table ({playerStats.length})
            </h3>
            {isHost && <span className="text-[10px] text-[#8E95A5]">Enter cashout on departure</span>}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {playerStats.map((p) => {
              const avatarBg = colorForPhone(p.phone);
              const canViewPlayerDetails = isHost || p.isSelf;

              return (
                <div
                  key={p.phone}
                  className="bg-[#181B24] border border-white/[0.08] rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full text-black font-extrabold text-xs flex items-center justify-center font-mono shadow-md shrink-0"
                        style={{ backgroundColor: avatarBg }}
                      >
                        {initials(p.user.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-white">
                            {p.user.name} {p.isSelf && "(You)"}
                          </span>
                          {p.phone === game.hostPhone && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded-md">
                              HOST
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#8E95A5] font-mono">
                          {canViewPlayerDetails ? (
                            `Buy-in: ${p.totalBuyin} Bank${p.totalBuyin !== 1 ? "s" : ""} (${p.totalBuyin * 10}k)`
                          ) : (
                            <span className="text-white/40 flex items-center gap-1">
                              <Lock size={10} /> Buy-in: Hidden by Host
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Cashout Input or Masked View */}
                    <div className="flex items-center gap-2">
                      {isHost ? (
                        <div className="text-right">
                          <span className="text-[10px] text-[#8E95A5] block">Cash-out Banks</span>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
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
                      ) : p.isSelf ? (
                        <div className="text-right">
                          <span className="text-[10px] text-[#8E95A5] block">My Cash-out</span>
                          <span className="text-sm font-mono font-extrabold text-emerald-400">
                            {p.cashout} Banks
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] text-white/30 font-mono block flex items-center gap-1">
                            <Lock size={10} /> Hidden
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculated Net Outcome (Visible to Host or Self Only) */}
                  {canViewPlayerDetails ? (
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
                        {p.net > 0 ? `+${p.net}` : p.net} Banks ({p.net * 10}k)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px] text-white/30 italic">
                      <span>Net Outcome:</span>
                      <span className="flex items-center gap-1">
                        <Lock size={10} /> Private
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* End Game & Save Data Button */}
        {isHost && (
          <div className="pt-2">
            {!confirmEnd ? (
              <button
                type="button"
                onClick={() => setConfirmEnd(true)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 text-black font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
              >
                <CheckCircle2 size={18} />
                <span>End Game & Save Game Data</span>
              </button>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-center space-y-2">
                <p className="text-xs text-white font-bold">
                  Save player cashouts and close game?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEndGame(game.id)}
                    className="flex-1 py-2 bg-emerald-400 text-black font-extrabold text-xs rounded-xl"
                  >
                    Confirm & Save to Game Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmEnd(false)}
                    className="px-3 py-2 bg-white/10 text-white font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Re-Buy / Log Buy-in Modal Drawer */}
        {showRebuyModal && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-center p-4">
            <div className="bg-[#181B24] border border-white/15 rounded-2xl p-5 space-y-4 max-w-sm mx-auto w-full">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-base font-extrabold text-white">Log Buy-in Banks</h3>
                <button type="button" onClick={() => setShowRebuyModal(false)} className="text-[#8E95A5]">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8E95A5] uppercase">
                  Banks Amount (1 Bank = 10k Chips)
                </label>
                <div className="flex items-center bg-[#0B0D11] border border-white/15 rounded-xl p-3">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={rebuyAmount}
                    onChange={(e) => setRebuyAmount(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-lg font-mono font-bold text-amber-300 focus:outline-none"
                  />
                  <span className="text-sm font-bold text-amber-300 font-mono">
                    ({rebuyAmount * 10}k Chips)
                  </span>
                </div>
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
                Log Buy-in Bank
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
