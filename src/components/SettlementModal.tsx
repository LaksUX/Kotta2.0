import React, { useState } from "react";
import { AppState, Game, Buyin, SettlementDebt } from "../types";
import { calculateSettlements } from "../lib/storage";
import { X, ArrowRight, Share2, Check, CheckCircle2, ShieldCheck, Scale } from "lucide-react";

interface SettlementModalProps {
  game: Game;
  state: AppState;
  onClose: () => void;
  onConfirmCloseGame: (gameId: string) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  game,
  state,
  onClose,
  onConfirmCloseGame,
}) => {
  const [copied, setCopied] = useState(false);

  // Compute final results based on current live cashouts
  const approvedBuyins = (Object.values(state.buyins) as Buyin[]).filter(
    (b) => b.gameId === game.id && b.status === "approved"
  );
  const playerPhones = Array.from(new Set(approvedBuyins.map((b) => b.phone)));

  const computedResults: Record<string, { cashout: number; buyin: number; net: number; totalBuyins: number }> = {};

  playerPhones.forEach((phone) => {
    const totalBuyin = approvedBuyins
      .filter((b) => b.phone === phone)
      .reduce((sum, b) => sum + b.amount, 0);
    const cashout = game.liveCashouts?.[phone] ?? 0;
    computedResults[phone] = {
      cashout,
      buyin: totalBuyin,
      net: cashout - totalBuyin,
      totalBuyins: totalBuyin,
    };
  });

  const settlements: SettlementDebt[] = calculateSettlements(computedResults, state.users);

  // Copy Settlement Matrix
  const handleCopySettlementsText = () => {
    let text = `♠ *SETTLEMENT MATRIX - ${game.title}* ♠\n\n`;
    text += `📅 *Date:* ${game.date}\n🏆 *Host Rake:* ${game.rake} Banks\n\n*PAIRWISE PAYMENTS:* \n`;

    if (settlements.length === 0) {
      text += `All players are fully even! No payments required.\n`;
    } else {
      settlements.forEach((s) => {
        text += `• *${s.fromName}* ➔ *${s.toName}*: ${s.amount} Banks\n`;
      });
    }

    text += `\nSettled via Host Poker App`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Scale className="text-emerald-400" size={20} />
            <h2 className="text-lg font-extrabold text-white">Settlement Matrix</h2>
          </div>
          <button onClick={onClose} className="text-[#8E95A5] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Pairwise Debts Simplified Breakdown */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider">
            Pairwise Debt Simplification ({settlements.length} Transfers)
          </h3>

          {settlements.length === 0 ? (
            <div className="bg-[#181B24] border border-white/10 rounded-2xl p-6 text-center text-xs text-white">
              🎉 Everyone broke even! No transfers necessary.
            </div>
          ) : (
            <div className="space-y-2">
              {settlements.map((s, idx) => (
                <div
                  key={idx}
                  className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-3 flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-extrabold text-red-400 truncate">
                      {s.fromName}
                    </span>
                    <ArrowRight size={14} className="text-[#8E95A5] shrink-0" />
                    <span className="text-xs font-extrabold text-emerald-400 truncate">
                      {s.toName}
                    </span>
                  </div>

                  <span className="text-sm font-mono font-black text-amber-300 pl-2 shrink-0">
                    {s.amount} Banks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Copy for WhatsApp */}
        <button
          type="button"
          onClick={handleCopySettlementsText}
          className="w-full py-3 bg-[#181B24] border border-white/15 hover:border-amber-400/50 text-amber-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
          <span>{copied ? "Copied Matrix Text!" : "Copy WhatsApp Settlement Text"}</span>
        </button>

        {/* Finalize Game */}
        <button
          type="button"
          onClick={() => {
            onConfirmCloseGame(game.id);
            onClose();
          }}
          className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all mt-2"
        >
          <CheckCircle2 size={18} />
          <span>Confirm & Archive Game to Ledger</span>
        </button>
      </div>
    </div>
  );
};
