import express from "express";
import passport from "passport";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import UserProgress from "../models/UserProgress.js";
import { aiService } from "../AI/aiService.js";

const router = express.Router();

// Generate quiz from text (public - no auth, does not save anything)
router.post("/generate", async (req, res) => {
    try {
        const { text, count = 5, difficulty = "medium" } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        let questions;
        try {
            const raw = await aiService.generateQuiz(text, count, difficulty);
            // Map AI field name (correctAnswerIndex) to Schema field name (correctAnswer)
            questions = raw.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswerIndex ?? q.correctAnswer ?? 0,
                explanation: q.explanation || ""
            }));
        } catch (aiErr) {
            console.warn("AI quiz generation failed, using procedural fallback:", aiErr.message);
            questions = generateMCQFromText(text, count, difficulty);
        }
        
        res.json({ questions });
    } catch (error) {
        console.error("Quiz generation error:", error);
        res.status(500).json({ error: "Failed to generate quiz" });
    }
});

// Create quiz
router.post("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { title, description, questions, tags, sourceText } = req.body;
        
        // Normalize correctAnswerIndex -> correctAnswer to support both manual and AI-generated questions
        const normalizedQuestions = (questions || []).map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer ?? q.correctAnswerIndex ?? 0,
            explanation: q.explanation || ""
        }));

        const quiz = await Quiz.create({
            userId: req.user._id,
            title,
            description,
            questions: normalizedQuestions,
            tags,
            sourceText
        });

        // Award XP for creating quiz
        await UserProgress.findOneAndUpdate(
            { userId: req.user._id },
            { $inc: { xp: 20 } },
            { upsert: true }
        );

        res.json({ quiz });
    } catch (error) {
        console.error("Quiz creation error:", error);
        res.status(500).json({ error: "Failed to create quiz" });
    }
});

// Get all quizzes for user
router.get("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const quizzes = await Quiz.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ quizzes });
    } catch (error) {
        console.error("Quiz fetch error:", error);
        res.status(500).json({ error: "Failed to fetch quizzes" });
    }
});

// Get single quiz
router.get("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
        
        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        res.json({ quiz });
    } catch (error) {
        console.error("Quiz fetch error:", error);
        res.status(500).json({ error: "Failed to fetch quiz" });
    }
});

// Submit quiz attempt with adaptive grading
router.post("/:id/attempt", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { answers, timeSpent } = req.body;
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        // Calculate score and adaptive level
        let correctCount = 0;
        const detailedAnswers = answers.map((answer, index) => {
            const isCorrect = quiz.questions[index].correctAnswer === answer.selectedAnswer;
            if (isCorrect) correctCount++;
            
            return {
                questionIndex: index,
                selectedAnswer: answer.selectedAnswer,
                isCorrect,
                timeSpent: answer.timeSpent || 0
            };
        });

        const percentage = (correctCount / quiz.questions.length) * 100;
        const score = correctCount;

        // Determine adaptive level based on performance
        let adaptiveLevel = "intermediate";
        if (percentage >= 90) adaptiveLevel = "advanced";
        else if (percentage < 60) adaptiveLevel = "beginner";

        // Calculate XP based on performance
        const baseXP = 50;
        const bonusXP = Math.floor(percentage / 10) * 5;
        const xpEarned = baseXP + bonusXP;

        // Create attempt record
        const attempt = await QuizAttempt.create({
            userId: req.user._id,
            quizId: quiz._id,
            answers: detailedAnswers,
            score,
            percentage,
            timeSpent,
            xpEarned,
            adaptiveLevel
        });

        // Update quiz stats
        const newTotalAttempts = quiz.totalAttempts + 1;
        const newAverageScore = ((quiz.averageScore * quiz.totalAttempts) + percentage) / newTotalAttempts;
        
        await Quiz.findByIdAndUpdate(quiz._id, {
            totalAttempts: newTotalAttempts,
            averageScore: newAverageScore
        });

        // Update user progress
        const userProgress = await UserProgress.findOneAndUpdate(
            { userId: req.user._id },
            { 
                $inc: { 
                    totalQuizzesTaken: 1,
                    totalQuizzesPassed: percentage >= 70 ? 1 : 0,
                    xp: xpEarned
                }
            },
            { upsert: true, new: true }
        );

        // Update average quiz score
        if (userProgress.totalQuizzesTaken > 0) {
            const newAvgScore = ((userProgress.averageQuizScore * (userProgress.totalQuizzesTaken - 1)) + percentage) / userProgress.totalQuizzesTaken;
            userProgress.averageQuizScore = newAvgScore;
            await userProgress.save();
        }

        // Check and award badges
        const newBadges = await checkAndAwardBadges(userProgress);

        res.json({ 
            attempt,
            xpEarned,
            adaptiveLevel,
            percentage,
            userProgress: {
                xp: userProgress.xp,
                level: userProgress.level,
                newBadges
            }
        });
    } catch (error) {
        console.error("Quiz submission error:", error);
        res.status(500).json({ error: "Failed to submit quiz" });
    }
});

