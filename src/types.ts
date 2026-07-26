export interface User {
  phone: string;
  name: string;
  pinHash: string;
  avatarColor?: string;
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
  initialBuyin: number; // in Banks (1 Bank = $1 / standard chip unit)
  rake: number;         // in Banks per game
  maxPlayers?: number;
  ratio?: "1:1" | "1:2";
  status: GameStatus;
  createdAt: number;
  closedAt?: number;
  liveCashouts?: Record<string, number>; // phone -> cashout Banks
  results?: Record<
    string,
    {
      cashout: number;
      buyin: number;
      net: number;
      totalBuyins: number;
    }
  >;
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

export interface SettlementDebt {
  fromPhone: string;
  fromName: string;
  toPhone: string;
  toName: string;
  amount: number;
}

export interface HandNote {
  id: string;
  gameId?: string;
  date: string;
  title: string;
  heroHand: string;
  board?: string;
  position: string;
  stakes: string;
  potSize: number;
  result: "win" | "loss" | "chop";
  amountWonLost: number;
  notes: string;
  createdAt: number;
}

export interface BankrollGoal {
  targetAmount: number;
  targetStakes: string;
}

export interface AppState {
  currentUser: User | null;
  users: Record<string, User>;
  games: Record<string, Game>;
  invites: Record<string, Invite>;
  buyins: Record<string, Buyin>;
  handNotes: Record<string, HandNote>;
  bankrollGoal: BankrollGoal;
  activeTab: "games" | "ledger" | "players";
}
