/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AppState, Session, Game, User, Invite, Buyin } from "./types";
import {
  loadAppState, saveAppState, loadSession, saveSession,
  clearSessionStorage, hashPin
} from "./lib/storage";
import { Plus, Users, CheckCircle, AlertTriangle, Sparkles, X } from "lucide-react";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import GameDetails from "./components/GameDetails";
import CreateGame from "./components/CreateGame";
import HoysalaLogo from "./components/HoysalaLogo";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

  :root {
    --ink: #0A0D14;
    --surface: #141A24;
    --surface-raised: #1E2633;
    --felt: #15452C;
    --felt-soft: #1E633F;
    --gold: #D4AF37;
    --gold-soft: #F3D375;
    --cream: #F6F5F2;
    --muted: #8290A6;
    --danger: #E06C75;
    --success: #4EBA86;
    --hairline: rgba(255, 255, 255, 0.08);
  }

  body {
    margin: 0;
    padding: 0;
    background-color: #06080B;
    color: var(--cream);
    font-family: 'Inter', sans-serif;
  }

  .pn-root {
    font-family: 'Inter', sans-serif;
    background: var(--ink);
    color: var(--cream);
    min-height: 100vh;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .pn-display {
    font-family: 'Fraunces', serif;
  }

  .pn-mono {
    font-family: 'IBM Plex Mono', monospace;
    font-variant-numeric: tabular-nums;
  }

  .pn-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(27, 23, 32, 0.92);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--hairline);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pn-header-title {
    font-size: 18px;
    font-weight: 600;
    flex: 1;
  }

  .pn-icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--cream);
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .pn-icon-btn:hover {
    background: var(--surface-raised);
  }

  .pn-icon-btn:active {
    background: var(--surface);
  }

  .pn-body {
    flex: 1;
    padding: 16px;
    padding-bottom: 40px;
  }

  .pn-card {
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: 16px;
    padding: 16px;
  }

  .pn-card + .pn-card {
    margin-top: 12px;
  }

  .pn-label {
    font-size: 12px;
    color: var(--muted);
    font-weight: 500;
    letter-spacing: .02em;
    margin-bottom: 6px;
    display: block;
  }

  .pn-input, .pn-select, .pn-textarea {
    width: 100%;
    background: var(--surface-raised);
    border: 1px solid var(--hairline);
    color: var(--cream);
    border-radius: 10px;
    padding: 11px 12px;
    font-size: 15px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }

  .pn-input:focus, .pn-select:focus, .pn-textarea:focus {
    border-color: var(--gold);
  }

  .pn-textarea {
    resize: none;
    min-height: 64px;
  }

  .pn-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    width: 100%;
    transition: transform 0.1s, opacity 0.2s;
  }

  .pn-btn:active {
    transform: scale(0.98);
  }

  .pn-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .pn-btn-primary {
    background: var(--gold);
    color: var(--ink);
  }

  .pn-btn-primary:hover {
    opacity: 0.9;
  }

  .pn-btn-felt {
    background: var(--felt);
    color: var(--cream);
  }

  .pn-btn-felt:hover {
    background: var(--felt-soft);
  }

  .pn-btn-ghost {
    background: var(--surface-raised);
    color: var(--cream);
    border: 1px solid var(--hairline);
  }

  .pn-btn-ghost:hover {
    background: rgba(243, 237, 228, 0.05);
  }

  .pn-btn-danger {
    background: transparent;
    color: var(--danger);
    border: 1px solid var(--danger);
  }

  .pn-btn-danger:hover {
    background: rgba(193, 84, 75, 0.1);
  }

  .pn-btn-sm {
    padding: 8px 12px;
    font-size: 13px;
    width: auto;
  }

  .pn-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .03em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 999px;
  }

  .pn-badge-draft {
    background: rgba(154, 147, 166, 0.18);
    color: var(--muted);
  }

  .pn-badge-active {
    background: rgba(111, 169, 125, 0.18);
    color: var(--success);
  }

  .pn-badge-closed {
    background: rgba(154, 147, 166, 0.12);
    color: var(--muted);
  }

  .pn-badge-yes {
    background: rgba(111, 169, 125, 0.18);
    color: var(--success);
  }

  .pn-badge-no {
    background: rgba(193, 84, 75, 0.18);
    color: var(--danger);
  }

  .pn-badge-maybe {
    background: rgba(212, 162, 76, 0.18);
    color: var(--gold-soft);
  }

  .pn-badge-pending {
    background: rgba(212, 162, 76, 0.15);
    color: var(--gold-soft);
  }

  .pn-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: var(--ink);
    flex-shrink: 0;
  }

  .pn-chip-hero {
    width: 104px;
    height: 104px;
    border-radius: 50%;
    background: repeating-conic-gradient(var(--gold) 0deg 9deg, var(--gold-soft) 9deg 18deg);
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }

  .pn-chip-hero-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--ink);
    border: 2px dashed rgba(243, 237, 228, 0.28);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .pn-empty {
    text-align: center;
    padding: 36px 20px;
    color: var(--muted);
  }

  .pn-divider {
    height: 1px;
    background: var(--hairline);
    margin: 14px 0;
    border: none;
  }

  .pn-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pn-tag-pill {
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid var(--hairline);
    background: var(--surface-raised);
    color: var(--cream);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  }

  .pn-tag-pill.active {
    background: var(--gold);
    color: var(--ink);
    border-color: var(--gold);
  }

  .pn-fab {
    position: fixed;
    bottom: 80px;
    right: calc(50% - 230px + 20px);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--gold);
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
    border: none;
    cursor: pointer;
    z-index: 20;
    transition: transform 0.2s;
  }

  .pn-fab:hover {
    transform: scale(1.05);
  }

  .pn-fab:active {
    transform: scale(0.95);
  }

  @media (max-width: 500px) {
    .pn-fab {
      right: 20px;
    }
  }

  @keyframes slideDown {
    0% {
      transform: translateY(-20px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

function getSeedState(): AppState {
  const users: Record<string, User> = {
    "9876543210": { phone: "9876543210", name: "Rohan Mehta", pinHash: hashPin("9876543210", "1234") },
    "9820011223": { phone: "9820011223", name: "Amit Sharma", pinHash: hashPin("9820011223", "1234") },
    "9930055443": { phone: "9930055443", name: "Saurav Sen", pinHash: hashPin("9930055443", "1234") },
    "9819922110": { phone: "9819922110", name: "Deepak Kapoor", pinHash: hashPin("9819922110", "1234") }
  };

  const game1Id = "game_past_1";
  const game2Id = "game_active_2";

  const games: Record<string, Game> = {
    [game1Id]: {
      id: game1Id,
      title: "Friday Deepstack Classic",
      date: "2026-07-15",
      time: "20:00",
      venue: "Rohan's Living Room",
      hostPhone: "9876543210",
      hostName: "Rohan Mehta",
      initialBuyin: 100,
      rake: 10,
      maxPlayers: 8,
      status: "closed",
      createdAt: Date.now() - 3 * 24 * 3600 * 1000,
      closedAt: Date.now() - 3 * 24 * 3600 * 1000 + 4 * 3600 * 1000,
      results: {
        "9876543210": { cashout: 130, buyin: 100, net: 30, totalBuyins: 100 },
        "9820011223": { cashout: 40, buyin: 100, net: -60, totalBuyins: 100 },
        "9930055443": { cashout: 120, buyin: 100, net: 20, totalBuyins: 100 },
        "9819922110": { cashout: 100, buyin: 100, net: 0, totalBuyins: 100 }
      },
      rakeInfo: {
        totalBuyins: 400,
        actualCashoutSum: 390,
        expectedPool: 390,
        variance: 0,
        effectiveRake: 10
      }
    },
    [game2Id]: {
      id: game2Id,
      title: "Weekend Cash Shakedown",
      date: "2026-07-19",
      time: "19:30",
      venue: "Rohan's Penthouse Lounge",
      hostPhone: "9876543210",
      hostName: "Rohan Mehta",
      initialBuyin: 100,
      rake: 5,
      maxPlayers: 9,
      status: "active",
      createdAt: Date.now() - 1 * 24 * 3600 * 1000
    }
  };

  const invites: Record<string, Invite> = {
    "inv_1_1": { id: "inv_1_1", gameId: game1Id, phone: "9876543210", rsvp: "yes", updatedAt: Date.now() },
    "inv_1_2": { id: "inv_1_2", gameId: game1Id, phone: "9820011223", rsvp: "yes", updatedAt: Date.now() },
    "inv_1_3": { id: "inv_1_3", gameId: game1Id, phone: "9930055443", rsvp: "yes", updatedAt: Date.now() },
    "inv_1_4": { id: "inv_1_4", gameId: game1Id, phone: "9819922110", rsvp: "yes", updatedAt: Date.now() },

    "inv_2_1": { id: "inv_2_1", gameId: game2Id, phone: "9876543210", rsvp: "yes", updatedAt: Date.now() },
    "inv_2_2": { id: "inv_2_2", gameId: game2Id, phone: "9820011223", rsvp: "yes", updatedAt: Date.now() },
    "inv_2_3": { id: "inv_2_3", gameId: game2Id, phone: "9930055443", rsvp: "maybe", updatedAt: Date.now() }
  };

  const buyins: Record<string, Buyin> = {
    "buy_1_1": { id: "buy_1_1", gameId: game1Id, phone: "9876543210", amount: 100, status: "approved", createdAt: Date.now() },
    "buy_1_2": { id: "buy_1_2", gameId: game1Id, phone: "9820011223", amount: 100, status: "approved", createdAt: Date.now() },
    "buy_1_3": { id: "buy_1_3", gameId: game1Id, phone: "9930055443", amount: 100, status: "approved", createdAt: Date.now() },
    "buy_1_4": { id: "buy_1_4", gameId: game1Id, phone: "9819922110", amount: 100, status: "approved", createdAt: Date.now() },

    "buy_2_1": { id: "buy_2_1", gameId: game2Id, phone: "9876543210", amount: 100, status: "approved", createdAt: Date.now() },
    "buy_2_2": { id: "buy_2_2", gameId: game2Id, phone: "9820011223", amount: 100, status: "approved", createdAt: Date.now() }
  };

  return { users, games, invites, buyins };
}

interface AppNotification {
  id: string;
  message: string;
  type: "invite" | "buyin_approved" | "buyin_rejected" | "game_closed";
  timestamp: number;
}

function getNewNotifications(prev: AppState, next: AppState, userPhone: string): AppNotification[] {
  const list: AppNotification[] = [];

  // 1. Check for newly approved or rejected buy-ins
  if (prev.buyins && next.buyins) {
    Object.values(next.buyins).forEach((nextBuyin) => {
      if (nextBuyin.phone !== userPhone) return;
      const prevBuyin = prev.buyins[nextBuyin.id];
      if (!prevBuyin) {
        if (nextBuyin.status === "approved") {
          const game = next.games[nextBuyin.gameId];
          list.push({
            id: `buyin_${nextBuyin.id}_approved`,
            message: `Your buy-in of ${nextBuyin.amount} Banks for "${game?.title || "Game"}" has been approved!`,
            type: "buyin_approved",
            timestamp: Date.now()
          });
        }
      } else if (prevBuyin.status === "pending" && nextBuyin.status !== "pending") {
        const game = next.games[nextBuyin.gameId];
        if (nextBuyin.status === "approved") {
          list.push({
            id: `buyin_${nextBuyin.id}_approved`,
            message: `🎉 Your buy-in of ${nextBuyin.amount} Banks for "${game?.title || "Game"}" has been APPROVED!`,
            type: "buyin_approved",
            timestamp: Date.now()
          });
        } else if (nextBuyin.status === "rejected") {
          list.push({
            id: `buyin_${nextBuyin.id}_rejected`,
            message: `⚠️ Your buy-in of ${nextBuyin.amount} Banks for "${game?.title || "Game"}" was rejected.`,
            type: "buyin_rejected",
            timestamp: Date.now()
          });
        }
      }
    });
  }

  // 2. Check for new invites
  if (prev.invites && next.invites) {
    Object.values(next.invites).forEach((nextInvite) => {
      if (nextInvite.phone !== userPhone) return;
      const prevInvite = prev.invites[nextInvite.id];
      if (!prevInvite && nextInvite.rsvp === "pending") {
        const game = next.games[nextInvite.gameId];
        if (game && game.status !== "closed") {
          list.push({
            id: `invite_${nextInvite.id}`,
            message: `🃏 You're invited to play in "${game.title}" by ${game.hostName}!`,
            type: "invite",
            timestamp: Date.now()
          });
        }
      }
    });
  }

  // 3. Check for recently settled games
  if (prev.games && next.games) {
    Object.values(next.games).forEach((nextGame) => {
      const prevGame = prev.games[nextGame.id];
      if (prevGame && prevGame.status === "active" && nextGame.status === "closed") {
        const userInvite = Object.values(next.invites).find(
          (i) => i.gameId === nextGame.id && i.phone === userPhone
        );
        if (userInvite?.rsvp === "yes" || nextGame.hostPhone === userPhone) {
          list.push({
            id: `settle_${nextGame.id}`,
            message: `🏆 "${nextGame.title}" has been settled! Check your final score on the ledger.`,
            type: "game_closed",
            timestamp: Date.now()
          });
        }
      }
    });
  }

  return list;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({ users: {}, games: {}, invites: {}, buyins: {} });
  const [session, setSession] = useState<Session | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingJoinGameId, setPendingJoinGameId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Read URL query parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get("joinGame");
    if (joinId) {
      setPendingJoinGameId(joinId);
    }
  }, []);

  // Redirect to join game if user is logged in
  useEffect(() => {
    const currentUser = session ? appState.users[session.phone] : null;
    if (currentUser && pendingJoinGameId && appState.games[pendingJoinGameId]) {
      const gameToJoin = appState.games[pendingJoinGameId];
      const existingInvite = (Object.values(appState.invites) as Invite[]).find(
        (i) => i.gameId === pendingJoinGameId && i.phone === currentUser.phone
      );
      if (!existingInvite) {
        // Auto RSVP going to make it frictionless
        const inviteId = "inv_" + Date.now();
        const nextInvites = {
          ...appState.invites,
          [inviteId]: {
            id: inviteId,
            gameId: pendingJoinGameId,
            phone: currentUser.phone,
            rsvp: "yes",
            updatedAt: Date.now()
          }
        };
        handleUpdateAppState({ ...appState, invites: nextInvites });
      }
      setSelectedGame(gameToJoin);
      setPendingJoinGameId(null);

      // Clean up search query param cleanly
      const url = new URL(window.location.href);
      url.searchParams.delete("joinGame");
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, [session, pendingJoinGameId, appState.games]);

  // Initialize and load persistent data
  useEffect(() => {
    async function init() {
      try {
        const loadedState = await loadAppState();
        const loadedSess = await loadSession();
        setAppState(loadedState);
        setSession(loadedSess);
      } catch (e) {
        console.error("Storage load failed", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Welcome pending invite notifications on login
  useEffect(() => {
    if (loading || !session) return;
    const currentUser = appState.users[session.phone];
    if (!currentUser) return;

    const pendingInvites = (Object.values(appState.invites) as Invite[]).filter(
      (i) => i.phone === currentUser.phone && i.rsvp === "pending"
    );

    if (pendingInvites.length > 0) {
      const welcomeNotifs = pendingInvites.map((i) => {
        const game = appState.games[i.gameId];
        return {
          id: `welcome_invite_${i.id}`,
          message: `🃏 You have a pending invite to "${game?.title || "a poker game"}" by ${game?.hostName || "the host"}.`,
          type: "invite" as const,
          timestamp: Date.now()
        };
      });

      setNotifications((current) => {
        const prevIds = new Set(current.map((c) => c.id));
        const filtered = welcomeNotifs.filter((n) => !prevIds.has(n.id));
        return [...current, ...filtered];
      });
    }
  }, [session, loading]);

  // Intelligent Polling Sync for Multi-Device and Smart Player Searching
  useEffect(() => {
    if (loading) return;
    
    let active = true;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const nextState = await loadAppState();
        if (active) {
          setAppState((prev) => {
            // Compare stringified JSON to check if changes occurred on other devices
            if (JSON.stringify(prev) !== JSON.stringify(nextState)) {
              if (session) {
                const newNotifs = getNewNotifications(prev, nextState, session.phone);
                if (newNotifs.length > 0) {
                  setNotifications((current) => {
                    const prevIds = new Set(current.map((c) => c.id));
                    const filtered = newNotifs.filter((n) => !prevIds.has(n.id));
                    return [...current, ...filtered];
                  });
                }
              }
              // If selectedGame is currently active, sync its values
              if (selectedGame) {
                const refreshedGame = nextState.games[selectedGame.id];
                if (refreshedGame) {
                  setSelectedGame(refreshedGame);
                }
              }
              return nextState;
            }
            return prev;
          });
        }
      } catch (e) {
        console.warn("Sync polling failed", e);
      }
    };

    // Run poll every 3 seconds to keep other devices/logins perfectly in sync
    const timer = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [loading, selectedGame, session]);

  // Update State Trigger and Synchronize selected game if visible
  const handleUpdateAppState = async (nextState: AppState) => {
    setAppState(nextState);
    await saveAppState(nextState);

    // Keep active selected game details in sync
    if (selectedGame) {
      const refreshedGame = nextState.games[selectedGame.id];
      if (refreshedGame) {
        setSelectedGame(refreshedGame);
      }
    }
  };

  const handleAuthSuccess = (nextState: AppState, nextSession: Session) => {
    setAppState(nextState);
    setSession(nextSession);
  };

  const handleLogout = async () => {
    await clearSessionStorage();
    setSession(null);
    setSelectedGame(null);
    setIsCreatingGame(false);
  };

  const handleResetData = async () => {
    if (window.confirm("Are you sure you want to completely wipe all ledger records, games, players, and log out? This action is permanent.")) {
      localStorage.setItem("pndata_cleared", "true");
      const emptyState = { users: {}, games: {}, invites: {}, buyins: {} };
      await saveAppState(emptyState);
      setAppState(emptyState);
      await clearSessionStorage();
      setSession(null);
      setSelectedGame(null);
      setIsCreatingGame(false);
    }
  };

  const handleSaveNewGame = async (newGame: Game) => {
    const nextGames = { ...appState.games, [newGame.id]: newGame };
    const nextState = { ...appState, games: nextGames };
    await handleUpdateAppState(nextState);
    setIsCreatingGame(false);
    setSelectedGame(newGame); // Immediately redirect to newly launched game room
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          height: "100vh", backgroundColor: "var(--ink)", color: "var(--cream)"
        }}
      >
        <div style={{ fontSize: 18, fontFamily: "Fraunces, serif", color: "var(--gold)" }}>Loading Kotta Table...</div>
      </div>
    );
  }

  // Determine active user profile
  const currentUser = session ? appState.users[session.phone] : null;

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {!currentUser ? (
        <AuthScreen onAuth={handleAuthSuccess} />
      ) : (
        <div className="min-h-screen w-full bg-[#06080B] flex justify-center items-stretch">
          <div className="w-full max-w-[480px] h-screen flex flex-col bg-[var(--ink)] text-[var(--cream)] overflow-hidden relative">
            
            {/* Sliding In-App Notifications Container */}
            {notifications.length > 0 && (
              <div 
                style={{
                  position: "absolute",
                  top: 24,
                  left: 16,
                  right: 16,
                  zIndex: 9999,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  pointerEvents: "none"
                }}
              >
                {notifications.slice(-3).map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      background: "rgba(20, 26, 36, 0.98)",
                      border: "1px solid var(--gold)",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
                      backdropFilter: "blur(12px)",
                      padding: "12px 14px",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                      pointerEvents: "auto",
                      animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ marginTop: 2, color: "var(--gold)" }}>
                        {notif.type === "invite" && <Users size={16} />}
                        {notif.type === "buyin_approved" && <CheckCircle size={16} style={{ color: "var(--success)" }} />}
                        {notif.type === "buyin_rejected" && <AlertTriangle size={16} style={{ color: "var(--danger)" }} />}
                        {notif.type === "game_closed" && <Sparkles size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--cream)", lineHeight: 1.4 }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, display: "block" }}>
                          Just now
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications((prev) => prev.filter((p) => p.id !== notif.id))}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                        padding: 2,
                        marginTop: -2
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              {selectedGame ? (
                <GameDetails
                  game={selectedGame}
                  currentUser={currentUser}
                  appState={appState}
                  onBack={() => setSelectedGame(null)}
                  onUpdateState={handleUpdateAppState}
                />
              ) : isCreatingGame ? (
                <CreateGame
                  hostPhone={currentUser.phone}
                  hostName={currentUser.name}
                  onClose={() => setIsCreatingGame(false)}
                  onSave={handleSaveNewGame}
                />
              ) : (
                <Dashboard
                  currentUser={currentUser}
                  appState={appState}
                  onLogout={handleLogout}
                  onSelectGame={setSelectedGame}
                  onOpenCreateGame={() => setIsCreatingGame(true)}
                  onResetData={handleResetData}
                />
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
