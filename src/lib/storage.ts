/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState, Session, Game, Invite, Buyin } from "../types";

const STATE_KEY = "pnstate";
const SESSION_KEY = "pnsession";

export function defaultState(): AppState {
  return { users: {}, games: {}, invites: {}, buyins: {} };
}

export const storageAdapter = {
  get: async (key: string, isGlobal = false): Promise<{ value: string } | null> => {
    if (typeof window !== "undefined" && (window as any).storage && typeof (window as any).storage.get === "function") {
      try {
        return await (window as any).storage.get(key, isGlobal);
      } catch (e) {
        console.warn("window.storage.get failed, falling back to localStorage", e);
      }
    }
    const val = localStorage.getItem(key);
    return val ? { value: val } : null;
  },
  set: async (key: string, value: string, isGlobal = false): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).storage && typeof (window as any).storage.set === "function") {
      try {
        await (window as any).storage.set(key, value, isGlobal);
        return;
      } catch (e) {
        console.warn("window.storage.set failed, falling back to localStorage", e);
      }
    }
    localStorage.setItem(key, value);
  },
  delete: async (key: string, isGlobal = false): Promise<void> => {
    if (typeof window !== "undefined" && (window as any).storage && typeof (window as any).storage.delete === "function") {
      try {
        await (window as any).storage.delete(key, isGlobal);
        return;
      } catch (e) {
        console.warn("window.storage.delete failed, falling back to localStorage", e);
      }
    }
    localStorage.removeItem(key);
  }
};

