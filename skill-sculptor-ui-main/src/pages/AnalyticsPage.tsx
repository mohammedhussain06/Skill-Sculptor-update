import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, TrendingUp, Target, Award, Clock, BookOpen, Calendar, BarChart3 } from 'lucide-react';
import API from '../../api/axios';
import { AnimatedCounter } from '@/components/effects/AnimatedCounter';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (!user._id) {
          navigate('/login');
          return;
        }

        // Fetch dashboard data for analytics
        const dashboardRes = await API.get(`/dashboard/${user._id}`);
        const roadmapsRes = await API.get(`/roadmap/user/${user._id}/all`).catch(() => ({ data: { roadmaps: [] } }));
        
        const dashboard = dashboardRes.data.dashboard;
        const roadmaps = roadmapsRes.data.roadmaps || [];

        // Calculate analytics
        const totalSteps = roadmaps.reduce((acc: number, roadmap: any) => 
          acc + (roadmap.steps?.length || 0), 0);
        
        const completedSteps = dashboard.completedSteps?.length || 0;
        const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        // Calculate learning streak
        const calculateStreak = () => {
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

        // Calculate weekly progress
        const getWeeklyProgress = () => {
          const weeklyData = [];
          const today = new Date();
          
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const daySteps = dashboard.completedSteps?.filter((step: any) => {
              const stepDate = new Date(step.completedAt);
              stepDate.setHours(0, 0, 0, 0);
              return stepDate.getTime() === date.getTime();
            }).length || 0;
            
            weeklyData.push({
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              steps: daySteps,
              date: date.toLocaleDateString()
            });
          }
          
          return weeklyData;
        };

        // Calculate skill distribution
        const getSkillDistribution = () => {
          const skillStats = roadmaps.map((roadmap: any) => {
            const completedInRoadmap = dashboard.completedSteps?.filter((step: any) => 
              step.roadmapId === roadmap._id).length || 0;
            const totalInRoadmap = roadmap.steps?.length || 0;
            const progress = totalInRoadmap > 0 ? Math.round((completedInRoadmap / totalInRoadmap) * 100) : 0;
            
            return {
              skill: roadmap.skill,
              progress,
              completed: completedInRoadmap,
              total: totalInRoadmap
            };
          });
          
          return skillStats;
        };

        setAnalytics({
          totalRoadmaps: roadmaps.length,
          totalSteps,
          completedSteps,
          completionRate,
          currentStreak: calculateStreak(),
          weeklyProgress: getWeeklyProgress(),
          skillDistribution: getSkillDistribution(),
          averageTimePerStep: dashboard.completedSteps?.length > 0 ? 
            Math.round(dashboard.completedSteps.reduce((acc: number, step: any) => {
              if (step.completedAt && step.startedAt) {
                const timeDiff = new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();
                return acc + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
              }
              return acc;
            }, 0) / dashboard.completedSteps.length) : 0
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground text-sm font-medium">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background/50 flex items-center justify-center">
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 progress-stagger-item animate-fadeInUp" style={{ opacity: 0 }}>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center space-x-2 mb-4 sm:mb-6 text-sm border-white/10 hover:bg-white/10 w-full sm:w-auto font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-primary shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Learning Analytics</h1>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1.5 font-medium">Track your progress and learning patterns</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
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

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
            {/* Weekly Progress Chart */}
            <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 progress-stagger-item shadow-xl" style={{ opacity: 0 }}>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span>Weekly Activity</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Steps completed over the past 7 days</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {analytics.weeklyProgress.map((day, i) => (
                    <div key={i} className="flex items-center space-x-2 sm:space-x-4">
                      <div className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-muted-foreground shrink-0">
                        {day.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-white/5 border border-white/10 rounded-full h-2 min-w-0">
                            <div 
                              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((day.steps / Math.max(...analytics.weeklyProgress.map(d => d.steps)) || 1) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-medium w-6 sm:w-8 text-right shrink-0">
                            {day.steps}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                  <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
                    Total this week: {analytics.weeklyProgress.reduce((acc, day) => acc + day.steps, 0)} steps completed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Skill Distribution */}
            <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 progress-stagger-item shadow-xl" style={{ opacity: 0 }}>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                  <span>Skill Progress</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Progress across different skills</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {analytics.skillDistribution.map((skill, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                        <span className="font-medium text-xs sm:text-sm break-words">{skill.skill}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground shrink-0 font-semibold">
                          {skill.completed}/{skill.total} ({skill.progress}%)
                        </span>
                      </div>
                      <Progress value={skill.progress} className="h-1.5 sm:h-2 progress-fun" />
                    </div>
                  ))}
                </div>
                {analytics.skillDistribution.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No skills data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Learning Insights */}
          <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 progress-stagger-item shadow-xl" style={{ opacity: 0 }}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <TrendingUp className="w-5 h-5 text-primary shrink-0" />
                <span>Learning Insights</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Personalized insights based on your learning patterns</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <h4 className="font-bold text-primary mb-1.5 sm:mb-2 text-sm sm:text-base">Current Streak</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words font-medium">
                      {analytics.currentStreak > 0 
                        ? `You've been learning for ${analytics.currentStreak} consecutive days! Keep up the great work! 🔥`
                        : "Start a learning streak by completing your first step today!"
                      }
                    </p>
                  </div>
                  
                  <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-bold text-foreground/80 mb-1.5 sm:mb-2 text-sm sm:text-base">Learning Efficiency</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words font-medium">
                      {analytics.averageTimePerStep > 0 
                        ? `You complete steps in an average of ${analytics.averageTimePerStep} days. Great pace!`
                        : "Complete more steps to see your learning efficiency metrics."
                      }
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-success/5 border border-success/20">
                    <h4 className="font-bold text-success mb-1.5 sm:mb-2 text-sm sm:text-base">Progress Summary</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words font-medium">
                      You've completed {analytics.completedSteps} out of {analytics.totalSteps} total steps 
                      ({analytics.completionRate}% completion rate). 
                      {analytics.completionRate > 50 
                        ? " You're doing excellent!" 
                        : analytics.completionRate > 25 
                        ? " Good progress so far!" 
                        : " Keep going, you're just getting started!"
                      }
                    </p>
                  </div>
                  
                  <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <h4 className="font-bold text-amber-500 mb-1.5 sm:mb-2 text-sm sm:text-base">Recommendations</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words font-medium">
                      {analytics.currentStreak === 0 
                        ? "Try to maintain a daily learning routine to build momentum."
                        : analytics.completionRate < 30
                        ? "Focus on completing more steps to improve your overall progress."
                        : "Consider exploring new skills or advancing to more challenging topics."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
