import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Target, Award, Clock, Plus, Trash2, CheckCircle, Sparkles, Sliders } from 'lucide-react';
import API from '../../api/axios';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MilestoneSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  roadmapId: string;
  roadmapTitle: string;
  stepIdx: number;
  stepTitle: string;
  completed: boolean;
}

export default function PlannerPage() {
  const [schedules, setSchedules] = useState<MilestoneSchedule[]>([]);
  const [focusSeconds, setFocusSeconds] = useState<Record<string, number>>({});
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [dailyGoalHours, setDailyGoalHours] = useState<number>(2);
  const [loading, setLoading] = useState(true);

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayStr, setSelectedDayStr] = useState<string>('');
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('');
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);

  const navigate = useNavigate();
  const { toast } = useToast();

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const userId = user._id || user.id;

  // Load schedules, focus logs, and active roadmaps
  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        // Fetch active roadmaps from dashboard endpoint (to get populated steps)
        const dashboardRes = await API.get(`/dashboard/${userId}`);
        const activeRoadmaps = dashboardRes.data.dashboard.savedRoadmaps
          ?.map((sr: any) => sr.roadmapId)
          .filter(Boolean) || [];
        setRoadmaps(activeRoadmaps);
        if (activeRoadmaps.length > 0) {
          setSelectedRoadmapId(activeRoadmaps[0]._id);
        }

        // Load local schedules
        const savedSchedules = localStorage.getItem('study_planner_schedules');
        if (savedSchedules) {
          setSchedules(JSON.parse(savedSchedules));
        }

        // Load study hours goal
        const savedGoal = localStorage.getItem('study_hours_goal');
        if (savedGoal) {
          setDailyGoalHours(parseInt(savedGoal));
        }

        // Load focus seconds log
        let savedFocus = localStorage.getItem('study_focus_seconds_log');
        if (!savedFocus || Object.keys(JSON.parse(savedFocus)).length === 0) {
          // Pre-seed some mock focus data for testing so the user sees the grid working immediately
          const todayObj = new Date();
          const mockLogs: Record<string, number> = {};
          for (let i = 0; i < 15; i++) {
            const tempDate = new Date();
            tempDate.setDate(todayObj.getDate() - i);
            const tempStr = tempDate.toLocaleDateString('en-CA');
            const randomSecs = [600, 1800, 2400, 3600, 4800, 6000][Math.floor(Math.random() * 6)];
            if (Math.random() > 0.3) {
              mockLogs[tempStr] = randomSecs;
            }
          }
          localStorage.setItem('study_focus_seconds_log', JSON.stringify(mockLogs));
          savedFocus = JSON.stringify(mockLogs);
        }
        setFocusSeconds(JSON.parse(savedFocus));
      } catch (err) {
        console.error('Error loading planner data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, navigate]);

  // Save schedules helper
  const saveSchedules = (updated: MilestoneSchedule[]) => {
    setSchedules(updated);
    localStorage.setItem('study_planner_schedules', JSON.stringify(updated));
  };

  // Switch Calendar Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Format month name
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Generate calendar days
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarCells = [];
  // Add empty placeholders for starting offset
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Add actual days
  for (let i = 1; i <= totalDays; i++) {
    calendarCells.push(new Date(currentYear, currentMonth, i));
  }

  // Load schedules helper with dynamic completion status checked in real time
  const getDynamicSchedules = () => {
    return schedules.map(item => {
      const targetRoadmap = roadmaps.find(r => r._id === item.roadmapId);
      let isStepDone = false;
      
      if (targetRoadmap) {
        const stepObj = targetRoadmap.steps?.[item.stepIdx];
        if (stepObj && stepObj.resources) {
          const key = `completed_resources_${item.roadmapId}_${item.stepIdx}`;
          const saved = localStorage.getItem(key);
          const completedCount = saved ? JSON.parse(saved).length : 0;
          isStepDone = stepObj.resources.length > 0 && completedCount === stepObj.resources.length;
        }
      }
      
      return {
        ...item,
        completed: isStepDone
      };
    });
  };

  // Toggle milestone completion state (keeps Roadmap Checklist, Activity Log, and Streak in 100% two-way sync)
  const handleToggleMilestone = (scheduleId: string) => {
    const dynamicSchedules = getDynamicSchedules();
    const targetItem = dynamicSchedules.find(s => s.id === scheduleId);
    if (!targetItem) return;

    const nextCompleted = !targetItem.completed;
    
    // Find corresponding roadmap and update its resource completions in localStorage
    const targetRoadmap = roadmaps.find(r => r._id === targetItem.roadmapId);
    if (targetRoadmap) {
      const stepObj = targetRoadmap.steps?.[targetItem.stepIdx];
      if (stepObj && stepObj.resources) {
        const key = `completed_resources_${targetItem.roadmapId}_${targetItem.stepIdx}`;
        
        if (nextCompleted) {
          // Mark all resources completed
          const resourceIndices = stepObj.resources.map((_: any, idx: number) => idx);
          localStorage.setItem(key, JSON.stringify(resourceIndices));
          
          // Add to global activity log
          const logKey = 'completed_activities_log';
          const rawLog = localStorage.getItem(logKey);
          let log = rawLog ? JSON.parse(rawLog) : [];
          stepObj.resources.forEach((res: any, resIdx: number) => {
            log = [...log.filter((lItem: any) => !(lItem.roadmapId === targetItem.roadmapId && lItem.stepIdx === targetItem.stepIdx && lItem.resIdx === resIdx)), {
              roadmapId: targetItem.roadmapId,
              stepIdx: targetItem.stepIdx,
              resIdx,
              title: res.title || 'Resource',
              stepTitle: stepObj.title,
              roadmapTitle: targetRoadmap.skill || 'Roadmap',
              timestamp: new Date().toISOString()
            }];
          });
          localStorage.setItem(logKey, JSON.stringify(log));
        } else {
          // Clear resource completions
          localStorage.removeItem(key);
          
          // Filter out of global activity log
          const logKey = 'completed_activities_log';
          const rawLog = localStorage.getItem(logKey);
          if (rawLog) {
            const log = JSON.parse(rawLog);
            const filtered = log.filter((lItem: any) => !(lItem.roadmapId === targetItem.roadmapId && lItem.stepIdx === targetItem.stepIdx));
            localStorage.setItem(logKey, JSON.stringify(filtered));
          }
        }
      }
    }

    toast({
      title: nextCompleted ? "Milestone Conquered! 🏆" : "Milestone Reset",
      description: `"${targetItem.stepTitle}" progress has been updated.`,
    });

    // Save state update to trigger re-renders
    const updated = schedules.map(s => {
      if (s.id === scheduleId) {
        return { ...s, completed: nextCompleted };
      }
      return s;
    });
    saveSchedules(updated);
  };

  // Delete milestone
  const handleDeleteMilestone = (scheduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = schedules.filter(item => item.id !== scheduleId);
    saveSchedules(updated);
    toast({
      title: "Milestone Deleted",
      description: "Milestone has been removed from your calendar.",
    });
  };

  // Open scheduling modal for a specific day
  const handleOpenAddModal = (dateObj: Date) => {
    // Format YYYY-MM-DD
    const dateStr = dateObj.toLocaleDateString('en-CA');
    setSelectedDayStr(dateStr);
    setIsModalOpen(true);
  };

  // Save new milestone schedule
  const handleAddMilestone = () => {
    const selectedRoadmap = roadmaps.find(r => r._id === selectedRoadmapId);
    if (!selectedRoadmap) {
      toast({
        title: "Error",
        description: "Please select a valid learning roadmap.",
        variant: "destructive",
      });
      return;
    }

    const stepObj = selectedRoadmap.steps?.[selectedStepIdx];
    if (!stepObj) {
      toast({
        title: "Error",
        description: "Invalid level step selected.",
        variant: "destructive",
      });
      return;
    }

    // Check if step is already scheduled for this day
    const alreadyExists = schedules.some(item => 
      item.date === selectedDayStr && 
      item.roadmapId === selectedRoadmapId && 
      item.stepIdx === selectedStepIdx
    );

    if (alreadyExists) {
      toast({
        title: "Duplicate Milestone",
        description: "This level step is already scheduled on this day.",
        variant: "destructive",
      });
      return;
    }

    const newMilestone: MilestoneSchedule = {
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDayStr,
      roadmapId: selectedRoadmapId,
      roadmapTitle: selectedRoadmap.skill,
      stepIdx: selectedStepIdx,
      stepTitle: stepObj.title,
      completed: false
    };

    saveSchedules([...schedules, newMilestone]);
    setIsModalOpen(false);
    toast({
      title: "Milestone Scheduled! 📅",
      description: `"${stepObj.title}" added to your calendar.`,
    });
  };

  const handleUpdateGoal = (hours: number) => {
    setDailyGoalHours(hours);
    localStorage.setItem('study_hours_goal', hours.toString());
    toast({
      title: "Target Goal Updated",
      description: `Daily focus hour target set to ${hours} ${hours === 1 ? 'hour' : 'hours'}.`,
    });
  };

  // Generate 16 weeks of focus heatmap data (112 days total)
  const getHeatmapDays = () => {
    const heatmapCells = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    
    // Set startDate to the Sunday of 15 weeks ago
    startDate.setDate(today.getDate() - dayOfWeek - 15 * 7);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 16 * 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA');
      const seconds = focusSeconds[dateStr] || 0;
      const minutes = Math.round(seconds / 60);
      
      heatmapCells.push({
        date: d,
        dateStr,
        minutes,
        seconds
      });
    }

    return heatmapCells;
  };

  const heatmapDays = getHeatmapDays();
  const totalFocusSeconds = Object.values(focusSeconds).reduce((acc, curr) => acc + curr, 0);
  const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);
  const dynamicSchedules = getDynamicSchedules();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-bold animate-pulse">LOGGING WORKSPACE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner Header */}
        <div className="text-center md:text-left md:flex md:items-center md:justify-between gap-6 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight flex items-center justify-center md:justify-start gap-2.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <CalendarIcon className="w-8 h-8 text-primary" />
              Study Planner & Calendar
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-2">
              Map out roadmap milestones, schedule review loops, and track daily focus times.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="font-bold border-white/10 hover:bg-white/5 text-foreground text-xs"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>

        {/* ── FOCUS HEATMAP CARD ── */}
        <Card className="glass-card border-0 bg-card/30 backdrop-blur-xl border-white/5 shadow-xl">
          <CardHeader className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                Focus Hours Goal Tracker
              </CardTitle>
              <CardDescription className="text-xs">
                Consistent focus triggers your green contribution blocks. (Logged via Pomodoro)
              </CardDescription>
            </div>
            
            {/* Goal selector */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase">Goal Target:</span>
              <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-lg">
                {[1, 2, 3, 4].map(hours => (
                  <button
                    key={hours}
                    onClick={() => handleUpdateGoal(hours)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-black rounded-md transition-all",
                      dailyGoalHours === hours 
                        ? "bg-emerald-500 text-black shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-5 pt-0 space-y-6">
            {/* Stats section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-white/5 pb-5">
              <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-center space-x-4">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold">TOTAL TIME FOCUSED</p>
                  <p className="text-xl font-black text-foreground mt-0.5">{totalFocusHours} <span className="text-xs text-muted-foreground font-semibold">Hours</span></p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-center space-x-4">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold">DAILY TARGET REACHED</p>
                  <p className="text-xl font-black text-foreground mt-0.5">
                    {Object.values(focusSeconds).filter(sec => sec >= dailyGoalHours * 3600).length} <span className="text-xs text-muted-foreground font-semibold">Days</span>
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-center space-x-4">
                <div className="p-2.5 bg-amber-500/10 rounded-xl">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold">PLANNED MILESTONES</p>
                  <p className="text-xl font-black text-foreground mt-0.5">
                    {dynamicSchedules.filter(s => s.completed).length}/{dynamicSchedules.length} <span className="text-xs text-muted-foreground font-semibold">Completed</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Heatmap Grid Wrapper */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[640px] flex items-start space-x-3">
                {/* Y-axis weekday labels */}
                <div className="grid grid-rows-7 h-[116px] text-[10px] font-bold text-muted-foreground/60 pr-1 select-none">
                  <span>Sun</span>
                  <span className="opacity-0">Mon</span>
                  <span>Tue</span>
                  <span className="opacity-0">Wed</span>
                  <span>Thu</span>
                  <span className="opacity-0">Fri</span>
                  <span>Sat</span>
                </div>

                {/* Heatmap Cells */}
                <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1.5 auto-cols-max">
                  {heatmapDays.map((day, idx) => {
                    const isToday = day.date.toLocaleDateString() === new Date().toLocaleDateString();
                    // Determine intensity (0 to 4)
                    let intensity = 0;
                    if (day.minutes > 0) {
                      if (day.minutes <= 15) intensity = 1;
                      else if (day.minutes <= 30) intensity = 2;
                      else if (day.minutes <= 60) intensity = 3;
                      else intensity = 4;
                    }

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "w-3.5 h-3.5 rounded-sm transition-all duration-300 relative group cursor-pointer",
                          intensity === 0 && "bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 hover:bg-neutral-300/50 dark:hover:bg-white/10",
                          intensity === 1 && "bg-emerald-500/20 border border-emerald-500/10 hover:bg-emerald-500/35",
                          intensity === 2 && "bg-emerald-500/45 border border-emerald-500/20 hover:bg-emerald-500/60",
                          intensity === 3 && "bg-emerald-500/70 border border-emerald-500/35 hover:bg-emerald-500/85",
                          intensity === 4 && "bg-emerald-500 border border-emerald-500/50 hover:opacity-85",
                          isToday && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                        )}
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 bg-popover border border-border text-foreground px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none uppercase tracking-wider">
                          {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          <span className="block text-[9px] text-emerald-400 lowercase mt-0.5">
                            {day.minutes} min focused {day.minutes >= dailyGoalHours * 60 ? '🏆' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-end space-x-1.5 mt-3 text-[10px] font-bold text-muted-foreground select-none">
                <span>Less</span>
                <div className="w-2.5 h-2.5 rounded-sm bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/45" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>More</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── CALENDAR WORKSPACE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Month Calendar View */}
          <Card className="lg:col-span-3 glass-card border-0 bg-card/30 backdrop-blur-xl border-white/5 shadow-xl">
            <CardHeader className="p-5 flex flex-row items-center justify-between border-b border-white/5">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <CalendarIcon className="w-5 h-5 text-primary" />
                {monthName} {currentYear}
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} className="w-8 h-8 rounded-lg border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth} className="w-8 h-8 rounded-lg border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Header labels */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayLabel => (
                  <div key={dayLabel} className="text-center text-[10px] sm:text-xs font-bold text-muted-foreground/60 uppercase tracking-wider py-1 sm:py-2 select-none">
                    {dayLabel}
                  </div>
                ))}

                {/* Day Cells */}
                {calendarCells.map((dateObj, cellIdx) => {
                  if (!dateObj) {
                    return <div key={`empty-${cellIdx}`} className="aspect-square bg-card/10 border border-border/5 rounded-xl opacity-40" />;
                  }

                  const dayNum = dateObj.getDate();
                  const dateStr = dateObj.toLocaleDateString('en-CA');
                  const isToday = dateObj.toLocaleDateString() === new Date().toLocaleDateString();

                  // Get milestones scheduled for this day
                  const dayMilestones = dynamicSchedules.filter(item => item.date === dateStr);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleOpenAddModal(dateObj)}
                      className={cn(
                        "aspect-square p-1.5 sm:p-2.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none group min-h-[75px] sm:min-h-[90px]",
                        isToday 
                          ? "bg-primary/5 border-primary/25 hover:bg-primary/10 hover:border-primary/40" 
                          : "bg-card/45 border-border/40 hover:bg-card/85 hover:border-border/70"
                      )}
                    >
                      {/* Day Label */}
                      <span className={cn(
                        "text-xs sm:text-sm font-black select-none self-start",
                        isToday ? "text-primary" : "text-foreground/75"
                      )}>
                        {dayNum}
                      </span>

                      {/* Milestones list container */}
                      <div className="flex-1 flex flex-col justify-end gap-1 mt-1 overflow-y-auto">
                        {dayMilestones.slice(0, 2).map(item => (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMilestone(item.id);
                            }}
                            className={cn(
                              "text-[8px] sm:text-[10px] px-1.5 py-0.5 sm:py-1 rounded-md border flex items-center justify-between font-semibold group/pill transition-all",
                              item.completed 
                                ? "bg-success/8 border-success/30 text-success line-through opacity-75 hover:bg-success/12"
                                : "bg-primary/10 border-primary/25 text-primary hover:bg-primary/15"
                            )}
                            title={`${item.roadmapTitle} - ${item.stepTitle}`}
                          >
                            <span className="truncate pr-1">
                              {item.completed && "✓ "}{item.stepTitle}
                            </span>
                            <button
                              onClick={(e) => handleDeleteMilestone(item.id, e)}
                              className="opacity-0 group-hover/pill:opacity-100 text-muted-foreground hover:text-destructive shrink-0 ml-1 transition-opacity"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                        {dayMilestones.length > 2 && (
                          <div className="text-[7px] sm:text-[9px] text-muted-foreground text-center font-bold font-sans">
                            +{dayMilestones.length - 2} More
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right sidebar — Upcoming Checklist */}
          <div className="space-y-6">
            <Card className="glass-card border-0 bg-card/30 backdrop-blur-xl border-white/5 shadow-xl">
              <CardHeader className="p-4 sm:p-5 border-b border-white/5">
                <CardTitle className="text-sm font-black flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <Target className="w-4.5 h-4.5 text-primary" />
                  Upcoming Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 max-h-[380px] overflow-y-auto space-y-3">
                {dynamicSchedules.filter(s => !s.completed).length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground italic font-semibold">
                    No upcoming learning targets. Click a day on the calendar to schedule one!
                  </div>
                ) : (
                  dynamicSchedules
                    .filter(s => !s.completed)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleToggleMilestone(item.id)}
                        className="p-3 rounded-xl bg-neutral-50 dark:bg-white/3 border border-neutral-200 dark:border-white/5 hover:bg-neutral-100 dark:hover:bg-white/5 hover:border-neutral-300 dark:hover:border-white/10 cursor-pointer flex items-start justify-between gap-3 group transition-all"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">{item.stepTitle}</h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium truncate">{item.roadmapTitle}</p>
                          <span className="inline-block text-[8px] bg-primary/10 border border-primary/15 text-primary px-1.5 py-0.5 rounded-md mt-1.5 font-bold uppercase">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleDeleteMilestone(item.id, e)}
                          className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-0 bg-card/30 backdrop-blur-xl border-white/5 shadow-xl">
              <CardHeader className="p-4 sm:p-5 border-b border-white/5">
                <CardTitle className="text-sm font-black flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <Award className="w-4.5 h-4.5 text-success" />
                  Completed Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 max-h-[220px] overflow-y-auto space-y-2.5">
                {dynamicSchedules.filter(s => s.completed).length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground italic font-semibold">
                    Complete scheduled steps to display your study trophy list!
                  </div>
                ) : (
                  dynamicSchedules
                    .filter(s => s.completed)
                    .map(item => (
                      <div 
                        key={item.id}
                        className="p-2.5 rounded-lg bg-success/5 border border-success/15 flex items-center justify-between text-xs text-success font-semibold"
                      >
                        <span className="truncate pr-2 line-through opacity-75">{item.stepTitle}</span>
                        <CheckCircle className="w-4 h-4 shrink-0" />
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>

        </div>

      </div>

      {/* ── SCHEDULE MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-card/90 border border-white/10 shadow-2xl p-6 sm:p-7 rounded-3xl max-w-sm w-full relative">
            <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2 mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Plus className="w-5 h-5 text-primary" />
              Schedule Learning Milestone
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-5">
              Target Date: {new Date(selectedDayStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            {roadmaps.length === 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground text-center py-4 font-medium leading-relaxed">
                  No active roadmaps found! You need to generate a learning roadmap first before you can schedule milestones.
                </p>
                <Button 
                  onClick={() => navigate('/query-form')}
                  className="w-full font-bold h-11 bg-gradient-primary border-0 text-white"
                >
                  Create Learning Path
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Roadmap Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Roadmap</label>
                  <select
                    value={selectedRoadmapId}
                    onChange={(e) => {
                      setSelectedRoadmapId(e.target.value);
                      setSelectedStepIdx(0);
                    }}
                    className="w-full bg-card border border-white/10 hover:border-white/20 p-2.5 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-primary transition-all text-foreground"
                  >
                    {roadmaps.map(roadmap => (
                      <option key={roadmap._id} value={roadmap._id}>{roadmap.skill}</option>
                    ))}
                  </select>
                </div>

                {/* Step Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Level Step</label>
                  <select
                    value={selectedStepIdx}
                    onChange={(e) => setSelectedStepIdx(parseInt(e.target.value))}
                    className="w-full bg-card border border-white/10 hover:border-white/20 p-2.5 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-primary transition-all text-foreground"
                  >
                    {roadmaps
                      .find(r => r._id === selectedRoadmapId)
                      ?.steps?.map((step: any, idx: number) => (
                        <option key={idx} value={idx}>Level {idx + 1}: {step.title}</option>
                      )) || <option>No levels found</option>}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAddMilestone}
                    className="flex-1 font-bold h-11 bg-gradient-primary border-0 text-white shadow-glow hover:scale-102 transition-transform"
                  >
                    Add to Calendar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="font-bold h-11 border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground px-4"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
