'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import SpotlightCard from './reactbits/SpotlightCard';
import { RELATIONSHIP_COLORS } from '@/lib/constants';
import { GitFork, Heart, Skull, Users, ShieldAlert, Sparkles } from 'lucide-react';

export default function RelationshipWeb({
  characters = [],
  relationships = [],
  season,
  episode
}) {
  const [activeNode, setActiveNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Map character names to IDs
  const characterMap = useMemo(() => {
    const map = {};
    characters.forEach((c) => {
      map[c.name] = c;
      const firstName = c.name.split(' ')[0];
      map[firstName] = c;
      if (c.aliases) {
        c.aliases.forEach((a) => {
          map[a] = c;
        });
      }
    });
    return map;
  }, [characters]);

  // Layout node positions in an elliptical/orbital arena
  const nodes = useMemo(() => {
    const total = characters.length;
    const cx = 350;
    const cy = 250;
    const rx = 260;
    const ry = 170;

    return characters.map((c, i) => {
      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      return {
        ...c,
        x,
        y
      };
    });
  }, [characters]);

  const nodePositionMap = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.name] = n;
      const first = n.name.split(' ')[0];
      map[first] = n;
    });
    return map;
  }, [nodes]);

  // Resolve edges with coordinates
  const edges = useMemo(() => {
    return relationships
      .map((rel, idx) => {
        const fromNode = nodePositionMap[rel.from];
        const toNode = nodePositionMap[rel.to];
        if (!fromNode || !toNode) return null;

        const style = RELATIONSHIP_COLORS[rel.type] || RELATIONSHIP_COLORS.ally;

        return {
          id: `edge-${idx}`,
          from: fromNode,
          to: toNode,
          type: rel.type,
          label: rel.label,
          color: style.stroke,
          glow: style.glow
        };
      })
      .filter(Boolean);
  }, [relationships, nodePositionMap]);

  return (
    <SpotlightCard
      className="p-6 sm:p-8"
      spotlightColor="rgba(244, 63, 94, 0.12)"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-cinema-border/50">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-rose-500" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Interactive Relationship Web
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic Purvanchal alliance matrix at S{String(season).padStart(2, '0')}E{String(episode).padStart(2, '0')}. Click or hover any character.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {Object.entries(RELATIONSHIP_COLORS).map(([type, meta]) => (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cinema-black/80 border border-cinema-border text-slate-300"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shadow"
                style={{ backgroundColor: meta.stroke }}
              />
              <span className="capitalize">{meta.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* SVG Canvas Web */}
      <div className="relative w-full h-[520px] bg-cinema-black/90 rounded-2xl border border-cinema-border/80 overflow-hidden flex items-center justify-center">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f2438_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <svg
          viewBox="0 0 700 500"
          className="w-full h-full max-w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {nodes.map((n) => (
              <pattern
                key={n.id}
                id={`avatar-${n.id}`}
                x="0%"
                y="0%"
                height="100%"
                width="100%"
                viewBox="0 0 100 100"
              >
                <image
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  href={n.avatar}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            ))}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Edges / Lines */}
          {edges.map((edge) => {
            const isHighlighted =
              activeNode &&
              (edge.from.name === activeNode.name || edge.to.name === activeNode.name);
            const isHovered = hoveredEdge === edge.id;

            // Curve calculation
            const midX = (edge.from.x + edge.to.x) / 2;
            const midY = (edge.from.y + edge.to.y) / 2;
            const dx = edge.to.x - edge.from.x;
            const dy = edge.to.y - edge.from.y;
            // Curvature offset
            const offset = 25;
            const cx = midX - (dy / Math.hypot(dx, dy)) * offset;
            const cy = midY + (dx / Math.hypot(dx, dy)) * offset;

            const pathD = `M ${edge.from.x} ${edge.from.y} Q ${cx} ${cy} ${edge.to.x} ${edge.to.y}`;

            return (
              <g
                key={edge.id}
                onMouseEnter={() => setHoveredEdge(edge.id)}
                onMouseLeave={() => setHoveredEdge(null)}
                className="cursor-pointer transition-all duration-300"
              >
                {/* Thick glow line on hover */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={edge.color}
                  strokeWidth={isHighlighted || isHovered ? 6 : 2}
                  strokeOpacity={
                    activeNode ? (isHighlighted ? 0.9 : 0.15) : isHovered ? 1 : 0.6
                  }
                  strokeDasharray={edge.type === 'betrayed' ? '4 4' : 'none'}
                  filter={isHighlighted || isHovered ? 'url(#glow)' : 'none'}
                />

                {/* Edge Label badge in center */}
                <g transform={`translate(${cx}, ${cy})`}>
                  <rect
                    x="-45"
                    y="-11"
                    width="90"
                    height="22"
                    rx="11"
                    fill="#090a0f"
                    stroke={edge.color}
                    strokeWidth="1.5"
                    opacity={
                      activeNode ? (isHighlighted ? 1 : 0.2) : isHovered ? 1 : 0.85
                    }
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    letterSpacing="0.5"
                  >
                    {edge.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Character Nodes */}
          {nodes.map((node) => {
            const isSelected = activeNode?.id === node.id;
            const isConnected =
              activeNode &&
              edges.some(
                (e) =>
                  (e.from.id === node.id && e.to.id === activeNode.id) ||
                  (e.to.id === node.id && e.from.id === activeNode.id)
              );

            const isDead = node.status === 'dead';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setActiveNode(isSelected ? null : node)}
                onMouseEnter={() => !activeNode && setActiveNode(node)}
                onMouseLeave={() => activeNode?.id === node.id && setActiveNode(null)}
                className="cursor-pointer group"
              >
                {/* Node Ring */}
                <circle
                  r={isSelected ? 32 : 27}
                  fill={isDead ? '#450a0a' : '#1e2436'}
                  stroke={
                    isSelected
                      ? '#f43f5e'
                      : isConnected
                      ? '#10b981'
                      : isDead
                      ? '#ef4444'
                      : '#3b82f6'
                  }
                  strokeWidth={isSelected ? 4 : 2.5}
                  filter={isSelected ? 'url(#glow)' : 'none'}
                  className="transition-all duration-300"
                />

                {/* Avatar pattern fill */}
                <circle
                  r={isSelected ? 29 : 24}
                  fill={`url(#avatar-${node.id})`}
                  opacity={isDead ? 0.65 : 1}
                />

                {isDead && (
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="18"
                    className="select-none pointer-events-none drop-shadow"
                  >
                    ☠️
                  </text>
                )}

                {/* Character Name Label */}
                <g transform="translate(0, 38)">
                  <rect
                    x="-40"
                    y="-9"
                    width="80"
                    height="18"
                    rx="6"
                    fill="#0f111a"
                    stroke="#272d42"
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {node.name.split(' ')[0]}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Floating Active Info Overlay */}
        {activeNode && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm p-3.5 rounded-2xl bg-cinema-card/95 border border-rose-500/50 backdrop-blur-md shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-cinema-border">
              <Image
                src={activeNode.avatar}
                alt={activeNode.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white">{activeNode.name}</h4>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-rose-400">
                  {activeNode.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-1">{activeNode.note}</p>
              <span className="text-[10px] text-slate-400">Click node again to clear focus</span>
            </div>
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}
