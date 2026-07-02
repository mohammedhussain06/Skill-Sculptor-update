import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { aiService } from "../AI/aiService.js";

const router = express.Router();

// ✅ POST /api/chat-tutor
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { chatHistory = [], message, context = {} } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!context.roadmapTitle || !context.stepTitle) {
      return res.status(400).json({ message: "Roadmap and step titles are required context" });
    }

    const response = await aiService.generateChatResponse(chatHistory, message, context);
    res.json({ response });
  } catch (err) {
    next(err);
  }
});

export default router;
