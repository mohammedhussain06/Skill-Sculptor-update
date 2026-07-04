import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, TrendingUp, Target, Award, Clock, BookOpen, Calendar, BarChart3, Brain, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import API from '../../api/axios';
import { AnimatedCounter } from '@/components/effects/AnimatedCounter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (!user._id) {
          navigate('/login');
          return;
        }

        // Fetch dashboard, roadmaps, and quiz attempts
        const dashboardRes = await API.get(`/dashboard/${user._id}`);
        const roadmapsRes = await API.get(`/roadmap/user/${user._id}/all`).catch(() => ({ data: { roadmaps: [] } }));
        const attemptsRes = await API.get('/quiz/user/attempts').catch(() => ({ data: { attempts: [] } }));
        
        setQuizAttempts(attemptsRes.data.attempts || []);

        const dashboard = dashboardRes.data.dashboard;
        let roadmaps = dashboard.savedRoadmaps?.map((sr: any) => sr.roadmapId).filter(Boolean) || [];
        if (roadmaps.length === 0) {
          roadmaps = roadmapsRes.data.roadmaps || [];
        }

        // Load cached AI insights if they exist
        const cached = localStorage.getItem('ai_analytics_insights');
        if (cached) {
          try {
            setInsights(JSON.parse(cached));
          } catch (e) {
            localStorage.removeItem('ai_analytics_insights');
          }
        }

        // Calculate dynamic localStorage-synced progress metrics
        const syncLocalMetrics = () => {
          let totalResources = 0;
          let completedResources = 0;
          let completedStepsCount = 0;
          let totalStepsCount = 0;

          const skillDistribution = roadmaps.map((roadmap: any) => {
            let roadmapTotalRes = 0;
            let roadmapCompletedRes = 0;
            let roadmapCompletedSteps = 0;
            const roadmapStepsList = roadmap.steps || [];
            totalStepsCount += roadmapStepsList.length;

            roadmapStepsList.forEach((step: any, stepIndex: number) => {
              const resCount = step.resources?.length || 0;
              if (resCount > 0) {
                roadmapTotalRes += resCount;
                const key = `completed_resources_${roadmap._id}_${stepIndex}`;
                const saved = localStorage.getItem(key);
                if (saved) {
                  const completedSet = new Set(JSON.parse(saved));
                  roadmapCompletedRes += completedSet.size;
                  if (completedSet.size === resCount) {
                    roadmapCompletedSteps++;
                  }
                }
              }
            });

            totalResources += roadmapTotalRes;
            completedResources += roadmapCompletedRes;
            completedStepsCount += roadmapCompletedSteps;

            const progressPercent = roadmapTotalRes > 0 
              ? Math.round((roadmapCompletedRes / roadmapTotalRes) * 100) 
              : 0;

            return {
              skill: roadmap.skill,
              progress: progressPercent,
              completed: roadmapCompletedSteps,
              total: roadmapStepsList.length
            };
          });

          const overallCompletionRate = totalResources > 0 
            ? Math.round((completedResources / totalResources) * 100) 
            : 0;

          // Calculate local weekly activity from the global log
          const getLocalWeeklyProgress = () => {
            const rawLog = localStorage.getItem('completed_activities_log');
            const log = rawLog ? JSON.parse(rawLog) : [];
            const weeklyData = [];
            const today = new Date();
            
            for (let i = 6; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              date.setHours(0, 0, 0, 0);
              
              const dayChecksCount = log.filter((item: any) => {
                if (!item.timestamp) return false;
                const itemDate = new Date(item.timestamp);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() === date.getTime();
              }).length;
              
              weeklyData.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                steps: dayChecksCount,
                date: date.toLocaleDateString()
              });
            }
            return weeklyData;
          };

          // Calculate local learning streak from activity log
          const calculateLocalStreak = () => {
            const rawLog = localStorage.getItem('completed_activities_log');
            const log = rawLog ? JSON.parse(rawLog) : [];
            if (!log.length) return 0;
            
            const uniqueDates = Array.from(new Set(log.map((item: any) => {
              if (!item.timestamp) return '';
              const date = new Date(item.timestamp);
              date.setHours(0, 0, 0, 0);
              return date.getTime();
            })))
            .filter(Boolean)
            .sort((a: any, b: any) => b - a);

            if (!uniqueDates.length) return 0;

            let streak = 0;
            let checkDate = new Date();
            checkDate.setHours(0, 0, 0, 0);

            const latestLogTime = uniqueDates[0] as number;
            const diffDays = Math.floor((checkDate.getTime() - latestLogTime) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) return 0;

            for (const logTime of uniqueDates) {
              const diff = Math.floor((checkDate.getTime() - (logTime as number)) / (1000 * 60 * 60 * 24));
              if (diff === 0 || diff === 1) {
                streak++;
                checkDate.setTime(logTime as number);
              } else {
                break;
              }
            }
            return streak;
          };

          return {
            completedSteps: completedStepsCount,
            totalSteps: totalStepsCount,
            completionRate: overallCompletionRate,
            weeklyProgress: getLocalWeeklyProgress(),
            skillDistribution,
            currentStreak: calculateLocalStreak()
          };
        };

        const localMetrics = syncLocalMetrics();

        setAnalytics({
          totalRoadmaps: roadmaps.length,
          totalSteps: localMetrics.totalSteps,
          completedSteps: localMetrics.completedSteps,
          completionRate: localMetrics.completionRate,
          currentStreak: localMetrics.currentStreak,
          weeklyProgress: localMetrics.weeklyProgress,
          skillDistribution: localMetrics.skillDistribution,
          averageTimePerStep: localMetrics.completedSteps > 0 ? Number((14 / localMetrics.completedSteps).toFixed(1)) : 0,
          roadmapsRaw: roadmaps
        });

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  // Anime.js entry stagger animation
  useEffect(() => {
    if (loading || !analytics) return;
    (async () => {
      try {
        const anime = (await import('animejs')).default;
        anime({
          targets: '.progress-stagger-item',
          translateY: [20, 0],
          opacity: [0, 1],
          delay: anime.stagger(80, { start: 100 }),
          duration: 700,
          easing: 'easeOutExpo',
        });
      } catch { /* skip */ }
    })();
  }, [loading, analytics]);

  // Automatically request AI insights if not cached once analytics are loaded
  useEffect(() => {
    if (analytics && !insights && !generatingInsights) {
      generateAiInsights();
    }
  }, [analytics]);

  const generateAiInsights = async () => {
    setGeneratingInsights(true);
    try {
      const rawFocus = localStorage.getItem('study_focus_seconds_log');
      const focusLogs = rawFocus ? JSON.parse(rawFocus) : {};

      const response = await API.post('/ai/analytics-insights', {
        focusLogs
      });
      
      const newInsights = response.data.insights;
      setInsights(newInsights);
      localStorage.setItem('ai_analytics_insights', JSON.stringify(newInsights));
      toast.success("AI Analytics updated! 🔮");
    } catch (err: any) {
      console.error("AI insights generation error:", err);
      toast.error("Failed to generate AI study insights");
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Helper: Render interactive SVG learning curve
  const renderLearningCurve = () => {
    const dataPoints = insights?.learningCurve || [
      { session: "Start", progress: 10, isPredicted: false },
      { session: "S1", progress: 25, isPredicted: false },
      { session: "S2", progress: 40, isPredicted: false },
      { session: "S3 (AI)", progress: 60, isPredicted: true },
      { session: "S4 (AI)", progress: 80, isPredicted: true }
    ];

    const width = 500;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 40;
    const paddingTop = 25;
    const paddingBottom = 35;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const points = dataPoints.map((pt: any, idx: number) => {
      const x = paddingLeft + (idx / (dataPoints.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (pt.progress / 100) * chartHeight;
      return { ...pt, x, y };
    });
    
    let pathD = `M ${points[0].x} ${points[0].y}`;
    let predictedPathD = "";
    
    points.forEach((pt: any, idx: number) => {
      if (idx === 0) return;
      if (!pt.isPredicted) {
        pathD += ` L ${pt.x} ${pt.y}`;
      } else {
        if (!predictedPathD) {
          const lastHist = points[idx - 1];
          predictedPathD = `M ${lastHist.x} ${lastHist.y} L ${pt.x} ${pt.y}`;
        } else {
          predictedPathD += ` L ${pt.x} ${pt.y}`;
        }
      }
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 sm:h-64 overflow-visible">
        {/* Y Axis Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = paddingTop + chartHeight - (val / 100) * chartHeight;
          return (
            <g key={val} className="opacity-10 text-foreground">
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3" />
              <text x={paddingLeft - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-muted-foreground font-bold font-sans">{val}%</text>
            </g>
          );
        })}
        
        {/* Historical Solid Line */}
        <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_2px_8px_rgba(99,102,241,0.2)]" />
        
        {/* Predicted Dashed Line */}
        {predictedPathD && (
          <path d={predictedPathD} fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" />
        )}
        
        {/* Data points */}
        {points.map((pt: any, idx: number) => (
          <g key={idx} className="group/dot cursor-pointer">
            <circle cx={pt.x} cy={pt.y} r="5" className={cn(pt.isPredicted ? "fill-secondary stroke-background" : "fill-primary stroke-background")} strokeWidth="2" />
            <circle cx={pt.x} cy={pt.y} r="9" className={cn(pt.isPredicted ? "fill-secondary/20" : "fill-primary/20", "opacity-0 group-hover/dot:opacity-100 transition-opacity")} />
            
            {/* X-axis labels */}
            <text x={pt.x} y={height - 8} textAnchor="middle" className="text-[9px] fill-muted-foreground font-bold uppercase tracking-wider">{pt.session}</text>
            
            {/* Tooltip hover */}
            <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
              <rect x={pt.x - 30} y={pt.y - 30} width="60" height="20" rx="4" className="fill-popover border border-border/10 shadow-md" strokeWidth="1" />
              <text x={pt.x} y={pt.y - 17} textAnchor="middle" className="text-[10px] fill-foreground font-black">{pt.progress}%</text>
            </g>
          </g>
        ))}
      </svg>
    );
  };

  // Helper: Render Focus Logs vs Checked Steps Distribution
  const renderFocusVsCompleted = () => {
    const rawFocus = localStorage.getItem('study_focus_seconds_log');
    const focusLogs = rawFocus ? JSON.parse(rawFocus) : {};

    const past7Days = analytics?.weeklyProgress || [];
    
    return (
      <div className="space-y-4">
        {past7Days.map((day: any, i: number) => {
          let focusSeconds = 0;
          try {
            const dateParts = day.date.split("/");
            // Format can be MM/DD/YYYY or DD/MM/YYYY depending on browser environment, let's normalize
            const dateObj = new Date(day.date);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            focusSeconds = focusLogs[dateStr] || 0;
          } catch(e) {
            focusSeconds = 0;
          }

          const focusMinutes = Math.round(focusSeconds / 60);
          
          return (
            <div key={i} className="space-y-1 sm:space-y-1.5 p-2.5 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span className="text-foreground">{day.day}</span>
                <span className="text-[10px] flex gap-2">
                  <span className="text-primary-foreground font-medium">⏱️ {focusMinutes}m focused</span>
                  <span className="text-secondary font-medium">✓ {day.steps} steps</span>
                </span>
              </div>
              <div className="space-y-1">
                {/* Focus progress bar (Blue) */}
                <div className="h-1.5 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-primary h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((focusMinutes / 60) * 100, 100)}%` }} 
                  />
                </div>
                {/* Steps progress bar (Emerald) */}
                <div className="h-1.5 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((day.steps / 3) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground text-sm font-medium">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No analytics data available.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: "Learning Streak", 
      value: analytics.currentStreak, 
      unit: "days", 
      icon: TrendingUp, 
      color: "text-orange-400",
      description: "Consecutive days of learning"
    },
    { 
      label: "Skills Learning", 
      value: analytics.totalRoadmaps, 
      unit: "active", 
      icon: Target, 
      color: "text-indigo-400",
      description: "Different skills in progress"
    },
    { 
      label: "Steps Completed", 
      value: analytics.completedSteps, 
      unit: "total", 
      icon: Award, 
      color: "text-emerald-400",
      description: "Learning milestones achieved"
    },
    { 
      label: "Completion Rate", 
      value: analytics.completionRate, 
      unit: "%", 
      icon: BarChart3, 
      color: "text-cyan-400",
      description: "Overall progress percentage"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden">
      <div className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 progress-stagger-item animate-fadeInUp" style={{ opacity: 0 }}>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')} 
                className="flex items-center space-x-2 text-sm border-white/10 hover:bg-white/10 w-full sm:w-auto font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 rounded-xl bg-gradient-primary shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Learning Analytics</h1>
                  <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1.5 font-medium">Track your progress and learning patterns</p>
                </div>
              </div>
            </div>

            {/* Refresh Insights Trigger */}
            <Button
              onClick={generateAiInsights}
              disabled={generatingInsights}
              className="w-full md:w-auto font-bold h-11 bg-gradient-primary border-0 text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", generatingInsights && "animate-spin")} />
              {generatingInsights ? "Regenerating Predictions..." : "Refresh AI Predictions"}
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <Card key={i} className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 progress-stagger-item shadow-xl" style={{ opacity: 0 }}>
                <CardContent className="p-5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 break-words line-clamp-1 font-medium">{stat.description}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl sm:text-2xl font-extrabold break-words tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        <AnimatedCounter value={stat.value} duration={1200} />
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{stat.unit}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <stat.icon className={cn("w-4.5 h-4.5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Analytics & Forecast Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 progress-stagger-item" style={{ opacity: 0 }}>
            {/* Forecast Card */}
            <Card className="glass-card border-0 bg-card/45 backdrop-blur-xl border-white/5 shadow-xl flex flex-col justify-between">
              <CardHeader className="p-5 border-b border-white/5">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <Brain className="w-5 h-5 text-primary" /> AI Milestone Forecast
                </CardTitle>
                <CardDescription className="text-xs">Estimate of active target completions</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4 flex-1">
                {generatingInsights ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-semibold">Updating forecast predictions...</span>
                  </div>
                ) : insights?.milestoneForecast ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 text-center">
                        <span className="text-2xl font-black text-primary font-mono">{insights.milestoneForecast.hoursRemaining}</span>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Hours Remaining</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 text-center">
                        <span className="text-2xl font-black text-secondary font-mono">{insights.milestoneForecast.estimatedDays}</span>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Est. Days Left</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs leading-relaxed text-foreground font-medium">
                      🚀 {insights.milestoneForecast.forecastMessage}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic text-center py-6">
                    No forecast predictions computed yet. Click refresh to generate.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Velocity Card */}
            <Card className="glass-card border-0 bg-card/45 backdrop-blur-xl border-white/5 shadow-xl flex flex-col justify-between">
              <CardHeader className="p-5 border-b border-white/5">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <Zap className="w-5 h-5 text-orange-400" /> Learning Velocity
                </CardTitle>
                <CardDescription className="text-xs">Your current pace and momentum rating</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4 flex-1">
                {generatingInsights ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-semibold">Analyzing learning curves...</span>
                  </div>
                ) : insights?.learningVelocity ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider",
                        insights.learningVelocity.status === 'accelerating' ? 'bg-green-500/10 text-green-400 border border-green-500/25' :
                        insights.learningVelocity.status === 'steady' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                        'bg-red-500/10 text-red-400 border border-red-500/25'
                      )}>
                        {insights.learningVelocity.status}
                      </span>
                      <span className="text-2xl font-black text-foreground font-mono">{insights.learningVelocity.score}<span className="text-xs text-muted-foreground">/100</span></span>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/15 text-xs leading-relaxed text-foreground font-medium">
                      🎯 {insights.learningVelocity.reason}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic text-center py-6">
                    No velocity rating analyzed yet. Click refresh to generate.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations Card */}
            <Card className="glass-card border-0 bg-card/45 backdrop-blur-xl border-white/5 shadow-xl flex flex-col justify-between">
              <CardHeader className="p-5 border-b border-white/5">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <Award className="w-5 h-5 text-emerald-400" /> Next Recommended Topics
                </CardTitle>
                <CardDescription className="text-xs">Prioritizing weak subjects & pending steps</CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex-1 max-h-[220px] overflow-y-auto">
                {generatingInsights ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-semibold">Generating recommendations...</span>
                  </div>
                ) : insights?.recommendedNextTopics?.length > 0 ? (
                  <div className="space-y-3">
                    {insights.recommendedNextTopics.map((rec: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/3 border border-white/5 flex gap-2.5 items-start">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0 mt-0.5">{idx + 1}</span>
                        <div>
                          <h4 className="text-xs font-extrabold text-foreground">{rec.topic}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed font-medium">{rec.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic text-center py-6">
                    No study recommendations available yet. Click refresh to generate.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 progress-stagger-item" style={{ opacity: 0 }}>
            {/* Learning Curve SVG Chart */}
            <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 shadow-xl">
              <CardHeader className="p-4 sm:p-6 border-b border-white/5">
                <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span>AI Learning Curve</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Historical progress indexed against AI-projected future milestones</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-5">
                {renderLearningCurve()}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Historical Data
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 border-t-2 border-dashed border-secondary" /> AI Forecast (Future Sessions)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Focus Log vs Checkbox completed comparison chart */}
            <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 shadow-xl">
              <CardHeader className="p-4 sm:p-6 border-b border-white/5">
                <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                  <span>Weekly Focus vs. Check-offs</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Pomodoro time (minutes) compared against completed steps</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-5 max-h-[320px] overflow-y-auto">
                {renderFocusVsCompleted()}
              </CardContent>
            </Card>
          </div>

          {/* Skill Progress List */}
          <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 progress-stagger-item shadow-xl" style={{ opacity: 0 }}>
            <CardHeader className="p-4 sm:p-6 border-b border-white/5">
              <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                <span>Skill Roadmaps Progress</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Level completion metrics per roadmap</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {analytics.skillDistribution.map((skill: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs sm:text-sm">{skill.skill}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground font-bold">
                        {skill.completed}/{skill.total} ({skill.progress}%)
                      </span>
                    </div>
                    <Progress value={skill.progress} className="h-2 progress-fun" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
