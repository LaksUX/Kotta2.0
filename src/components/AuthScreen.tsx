/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { AppState, Session } from "../types";
import { hashPin, loadAppState, saveAppState, saveSession } from "../lib/storage";

interface AuthScreenProps {
  onAuth: (state: AppState, session: Session) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
            {/* Premium Gold Emblem Logo */}
            <div 
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-soft) 100%)",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(212, 175, 55, 0.25)",
                border: "4px solid rgba(255, 255, 255, 0.1)"
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5V11C4 16.55 7.42 21.74 12 23C16.58 21.74 20 16.55 20 11V5L12 2Z" fill="var(--ink)" />
                <path d="M8 9L10 11L12 7L14 11L16 9" stroke="var(--gold-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="14" r="2.5" fill="var(--gold-soft)" />
              </svg>
            </div>
            <div className="pn-display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cream)" }}>Kotta</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Track buy-ins &amp; settle up. No currency, no cash — just Banks.
            </div>
          </div>

          <div className="pn-card">
            <div className="pn-row" style={{ marginBottom: 16, gap: 8 }}>
              <button
                className={`pn-tag-pill ${mode === "login" ? "active" : ""}`}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                style={{ flex: 1, justifyContent: "center" }}
              >
                Log in
              </button>
              <button
                className={`pn-tag-pill ${mode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                style={{ flex: 1, justifyContent: "center" }}
              >
                Sign up
              </button>
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
          </div>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--muted)" }}>
            💡 PIN accounts are preserved in your local session. Remember your PIN to re-login!
          </div>
        </div>
      </div>
    </div>
  );
}
