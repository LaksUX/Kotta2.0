/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { X, Calendar, MapPin, Award, Shield, Loader2 } from "lucide-react";
import { AppState, Game } from "../types";
import { genId } from "../lib/storage";

interface CreateGameProps {
  hostPhone: string;
  hostName: string;
  onClose: () => void;
  onSave: (game: Game) => void;
}

export default function CreateGame({ hostPhone, hostName, onClose, onSave }: CreateGameProps) {
  const [title, setTitle] = useState("Saturday Night Shakedown");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow by default
    return d.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("19:30");
  const [venue, setVenue] = useState("Rohan's Living Room");
  const [initialBuyin, setInitialBuyin] = useState(100);
  const [rake, setRake] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [ratio, setRatio] = useState<"1:1" | "1:2" | undefined>("1:2");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Title is required.");
    if (!date) return setError("Date is required.");
    if (!venue.trim()) return setError("Venue is required.");
    if (initialBuyin <= 0) return setError("Initial buy-in must be greater than 0.");
    if (rake < 0) return setError("Rake cannot be negative.");

    setBusy(true);

    const newGame: Game = {
      id: genId("game"),
      title: title.trim(),
      date,
      time,
      venue: venue.trim(),
      hostPhone,
      hostName,
      initialBuyin,
      rake,
      maxPlayers: maxPlayers || undefined,
      ratio,
      status: "active", // created as active directly, ready for play
      createdAt: Date.now()
    };

    setTimeout(() => {
      onSave(newGame);
      setBusy(false);
    }, 400);
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "var(--ink)", zIndex: 100, display: "flex", flexDirection: "column"
    }}>
      <div className="pn-header">
        <button className="pn-icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="pn-header-title pn-display">Setup New Game</div>
      </div>

      <div className="pn-body" style={{ overflowY: "auto" }}>
        <form onSubmit={handleSubmit}>
          <div className="pn-card" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label className="pn-label">Game Title</label>
              <input
                className="pn-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Friday Night Deepstack"
                required
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="pn-label">Date</label>
                <input
                  className="pn-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="pn-label">Time</label>
                <input
                  className="pn-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="pn-label">Venue / Location</label>
              <input
                className="pn-input"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Rohan's Place, Block C"
                required
              />
            </div>
          </div>

          <div className="pn-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="pn-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Award size={12} color="var(--gold)" />
                  Initial Buy-in (Banks)
                </label>
                <input
                  className="pn-input pn-mono"
                  type="number"
                  min={1}
                  value={initialBuyin}
                  onChange={(e) => setInitialBuyin(Number(e.target.value))}
                  required
                />
              </div>

              <div style={{ flex: 1 }}>
                <label className="pn-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Shield size={12} color="var(--gold)" />
                  Host Rake (Banks)
                </label>
                <input
                  className="pn-input pn-mono"
                  type="number"
                  min={0}
                  value={rake}
                  onChange={(e) => setRake(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="pn-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                Game Blinds Ratio
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={`pn-tag-pill ${ratio === "1:1" ? "active" : ""}`}
                  onClick={() => setRatio("1:1")}
                  style={{ flex: 1, justifyContent: "center", padding: "10px", margin: 0 }}
                >
                  1:1 Ratio (e.g. SB 5 / BB 5)
                </button>
                <button
                  type="button"
                  className={`pn-tag-pill ${ratio === "1:2" ? "active" : ""}`}
                  onClick={() => setRatio("1:2")}
                  style={{ flex: 1, justifyContent: "center", padding: "10px", margin: 0 }}
                >
                  1:2 Ratio (e.g. SB 5 / BB 10)
                </button>
              </div>
            </div>

            <div>
              <label className="pn-label">Max Players (Optional)</label>
              <input
                className="pn-input pn-mono"
                type="number"
                min={2}
                max={100}
                value={maxPlayers || ""}
                onChange={(e) => setMaxPlayers(e.target.value ? Number(e.target.value) : 0)}
                placeholder="e.g. 12"
              />
              <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, display: "block" }}>
                Rake is deducted from the total buy-in pool at checkout.
              </span>
            </div>
          </div>

          {error && (
            <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 16, display: "flex", gap: 6 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              className="pn-btn pn-btn-ghost"
              type="button"
              onClick={onClose}
              style={{ flex: 1 }}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="pn-btn pn-btn-primary"
              type="submit"
              style={{ flex: 2 }}
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Scheduling...
                </>
              ) : (
                "Launch Game"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
