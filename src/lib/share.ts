import { Game } from "../types";

export function formatGameInviteText(game: {
  title?: string;
  date?: string;
  time?: string;
  venue?: string;
  initialBuyin?: number;
  ratio?: string;
  hostName?: string;
  id?: string;
}): string {
  const origin = window.location.origin;
  const gameLink = game.id ? `${origin}?gameId=${game.id}` : origin;

  return `♠ HOST POKER GAME INVITE ♠

📌 Table: ${game.title || "Poker Night"}
📅 Date: ${game.date || "Today"}${game.time ? ` at ${game.time}` : ""}
📍 Venue: ${game.venue || "Private Lounge"}
🎟 Buy-in: ${game.initialBuyin || 1} Bank (${(game.initialBuyin || 1) * 10}k Chips)
⚡ Ratio: ${game.ratio || "1:1"}
👑 Host: ${game.hostName || "Host"}

🔗 Join Table Link:
${gameLink}`;
}

export function getWhatsAppUrls(text: string) {
  const encoded = encodeURIComponent(text);
  return {
    waMe: `https://wa.me/?text=${encoded}`,
    api: `https://api.whatsapp.com/send?text=${encoded}`,
    web: `https://web.whatsapp.com/send?text=${encoded}`,
  };
}

export async function shareGameInvite(game: {
  title?: string;
  date?: string;
  time?: string;
  venue?: string;
  initialBuyin?: number;
  ratio?: string;
  hostName?: string;
  id?: string;
}): Promise<{ success: boolean; method: string }> {
  const text = formatGameInviteText(game);
  const urls = getWhatsAppUrls(text);

  // 1. Try Web Share API (native mobile OS share sheet)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Invite: ${game.title || "Poker Game"}`,
        text: text,
      });
      return { success: true, method: "native_share" };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { success: false, method: "cancelled" };
      }
    }
  }

  // 2. Open wa.me link directly
  const win = window.open(urls.waMe, "_blank", "noopener,noreferrer");
  
  if (!win || win.closed || typeof win.closed === "undefined") {
    // Fallback to location.href if popup blocked
    window.location.href = urls.waMe;
    return { success: true, method: "direct_location" };
  }

  return { success: true, method: "whatsapp_web" };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers / iframe contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}
