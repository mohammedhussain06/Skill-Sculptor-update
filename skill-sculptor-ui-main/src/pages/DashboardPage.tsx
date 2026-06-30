import { useEffect, useState } from "react";
import API from '../../api/axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { User, TrendingUp, Target, Clock, BookOpen, Award, ArrowRight, Plus, BarChart3, CheckCircle, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedCounter } from "@/components/effects/AnimatedCounter";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
        if (!storedUser._id) {
          navigate("/login");
          return;
        }

        setUser(storedUser);
        const { data } = await API.get(`/dashboard/${storedUser._id}`);
        const allRoadmaps = await API.get(`/roadmap/user/${storedUser._id}/all`).then(r => r.data?.roadmaps || []).catch(() => []);

        // No roadmap → redirect to query-form
        if (!data.hasRoadmap) {
          navigate("/query-form");
          return;
        }

        setDashboard({ ...data.dashboard, _allRoadmapsCount: allRoadmaps.length });
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    
    // Refresh dashboard data every 30 seconds to keep it dynamic
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Anime.js entry stagger animation for stats and cards
  useEffect(() => {
    if (loading || !dashboard) return;
    (async () => {
      try {
        const anime = (await import('animejs')).default;
        anime({
          targets: '.dashboard-stagger-item',
          translateY: [20, 0],
          opacity: [0, 1],
          delay: anime.stagger(90, { start: 100 }),
          duration: 650,
          easing: 'easeOutExpo',
        });
      } catch { /* skip */ }
    })();
  }, [loading, dashboard]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background/50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-lg">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background/50">
        <p className="text-muted-foreground text-lg">No dashboard data found.</p>
      </div>
    );
  }

  const populatedFirst = dashboard.savedRoadmaps?.[0]?.roadmapId || null;
  const steps = populatedFirst?.steps || [];
  const currentStepObj = steps.find((s: any) => s.status === 'current') || steps[0];
  const currentIndex = currentStepObj ? steps.indexOf(currentStepObj) : -1;
  const nextStepObj = currentIndex >= 0 && currentIndex + 1 < steps.length ? steps[currentIndex + 1] : null;

  // Calculate estimated completion based on remaining steps and average time per step
  const calculateEstimatedCompletion = () => {
    if (!steps.length) return "—";
    
    const completedSteps = steps.filter((s: any) => s.status === 'completed').length;
    const remainingSteps = steps.length - completedSteps;
    
    if (remainingSteps === 0) return "Completed! 🎉";
    
    // Estimate 2-3 days per step based on difficulty
    const avgDaysPerStep = 2.5;
    const estimatedDays = Math.ceil(remainingSteps * avgDaysPerStep);
    
    if (estimatedDays === 1) return "1 day";
    if (estimatedDays < 7) return `${estimatedDays} days`;
    if (estimatedDays < 30) return `${Math.ceil(estimatedDays / 7)} weeks`;
    return `${Math.ceil(estimatedDays / 30)} months`;
  };

  // Calculate current streak based on recent activity
  const calculateCurrentStreak = () => {
    if (!dashboard.completedSteps?.length) return 0;
    
    const sortedSteps = dashboard.completedSteps
      .filter((step: any) => step.completedAt)
      .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    if (!sortedSteps.length) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const step of sortedSteps) {
      const stepDate = new Date(step.completedAt);
      stepDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate.getTime() - stepDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (daysDiff === streak + 1) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Calculate local progress based on localStorage checklists (syncing with user activity!)
  const calculateLocalProgress = (roadmapSteps: any[], rId: string) => {
    if (!roadmapSteps || roadmapSteps.length === 0) return 0;
    let totalResources = 0;
    let completedResources = 0;

    roadmapSteps.forEach((step, stepIndex) => {
      if (step.resources && step.resources.length > 0) {
        totalResources += step.resources.length;
        const key = `completed_resources_${rId}_${stepIndex}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const completedSet = new Set(JSON.parse(saved));
          completedResources += completedSet.size;
        }
      }
    });

    return totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;
  };

  // Find currently learning and next milestone step dynamically based on local progress
  const getLocalStepProgression = (roadmapSteps: any[], rId: string) => {
    if (!roadmapSteps || roadmapSteps.length === 0) {
      return { currentStep: "Start learning soon", nextMilestone: "Next module" };
    }
    
    // Find the first step that is not 100% completed locally
    let currentIdx = 0;
    for (let i = 0; i < roadmapSteps.length; i++) {
      const step = roadmapSteps[i];
      const total = step.resources?.length || 0;
      const key = `completed_resources_${rId}_${i}`;
      const saved = localStorage.getItem(key);
      const completed = saved ? JSON.parse(saved).length : 0;
      
      if (total > 0 && completed < total) {
        currentIdx = i;
        break;
      }
      if (i === roadmapSteps.length - 1) {
        currentIdx = roadmapSteps.length - 1;
      }
    }
    
    const currentStepObj = roadmapSteps[currentIdx];
    const nextStepObj = currentIdx + 1 < roadmapSteps.length ? roadmapSteps[currentIdx + 1] : null;
    
    return {
      currentStep: currentStepObj?.title || "Start learning soon",
      nextMilestone: nextStepObj?.title || "All levels conquered! 🏆"
    };
  };

  const localProgression = getLocalStepProgression(steps, populatedFirst?._id || '');
  const localProgressPercent = populatedFirst?._id ? calculateLocalProgress(steps, populatedFirst._id) : 0;

  const currentRoadmap = {
    skill: populatedFirst?.skill || "No skill yet",
    progress: localProgressPercent,
    currentStep: localProgression.currentStep,
    nextMilestone: localProgression.nextMilestone,
    estimatedCompletion: calculateEstimatedCompletion()
  };

  // Calculate local completion metrics
  const localCompletedStepsCount = steps.filter((step: any, stepIdx: number) => {
    const total = step.resources?.length || 0;
    const key = `completed_resources_${populatedFirst?._id || ''}_${stepIdx}`;
    const saved = localStorage.getItem(key);
    const completed = saved ? JSON.parse(saved).length : 0;
    return total > 0 && completed === total;
  }).length;

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

  const localStreak = calculateLocalStreak();

  const stats = [
    { label: "Current Streak", value: localStreak, unit: "days", icon: TrendingUp, color: "text-success", badgeGlow: "bg-cyan-500/10 border-cyan-500/15" },
    { label: "Skills Learning", value: dashboard.savedRoadmaps?.length || 0, unit: "active", icon: Target, color: "text-primary", badgeGlow: "bg-primary/10 border-primary/15" },
    { label: "Milestones", value: localCompletedStepsCount, unit: "completed", icon: Award, color: "text-secondary", badgeGlow: "bg-amber-500/10 border-amber-500/15" }
  ];

  // Enhanced recent activities with better formatting and more activity types (synced locally!)
  const getRecentActivities = () => {
    const rawLog = localStorage.getItem('completed_activities_log');
    const log = rawLog ? JSON.parse(rawLog) : [];
    
    const activities = log
      .slice(-3) // Get latest 3 activities
      .reverse()
      .map((item: any) => {
        const itemDate = new Date(item.timestamp);
        const relativeDate = isNaN(itemDate.getTime()) 
          ? "—" 
          : itemDate.toLocaleDateString() === new Date().toLocaleDateString()
          ? "Today"
          : itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
          date: relativeDate,
          activity: `Completed "${item.title}" in ${item.roadmapTitle}`,
          type: "completion",
          icon: CheckCircle,
          color: "text-success"
        };
      });

    // If log has fewer than 3 entries, add starting roadmap activity
    if (activities.length === 0 && dashboard.savedRoadmaps?.length) {
      activities.push({
        date: "Today",
        activity: `Started learning ${populatedFirst?.skill || "new skill"}`,
        type: "roadmap_creation",
        icon: Target,
        color: "text-primary"
      });
    }

    // Fill with placeholder if needed
    while (activities.length < 3) {
      activities.push({
        date: "—",
        activity: "No activities yet",
        type: "placeholder",
        icon: Clock,
        color: "text-muted-foreground"
      });
    }

    return activities;
  };

  const recentActivities = getRecentActivities();

  const multipleRoadmaps = (dashboard._allRoadmapsCount || (dashboard.savedRoadmaps?.length || 0)) > 1;
  
  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = () => {
    console.log("Delete account clicked");
  };

  // Determine the correct route for Continue Learning
  const continueLearningRoute = multipleRoadmaps 
    ? "/roadmaps" 
    : (populatedFirst?._id ? `/roadmap/${populatedFirst._id}` : "/roadmaps");

  const quickActions = [
    { title: "Continue Learning", description: multipleRoadmaps ? "Choose from your saved roadmaps" : "Resume your current roadmap", icon: BookOpen, action: continueLearningRoute, variant: "default", onClick: null },
    { title: "Create New Roadmap", description: "Start learning a new skill", icon: Plus, action: "/query-form?new=1", variant: "secondary", onClick: null },
    { title: "View Analytics", description: "Track your progress", icon: BarChart3, action: "/progress", variant: "outline", onClick: null },
    { title: "Logout", description: "Sign out of your account", icon: LogOut, action: "#", variant: "outline", onClick: handleLogout },
    { title: "Delete Account", description: "Permanently delete your account", icon: Trash2, action: "#", variant: "destructive", onClick: handleDeleteAccount }
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden">
      {/* Decorative floating bg elements */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl floating-bg" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl floating-bg-delayed" />

      <div className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Greeting & Stats */}
          <div className="mb-6 sm:mb-8 md:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 dashboard-stagger-item" style={{ opacity: 0 }}>
              <div className="achievement-badge p-2.5 sm:p-3.5 shrink-0 bg-gradient-primary">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold break-words tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Welcome back, <span className="gradient-text">{user?.username || "Learner"}</span>! 👋
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 font-medium">Ready to continue your learning journey?</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 min-h-[90px] sm:min-h-[100px] md:min-h-[120px] dashboard-stagger-item shadow-xl" style={{ opacity: 0 }}>
                  <CardContent className="p-4 sm:p-5 md:p-6 flex justify-between items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate font-medium">{stat.label}</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-extrabold break-words tracking-tight mt-1 flex items-baseline gap-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        <AnimatedCounter value={stat.value} duration={1200} />
                        <span className="text-xs sm:text-sm font-semibold text-muted-foreground">{stat.unit}</span>
                      </p>
                      {stat.label === "Current Streak" && stat.value > 0 && (
                        <p className="text-[11px] text-green-400 mt-1 font-semibold">🔥 Keep it up!</p>
                      )}
                      {stat.label === "Milestones" && stat.value > 0 && (
                        <p className="text-[11px] text-cyan-400 mt-1 font-semibold">🎯 Great progress!</p>
                      )}
                    </div>
                    <div className={`p-3.5 rounded-xl border shrink-0 ${stat.badgeGlow}`}>
                      <stat.icon className={cn("w-5 h-5 icon-pulse", stat.color)} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Current Roadmap Card */}
              <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 dashboard-stagger-item shadow-xl" style={{ opacity: 0 }}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2">
                    <Target className="w-5 h-5 text-primary shrink-0" />
                    <span className="break-words">Current Learning Path</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 break-words">Your progress in {currentRoadmap.skill}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground font-semibold">{currentRoadmap.progress}%</span>
                  </div>
                  <Progress value={currentRoadmap.progress} className="h-2 sm:h-3 progress-fun" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3.5 sm:p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">Currently Learning</p>
                      <p className="font-bold text-primary text-sm sm:text-base break-words mt-1">{currentRoadmap.currentStep}</p>
                    </div>
                    <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">Next Milestone</p>
                      <p className="font-bold text-sm sm:text-base break-words mt-1">{currentRoadmap.nextMilestone}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span className="text-xs sm:text-sm break-words font-medium">Est. completion: {currentRoadmap.estimatedCompletion}</span>
                    </div>
                    <Button asChild className="bg-gradient-primary hover:opacity-90 border-0 w-full sm:w-auto text-sm sm:text-base font-semibold shadow-neon-sm">
                      <Link to={multipleRoadmaps ? "/roadmaps" : (populatedFirst?._id ? `/roadmap/${populatedFirst._id}` : "/roadmap")} className="flex items-center justify-center space-x-2">
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 dashboard-stagger-item shadow-xl" style={{ opacity: 0 }}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-secondary shrink-0" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your latest learning milestones</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {recentActivities.map((activity, i) => (
                      <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className={`p-1.5 rounded-full bg-primary/10 mt-0.5 shrink-0 ${activity.color}`}>
                          <activity.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold break-words text-foreground">{activity.activity}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/10 mt-4">
                    <Button variant="outline" className="w-full text-sm sm:text-base border-white/10 hover:bg-white/10 font-semibold" onClick={() => navigate('/progress')}>
                      <BarChart3 className="w-4 h-4 mr-2 text-cyan-400" />
                      View Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Actions */}
              <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 dashboard-stagger-item shadow-xl" style={{ opacity: 0 }}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>🚀 Quick Actions</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-2.5">
                  {quickActions.map((action, i) => {
                    const isDestructive = action.variant === "destructive";
                    const isDefault = action.variant === "default";
                    if (action.onClick) {
                      return (
                        <Button 
                          key={i} 
                          variant={action.variant} 
                          onClick={action.onClick}
                          className={cn(
                            "w-full justify-start h-auto p-3 text-xs sm:text-sm border transition-all duration-200",
                            isDefault && "btn-student bg-gradient-primary hover:opacity-90 border-0 text-white font-bold shadow-neon-sm",
                            isDestructive && "border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive font-semibold hover:border-destructive/40",
                            !isDefault && !isDestructive && "border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-semibold hover:border-white/20"
                          )}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <action.icon className="w-4.5 h-4.5 shrink-0" />
                            <div className="text-left min-w-0 flex-1">
                              <p className="font-bold text-xs sm:text-sm break-words">{action.title}</p>
                              <p className="text-xs text-muted-foreground break-words line-clamp-1 mt-0.5 font-medium">{action.description}</p>
                            </div>
                          </div>
                        </Button>
                      );
                    } else {
                      return (
                        <Button 
                          key={i} 
                          variant={action.variant} 
                          asChild 
                          className={cn(
                            "w-full justify-start h-auto p-3 text-xs sm:text-sm border transition-all duration-200",
                            isDefault && "btn-student bg-gradient-primary hover:opacity-90 border-0 text-white font-bold shadow-neon-sm",
                            isDestructive && "border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive font-semibold hover:border-destructive/40",
                            !isDefault && !isDestructive && "border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-semibold hover:border-white/20"
                          )}
                        >
                          <Link to={action.action}>
                            <div className="flex items-center space-x-3 w-full">
                              <action.icon className="w-4.5 h-4.5 shrink-0" />
                              <div className="text-left min-w-0 flex-1">
                                <p className="font-bold text-xs sm:text-sm break-words">{action.title}</p>
                                <p className="text-xs text-muted-foreground break-words line-clamp-1 mt-0.5 font-medium">{action.description}</p>
                              </div>
                            </div>
                          </Link>
                        </Button>
                      );
                    }
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
