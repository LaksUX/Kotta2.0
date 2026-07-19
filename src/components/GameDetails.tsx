/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  ChevronLeft, Calendar, MapPin, Users, Coins, Check, X,
  Plus, AlertTriangle, Play, Save, RefreshCw, Sparkles, TrendingUp
} from "lucide-react";
import { AppState, Game, Invite, Buyin, User } from "../types";
import {
  fmtDateTime, getConfirmedPlayers, computeGameFinancials,
  genId, round2
} from "../lib/storage";

interface GameDetailsProps {
  game: Game;
  currentUser: User;
  appState: AppState;
  onBack: () => void;
  onUpdateState: (nextState: AppState) => void;
}

export default function GameDetails({ game, currentUser, appState, onBack, onUpdateState }: GameDetailsProps) {
  const isHost = game.hostPhone === currentUser.phone;
  const players = getConfirmedPlayers(appState, game);

  // Custom and manual buyin states
  const [customBuyinAmount, setCustomBuyinAmount] = useState<number>(game.initialBuyin);
  const [manualBuyinAmount, setManualBuyinAmount] = useState<number>(game.initialBuyin);

  // RSVPs for this game
  const myInvite = Object.values(appState.invites).find(
    (i) => i.gameId === game.id && i.phone === currentUser.phone
  );
  const myRsvp = myInvite ? myInvite.rsvp : (isHost ? "yes" : "pending");

  // Group all players by RSVP status
  const goingInvites = Object.values(appState.invites).filter((i) => i.gameId === game.id && i.rsvp === "yes");
  const maybeInvites = Object.values(appState.invites).filter((i) => i.gameId === game.id && i.rsvp === "maybe");
  const noInvites = Object.values(appState.invites).filter((i) => i.gameId === game.id && i.rsvp === "no");

  // Buyins for this game
  const gameBuyins = Object.values(appState.buyins).filter((b) => b.gameId === game.id);
  const myApprovedBuyins = gameBuyins.filter((b) => b.phone === currentUser.phone && b.status === "approved");
  const myPendingBuyins = gameBuyins.filter((b) => b.phone === currentUser.phone && b.status === "pending");

  const totalMyApprovedBuyin = myApprovedBuyins.reduce((s, b) => s + b.amount, 0);

  // Direct buyin action (host only, approved automatically)
  function handleDirectBuyin(phone: string, amount: number) {
    if (amount < 1) return;
    const buyinId = genId("buyin");
    const nextBuyins = { ...appState.buyins };
    nextBuyins[buyinId] = {
      id: buyinId,
      gameId: game.id,
      phone,
      amount,
      status: "approved",
      createdAt: Date.now()
    };

    // Make sure player is added to RSVPs (Going)
    const nextInvites = { ...appState.invites };
    const existingInvite = Object.values(nextInvites).find(
      (i) => i.gameId === game.id && i.phone === phone
    );
    if (!existingInvite || existingInvite.rsvp !== "yes") {
      const inviteId = existingInvite ? existingInvite.id : genId("invite");
      nextInvites[inviteId] = {
        id: inviteId,
        gameId: game.id,
        phone,
        rsvp: "yes",
        updatedAt: Date.now()
      };
    }

    onUpdateState({ ...appState, buyins: nextBuyins, invites: nextInvites });
  }

  // Close Game / Cash Out Flow state
  const [isClosing, setIsClosing] = useState(false);
  const [gameTab, setGameTab] = useState<"setup" | "live">("setup");
  const [cashoutMap, setCashoutMap] = useState<Record<string, number>>({});

  // Reactive Sync of cashoutMap with game.liveCashouts & player buyins
  useEffect(() => {
    const updated = { ...cashoutMap };
    let changed = false;
    players.forEach((p) => {
      const playerBuyins = gameBuyins.filter((b) => b.phone === p.phone && b.status === "approved");
      const totalBuy = playerBuyins.reduce((s, b) => s + b.amount, 0);
      
      const liveVal = game.liveCashouts?.[p.phone];
      const currentVal = updated[p.phone];
      
      if (liveVal !== undefined) {
        if (currentVal !== liveVal) {
          updated[p.phone] = liveVal;
          changed = true;
        }
      } else if (currentVal === undefined) {
        updated[p.phone] = totalBuy;
        changed = true;
      }
    });
    if (changed) {
      setCashoutMap(updated);
    }
  }, [game.liveCashouts, players, gameBuyins]);

  // Helper selector to list users who have ever played in any Kotta game (excluding current players)
  const getPreviouslyPlayedUsers = () => {
    const playedPhones = new Set<string>();
    Object.values(appState.games).forEach((g) => {
      Object.values(appState.buyins).forEach((b) => {
        if (b.gameId === g.id && b.status === "approved") {
          playedPhones.add(b.phone);
        }
      });
      Object.values(appState.invites).forEach((i) => {
        if (i.gameId === g.id && i.rsvp === "yes") {
          playedPhones.add(i.phone);
        }
      });
    });
    
    // exclude host and already added players in current game
    playedPhones.delete(game.hostPhone);
    players.forEach((p) => playedPhones.delete(p.phone));

    return Array.from(playedPhones)
      .map((phone) => appState.users[phone])
      .filter(Boolean);
  };

  // RSVP actions
  function handleRsvp(status: "yes" | "no" | "maybe") {
    const nextInvites = { ...appState.invites };
    const inviteId = myInvite ? myInvite.id : genId("invite");
    nextInvites[inviteId] = {
      id: inviteId,
      gameId: game.id,
      phone: currentUser.phone,
      rsvp: status,
      updatedAt: Date.now()
    };
    onUpdateState({ ...appState, invites: nextInvites });
  }

  // Request buy-in
  function handleRequestBuyin(amount: number) {
    const buyinId = genId("buyin");
    const nextBuyins = { ...appState.buyins };
    nextBuyins[buyinId] = {
      id: buyinId,
      gameId: game.id,
      phone: currentUser.phone,
      amount,
      status: isHost ? "approved" : "pending", // Host buy-ins are auto-approved
      createdAt: Date.now()
    };

    // If host is buying in, also ensure host is in the invite list as RSVP "yes"
    const nextInvites = { ...appState.invites };
    if (isHost) {
      const existingInvite = Object.values(nextInvites).find(
        (i) => i.gameId === game.id && i.phone === currentUser.phone
      );
      if (!existingInvite) {
        const inviteId = genId("invite");
        nextInvites[inviteId] = {
          id: inviteId,
          gameId: game.id,
          phone: currentUser.phone,
          rsvp: "yes",
          updatedAt: Date.now()
        };
      }
    }

    onUpdateState({ ...appState, buyins: nextBuyins, invites: nextInvites });
  }

  // Host Actions: Approve/Reject Buyins
  function handleBuyinAction(buyinId: string, action: "approved" | "rejected") {
    const nextBuyins = { ...appState.buyins };
    if (nextBuyins[buyinId]) {
      nextBuyins[buyinId] = {
        ...nextBuyins[buyinId],
        status: action
      };
      onUpdateState({ ...appState, buyins: nextBuyins });
    }
  }

  // Host Actions: Add another player directly to the game (physical manual add & search)
  const [searchPhone, setSearchPhone] = useState("");
  const [manualAddError, setManualAddError] = useState("");

  // New States for smart search by name & phone, and guest profile creation
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPhone, setNewPlayerPhone] = useState("");

  // Filter existing registered users by name or phone query
  const matchingUsers = Object.values(appState.users).filter((user) => {
    if (user.phone === game.hostPhone) return false;
    
    // Skip users already listed as active players in this game
    const isAlreadyPlaying = players.some((p) => p.phone === user.phone);
    if (isAlreadyPlaying) return false;
    
    if (!searchQuery.trim()) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.phone.includes(query)
    );
  }).slice(0, 5);

  function handleAddExistingPlayer(phone: string, name: string) {
    setManualAddError("");
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) return;

    // Add invite
    const nextInvites = { ...appState.invites };
    const existingInvite = Object.values(nextInvites).find(
      (i) => i.gameId === game.id && i.phone === cleanPhone
    );

    if (!existingInvite || existingInvite.rsvp !== "yes") {
      const inviteId = existingInvite ? existingInvite.id : genId("invite");
      nextInvites[inviteId] = {
        id: inviteId,
        gameId: game.id,
        phone: cleanPhone,
        rsvp: "yes",
        updatedAt: Date.now()
      };
    }

    // Also request/approve initial buy-in for this player
    const buyinId = genId("buyin");
    const nextBuyins = { ...appState.buyins };
    nextBuyins[buyinId] = {
      id: buyinId,
      gameId: game.id,
      phone: cleanPhone,
      amount: manualBuyinAmount,
      status: "approved",
      createdAt: Date.now()
    };

    onUpdateState({ ...appState, invites: nextInvites, buyins: nextBuyins });
    setSearchQuery("");
    setManualBuyinAmount(game.initialBuyin);
  }

  function handleCreateAndAddGuest() {
    setManualAddError("");
    const name = newPlayerName.trim();
    const phone = newPlayerPhone.replace(/\D/g, "");

    if (!name) {
      setManualAddError("Please provide a name for the guest player.");
      return;
    }
    if (phone.length < 6) {
      setManualAddError("Please enter a valid phone number (at least 6 digits) for the guest.");
      return;
    }

    if (appState.users[phone]) {
      // User already exists, so just add them!
      handleAddExistingPlayer(phone, appState.users[phone].name);
      setShowNewPlayerForm(false);
      setNewPlayerName("");
      setNewPlayerPhone("");
      return;
    }

    // Register guest player profile in global appState
    const nextUsers = { ...appState.users };
    nextUsers[phone] = {
      phone,
      name,
      pinHash: "" // No PIN, indicates a host-registered guest profile
    };

    // Add invite
    const nextInvites = { ...appState.invites };
    const inviteId = genId("invite");
    nextInvites[inviteId] = {
      id: inviteId,
      gameId: game.id,
      phone,
      rsvp: "yes",
      updatedAt: Date.now()
    };

    // Add initial buyin
    const buyinId = genId("buyin");
    const nextBuyins = { ...appState.buyins };
    nextBuyins[buyinId] = {
      id: buyinId,
      gameId: game.id,
      phone,
      amount: manualBuyinAmount,
      status: "approved",
      createdAt: Date.now()
    };

    onUpdateState({
      ...appState,
      users: nextUsers,
      invites: nextInvites,
      buyins: nextBuyins
    });

    setSearchQuery("");
    setManualBuyinAmount(game.initialBuyin);
    setNewPlayerName("");
    setNewPlayerPhone("");
    setShowNewPlayerForm(false);
  }

  function handleManualAdd() {
    setManualAddError("");
    const cleanPhone = searchPhone.replace(/\D/g, "");
    if (!cleanPhone) return;

    const matchedUser = appState.users[cleanPhone];
    if (!matchedUser) {
      setManualAddError("No registered user found with this phone number.");
      return;
    }

    handleAddExistingPlayer(cleanPhone, matchedUser.name);
    setSearchPhone("");
  }

  // Live Settle-up Financials
  const financials = computeGameFinancials(appState, game, cashoutMap);

  function handleConfirmCloseGame() {
    // Save results
    const nextGames = { ...appState.games };
    const results: Record<string, { cashout: number; buyin: number; net: number; totalBuyins: number }> = {};

    financials.nets.forEach((item) => {
      results[item.phone] = {
        cashout: Number(cashoutMap[item.phone]) || 0,
        buyin: item.buy,
        net: item.net,
        totalBuyins: item.buy
      };
    });

    nextGames[game.id] = {
      ...game,
      status: "closed",
      closedAt: Date.now(),
      results,
      rakeInfo: {
        totalBuyins: financials.totalBuyins,
        actualCashoutSum: financials.actualCashoutSum,
        expectedPool: financials.expectedPool,
        variance: financials.variance,
        effectiveRake: financials.effectiveRake
      }
    };

    onUpdateState({ ...appState, games: nextGames });
    setIsClosing(false);
  }

  return (
    <div className="flex flex-col h-full w-full bg-[var(--ink)] text-[var(--cream)] relative overflow-hidden">
      <div className="pn-header">
        <button className="pn-icon-btn" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <div className="pn-header-title">{game.title}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {game.status === "active" && (
            <span className="pn-badge pn-badge-active">Live</span>
          )}
          {game.status === "closed" && (
            <span className="pn-badge pn-badge-closed">Closed</span>
          )}
        </div>
      </div>

      <div className="pn-body" style={{ overflowY: "auto" }}>
        {/* Tab Headers - Only for active games */}
        {game.status === "active" && (
          <div style={{ display: "flex", borderBottom: "1px solid var(--hairline)", background: "var(--surface)", marginBottom: 16, borderRadius: 8, overflow: "hidden" }}>
            <button
              type="button"
              style={{
                flex: 1,
                borderRadius: 0,
                background: gameTab === "setup" ? "rgba(214, 175, 55, 0.08)" : "transparent",
                color: gameTab === "setup" ? "var(--gold)" : "var(--muted)",
                borderBottom: gameTab === "setup" ? "2px solid var(--gold)" : "none",
                fontSize: 13,
                padding: "12px 8px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                border: "none",
                cursor: "pointer"
              }}
              onClick={() => { setGameTab("setup"); setIsClosing(false); }}
            >
              <Users size={15} /> Setup &amp; Players
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                borderRadius: 0,
                background: gameTab === "live" ? "rgba(214, 175, 55, 0.08)" : "transparent",
                color: gameTab === "live" ? "var(--gold)" : "var(--muted)",
                borderBottom: gameTab === "live" ? "2px solid var(--gold)" : "none",
                fontSize: 13,
                padding: "12px 8px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                border: "none",
                cursor: "pointer"
              }}
              onClick={() => setGameTab("live")}
            >
              <Coins size={15} /> Live
            </button>
          </div>
        )}

        {/* --- TAB 1: SETUP & PLAYERS (Only when game is active & Setup tab is selected) --- */}
        {game.status === "active" && gameTab === "setup" && (
          <>
            {/* Game Details Card */}
            <div className="pn-card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--gold)", fontWeight: 500 }}>Host: {game.hostName}</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <span className="pn-mono" style={{ fontSize: 13, color: "var(--cream)" }}>
                    Buy-in: {game.initialBuyin} Banks
                  </span>
                  {game.ratio && (
                    <span className="pn-mono" style={{ fontSize: 11, color: "var(--gold-soft)" }}>
                      Stakes: {game.ratio} Blinds
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <Calendar size={15} className="text-muted" style={{ color: "var(--gold-soft)" }} />
                  <span>{fmtDateTime(game.date, game.time)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <MapPin size={15} style={{ color: "var(--gold-soft)" }} />
                  <span>{game.venue}</span>
                </div>
              </div>
            </div>

            {/* Invite & Share Link Area */}
            <div className="pn-card" style={{ marginBottom: 16, background: "rgba(214, 175, 55, 0.03)", border: "1px dashed rgba(212, 162, 76, 0.2)" }}>
              <span className="pn-label" style={{ color: "var(--gold)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} /> Invite Players to Join
              </span>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                Share this invite link. When players click it, they can sign up, join, and RSVP directly!
              </p>
              
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="pn-input pn-mono"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}?joinGame=${game.id}`}
                  style={{ padding: "8px 10px", fontSize: 11, height: 36, flex: 1, background: "var(--surface-raised)", color: "var(--gold-soft)" }}
                />
                <button
                  type="button"
                  className="pn-btn pn-btn-primary pn-btn-sm"
                  style={{ height: 36, whiteSpace: "nowrap", padding: "0 12px" }}
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}?joinGame=${game.id}`;
                    navigator.clipboard.writeText(url);
                    alert("📋 Invite link copied to clipboard!");
                  }}
                >
                  Copy Link
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="pn-btn pn-btn-ghost pn-btn-sm"
                    style={{ flex: 1, fontSize: 11, padding: "6px 8px", background: "rgba(255, 255, 255, 0.02)" }}
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?joinGame=${game.id}`;
                      const text = `♠️ Join my poker game on Kotta!\n\n🏆 Game: ${game.title}\n📅 Date: ${fmtDateTime(game.date, game.time)}\n📍 Venue: ${game.venue}\n🪙 Buy-in: ${game.initialBuyin} Banks\n\n👉 Join & RSVP here: ${url}`;
                      navigator.clipboard.writeText(text);
                      alert("📋 Custom invitation message copied to clipboard! Share it in your WhatsApp group.");
                    }}
                  >
                    Copy Full Invite Text
                  </button>
                  
                  <button
                    type="button"
                    className="pn-btn pn-btn-felt pn-btn-sm"
                    style={{ flex: 1, fontSize: 11, padding: "6px 8px" }}
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?joinGame=${game.id}`;
                      const text = encodeURIComponent(`♠️ Join my poker game on Kotta!\n\n🏆 Game: ${game.title}\n📅 Date: ${fmtDateTime(game.date, game.time)}\n📍 Venue: ${game.venue}\n🪙 Buy-in: ${game.initialBuyin} Banks\n\n👉 Join & RSVP here: ${url}`);
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                    }}
                  >
                    WhatsApp Share
                  </button>
                </div>

                {isHost && (
                  <button
                    type="button"
                    className="pn-btn pn-btn-primary pn-btn-sm"
                    style={{ fontSize: 11, padding: "8px 12px", width: "100%", gap: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?joinGame=${game.id}`;
                      
                      const goingNames: string[] = ["👑 " + game.hostName + " (Host)"];
                      goingInvites.forEach((i) => {
                        const u = appState.users[i.phone];
                        if (u && u.phone !== game.hostPhone) {
                          goingNames.push(u.name);
                        }
                      });

                      const maybeNames: string[] = [];
                      maybeInvites.forEach((i) => {
                        const u = appState.users[i.phone];
                        if (u) {
                          maybeNames.push(u.name);
                        }
                      });

                      const noNames: string[] = [];
                      noInvites.forEach((i) => {
                        const u = appState.users[i.phone];
                        if (u) {
                          noNames.push(u.name);
                        }
                      });

                      let msg = `♠️ *RSVP LIST: ${game.title.toUpperCase()}*\n`;
                      msg += `📅 *Date:* ${fmtDateTime(game.date, game.time)}\n`;
                      msg += `📍 *Venue:* ${game.venue}\n`;
                      msg += `🪙 *Initial Buy-in:* ${game.initialBuyin} Banks\n\n`;

                      msg += `✅ *GOING (${goingNames.length}):*\n`;
                      goingNames.forEach((n, idx) => {
                        msg += `${idx + 1}. ${n}\n`;
                      });

                      if (maybeNames.length > 0) {
                        msg += `\n❓ *MAYBE (${maybeNames.length}):*\n`;
                        maybeNames.forEach((n) => {
                          msg += `- ${n}\n`;
                        });
                      }

                      if (noNames.length > 0) {
                        msg += `\n❌ *NOT GOING (${noNames.length}):*\n`;
                        noNames.forEach((n) => {
                          msg += `- ${n}\n`;
                        });
                      }

                      msg += `\n👉 *Join & RSVP here:* ${url}`;

                      const text = encodeURIComponent(msg);
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                    }}
                  >
                    💬 Share RSVP List to WhatsApp
                  </button>
                )}
              </div>
            </div>

            {/* Player RSVP Controls */}
            {!isHost && (
              <div className="pn-card" style={{ marginBottom: 16 }}>
                <span className="pn-label">Are you playing?</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className={`pn-btn pn-btn-sm ${myRsvp === "yes" ? "pn-btn-primary" : "pn-btn-ghost"}`}
                    onClick={() => handleRsvp("yes")}
                    style={{ flex: 1 }}
                  >
                    Going
                  </button>
                  <button
                    className={`pn-btn pn-btn-sm ${myRsvp === "maybe" ? "pn-btn-primary" : "pn-btn-ghost"}`}
                    onClick={() => handleRsvp("maybe")}
                    style={{ flex: 1 }}
                  >
                    Maybe
                  </button>
                  <button
                    className={`pn-btn pn-btn-sm ${myRsvp === "no" ? "pn-btn-danger" : "pn-btn-ghost"}`}
                    onClick={() => handleRsvp("no")}
                    style={{ flex: 1 }}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Host Player Add/Setup Panel */}
            {isHost && (
              <div className="pn-card" style={{ marginBottom: 16, border: "1px solid rgba(212,162,76,0.3)" }}>
                <span className="pn-label" style={{ color: "var(--gold)", fontWeight: 600 }}>Host: Add &amp; Manage Players</span>

                {/* Smart Find / Add Player */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      Find or Add sitting player directly
                    </span>
                    <button
                      type="button"
                      className="text-xs text-[var(--gold)] hover:underline bg-transparent border-none cursor-pointer"
                      onClick={() => {
                        setShowNewPlayerForm(!showNewPlayerForm);
                        setManualAddError("");
                      }}
                    >
                      {showNewPlayerForm ? "← Back to Search" : "🆕 Register Guest Player"}
                    </button>
                  </div>

                  {!showNewPlayerForm ? (
                    <>
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{ flex: 1.5, minWidth: 120 }}>
                          <input
                            className="pn-input pn-mono"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type player name or phone..."
                            style={{ padding: "8px 12px", fontSize: 13, width: "100%" }}
                          />
                        </div>
                        <div style={{ flex: 1, maxW: 100, minWidth: 80 }}>
                          <input
                            className="pn-input pn-mono"
                            type="number"
                            min={1}
                            value={manualBuyinAmount}
                            onChange={(e) => setManualBuyinAmount(Math.max(1, Number(e.target.value)))}
                            placeholder="Amt"
                            style={{ padding: "8px 12px", fontSize: 13, width: "100%" }}
                          />
                        </div>
                      </div>

                      {/* Search Matches List */}
                      {matchingUsers.length > 0 && (
                        <div style={{
                          marginTop: 8, background: "rgba(0,0,0,0.3)", border: "1px solid var(--hairline)",
                          borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column"
                        }}>
                          {matchingUsers.map((u) => (
                            <div
                              key={u.phone}
                              style={{
                                display: "flex", alignItems: "center", justify: "space-between",
                                padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600, color: "var(--cream)" }}>{u.name}</span>
                                <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 6 }}>({u.phone})</span>
                              </div>
                              <button
                                type="button"
                                className="pn-btn pn-btn-primary pn-btn-sm"
                                style={{ padding: "2px 8px", fontSize: 10, height: 22, width: "auto" }}
                                onClick={() => handleAddExistingPlayer(u.phone, u.name)}
                              >
                                + Add &amp; Buy-in
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Previously Played Quick Add */}
                      {searchQuery.trim() === "" && (
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: 11, color: "var(--gold-soft)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                            ⏱️ Quick Add Previous Players:
                          </span>
                          {getPreviouslyPlayedUsers().length === 0 ? (
                            <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
                              No other previous players remembered yet.
                            </span>
                          ) : (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 90, overflowY: "auto", padding: "2px" }}>
                              {getPreviouslyPlayedUsers().map((u) => (
                                <button
                                  key={u.phone}
                                  type="button"
                                  className="pn-tag-pill"
                                  style={{ fontSize: 11, padding: "4px 8px", margin: 0, background: "rgba(255, 255, 255, 0.03)" }}
                                  onClick={() => handleAddExistingPlayer(u.phone, u.name)}
                                >
                                  👤 {u.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* If query has been typed but there are no matches, offer to register guest with that name */}
                      {searchQuery.trim() && matchingUsers.length === 0 && (
                        <div style={{ marginTop: 8, textAlign: "center", background: "rgba(255, 255, 255, 0.02)", padding: 10, borderRadius: 8, border: "1px dashed var(--hairline)" }}>
                          <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                            No existing player matches "{searchQuery}"
                          </span>
                          <button
                            type="button"
                            className="pn-btn pn-btn-felt pn-btn-sm"
                            style={{ margin: "0 auto", fontSize: 11, padding: "4px 10px" }}
                            onClick={() => {
                              setNewPlayerName(searchQuery);
                              setShowNewPlayerForm(true);
                            }}
                          >
                            🆕 Register guest: "{searchQuery}"
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ background: "rgba(0,0,0,0.15)", padding: 12, borderRadius: 10, border: "1px solid var(--hairline)", display: "flex", flexDirection: "column", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gold-soft)" }}>Register Guest Profile</span>
                      <div>
                        <label className="pn-label" style={{ marginBottom: 3 }}>Full Name</label>
                        <input
                          className="pn-input"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="e.g. Amit Sharma"
                          style={{ padding: "6px 10px", fontSize: 13 }}
                        />
                      </div>
                      <div>
                        <label className="pn-label" style={{ marginBottom: 3 }}>Phone Number</label>
                        <input
                          className="pn-input pn-mono"
                          value={newPlayerPhone}
                          onChange={(e) => setNewPlayerPhone(e.target.value)}
                          placeholder="e.g. 9819900000"
                          style={{ padding: "6px 10px", fontSize: 13 }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          className="pn-btn pn-btn-ghost pn-btn-sm"
                          style={{ flex: 1, fontSize: 11, padding: "6px" }}
                          onClick={() => {
                            setShowNewPlayerForm(false);
                            setManualAddError("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="pn-btn pn-btn-primary pn-btn-sm"
                          style={{ flex: 1, fontSize: 11, padding: "6px" }}
                          onClick={handleCreateAndAddGuest}
                        >
                          Save &amp; Buyin
                        </button>
                      </div>
                    </div>
                  )}

                  {manualAddError && (
                    <span style={{ fontSize: 11, color: "var(--danger)", marginTop: 4, display: "block" }}>
                      ⚠️ {manualAddError}
                    </span>
                  )}
                </div>

                {/* Manage Player RSVPs */}
                <div>
                  <span className="pn-label" style={{ marginBottom: 4, fontSize: 12, color: "var(--gold-soft)" }}>Manage Player RSVPs</span>
                  <span style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                    Adjust attendance of any registered player:
                  </span>
                  <div style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, background: "rgba(0,0,0,0.15)", padding: 6, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                    {Object.values(appState.users).map((user) => {
                      if (user.phone === game.hostPhone) return null; // skip host
                      const invite = Object.values(appState.invites).find(
                        (i) => i.gameId === game.id && i.phone === user.phone
                      );
                      const currentRsvp = invite ? invite.rsvp : "pending";

                      return (
                        <div key={user.phone} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: 4 }}>
                          <span style={{ fontWeight: 500, color: "var(--cream)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
                            {user.name}
                          </span>

                          <div style={{ display: "flex", gap: 3 }}>
                            <button
                              type="button"
                              className={`pn-tag-pill ${currentRsvp === "yes" ? "active" : ""}`}
                              style={{ fontSize: 9, padding: "1px 4px", margin: 0 }}
                              onClick={() => {
                                const nextInvites = { ...appState.invites };
                                const inviteId = invite ? invite.id : genId("invite");
                                nextInvites[inviteId] = {
                                  id: inviteId,
                                  gameId: game.id,
                                  phone: user.phone,
                                  rsvp: "yes",
                                  updatedAt: Date.now()
                                };
                                onUpdateState({ ...appState, invites: nextInvites });
                              }}
                            >
                              Go
                            </button>
                            <button
                              type="button"
                              className={`pn-tag-pill ${currentRsvp === "maybe" ? "active" : ""}`}
                              style={{ fontSize: 9, padding: "1px 4px", margin: 0 }}
                              onClick={() => {
                                const nextInvites = { ...appState.invites };
                                const inviteId = invite ? invite.id : genId("invite");
                                nextInvites[inviteId] = {
                                  id: inviteId,
                                  gameId: game.id,
                                  phone: user.phone,
                                  rsvp: "maybe",
                                  updatedAt: Date.now()
                                };
                                onUpdateState({ ...appState, invites: nextInvites });
                              }}
                            >
                              ?
                            </button>
                            <button
                              type="button"
                              className={`pn-tag-pill ${currentRsvp === "no" ? "active" : ""}`}
                              style={{ fontSize: 9, padding: "1px 4px", margin: 0 }}
                              onClick={() => {
                                const nextInvites = { ...appState.invites };
                                const inviteId = invite ? invite.id : genId("invite");
                                nextInvites[inviteId] = {
                                  id: inviteId,
                                  gameId: game.id,
                                  phone: user.phone,
                                  rsvp: "no",
                                  updatedAt: Date.now()
                                };
                                onUpdateState({ ...appState, invites: nextInvites });
                              }}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Players RSVPs Attendance Details */}
            <div className="pn-card" style={{ marginBottom: 16 }}>
              <span className="pn-label">RSVPs &amp; Attendance</span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Going */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--success)" }}>Going ({goingInvites.filter(i => i.phone !== game.hostPhone).length + 1})</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="pn-tag-pill active" style={{ fontSize: 11, padding: "4px 10px", pointerEvents: "none" }}>
                      👑 {game.hostName} (Host)
                    </span>
                    {goingInvites.map((i) => {
                      const user = appState.users[i.phone];
                      if (!user || user.phone === game.hostPhone) return null;
                      return (
                        <span key={i.phone} className="pn-tag-pill active" style={{ fontSize: 11, padding: "4px 10px", pointerEvents: "none" }}>
                          {user.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Maybe */}
                {maybeInvites.length > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold-soft)" }}>Maybe ({maybeInvites.length})</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {maybeInvites.map((i) => {
                        const user = appState.users[i.phone];
                        if (!user) return null;
                        return (
                          <span key={i.phone} className="pn-tag-pill" style={{ fontSize: 11, padding: "4px 10px", borderColor: "var(--gold-soft)", color: "var(--gold-soft)", pointerEvents: "none" }}>
                            {user.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No */}
                {noInvites.length > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)" }}>Not Going ({noInvites.length})</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {noInvites.map((i) => {
                        const user = appState.users[i.phone];
                        if (!user) return null;
                        return (
                          <span key={i.phone} className="pn-tag-pill" style={{ fontSize: 11, padding: "4px 10px", borderColor: "var(--danger)", color: "var(--danger)", pointerEvents: "none" }}>
                            {user.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* --- TAB 2: LIVE GAME & SETTLE (Only when game is active & Live tab is selected) --- */}
        {game.status === "active" && gameTab === "live" && !isClosing && (
          <>
            {/* Buy-in panel for the user */}
            {myRsvp === "yes" && (
              <div className="pn-card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="pn-label" style={{ margin: 0 }}>Your Chips</span>
                  <span className="pn-mono" style={{ fontSize: 14, fontWeight: 600, color: "var(--gold-soft)" }}>
                    {totalMyApprovedBuyin} Banks Approved
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <span className="text-[10px] text-[#9A93A6] uppercase tracking-wider block mb-1">Buy-in Amount</span>
                      <input
                        className="pn-input pn-mono"
                        type="number"
                        min={1}
                        value={customBuyinAmount}
                        onChange={(e) => setCustomBuyinAmount(Math.max(1, Number(e.target.value)))}
                        style={{ padding: "8px 12px", fontSize: 14 }}
                      />
                    </div>
                    <button
                      className="pn-btn pn-btn-felt"
                      onClick={() => handleRequestBuyin(customBuyinAmount)}
                      style={{ height: 38, marginTop: 17, flex: 1.2, gap: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Plus size={16} /> Buy-in {customBuyinAmount} Banks
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[1, 3, 5, 10].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="pn-tag-pill"
                        style={{ fontSize: 11, padding: "6px 14px", margin: 0, flex: 1, textAlign: "center", background: "rgba(255, 255, 255, 0.03)" }}
                        onClick={() => setCustomBuyinAmount(amt)}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {myPendingBuyins.length > 0 && (
                  <div style={{
                    marginTop: 10, fontSize: 12, color: "var(--gold-soft)",
                    background: "rgba(212,162,76,0.1)", padding: "6px 10px", borderRadius: 8,
                    display: "flex", alignItems: "center", gap: 6
                  }}>
                    <RefreshCw className="animate-spin" size={12} />
                    <span>
                      Waiting for host to approve re-buy of {myPendingBuyins.reduce((s, b) => s + b.amount, 0)} Banks...
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Players and Buyins List */}
            <div className="pn-card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="pn-label" style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Ledger ({players.length} players)</span>
              </div>

              {/* Overall Players Buying and Cashouts Summary */}
              {players.length > 0 && (
                <div style={{ marginBottom: 16, background: "rgba(255,255,255,0.02)", padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--muted)" }}>Overall Buy-ins:</span>
                    <span className="pn-mono font-semibold" style={{ color: "var(--gold-soft)" }}>{financials.totalBuyins} Banks</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: isHost ? 4 : 0 }}>
                    <span style={{ color: "var(--muted)" }}>Overall Cashouts:</span>
                    <span className="pn-mono font-semibold" style={{ color: "var(--cream)" }}>{financials.actualCashoutSum} Banks</span>
                  </div>

                  {isHost && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "var(--gold-soft)" }}>Rake (Hidden to others):</span>
                        <span className="pn-mono font-semibold" style={{ color: "var(--gold-soft)" }}>{game.rake} Banks</span>
                      </div>
                      <div className="pn-divider" style={{ margin: "6px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "var(--muted)" }}>Target Cashout Pool:</span>
                        <span className="pn-mono font-semibold" style={{ color: "var(--cream)" }}>{financials.expectedPool} Banks</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                          Variance:
                          {Math.abs(financials.variance) > 0.01 && (
                            <AlertTriangle size={12} color="var(--danger)" />
                          )}
                        </span>
                        <span className="pn-mono font-semibold" style={{ color: Math.abs(financials.variance) <= 0.01 ? "var(--success)" : "var(--danger)" }}>
                          {financials.variance > 0 ? `+${round2(financials.variance)}` : round2(financials.variance)} Banks
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {players.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>
                  No confirmed players yet. Request buy-in above!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {players.map((p) => {
                    const playerBuyins = gameBuyins.filter((b) => b.phone === p.phone && b.status === "approved");
                    const totalBuy = playerBuyins.reduce((s, b) => s + b.amount, 0);
                    const currentCashout = cashoutMap[p.phone] !== undefined ? cashoutMap[p.phone] : totalBuy;
                    const diff = currentCashout - totalBuy;
                    const canEditCashout = isHost || p.phone === currentUser.phone;

                    return (
                      <div
                        key={p.phone}
                        style={{
                          display: "flex", flexDirection: "column", gap: 8,
                          borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          {/* Name only - no phone number, no raw bank display on the right */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: p.phone === game.hostPhone ? "var(--gold)" : "var(--felt-soft)"
                              }}
                            />
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--cream)" }}>
                              {p.name} {p.phone === game.hostPhone && "👑"}
                            </div>
                          </div>

                          {/* Difference Display */}
                          <div
                            className="pn-mono text-xs font-semibold"
                            style={{
                              color: diff > 0.001 ? "var(--success)" : diff < -0.001 ? "var(--danger)" : "var(--muted)",
                              background: diff > 0.001 ? "rgba(111,169,125,0.1)" : diff < -0.001 ? "rgba(193,84,75,0.1)" : "rgba(255,255,255,0.02)",
                              padding: "2px 8px",
                              borderRadius: 6
                            }}
                          >
                            {diff > 0.001 ? `+${round2(diff)}` : diff < -0.001 ? `${round2(diff)}` : "0"} Banks
                          </div>
                        </div>

                        {/* Buy-in, Cashout, and Diff details */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.015)", padding: "6px 10px", borderRadius: 8 }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 10, color: "var(--muted)", display: "block", textTransform: "uppercase" }}>Buy-in</span>
                            <span className="pn-mono" style={{ fontSize: 12, fontWeight: 500 }}>{totalBuy} Banks</span>
                          </div>

                          <div style={{ flex: 1.5 }}>
                            <span style={{ fontSize: 10, color: "var(--muted)", display: "block", textTransform: "uppercase", marginBottom: 2 }}>Cash Out</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                className="pn-input pn-mono"
                                type="number"
                                step="0.1"
                                min={0}
                                disabled={!canEditCashout}
                                value={cashoutMap[p.phone] !== undefined ? cashoutMap[p.phone] : ""}
                                placeholder={String(totalBuy)}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                  const cleanVal = isNaN(val) ? 0 : Math.max(0, val);
                                  
                                  const nextMap = { ...cashoutMap, [p.phone]: cleanVal };
                                  setCashoutMap(nextMap);

                                  const nextGames = { ...appState.games };
                                  const currentGame = nextGames[game.id];
                                  if (currentGame) {
                                    currentGame.liveCashouts = {
                                      ...(currentGame.liveCashouts || {}),
                                      [p.phone]: cleanVal
                                    };
                                    onUpdateState({ ...appState, games: nextGames });
                                  }
                                }}
                                style={{
                                  width: "100%", padding: "4px 6px", fontSize: 12, height: 26, textAlign: "right",
                                  background: canEditCashout ? "var(--surface-raised)" : "rgba(255,255,255,0.01)",
                                  border: canEditCashout ? "1px solid rgba(212,162,76,0.2)" : "1px solid transparent"
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Direct buyin action for host */}
                        {isHost && (
                          <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end", marginTop: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, color: "var(--muted)", marginRight: "auto" }}>Direct Buy-in:</span>
                            <button
                              type="button"
                              className="pn-tag-pill"
                              style={{ padding: "2px 8px", fontSize: 11, margin: 0, background: "rgba(255,255,255,0.03)" }}
                              onClick={() => handleDirectBuyin(p.phone, game.initialBuyin)}
                            >
                              +{game.initialBuyin}
                            </button>
                            <button
                              type="button"
                              className="pn-tag-pill"
                              style={{ padding: "2px 8px", fontSize: 11, margin: 0, background: "rgba(255,255,255,0.03)" }}
                              onClick={() => handleDirectBuyin(p.phone, Math.floor(game.initialBuyin / 2) || 1)}
                            >
                              +{Math.floor(game.initialBuyin / 2) || 1}
                            </button>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                type="number"
                                min={1}
                                placeholder="Custom"
                                className="pn-input pn-mono"
                                style={{ width: 70, padding: "2px 6px", fontSize: 11, height: 24, margin: 0 }}
                                id={`direct-buyin-${p.phone}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = document.getElementById(`direct-buyin-${p.phone}`) as HTMLInputElement;
                                    const val = Number(input?.value);
                                    if (val >= 1) {
                                      handleDirectBuyin(p.phone, val);
                                      if (input) input.value = "";
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="pn-btn pn-btn-primary pn-btn-sm"
                                style={{ height: 24, padding: "0 8px", fontSize: 11, display: "flex", alignItems: "center" }}
                                onClick={() => {
                                  const input = document.getElementById(`direct-buyin-${p.phone}`) as HTMLInputElement;
                                  const val = Number(input?.value);
                                  if (val >= 1) {
                                    handleDirectBuyin(p.phone, val);
                                    if (input) input.value = "";
                                  }
                                }}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Host Administration: Pending Buyins to Approve (Moved to Bottom) */}
            {isHost && (
              <div className="pn-card" style={{ marginBottom: 16, border: "1px solid rgba(212,162,76,0.3)" }}>
                <span className="pn-label" style={{ color: "var(--gold)", fontWeight: 600 }}>Host: Action Requests</span>
                
                {gameBuyins.filter((b) => b.status === "pending").length > 0 ? (
                  <div style={{ marginTop: 6 }}>
                    <span className="pn-label" style={{ fontSize: 11, color: "var(--gold-soft)" }}>Pending Buy-ins</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {gameBuyins.filter((b) => b.status === "pending").map((b) => {
                        const user = appState.users[b.phone];
                        return (
                          <div
                            key={b.id}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              background: "var(--surface-raised)", padding: "8px 10px", borderRadius: 8
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name || b.phone}</div>
                              <div className="pn-mono" style={{ fontSize: 11, color: "var(--muted)" }}>{b.amount} Banks</div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                className="pn-icon-btn"
                                onClick={() => handleBuyinAction(b.id, "approved")}
                                style={{ background: "rgba(111,169,125,0.2)", color: "var(--success)" }}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="pn-icon-btn"
                                onClick={() => handleBuyinAction(b.id, "rejected")}
                                style={{ background: "rgba(193,84,75,0.2)", color: "var(--danger)" }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--muted)", padding: "4px 0" }}>
                    ✅ No pending buy-in requests to approve
                  </div>
                )}

                <div className="pn-divider" />

                <button
                  className="pn-btn pn-btn-primary w-full"
                  onClick={() => setIsClosing(true)}
                  style={{ gap: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Play size={16} /> End Game &amp; Settle Up
                </button>
              </div>
            )}
          </>
        )}

        {/* --- SETTLEMENT INPUT MODE (Host Only, under Live Game & Settle tab) --- */}
        {game.status === "active" && gameTab === "live" && isClosing && (
          <div className="pn-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span className="pn-label" style={{ margin: 0, fontSize: 14 }}>Cash Out Entry Ledger</span>
              <button className="pn-btn pn-btn-sm pn-btn-ghost" onClick={() => setIsClosing(false)}>
                Cancel
              </button>
            </div>

            <div style={{ marginBottom: 14, background: "var(--surface-raised)", padding: 12, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>Total Buy-ins Pool:</span>
                <span className="pn-mono">{financials.totalBuyins} Banks</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>Host Room Rake:</span>
                <span className="pn-mono">{game.rake} Banks</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
                <span>Target Cashout Pool:</span>
                <span className="pn-mono" style={{ color: "var(--gold-soft)" }}>{financials.expectedPool} Banks</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>Actual Entered Sum:</span>
                <span className="pn-mono">{financials.actualCashoutSum} Banks</span>
              </div>

              <div className="pn-divider" />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  Variance:
                  {Math.abs(financials.variance) > 0.01 && (
                    <AlertTriangle size={14} color="var(--danger)" />
                  )}
                </span>
                <span className="pn-mono" style={{ color: financials.variance === 0 ? "var(--success)" : "var(--danger)" }}>
                  {financials.variance > 0 ? `+${financials.variance}` : financials.variance} Banks
                </span>
              </div>
            </div>

            {Math.abs(financials.variance) > 0.01 && (
              <div style={{
                fontSize: 12, color: "var(--danger)", background: "rgba(193,84,75,0.1)",
                padding: 10, borderRadius: 8, marginBottom: 14
              }}>
                ⚠️ <strong>Chip Mismatch:</strong> The total cashed out chips ({financials.actualCashoutSum}) do not equal the target pool ({financials.expectedPool}). If you close now, the variance of {financials.variance} will be balanced by adjusting the host's room rake.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {players.map((p) => {
                const playerBuyins = gameBuyins.filter((b) => b.phone === p.phone && b.status === "approved");
                const totalBuy = playerBuyins.reduce((s, b) => s + b.amount, 0);
                return (
                  <div
                    key={p.phone}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderBottom: "1px solid var(--hairline)", paddingBottom: 8
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                      <div className="pn-mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        Buy-in: {totalBuy} Banks
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        className="pn-input pn-mono"
                        type="number"
                        min={0}
                        value={cashoutMap[p.phone] || ""}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setCashoutMap({ ...cashoutMap, [p.phone]: val });
                        }}
                        style={{ width: 80, padding: "6px 8px", fontSize: 14, textAlign: "right" }}
                      />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Banks</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="pn-btn pn-btn-primary"
              onClick={handleConfirmCloseGame}
              disabled={players.length === 0}
            >
              <Save size={16} /> Confirm Settle-up
            </button>
          </div>
        )}

        {/* --- GAME IS CLOSED: RESULTS REPORT (No tabs, always visible for finished games) --- */}
        {game.status === "closed" && game.results && (
          <>
            {/* Game Details Card (Static) */}
            <div className="pn-card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--gold)", fontWeight: 500 }}>Host: {game.hostName}</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <span className="pn-mono" style={{ fontSize: 13, color: "var(--cream)" }}>
                    Buy-in: {game.initialBuyin} Banks
                  </span>
                  {game.ratio && (
                    <span className="pn-mono" style={{ fontSize: 11, color: "var(--gold-soft)" }}>
                      Stakes: {game.ratio} Blinds
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <Calendar size={15} className="text-muted" style={{ color: "var(--gold-soft)" }} />
                  <span>{fmtDateTime(game.date, game.time)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <MapPin size={15} style={{ color: "var(--gold-soft)" }} />
                  <span>{game.venue}</span>
                </div>
              </div>
            </div>

            {/* Financial summary card */}
            <div className="pn-card" style={{ marginBottom: 16 }}>
              <span className="pn-label">Settle-up Report</span>

              <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", padding: "8px 0" }}>
                <div>
                  <div className="pn-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--gold-soft)" }}>
                    {game.rakeInfo?.totalBuyins}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Total Play</div>
                </div>
                <div>
                  <div className="pn-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--success)" }}>
                    {game.rakeInfo?.effectiveRake}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Host Rake</div>
                </div>
                <div>
                  <div className="pn-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--cream)" }}>
                    {players.length}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Players</div>
                </div>
              </div>
            </div>

            {/* Minimised pairwise debt settlement guidance */}
            <div className="pn-card" style={{ marginBottom: 16 }}>
              <span className="pn-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={13} color="var(--gold)" />
                Direct Settle-up Transfers
              </span>

              {financials.settlement.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--success)", fontSize: 13, padding: "10px 0" }}>
                  🎉 No transaction settlement is needed! Everyone broke perfectly even.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {financials.settlement.map((s, idx) => {
                    const fromUser = appState.users[s.from];
                    const toUser = appState.users[s.to];
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "var(--surface-raised)", padding: 12, borderRadius: 10,
                          display: "flex", alignItems: "center", justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--danger)" }}>
                            {fromUser?.name || s.from}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--muted)", margin: "0 6px" }}>pays</span>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--success)" }}>
                            {toUser?.name || s.to}
                          </span>
                        </div>
                        <div className="pn-mono" style={{ fontWeight: 600, color: "var(--gold)" }}>
                          {s.amount} Banks
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Individual scoreboard results list */}
            <div className="pn-card">
              <span className="pn-label">Individual Scoreboard</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {players.map((p) => {
                  const res = game.results![p.phone];
                  if (!res) return null;
                  return (
                    <div
                      key={p.phone}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        borderBottom: "1px solid var(--hairline)", paddingBottom: 8
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          Buy-in: {res.buyin} • Cash-out: {res.cashout}
                        </div>
                      </div>

                      <div
                        className="pn-mono"
                        style={{
                          fontSize: 14, fontWeight: 600,
                          color: res.net > 0.01 ? "var(--success)" : res.net < -0.01 ? "var(--danger)" : "var(--muted)"
                        }}
                      >
                        {res.net > 0.01 ? `+${res.net}` : res.net} Banks
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
