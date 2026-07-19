/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import {
  Plus, LogOut, TrendingUp, Award, Calendar, MapPin,
  Clock, Shield, ArrowRight, UserCircle, Home as HomeIcon, Info, Users
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { AppState, Game, Session, User } from "../types";
import { computePlayerLedger, computeHostLedger, fmtDateTime } from "../lib/storage";
import { Avatar, RsvpBadge, ChipHero, EmptyState, BottomNav } from "./Atoms";

interface DashboardProps {
  currentUser: User;
  appState: AppState;
  onLogout: () => void;
  onSelectGame: (game: Game) => void;
  onOpenCreateGame: () => void;
  onResetData?: () => void;
}

export default function Dashboard({ currentUser, appState, onLogout, onSelectGame, onOpenCreateGame, onResetData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"games" | "profile">("games");
  const [gamesFilter, setGamesFilter] = useState<"live" | "past">("live");
  const [ledgerSubTab, setLedgerSubTab] = useState<"player" | "host">("player");

  // Load player analytics
  const playerLedger = computePlayerLedger(appState, currentUser.phone);
  const hostLedger = computeHostLedger(appState, currentUser.phone);

  // Filter games
  const allGames = Object.values(appState.games).sort((a, b) => {
    // Sort active first, then date descending
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return new Date(`${b.date}T${b.time || "00:00"}`).getTime() - new Date(`${a.date}T${a.time || "00:00"}`).getTime();
  });

  const liveGames = allGames.filter((g) => g.status === "active");
  const pastGames = allGames.filter((g) => g.status === "closed");

  const displayedGames = gamesFilter === "live" ? liveGames : pastGames;

  return (
    <div className="pn-root">
      {/* App Header styled like the High Density Felt Board */}
      <div className="pn-header flex items-center justify-between px-4 lg:px-8 h-20 border-b border-white/5 bg-[var(--ink)]">
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <Avatar phone={currentUser.phone} name={currentUser.name} size={36} />
          </div>
          <div className="pn-header-title">
            <h1 className="text-xl lg:text-2xl font-serif font-semibold tracking-tight">The Felt Board</h1>
            <div className="lg:hidden text-xs text-muted">Welcome back, {currentUser.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs text-[#9A93A6] font-medium uppercase tracking-wider">
              {liveGames.length > 0 ? "Active Table" : "Overall Stakes"}
            </span>
            <span className="text-sm font-semibold">
              {liveGames.length > 0 ? liveGames[0].title : `${playerLedger.totalNet > 0 ? "+" : ""}${playerLedger.totalNet} Banks`}
            </span>
          </div>
          
          <div className="hidden lg:block">
            <Avatar phone={currentUser.phone} name={currentUser.name} size={40} />
          </div>

          <button
            className="pn-icon-btn lg:hidden"
            onClick={onLogout}
            style={{ color: "var(--danger)" }}
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="pn-body flex-1 overflow-y-auto p-4 lg:p-8 lg:grid lg:grid-cols-12 lg:gap-8">
        {/* LEFT COLUMN: Games List & Controls */}
        <div className={`col-span-12 lg:col-span-7 flex flex-col gap-6 ${activeTab === "games" ? "flex" : "hidden lg:flex"}`}>
          <div className="hidden lg:block">
            <h2 className="text-2xl font-serif font-semibold">Live Games Feed</h2>
            <p className="text-[#9A93A6] text-sm">Host or join poker sessions on the digital felt.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                className={`pn-tag-pill ${gamesFilter === "live" ? "active" : ""}`}
                onClick={() => setGamesFilter("live")}
              >
                Live Nights ({liveGames.length})
              </button>
              <button
                className={`pn-tag-pill ${gamesFilter === "past" ? "active" : ""}`}
                onClick={() => setGamesFilter("past")}
              >
                Closed Ledger ({pastGames.length})
              </button>
            </div>
          </div>

          {/* Games List */}
          {displayedGames.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={gamesFilter === "live" ? "No Active Games" : "No Past Games"}
              sub={gamesFilter === "live" ? "Tap the floating coin below to host a poker night!" : "Finished games are archived here."}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {displayedGames.map((game) => {
                const isUserHost = game.hostPhone === currentUser.phone;
                const myInvite = Object.values(appState.invites).find(
                  (i) => i.gameId === game.id && i.phone === currentUser.phone
                );
                const isGoing = myInvite?.rsvp === "yes" || isUserHost;

                // Compute active game metrics
                const gameBuyins = Object.values(appState.buyins).filter(
                  (b) => b.gameId === game.id && b.status === "approved"
                );

                return (
                  <div
                    key={game.id}
                    className="pn-card relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.01] border border-white/10 hover:border-white/20 bg-[var(--surface)] rounded-2xl p-6"
                    onClick={() => onSelectGame(game)}
                  >
                    {isUserHost && (
                      <div className="absolute top-0 right-0 bg-[var(--gold)] text-[var(--ink)] text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                        HOSTING
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="pn-display text-lg font-serif text-[#F3EDE4]">
                          {game.title}
                        </h3>
                        <span className="text-xs text-[#9A93A6] mt-1 block">
                          by {isUserHost ? "You" : game.hostName}
                        </span>
                      </div>

                      {game.status === "active" ? (
                        <div>
                          {isGoing ? (
                            <span className="pn-badge pn-badge-yes">Confirmed</span>
                          ) : (
                            <span className="pn-badge pn-badge-pending">Pending RSVP</span>
                          )}
                        </div>
                      ) : (
                        <div className="pn-mono text-sm font-bold text-[#6FA97D]">
                          {game.results?.[currentUser.phone]?.net! > 0 ? `+${game.results?.[currentUser.phone]?.net}` : game.results?.[currentUser.phone]?.net || 0} Banks
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-[#9A93A6]">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-[#E8C77E]" />
                        <span>{fmtDateTime(game.date, game.time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-[#E8C77E]" />
                        <span className="truncate max-w-[280px]">
                          {game.venue}
                        </span>
                      </div>
                    </div>

                    <div className="pn-divider" />

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#9A93A6]">
                        Buy-in: <strong className="pn-mono text-[#F3EDE4]">{game.initialBuyin} Banks</strong>
                        {game.ratio && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-[#E8C77E] font-mono">
                            {game.ratio} Blinds
                          </span>
                        )}
                      </span>

                      {game.status === "active" && (
                        <span className="flex items-center gap-1 text-[#D4A24C] font-semibold hover:underline">
                          Enter Table <ArrowRight size={14} />
                        </span>
                      )}

                      {game.status === "closed" && (
                        <span className="text-[#9A93A6]">
                          Pot: <strong className="pn-mono text-[#F3EDE4]">{game.rakeInfo?.totalBuyins} Banks</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating action button (FAB) to host a new game */}
          <button
            className="pn-fab"
            onClick={onOpenCreateGame}
            title="Schedule Poker Night"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* RIGHT COLUMN: Profile, Charts & Ledger Stats */}
        <div className={`col-span-12 lg:col-span-5 flex flex-col gap-6 ${activeTab === "profile" ? "flex" : "hidden lg:flex"}`}>
          <div className="hidden lg:block">
            <h2 className="text-2xl font-serif font-semibold">Your Ledger Stats</h2>
            <p className="text-[#9A93A6] text-sm">Overall performance across all sessions.</p>
          </div>

          {/* Premium User Profile Card */}
          <div className="bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-1 rounded-full border-2 border-[var(--gold)]">
                <Avatar phone={currentUser.phone} name={currentUser.name} size={48} />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-[var(--cream)]">{currentUser.name}</h3>
                <span className="text-xs text-[var(--muted)]">{currentUser.phone}</span>
              </div>
              <span className="bg-[var(--gold)] text-[var(--ink)] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                Member
              </span>
            </div>

            <div className="flex gap-3 mt-1">
              <button
                type="button"
                className="pn-btn pn-btn-ghost pn-btn-sm flex-1 text-xs text-[var(--cream)]"
                onClick={onLogout}
              >
                <LogOut size={14} />
                Sign Out
              </button>
              {onResetData && (
                <button
                  type="button"
                  className="pn-btn pn-btn-sm flex-1 text-xs text-[var(--danger)] border border-[var(--danger)] hover:bg-[var(--danger)]/10"
                  style={{ background: "transparent" }}
                  onClick={onResetData}
                  title="Wipe local database"
                >
                  Clear All Data
                </button>
              )}
            </div>
          </div>

          {/* Ledger Selector Tabs */}
          {hostLedger.count > 0 && (
            <div className="flex gap-2">
              <button
                className={`pn-tag-pill ${ledgerSubTab === "player" ? "active" : ""}`}
                onClick={() => setLedgerSubTab("player")}
                style={{ flex: 1, justifyContent: "center" }}
              >
                My Player Stats
              </button>
              <button
                className={`pn-tag-pill ${ledgerSubTab === "host" ? "active" : ""}`}
                onClick={() => setLedgerSubTab("host")}
                style={{ flex: 1, justifyContent: "center" }}
              >
                Host Rake ({hostLedger.count})
              </button>
            </div>
          )}

          {/* PLAYER ANALYTICS */}
          {ledgerSubTab === "player" && (
            <>
              {/* Overall Balance Display */}
              <div className="bg-[var(--surface-raised)] p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-md">
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1 block">Total Net Profit</span>
                <span className={`text-3xl font-mono font-bold ${playerLedger.totalNet >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {playerLedger.totalNet > 0 ? `+${playerLedger.totalNet}` : playerLedger.totalNet}
                </span>
                <span className="text-[10px] text-[var(--muted)] mt-1">Banks</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[var(--muted)] uppercase block mb-1">Win Rate</span>
                  <span className="text-xl font-mono font-bold text-[var(--success)]">{playerLedger.winRate}%</span>
                  <span className="text-[9px] text-[var(--muted)] block mt-0.5">
                    {playerLedger.sessions.filter(s => s.net > 0).length} of {playerLedger.count} games
                  </span>
                </div>

                <div className="bg-[var(--surface)] p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[var(--muted)] uppercase block mb-1">Avg Buy-in</span>
                  <span className="text-xl font-mono font-bold">{playerLedger.avgBuyin}</span>
                  <span className="text-[9px] text-[var(--muted)] block mt-0.5">Banks per sitting</span>
                </div>

                <div className="bg-[var(--surface)] p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[var(--muted)] uppercase block mb-1">Biggest Scoop</span>
                  <span className="text-xl font-mono font-bold text-[var(--success)]">
                    {playerLedger.biggestWin > 0 ? `+${playerLedger.biggestWin}` : "—"}
                  </span>
                </div>

                <div className="bg-[var(--surface)] p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[var(--muted)] uppercase block mb-1">Worst Hit</span>
                  <span className="text-xl font-mono font-bold text-[var(--danger)]">
                    {playerLedger.biggestLoss < 0 ? playerLedger.biggestLoss : "—"}
                  </span>
                </div>
              </div>

              {/* Chart */}
              {playerLedger.chartData.length > 1 && (
                <div className="bg-[var(--surface-raised)] rounded-2xl p-5 border border-white/10">
                  <span className="text-xs text-[#9A93A6] uppercase tracking-wider mb-4 block">Bankroll Trend Trajectory</span>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={playerLedger.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(243,237,228,0.04)" />
                        <XAxis dataKey="session" stroke="var(--muted)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--muted)" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--surface-raised)",
                            border: "1px solid var(--hairline)",
                            borderRadius: 8,
                            fontSize: 12
                          }}
                          labelStyle={{ display: "none" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          stroke="var(--gold)"
                          strokeWidth={2.5}
                          dot={{ fill: "var(--gold-soft)", strokeWidth: 1 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Sessions Log */}
              <div className="bg-[var(--surface)] rounded-2xl p-6 border border-white/10">
                <span className="text-xs text-[#9A93A6] uppercase tracking-wider mb-4 block">Sessions Log ({playerLedger.count})</span>
                {playerLedger.sessions.length === 0 ? (
                  <div className="text-xs text-[#9A93A6] text-center py-4">No game history yet.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {playerLedger.sessions.map((s) => (
                      <div
                        key={s.gameId}
                        className="flex justify-between items-center border-b border-white/5 pb-2 cursor-pointer hover:opacity-80"
                        onClick={() => {
                          const matchedGame = appState.games[s.gameId];
                          if (matchedGame) onSelectGame(matchedGame);
                        }}
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#F3EDE4]">{s.title}</div>
                          <div className="text-[10px] text-[#9A93A6]">
                            {s.date} • {s.venue} {s.isHost && "👑"}
                          </div>
                        </div>
                        <span className={`font-mono text-sm font-semibold ${s.net > 0 ? "text-[#6FA97D]" : s.net < 0 ? "text-[#C1544B]" : "text-[#9A93A6]"}`}>
                          {s.net > 0 ? `+${s.net}` : s.net}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* HOST ANALYTICS */}
          {ledgerSubTab === "host" && (
            <>
              {/* Total Room Rake */}
              <div className="bg-[var(--surface-raised)] p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1 block">Accumulated Room Rake</span>
                <span className="text-3xl font-mono font-bold text-[var(--gold)]">
                  {hostLedger.totalRake}
                </span>
                <span className="text-[10px] text-[var(--muted)] mt-1">Banks</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[var(--muted)] uppercase block mb-1">Games Run</span>
                  <span className="text-xl font-mono font-bold text-[var(--gold)]">{hostLedger.count}</span>
                  <span className="text-[9px] text-[var(--muted)] block mt-0.5">As administrator</span>
                </div>

                <div className="bg-[var(--surface)] p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[var(--muted)] uppercase block mb-1">Total Volume</span>
                  <span className="text-xl font-mono font-bold">{hostLedger.totalPot}</span>
                  <span className="text-[9px] text-[var(--muted)] block mt-0.5">Banks in circulation</span>
                </div>
              </div>

              {/* Chart */}
              {hostLedger.chartData.length > 1 && (
                <div className="bg-[var(--surface-raised)] rounded-2xl p-5 border border-white/10">
                  <span className="text-xs text-[#9A93A6] uppercase tracking-wider mb-4 block">Rake Generated Over Time</span>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hostLedger.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(243,237,228,0.04)" />
                        <XAxis dataKey="session" stroke="var(--muted)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--muted)" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--surface-raised)",
                            border: "1px solid var(--hairline)",
                            borderRadius: 8,
                            fontSize: 12
                          }}
                          labelStyle={{ display: "none" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rake"
                          stroke="var(--success)"
                          strokeWidth={2.5}
                          dot={{ fill: "var(--success)", strokeWidth: 1 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Hosted Games Log */}
              <div className="bg-[var(--surface)] rounded-2xl p-6 border border-white/10">
                <span className="text-xs text-[#9A93A6] uppercase tracking-wider mb-4 block">Hosted Games Ledger</span>
                <div className="flex flex-col gap-3">
                  {hostLedger.games.map((g) => (
                    <div
                      key={g.id}
                      className="flex justify-between items-center border-b border-white/5 pb-2 cursor-pointer hover:opacity-80"
                      onClick={() => onSelectGame(g)}
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#F3EDE4]">{g.title}</div>
                        <div className="text-[10px] text-[#9A93A6]">
                          {g.date} • {g.venue}
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-[#6FA97D]">
                        +{g.rakeInfo?.effectiveRake} Banks
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Persistent Bottom Tab Navigation - Hidden on desktop */}
      <div className="lg:hidden">
        <BottomNav active={activeTab} go={setActiveTab} />
      </div>
    </div>
  );
}
