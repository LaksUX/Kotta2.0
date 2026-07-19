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
import { Plus } from "lucide-react";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import GameDetails from "./components/GameDetails";
import CreateGame from "./components/CreateGame";

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
    max-width: 460px;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
  }

  @media (min-width: 1024px) {
    .pn-root {
      max-width: 100% !important;
      min-height: 100% !important;
      height: 100% !important;
      box-shadow: none !important;
    }
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

export default function App() {
  const [appState, setAppState] = useState<AppState>({ users: {}, games: {}, invites: {}, buyins: {} });
  const [session, setSession] = useState<Session | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize and load persistent data
  useEffect(() => {
    async function init() {
      try {
        const loadedState = await loadAppState();
        const loadedSess = await loadSession();

        const isFreshRun = Object.keys(loadedState.users).length === 0;
        const wasCleared = localStorage.getItem("pndata_cleared") === "true";

        if (isFreshRun && !wasCleared) {
          const seeded = getSeedState();
          await saveAppState(seeded);
          setAppState(seeded);

          const defaultSess = { phone: "9876543210" }; // Pre-login as host Rohan Mehta
          await saveSession(defaultSess);
          setSession(defaultSess);
        } else {
          setAppState(loadedState);
          setSession(loadedSess);
        }
      } catch (e) {
        console.error("Storage load failed", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

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
        <div className="lg:flex lg:flex-row lg:bg-[var(--ink)] lg:min-h-screen lg:justify-center lg:items-center lg:p-6">
          <div className="w-full max-w-[460px] lg:max-w-[1024px] lg:h-[768px] lg:min-h-[768px] flex flex-col lg:flex-row bg-[var(--ink)] text-[var(--cream)] overflow-hidden rounded-none lg:rounded-3xl border lg:border-white/10 shadow-2xl relative">
            
            {/* Left Navigation Rail - Desktop only */}
            <nav className="hidden lg:flex w-20 border-r border-white/10 flex-col items-center py-8 gap-8 bg-[var(--ink)] shrink-0">
              {/* Premium Logo / Crown Shield Emblem */}
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer relative group transition-transform duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-soft) 100%)",
                  boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)"
                }}
                onClick={() => { setSelectedGame(null); setIsCreatingGame(false); }}
                title="Kotta Felt Board"
              >
                {/* SVG Crown Shield Inside */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 5V11C4 16.55 7.42 21.74 12 23C16.58 21.74 20 16.55 20 11V5L12 2Z" fill="var(--ink)" />
                  <path d="M8 9L10 11L12 7L14 11L16 9" stroke="var(--gold-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="14" r="2" fill="var(--gold-soft)" />
                </svg>
              </div>
              
              <div className="flex flex-col gap-6">
                {/* Home */}
                <button 
                  className={`p-3 rounded-xl transition-colors ${(!selectedGame && !isCreatingGame) ? "bg-white/10 text-[var(--gold)]" : "text-white/40 hover:bg-white/5"}`}
                  onClick={() => { setSelectedGame(null); setIsCreatingGame(false); }}
                  title="Home Board"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </button>
                {/* Create Game */}
                <button 
                  className={`p-3 rounded-xl transition-colors ${isCreatingGame ? "bg-white/10 text-[var(--gold)]" : "text-white/40 hover:bg-white/5"}`}
                  onClick={() => { setIsCreatingGame(true); setSelectedGame(null); }}
                  title="Host Game"
                >
                  <Plus size={24} />
                </button>
              </div>

              <div className="mt-auto flex flex-col gap-6 pb-4">
                <button 
                  className="p-3 rounded-xl text-white/20 hover:text-white/60 transition-colors" 
                  onClick={handleLogout} 
                  title="Sign Out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </button>
              </div>
            </nav>

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
