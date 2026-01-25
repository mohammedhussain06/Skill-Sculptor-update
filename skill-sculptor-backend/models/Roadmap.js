import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  title: { type: String },
  url: { type: String },
}, { _id: false });

const stepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ["pending", "current", "completed"], default: "pending" },
  resources: [{ type: resourceSchema }],
  duration: { type: String },
  difficulty: { type: String, default: "Beginner" },
});

const roadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skill: { type: String, required: true },
  level: { type: String, required: true },
  goal: { type: String, required: false },
  steps: [stepSchema],
}, { timestamps: true });

export default mongoose.model("Roadmap", roadmapSchema);
