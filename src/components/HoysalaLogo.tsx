/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface HoysalaLogoProps {
  size?: number;
  variant?: "gold-on-dark" | "gold-only" | "monochrome";
}

/**
 * HoysalaLogo Component
 * 
 * DESIGN INSPIRATION: Hoysala Dynasty Art & Temple Architecture (Belur & Halebidu, Karnataka, India)
 * 1. Stellate Temple Plan: The multi-pointed outer star pattern is mathematically modeled after the stellar 
 *    (stellate) plan of Hoysala temple platforms (Jagati). This creates a striking resemblance to a luxury poker chip.
 * 2. Royal Crest (Sala and the Tiger): The central crest features a stylized, modern geometric line-art of Yali 
 *    (the mythical rearing lion/tiger creature that is the legendary emblem of the Hoysalas).
 * 3. Soapstone & Intricate Friezes: Layered gold rings, beaded bands, and radial dots mirror the deep, 
 *    highly ornate stone carvings and scroll friezes characteristic of Hoysala soapstone art.
 */
export default function HoysalaLogo({ size = 80, variant = "gold-on-dark" }: HoysalaLogoProps) {
  // Generate outer 16-pointed stellate star (Jagati base platform plan)
  const points16: string[] = [];
  for (let i = 0; i < 32; i++) {
    const angle = (i * Math.PI) / 16;
    // Outer spikes and soft inner valleys
    const r = i % 2 === 0 ? 47 : 40;
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    points16.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  const starPath = points16.join(" ");

  // Generate middle 16-pointed stellate star
  const pointsMiddle: string[] = [];
  for (let i = 0; i < 32; i++) {
    const angle = (i * Math.PI) / 16;
    const r = i % 2 === 0 ? 38 : 34;
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    pointsMiddle.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  const middleStarPath = pointsMiddle.join(" ");

  // Generate inner bead points
  const beads: { x: number; y: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    const r = 31;
    beads.push({
      x: 50 + r * Math.cos(angle),
      y: 50 + r * Math.sin(angle),
    });
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        {/* Rich Metallic Hoysala Gold Gradient */}
        <linearGradient id="hoysala-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF3B0" />
          <stop offset="30%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#AA7C11" />
          <stop offset="100%" stopColor="#F3D375" />
        </linearGradient>

        {/* Deep Soapstone Dark Slate Background Gradient */}
        <linearGradient id="hoysala-soapstone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B2433" />
          <stop offset="50%" stopColor="#111622" />
          <stop offset="100%" stopColor="#080B11" />
        </linearGradient>

        {/* Soft Shadow Filter for Premium Depth */}
        <filter id="hoysala-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#D4AF37" floodOpacity="0.15" />
        </filter>
      </defs>

      {variant === "gold-on-dark" && (
        <>
          {/* Subtle Outer Glow Aura */}
          <circle cx="50" cy="50" r="48" fill="#D4AF37" fillOpacity="0.03" />

          {/* Stellate Base Platform Shadow (Jagati) */}
          <polygon
            points={starPath}
            fill="url(#hoysala-soapstone)"
            stroke="url(#hoysala-gold)"
            strokeWidth="1.2"
            filter="url(#hoysala-glow)"
          />
        </>
      )}

      {variant === "gold-only" && (
        <polygon
          points={starPath}
          stroke="url(#hoysala-gold)"
          strokeWidth="2.5"
          fill="none"
        />
      )}

      {variant === "monochrome" && (
        <polygon
          points={starPath}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      )}

      {/* Interlocking Intricate Middle Star */}
      <polygon
        points={middleStarPath}
        stroke="url(#hoysala-gold)"
        strokeWidth="0.8"
        strokeDasharray="3 1.5"
        fill="none"
        opacity="0.85"
      />

      {/* Decorative Beaded Ring (Siri) */}
      <circle
        cx="50"
        cy="50"
        r="27"
        stroke="url(#hoysala-gold)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Temple Frieze Beads (Simha circles) */}
      {beads.map((b, idx) => (
        <circle
          key={idx}
          cx={b.x}
          cy={b.y}
          r="1.2"
          fill="url(#hoysala-gold)"
        />
      ))}

      {/* Central Sanctuary Medallion */}
      <circle
        cx="50"
        cy="50"
        r="21"
        fill="url(#hoysala-soapstone)"
        stroke="url(#hoysala-gold)"
        strokeWidth="1.5"
      />

      {/* Stylized Hoysala Royal Crest: Sala Fighting the Tiger/Lion (Yali) */}
      <g transform="translate(36, 34) scale(0.28)">
        {/* Rearing Yali/Lion body */}
        <path
          d="M34 16C37 13 42 13 45 16C47 18 47 22 44 24C42 25 39 24 37 26C35 28 35 32 37 34C39 36 43 36 45 39C47 42 45 46 41 47C36 48 31 46 29 42L25 36"
          stroke="url(#hoysala-gold)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Tail loop (Traditional Hoysala arabesque tail) */}
        <path
          d="M25 36C21 38 16 38 12 34C8 30 8 22 12 18C15 15 19 15 22 18C25 21 24 26 21 28C18 30 14 29 12 31C10 33 11 37 13 39"
          stroke="url(#hoysala-gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 1"
        />
        {/* Slaying Spear/Sword of Sala */}
        <path
          d="M8 48L24 33M24 33L21 28M24 33L29 35"
          stroke="url(#hoysala-gold)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Slaying warrior arm */}
        <path
          d="M4 52C6 48 10 46 13 49C16 52 13 56 9 56"
          stroke="url(#hoysala-gold)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Majestic Mane Scrolls */}
        <path
          d="M39 19C41 19 43 17 42 15C41 13 38 14 38 16M42 23C44 23 46 21 45 19C44 17 41 18 41 20M35 25C37 25 38 23 37 21C36 19 33 20 34 22"
          stroke="url(#hoysala-gold)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Ground pedestal arch representing temple base */}
        <path
          d="M2 58H50"
          stroke="url(#hoysala-gold)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Mini Central Jewel */}
      <circle
        cx="50"
        cy="50"
        r="2"
        fill="url(#hoysala-gold)"
      />
    </svg>
  );
}
