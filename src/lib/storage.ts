import { AppState, Game, User, Buyin, Invite, SettlementDebt, HandNote, BankrollGoal } from "../types";

const STORAGE_KEY = "poker_host_app_v4_clean_state";

export const INITIAL_USERS: Record<string, User> = {
  "9876543210": {
    phone: "9876543210",
    name: "Lakshmesh (Host)",
    pinHash: "1234",
    avatarColor: "#F3D375",
  },
};

export const INITIAL_GAMES: Record<string, Game> = {};

export const INITIAL_INVITES: Record<string, Invite> = {};

export const INITIAL_BUYINS: Record<string, Buyin> = {};

export const INITIAL_HAND_NOTES: Record<string, HandNote> = {};

export const INITIAL_BANKROLL_GOAL: BankrollGoal = {
  targetAmount: 5000,
  targetStakes: "2/5 NLH High Stakes",
};

export const INITIAL_NOTIFICATIONS = [];

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
          notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
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
    notifications: INITIAL_NOTIFICATIONS,
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
