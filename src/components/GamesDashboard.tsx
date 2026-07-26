import React from "react";
import { AppState, Game, Buyin } from "../types";
import {
  Flame,
  Plus,
  Play,
  Share2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  Award,
} from "lucide-react";
import { colorForPhone, initials } from "../lib/storage";

interface GamesDashboardProps {
  state: AppState;
  onOpenGameDetails: (game: Game) => void;
  onOpenCreateGame: () => void;
}

export const GamesDashboard: React.FC<GamesDashboardProps> = ({
  state,
  onOpenGameDetails,
  onOpenCreateGame,
}) => {
  const gamesList = (Object.values(state.games) as Game[]).sort((a, b) => b.createdAt - a.createdAt);
  const activeGames = gamesList.filter((g) => g.status === "active");
  const closedGames = gamesList.filter((g) => g.status === "closed");

  // Calculate live statistics across tables
  let totalLiveBuyins = 0;
  let totalLivePlayers = 0;

  const allBuyins = Object.values(state.buyins) as Buyin[];

  activeGames.forEach((g) => {
    // sum buyins
    const gameBuyins = allBuyins
      .filter((b) => b.gameId === g.id && b.status === "approved")
      .reduce((sum, b) => sum + b.amount, 0);
    totalLiveBuyins += gameBuyins;

    const gamePlayers = new Set(
      allBuyins
        .filter((b) => b.gameId === g.id && b.status === "approved")
        .map((b) => b.phone)
    ).size;
    totalLivePlayers += gamePlayers;
  });

  // Calculate total rake collected across closed games
  const totalRakeCollected = closedGames.reduce((acc, g) => acc + (g.rake || 0), 0);

  // Generate monthly game frequency dots array (like the reference grid)
  const daysInMonth = Array.from({ length: 28 }, (_, i) => {
    const day = i + 1;
    // mock active days for visual bento frequency matrix
    const hasGame = day % 3 === 0 || day === 24 || day === 20;
    const isToday = day === 26;
    return { day, hasGame, isToday };
  });

  return (
    <div className="p-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* Top Banner: User Greeting & Quick Context */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#8E95A5] uppercase tracking-wider block">
            Welcome back
          </span>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5 font-mono">
            {state.currentUser?.name || "Poker Host"}
            <span className="text-amber-400 text-sm font-sans font-bold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
              Host Pro
            </span>
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateGame}
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 text-black flex items-center justify-center shadow-lg shadow-amber-400/20 active:scale-95 transition-transform"
          title="Host New Game"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Hero Bento Cards Grid (Inspired by the Reference UI) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Active Pot & Live Table Stats */}
        <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8E95A5] uppercase tracking-wider">
              Live Tables
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
              {totalLiveBuyins.toLocaleString()}
              <span className="text-xs text-amber-300 font-sans font-extrabold">Banks</span>
            </div>
            <p className="text-[11px] text-[#8E95A5] mt-0.5">
              {totalLivePlayers} Players at {activeGames.length} active {activeGames.length === 1 ? "table" : "tables"}
            </p>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-bold text-amber-300">
            <span>Pot Volume</span>
            <span className="font-mono">{activeGames.length > 0 ? "LIVE NOW" : "0 TABLES"}</span>
          </div>
        </div>

        {/* Card 2: Rake & Bankroll Metrics */}
        <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8E95A5] uppercase tracking-wider">
              Rake Revenue
            </span>
            <Award size={16} className="text-amber-300" />
          </div>

          <div>
            <div className="text-2xl font-black text-amber-300 font-mono flex items-baseline gap-1">
              +{totalRakeCollected}
              <span className="text-xs text-white font-sans font-extrabold">Banks</span>
            </div>
            <p className="text-[11px] text-[#8E95A5] mt-0.5">
              Across {closedGames.length} settled session(s)
            </p>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-bold text-emerald-400">
            <span>Variance</span>
            <span className="font-mono font-extrabold">0% (Balanced)</span>
          </div>
        </div>
      </div>

      {/* Bento Heatmap / Monthly Game Frequency Grid (Reference UI Style) */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Game Activity Frequency
            </h3>
            <p className="text-[11px] text-[#8E95A5]">July 2026 Home Games Logged</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 font-mono bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
            <Flame size={12} className="fill-amber-300" /> 3 Games / Wk
          </div>
        </div>

        {/* Dots Matrix */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {daysInMonth.map((d) => (
            <div
              key={d.day}
              className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                d.isToday
                  ? "bg-amber-400 text-black ring-2 ring-amber-300 ring-offset-2 ring-offset-[#181B24]"
                  : d.hasGame
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-[#0B0D11] border border-white/[0.05] text-[#656C7C]"
              }`}
            >
              {d.day}
            </div>
          ))}
        </div>
      </div>

      {/* Live Active Tables Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Live Game Tables ({activeGames.length})
          </h3>
          <span className="text-xs text-amber-300 font-bold font-mono">1:1 / 1:2 Banks</span>
        </div>

        {activeGames.length === 0 ? (
          <div className="bg-[#181B24] border border-dashed border-white/20 rounded-2xl p-6 text-center space-y-3">
            <p className="text-xs text-[#8E95A5]">No active games running right now.</p>
            <button
              onClick={onOpenCreateGame}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold text-xs rounded-xl shadow-md"
            >
              Start New Poker Game
            </button>
          </div>
        ) : (
          activeGames.map((game, idx) => {
            const gameBuyinsList = (Object.values(state.buyins) as Buyin[]).filter(
              (b) => b.gameId === game.id && b.status === "approved"
            );
            const pendingBuyins = (Object.values(state.buyins) as Buyin[]).filter(
              (b) => b.gameId === game.id && b.status === "pending"
            );
            const potTotal = gameBuyinsList.reduce((acc, b) => acc + b.amount, 0);

            return (
              <div
                key={game.id}
                onClick={() => onOpenGameDetails(game)}
                className="bg-[#181B24] border border-amber-400/30 rounded-2xl p-4 space-y-3.5 shadow-xl hover:border-amber-400 transition-all cursor-pointer relative group"
              >
                {/* Header with Circular Badge #1 */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-black font-mono text-base shadow-inner">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                        {game.title}
                      </h4>
                      <p className="text-xs text-[#8E95A5] font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar size={12} /> {game.date} @ {game.time} • {game.venue}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider font-mono">
                    LIVE TABLE
                  </span>
                </div>

                {/* Pot & Buyin Badges */}
                <div className="grid grid-cols-3 gap-2 bg-[#0B0D11]/80 rounded-xl p-2.5 border border-white/5 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-[#8E95A5] uppercase tracking-wider block">
                      Pot Pool
                    </span>
                    <span className="text-sm font-extrabold text-amber-300 font-mono">
                      {potTotal} <span className="text-[10px]">Banks</span>
                    </span>
                  </div>
                  <div className="border-x border-white/10">
                    <span className="text-[9px] font-bold text-[#8E95A5] uppercase tracking-wider block">
                      Min Buyin
                    </span>
                    <span className="text-sm font-extrabold text-white font-mono">
                      {game.initialBuyin}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#8E95A5] uppercase tracking-wider block">
                      Host Rake
                    </span>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">
                      {game.rake}
                    </span>
                  </div>
                </div>

                {/* Pending Re-buys Alert Banner */}
                {pendingBuyins.length > 0 && (
                  <div className="p-2.5 bg-amber-400/15 border border-amber-400/30 rounded-xl flex items-center justify-between text-xs font-bold text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={15} />
                      <span>{pendingBuyins.length} pending re-buy request(s)</span>
                    </div>
                    <span className="underline text-[11px]">Approve Now &rarr;</span>
                  </div>
                )}

                {/* Action CTA Footer */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1 text-[#8E95A5]">
                    <Users size={14} />
                    <span>{gameBuyinsList.length} buy-ins approved</span>
                  </div>
                  <span className="text-amber-300 font-extrabold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Manage Table <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Past Completed Games & Settled Ledgers */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider px-1">
          Settled Games History ({closedGames.length})
        </h3>

        {closedGames.map((game, idx) => {
          const totalVol = game.rakeInfo?.totalBuyins || 1800;

          return (
            <div
              key={game.id}
              onClick={() => onOpenGameDetails(game)}
              className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-2.5 shadow-md hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                    {game.title}
                  </h4>
                  <span className="text-xs text-[#8E95A5]">
                    {game.date} • {game.venue}
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-mono font-bold">
                  CLOSED & SETTLED
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06] font-mono">
                <span className="text-[#8E95A5]">Total Table Volume:</span>
                <span className="font-bold text-white">{totalVol} Banks</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
