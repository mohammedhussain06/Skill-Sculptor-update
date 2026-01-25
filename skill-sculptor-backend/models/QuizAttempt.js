import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
    questionIndex: { type: Number, required: true },
    selectedAnswer: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    timeSpent: { type: Number } // in seconds
});

const quizAttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    answers: [answerSchema],
    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeSpent: { type: Number }, // total time in seconds
    xpEarned: { type: Number, default: 0 },
    adaptiveLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
    completedAt: { type: Date, default: Date.now }
});

export default mongoose.model("QuizAttempt", quizAttemptSchema);
