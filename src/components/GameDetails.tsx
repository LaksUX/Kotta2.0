/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
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

  // RSVPs for this game
  const myInvite = Object.values(appState.invites).find(
    (i) => i.gameId === game.id && i.phone === currentUser.phone
  );
  const myRsvp = myInvite ? myInvite.rsvp : (isHost ? "yes" : "pending");

  // Buyins for this game
  const gameBuyins = Object.values(appState.buyins).filter((b) => b.gameId === game.id);
  const myApprovedBuyins = gameBuyins.filter((b) => b.phone === currentUser.phone && b.status === "approved");
  const myPendingBuyins = gameBuyins.filter((b) => b.phone === currentUser.phone && b.status === "pending");

  const totalMyApprovedBuyin = myApprovedBuyins.reduce((s, b) => s + b.amount, 0);

  // Close Game / Cash Out Flow state
  const [isClosing, setIsClosing] = useState(false);
  const [cashoutMap, setCashoutMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => {
      // Default to initial buy-in amount if no value set
      const playerBuyins = gameBuyins.filter((b) => b.phone === p.phone && b.status === "approved");
      const totalBuy = playerBuyins.reduce((s, b) => s + b.amount, 0);
      initial[p.phone] = totalBuy;
    });
    return initial;
  });

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

  // Host Actions: Add another player directly to the game (physical manual add)
  const [searchPhone, setSearchPhone] = useState("");
  const [manualAddError, setManualAddError] = useState("");

  function handleManualAdd() {
    setManualAddError("");
    const cleanPhone = searchPhone.replace(/\D/g, "");
    if (!cleanPhone) return;

    const matchedUser = appState.users[cleanPhone];
    if (!matchedUser) {
      setManualAddError("No registered user found with this phone number.");
      return;
    }

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

    // Also request initial buy-in for this player
    const buyinId = genId("buyin");
    const nextBuyins = { ...appState.buyins };
    nextBuyins[buyinId] = {
      id: buyinId,
      gameId: game.id,
      phone: cleanPhone,
      amount: game.initialBuyin,
      status: "approved",
      createdAt: Date.now()
    };

    onUpdateState({ ...appState, invites: nextInvites, buyins: nextBuyins });
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
    <div className="pn-root">
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
        {/* Game Details Card */}
        <div className="pn-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--gold)", fontWeight: 500 }}>Host: {game.hostName}</span>
            <span className="pn-mono" style={{ fontSize: 13, color: "var(--muted)" }}>
              Buy-in: {game.initialBuyin} Banks
            </span>
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

        {/* --- GAME IS ACTIVE --- */}
        {game.status === "active" && !isClosing && (
          <>
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

            {/* Buy-in panel for the user */}
            {myRsvp === "yes" && (
              <div className="pn-card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="pn-label" style={{ margin: 0 }}>Your Chips</span>
                  <span className="pn-mono" style={{ fontSize: 14, fontWeight: 600, color: "var(--gold-soft)" }}>
                    {totalMyApprovedBuyin} Banks Approved
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="pn-btn pn-btn-felt"
                    onClick={() => handleRequestBuyin(game.initialBuyin)}
                    style={{ flex: 1 }}
                  >
                    <Plus size={16} /> Buy-in {game.initialBuyin} Banks
                  </button>

                  <button
                    className="pn-btn pn-btn-ghost"
                    onClick={() => handleRequestBuyin(Math.floor(game.initialBuyin / 2))}
                    style={{ flex: 1 }}
                  >
                    Half Buy-in
                  </button>
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

            {/* Host Administration Center */}
            {isHost && (
              <div className="pn-card" style={{ marginBottom: 16, border: "1px solid rgba(212,162,76,0.3)" }}>
                <span className="pn-label" style={{ color: "var(--gold)", fontWeight: 600 }}>Host Dashboard</span>

                {/* Manual Add Player */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                    Add sitting player directly (by Phone)
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      className="pn-input pn-mono"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      style={{ padding: "8px 12px", fontSize: 13 }}
                    />
                    <button
                      className="pn-btn pn-btn-primary pn-btn-sm"
                      onClick={handleManualAdd}
                      type="button"
                    >
                      Add &amp; Buyin
                    </button>
                  </div>
                  {manualAddError && (
                    <span style={{ fontSize: 11, color: "var(--danger)", marginTop: 4, display: "block" }}>
                      {manualAddError}
                    </span>
                  )}
                </div>

                {/* Pending Buyins to Approve */}
                {gameBuyins.filter((b) => b.status === "pending").length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <span className="pn-label">Pending Buy-ins</span>
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
                    ✅ No pending buy-in requests
                  </div>
                )}

                <div className="pn-divider" />

                <button
                  className="pn-btn pn-btn-primary"
                  onClick={() => setIsClosing(true)}
                  style={{ gap: 6 }}
                >
                  <Play size={16} /> End Game &amp; Settle Up
                </button>
              </div>
            )}

            {/* Players and Buyins List */}
            <div className="pn-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="pn-label" style={{ margin: 0 }}>Felt Ledger ({players.length} players)</span>
                <span className="pn-mono" style={{ fontSize: 13, color: "var(--muted)" }}>
                  Pot: {gameBuyins.filter((b) => b.status === "approved").reduce((s, b) => s + b.amount, 0)} Banks
                </span>
              </div>

              {players.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>
                  No confirmed players yet. Request buy-in above!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {players.map((p) => {
                    const playerBuyins = gameBuyins.filter((b) => b.phone === p.phone && b.status === "approved");
                    const totalBuy = playerBuyins.reduce((s, b) => s + b.amount, 0);
                    return (
                      <div
                        key={p.phone}
                        style={{
                          display: "flex", alignItems: "center", justifyValue: "space-between",
                          justifyContent: "space-between"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: p.phone === game.hostPhone ? "var(--gold)" : "var(--felt-soft)"
                            }}
                          />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>
                              {p.name} {p.phone === game.hostPhone && "👑"}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.phone}</div>
                          </div>
                        </div>

                        <div className="pn-mono" style={{ fontSize: 14, fontWeight: 500 }}>
                          {totalBuy} Banks
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* --- SETTLEMENT INPUT MODE (Host Only) --- */}
        {game.status === "active" && isClosing && (
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

        {/* --- GAME IS CLOSED: RESULTS REPORT --- */}
        {game.status === "closed" && game.results && (
          <>
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
                <div style={{ textAlignment: "center", color: "var(--success)", fontSize: 13, padding: "10px 0" }}>
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
                  const isWinner = res.net > 0.001;
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
