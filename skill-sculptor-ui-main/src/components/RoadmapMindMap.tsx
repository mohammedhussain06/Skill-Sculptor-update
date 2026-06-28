import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Clock, Play, GraduationCap, Lock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Resource {
  title: string;
  type: string;
  url: string;
}

interface Step {
  step: number;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  status: 'completed' | 'current' | 'locked';
  resources?: Resource[];
}

interface RoadmapMindMapProps {
  steps: Step[];
  roadmapId: string;
}

export function RoadmapMindMap({ steps, roadmapId }: RoadmapMindMapProps) {
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  // Drag-to-pan states
  const [pan, setPan] = useState({ x: 40, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 40, y: 0 });

  // Node position calculators
  const getNodeCoords = (idx: number) => {
    const x = 120 + idx * 240;
    // Curved wave trajectory
    const y = 160 + Math.sin(idx * 1.6) * 65;
    return { x, y };
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if left-clicking the background / non-interactive areas
    const target = e.target as SVGElement;
    if (target.closest('.node-click') || target.closest('button') || target.closest('a')) {
      return;
    }
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: dragOffset.current.x + dx,
      y: dragOffset.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Build curved bezier paths connecting steps
  const renderPaths = () => {
    const paths: React.ReactNode[] = [];
    for (let i = 0; i < steps.length - 1; i++) {
      const p1 = getNodeCoords(i);
      const p2 = getNodeCoords(i + 1);

      // Cubic bezier curves for extremely smooth s-curve paths
      const cp1x = p1.x + 110;
      const cp1y = p1.y;
      const cp2x = p2.x - 110;
      const cp2y = p2.y;

      const isPassed = steps[i].status === 'completed' && steps[i + 1].status !== 'locked';

      paths.push(
        <path
          key={`path-${i}`}
          d={`M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`}
          fill="none"
          stroke={isPassed ? 'url(#active-gradient)' : 'hsl(var(--border))'}
          strokeWidth={isPassed ? 4.5 : 3.5}
          className="transition-all duration-300"
        />
      );
    }
    return paths;
  };

  const selectedStep = steps[selectedIdx] || steps[0];

  return (
    <div className="space-y-6 sm:space-y-8 progress-stagger-item animate-fadeInUp">
      
      {/* ── DRAG-PAN MIND MAP CANVAS ── */}
      <div 
        className={cn(
          "w-full h-80 sm:h-96 rounded-2xl border border-white/5 bg-card/15 backdrop-blur-xl relative overflow-hidden select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Instructions overlay */}
        <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-black/45 border border-white/5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider backdrop-blur-sm pointer-events-none">
          🖱️ Drag to pan • Click nodes to select
        </div>

        {/* SVG Canvas Workspace */}
        <svg className="w-full h-full absolute inset-0">
          <defs>
            <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
            {/* Soft grid background */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Infinite grid mesh */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Master layout group applied with drag pan offsets */}
          <g transform={`translate(${pan.x}, ${pan.y})`}>
            {/* Draw connection lines */}
            {renderPaths()}

            {/* Draw Step nodes */}
            {steps.map((step, idx) => {
              const { x, y } = getNodeCoords(idx);
              const isSelected = idx === selectedIdx;
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';
              const isLocked = step.status === 'locked';

              return (
                <g 
                  key={`node-${idx}`}
                  className="node-click cursor-pointer group"
                  onClick={() => setSelectedIdx(idx)}
                >
                  {/* Glowing active outer pulse ring */}
                  {isCurrent && (
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={36} 
                      className="fill-none stroke-primary/30 stroke-2 animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                  )}

                  {/* Node outer ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 30 : 25}
                    className={cn(
                      "fill-card/90 transition-all duration-300 stroke-[3.5]",
                      isSelected 
                        ? "stroke-primary shadow-glow-sm" 
                        : isCompleted 
                        ? "stroke-success" 
                        : isCurrent 
                        ? "stroke-primary" 
                        : "stroke-muted-foreground/30"
                    )}
                  />

                  {/* Node Inner Circle Details */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 22 : 18}
                    className={cn(
                      "transition-all duration-200",
                      isCompleted 
                        ? "fill-success/15" 
                        : isCurrent 
                        ? "fill-primary/10" 
                        : "fill-white/3"
                    )}
                  />

                  {/* Step status symbols / indexes */}
                  {isLocked ? (
                    <g transform={`translate(${x - 6}, ${y - 6})`}>
                      <Lock className="w-3 h-3 text-muted-foreground/60" />
                    </g>
                  ) : (
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={cn(
                        "text-xs font-black select-none pointer-events-none",
                        isCompleted ? "fill-success" : isCurrent ? "fill-primary" : "fill-foreground"
                      )}
                    >
                      {step.step}
                    </text>
                  )}

                  {/* Floating Title Label below/above node */}
                  <text
                    x={x}
                    y={y + (idx % 2 === 0 ? 52 : -42)}
                    textAnchor="middle"
                    className={cn(
                      "text-[10px] sm:text-xs font-bold transition-all select-none pointer-events-none",
                      isSelected ? "fill-foreground scale-105" : "fill-muted-foreground group-hover:fill-foreground"
                    )}
                  >
                    {step.title.length > 20 ? `${step.title.slice(0, 18)}...` : step.title}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* ── SELECTED STEP DETAILS PANEL ── */}
      <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/15 text-primary">
                Step {selectedStep.step}
              </span>
              <span className={cn(
                "text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full",
                selectedStep.difficulty === 'Beginner' ? "text-success bg-success/10" : "text-muted-foreground bg-white/5"
              )}>
                {selectedStep.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm font-semibold">
              <Clock className="w-4 h-4" />
              <span>{selectedStep.duration}</span>
            </div>
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl mt-4 font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {selectedStep.title}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2 text-muted-foreground font-medium break-words">
            {selectedStep.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2 space-y-5">
          {/* Sub-resources */}
          {selectedStep.resources && selectedStep.resources.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <GraduationCap className="w-4.5 h-4.5 text-secondary" />
                Study Resources
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedStep.resources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all font-semibold text-xs sm:text-sm text-foreground/80 hover:text-foreground"
                  >
                    <span className="truncate pr-2">{res.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                      {res.type}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            {selectedStep.status === 'locked' ? (
              <Button disabled className="w-full sm:w-auto font-bold h-11 border border-white/5 opacity-50">
                <Lock className="w-4 h-4 mr-2" />
                Step Locked
              </Button>
            ) : (
              <Button
                onClick={() => navigate(`/learn/${roadmapId}/${selectedIdx}`)}
                className="w-full sm:w-auto font-bold h-11 bg-gradient-primary border-0 text-white shadow-glow hover:scale-102 transition-transform"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Step
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
