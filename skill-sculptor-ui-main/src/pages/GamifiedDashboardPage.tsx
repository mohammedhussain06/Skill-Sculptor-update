import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Trophy, Award, Flame, TrendingUp, Star, Target, Brain, BookOpen } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

    if (loading || !userProgress || !stats) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="flex items-center justify-center h-screen">
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const xpProgress = ((stats.xp % 100) / 100) * 100;
    const earnedBadges = badges.filter(b => b.earned);

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold mb-2">Your Progress Dashboard</h1>
                    <p className="text-muted-foreground mb-8">
                        Track your learning journey and achievements
                    </p>

                    {/* Level & XP Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <Card className="col-span-2">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-3xl">Level {stats.level}</CardTitle>
                                        <CardDescription>
                                            {stats.xpToNextLevel} XP to next level
                                        </CardDescription>
                                    </div>
                                    <Star className="w-12 h-12 text-yellow-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>XP Progress</span>
                                        <span className="font-medium">{stats.xp} XP</span>
                                    </div>
                                    <Progress value={xpProgress} className="h-3" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Flame className="w-6 h-6 text-orange-500" />
                                    Streak
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-orange-500 mb-2">
                                        {stats.currentStreak}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Days in a row
                                    </div>
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="text-xs text-muted-foreground">
                                            Longest: {stats.longestStreak} days
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                                    <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
                                    <div className="text-xs text-muted-foreground">Quizzes Taken</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <Trophy className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    <div className="text-2xl font-bold">{stats.quizzesPassed}</div>
                                    <div className="text-xs text-muted-foreground">Quizzes Passed</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                                    <div className="text-2xl font-bold">{stats.totalFlashcardsCreated}</div>
                                    <div className="text-xs text-muted-foreground">Flashcards Created</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <Target className="w-8 h-8 mx-auto mb-2 text-red-500" />
                                    <div className="text-2xl font-bold">{stats.averageScore}%</div>
                                    <div className="text-xs text-muted-foreground">Avg Score</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Badges */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Award className="w-6 h-6" />
                                            Badges
                                        </CardTitle>
                                        <CardDescription>
                                            {earnedBadges.length} of {badges.length} earned
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline">{earnedBadges.length}/{badges.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                                    {badges.map((badge, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg border text-center ${
                                                badge.earned
                                                    ? "bg-primary/10 border-primary"
                                                    : "bg-muted/50 border-muted opacity-50"
                                            }`}
                                        >
                                            <div className="text-3xl mb-1">{badge.icon}</div>
                                            <div className="text-xs font-medium line-clamp-1">
                                                {badge.name}
                                            </div>
                                            {badge.earned && badge.earnedAt && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {new Date(badge.earnedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Leaderboard */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-6 h-6" />
                                            Leaderboard
                                        </CardTitle>
                                        <CardDescription>
                                            Your rank: #{leaderboard[0]?.rank || "N/A"}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {leaderboard.map((user, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-3 rounded-lg ${
                                                index === 0
                                                    ? "bg-yellow-500/10 border border-yellow-500"
                                                    : index === 1
                                                    ? "bg-gray-400/10 border border-gray-400"
                                                    : index === 2
                                                    ? "bg-orange-500/10 border border-orange-500"
                                                    : "bg-muted"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="font-bold text-lg w-8 text-center">
                                                    {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : `#${user.rank}`}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{user.username}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Level {user.level}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">{user.xp} XP</div>
                                                <div className="text-xs text-muted-foreground">
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Continue your learning journey</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <Button onClick={() => navigate("/upload")} className="w-full">
                                    Upload Document
                                </Button>
                                <Button onClick={() => navigate("/flashcards")} variant="outline" className="w-full">
                                    Practice Flashcards
                                </Button>
                                <Button onClick={() => navigate("/quiz")} variant="outline" className="w-full">
                                    Take Quiz
                                </Button>
                                <Button onClick={() => navigate("/roadmaps")} variant="outline" className="w-full">
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
