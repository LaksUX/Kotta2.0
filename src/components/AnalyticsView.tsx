import React from "react";
import { AppState, Game } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Award, TrendingUp, Flame, Zap, Clock, ShieldCheck, Target, ArrowUpRight } from "lucide-react";

interface AnalyticsViewProps {
  state: AppState;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ state }) => {
  // Compute analytics based on closed games
  const closedGames = (Object.values(state.games || {}) as Game[]).filter((g) => g.status === "closed");
  const currentUserPhone = state.currentUser?.phone || "9876543210";

  let totalProfit = 0;
  let totalHours = 18.5; // default tracked hours
  let winningSessions = 0;
  let totalSessions = closedGames.length || 5;

  closedGames.forEach((g) => {
    if (g.results && g.results[currentUserPhone]) {
      const net = g.results[currentUserPhone].net;
      totalProfit += net;
      if (net > 0) winningSessions++;
    }
  });

  const hourlyRate = (totalProfit / (totalHours || 1)).toFixed(1);
  const bbPerHour = ((totalProfit / (totalHours || 1)) / 2).toFixed(1); // assuming $1/$2 blinds
  const winRatePercent = Math.round((winningSessions / (totalSessions || 1)) * 100);

  // Bankroll growth trend chart data
  const bankrollTrend = [
    { session: "Jun 10", bankroll: 1000 },
    { session: "Jun 24", bankroll: 1350 },
    { session: "Jul 05", bankroll: 1200 },
    { session: "Jul 15", bankroll: 1550 },
    { session: "Jul 20", bankroll: 1900 },
    { session: "Jul 24", bankroll: 2250 },
  ];

  // Fitness style activity heat tiles (30 days grid simulation)
  const heatmapTiles = [
    { day: 1, status: "win", amount: 150 },
    { day: 2, status: "none", amount: 0 },
    { day: 3, status: "win", amount: 200 },
    { day: 4, status: "loss", amount: -100 },
    { day: 5, status: "none", amount: 0 },
    { day: 6, status: "win", amount: 350 },
    { day: 7, status: "win", amount: 120 },
    { day: 8, status: "none", amount: 0 },
    { day: 9, status: "none", amount: 0 },
    { day: 10, status: "loss", amount: -150 },
    { day: 11, status: "win", amount: 280 },
    { day: 12, status: "win", amount: 190 },
    { day: 13, status: "none", amount: 0 },
    { day: 14, status: "win", amount: 310 },
    { day: 15, status: "win", amount: 180 },
    { day: 16, status: "none", amount: 0 },
    { day: 17, status: "loss", amount: -80 },
    { day: 18, status: "win", amount: 240 },
    { day: 19, status: "none", amount: 0 },
    { day: 20, status: "win", amount: 350 },
    { day: 21, status: "none", amount: 0 },
    { day: 22, status: "none", amount: 0 },
    { day: 23, status: "win", amount: 410 },
    { day: 24, status: "win", amount: 290 },
  ];

  return (
    <div className="p-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* Fitness-style Performance KPI Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Hourly Pace Card */}
        <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-3.5 space-y-1 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8E95A5]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Hourly Pace</span>
            <Zap size={15} className="text-amber-300" />
          </div>
          <div className="text-xl font-black font-mono text-white flex items-baseline gap-1">
            +{hourlyRate} <span className="text-xs text-amber-300 font-sans">Banks/hr</span>
          </div>
          <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <ArrowUpRight size={12} /> {bbPerHour} BB/hr rate
          </p>
        </div>

        {/* Win Rate % */}
        <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-3.5 space-y-1 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8E95A5]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Win Consistency</span>
            <Target size={15} className="text-emerald-400" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-400">
            {winRatePercent}% <span className="text-xs text-[#8E95A5] font-sans">Sessions</span>
          </div>
          <p className="text-[10px] text-[#8E95A5]">
            {winningSessions} Wins / {totalSessions} Played
          </p>
        </div>
      </div>

      {/* Consistency Streak Heatmap Grid */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-amber-400 fill-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              30-Day Win Heatmap
            </h3>
          </div>

          <span className="text-xs font-extrabold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            🔥 4-Day Win Streak
          </span>
        </div>

        {/* Tiles Grid */}
        <div className="grid grid-cols-8 gap-1.5 pt-1">
          {heatmapTiles.map((tile, idx) => (
            <div
              key={idx}
              title={`Day ${tile.day}: ${tile.amount > 0 ? `+${tile.amount}` : tile.amount} Banks`}
              className={`h-7 rounded-lg border flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                tile.status === "win"
                  ? "bg-emerald-500/25 border-emerald-400/50 text-emerald-300 shadow-sm shadow-emerald-500/20"
                  : tile.status === "loss"
                  ? "bg-red-500/25 border-red-400/50 text-red-300"
                  : "bg-white/[0.03] border-white/5 text-white/20"
              }`}
            >
              {tile.day}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#8E95A5] pt-1 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-400/50 inline-block" /> Win Day
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-red-500/30 border border-red-400/50 inline-block" /> Loss Day
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-white/10 inline-block" /> Rest Day
          </span>
        </div>
      </div>

      {/* Bankroll Growth Chart (Fitness Volume Curve) */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Cumulative Bankroll Trajectory
            </h3>
            <p className="text-[11px] text-[#8E95A5]">Fitness-style growth graph in Banks</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            +$1,250 Net
          </span>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bankrollTrend}>
              <defs>
                <linearGradient id="bankrollColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F3D375" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F3D375" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="session" stroke="#656C7C" fontSize={11} tickLine={false} />
              <YAxis stroke="#656C7C" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B0D11",
                  borderColor: "#2A2F3D",
                  borderRadius: "12px",
                  color: "#FFF",
                }}
              />
              <Area
                type="monotone"
                dataKey="bankroll"
                stroke="#F3D375"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#bankrollColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Personal Records / PRs (Fitness Trophy Room) */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
          <Award size={18} className="text-amber-300" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Personal Bests & Records (PRs)
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] text-[#8E95A5] font-bold uppercase block">
              🏆 Max Single Win
            </span>
            <span className="text-sm font-mono font-extrabold text-emerald-400">
              +350 Banks
            </span>
            <span className="text-[10px] text-[#8E95A5] block">July 20 Session</span>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] text-[#8E95A5] font-bold uppercase block">
              ⚡ Best Hourly Rate
            </span>
            <span className="text-sm font-mono font-extrabold text-amber-300">
              +116 Banks/hr
            </span>
            <span className="text-[10px] text-[#8E95A5] block">3-Hour Sprint</span>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] text-[#8E95A5] font-bold uppercase block">
              ⏱️ Longest Session
            </span>
            <span className="text-sm font-mono font-extrabold text-white">
              6.5 Hours
            </span>
            <span className="text-[10px] text-[#8E95A5] block">The Royal Lounge</span>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] text-[#8E95A5] font-bold uppercase block">
              📈 Longest Win Streak
            </span>
            <span className="text-sm font-mono font-extrabold text-emerald-400">
              5 Sessions
            </span>
            <span className="text-[10px] text-[#8E95A5] block">June 2026 Run</span>
          </div>
        </div>
      </div>
    </div>
  );
};
