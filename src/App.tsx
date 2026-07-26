import React, { useState, useEffect } from "react";
import { AppState, Game, Buyin, User, AppNotification } from "./types";
import { getInitialAppState, saveAppState } from "./lib/storage";

import { Header } from "./components/Header";
import { GamesDashboard } from "./components/GamesDashboard";
import { LiveGameModal } from "./components/LiveGameModal";
import { CreateGameModal } from "./components/CreateGameModal";
import { AuthModal } from "./components/AuthModal";
import { NotificationsModal } from "./components/NotificationsModal";

export default function App() {
  const [state, setState] = useState<AppState>(() => getInitialAppState());

  // Modal visibilities
  const [activeGameModal, setActiveGameModal] = useState<Game | null>(null);
  const [showCreateGame, setShowCreateGame] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  // Handle URL share links (e.g. ?gameId=game_101)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("gameId");
    if (gameId && state.games[gameId]) {
      setActiveGameModal(state.games[gameId]);
    }
  }, []);

  // Handler: Switch user profile
  const handleSelectUser = (user: User) => {
    setState((prev) => ({
      ...prev,
      currentUser: user,
      users: { ...prev.users, [user.phone]: user },
    }));
  };

  // Handler: Register new user
  const handleRegisterUser = (newUser: User) => {
    setState((prev) => ({
      ...prev,
      users: { ...prev.users, [newUser.phone]: newUser },
    }));
  };

  // Handler: Logout user
  const handleLogoutUser = () => {
    setState((prev) => ({
      ...prev,
      currentUser: null,
    }));
    setShowAuthModal(false);
  };

  // Handler: Create & host game
  const handleCreateGame = (newGame: Game) => {
    const initialBuyinObj: Buyin = {
      id: `b_host_${Date.now()}`,
      gameId: newGame.id,
      phone: newGame.hostPhone,
      amount: newGame.initialBuyin,
      status: "approved",
      createdAt: Date.now(),
    };

    const hostNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: "♠ Table Created",
      message: `You successfully hosted ${newGame.title} at ${newGame.venue}.`,
      timestamp: Date.now(),
      read: false,
      type: "invite",
      gameId: newGame.id,
    };

    setState((prev) => ({
      ...prev,
      games: { ...prev.games, [newGame.id]: newGame },
      buyins: { ...prev.buyins, [initialBuyinObj.id]: initialBuyinObj },
      notifications: [hostNotif, ...(prev.notifications || [])],
    }));

    setActiveGameModal(newGame);
  };

  // Handler: Approve buyin request
  const handleApproveBuyin = (buyinId: string) => {
    setState((prev) => {
      const target = prev.buyins[buyinId];
      if (!target) return prev;

      const updatedBuyin: Buyin = { ...target, status: "approved" };
      const player = prev.users[target.phone];
      const playerName = player ? player.name : `Player ${target.phone.slice(-4)}`;

      const approvedNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        title: "Buy-in Approved",
        message: `${playerName}'s buy-in of ${target.amount} Bank (${target.amount * 10}k chips) was approved.`,
        timestamp: Date.now(),
        read: false,
        type: "buyin_approved",
        gameId: target.gameId,
        buyinId,
      };

      // Mark request notification read
      const updatedNotifs = (prev.notifications || []).map((n) =>
        n.buyinId === buyinId ? { ...n, read: true } : n
      );

      return {
        ...prev,
        buyins: { ...prev.buyins, [buyinId]: updatedBuyin },
        notifications: [approvedNotif, ...updatedNotifs],
      };
    });
  };

  // Handler: Reject buyin request
  const handleRejectBuyin = (buyinId: string) => {
    setState((prev) => {
      const target = prev.buyins[buyinId];
      if (!target) return prev;

      const updatedBuyin: Buyin = { ...target, status: "rejected" };

      const rejectedNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        title: "Buy-in Rejected",
        message: `Buy-in request for ${target.amount} Bank was rejected by host.`,
        timestamp: Date.now(),
        read: false,
        type: "buyin_rejected",
        gameId: target.gameId,
        buyinId,
      };

      const updatedNotifs = (prev.notifications || []).map((n) =>
        n.buyinId === buyinId ? { ...n, read: true } : n
      );

      return {
        ...prev,
        buyins: { ...prev.buyins, [buyinId]: updatedBuyin },
        notifications: [rejectedNotif, ...updatedNotifs],
      };
    });
  };

  // Handler: Request buyin / re-buy
  const handleRequestBuyin = (gameId: string, amount: number) => {
    if (!state.currentUser?.phone) return;

    const newBuyin: Buyin = {
      id: `b_${Date.now()}`,
      gameId,
      phone: state.currentUser.phone,
      amount,
      status: "pending",
      createdAt: Date.now(),
    };

    const game = state.games[gameId];
    const buyinNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: "Buy-in Approval Request",
      message: `${state.currentUser.name} requested ${amount} Bank (${amount * 10}k chips) buy-in for ${game?.title || "table"}.`,
      timestamp: Date.now(),
      read: false,
      type: "buyin_request",
      gameId,
      buyinId: newBuyin.id,
      targetPhone: game?.hostPhone,
    };

    setState((prev) => ({
      ...prev,
      buyins: { ...prev.buyins, [newBuyin.id]: newBuyin },
      notifications: [buyinNotif, ...(prev.notifications || [])],
    }));
  };

  // Handler: Update player live cashout
  const handleUpdateCashout = (gameId: string, phone: string, amount: number) => {
    setState((prev) => {
      const game = prev.games[gameId];
      if (!game) return prev;

      const updatedCashouts = {
        ...(game.liveCashouts || {}),
        [phone]: amount,
      };

      const updatedGame: Game = {
        ...game,
        liveCashouts: updatedCashouts,
      };

      if (activeGameModal?.id === gameId) {
        setActiveGameModal(updatedGame);
      }

      return {
        ...prev,
        games: { ...prev.games, [gameId]: updatedGame },
      };
    });
  };

  // Handler: Confirm close & save game to Game Data
  const handleConfirmCloseGame = (gameId: string) => {
    setState((prev) => {
      const game = prev.games[gameId];
      if (!game) return prev;

      const approvedBuyins = (Object.values(prev.buyins) as Buyin[]).filter(
        (b) => b.gameId === gameId && b.status === "approved"
      );
      const playerPhones = Array.from(
        new Set([
          ...approvedBuyins.map((b) => b.phone),
          ...Object.keys(game.liveCashouts || {}),
        ])
      );

      const results: Record<
        string,
        { cashout: number; buyin: number; net: number; totalBuyins: number }
      > = {};

      let totalBuyinSum = 0;
      let cashoutSum = 0;

      playerPhones.forEach((phone) => {
        const totalBuyin = approvedBuyins
          .filter((b) => b.phone === phone)
          .reduce((sum, b) => sum + b.amount, 0);
        const cashout = game.liveCashouts?.[phone] ?? 0;
        totalBuyinSum += totalBuyin;
        cashoutSum += cashout;

        results[phone] = {
          cashout,
          buyin: totalBuyin,
          net: cashout - totalBuyin,
          totalBuyins: totalBuyin,
        };
      });

      const closedGame: Game = {
        ...game,
        status: "closed",
        closedAt: Date.now(),
        results,
        rakeInfo: {
          totalBuyins: totalBuyinSum,
          actualCashoutSum: cashoutSum,
          expectedPool: totalBuyinSum,
          variance: totalBuyinSum - cashoutSum,
          effectiveRake: 0,
        },
      };

      const myResult = prev.currentUser?.phone ? results[prev.currentUser.phone] : null;
      const gameClosedNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        title: "🏆 Game Finalized & Closed",
        message: `${game.title} has ended. Total Pool: ${totalBuyinSum} Banks.${
          myResult
            ? ` Your Net: ${myResult.net >= 0 ? `+${myResult.net}` : myResult.net} Banks.`
            : ""
        }`,
        timestamp: Date.now(),
        read: false,
        type: "game_closed",
        gameId,
      };

      return {
        ...prev,
        games: { ...prev.games, [gameId]: closedGame },
        notifications: [gameClosedNotif, ...(prev.notifications || [])],
      };
    });

    setActiveGameModal(null);
  };

  // Handler: Add new player contact
  const handleAddPlayer = (name: string, phone: string) => {
    const newUser: User = {
      phone,
      name,
      pinHash: "1234",
      avatarColor: "#F3D375",
    };

    setState((prev) => ({
      ...prev,
      users: { ...prev.users, [phone]: newUser },
    }));
  };

  // Notification actions
  const handleMarkAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({ ...n, read: true })),
    }));
  };

  const handleClearAllNotifications = () => {
    setState((prev) => ({
      ...prev,
      notifications: [],
    }));
  };

  return (
    <div className="min-h-screen bg-[#07090D] text-white font-sans antialiased selection:bg-amber-400 selection:text-black">
      <div className="max-w-md mx-auto min-h-screen bg-[#0B0D11] relative flex flex-col border-x border-white/[0.06] shadow-2xl">
        {/* Header Bar */}
        <Header
          state={state}
          onOpenCreateGame={() => setShowCreateGame(true)}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenNotifications={() => setShowNotificationsModal(true)}
        />

        {/* Combined Unified View (Live Tables + Fitness Log & Graphs) */}
        <main className="flex-1 overflow-y-auto">
          <GamesDashboard
            state={state}
            onOpenGameDetails={(game) => setActiveGameModal(game)}
            onOpenCreateGame={() => setShowCreateGame(true)}
          />
        </main>

        {/* Live Game Table Management Modal */}
        {activeGameModal && (
          <LiveGameModal
            game={state.games[activeGameModal.id] || activeGameModal}
            state={state}
            onClose={() => setActiveGameModal(null)}
            onApproveBuyin={handleApproveBuyin}
            onRejectBuyin={handleRejectBuyin}
            onRequestBuyin={handleRequestBuyin}
            onUpdateCashout={handleUpdateCashout}
            onEndGame={handleConfirmCloseGame}
          />
        )}

        {/* Host New Game Modal with Integrated Roster & Contact Creation */}
        {showCreateGame && (
          <CreateGameModal
            state={state}
            onClose={() => setShowCreateGame(false)}
            onCreateGame={handleCreateGame}
            onAddPlayer={handleAddPlayer}
          />
        )}

        {/* Auth / Account Management Modal */}
        {showAuthModal && (
          <AuthModal
            state={state}
            onClose={() => setShowAuthModal(false)}
            onSelectUser={handleSelectUser}
            onRegisterUser={handleRegisterUser}
            onLogout={handleLogoutUser}
          />
        )}

        {/* Notifications Drawer Modal */}
        {showNotificationsModal && (
          <NotificationsModal
            state={state}
            onClose={() => setShowNotificationsModal(false)}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onClearAll={handleClearAllNotifications}
            onApproveBuyin={handleApproveBuyin}
            onRejectBuyin={handleRejectBuyin}
          />
        )}
      </div>
    </div>
  );
}
