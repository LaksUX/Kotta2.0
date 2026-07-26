import React, { useState } from "react";
import { AppState, Game, Buyin } from "../types";
import {
  Spade,
  Calendar,
  ChevronRight,
  Award,
  MessageSquare,
  Activity,
  Flame,
  BarChart3,
  Dumbbell,
  Check,
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
  const currentPhone = state.currentUser?.phone || "9876543210";
  const currentUser = state.currentUser || { name: "Poker Host" };

  const gamesList = (Object.values(state.games) as Game[]).sort((a, b) => b.createdAt - a.createdAt);
  const activeGames = gamesList.filter((g) => g.status === "active");
  const closedGames = gamesList.filter((g) => g.status === "closed");

  // Calculate live statistics across active tables
  let totalLiveBuyinBanks = 0;
  let totalLivePlayers = 0;

  const allBuyins = Object.values(state.buyins) as Buyin[];

  activeGames.forEach((g) => {
    const gameBuyins = allBuyins
      .filter((b) => b.gameId === g.id && b.status === "approved")
      .reduce((sum, b) => sum + b.amount, 0);
    totalLiveBuyinBanks += gameBuyins;

    const gamePlayers = new Set(
      allBuyins
        .filter((b) => b.gameId === g.id && b.status === "approved")
        .map((b) => b.phone)
    ).size;
    totalLivePlayers += gamePlayers;
  });

  // Extract completed player sessions for fitness graphs
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
      date: session.date.slice(5),
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

  // Generate 28-Day Activity Heatmap Grid
  const heatmapTiles = Array.from({ length: 28 }, (_, i) => {
    const sessionMatch = playerSessions[i % (playerSessions.length || 1)];
    if (!sessionMatch || playerSessions.length === 0 || i >= playerSessions.length + 5) {
      return { status: "rest", val: 0 };
    }
    return {
      status: sessionMatch.netBanks >= 0 ? "win" : "loss",
      val: sessionMatch.netBanks,
    };
  });

  const handleWhatsAppShare = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    const text = `♠ JOIN POKER GAME ♠\n\n📌 Title: ${game.title}\n📅 Date: ${game.date}\n📍 Location: ${game.venue}\n🎟 Buy-in: ${game.initialBuyin} Bank (10k Chips)\n⚡ Ratio: ${game.ratio || "1:1"}\n👑 Host: ${game.hostName}\n\nLive Game Tracker: ${window.location.origin}?gameId=${game.id}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="p-4 space-y-4 pb-12 max-w-md mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#8E95A5] uppercase tracking-wider block">
            Poker Host & Fitness Engine
          </span>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5 font-mono">
            {currentUser.name}
            <span className="text-amber-400 text-xs font-sans font-bold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
              Host Pro
            </span>
          </h2>
        </div>
      </div>

      {/* Fitness & Live Summary Metrics Banner */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#181B24] border border-white/[0.08] rounded-xl p-2.5 text-center space-y-1">
          <span className="text-[9px] font-bold text-[#8E95A5] uppercase block">Lifetime</span>
          <span
            className={`text-sm font-black font-mono ${
              totalNetBanks >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {totalNetBanks >= 0 ? `+${totalNetBanks}` : totalNetBanks} B
          </span>
        </div>

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
          <span className="text-[9px] font-bold text-[#8E95A5] uppercase block">Live Table</span>
          <span className="text-sm font-black text-amber-300 font-mono">
            {totalLiveBuyinBanks} B
          </span>
        </div>
      </div>

      {/* SECTION 1: LIVE POKER TABLES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Poker Tables ({activeGames.length})
          </h3>
        </div>

        {activeGames.length === 0 ? (
          <div className="bg-[#181B24] border border-dashed border-white/20 rounded-2xl p-6 text-center space-y-2">
            <p className="text-xs text-[#8E95A5]">No live poker tables running currently.</p>
            <p className="text-xs text-amber-300 font-semibold">
              Tap <span className="font-extrabold underline">Host</span> at the top header to start a game.
            </p>
          </div>
        ) : (
          activeGames.map((game) => {
            const gameBuyinsList = (Object.values(state.buyins) as Buyin[]).filter(
              (b) => b.gameId === game.id && b.status === "approved"
            );
            const potTotalBanks = gameBuyinsList.reduce((acc, b) => acc + b.amount, 0);

            return (
              <div
                key={game.id}
                onClick={() => onOpenGameDetails(game)}
                className="bg-[#181B24] border border-amber-400/40 rounded-2xl p-4 space-y-3 shadow-xl hover:border-amber-400 transition-all cursor-pointer relative group"
              >
                {/* Title and Badges */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                      {game.title}
                    </h4>
                    <p className="text-xs text-[#8E95A5] flex items-center gap-1.5 mt-0.5 font-medium">
                      <Calendar size={12} /> {game.date} • {game.venue}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold">
                      {game.ratio || "1:1"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase font-mono">
                      LIVE
                    </span>
                  </div>
                </div>

                {/* Pot Stats */}
                <div className="grid grid-cols-2 gap-2 bg-[#0B0D11]/80 rounded-xl p-2.5 border border-white/5 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-[#8E95A5] uppercase block">
                      Banks in Play
                    </span>
                    <span className="text-sm font-extrabold text-amber-300 font-mono">
                      {potTotalBanks} Banks <span className="text-[10px] font-normal text-[#8E95A5]">({potTotalBanks * 10}k)</span>
                    </span>
                  </div>
                  <div className="border-l border-white/10">
                    <span className="text-[9px] font-bold text-[#8E95A5] uppercase block">
                      Initial Buy-in
                    </span>
                    <span className="text-sm font-extrabold text-white font-mono">
                      {game.initialBuyin} Bank <span className="text-[10px] font-normal text-[#8E95A5]">({game.initialBuyin * 10}k)</span>
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => handleWhatsAppShare(e, game)}
                    className="flex-1 py-2 px-3 bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-400 rounded-xl text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp Invite</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenGameDetails(game)}
                    className="flex-1 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-md"
                  >
                    <span>Open Table</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SECTION 2: FITNESS TRACKER GRAPHS */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider px-1 flex items-center gap-1.5">
          <Dumbbell size={14} className="text-amber-400" />
          Fitness Performance Log
        </h3>

        {/* Fitness Graph 1: Cumulative Bankroll Trajectory */}
        <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Bank Trajectory Curve
              </h4>
            </div>
            <span className="text-[10px] text-[#8E95A5] font-mono">1 Bank = 10k Chips</span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-[#8E95A5] italic">
              Complete sessions to render bank trajectory curves.
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
                          <div className="bg-[#0B0D11] border border-white/20 p-2 rounded-xl text-xs space-y-1 shadow-lg font-mono">
                            <p className="font-bold text-amber-300">{data.date}</p>
                            <p className="text-white">
                              Session Net:{" "}
                              <span
                                className={
                                  data.netBanks >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"
                                }
                              >
                                {data.netBanks >= 0 ? `+${data.netBanks}` : data.netBanks} Banks
                              </span>
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

        {/* Fitness Graph 2: Session Volume Bar Chart */}
        <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Session Net Volume
              </h4>
            </div>
            <span className="text-[10px] text-[#8E95A5] font-mono">Green = Win | Red = Loss</span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-xs text-[#8E95A5] italic">
              Session volume bars will appear here.
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
                            <p
                              className={
                                data.netBanks >= 0
                                  ? "text-emerald-400 font-extrabold"
                                  : "text-red-400 font-extrabold"
                              }
                            >
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

        {/* Fitness Graph 3: 28-Day Activity Grid */}
        <div className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                28-Day Session Activity Grid
              </h4>
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
      </div>

      {/* SECTION 3: COMPLETED GAME HISTORY LOG */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider">
            Completed Games Log ({closedGames.length})
          </h3>
        </div>

        {closedGames.map((game) => {
          const myResult = game.results?.[currentPhone];

          return (
            <div
              key={game.id}
              onClick={() => onOpenGameDetails(game)}
              className="bg-[#181B24] border border-white/[0.08] rounded-2xl p-4 space-y-2 cursor-pointer hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-white">{game.title}</h4>
                  <span className="text-xs text-[#8E95A5]">
                    {game.date} • {game.venue}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                    {game.ratio || "1:1"}
                  </span>
                  {myResult && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        myResult.net >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {myResult.net >= 0 ? `+${myResult.net} Banks` : `${myResult.net} Banks`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
