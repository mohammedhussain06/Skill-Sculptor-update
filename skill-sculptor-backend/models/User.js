import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    // Gamification fields
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastActivity: { type: Date }
    },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
