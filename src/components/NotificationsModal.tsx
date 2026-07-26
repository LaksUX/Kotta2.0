import React from "react";
import { AppState, AppNotification } from "../types";
import {
  X,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Award,
  Check,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface NotificationsModalProps {
  state: AppState;
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onApproveBuyin: (buyinId: string) => void;
  onRejectBuyin: (buyinId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  state,
  onClose,
  onMarkAllRead,
  onClearAll,
  onApproveBuyin,
  onRejectBuyin,
}) => {
  const notifications = state.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (ts: number) => {
    const diffMin = Math.floor((Date.now() - ts) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "buyin_request":
        return <Clock size={16} className="text-amber-400" />;
      case "buyin_approved":
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case "buyin_rejected":
        return <XCircle size={16} className="text-red-400" />;
      case "game_closed":
        return <Award size={16} className="text-amber-300" />;
      case "invite":
        return <MessageSquare size={16} className="text-emerald-400" />;
      case "achievement":
        return <Sparkles size={16} className="text-amber-400" />;
      default:
        return <Bell size={16} className="text-amber-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell size={20} className="text-amber-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Notifications</h2>
              <p className="text-[11px] text-[#8E95A5]">
                {unreadCount > 0 ? `${unreadCount} new alerts` : "All caught up"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded-lg"
              >
                <Check size={12} /> Read All
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-[#8E95A5] hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell size={32} className="mx-auto text-white/20" />
              <p className="text-xs text-[#8E95A5]">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isPendingBuyin =
                n.type === "buyin_request" && n.buyinId && state.buyins[n.buyinId]?.status === "pending";

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                    !n.read
                      ? "bg-[#181B24] border-amber-400/30 shadow-md"
                      : "bg-[#141720] border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-white/5 shrink-0 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          {n.title}
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          )}
                        </h4>
                        <p className="text-xs text-[#8E95A5] mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-white/40 font-mono mt-1 block">
                          {formatTime(n.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Buy-in Approval Action if Host */}
                  {isPendingBuyin && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          if (n.buyinId) onApproveBuyin(n.buyinId);
                        }}
                        className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-lg shadow-sm transition-all"
                      >
                        Approve Buy-in
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (n.buyinId) onRejectBuyin(n.buyinId);
                        }}
                        className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Clear All Footer */}
        {notifications.length > 0 && (
          <div className="pt-2 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClearAll}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-[#8E95A5] hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 size={14} /> Clear All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
