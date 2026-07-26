import React, { useState } from "react";
import { AppState, Game } from "../types";
import { X, Save, Spade, Clock, MapPin, DollarSign, Award } from "lucide-react";

interface CreateGameModalProps {
  state: AppState;
  onClose: () => void;
  onCreateGame: (newGame: Game) => void;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({
  state,
  onClose,
  onCreateGame,
}) => {
  const [title, setTitle] = useState("Saturday Texas Hold'em");
  const [date, setDate] = useState("2026-07-27");
  const [time, setTime] = useState("20:00");
  const [venue, setVenue] = useState("Host Suite #3");
  const [initialBuyin, setInitialBuyin] = useState(500);
  const [rake, setRake] = useState(50);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [ratio, setRatio] = useState<"1:1" | "1:2">("1:1");

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
      rake,
      maxPlayers,
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
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              ♠
            </div>
            <h2 className="text-lg font-extrabold text-white">Host New Poker Game</h2>
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
              placeholder="e.g. Friday High Stakes"
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
              placeholder="e.g. Royal Lounge Penthouse"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Initial Buy-in (Banks)
              </label>
              <input
                type="number"
                step={50}
                required
                value={initialBuyin}
                onChange={(e) => setInitialBuyin(parseInt(e.target.value) || 0)}
                className="w-full bg-[#181B24] border border-white/15 rounded-xl p-3 text-sm font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8E95A5] uppercase block mb-1">
                Host Rake (Banks)
              </label>
              <input
                type="number"
                step={10}
                required
                value={rake}
                onChange={(e) => setRake(parseInt(e.target.value) || 0)}
                className="w-full bg-[#181B24] border border-white/15 rounded-xl p-3 text-sm font-mono font-bold text-emerald-400 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all mt-4"
          >
            <Save size={18} />
            <span>Launch Live Poker Table</span>
          </button>
        </form>
      </div>
    </div>
  );
};
