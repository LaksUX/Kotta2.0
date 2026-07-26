import React from "react";
import { AppState } from "../types";
import { Spade, Receipt, BarChart3, BookOpen, Users } from "lucide-react";

interface BottomNavProps {
  activeTab: AppState["activeTab"];
  onSelectTab: (tab: AppState["activeTab"]) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    { id: "games" as const, label: "Tables", icon: Spade },
    { id: "ledger" as const, label: "Ledger", icon: Receipt },
    { id: "analytics" as const, label: "Fitness Stats", icon: BarChart3 },
    { id: "hands" as const, label: "Hand Vault", icon: BookOpen },
    { id: "players" as const, label: "Players & Goal", icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0D11]/95 backdrop-blur-lg border-t border-white/[0.08] py-2 px-3 max-w-md mx-auto">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
                isActive
                  ? "text-amber-300 font-extrabold"
                  : "text-[#8E95A5] hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute -top-2 w-7 h-1 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50 animate-in fade-in zoom-in" />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[9px] tracking-tight uppercase mt-1 font-mono truncate w-full text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
