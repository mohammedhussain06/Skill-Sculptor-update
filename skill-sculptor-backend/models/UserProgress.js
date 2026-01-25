import mongoose from "mongoose";

const streakSchema = new mongoose.Schema({
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivity: { type: Date }
});

const badgeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    earnedAt: { type: Date, default: Date.now }
});

const userProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [badgeSchema],
    streak: { type: streakSchema, default: () => ({}) },
    totalFlashcardsCreated: { type: Number, default: 0 },
    totalFlashcardsReviewed: { type: Number, default: 0 },
    totalQuizzesTaken: { type: Number, default: 0 },
    totalQuizzesPassed: { type: Number, default: 0 },
    averageQuizScore: { type: Number, default: 0 },
    skillLevels: {
        type: Map,
        of: {
            level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
            xp: { type: Number, default: 0 },
            lastPracticed: { type: Date }
        }
    },
    updatedAt: { type: Date, default: Date.now }
});

userProgressSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    // Calculate level based on XP (100 XP per level)
    this.level = Math.floor(this.xp / 100) + 1;
    next();
});

export default mongoose.model("UserProgress", userProgressSchema);
