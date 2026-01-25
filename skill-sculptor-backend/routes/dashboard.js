import express from "express";
import Dashboard from "../models/Dashboard.js";
import Roadmap from "../models/Roadmap.js";
import Query from "../models/Query.js";
import passport from "passport";

const router = express.Router();

// ✅ Get Dashboard (do not auto-create)
router.get("/:userId", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { userId } = req.params;

    const dashboard = await Dashboard.findOne({ userId }).populate("savedRoadmaps.roadmapId");
    const hasRoadmap = await Roadmap.exists({ userId });

    if (!hasRoadmap) {
      return res.json({ hasRoadmap: false });
    }

    res.json({ hasRoadmap: true, dashboard: dashboard || { userId, savedRoadmaps: [], completedSteps: [] } });
  } catch (err) {
    next(err);
  }
});

// ✅ Create Dashboard manually
router.post("/", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { userId, roadmapId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    let existing = await Dashboard.findOne({ userId });
    if (existing) {
      // If a roadmapId is provided, append it if not already present
      if (roadmapId) {
        const alreadySaved = existing.savedRoadmaps?.some((r) => String(r.roadmapId) === String(roadmapId));
        if (!alreadySaved) {
          existing.savedRoadmaps.push({ roadmapId });
          await existing.save();
        }
      }
      return res.status(200).json({ message: "Dashboard already exists", dashboard: existing });
    }

    const roadmap = roadmapId ? await Roadmap.findById(roadmapId) : await Roadmap.findOne({ userId });
    const newDashboard = await Dashboard.create({
      userId,
      savedRoadmaps: roadmap ? [{ roadmapId: roadmap._id }] : [],
      completedSteps: [],
    });

    res.status(201).json({ message: "Dashboard created", dashboard: newDashboard });
  } catch (err) {
    next(err);
  }
});

// ✅ Update Dashboard
router.put("/:userId", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const updated = await Dashboard.findOneAndUpdate({ userId: req.params.userId }, req.body, { new: true, upsert: true });
    res.json({ message: "Dashboard updated", updated });
  } catch (err) {
    next(err);
  }
});

export default router;
