import express from "express";
import passport from "passport";
import Flashcard from "../models/Flashcard.js";
import UserProgress from "../models/UserProgress.js";

const router = express.Router();

// Generate flashcards from text using AI (public - no auth, does not save anything)
router.post("/generate", async (req, res) => {
    try {
        const { text, count = 10, difficulty = "medium" } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        // Simple flashcard generation algorithm (can be enhanced with OpenAI API)
        const flashcards = generateFlashcardsFromText(text, count, difficulty);
        
        res.json({ flashcards });
    } catch (error) {
        console.error("Flashcard generation error:", error);
        res.status(500).json({ error: "Failed to generate flashcards" });
    }
});

// Create flashcards
router.post("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { flashcards } = req.body;
        
        const createdFlashcards = await Flashcard.insertMany(
            flashcards.map(fc => ({ ...fc, userId: req.user._id }))
        );

        // Update user progress
        await UserProgress.findOneAndUpdate(
            { userId: req.user._id },
            { 
                $inc: { totalFlashcardsCreated: createdFlashcards.length, xp: createdFlashcards.length * 5 }
            },
            { upsert: true, new: true }
        );

        res.json({ flashcards: createdFlashcards });
    } catch (error) {
        console.error("Flashcard creation error:", error);
        res.status(500).json({ error: "Failed to create flashcards" });
    }
});

// Get all flashcards for user
router.get("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const flashcards = await Flashcard.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ flashcards });
    } catch (error) {
        console.error("Flashcard fetch error:", error);
        res.status(500).json({ error: "Failed to fetch flashcards" });
    }
});

// Update flashcard review
router.put("/:id/review", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { correct } = req.body;
        
        const flashcard = await Flashcard.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            {
                $inc: {
                    reviewCount: 1,
                    correctCount: correct ? 1 : 0
                },
                lastReviewed: new Date(),
                nextReview: new Date(Date.now() + (correct ? 7 : 1) * 24 * 60 * 60 * 1000)
            },
            { new: true }
        );

        if (!flashcard) {
            return res.status(404).json({ error: "Flashcard not found" });
        }

        // Update user progress
        await UserProgress.findOneAndUpdate(
            { userId: req.user._id },
            { 
                $inc: { totalFlashcardsReviewed: 1, xp: correct ? 3 : 1 }
            },
            { upsert: true }
        );

        res.json({ flashcard });
    } catch (error) {
        console.error("Flashcard review error:", error);
        res.status(500).json({ error: "Failed to update flashcard review" });
    }
});

// Delete flashcard
router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const flashcard = await Flashcard.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!flashcard) {
            return res.status(404).json({ error: "Flashcard not found" });
        }

        res.json({ message: "Flashcard deleted successfully" });
    } catch (error) {
        console.error("Flashcard deletion error:", error);
        res.status(500).json({ error: "Failed to delete flashcard" });
    }
});

// Simple flashcard generation function
function generateFlashcardsFromText(text, count, difficulty) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const flashcards = [];
    
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
        const sentence = sentences[i].trim();
        const words = sentence.split(' ');
        
        if (words.length > 5) {
            // Generate cloze deletion flashcard
            const keyWordIndex = Math.floor(Math.random() * (words.length - 2)) + 1;
            const keyWord = words[keyWordIndex];
            const front = sentence.replace(keyWord, '_____');
            
            flashcards.push({
                title: `Flashcard ${i + 1}`,
                front,
                back: keyWord,
                difficulty,
                sourceText: sentence
            });
        }
    }
    
    return flashcards;
}

export default router;
