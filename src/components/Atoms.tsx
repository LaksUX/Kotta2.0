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
        background: "rgba(13, 16, 21, 0.95)",
        backdropFilter: "blur(6px)",
        borderTop: "1px solid var(--hairline)",
        paddingBottom: 6,
        zIndex: 30
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
          padding: "8px 0",
          fontSize: 11,
          fontWeight: 600,
          color: active === "games" ? "var(--gold)" : "var(--muted)"
        }}
      >
        <HomeIcon size={20} />
        Home
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
          padding: "8px 0",
          fontSize: 11,
          fontWeight: 600,
          color: active === "profile" ? "var(--gold)" : "var(--muted)"
        }}
      >
        <UserCircle size={20} />
        Profile
      </button>
    </div>
  );
}