export async function loadAppState(): Promise<AppState> {
  try {
    const res = await fetch("/api/state");
    if (res.ok) {
      const parsed = await res.json();
      return {
        users: parsed.users || {},
        games: parsed.games || {},
        invites: parsed.invites || {},
        buyins: parsed.buyins || {},
      };
    }
  } catch (e) {
    console.warn("loadAppState from server failed, falling back to localStorage", e);
  }

  try {
    const res = await storageAdapter.get(STATE_KEY, true);
    if (res && res.value) {
      const parsed = JSON.parse(res.value);
      return {
        users: parsed.users || {},
        games: parsed.games || {},
        invites: parsed.invites || {},
        buyins: parsed.buyins || {},
      };
    }
    return defaultState();
  } catch {
    return defaultState();
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  try {
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
  } catch (e) {
    console.error("saveState to server failed", e);
  }

  try {
    await storageAdapter.set(STATE_KEY, JSON.stringify(state), true);
  } catch (e) {
    console.error("save state failed", e);
  }
}

export async function loadSession(): Promise<Session | null> {
  try {
    const res = await storageAdapter.get(SESSION_KEY, false);
    return res && res.value ? JSON.parse(res.value) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  try {
    await storageAdapter.set(SESSION_KEY, JSON.stringify(session), false);
  } catch (e) {
    console.error("save session failed", e);
  }
}

export async function clearSessionStorage(): Promise<void> {
  try {
    await storageAdapter.delete(SESSION_KEY, false);
  } catch {
    /* ignore */
  }
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

export function hashPin(phone: string, pin: string): string {
  return simpleHash(`${phone}:${pin}`);
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const AVATAR_COLORS = ["#D4A24C", "#3E8971", "#C1544B", "#7C93C4", "#B98CC7", "#E8C77E"];

export function colorForPhone(phone: string): string {
  let sum = 0;
  for (let i = 0; i < phone.length; i++) {
    sum += phone.charCodeAt(i);
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

export function fmtDateTime(date: string, time?: string): string {
  if (!date) return "";
  try {
    const d = new Date(`${date}T${time || "00:00"}`);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return `${date} ${time || ""}`;
  }
}

export function gameTimestamp(game: Game): number {
  return new Date(`${game.date}T${game.time || "00:00"}`).getTime();
}

/* ---------------------------------------------------------------
   SETTLEMENT & LEDGER HELPERS
------------------------------------------------------------------*/
export function getConfirmedPlayers(appState: AppState, game: Game) {
  const phones = new Set<string>();
  Object.values(appState.invites).forEach((i) => {
    if (i.gameId === game.id && i.rsvp === "yes") {
      phones.add(i.phone);
    }
  });
  phones.add(game.hostPhone); // host is always a player in their own game
  return Array.from(phones).map((p) => appState.users[p]).filter(Boolean);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface SettlementRow {
  from: string;
  to: string;
  amount: number;
}

export function computeSettlement(nets: { phone: string; net: number }[]): SettlementRow[] {
  const creditors = nets
    .filter((n) => n.net > 0.001)
    .map((n) => ({ phone: n.phone, amt: n.net }))
    .sort((a, b) => b.amt - a.amt);
  const debtors = nets
    .filter((n) => n.net < -0.001)
    .map((n) => ({ phone: n.phone, amt: -n.net }))
    .sort((a, b) => b.amt - a.amt);

  const result: SettlementRow[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0.001) {
      result.push({
        from: debtors[i].phone,
        to: creditors[j].phone,
        amount: round2(pay)
      });
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt <= 0.001) i++;
    if (creditors[j].amt <= 0.001) j++;
  }
  return result;
}

export function computeGameFinancials(appState: AppState, game: Game, cashoutMap: Record<string, number>) {
  const players = getConfirmedPlayers(appState, game);
  const buyins = Object.values(appState.buyins).filter((b) => b.gameId === game.id && b.status === "approved");
  const buyinFor = (phone: string) => buyins.filter((b) => b.phone === phone).reduce((s, b) => s + b.amount, 0);

  const getCashout = (phone: string) => {
    if (cashoutMap && cashoutMap[phone] !== undefined) {
      return Number(cashoutMap[phone]);
    }
    if (game.liveCashouts && game.liveCashouts[phone] !== undefined) {
      return Number(game.liveCashouts[phone]);
    }
    return buyinFor(phone); // Default to buy-in (break-even)
  };

  const totalBuyins = players.reduce((s, p) => s + buyinFor(p.phone), 0);
  const actualCashoutSum = players.reduce((s, p) => s + getCashout(p.phone), 0);
  const expectedPool = totalBuyins - (game.rake || 0);
  const variance = expectedPool - actualCashoutSum;
  const effectiveRake = (game.rake || 0) + variance;

  const nets = players.map((p) => ({
    phone: p.phone,
    net: getCashout(p.phone) - buyinFor(p.phone),
    buy: buyinFor(p.phone)
  }));

  const settlement = computeSettlement(nets);
  return { players, totalBuyins, actualCashoutSum, expectedPool, variance, effectiveRake, nets, settlement };
}

export function computePlayerLedger(appState: AppState, phone: string) {
  const sessions = Object.values(appState.games)
    .filter((g) => g.status === "closed" && g.results && g.results[phone])
    .map((g) => ({
      gameId: g.id,
      title: g.title,
      venue: g.venue,
      date: g.date,
      closedAt: g.closedAt || gameTimestamp(g),
      net: g.results![phone].net,
      totalBuyins: g.results![phone].totalBuyins,
      isHost: g.hostPhone === phone
    }))
    .sort((a, b) => a.closedAt - b.closedAt);

  const totalNet = round2(sessions.reduce((s, x) => s + x.net, 0));
  const wins = sessions.filter((x) => x.net > 0).length;
  const winRate = sessions.length ? Math.round((wins / sessions.length) * 100) : 0;
  const avgBuyin = sessions.length ? Math.round(sessions.reduce((s, x) => s + x.totalBuyins, 0) / sessions.length) : 0;
  const biggestWin = sessions.length ? round2(Math.max(0, ...sessions.map((x) => x.net))) : 0;
  const biggestLoss = sessions.length ? round2(Math.min(0, ...sessions.map((x) => x.net))) : 0;

  let running = 0;
  const chartData = sessions.map((s, idx) => {
    running = round2(running + s.net);
    return { session: idx + 1, cumulative: running, label: s.date };
  });

  return {
    sessions: sessions.slice().reverse(),
    totalNet,
    winRate,
    avgBuyin,
    biggestWin,
    biggestLoss,
    chartData,
    count: sessions.length
  };
}

export function computeHostLedger(appState: AppState, phone: string) {
  const games = Object.values(appState.games)
    .filter((g) => g.hostPhone === phone && g.status === "closed" && g.rakeInfo)
    .sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0));

  const totalRake = round2(games.reduce((s, g) => s + g.rakeInfo!.effectiveRake, 0));
  const totalPot = games.reduce((s, g) => s + g.rakeInfo!.totalBuyins, 0);

  const chartData = games.map((g, idx) => ({
    session: idx + 1,
    rake: round2(g.rakeInfo!.effectiveRake),
    label: g.date
  }));

  return {
    games: games.slice().reverse(),
    totalRake,
    totalPot,
    chartData,
    count: games.length
  };
}
