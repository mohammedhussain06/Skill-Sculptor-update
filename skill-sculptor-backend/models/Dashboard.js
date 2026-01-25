import mongoose from "mongoose";

const savedRoadmapSchema = new mongoose.Schema({
	roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: "Roadmap" },
});

const completedStepSchema = new mongoose.Schema({
	stepTitle: { type: String },
	completedAt: { type: Date, default: Date.now },
});

const dashboardSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
		savedRoadmaps: [savedRoadmapSchema],
		completedSteps: [completedStepSchema],
		currentStreak: { type: Number, default: 0 },
		lastActive: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

export default mongoose.model("Dashboard", dashboardSchema);
