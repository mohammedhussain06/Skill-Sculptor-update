import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    tags: [{ type: String }],
    sourceText: { type: String },
    reviewCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    lastReviewed: { type: Date },
    nextReview: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

flashcardSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model("Flashcard", flashcardSchema);
