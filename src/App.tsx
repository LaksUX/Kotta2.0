import React, { useState, useEffect } from "react";
import { AppState, Game, Buyin, User } from "./types";
import { getInitialAppState, saveAppState } from "./lib/storage";

import { Header } from "./components/Header";
import { GamesDashboard } from "./components/GamesDashboard";
import { LiveGameModal } from "./components/LiveGameModal";
import { CreateGameModal } from "./components/CreateGameModal";
import { AuthModal } from "./components/AuthModal";

export default function App() {
  const [state, setState] = useState<AppState>(() => getInitialAppState());

  // Modal visibilities
  const [activeGameModal, setActiveGameModal] = useState<Game | null>(null);
  const [showCreateGame, setShowCreateGame] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

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

    setState((prev) => ({
      ...prev,
      games: { ...prev.games, [newGame.id]: newGame },
      buyins: { ...prev.buyins, [initialBuyinObj.id]: initialBuyinObj },
    }));

    setActiveGameModal(newGame);
  };

  // Handler: Approve buyin request
  const handleApproveBuyin = (buyinId: string) => {
    setState((prev) => {
      const target = prev.buyins[buyinId];
      if (!target) return prev;

      const updatedBuyin: Buyin = { ...target, status: "approved" };
      return {
        ...prev,
        buyins: { ...prev.buyins, [buyinId]: updatedBuyin },
      };
    });
  };

  // Handler: Reject buyin request
  const handleRejectBuyin = (buyinId: string) => {
    setState((prev) => {
      const target = prev.buyins[buyinId];
      if (!target) return prev;

      const updatedBuyin: Buyin = { ...target, status: "rejected" };
      return {
        ...prev,
        buyins: { ...prev.buyins, [buyinId]: updatedBuyin },
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

    setState((prev) => ({
      ...prev,
      buyins: { ...prev.buyins, [newBuyin.id]: newBuyin },
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

      return {
        ...prev,
        games: { ...prev.games, [gameId]: closedGame },
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

  return (
    <div className="min-h-screen bg-[#07090D] text-white font-sans antialiased selection:bg-amber-400 selection:text-black">
      <div className="max-w-md mx-auto min-h-screen bg-[#0B0D11] relative flex flex-col border-x border-white/[0.06] shadow-2xl">
        {/* Header Bar */}
        <Header
          state={state}
          onOpenCreateGame={() => setShowCreateGame(true)}
          onOpenAuth={() => setShowAuthModal(true)}
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

        {/* Auth / Switch User Modal */}
        {showAuthModal && (
          <AuthModal
            state={state}
            onClose={() => setShowAuthModal(false)}
            onSelectUser={handleSelectUser}
          />
        )}
      </div>
    </div>
  );
}
