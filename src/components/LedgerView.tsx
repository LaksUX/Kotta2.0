import React, { useState } from "react";
import { AppState, Game } from "../types";
import {
  TrendingUp,
  Award,
  Zap,
  Activity,
  Calendar,
  Flame,
  Clock,
  ShieldAlert,
  ChevronRight,
  Filter,
  BarChart3,
  Dumbbell,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";

interface LedgerViewProps {
  state: AppState;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ state }) => {
  const currentPhone = state.currentUser?.phone || "9876543210";
  const currentUser = state.currentUser || { name: "Player" };

  const closedGames = (Object.values(state.games) as Game[])
    .filter((g) => g.status === "closed")
    .sort((a, b) => (a.closedAt || a.createdAt) - (b.closedAt || b.createdAt));

  // Extract sessions where the current player participated
  const playerSessions = closedGames
    .map((game) => {
      const res = game.results?.[currentPhone];
      if (!res) return null;
      return {
        id: game.id,
        title: game.title,
        date: game.date,
        venue: game.venue,
        ratio: game.ratio || "1:1",
        buyinBanks: res.buyin,
        cashoutBanks: res.cashout,
        netBanks: res.net,
        timestamp: game.closedAt || game.createdAt,
      };
    })
    .filter(Boolean) as {
      id: string;
      title: string;
      date: string;
      venue: string;
      ratio: string;
      buyinBanks: number;
      cashoutBanks: number;
      netBanks: number;
      timestamp: number;
    }[];

  // Calculate Fitness KPI stats
  let cumulativeBanks = 0;
  const chartData = playerSessions.map((session, index) => {
    cumulativeBanks += session.netBanks;
    return {
      sessionIndex: index + 1,
      date: session.date.slice(5), // MM-DD
      netBanks: session.netBanks,
      cumulativeBanks,
      buyin: session.buyinBanks,
      cashout: session.cashoutBanks,
    };
  });

  const totalSessions = playerSessions.length;
  const totalNetBanks = cumulativeBanks;
  const totalChips = totalNetBanks * 10; // 1 Bank = 10k Chips
  const winSessions = playerSessions.filter((s) => s.netBanks > 0).length;
  const winRate = totalSessions > 0 ? Math.round((winSessions / totalSessions) * 100) : 0;

  // Max PR single session win
  const maxWinPR = playerSessions.reduce(
    (max, s) => (s.netBanks > max ? s.netBanks : max),
    0
  );

  // Active Win Streak
  let activeStreak = 0;
  for (let i = playerSessions.length - 1; i >= 0; i--) {
    if (playerSessions[i].netBanks > 0) {
      activeStreak++;
    } else {
      break;
    }
  }

  // Generate 30-Day Activity Heatmap Grid (Fitness Tracker style)
  const heatmapTiles = Array.from({ length: 28 }, (_, i) => {
    const sessionMatch = playerSessions[i % playerSessions.length];
    if (!sessionMatch || i >= playerSessions.length + 5) {
      return { status: "rest", val: 0 };
    }
    return {
      status: sessionMatch.netBanks >= 0 ? "win" : "loss",
      val: sessionMatch.netBanks,
    };
  });

  return (
    <div className="p-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* Fitness Log Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#8E95A5] uppercase tracking-wider block flex items-center gap-1">
            <Dumbbell size={12} className="text-amber-400" /> Player Fitness Log
          </span>
          <h2 className="text-xl font-black text-white tracking-tight font-mono">
            {currentUser.name}'s Tracker
          </h2>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-[#8E95A5] uppercase block">
            Lifetime Net
          </span>
          <span
            className={`text-lg font-black font-mono ${
              totalNetBanks >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {totalNetBanks >= 0 ? `+${totalNetBanks}` : totalNetBanks} Banks
          </span>
        </div>
      </div>

      {/* Fitness Tracker Core KPIs */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#181B24] border border-white/[0.08] rounded-xl p-2.5 text-center space-y-1">
          <span className="text-[9px] font-bold text-[#8E95A5] uppercase block">Win %</span>
          <span className="text-sm font-black text-emerald-400 font-mono">{winRate}%</span>
        </div>

        <div className="bg-[#181B24] border border-white/[0.08] rounded-xl p-2.5 text-center space-y-1">
          <span className="text-[9px] font-bold text-[#8E95A5] uppercase block">Streak</span>
          <span className="text-sm font-black text-amber-300 font-mono flex items-center justify-center gap-0.5">
            <Flame size={12} className="fill-amber-400" /> {activeStreak}
          </span>
        </div>

        <div className="bg-[#181B24] border border-white/[0.08] rounded-xl p-2.5 text-center space-y-1">
          <span className="text-[9px] font-bold text-[#8E95A5] uppercase block">Best PR</span>
          <span className="text-sm font-black text-amber-300 font-mono">
            +{maxWinPR} B
          </span>
        </div>

        <div className="bg-[#181B24] border border-white/[0.08] rounded-xl p-2.5 text-center space-y-1">
          <span className="text-[9px] font-bold text-[#8E95A5] uppercase block">Chips</span>
          <span className="text-sm font-black text-white font-mono">
            {totalChips > 0 ? `+${totalChips}k` : `${totalChips}k`}
          </span>
        </div>
      </div>

      {/* Fitness Graph 1: Cumulative Bankroll Trajectory Curve */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Cumulative Bank Trajectory
            </h3>
          </div>
          <span className="text-[10px] text-[#8E95A5] font-mono">1 Bank = 10k Chips</span>
        </div>

        {chartData.length === 0 ? (
          <div className="h-36 flex items-center justify-center text-xs text-[#8E95A5] italic">
            No completed player sessions logged yet.
          </div>
        ) : (
          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="bankGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#656C7C" fontSize={10} tickLine={false} />
                <YAxis stroke="#656C7C" fontSize={10} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0B0D11] border border-white/20 p-2 rounded-xl text-xs space-y-1 shadow-lg">
                          <p className="font-bold text-amber-300">{data.date}</p>
                          <p className="text-white">
                            Session Net: <span className={data.netBanks >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{data.netBanks >= 0 ? `+${data.netBanks}` : data.netBanks} Banks</span>
                          </p>
                          <p className="text-[#8E95A5]">
                            Cumulative: {data.cumulativeBanks} Banks ({data.cumulativeBanks * 10}k Chips)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="cumulativeBanks"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#bankGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Fitness Graph 2: Session-by-Session Volume Bar Chart */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Session Volume (Banks Net)
            </h3>
          </div>
          <span className="text-[10px] text-[#8E95A5] font-mono">Green = Win | Red = Loss</span>
        </div>

        {chartData.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-xs text-[#8E95A5] italic">
            Play sessions to unlock session volume graphs.
          </div>
        ) : (
          <div className="h-36 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#656C7C" fontSize={10} tickLine={false} />
                <YAxis stroke="#656C7C" fontSize={10} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0B0D11] border border-white/20 p-2 rounded-xl text-xs space-y-1 shadow-lg font-mono">
                          <p className="text-amber-300 font-bold">{data.date}</p>
                          <p className="text-white">Buy-in: {data.buyin} Banks</p>
                          <p className="text-white">Cash-out: {data.cashout} Banks</p>
                          <p className={data.netBanks >= 0 ? "text-emerald-400 font-extrabold" : "text-red-400 font-extrabold"}>
                            Net: {data.netBanks >= 0 ? `+${data.netBanks}` : data.netBanks} Banks
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="netBanks" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.netBanks >= 0 ? "#10B981" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Fitness Graph 3: 28-Day Fitness Streak Heat Grid */}
      <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              28-Day Session Activity Grid
            </h3>
          </div>
          <span className="text-[10px] text-[#8E95A5]">Fitness Heatmap</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {heatmapTiles.map((tile, idx) => {
            let bgClass = "bg-white/5 border border-white/5";
            if (tile.status === "win") {
              bgClass = "bg-emerald-500/80 border border-emerald-400 shadow-sm shadow-emerald-500/30";
            } else if (tile.status === "loss") {
              bgClass = "bg-red-500/80 border border-red-400 shadow-sm shadow-red-500/30";
            }

            return (
              <div
                key={idx}
                title={tile.status !== "rest" ? `${tile.val} Banks` : "Rest Day"}
                className={`h-7 rounded-lg flex items-center justify-center text-[9px] font-mono font-bold transition-all ${bgClass}`}
              >
                {tile.status === "win" ? `+${tile.val}` : tile.status === "loss" ? tile.val : ""}
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Personal Session Log History */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider">
            My Game Log History ({playerSessions.length})
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono">🔒 Player Private Log</span>
        </div>

        {playerSessions.length === 0 ? (
          <div className="bg-[#181B24] border border-white/10 rounded-2xl p-6 text-center text-xs text-[#8E95A5]">
            No completed games in your personal player log yet.
          </div>
        ) : (
          playerSessions.map((s) => (
            <div
              key={s.id}
              className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div>
                  <h4 className="text-sm font-extrabold text-white">{s.title}</h4>
                  <p className="text-xs text-[#8E95A5]">
                    {s.date} • {s.venue}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 text-[10px] font-mono font-bold">
                    {s.ratio}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      s.netBanks >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {s.netBanks >= 0 ? `+${s.netBanks} Banks` : `${s.netBanks} Banks`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="bg-[#0B0D11] p-2 rounded-xl text-center border border-white/5">
                  <span className="text-[9px] text-[#8E95A5] uppercase block">Buy-in</span>
                  <span className="text-white font-bold">{s.buyinBanks} Bank ({s.buyinBanks * 10}k)</span>
                </div>
                <div className="bg-[#0B0D11] p-2 rounded-xl text-center border border-white/5">
                  <span className="text-[9px] text-[#8E95A5] uppercase block">Cash-out</span>
                  <span className="text-emerald-400 font-bold">{s.cashoutBanks} Banks ({s.cashoutBanks * 10}k)</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
