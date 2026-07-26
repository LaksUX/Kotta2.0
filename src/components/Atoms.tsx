/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home as HomeIcon, UserCircle, LucideIcon } from "lucide-react";
import { colorForPhone, initials } from "../lib/storage";

/* ---------------------------------------------------------------
   REUSABLE ATOMIC COMPONENTS
------------------------------------------------------------------*/

interface AvatarProps {
  phone: string;
  name: string;
  size?: number;
}

export function Avatar({ phone, name, size = 36 }: AvatarProps) {
  return (
    <div
      className="pn-avatar"
      style={{
        background: colorForPhone(phone),
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink)",
        borderRadius: "50%",
        userSelect: "none"
      }}
      title={`${name} (${phone})`}
    >
      {initials(name)}
    </div>
  );
}

interface RsvpBadgeProps {
  rsvp?: "yes" | "no" | "maybe" | "pending";
}

export function RsvpBadge({ rsvp }: RsvpBadgeProps) {
  if (!rsvp || rsvp === "pending") {
    return <span className="pn-badge pn-badge-pending">Pending</span>;
  }
  const map = {
    yes: ["Going", "pn-badge-yes"],
    no: ["Can't go", "pn-badge-no"],
    maybe: ["Maybe", "pn-badge-maybe"]
  };
  const [label, cls] = map[rsvp];
  return <span className={`pn-badge ${cls}`}>{label}</span>;
}

interface StatusBadgeProps {
  status: "draft" | "active" | "closed";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map = {
    draft: ["Draft", "pn-badge-draft"],
    active: ["Live", "pn-badge-active"],
    closed: ["Closed", "pn-badge-closed"]
  };
  const [label, cls] = map[status] || ["", ""];
  return <span className={`pn-badge ${cls}`}>{label}</span>;
}

interface ChipHeroProps {
  label: string;
  value: string | number;
}

export function ChipHero({ label, value }: ChipHeroProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="pn-chip-hero">
        <div className="pn-chip-hero-inner">
          <div className="pn-mono" style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Banks</div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  sub: string;
}

export function EmptyState({ icon: Icon, title, sub }: EmptyStateProps) {
  return (
    <div className="pn-empty" style={{ textAlign: "center", padding: "36px 20px" }}>
      <Icon size={28} style={{ opacity: 0.5, marginBottom: 10, margin: "0 auto var(--muted)" }} />
      <div style={{ fontWeight: 600, color: "var(--cream)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{sub}</div>
    </div>
  );
}

interface BottomNavProps {
  active: "games" | "profile";
  go: (tab: "games" | "profile") => void;
}

export function BottomNav({ active, go }: BottomNavProps) {
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        background: "rgba(12, 15, 22, 0.96)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(243, 237, 228, 0.1)",
        paddingTop: 8,
        paddingBottom: 8,
        zIndex: 30,
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)"
      }}
    >
      <button
        onClick={() => go("games")}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          userSelect: "none",
          WebkitTapHighlightColor: "transparent"
        }}
      >
        <div
          style={{
            width: 56,
            height: 30,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: active === "games" ? "linear-gradient(135deg, rgba(243, 211, 117, 0.25) 0%, rgba(212, 175, 55, 0.3) 100%)" : "transparent",
            border: active === "games" ? "1px solid rgba(212, 175, 55, 0.4)" : "1px solid transparent",
            transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)"
          }}
        >
          <HomeIcon
            size={20}
            strokeWidth={active === "games" ? 2.5 : 2}
            color={active === "games" ? "#F3D375" : "#94A3B8"}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: active === "games" ? 700 : 500,
            color: active === "games" ? "#F3D375" : "#94A3B8",
            letterSpacing: "0.02em"
          }}
        >
          Home
        </span>
      </button>

      <button
        onClick={() => go("profile")}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          userSelect: "none",
          WebkitTapHighlightColor: "transparent"
        }}
      >
        <div
          style={{
            width: 56,
            height: 30,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: active === "profile" ? "linear-gradient(135deg, rgba(243, 211, 117, 0.25) 0%, rgba(212, 175, 55, 0.3) 100%)" : "transparent",
            border: active === "profile" ? "1px solid rgba(212, 175, 55, 0.4)" : "1px solid transparent",
            transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)"
          }}
        >
          <UserCircle
            size={20}
            strokeWidth={active === "profile" ? 2.5 : 2}
            color={active === "profile" ? "#F3D375" : "#94A3B8"}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: active === "profile" ? 700 : 500,
            color: active === "profile" ? "#F3D375" : "#94A3B8",
            letterSpacing: "0.02em"
          }}
        >
          Profile
        </span>
      </button>
    </div>
  );
}
