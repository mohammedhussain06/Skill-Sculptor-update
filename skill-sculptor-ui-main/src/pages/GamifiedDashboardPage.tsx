import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Trophy, Award, Flame, TrendingUp, Star, Target, Brain, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/effects/AnimatedCounter";
import { cn } from "@/lib/utils";

const GamifiedDashboardPage = () => {
    const navigate = useNavigate();
    const [userProgress, setUserProgress] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [badges, setBadges] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [progressRes, statsRes, badgesRes, leaderboardRes] = await Promise.all([
                API.get("/gamification/progress"),
                API.get("/gamification/stats"),
                API.get("/gamification/badges"),
                API.get("/gamification/leaderboard"),
            ]);

            setUserProgress(progressRes.data.userProgress);
            setStats(statsRes.data.stats);
            setBadges(badgesRes.data.badges);
            setLeaderboard(leaderboardRes.data.leaderboard);
        } catch (error) {
            toast.error("Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    };

    // Stagger animation on load
    useEffect(() => {
        if (loading || !stats) return;
        (async () => {
            try {
                const anime = (await import('animejs')).default;
                anime({
                    targets: '.gamified-stagger-item',
                    translateY: [24, 0],
                    opacity: [0, 1],
                    delay: anime.stagger(70, { start: 100 }),
                    duration: 700,
                    easing: 'easeOutExpo',
                });
            } catch { /* skip */ }
        })();
    }, [loading, stats]);

    if (loading || !userProgress || !stats) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto"></div>
                        <p className="text-muted-foreground text-sm font-medium">Loading your achievements...</p>
                    </div>
                </div>
            </div>
        );
    }

    const xpProgress = ((stats.xp % 100) / 100) * 100;
    const earnedBadges = badges.filter(b => b.earned);

    return (
        <div className="min-h-screen bg-gradient-subtle relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl floating-bg" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl floating-bg-delayed" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 sm:mb-8 gamified-stagger-item animate-fadeInUp" style={{ opacity: 0 }}>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Your Progress <span className="gradient-text">Dashboard</span>
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1.5 font-medium">
                            Track your learning journey, earn badges and climb the ranks
                        </p>
                    </div>

                    {/* Level & XP Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
                        <Card className="md:col-span-2 glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 gamified-stagger-item shadow-xl" style={{ opacity: 0 }}>
                            <CardHeader className="p-4 sm:p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold flex items-baseline gap-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                            Level <AnimatedCounter value={stats.level} duration={1000} />
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1 font-medium text-muted-foreground">
                                            {stats.xpToNextLevel} XP to next level
                                        </CardDescription>
                                    </div>
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-2xl">
                                        <Star className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs sm:text-sm font-semibold">
                                        <span className="text-muted-foreground">XP Progress</span>
                                        <span className="text-foreground flex items-baseline gap-0.5">
                                            <AnimatedCounter value={stats.xp} duration={1250} /> XP
                                        </span>
                                    </div>
                                    <Progress value={xpProgress} className="h-2.5 progress-fun" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 gamified-stagger-item shadow-xl" style={{ opacity: 0 }}>
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    <Flame className="w-5 h-5 text-orange-500 icon-pulse" />
                                    Streak
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <div className="text-center">
                                    <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-orange-500 mb-1 tracking-tight flex justify-center items-baseline" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                        <AnimatedCounter value={stats.currentStreak} duration={1000} />
                                    </div>
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Days in a row
                                    </div>
                                    <div className="mt-4 pt-3.5 border-t border-white/10 flex justify-between items-center text-xs font-semibold text-muted-foreground px-2">
                                        <span>Longest Streak:</span>
                                        <span className="text-orange-400 font-bold">{stats.longestStreak} days</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: "Quizzes Taken", value: stats.totalQuizzes, icon: BookOpen, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                            { label: "Quizzes Passed", value: stats.quizzesPassed, icon: Trophy, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                            { label: "Flashcards Created", value: stats.totalFlashcardsCreated, icon: Brain, color: "text-violet-400", bg: "bg-primary/10 border-primary/20" },
                            { label: "Average Score", value: stats.averageScore, icon: Target, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", suffix: "%" }
                        ].map((stat, i) => (
                            <Card key={i} className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 gamified-stagger-item shadow-lg" style={{ opacity: 0 }}>
                                <CardContent className="p-4 sm:p-5 text-center">
                                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 border", stat.bg)}>
                                        <stat.icon className={cn("w-5.5 h-5.5", stat.color)} />
                                    </div>
                                    <div className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                        <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} duration={1100} />
                                    </div>
                                    <div className="text-xs text-muted-foreground font-semibold mt-1">{stat.label}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Badges */}
                        <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 gamified-stagger-item shadow-xl" style={{ opacity: 0 }}>
                            <CardHeader className="p-4 sm:p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                            <Award className="w-5 h-5 text-violet-400" />
                                            Badges & Accomplishments
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            {earnedBadges.length} of {badges.length} earned
                                        </CardDescription>
                                    </div>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                        {earnedBadges.length}/{badges.length}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                                    {badges.map((badge, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "p-3 rounded-xl border text-center transition-all duration-200",
                                                badge.earned
                                                    ? "bg-primary/8 border-primary/20"
                                                    : "bg-white/3 border-white/5 opacity-40"
                                            )}
                                        >
                                            <div className="text-3xl mb-1.5 filter drop-shadow-md">{badge.icon}</div>
                                            <div className="text-xs font-bold text-foreground line-clamp-1">
                                                {badge.name}
                                            </div>
                                            {badge.earned && badge.earnedAt && (
                                                <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                                                    {new Date(badge.earnedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Leaderboard */}
                        <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 gamified-stagger-item shadow-xl" style={{ opacity: 0 }}>
                            <CardHeader className="p-4 sm:p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                            <TrendingUp className="w-5 h-5 text-cyan-400" />
                                            Leaderboard Rank
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            Your rank: #{leaderboard[0]?.rank || "N/A"}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                    {leaderboard.map((user, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-xl border transition-all",
                                                index === 0
                                                    ? "bg-amber-500/8 border-amber-500/20"
                                                    : index === 1
                                                    ? "bg-slate-400/8 border-slate-400/30"
                                                    : index === 2
                                                    ? "bg-orange-500/8 border-orange-500/30"
                                                    : "bg-white/3 border-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="font-extrabold text-lg w-8 text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                                    {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : `#${user.rank}`}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-foreground">{user.username}</div>
                                                    <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                                        Level {user.level}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-extrabold text-sm text-foreground">{user.xp} XP</div>
                                                <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                                                    {user.badges} badges
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card className="glass-card border-0 bg-card/40 backdrop-blur-xl border-white/5 gamified-stagger-item shadow-xl" style={{ opacity: 0 }}>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-base sm:text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>🚀 Quick Navigation</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Accelerate your progress by jumping back in</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <Button onClick={() => navigate("/upload")} className="w-full bg-gradient-primary border-0 font-bold h-11 text-sm btn-student text-white">
                                    Upload Document
                                </Button>
                                <Button onClick={() => navigate("/flashcards")} variant="outline" className="w-full border-white/10 hover:bg-white/10 hover:border-white/20 h-11 font-semibold text-sm">
                                    Practice Flashcards
                                </Button>
                                <Button onClick={() => navigate("/quiz")} variant="outline" className="w-full border-white/10 hover:bg-white/10 hover:border-white/20 h-11 font-semibold text-sm">
                                    Take Quiz
                                </Button>
                                <Button onClick={() => navigate("/roadmaps")} variant="outline" className="w-full border-white/10 hover:bg-white/10 hover:border-white/20 h-11 font-semibold text-sm">
                                    View Roadmaps
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default GamifiedDashboardPage;
