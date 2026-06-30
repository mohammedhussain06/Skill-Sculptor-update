import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Clock, Play, GraduationCap, Lock, ZoomIn, ZoomOut, RotateCcw, Shield, Award, Sparkles, CheckSquare, Square } from 'lucide-react';
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
  title?: string;
  onProgressUpdate?: () => void;
}

// Gaming neon color theme for branches
const NEON_COLORS = [
  '#3b82f6', // Neon Blue (Level 1)
  '#10b981', // Neon Emerald (Level 2)
  '#a855f7', // Neon Purple (Level 3)
  '#f97316', // Neon Orange (Level 4)
  '#06b6d4', // Neon Cyan (Level 5)
  '#ec4899', // Neon Pink (Level 6)
];

export function RoadmapMindMap({ steps, roadmapId, title, onProgressUpdate }: RoadmapMindMapProps) {
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  // Track completions of all steps locally to compute game levels
  const [completionsMap, setCompletionsMap] = useState<Record<number, number[]>>({});
  const [lastToggledKey, setLastToggledKey] = useState<string | null>(null);

  // Drag-to-pan & Zoom states
  const [pan, setPan] = useState({ x: 100, y: 50 });
  const [zoom, setZoom] = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 100, y: 50 });

  // Center coordinate of the visual tree
  const cx = 580;

  // Calculate dynamic step Y coordinate based on preceding sibling resource counts to prevent overlap
  const getStepY = (idx: number) => {
    const isLeft = idx % 2 === 0;
    const sideIdx = Math.floor(idx / 2);
    
    let y = 140; // Top starting padding
    for (let i = 0; i < sideIdx; i++) {
      const currentStepIdx = isLeft ? i * 2 : i * 2 + 1;
      const nextStepIdx = isLeft ? (i + 1) * 2 : (i + 1) * 2 + 1;
      
      const countCurrent = steps[currentStepIdx]?.resources?.length || 0;
      const countNext = steps[nextStepIdx]?.resources?.length || 0;
      
      const spacing = (countCurrent / 2) * 38 + (countNext / 2) * 38 + 90;
      y += Math.max(160, spacing);
    }
    return y;
  };

  // Center node Y is the exact midpoint between the first and last step coordinates
  const getCanvasCenterY = () => {
    if (steps.length === 0) return 250;
    const firstY = getStepY(0);
    const lastY = getStepY(steps.length - 1);
    return (firstY + lastY) / 2;
  };
  const cy = getCanvasCenterY();

  // Load completions for all steps
  const loadAllCompletions = () => {
    const map: Record<number, number[]> = {};
    steps.forEach((_, idx) => {
      const key = `completed_resources_${roadmapId}_${idx}`;
      const saved = localStorage.getItem(key);
      map[idx] = saved ? JSON.parse(saved) : [];
    });
    setCompletionsMap(map);
  };

  useEffect(() => {
    loadAllCompletions();
  }, [roadmapId, steps]);

  // Compute step completion stats
  const getStepStats = (stepIdx: number) => {
    const step = steps[stepIdx];
    const total = step?.resources?.length || 0;
    const completedList = completionsMap[stepIdx] || [];
    const completed = completedList.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      isFullyCompleted: total > 0 && completed === total
    };
  };

  // Determine if a Level is unlocked based on previous completion (Linear Game Progression)
  const isLevelUnlocked = (stepIdx: number) => {
    if (stepIdx === 0) return true;
    const prevStats = getStepStats(stepIdx - 1);
    return prevStats.isFullyCompleted || steps[stepIdx - 1].status === 'completed';
  };

  // Toggle resource checklist item
  const toggleResourceCheckbox = (stepIdx: number, resIdx: number) => {
    const key = `completed_resources_${roadmapId}_${stepIdx}`;
    const currentCompleted = completionsMap[stepIdx] || [];
    let updated: number[];

    if (currentCompleted.includes(resIdx)) {
      updated = currentCompleted.filter(i => i !== resIdx);
    } else {
      updated = [...currentCompleted, resIdx];
      // Play level-up click animation effect
      const animationId = `${stepIdx}-${resIdx}`;
      setLastToggledKey(animationId);
      setTimeout(() => setLastToggledKey(null), 400);
    }

    localStorage.setItem(key, JSON.stringify(updated));
    loadAllCompletions();

    if (onProgressUpdate) {
      onProgressUpdate();
    }
  };

  // Coordinates calculation for Alternating Left/Right Side Layout
  const getStepLayoutCoords = (idx: number) => {
    const isLeft = idx % 2 === 0;
    const x = isLeft ? cx - 240 : cx + 240;
    const y = getStepY(idx);
    return { x, y, isLeft };
  };

  // Coordinates for sub-topic quest capsules stacked vertically next to parent
  const getQuestCoords = (stepIdx: number, questIdx: number, totalQuests: number) => {
    const { x: sx, y: sy, isLeft } = getStepLayoutCoords(stepIdx);
    
    // Stack horizontally outward
    const x = isLeft ? sx - 180 : sx + 180;
    
    // Distribute vertically centered around step Y
    const spacing = 36;
    const y = sy + (questIdx - (totalQuests - 1) / 2) * spacing;
    return { x, y };
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    if (target.closest('.node-click') || target.closest('button') || target.closest('a') || target.closest('.zoom-controls')) {
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

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const zoomIntensity = 0.04;
    const nextZoom = e.deltaY < 0 ? zoom + zoomIntensity : zoom - zoomIntensity;
    setZoom(Math.min(Math.max(0.5, nextZoom), 1.6));
  };

  const selectedStep = steps[selectedIdx] || steps[0];
  const selectedStepStats = getStepStats(selectedIdx);

  return (
    <div className="space-y-6 sm:space-y-8 progress-stagger-item animate-fadeInUp">
      
      {/* ── GAMIFIED MIND MAP CANVAS ── */}
      <div 
        className={cn(
          "w-full h-[480px] rounded-2xl border border-border dark:border-white/5 bg-card/35 dark:bg-card/10 backdrop-blur-xl relative overflow-hidden select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Instructions */}
        <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-card/90 dark:bg-black/45 border border-border dark:border-white/5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider backdrop-blur-sm pointer-events-none">
          🎮 Campaign Quest Map • Scroll to Zoom
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-card/90 dark:bg-black/45 border border-border dark:border-white/5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider backdrop-blur-sm pointer-events-none">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white/10 border border-white/20" /> Locked
          </span>
        </div>

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 zoom-controls">
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 rounded-lg border-border dark:border-white/10 bg-card/90 dark:bg-black/40 hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 1.6))}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 rounded-lg border-border dark:border-white/10 bg-card/90 dark:bg-black/40 hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 rounded-lg border-border dark:border-white/10 bg-card/90 dark:bg-black/40 hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setZoom(0.85);
              setPan({ x: 100, y: 50 });
            }}
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* SVG Canvas Workspace */}
        <svg className="w-full h-full absolute inset-0">
          <style>
            {`
              @keyframes dash-crawl {
                to {
                  stroke-dashoffset: -20;
                }
              }
              .neon-branch-glow {
                filter: drop-shadow(0 0 6px var(--glow-color));
              }
              .active-path-flow {
                stroke-dasharray: 8, 5;
                animation: dash-crawl 1.2s linear infinite;
              }
              .central-glow {
                filter: drop-shadow(0 0 10px rgba(168,85,247,0.25));
              }
              .quest-pop-anim {
                animation: quest-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              }
              @keyframes quest-pop {
                0% { transform: scale(1); }
                50% { transform: scale(1.08); filter: brightness(1.15); }
                100% { transform: scale(1); }
              }
              .quest-box {
                transition: all 0.2s ease;
              }
              .quest-box:hover {
                fill: rgba(255, 255, 255, 0.05);
              }
            `}
          </style>

          <defs>
            <pattern id="grid-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.015)" />
            </pattern>
          </defs>

          {/* Grid pattern background */}
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />

          {/* Master layout group applied with pan & zoom */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            
            {/* ── 1. DRAW NEON PATHS (Center Node ➔ Step Level Nodes) ── */}
            {steps.map((step, idx) => {
              const { x, y, isLeft } = getStepLayoutCoords(idx);
              const color = NEON_COLORS[idx % NEON_COLORS.length];
              const isUnlocked = isLevelUnlocked(idx);
              const { isFullyCompleted } = getStepStats(idx);

              // Curved bezier flow line
              const cp1x = isLeft ? cx - 150 : cx + 150;
              const cp1y = cy;
              const cp2x = isLeft ? x + 120 : x - 120;
              const cp2y = y;

              return (
                <path
                  key={`path-${idx}`}
                  d={`M ${isLeft ? cx - 110 : cx + 110} ${cy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`}
                  fill="none"
                  stroke={isUnlocked ? color : 'rgba(255,255,255,0.04)'}
                  strokeWidth={isUnlocked ? 4.5 : 3}
                  className={cn(
                    "transition-all duration-300",
                    isUnlocked && "neon-branch-glow",
                    isUnlocked && !isFullyCompleted && "active-path-flow"
                  )}
                  style={{ '--glow-color': color } as React.CSSProperties}
                />
              );
            })}

            {/* ── 2. DRAW SUB-BRANCH TREES (Step Nodes ➔ Quest Pills) ── */}
            {steps.map((step, stepIdx) => {
              if (!step.resources || step.resources.length === 0) return null;
              const { x: sx, y: sy, isLeft } = getStepLayoutCoords(stepIdx);
              const color = NEON_COLORS[stepIdx % NEON_COLORS.length];
              const isUnlocked = isLevelUnlocked(stepIdx);
              const completedList = completionsMap[stepIdx] || [];

              // Coordinates of the first and last quest pills for drawing vertical backbone
              const firstQuest = getQuestCoords(stepIdx, 0, step.resources.length);
              const lastQuest = getQuestCoords(stepIdx, step.resources.length - 1, step.resources.length);

              // Horizontal backbone connector offset
              const backboneX = isLeft ? sx - 110 : sx + 110;

              return (
                <g key={`tree-${stepIdx}`} className="opacity-80">
                  {/* Horizontal main branch exit */}
                  <line
                    x1={isLeft ? sx - 90 : sx + 90}
                    y1={sy}
                    x2={backboneX}
                    y2={sy}
                    stroke={isUnlocked ? color : 'rgba(255,255,255,0.04)'}
                    strokeWidth={3}
                  />
                  {/* Vertical backbone line */}
                  <line
                    x1={backboneX}
                    y1={firstQuest.y}
                    x2={backboneX}
                    y2={lastQuest.y}
                    stroke={isUnlocked ? color : 'rgba(255,255,255,0.04)'}
                    strokeWidth={2.5}
                  />
                  {/* Horizontal branch entry to each quest pill */}
                  {step.resources.map((res, resIdx) => {
                    const qCoords = getQuestCoords(stepIdx, resIdx, step.resources!.length);
                    const isDone = completedList.includes(resIdx);
                    return (
                      <line
                        key={`leaf-branch-${stepIdx}-${resIdx}`}
                        x1={backboneX}
                        y1={qCoords.y}
                        x2={isLeft ? qCoords.x + 85 : qCoords.x - 85}
                        y2={qCoords.y}
                        stroke={isUnlocked ? (isDone ? '#10b981' : color) : 'rgba(255,255,255,0.03)'}
                        strokeWidth={isDone ? 2.5 : 2}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* ── 3. RENDER SUB-TOPIC QUEST CAPSULES (Checklist level-pills) ── */}
            {steps.map((step, stepIdx) => {
              if (!step.resources || step.resources.length === 0) return null;
              const color = NEON_COLORS[stepIdx % NEON_COLORS.length];
              const isUnlocked = isLevelUnlocked(stepIdx);
              const completedList = completionsMap[stepIdx] || [];

              return step.resources.map((res, resIdx) => {
                const { x, y } = getQuestCoords(stepIdx, resIdx, step.resources!.length);
                const isDone = completedList.includes(resIdx);
                const animationKey = `${stepIdx}-${resIdx}`;
                const isToggling = lastToggledKey === animationKey;

                return (
                  <g
                    key={`quest-${stepIdx}-${resIdx}`}
                    className={cn(
                      "node-click cursor-pointer",
                      isToggling && "quest-pop-anim"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isUnlocked) return;
                      setSelectedIdx(stepIdx);
                      toggleResourceCheckbox(stepIdx, resIdx);
                    }}
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  >
                    {/* Level Pill box */}
                    <rect
                      x={x - 85}
                      y={y - 14}
                      width="170"
                      height="28"
                      rx="8"
                      className={cn(
                        "quest-box transition-all duration-300 stroke-[1.5]",
                        !isUnlocked 
                          ? "fill-white/[0.01] stroke-white/[0.04]"
                          : isDone 
                          ? "fill-success/10 stroke-success shadow-sm" 
                          : "fill-card/75 stroke-border"
                      )}
                      style={{ 
                        stroke: isUnlocked && !isDone ? color : undefined,
                        boxShadow: isDone ? '0 0 10px rgba(16,185,129,0.2)' : undefined
                      }}
                    />

                    {/* Quest Checked Icon status */}
                    {isDone ? (
                      <circle cx={x - 70} cy={y} r={6} className="fill-success" />
                    ) : (
                      <circle cx={x - 70} cy={y} r={5} className="fill-none stroke-muted-foreground/50 stroke-1" />
                    )}

                    {/* Quest Title Label */}
                    <text
                      x={x - 56}
                      y={y + 1}
                      dominantBaseline="middle"
                      className={cn(
                        "text-[9px] font-bold select-none pointer-events-none fill-current",
                        !isUnlocked 
                          ? "text-muted-foreground/30"
                          : isDone 
                          ? "text-success line-through opacity-75 font-semibold" 
                          : "text-foreground"
                      )}
                    >
                      {res.title.length > 22 ? `${res.title.slice(0, 20)}...` : res.title}
                    </text>
                  </g>
                );
              });
            })}

            {/* ── 4. RENDER STEP LEVEL NODES (Neon Level Cards) ── */}
            {steps.map((step, idx) => {
              const { x, y } = getStepLayoutCoords(idx);
              const isSelected = idx === selectedIdx;
              const isUnlocked = isLevelUnlocked(idx);
              const { percentage, isFullyCompleted } = getStepStats(idx);
              const color = NEON_COLORS[idx % NEON_COLORS.length];

              return (
                <g 
                  key={`step-${idx}`}
                  className="node-click cursor-pointer node-g"
                  onClick={() => setSelectedIdx(idx)}
                >
                  {/* Neon pulsing ring on current level */}
                  {step.status === 'current' && isUnlocked && (
                    <rect
                      x={x - 98}
                      y={y - 31}
                      width="196"
                      height="62"
                      rx="16"
                      fill="none"
                      stroke={color}
                      className="stroke-[2.5] animate-pulse"
                    />
                  )}

                  {/* Level Capsule Card */}
                  <rect
                    x={x - 90}
                    y={y - 25}
                    width="180"
                    height="50"
                    rx="14"
                    fill="hsl(var(--card))"
                    className={cn(
                      "transition-all duration-300 stroke-[2.5]",
                      isSelected 
                        ? "stroke-primary shadow-lg" 
                        : !isUnlocked 
                        ? "stroke-border/40 opacity-60"
                        : isFullyCompleted
                        ? "stroke-success"
                        : "stroke-border"
                    )}
                    style={{ 
                      stroke: isSelected || !isUnlocked || isFullyCompleted ? undefined : color,
                      opacity: !isUnlocked ? 0.6 : 1
                    }}
                  />

                  {/* Level Number Prefix Badge (Circle) */}
                  <circle
                    cx={x - 66}
                    cy={y}
                    r={16}
                    fill={isUnlocked ? color : "rgba(255,255,255,0.03)"}
                    fillOpacity={isUnlocked ? 0.12 : 1}
                    className={cn(
                      "transition-all stroke-[2]",
                      isUnlocked ? "stroke-[2]" : "stroke-border/40"
                    )}
                    style={{ stroke: isUnlocked ? color : undefined }}
                  />

                  {/* Inner text index or Lock icon inside Circle */}
                  {isUnlocked ? (
                    <text
                      x={x - 66}
                      y={y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[10px] font-black select-none pointer-events-none fill-current"
                      style={{ fill: color }}
                    >
                      {step.step}
                    </text>
                  ) : (
                    <g transform={`translate(${x - 73}, ${y - 7})`} className="opacity-50">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    </g>
                  )}

                  {/* Level Step Title text */}
                  <text
                    x={x - 42}
                    y={y - 4}
                    dominantBaseline="middle"
                    className={cn(
                      "text-[9px] sm:text-[10px] font-extrabold select-none pointer-events-none fill-current",
                      !isUnlocked ? "text-muted-foreground/35" : "text-foreground"
                    )}
                  >
                    {step.title.length > 18 ? `${step.title.slice(0, 16)}...` : step.title}
                  </text>

                  {/* Progress completion stats */}
                  {isUnlocked ? (
                    <text
                      x={x - 42}
                      y={y + 8}
                      dominantBaseline="middle"
                      className={cn(
                        "text-[8px] font-extrabold select-none pointer-events-none fill-current",
                        isFullyCompleted ? "text-success font-black" : "text-muted-foreground"
                      )}
                    >
                      {isFullyCompleted ? 'COMPLETED ✓' : `${percentage}% Unlocked`}
                    </text>
                  ) : (
                    <text
                      x={x - 42}
                      y={y + 8}
                      dominantBaseline="middle"
                      className="text-[8px] font-bold select-none pointer-events-none fill-current text-muted-foreground/35"
                    >
                      Level Locked
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── 5. CENTRAL IMAGE / NEON SKILL CARD ── */}
            <g transform={`translate(${cx}, ${cy})`} className="central-glow">
              {/* Central glowing rectangle card */}
              <rect
                x="-105"
                y="-38"
                width="210"
                height="76"
                rx="20"
                className="fill-purple-500/10 stroke-purple-500 stroke-[3] backdrop-blur-2xl shadow-2xl"
              />
              <rect
                x="-98"
                y="-31"
                width="196"
                height="62"
                rx="16"
                fill="none"
                className="stroke-purple-500/35 stroke-1"
              />
              
              {/* Rocket icon */}
              <g transform="translate(0, -18)">
                <Sparkles className="w-4 h-4 text-purple-400 mx-auto" style={{ transform: 'translateX(-8px)' }} />
              </g>

              {/* Skill title label */}
              <text
                x="0"
                y="8"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-purple-300 text-[10px] font-black uppercase tracking-widest select-none pointer-events-none"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {title ? (title.length > 18 ? `${title.slice(0, 16)}...` : title) : 'Roadmap Level'}
              </text>
              
              <text
                x="0"
                y="20"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-purple-400/80 text-[7px] font-bold uppercase tracking-widest select-none pointer-events-none"
              >
                Campaign Workspace
              </text>
            </g>

          </g>
        </svg>
      </div>

      {/* ── SELECTED STEP DETAILS PANEL ── */}
      <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl transition-all duration-300">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/15 text-primary">
                Level {selectedStep.step} Quest
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
          {/* Sub-resources Checklist details */}
          {selectedStep.resources && selectedStep.resources.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <GraduationCap className="w-4.5 h-4.5 text-secondary" />
                Level Quests ({selectedStepStats.completed}/{selectedStepStats.total} Solved)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedStep.resources.map((res, i) => {
                  const isDone = (completionsMap[selectedIdx] || []).includes(i);
                  const stepColor = NEON_COLORS[selectedIdx % NEON_COLORS.length];
                  const isUnlocked = isLevelUnlocked(selectedIdx);

                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all font-semibold text-xs sm:text-sm",
                        isDone 
                          ? "bg-success/8 border-success/30 text-success" 
                          : "bg-white/3 border-white/5 text-foreground/80 hover:bg-white/5 hover:border-white/10"
                      )}
                    >
                      {/* Checkbox button */}
                      <button 
                        onClick={() => toggleResourceCheckbox(selectedIdx, i)}
                        className="flex items-center gap-2.5 text-left min-w-0 flex-1 hover:opacity-85"
                        disabled={!isUnlocked}
                      >
                        {isDone ? (
                          <CheckCircle className="w-4.5 h-4.5 text-success shrink-0" />
                        ) : (
                          <Circle 
                            className="w-4.5 h-4.5 shrink-0" 
                            style={{ color: isUnlocked ? stepColor : undefined }}
                          />
                        )}
                        <span className={cn("truncate pr-2", isDone && "line-through opacity-70")}>
                          {res.title}
                        </span>
                      </button>
                      
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground shrink-0 px-2 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:text-foreground transition-all ml-1.5"
                      >
                        Open Resource
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            {!isLevelUnlocked(selectedIdx) ? (
              <Button disabled className="w-full sm:w-auto font-bold h-11 border border-white/5 opacity-50">
                <Lock className="w-4 h-4 mr-2" />
                Level Locked (Complete Previous Level Quests)
              </Button>
            ) : (
              <Button
                onClick={() => navigate(`/learn/${roadmapId}/${selectedIdx}`)}
                className="w-full sm:w-auto font-bold h-11 bg-gradient-primary border-0 text-white shadow-glow hover:scale-102 transition-transform"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Level Campaign
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
