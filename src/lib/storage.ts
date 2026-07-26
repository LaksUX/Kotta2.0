import { AppState, Game, User, Buyin, Invite, SettlementDebt, HandNote, BankrollGoal } from "../types";

const STORAGE_KEY = "poker_host_app_v3_state";

export const INITIAL_USERS: Record<string, User> = {
  "9876543210": {
    phone: "9876543210",
    name: "Lakshmesh (Host)",
    pinHash: "1234",
    avatarColor: "#F3D375",
  },
  "9123456789": {
    phone: "9123456789",
    name: "Alex Rivera",
    pinHash: "1234",
    avatarColor: "#60A5FA",
  },
  "9988776655": {
    phone: "9988776655",
    name: "Vikram Mehta",
    pinHash: "1234",
    avatarColor: "#34D399",
  },
  "9112233445": {
    phone: "9112233445",
    name: "Sophia Chen",
    pinHash: "1234",
    avatarColor: "#F472B6",
  },
  "9554433221": {
    phone: "9554433221",
    name: "Daniel Vance",
    pinHash: "1234",
    avatarColor: "#A78BFA",
  },
};

export const INITIAL_GAMES: Record<string, Game> = {
  game_101: {
    id: "game_101",
    title: "Friday Night High Stakes",
    date: "2026-07-24",
    time: "20:00",
    venue: "The Royal Lounge",
    hostPhone: "9876543210",
    hostName: "Lakshmesh (Host)",
    initialBuyin: 500,
    rake: 50,
    maxPlayers: 8,
    ratio: "1:2",
    status: "active",
    createdAt: Date.now() - 7200000,
    liveCashouts: {
      "9123456789": 850,
      "9988776655": 200,
      "9112233445": 1100,
      "9554433221": 0,
    },
  },
  game_100: {
    id: "game_100",
    title: "Midweek Texas Hold'em",
    date: "2026-07-20",
    time: "19:30",
    venue: "Penthouse Suite #402",
    hostPhone: "9876543210",
    hostName: "Lakshmesh (Host)",
    initialBuyin: 300,
    rake: 30,
    maxPlayers: 6,
    ratio: "1:1",
    status: "closed",
    createdAt: Date.now() - 500000000,
    closedAt: Date.now() - 480000000,
    results: {
      "9876543210": { cashout: 650, buyin: 300, net: 350, totalBuyins: 300 },
      "9123456789": { cashout: 100, buyin: 300, net: -200, totalBuyins: 300 },
      "9988776655": { cashout: 400, buyin: 600, net: -200, totalBuyins: 600 },
      "9112233445": { cashout: 620, buyin: 300, net: 320, totalBuyins: 300 },
      "9554433221": { cashout: 30, buyin: 300, net: -270, totalBuyins: 300 },
    },
    rakeInfo: {
      totalBuyins: 1800,
      actualCashoutSum: 1800,
      expectedPool: 1800,
      variance: 0,
      effectiveRake: 30,
    },
  },
};

export const INITIAL_INVITES: Record<string, Invite> = {
  inv_1: {
    id: "inv_1",
    gameId: "game_101",
    phone: "9123456789",
    rsvp: "yes",
    updatedAt: Date.now() - 100000,
  },
  inv_2: {
    id: "inv_2",
    gameId: "game_101",
    phone: "9988776655",
    rsvp: "yes",
    updatedAt: Date.now() - 90000,
  },
  inv_3: {
    id: "inv_3",
    gameId: "game_101",
    phone: "9112233445",
    rsvp: "yes",
    updatedAt: Date.now() - 80000,
  },
  inv_4: {
    id: "inv_4",
    gameId: "game_101",
    phone: "9554433221",
    rsvp: "yes",
    updatedAt: Date.now() - 70000,
  },
};

