import express from "express";
import passport from "passport";
import UserProgress from "../models/UserProgress.js";
import User from "../models/User.js";

const router = express.Router();

// Get user progress
router.get("/progress", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        let userProgress = await UserProgress.findOne({ userId: req.user._id });
        
        if (!userProgress) {
            userProgress = await UserProgress.create({ userId: req.user._id });
        }

        // Update streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (userProgress.streak.lastActivity) {
            const lastActivity = new Date(userProgress.streak.lastActivity);
            lastActivity.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                // Continue streak
                userProgress.streak.current += 1;
                if (userProgress.streak.current > userProgress.streak.longest) {
                    userProgress.streak.longest = userProgress.streak.current;
                }
            } else if (daysDiff > 1) {
                // Streak broken
                userProgress.streak.current = 1;
            }
            // daysDiff === 0 means already updated today
        } else {
            // First activity
            userProgress.streak.current = 1;
            userProgress.streak.longest = 1;
        }
        
        userProgress.streak.lastActivity = new Date();
        await userProgress.save();

        res.json({ userProgress });
    } catch (error) {
        console.error("Progress fetch error:", error);
        res.status(500).json({ error: "Failed to fetch user progress" });
    }
});

// Get leaderboard
router.get("/leaderboard", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const topUsers = await UserProgress.find()
            .sort({ xp: -1 })
            .limit(10)
            .populate('userId', 'username email');

        const leaderboard = topUsers.map((progress, index) => ({
            rank: index + 1,
            username: progress.userId?.username || 'Unknown',
            xp: progress.xp,
            level: progress.level,
            badges: progress.badges.length
        }));

        // Find current user's rank
        const allUsers = await UserProgress.find().sort({ xp: -1 });
        const currentUserRank = allUsers.findIndex(p => p.userId.toString() === req.user._id.toString()) + 1;

        res.json({ 
            leaderboard,
            currentUserRank,
            totalUsers: allUsers.length
        });
    } catch (error) {
        console.error("Leaderboard fetch error:", error);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

// Award XP manually (for testing or special events)
router.post("/award-xp", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { amount, reason } = req.body;
        
        const userProgress = await UserProgress.findOneAndUpdate(
            { userId: req.user._id },
            { $inc: { xp: amount } },
            { upsert: true, new: true }
        );

        res.json({ 
            userProgress,
            message: `Awarded ${amount} XP for ${reason || 'special achievement'}`
        });
    } catch (error) {
        console.error("XP award error:", error);
        res.status(500).json({ error: "Failed to award XP" });
    }
});

// Get badges
router.get("/badges", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({ userId: req.user._id });
        
        const allBadges = [
            { id: 'first_quiz', name: 'First Quiz', description: 'Complete your first quiz', icon: '🎯', category: 'Quiz' },
            { id: 'quiz_master_10', name: 'Quiz Master', description: 'Complete 10 quizzes', icon: '🏆', category: 'Quiz' },
            { id: 'quiz_master_50', name: 'Quiz Legend', description: 'Complete 50 quizzes', icon: '👑', category: 'Quiz' },
            { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '💯', category: 'Quiz' },
            { id: 'level_5', name: 'Level 5', description: 'Reach level 5', icon: '⭐', category: 'Progress' },
            { id: 'level_10', name: 'Level 10', description: 'Reach level 10', icon: '🌟', category: 'Progress' },
            { id: 'level_20', name: 'Level 20', description: 'Reach level 20', icon: '✨', category: 'Progress' },
            { id: 'flashcard_creator', name: 'Flashcard Creator', description: 'Create 50 flashcards', icon: '📇', category: 'Flashcard' },
            { id: 'flashcard_master', name: 'Flashcard Master', description: 'Review 100 flashcards', icon: '📚', category: 'Flashcard' },
            { id: 'week_streak', name: 'Week Warrior', description: '7 day streak', icon: '🔥', category: 'Streak' },
            { id: 'month_streak', name: 'Month Master', description: '30 day streak', icon: '🔥🔥', category: 'Streak' },
        ];

        const earnedBadges = userProgress?.badges || [];
        
        const badgesWithStatus = allBadges.map(badge => ({
            ...badge,
            earned: earnedBadges.some(b => b.id === badge.id),
            earnedAt: earnedBadges.find(b => b.id === badge.id)?.earnedAt
        }));

        res.json({ badges: badgesWithStatus });
    } catch (error) {
        console.error("Badges fetch error:", error);
        res.status(500).json({ error: "Failed to fetch badges" });
    }
});

// Get statistics
router.get("/stats", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({ userId: req.user._id });
        
        if (!userProgress) {
            return res.json({
                stats: {
                    xp: 0,
                    level: 1,
                    totalQuizzes: 0,
                    totalFlashcards: 0,
                    averageScore: 0,
                    streak: 0
                }
            });
        }

        res.json({
            stats: {
                xp: userProgress.xp,
                level: userProgress.level,
                xpToNextLevel: ((userProgress.level) * 100) - userProgress.xp,
                totalQuizzes: userProgress.totalQuizzesTaken,
                quizzesPassed: userProgress.totalQuizzesPassed,
                totalFlashcardsCreated: userProgress.totalFlashcardsCreated,
                totalFlashcardsReviewed: userProgress.totalFlashcardsReviewed,
                averageScore: userProgress.averageQuizScore.toFixed(2),
                currentStreak: userProgress.streak.current,
                longestStreak: userProgress.streak.longest,
                badges: userProgress.badges.length
            }
        });
    } catch (error) {
        console.error("Stats fetch error:", error);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
});

export default router;
