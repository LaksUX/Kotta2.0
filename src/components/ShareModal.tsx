import React, { useState } from "react";
import { Game } from "../types";
import { X, MessageSquare, Copy, Check, ExternalLink, Share2, Globe, Phone } from "lucide-react";
import { formatGameInviteText, getWhatsAppUrls, copyToClipboard } from "../lib/share";

interface ShareModalProps {
  game: Partial<Game>;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ game, onClose }) => {
  const [copied, setCopied] = useState(false);
  const inviteText = formatGameInviteText(game);
  const urls = getWhatsAppUrls(inviteText);

  const handleCopy = async () => {
    const ok = await copyToClipboard(inviteText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invite: ${game.title || "Poker Night"}`,
          text: inviteText,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Native share failed:", err);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
      <div className="bg-[#12151D] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Share2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Share Game Invite</h2>
              <p className="text-[11px] text-[#8E95A5]">Send to WhatsApp or copy link</p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8E95A5] hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Invite Preview Card */}
        <div className="bg-[#181B24] border border-white/10 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-300 font-mono whitespace-pre-line relative">
          <span className="text-[10px] font-sans font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Message Preview
          </span>
          {inviteText}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Primary WhatsApp Direct Link Button (Uses native <a> tag to guarantee no popup blocking) */}
          <a
            href={urls.waMe}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
          >
            <MessageSquare size={18} fill="currentColor" />
            <span>Open in WhatsApp App</span>
            <ExternalLink size={14} className="opacity-80 ml-auto" />
          </a>

          {/* WhatsApp Web Link (For Desktop Users) */}
          <a
            href={urls.web}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-[#181B24] hover:bg-white/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Globe size={16} />
            <span>Open in WhatsApp Web</span>
            <ExternalLink size={14} className="opacity-80 ml-auto" />
          </a>

          {/* Native Share Sheet (If supported on mobile) */}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-3 px-4 bg-[#181B24] hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Share2 size={16} />
              <span>Use System Share Menu</span>
            </button>
          )}

          {/* Copy Invite Text */}
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              copied
                ? "bg-amber-400/20 border-amber-400 text-amber-300"
                : "bg-[#181B24] hover:bg-white/10 border border-white/10 text-white"
            }`}
          >
            {copied ? (
              <>
                <Check size={16} className="text-amber-300" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Invite Text & Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
