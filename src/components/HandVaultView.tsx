import React, { useState } from "react";
import { AppState, HandNote } from "../types";
import { BookOpen, Plus, Trash2, Search, Award, Sparkles, Filter, ChevronRight, X } from "lucide-react";

interface HandVaultViewProps {
  state: AppState;
  onAddHandNote: (hand: HandNote) => void;
  onDeleteHandNote: (id: string) => void;
}

export const HandVaultView: React.FC<HandVaultViewProps> = ({
  state,
  onAddHandNote,
  onDeleteHandNote,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResult, setFilterResult] = useState<"all" | "win" | "loss">("all");

  // Form State
  const [title, setTitle] = useState("Big Pot River Call");
  const [heroHand, setHeroHand] = useState("A♠ K♠");
  const [board, setBoard] = useState("A♥ 10♠ 4♦ 7♠ 2♣");
  const [position, setPosition] = useState("BTN");
  const [stakes, setStakes] = useState("1/2 NLH");
  const [potSize, setPotSize] = useState(450);
  const [result, setResult] = useState<"win" | "loss" | "chop">("win");
  const [amountWonLost, setAmountWonLost] = useState(225);
  const [notes, setNotes] = useState("Villain triple-barreled with busted draw. Easy call on river.");

  const handList = (Object.values(state.handNotes || {}) as HandNote[]).filter((hand) => {
    const matchesSearch =
      hand.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hand.heroHand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hand.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesResult =
      filterResult === "all" ? true : hand.result === filterResult;

    return matchesSearch && matchesResult;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !heroHand.trim()) return;

    const newHand: HandNote = {
      id: `hand_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      title: title.trim(),
      heroHand: heroHand.trim(),
      board: board.trim(),
      position,
      stakes,
      potSize: Number(potSize) || 0,
      result,
      amountWonLost: Number(amountWonLost) || 0,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    onAddHandNote(newHand);
    setShowAddModal(false);
  };

  return (
    <div className="p-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* Header Banner */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-300" />
            <h2 className="text-sm font-extrabold text-white">Hand Vault & Replayer</h2>
          </div>
          <p className="text-xs text-[#8E95A5] mt-0.5">
            Log set plays & key hands like a fitness rep log
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3 py-2 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
        >
          <Plus size={16} />
          <span>Log Hand</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-[#656C7C]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cards e.g. A♠ K♠, river call, BTN..."
            className="w-full bg-[#181B24] border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#656C7C] focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "win", "loss"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterResult(f)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold capitalize border transition-all ${
                filterResult === f
                  ? "bg-amber-400/15 border-amber-400 text-amber-300"
                  : "bg-[#181B24] border-white/10 text-[#8E95A5] hover:text-white"
              }`}
            >
              {f === "all" ? "All Hands" : f === "win" ? "Wins 🟢" : "Losses 🔴"}
            </button>
          ))}
        </div>
      </div>

      {/* Hand List */}
      <div className="space-y-3">
        {handList.length === 0 ? (
          <div className="bg-[#181B24] border border-white/10 rounded-2xl p-8 text-center space-y-2">
            <Sparkles size={24} className="text-amber-300 mx-auto opacity-60" />
            <p className="text-xs text-[#8E95A5]">No hand logs found in the vault.</p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="text-xs font-extrabold text-amber-300 underline"
            >
              Log your first hand
            </button>
          </div>
        ) : (
          handList.map((hand) => (
            <div
              key={hand.id}
              className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-2.5 relative shadow-md hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono font-bold text-[10px]">
                      {hand.position}
                    </span>
                    <span className="text-xs text-[#8E95A5] font-mono">{hand.stakes}</span>
                    <span className="text-xs text-[#8E95A5]">• {hand.date}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white mt-1">{hand.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-black ${
                      hand.result === "win" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {hand.result === "win" ? `+${hand.amountWonLost}` : `-${hand.amountWonLost}`} Banks
                  </span>

                  <button
                    type="button"
                    onClick={() => onDeleteHandNote(hand.id)}
                    className="text-[#656C7C] hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Cards display */}
              <div className="bg-[#0B0D11] border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#8E95A5] block uppercase">Hero Cards</span>
                  <span className="font-extrabold text-amber-300 text-sm">{hand.heroHand}</span>
                </div>

                {hand.board && (
                  <div className="text-right">
                    <span className="text-[10px] text-[#8E95A5] block uppercase">Board Runout</span>
                    <span className="font-bold text-white text-xs">{hand.board}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {hand.notes && (
                <p className="text-xs text-[#8E95A5] leading-relaxed italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  "{hand.notes}"
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal to Log Hand */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
          <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-amber-300" />
                <h2 className="text-lg font-extrabold text-white">Log Hand to Vault</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-[#8E95A5] hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                  Hand Title / Summary
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hero River Shove vs Tripled Barrels"
                  className="w-full bg-[#181B24] border border-white/15 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                    Hero Hole Cards
                  </label>
                  <input
                    type="text"
                    required
                    value={heroHand}
                    onChange={(e) => setHeroHand(e.target.value)}
                    placeholder="e.g. A♠ K♠"
                    className="w-full bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs text-amber-300 font-mono focus:border-amber-400 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                    Position
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-bold"
                  >
                    <option value="BTN">BTN (Button)</option>
                    <option value="CO">CO (Cutoff)</option>
                    <option value="HJ">HJ (Hijack)</option>
                    <option value="UTG">UTG (Under the Gun)</option>
                    <option value="SB">SB (Small Blind)</option>
                    <option value="BB">BB (Big Blind)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                  Board Runout (Optional)
                </label>
                <input
                  type="text"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  placeholder="e.g. A♥ 10♠ 4♦ 7♠ 2♣"
                  className="w-full bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                    Stakes
                  </label>
                  <input
                    type="text"
                    value={stakes}
                    onChange={(e) => setStakes(e.target.value)}
                    className="w-full bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                    Pot Size
                  </label>
                  <input
                    type="number"
                    value={potSize}
                    onChange={(e) => setPotSize(Number(e.target.value))}
                    className="w-full bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs text-amber-300 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                    Net Result
                  </label>
                  <select
                    value={result}
                    onChange={(e) => setResult(e.target.value as "win" | "loss" | "chop")}
                    className="w-full bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="win">Win 🟢</option>
                    <option value="loss">Loss 🔴</option>
                    <option value="chop">Chop ⚪</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                  Strategic Notes & Exploits
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key villain reads, sizing tell, line taken..."
                  className="w-full bg-[#181B24] border border-white/15 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all mt-3"
              >
                <Plus size={18} />
                <span>Save Hand to Replayer Vault</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