export const INITIAL_BUYINS: Record<string, Buyin> = {
  b_1: {
    id: "b_1",
    gameId: "game_101",
    phone: "9123456789",
    amount: 500,
    status: "approved",
    createdAt: Date.now() - 7000000,
  },
  b_2: {
    id: "b_2",
    gameId: "game_101",
    phone: "9988776655",
    amount: 500,
    status: "approved",
    createdAt: Date.now() - 6500000,
  },
  b_3: {
    id: "b_3",
    gameId: "game_101",
    phone: "9112233445",
    amount: 500,
    status: "approved",
    createdAt: Date.now() - 6000000,
  },
  b_4: {
    id: "b_4",
    gameId: "game_101",
    phone: "9554433221",
    amount: 500,
    status: "approved",
    createdAt: Date.now() - 5500000,
  },
  b_5: {
    id: "b_5",
    gameId: "game_101",
    phone: "9988776655",
    amount: 500,
    status: "pending", // pending re-buy approval for host
    createdAt: Date.now() - 1200000,
  },
};

export const INITIAL_HAND_NOTES: Record<string, HandNote> = {
  hand_1: {
    id: "hand_1",
    date: "2026-07-24",
    title: "Double up with Nuts Flush vs Set",
    heroHand: "A♠ K♠",
    board: "10♠ 7♠ 2♦ 4♠ J♣",
    position: "BTN",
    stakes: "1/2 NLH",
    potSize: 780,
    result: "win",
    amountWonLost: 390,
    notes: "3-bet preflop from BTN vs UTG open. Flop gave nut flush draw, turned third spade. Villain jammed river with 77 for set.",
    createdAt: Date.now() - 86400000,
  },
  hand_2: {
    id: "hand_2",
    date: "2026-07-20",
    title: "Cooler Set over Set",
    heroHand: "J♥ J♦",
    board: "J♠ 8♣ 4♦ K♠ 2♥",
    position: "CO",
    stakes: "1/2 NLH",
    potSize: 520,
    result: "win",
    amountWonLost: 260,
    notes: "Raised preflop, villain flatted in BB. Flop set top set, villain check-called all 3 streets with 88.",
    createdAt: Date.now() - 300000000,
  },
};

export const INITIAL_BANKROLL_GOAL: BankrollGoal = {
  targetAmount: 5000,
  targetStakes: "2/5 NLH High Stakes",
};

export function getInitialAppState(): AppState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.users && parsed.games) {
        return {
          ...parsed,
          handNotes: parsed.handNotes || INITIAL_HAND_NOTES,
          bankrollGoal: parsed.bankrollGoal || INITIAL_BANKROLL_GOAL,
        };
      }
    } catch (e) {
      console.error("Failed to parse saved state", e);
    }
  }

  return {
    currentUser: INITIAL_USERS["9876543210"], // Default logged in as Host
    users: INITIAL_USERS,
    games: INITIAL_GAMES,
    invites: INITIAL_INVITES,
    buyins: INITIAL_BUYINS,
    handNotes: INITIAL_HAND_NOTES,
    bankrollGoal: INITIAL_BANKROLL_GOAL,
    activeTab: "games",
  };
}

export function saveAppState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error saving app state", e);
  }
}

// Pairwise debt simplification helper
export function calculateSettlements(results: Record<string, { net: number }>, users: Record<string, User>): SettlementDebt[] {
  const creditors: { phone: string; name: string; amount: number }[] = [];
  const debtors: { phone: string; name: string; amount: number }[] = [];

  Object.entries(results).forEach(([phone, r]) => {
    const name = users[phone]?.name || `Player ${phone.slice(-4)}`;
    if (r.net > 0) {
      creditors.push({ phone, name, amount: r.net });
    } else if (r.net < 0) {
      debtors.push({ phone, name, amount: Math.abs(r.net) });
    }
  });

  // Sort descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: SettlementDebt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transfer = Math.min(debtor.amount, creditor.amount);

    if (transfer > 0) {
      settlements.push({
        fromPhone: debtor.phone,
        fromName: debtor.name,
        toPhone: creditor.phone,
        toName: creditor.name,
        amount: Math.round(transfer),
      });
    }

    debtor.amount -= transfer;
    creditor.amount -= transfer;

    if (debtor.amount <= 0.01) i++;
    if (creditor.amount <= 0.01) j++;
  }

  return settlements;
}

export function initials(name: string): string {
  if (!name) return "P";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function colorForPhone(phone: string): string {
  const colors = ["#F3D375", "#60A5FA", "#34D399", "#F472B6", "#A78BFA", "#F97316"];
  let hash = 0;
  for (let i = 0; i < phone.length; i++) {
    hash = phone.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
