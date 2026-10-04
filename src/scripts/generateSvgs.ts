import fs from "fs";
import path from "path";

const categories = [
  { slug: "one-sound-crackers", name: "One Sound Crackers", icon: "💥", colorFrom: "#FF2E93", colorTo: "#FF7A18" },
  { slug: "sparklers", name: "Sparklers", icon: "✨", colorFrom: "#FFC83D", colorTo: "#FF7A18" },
  { slug: "flower-pots", name: "Flower Pots", icon: "🌸", colorFrom: "#22D3EE", colorTo: "#3B82F6" },
  { slug: "ground-spinners", name: "Ground Spinners", icon: "🌀", colorFrom: "#A3E635", colorTo: "#10B981" },
  { slug: "fountains", name: "Fountains", icon: "⛲", colorFrom: "#EC4899", colorTo: "#8B5CF6" },
  { slug: "rockets", name: "Rockets", icon: "🚀", colorFrom: "#F97316", colorTo: "#EF4444" },
  { slug: "multi-shot-and-night-shots", name: "Multi-shot & Night Shots", icon: "🎆", colorFrom: "#8B5CF6", colorTo: "#3B82F6" },
  { slug: "fancy-and-novelty", name: "Fancy & Novelty", icon: "🦚", colorFrom: "#06B6D4", colorTo: "#A855F7" },
  { slug: "twinkling-star-and-pencil", name: "Twinkling Star & Pencil", icon: "⭐", colorFrom: "#FBBF24", colorTo: "#F43F5E" },
  { slug: "garlands", name: "Garlands", icon: "🧨", colorFrom: "#EF4444", colorTo: "#B91C1C" },
  { slug: "gift-boxes", name: "Gift Boxes", icon: "🎁", colorFrom: "#6366F1", colorTo: "#EC4899" },
  { slug: "kids-special", name: "Kids Special", icon: "🌟", colorFrom: "#10B981", colorTo: "#06B6D4" },
];

const targetDir = path.resolve(process.cwd(), "public/placeholders");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

for (const cat of categories) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="grad-${cat.slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${cat.colorFrom}" stop-opacity="1" />
      <stop offset="100%" stop-color="${cat.colorTo}" stop-opacity="1" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background Card -->
  <rect width="400" height="400" rx="24" fill="#0A061E" />
  
  <!-- Gradient Glow Circle -->
  <circle cx="200" cy="180" r="140" fill="url(#grad-${cat.slug})" opacity="0.18" />
  <circle cx="200" cy="180" r="110" fill="url(#glow)" />

  <!-- Center Decorative Emblem -->
  <rect x="90" y="70" width="220" height="220" rx="36" fill="url(#grad-${cat.slug})" filter="url(#shadow)" opacity="0.9" />
  
  <!-- Decorative Sparkles -->
  <g fill="#FFF" opacity="0.9">
    <polygon points="200,85 204,100 219,104 204,108 200,123 196,108 181,104 196,100" />
    <polygon points="120,220 123,230 133,233 123,236 120,246 117,236 107,233 117,230" opacity="0.7" />
    <polygon points="280,210 283,220 293,223 283,226 280,236 277,226 267,223 277,220" opacity="0.7" />
  </g>

  <!-- Emoji / Icon Representation -->
  <text x="200" y="200" font-size="76" text-anchor="middle" dominant-baseline="middle">${cat.icon}</text>

  <!-- Category Title -->
  <text x="200" y="335" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#F6F3FF" text-anchor="middle" letter-spacing="0.5">${cat.name}</text>
  
  <!-- Sivakasi Verified Pill -->
  <rect x="135" y="352" width="130" height="24" rx="12" fill="rgba(255, 255, 255, 0.12)" />
  <text x="200" y="368" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="${cat.colorFrom}" text-anchor="middle" letter-spacing="1">AUTHENTIC SIVAKASI</text>
</svg>`;

  fs.writeFileSync(path.join(targetDir, `${cat.slug}.svg`), svg, "utf-8");
}

console.log("✅ 12 Category SVG placeholders generated successfully in public/placeholders/");
