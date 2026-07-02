import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";
import passport from "passport";
import "./passport.js";

// Routes
import authRoutes from "./routes/auth.js";
import queryRoutes from "./routes/query.js";
import roadmapRoutes from "./routes/roadmap.js";
import dashboardRoutes from "./routes/dashboard.js";
import ocrRoutes from "./routes/ocr.js";
import flashcardRoutes from "./routes/flashcard.js";
import quizRoutes from "./routes/quiz.js";
import gamificationRoutes from "./routes/gamification.js";
import chatTutorRoutes from "./routes/chatTutor.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
const app = express();

// CORS configuration - allow frontend URL
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:8080',
      'http://localhost:5173', // Vite dev server
      'https://skill-sculptor-2.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow all Render.com subdomains
    if (origin.includes('.onrender.com')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/flashcard", flashcardRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/chat-tutor", chatTutorRoutes);
app.use(errorHandler);

// Debug: DB and collection counts
app.get("/api/debug/db", async (req, res) => {
  try {
    const mongoose = (await import("mongoose")).default;
    const conn = mongoose.connection;
    const dbName = conn.name;
    const collections = await conn.db.listCollections().toArray();
    const counts = {};
    for (const c of collections) {
      counts[c.name] = await conn.db.collection(c.name).countDocuments();
    }
    res.json({ dbName, host: conn.host, port: conn.port, collections: counts });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/", (req, res) => {
  res.send("Skill Sculptor Backend is running 🚀");
});

const PORT = process.env.PORT || 8080;

// Start server with error handling
try {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
        console.log(`🔍 Health check: http://localhost:${PORT}/`);
    });
} catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Promise Rejection:', error.message || error);
    if (error.stack) {
        console.error('Stack:', error.stack);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message || error);
    if (error.stack) {
        console.error('Stack:', error.stack);
    }
    process.exit(1);
});
