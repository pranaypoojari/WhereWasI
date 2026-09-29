export const PLATFORMS = [
  "All",
  "Prime Video",
  "Netflix",
  "Hotstar / JioCinema",
  "SonyLIV",
  "Crunchyroll"
];

export const GENRES = [
  "All",
  "Crime",
  "Thriller",
  "Drama",
  "Comedy",
  "Action",
  "Slice of Life",
  "Sci-Fi",
  "Anime"
];

export const STATUS_COLORS = {
  alive: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500",
    icon: "🟢",
    label: "ALIVE"
  },
  dead: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    badge: "bg-rose-500",
    icon: "☠️",
    label: "DEAD"
  },
  injured: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    badge: "bg-amber-500",
    icon: "🩹",
    label: "INJURED"
  },
  missing: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    badge: "bg-purple-500",
    icon: "❓",
    label: "MISSING"
  },
  betrayed: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    badge: "bg-blue-500",
    icon: "🗡️",
    label: "BETRAYED"
  }
};

export const RELATIONSHIP_COLORS = {
  ally: { stroke: "#10b981", label: "Allies", glow: "rgba(16, 185, 129, 0.4)" },
  enemy: { stroke: "#f43f5e", label: "Enemies", glow: "rgba(244, 63, 94, 0.4)" },
  family: { stroke: "#f59e0b", label: "Family", glow: "rgba(245, 158, 11, 0.4)" },
  romantic: { stroke: "#ec4899", label: "Romantic", glow: "rgba(236, 72, 153, 0.4)" },
  betrayed: { stroke: "#6366f1", label: "Betrayed", glow: "rgba(99, 102, 241, 0.4)" }
};
