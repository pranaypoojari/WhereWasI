'use client';
import { useState, useMemo, useEffect } from 'react';
import SpotlightCard from './reactbits/SpotlightCard';
import { RELATIONSHIP_COLORS, STATUS_COLORS } from '@/lib/constants';
import { formatEpisodeCode } from '@/lib/storyBookUtils';
import { GitFork, X, BookUser } from 'lucide-react';

const VIEW_W = 700;
const VIEW_H = 500;

function truncate(text = '', max = 18) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function shortName(name = '') {
  return name.split(' ')[0];
}

export default function RelationshipWeb({
  characters = [],
  relationships = [],
  season,
  episode
}) {
  const [pinnedId, setPinnedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Drop focus if the pinned character disappears (e.g. scrubbed back before their introduction).
  useEffect(() => {
    if (pinnedId && !characters.some((c) => c.id === pinnedId)) setPinnedId(null);
  }, [characters, pinnedId]);

  // Layout node positions in an elliptical/orbital arena
  const nodes = useMemo(() => {
    const total = characters.length;
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    const rx = 260;
    const ry = 170;

    return characters.map((c, i) => {
      const angle = (i / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
      return {
        ...c,
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle)
      };
    });
  }, [characters]);

  // Resolve by full name, first name and aliases (seed data uses first names, live data full names)
  const nodeLookup = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.name] = n;
      if (!map[shortName(n.name)]) map[shortName(n.name)] = n;
      (n.aliases || []).forEach((a) => {
        if (!map[a]) map[a] = n;
      });
    });
    return map;
  }, [nodes]);

  const edges = useMemo(() => {
    return relationships
      .map((rel, idx) => {
        const fromNode = nodeLookup[rel.from];
        const toNode = nodeLookup[rel.to];
        if (!fromNode || !toNode || fromNode.id === toNode.id) return null;
        const style = RELATIONSHIP_COLORS[rel.type] || RELATIONSHIP_COLORS.ally;
        return {
          id: `edge-${idx}`,
          from: fromNode,
          to: toNode,
          type: rel.type,
          typeLabel: style.label,
          label: rel.label || style.label,
          color: style.stroke
        };
      })
      .filter(Boolean);
  }, [relationships, nodeLookup]);

  const activeId = hoverId || pinnedId;
  const activeNode = nodes.find((n) => n.id === activeId) || null;

  const connectedIds = useMemo(() => {
    if (!activeId) return new Set();
    const ids = new Set([activeId]);
    edges.forEach((e) => {
      if (e.from.id === activeId) ids.add(e.to.id);
      if (e.to.id === activeId) ids.add(e.from.id);
    });
    return ids;
  }, [edges, activeId]);

  const activeEdges = activeNode
    ? edges.filter((e) => e.from.id === activeNode.id || e.to.id === activeNode.id)
    : [];

  const toggleNode = (id) => {
    // Clearing hover keeps touch devices (which never fire mouseleave) from sticking on a node.
    setHoverId(null);
    setPinnedId((prev) => (prev === id ? null : id));
  };

  return (
    <SpotlightCard className="p-6 sm:p-8" spotlightColor="rgba(244, 63, 94, 0.12)">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-cinema-border/50">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-rose-500" />
            <h3 className="text-xl font-bold text-white tracking-tight">Interactive Relationship Web</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Alliances and rivalries as of {formatEpisodeCode(season, episode)}. Hover, tap or press Enter on any
            character to trace their connections.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {Object.entries(RELATIONSHIP_COLORS).map(([type, meta]) => (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cinema-black/80 border border-cinema-border text-slate-300"
            >
              <span className="w-2.5 h-2.5 rounded-full shadow" style={{ backgroundColor: meta.stroke }} />
              <span>{meta.label}</span>
            </span>
          ))}
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">
          No characters have been introduced yet at {formatEpisodeCode(season, episode)}.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* SVG Canvas Web */}
          <div className="relative w-full h-[360px] sm:h-[480px] bg-cinema-black/90 rounded-2xl border border-cinema-border/80 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1f2438_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="relative w-full h-full"
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label="Character relationship graph"
              onClick={(e) => {
                if (e.target === e.currentTarget) setPinnedId(null);
              }}
            >
              <defs>
                {nodes.map((n) =>
                  n.avatar ? (
                    <pattern
                      key={n.id}
                      id={`avatar-${n.id}`}
                      x="0%"
                      y="0%"
                      height="100%"
                      width="100%"
                      viewBox="0 0 100 100"
                    >
                      <image x="0" y="0" width="100" height="100" href={n.avatar} preserveAspectRatio="xMidYMid slice" />
                    </pattern>
                  ) : null
                )}
                <filter id="rel-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {/* Edges */}
              {edges.map((edge) => {
                const isHighlighted =
                  activeNode && (edge.from.id === activeNode.id || edge.to.id === activeNode.id);
                const isHovered = hoveredEdge === edge.id;
                const dimmed = activeNode && !isHighlighted;

                const midX = (edge.from.x + edge.to.x) / 2;
                const midY = (edge.from.y + edge.to.y) / 2;
                const dx = edge.to.x - edge.from.x;
                const dy = edge.to.y - edge.from.y;
                const len = Math.hypot(dx, dy) || 1;
                const offset = 25;
                const cx = midX - (dy / len) * offset;
                const cy = midY + (dx / len) * offset;
                const pathD = `M ${edge.from.x} ${edge.from.y} Q ${cx} ${cy} ${edge.to.x} ${edge.to.y}`;

                return (
                  <g
                    key={edge.id}
                    onMouseEnter={() => setHoveredEdge(edge.id)}
                    onMouseLeave={() => setHoveredEdge(null)}
                    className="transition-opacity duration-300"
                    opacity={dimmed ? 0.15 : 1}
                  >
                    <title>{`${edge.from.name} ↔ ${edge.to.name}: ${edge.label} (${edge.typeLabel})`}</title>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={edge.color}
                      strokeWidth={isHighlighted || isHovered ? 5 : 2}
                      strokeOpacity={isHighlighted || isHovered ? 0.95 : 0.6}
                      strokeDasharray={edge.type === 'betrayed' ? '4 4' : 'none'}
                      filter={isHighlighted || isHovered ? 'url(#rel-glow)' : 'none'}
                    />
                    <g transform={`translate(${cx}, ${cy})`}>
                      <rect x="-52" y="-11" width="104" height="22" rx="11" fill="#090a0f" stroke={edge.color} strokeWidth="1.5" />
                      <text textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="9" fontWeight="bold" letterSpacing="0.3">
                        {truncate(edge.label)}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const isSelected = activeNode?.id === node.id;
                const isPinned = pinnedId === node.id;
                const isConnected = activeNode && !isSelected && connectedIds.has(node.id);
                const dimmed = activeNode && !connectedIds.has(node.id);
                const isDead = node.status === 'dead';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => toggleNode(node.id)}
                    onMouseEnter={() => setHoverId(node.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onFocus={() => setHoverId(node.id)}
                    onBlur={() => setHoverId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleNode(node.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isPinned}
                    aria-label={`${node.name}, ${STATUS_COLORS[node.status]?.label || node.status}`}
                    className="cursor-pointer outline-none transition-opacity duration-300"
                    opacity={dimmed ? 0.3 : 1}
                  >
                    <circle
                      r={isSelected ? 32 : 27}
                      fill={isDead ? '#450a0a' : '#1e2436'}
                      stroke={isSelected ? '#f43f5e' : isConnected ? '#10b981' : isDead ? '#ef4444' : '#3b82f6'}
                      strokeWidth={isSelected ? 4 : 2.5}
                      filter={isSelected ? 'url(#rel-glow)' : 'none'}
                      className="transition-all duration-300"
                    />
                    {node.avatar ? (
                      <circle r={isSelected ? 29 : 24} fill={`url(#avatar-${node.id})`} opacity={isDead ? 0.65 : 1} />
                    ) : (
                      <text textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize="18" fontWeight="800">
                        {node.name.charAt(0).toUpperCase()}
                      </text>
                    )}

                    {isDead && (
                      <text x="0" y="4" textAnchor="middle" fontSize="18" className="select-none pointer-events-none">
                        ☠️
                      </text>
                    )}

                    <g transform="translate(0, 40)">
                      <rect x="-44" y="-9" width="88" height="18" rx="6" fill="#0f111a" stroke={isSelected ? '#f43f5e' : '#272d42'} strokeWidth="1" />
                      <text textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="10" fontWeight="600">
                        {truncate(shortName(node.name), 14)}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Focus panel: newcomer primer + this character's connections */}
          <aside
            className="rounded-2xl border border-cinema-border/80 bg-cinema-black/70 p-4 space-y-4 min-h-[160px]"
            aria-live="polite"
          >
            {activeNode ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white">{activeNode.name}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold border ${
                          (STATUS_COLORS[activeNode.status] || STATUS_COLORS.unknown).bg
                        } ${(STATUS_COLORS[activeNode.status] || STATUS_COLORS.unknown).text} ${
                          (STATUS_COLORS[activeNode.status] || STATUS_COLORS.unknown).border
                        }`}
                      >
                        {(STATUS_COLORS[activeNode.status] || STATUS_COLORS.unknown).label}
                      </span>
                      {activeNode.role && (
                        <span className="text-[10px] font-mono text-slate-400 truncate">{activeNode.role}</span>
                      )}
                    </div>
                  </div>
                  {pinnedId === activeNode.id && (
                    <button
                      type="button"
                      onClick={() => setPinnedId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      aria-label="Clear focus"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {(activeNode.primer || activeNode.note) && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <BookUser className="w-3 h-3" /> Newcomer Primer
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{activeNode.primer || activeNode.note}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Connections ({activeEdges.length})
                  </span>
                  {activeEdges.length === 0 ? (
                    <p className="text-xs text-slate-500">No mapped relationships at this point.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {activeEdges.map((e) => {
                        const other = e.from.id === activeNode.id ? e.to : e.from;
                        return (
                          <li key={e.id} className="flex items-start gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: e.color }} />
                            <span className="text-slate-300">
                              <button
                                type="button"
                                onClick={() => setPinnedId(other.id)}
                                className="font-bold text-white hover:text-rose-400 transition"
                              >
                                {other.name}
                              </button>{' '}
                              <span className="text-slate-500">({e.typeLabel})</span> — {e.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-6">
                <GitFork className="w-6 h-6 text-rose-500/60" />
                <p className="text-xs text-slate-400">
                  Select a character to highlight their allies, enemies and family ties, plus a quick primer on who
                  they are.
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  {nodes.length} characters • {edges.length} links
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </SpotlightCard>
  );
}