// Get quiz attempts for a quiz
router.get("/:id/attempts", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ 
            quizId: req.params.id,
            userId: req.user._id 
        }).sort({ completedAt: -1 });

        res.json({ attempts });
    } catch (error) {
        console.error("Attempts fetch error:", error);
        res.status(500).json({ error: "Failed to fetch attempts" });
    }
});

// Delete quiz
router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const quiz = await Quiz.findOneAndDelete({ 
            _id: req.params.id,
            userId: req.user._id 
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        // Delete all attempts for this quiz
        await QuizAttempt.deleteMany({ quizId: req.params.id });

        res.json({ message: "Quiz deleted successfully" });
    } catch (error) {
        console.error("Quiz deletion error:", error);
        res.status(500).json({ error: "Failed to delete quiz" });
    }
});

// Simple MCQ generation function
function generateMCQFromText(text, count, difficulty) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
    const questions = [];
    
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
        const sentence = sentences[i].trim();
        const words = sentence.split(' ').filter(w => w.length > 4);
        
        if (words.length > 3) {
            const keyWord = words[Math.floor(Math.random() * words.length)];
            const questionText = sentence.replace(keyWord, '_____');
            
            // Generate distractors
            const distractors = generateDistractors(keyWord, 3);
            const correctAnswer = Math.floor(Math.random() * 4);
            const options = [...distractors];
            options.splice(correctAnswer, 0, keyWord);
            
            questions.push({
                question: `Fill in the blank: ${questionText}`,
                options,
                correctAnswer,
                explanation: `The correct answer is "${keyWord}" as found in the original text.`,
                difficulty
            });
        }
    }
    
    return questions;
}

function generateDistractors(word, count) {
    const distractors = [];
    const templates = [
        word + 's',
        word + 'ing',
        word + 'ed',
        'un' + word,
        word.slice(0, -1) + 'er',
        word.charAt(0).toUpperCase() + word.slice(1),
    ];
    
    for (let i = 0; i < count && i < templates.length; i++) {
        if (templates[i] !== word) {
            distractors.push(templates[i]);
        }
    }
    
    while (distractors.length < count) {
        distractors.push(`Option ${distractors.length + 1}`);
    }
    
    return distractors.slice(0, count);
}

async function checkAndAwardBadges(userProgress) {
    const newBadges = [];
    
    const badges = [
        { id: 'first_quiz', name: 'First Quiz', description: 'Complete your first quiz', condition: () => userProgress.totalQuizzesTaken === 1 },
        { id: 'quiz_master_10', name: 'Quiz Master', description: 'Complete 10 quizzes', condition: () => userProgress.totalQuizzesTaken === 10 },
        { id: 'perfect_score', name: 'Perfect Score', description: 'Get 100% on a quiz', condition: () => userProgress.averageQuizScore === 100 },
        { id: 'level_5', name: 'Level 5', description: 'Reach level 5', condition: () => userProgress.level === 5 },
        { id: 'level_10', name: 'Level 10', description: 'Reach level 10', condition: () => userProgress.level === 10 },
        { id: 'flashcard_creator', name: 'Flashcard Creator', description: 'Create 50 flashcards', condition: () => userProgress.totalFlashcardsCreated === 50 },
    ];
    
    for (const badge of badges) {
        const alreadyHas = userProgress.badges.some(b => b.id === badge.id);
        if (!alreadyHas && badge.condition()) {
            userProgress.badges.push({
                id: badge.id,
                name: badge.name,
                description: badge.description,
                icon: '🏆'
            });
            newBadges.push(badge);
        }
    }
    
    if (newBadges.length > 0) {
        await userProgress.save();
    }
    
    return newBadges;
}

export default router;
