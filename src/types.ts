/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  phone: string;
  name: string;
  pinHash: string;
}

export type GameStatus = "draft" | "active" | "closed";
export type RsvpStatus = "yes" | "no" | "maybe" | "pending";
export type BuyinStatus = "pending" | "approved" | "rejected";

export interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  hostPhone: string;
  hostName: string;
  initialBuyin: number; // in Banks
  rake: number;         // in Banks
  maxPlayers?: number;
  status: GameStatus;
  createdAt: number;
  closedAt?: number;
  results?: Record<string, {
    cashout: number;
    buyin: number;
    net: number;
    totalBuyins: number;
  }>;
  rakeInfo?: {
    totalBuyins: number;
    actualCashoutSum: number;
    expectedPool: number;
    variance: number;
    effectiveRake: number;
  };
}

export interface Invite {
  id: string;
  gameId: string;
  phone: string;
  rsvp: RsvpStatus;
  updatedAt: number;
}

export interface Buyin {
  id: string;
  gameId: string;
  phone: string;
  amount: number; // in Banks
  status: BuyinStatus;
  createdAt: number;
}

export interface AppState {
  users: Record<string, User>;
  games: Record<string, Game>;
  invites: Record<string, Invite>;
  buyins: Record<string, Buyin>;
}

export interface Session {
  phone: string;
}
