/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { ShieldCheck, Loader2, Sparkles, Calendar, MapPin, Coins, Users } from "lucide-react";
import { AppState, Session } from "../types";
import { hashPin, loadAppState, saveAppState, saveSession, fmtDateTime } from "../lib/storage";
import HoysalaLogo from "./HoysalaLogo";

interface AuthScreenProps {
  onAuth: (state: AppState, session: Session) => void;
  pendingJoinGameId?: string | null;
  appState?: AppState;
}

export default function AuthScreen({ onAuth, pendingJoinGameId, appState }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pendingGame = pendingJoinGameId && appState?.games ? appState.games[pendingJoinGameId] : null;
  const confirmedPlayersCount = pendingGame && appState?.invites 
    ? Object.values(appState.invites).filter(i => i.gameId === pendingGame.id && i.rsvp === "yes").length + 1 // +1 for host
    : 1;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 6) {
      return setError("Enter a valid phone number (at least 6 digits).");
    }
    if (!/^\d{4,6}$/.test(pin)) {
      return setError("PIN must be 4–6 digits.");
    }

    setBusy(true);
    try {
      const latest = await loadAppState();

      if (mode === "signup") {
        if (!name.trim()) {
          setBusy(false);
          return setError("Enter your name.");
        }
        if (pin !== pin2) {
          setBusy(false);
          return setError("PINs do not match.");
        }
        if (latest.users[cleanPhone]) {
          setBusy(false);
          return setError("An account already exists for this number. Log in instead.");
        }
        latest.users[cleanPhone] = {
          phone: cleanPhone,
          name: name.trim(),
          pinHash: hashPin(cleanPhone, pin)
        };
        await saveAppState(latest);
        const session = { phone: cleanPhone };
        await saveSession(session);
        setBusy(false);
        onAuth(latest, session);
      } else {
        const user = latest.users[cleanPhone];
        if (!user) {
          setBusy(false);
          return setError("No account found for this number. Sign up first.");
        }
        if (user.pinHash !== hashPin(cleanPhone, pin)) {
          setBusy(false);
          return setError("Incorrect PIN.");
        }
        const session = { phone: cleanPhone };
        await saveSession(session);
        setBusy(false);
        onAuth(latest, session);
      }
    } catch (err) {
      setBusy(false);
      setError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="pn-root">
      <div className="pn-body" style={{ paddingTop: 60 }}>
        <div className="w-full max-w-[400px] mx-auto">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            {/* Hoysala Art-Inspired Gold Emblem Logo */}
            <div className="flex justify-center mb-4 select-none">
              <HoysalaLogo size={92} />
            </div>
            <div className="pn-display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cream)" }}>Kotta</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Your Poker companion.
            </div>
          </div>

          {/* Shared Table Invitation Banner */}
          {pendingGame ? (
            <div className="pn-card mb-6 border border-[var(--gold)]/30 bg-[var(--gold)]/5 shadow-2xl relative overflow-hidden animate-fadeIn">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--gold)]/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-2 text-[var(--gold)] font-mono text-[11px] uppercase tracking-wider mb-2 font-semibold">
                <Sparkles size={14} className="animate-spin" style={{ animationDuration: '4s' }} /> Table Invitation Details
              </div>
              
              <h3 className="font-serif text-xl font-bold text-[var(--cream)] mb-1">
                {pendingGame.title}
              </h3>
              <p className="text-xs text-[var(--muted)] mb-3">
                👑 Hosted by <span className="text-[var(--cream)] font-medium">{pendingGame.hostName}</span>
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 bg-black/30 rounded-xl border border-white/5 mb-3">
                <div className="flex items-center gap-1.5 text-white/80">
                  <Calendar size={13} className="text-[var(--gold)]" />
                  <span className="truncate">{fmtDateTime(pendingGame.date, pendingGame.time)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/80">
                  <MapPin size={13} className="text-[var(--gold)]" />
                  <span className="truncate">{pendingGame.venue || "Private Table"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/80">
                  <Coins size={13} className="text-[var(--gold)]" />
                  <span>Buy-in: <strong className="text-[var(--gold)] font-mono">{pendingGame.initialBuyin} Banks</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-white/80">
                  <Users size={13} className="text-[var(--gold)]" />
                  <span>{confirmedPlayersCount} Confirmed</span>
                </div>
              </div>

              <p className="text-[11px] text-[var(--gold)]/90 font-mono text-center bg-[var(--gold)]/10 py-1.5 px-2 rounded-lg border border-[var(--gold)]/20">
                👉 Enter your details below to enter this table!
              </p>
            </div>
          ) : null}

          <div className="pn-card">
            <div style={{ marginBottom: 20 }}>
              <h2 className="pn-display text-xl font-serif font-bold text-[var(--cream)]" style={{ margin: 0 }}>
                {mode === "login" ? "Log In" : "Create Profile"}
              </h2>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, margin: "4px 0 0 0" }}>
                {mode === "login" 
                  ? "Enter your phone number and PIN to access the table." 
                  : "Sign up with your phone number and a secure PIN."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div style={{ marginBottom: 12 }}>
                  <label className="pn-label">Your name</label>
                  <input
                    className="pn-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan Mehta"
                    required
                  />
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label className="pn-label">Phone number</label>
                <input
                  className="pn-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="pn-label">PIN (4–6 digits)</label>
                <input
                  className="pn-input"
                  type="password"
                  maxLength={6}
                  pattern="\d*"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  required
                />
              </div>

              {mode === "signup" && (
                <div style={{ marginBottom: 16 }}>
                  <label className="pn-label">Confirm PIN</label>
                  <input
                    className="pn-input"
                    type="password"
                    maxLength={6}
                    pattern="\d*"
                    value={pin2}
                    onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    required
                  />
                </div>
              )}

              {error && (
                <div
                  style={{
                    color: "var(--danger)",
                    fontSize: 13,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>⚠️</span> {error}
                </div>
              )}

              <button className="pn-btn pn-btn-primary" type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Please wait...
                  </>
                ) : mode === "login" ? (
                  "Enter Room"
                ) : (
                  "Create Profile"
                )}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>
              {mode === "login" ? (
                <span style={{ color: "var(--muted)" }}>
                  New to Kotta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--gold)",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline"
                    }}
                  >
                    Create a profile
                  </button>
                </span>
              ) : (
                <span style={{ color: "var(--muted)" }}>
                  Already have a profile?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--gold)",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline"
                    }}
                  >
                    Log in
                  </button>
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--muted)" }}>
            🤫 We store your PIN like we store your secrets: on this browser only. Lose your PIN, lose your bragging rights!
          </div>

          <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, fontFamily: "var(--font-mono)", color: "rgba(243, 237, 228, 0.25)", letterSpacing: "0.05em" }}>
            Build 2.4.12 • Production Stable
          </div>
        </div>
      </div>
    </div>
  );
}
