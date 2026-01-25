import { useEffect, useState } from "react";
import API from '../../api/axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { User, TrendingUp, Target, Clock, BookOpen, Award, ArrowRight, Plus, BarChart3, CheckCircle, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-lg">Loading your dashboard...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-lg">No dashboard data found.</p>
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

  const currentRoadmap = {
    skill: populatedFirst?.skill || "No skill yet",
    progress: steps.length ? Math.round((steps.filter((s: any) => s.status === 'completed').length / steps.length) * 100) : 0,
    currentStep: currentStepObj?.title || "Start learning soon",
    nextMilestone: nextStepObj?.title || "Next module",
    estimatedCompletion: calculateEstimatedCompletion()
  };

  const stats = [
    { label: "Current Streak", value: calculateCurrentStreak(), unit: "days", icon: TrendingUp, color: "text-success" },
    { label: "Skills Learning", value: dashboard.savedRoadmaps?.length || 0, unit: "active", icon: Target, color: "text-primary" },
    { label: "Milestones", value: dashboard.completedSteps?.length || 0, unit: "completed", icon: Award, color: "text-secondary" }
  ];

  // Enhanced recent activities with better formatting and more activity types
  const getRecentActivities = () => {
    const activities = [];
    
    // Add completed steps
    if (dashboard.completedSteps?.length) {
      const recentSteps = dashboard.completedSteps
        .slice(-5)
        .reverse()
        .map((step: any) => ({
          date: step.completedAt ? new Date(step.completedAt).toLocaleDateString() : "—",
          activity: step.stepTitle ? `Completed ${step.stepTitle}` : "Completed a milestone",
          type: "completion",
          icon: CheckCircle,
          color: "text-success"
        }));
      activities.push(...recentSteps);
    }
    
    // Add roadmap creation if recent
    if (dashboard.savedRoadmaps?.length) {
      const roadmapCreation = {
        date: "Today",
        activity: `Started learning ${populatedFirst?.skill || "new skill"}`,
        type: "roadmap_creation",
        icon: Target,
        color: "text-primary"
      };
      activities.unshift(roadmapCreation);
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
    
    return activities.slice(0, 3);
  };

  const recentActivities = getRecentActivities();

  const multipleRoadmaps = (dashboard._allRoadmapsCount || (dashboard.savedRoadmaps?.length || 0)) > 1;
  
  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = () => {
    // TODO: Implement delete account functionality
    console.log("Delete account clicked");
  };

  const quickActions = [
    { title: "Continue Learning", description: multipleRoadmaps ? "Choose from your saved roadmaps" : "Resume your current roadmap", icon: BookOpen, action: multipleRoadmaps ? "/roadmaps" : "/roadmap", variant: "default", onClick: null },
    { title: "Create New Roadmap", description: "Start learning a new skill", icon: Plus, action: "/query-form?new=1", variant: "secondary", onClick: null },
    { title: "View Analytics", description: "Track your progress", icon: BarChart3, action: "/progress", variant: "outline", onClick: null },
    { title: "Logout", description: "Sign out of your account", icon: LogOut, action: "#", variant: "outline", onClick: handleLogout },
    { title: "Delete Account", description: "Permanently delete your account", icon: Trash2, action: "#", variant: "destructive", onClick: handleDeleteAccount }
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Greeting & Stats */}
          <div className="mb-6 sm:mb-8 md:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="achievement-badge p-2 sm:p-3 shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold break-words">
                  Welcome back, {user?.username || "Learner"}! 👋
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Ready to continue your learning journey?</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="fun-card border-0 shadow-card bg-card/80 backdrop-blur-sm min-h-[90px] sm:min-h-[100px] md:min-h-[120px]">
                  <CardContent className="p-3 sm:p-4 md:p-6 flex justify-between items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold break-words">
                        {stat.value} 
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>
                      </p>
                      {stat.label === "Current Streak" && stat.value > 0 && (
                        <p className="text-xs text-success mt-1">🔥 Keep it up!</p>
                      )}
                      {stat.label === "Milestones" && stat.value > 0 && (
                        <p className="text-xs text-secondary mt-1">🎯 Great progress!</p>
                      )}
                    </div>
                    <div className={`achievement-badge p-2 sm:p-3 shrink-0 ${stat.color}`}>
                      <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
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
              <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm min-h-[200px] sm:min-h-[220px]">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <span className="break-words">Current Learning Path</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 break-words">Your progress in {currentRoadmap.skill}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground">{currentRoadmap.progress}%</span>
                  </div>
                  <Progress value={currentRoadmap.progress} className="h-2 sm:h-3" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Currently Learning</p>
                      <p className="font-medium text-primary text-sm sm:text-base break-words">{currentRoadmap.currentStep}</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-lg bg-muted/20 border border-muted-darker">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Next Milestone</p>
                      <p className="font-medium text-sm sm:text-base break-words">{currentRoadmap.nextMilestone}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-border">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                      <span className="text-xs sm:text-sm break-words">Est. completion: {currentRoadmap.estimatedCompletion}</span>
                    </div>
                    <Button asChild className="bg-gradient-primary hover:opacity-90 border-0 w-full sm:w-auto text-sm sm:text-base">
                      <Link to={multipleRoadmaps ? "/roadmaps" : (populatedFirst?._id ? `/roadmap/${populatedFirst._id}` : "/roadmap")} className="flex items-center justify-center space-x-2">
                        <span>Continue</span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm min-h-[200px] sm:min-h-[220px]">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your latest learning milestones</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {recentActivities.map((activity, i) => (
                      <div key={i} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-muted/20">
                        <div className={`p-1 rounded-full bg-primary/10 mt-0.5 sm:mt-1 shrink-0 ${activity.color}`}>
                          <activity.icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium break-words">{activity.activity}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-border mt-4">
                    <Button variant="outline" className="w-full text-sm sm:text-base" onClick={() => navigate('/progress')}>
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      View Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Actions */}
              <Card className="fun-card border-0 shadow-card bg-card/80 backdrop-blur-sm min-h-[180px] sm:min-h-[200px] md:min-h-[220px]">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl">🚀 Quick Actions</CardTitle>
                  <CardDescription className="text-xs sm:text-sm md:text-base">Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                  {quickActions.map((action, i) => {
                    if (action.onClick) {
                      // Button with onClick handler (Logout, Delete Account)
                      return (
                        <Button 
                          key={i} 
                          variant={action.variant} 
                          onClick={action.onClick}
                          className={`w-full justify-start h-auto p-2 sm:p-3 md:p-4 text-xs sm:text-sm ${action.variant === "default" ? "btn-student bg-gradient-primary hover:opacity-90 border-0 text-white" : ""}`}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 w-full">
                            <action.icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
                            <div className="text-left min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm md:text-base break-words">{action.title}</p>
                              <p className="text-xs text-muted-foreground break-words line-clamp-2">{action.description}</p>
                            </div>
                          </div>
                        </Button>
                      );
                    } else {
                      // Link button (Continue Learning, Create New Roadmap, View Analytics)
                      return (
                        <Button 
                          key={i} 
                          variant={action.variant} 
                          asChild 
                          className={`w-full justify-start h-auto p-2 sm:p-3 md:p-4 text-xs sm:text-sm ${action.variant === "default" ? "btn-student bg-gradient-primary hover:opacity-90 border-0 text-white" : ""}`}
                        >
                      <Link to={action.action}>
                        <div className="flex items-center space-x-2 sm:space-x-3 w-full">
                          <action.icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
                          <div className="text-left min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm md:text-base break-words">{action.title}</p>
                            <p className="text-xs text-muted-foreground break-words line-clamp-2">{action.description}</p>
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
