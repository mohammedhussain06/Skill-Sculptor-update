import express from "express";
import passport from "passport";
import Roadmap from "../models/Roadmap.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { aiService } from "../AI/aiService.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// 1. AI ADAPTIVE LEARNING ENGINE
//    POST /api/ai/adapt-roadmap
//    Analyzes quiz performance and adjusts the roadmap steps accordingly
// ─────────────────────────────────────────────────────────────────────────────
router.post("/adapt-roadmap", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { roadmapId, quizScore, weakTopics = [] } = req.body;

        if (!roadmapId || quizScore === undefined) {
            return res.status(400).json({ error: "roadmapId and quizScore are required" });
        }

        // Load roadmap
        const roadmap = await Roadmap.findOne({
            _id: roadmapId,
            userId: req.user._id.toString()
        });

        if (!roadmap) {
            return res.status(404).json({ error: "Roadmap not found" });
        }

        // Get AI recommendations
        const adaptation = await aiService.adaptRoadmap(
            roadmap.skill,
            roadmap.steps,
            quizScore,
            weakTopics
        );

        // Apply step adjustments to the roadmap
        let updatedSteps = [...roadmap.steps.map(s => s.toObject ? s.toObject() : s)];

        // Apply difficulty changes from AI
        if (adaptation.stepAdjustments && adaptation.stepAdjustments.length > 0) {
            adaptation.stepAdjustments.forEach(adj => {
                if (adj.stepIndex >= 0 && adj.stepIndex < updatedSteps.length) {
                    if (adj.newDifficulty) {
                        updatedSteps[adj.stepIndex].difficulty = adj.newDifficulty;
                    }
                    if (adj.action === "emphasize") {
                        updatedSteps[adj.stepIndex].isEmphasized = true;
                        updatedSteps[adj.stepIndex].emphasisReason = adj.reason;
                    }
                    if (adj.action === "skip") {
                        updatedSteps[adj.stepIndex].isSkipped = true;
                    }
                }
            });
        }

        // Insert remedial steps (in reverse order to preserve indices)
        if (adaptation.insertSteps && adaptation.insertSteps.length > 0) {
            const toInsert = [...adaptation.insertSteps].sort((a, b) => b.insertBeforeIndex - a.insertBeforeIndex);
            toInsert.forEach(newStep => {
                const insertIdx = Math.max(0, Math.min(newStep.insertBeforeIndex, updatedSteps.length));
                updatedSteps.splice(insertIdx, 0, {
                    title: newStep.title,
                    description: newStep.description,
                    difficulty: newStep.difficulty || "Beginner",
                    status: "pending",
                    isRemedial: true,
                    resources: []
                });
            });
        }

        // Persist updated steps
        roadmap.steps = updatedSteps;
        roadmap.lastAdaptedAt = new Date();
        roadmap.lastQuizScore = quizScore;
        await roadmap.save();

        res.json({
            success: true,
            verdict: adaptation.verdict,
            message: adaptation.message,
            stepAdjustments: adaptation.stepAdjustments || [],
            insertedSteps: adaptation.insertSteps?.length || 0,
            updatedRoadmap: roadmap
        });

    } catch (err) {
        console.error("Adaptive learning engine error:", err);
        res.status(500).json({ error: "Failed to adapt roadmap: " + err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. AI STUDY PLANNER
//    POST /api/ai/generate-study-plan
//    Generates a personalized weekly study schedule
// ─────────────────────────────────────────────────────────────────────────────
router.post("/generate-study-plan", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const {
            skills,
            hoursPerDay = 2,
            daysPerWeek = 5,
            startDate,
            goalDate
        } = req.body;

        if (!skills || skills.length === 0) {
            return res.status(400).json({ error: "At least one skill is required" });
        }

        const resolvedStartDate = startDate || new Date().toISOString().split("T")[0];

        const plan = await aiService.generateStudyPlan(
            skills,
            hoursPerDay,
            daysPerWeek,
            resolvedStartDate,
            goalDate
        );

        res.json({ plan });

    } catch (err) {
        console.error("Study plan generation error:", err);
        res.status(500).json({ error: "Failed to generate study plan: " + err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. AI STUDY ANALYTICS & PREDICTIONS
//    POST /api/ai/analytics-insights
//    Generates milestone forecasts, learning velocity metrics, next study topics, and learning curve points
// ─────────────────────────────────────────────────────────────────────────────
router.post("/analytics-insights", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { focusLogs = {} } = req.body;

        // Query active roadmaps for the user
        const roadmaps = await Roadmap.find({ userId: req.user._id });

        // Query all quiz attempts for the user
        const quizAttempts = await QuizAttempt.find({ userId: req.user._id }).sort({ completedAt: -1 });

        const insights = await aiService.generateAnalyticsInsights(
            roadmaps,
            quizAttempts,
            focusLogs
        );

        res.json({ insights });
    } catch (err) {
        console.error("AI analytics insights error:", err);
        res.status(500).json({ error: "Failed to generate analytics insights: " + err.message });
    }
});

export default router;
