import React, { useState } from "react";
import { AppState, Game, User } from "../types";
import { X, Save, Spade, MessageSquare, Check, Users, Plus, UserPlus, Share2 } from "lucide-react";
import { ShareModal } from "./ShareModal";
import { shareGameInvite } from "../lib/share";

interface CreateGameModalProps {
  state: AppState;
  onClose: () => void;
  onCreateGame: (newGame: Game) => void;
  onAddPlayer?: (name: string, phone: string) => void;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({
  state,
  onClose,
  onCreateGame,
  onAddPlayer,
}) => {
  const [title, setTitle] = useState("Saturday Texas Hold'em");
  const [date, setDate] = useState("2026-07-27");
  const [time, setTime] = useState("20:00");
  const [venue, setVenue] = useState("Host Suite #3");
  const [initialBuyin, setInitialBuyin] = useState(1); // 1 Bank = 10k chips
  const [ratio, setRatio] = useState<"1:1" | "1:2">("1:1");
  const [selectedPlayerPhones, setSelectedPlayerPhones] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // New player inline addition state
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPhone, setNewPlayerPhone] = useState("");

  const playersList = Object.values(state.users || {}) as User[];

  const togglePlayerSelection = (phone: string) => {
    setSelectedPlayerPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
  };

  const handleAddNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim() && newPlayerPhone.trim() && onAddPlayer) {
      onAddPlayer(newPlayerName.trim(), newPlayerPhone.trim());
      setSelectedPlayerPhones((prev) => [...prev, newPlayerPhone.trim()]);
      setNewPlayerName("");
      setNewPlayerPhone("");
      setShowAddPlayer(false);
    }
  };

  const handleWhatsAppInvite = () => {
    const draftGame = {
      title,
      date,
      time,
      venue,
      initialBuyin,
      ratio,
      hostName: state.currentUser?.name,
    };
    shareGameInvite(draftGame);
    setShowShareModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !state.currentUser) return;

    const gameId = `game_${Date.now()}`;
    const newGame: Game = {
      id: gameId,
      title: title.trim(),
      date,
      time,
      venue: venue.trim(),
      hostPhone: state.currentUser.phone,
      hostName: state.currentUser.name,
      initialBuyin,
      rake: 0,
      ratio,
      status: "active",
      createdAt: Date.now(),
      liveCashouts: {
        [state.currentUser.phone]: 0,
      },
    };

    onCreateGame(newGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              ♠
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Host Game</h2>
              <p className="text-[11px] text-[#8E95A5]">1 Buy-in (10k Chips) = 1 Bank</p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8E95A5] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
              Game Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#181B24] border border-white/15 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
              placeholder="e.g. High Stakes Private Table"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#181B24] border border-white/15 rounded-xl p-2.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
              Venue / Location
            </label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full bg-[#181B24] border border-white/15 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Royal Lounge Suite"
            />
          </div>

          {/* Buy-in Banks & Stakes Ratio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Buy-in (1 Bank = 10k)
              </label>
              <div className="flex items-center bg-[#181B24] border border-white/15 rounded-xl px-3 py-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={initialBuyin}
                  onChange={(e) => setInitialBuyin(parseInt(e.target.value) || 1)}
                  className="w-full bg-transparent text-sm font-mono font-bold text-amber-300 focus:outline-none"
                />
                <span className="text-xs font-bold text-white/50 ml-1">Bank</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Stakes Ratio
              </label>
              <div className="grid grid-cols-2 gap-1 bg-[#181B24] border border-white/15 p-1 rounded-xl">
                {(["1:1", "1:2"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRatio(r)}
                    className={`py-1.5 text-xs font-bold rounded-lg font-mono transition-all ${
                      ratio === r
                        ? "bg-amber-400 text-black shadow-md"
                        : "text-[#8E95A5] hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Integrated Host Player Roster Selection */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#8E95A5] uppercase">
                Host Player Roster
              </label>
              <button
                type="button"
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-lg"
              >
                <UserPlus size={14} />
                <span>Add New Contact</span>
              </button>
            </div>

            {/* Quick Inline New Contact Form */}
            {showAddPlayer && (
              <div className="bg-[#181B24] border border-amber-400/30 rounded-xl p-3 space-y-2 animate-in fade-in">
                <span className="text-[10px] font-bold text-amber-300 uppercase block">
                  Add Contact to Host Roster
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="bg-[#0B0D11] border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={newPlayerPhone}
                    onChange={(e) => setNewPlayerPhone(e.target.value)}
                    className="bg-[#0B0D11] border border-white/15 rounded-lg p-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddNewPlayer}
                  className="w-full py-1.5 bg-amber-400 text-black font-extrabold text-xs rounded-lg shadow-sm"
                >
                  Save & Select Player
                </button>
              </div>
            )}

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 bg-[#181B24] border border-white/10 rounded-xl p-2">
              {playersList.map((player) => {
                const isSelected = selectedPlayerPhones.includes(player.phone);
                return (
                  <div
                    key={player.phone}
                    onClick={() => togglePlayerSelection(player.phone)}
                    className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-amber-400/20 text-white font-bold border border-amber-400/30"
                        : "text-[#8E95A5] hover:bg-white/5"
                    }`}
                  >
                    <span>{player.name} ({player.phone})</span>
                    {isSelected && <Check size={14} className="text-amber-300" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Invite Helper */}
          <button
            type="button"
            onClick={handleWhatsAppInvite}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <MessageSquare size={16} />
            <span>Share Invite via WhatsApp</span>
          </button>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all mt-2"
          >
            <Save size={18} />
            <span>Host Game</span>
          </button>
        </form>

        {showShareModal && (
          <ShareModal
            game={{
              title,
              date,
              time,
              venue,
              initialBuyin,
              ratio,
              hostName: state.currentUser?.name,
            }}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </div>
    </div>
  );
};
