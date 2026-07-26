import React, { useState } from "react";
import { AppState, User } from "../types";
import { Users, Phone, Plus, Search, Check, MessageSquare } from "lucide-react";
import { colorForPhone, initials } from "../lib/storage";

interface PlayersViewProps {
  state: AppState;
  onAddPlayer: (name: string, phone: string) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  state,
  onAddPlayer,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const playersList = (Object.values(state.users) as User[]).filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      onAddPlayer(name.trim(), phone.trim());
      setName("");
      setPhone("");
    }
  };

  const handleWhatsAppInvite = (pName: string) => {
    const text = `Hey ${pName}! Join our private poker table tracker on Poker Host Engine: ${window.location.origin}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="p-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-3.5 text-[#656C7C]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search host players by name or phone..."
          className="w-full bg-[#181B24] border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-[#656C7C] focus:border-amber-400 focus:outline-none shadow-md"
        />
      </div>

      {/* Add New Player Contact Card */}
      <form onSubmit={handleAdd} className="bg-[#181B24] border border-white/10 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
          <span>Add Player Contact for Host Setup</span>
          <span className="text-[10px] text-amber-300 font-mono">Host Only</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#0B0D11] border border-white/15 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
          <input
            type="tel"
            required
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-[#0B0D11] border border-white/15 rounded-xl p-2.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
        >
          <Plus size={16} /> Save Player Contact
        </button>
      </form>

      {/* Players Directory List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#8E95A5] uppercase tracking-wider px-1">
          Host Player Roster ({playersList.length})
        </h3>

        <div className="space-y-2">
          {playersList.map((user) => {
            const avatarBg = colorForPhone(user.phone);

            return (
              <div
                key={user.phone}
                className="bg-[#181B24] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full text-black font-extrabold text-xs flex items-center justify-center font-mono shadow-md"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {initials(user.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{user.name}</h4>
                    <span className="text-xs text-[#8E95A5] font-mono flex items-center gap-1">
                      <Phone size={11} /> {user.phone}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleWhatsAppInvite(user.name)}
                  className="px-2.5 py-1.5 bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-400 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <MessageSquare size={14} />
                  <span>WhatsApp</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
