import express from "express";
import Roadmap from "../models/Roadmap.js";
import Dashboard from "../models/Dashboard.js";
import passport from "passport";
import { aiService } from "../AI/aiService.js";

const router = express.Router();

function dedupe(arr) {
  const seen = new Set();
  return arr.filter(r => {
    const key = r?.url || r?.title;
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Helper function to normalize skill name (convert hyphens to spaces, capitalize)
const normalizeSkill = (skill) => {
  if (!skill) return '';
  // Convert hyphens to spaces and capitalize words
  return skill
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Build resources SPECIFIC to a single step using the step's topic query.
 * Each step gets its own targeted YouTube, GitHub, StackOverflow, and course links.
 * @param {string} query  - e.g. "Python List Comprehensions" or "React useEffect Hook"
 * @param {string} level  - beginner | intermediate | advanced
 * @param {number} idx    - step index (used to vary resource types per step)
 */
async function buildStepResources(query, level, idx = 0) {
  const encodedQuery = encodeURIComponent(query);
  const encodedQueryWithLevel = encodeURIComponent(`${query} ${level}`);

  // Parallel fetch from live APIs
  const ytPromise = (async () => {
    if (process.env.YOUTUBE_API_KEY) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodedQueryWithLevel}&key=${process.env.YOUTUBE_API_KEY}`;
      const res = await fetch(url).catch(() => null);
      const data = await res?.json().catch(() => null);
      return data?.items?.map(it => ({
        title: it.snippet?.title,
        url: `https://www.youtube.com/watch?v=${it.id?.videoId}`,
        type: 'video'
      })).filter(r => r.url && r.title) || [];
    }
    return [];
  })();

  const ghPromise = fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const soPromise = fetch(
    `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=${encodedQuery}&site=stackoverflow&pagesize=5`
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const [ytItems, ghData, soData] = await Promise.all([ytPromise, ghPromise, soPromise]);

  const yt = ytItems || [];
  const gh = ghData?.items?.map(r => ({ title: `GitHub: ${r.full_name} ⭐${r.stargazers_count?.toLocaleString()}`, url: r.html_url, type: 'github' }))?.slice(0, 3) || [];
  const so = soData?.items?.map(q => ({ title: `StackOverflow: ${q.title}`, url: q.link, type: 'article' }))?.slice(0, 3) || [];

  // Deep-link search URLs to major platforms — all scoped to the exact step query
  const courseLinks = [
    { title: `Udemy: "${query}"`, url: `https://www.udemy.com/courses/search/?q=${encodedQueryWithLevel}&sort=highest-rated`, type: 'course' },
    { title: `Coursera: "${query}"`, url: `https://www.coursera.org/search?query=${encodedQueryWithLevel}`, type: 'course' },
    { title: `edX: "${query}"`, url: `https://www.edx.org/search?q=${encodedQueryWithLevel}`, type: 'course' },
  ];

  const articleLinks = [
    { title: `Dev.to: "${query}"`, url: `https://dev.to/search?q=${encodedQuery}`, type: 'article' },
    { title: `freeCodeCamp: "${query}"`, url: `https://www.freecodecamp.org/news/search/?query=${encodedQuery}`, type: 'article' },
    { title: `Medium: "${query}"`, url: `https://medium.com/search?q=${encodedQuery}`, type: 'article' },
    { title: `MDN: "${query}"`, url: `https://developer.mozilla.org/en-US/search?q=${encodedQuery}`, type: 'docs' },
    { title: `GeeksforGeeks: "${query}"`, url: `https://www.geeksforgeeks.org/search/?query=${encodedQuery}`, type: 'article' },
    { title: `Codecademy: "${query}"`, url: `https://www.codecademy.com/search?query=${encodedQuery}`, type: 'course' },
  ];

  // Vary resource mix by step index so each step feels different
  const resourceMixes = [
    // Step 0 (intro): video-heavy + courses
    [...yt.slice(0, 3), ...courseLinks.slice(0, 2), ...articleLinks.slice(0, 2), ...gh.slice(0, 1), ...so.slice(0, 1)],
    // Step 1: balanced
    [...yt.slice(0, 2), ...gh.slice(0, 2), ...courseLinks.slice(0, 1), ...articleLinks.slice(0, 3), ...so.slice(0, 1)],
    // Step 2: article + stackoverflow + github
    [...articleLinks.slice(0, 3), ...so.slice(0, 2), ...gh.slice(0, 2), ...yt.slice(0, 1), ...courseLinks.slice(0, 1)],
    // Step 3+: github + stackoverflow + advanced articles
    [...gh.slice(0, 3), ...so.slice(0, 3), ...articleLinks.slice(1, 4), ...courseLinks.slice(1, 2)],
  ];

  const mix = resourceMixes[Math.min(idx, resourceMixes.length - 1)];

  // Dedupe and cap at 8 resources per step
  const seen = new Set();
  return mix.filter(r => {
    if (!r?.url || !r?.title) return false;
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  }).slice(0, 8);
}

// ✅ Create Roadmap (optional, mostly for admin/testing)
router.post("/", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { userId, skill, level, goal } = req.body;
    if (!userId || !skill || !level) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const resolvedGoal = goal || `Learn ${skill}`;
    const normalizedSkill = normalizeSkill(skill);
    const levelTerm = level === 'advanced' ? 'advanced' : level === 'intermediate' ? 'intermediate' : 'beginner';

    // Call AI to generate custom steps
    const aiSteps = await aiService.generateRoadmap(normalizedSkill, levelTerm, resolvedGoal);

    // Build step-specific resources for each AI step using skill + step title as search query
    const steps = await Promise.all(aiSteps.map(async (step, idx) => {
      // Use both the skill and the step title for highly specific queries
      const stepQuery = `${normalizedSkill} ${step.title.replace(/^Level\s*\d+:\s*/i, '')}`;
      const stepResources = await buildStepResources(stepQuery, levelTerm, idx);

      return {
        title: step.title,
        description: step.description || `Master core topics for ${step.title}`,
        status: idx === 0 ? "current" : "pending",
        difficulty: step.difficulty || levelTerm,
        resources: stepResources
      };
    }));

    const roadmap = await Roadmap.create({ userId, skill: normalizedSkill, level, goal: resolvedGoal, steps });
    res.status(201).json({ message: "Roadmap created", roadmap });
  } catch (err) {
    next(err);
  }
});

// ✅ Get Roadmap by User
router.get("/user/:userId", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    // Return the most recently created roadmap for dashboard/legacy callers
    const roadmap = await Roadmap.findOne({ userId: req.params.userId }).sort({ createdAt: -1 });
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    // Enrich existing roadmaps that lack resource URLs
    const needsEnrich = !roadmap.steps?.[0]?.resources?.[0]?.url;
    if (needsEnrich) {
      const normalizedSkill = normalizeSkill(roadmap.skill);
      const levelTerm = roadmap.level === 'advanced' ? 'advanced' : roadmap.level === 'intermediate' ? 'intermediate' : 'beginner';
      const src = await buildResources(normalizedSkill, levelTerm);
      // Distinct resources per step
      const intro = dedupe([ ...src.yt.slice(0,4), ...src.docs.slice(0,3), ...src.fcc.slice(0,3), ...src.courses.slice(0,2), ...src.pool.slice(0,5) ]).slice(0,12);
      const fundamentals = dedupe([ ...src.docs.slice(0,4), ...src.so.slice(0,4), ...src.yt.slice(3,7), ...src.courses.slice(0,3), ...src.pool.slice(5,10) ]).slice(0,12);
      const projects = dedupe([ ...src.gh.slice(0,6), ...src.so.slice(3,7), ...src.docs.slice(0,2), ...src.pool.slice(10,15) ]).slice(0,12);
      const perStep = [intro, fundamentals, projects];
      roadmap.steps = roadmap.steps.map((s, idx) => ({ ...s.toObject(), resources: perStep[idx % perStep.length] }));
      await roadmap.save();
    }
    res.json(roadmap);
  } catch (err) {
    next(err);
  }
});

// ✅ Get ALL roadmaps by User
router.get("/user/:userId/all", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.params.userId }).select("_id skill level");
    res.json({ roadmaps });
  } catch (err) {
    next(err);
  }
});

// ✅ Get Roadmap by Id
router.get("/:id", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

    // Detect stale/generic resources — old system stored hardcoded generic links
    const STALE_TITLES = ['MDN Web Docs', 'W3Schools', 'freeCodeCamp Curriculum', 'freeCodeCamp YouTube', 'Udemy Best Sellers', 'Udemy Free Courses', 'GitHub Learning Lab', 'Reddit Programming', 'Coursera Specializations'];
    const firstTitle = roadmap.steps?.[0]?.resources?.[0]?.title || '';
    const hasNoResources = !roadmap.steps?.[0]?.resources?.[0]?.url;
    const hasStaleResources = STALE_TITLES.some(t => firstTitle.includes(t));

    if (hasNoResources || hasStaleResources) {
      const normalizedSkill = normalizeSkill(roadmap.skill);
      const levelTerm = roadmap.level === 'advanced' ? 'advanced' : roadmap.level === 'intermediate' ? 'intermediate' : 'beginner';
      // Re-enrich each step with topic-specific resources
      const enrichedSteps = await Promise.all(
        roadmap.steps.map(async (s, idx) => {
          const stepQuery = `${normalizedSkill} ${s.title.replace(/^Level\s*\d+:\s*/i, '')}`;
          const resources = await buildStepResources(stepQuery, levelTerm, idx);
          return { ...s.toObject(), resources };
        })
      );
      roadmap.steps = enrichedSteps;
      await roadmap.save();
    }
    res.json(roadmap);
  } catch (err) {
    next(err);
  }
});

// ✅ Update Roadmap
router.put("/:id", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const updated = await Roadmap.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Roadmap updated", updated });
  } catch (err) {
    next(err);
  }
});

// ✅ Mark Step as Completed
router.put("/:id/step/:stepIndex/complete", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { id, stepIndex } = req.params;
    const roadmap = await Roadmap.findById(id);
    
    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }
    
    const stepIdx = parseInt(stepIndex);
    if (stepIdx < 0 || stepIdx >= roadmap.steps.length) {
      return res.status(400).json({ message: "Invalid step index" });
    }
    
    // Mark current step as completed
    roadmap.steps[stepIdx].status = "completed";
    
    // Mark next step as current if it exists
    if (stepIdx + 1 < roadmap.steps.length) {
      roadmap.steps[stepIdx + 1].status = "current";
    }
    
    await roadmap.save();
    
    // Update dashboard with completed step
    const dashboard = await Dashboard.findOne({ userId: roadmap.userId });
    if (dashboard) {
      dashboard.completedSteps.push({
        stepTitle: roadmap.steps[stepIdx].title,
        completedAt: new Date()
      });
      dashboard.lastActive = new Date();
      await dashboard.save();
    }
    
    res.json({ 
      message: "Step completed successfully", 
      roadmap,
      completedStep: roadmap.steps[stepIdx]
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Delete Roadmap
router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    
    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }
    
    // Check if user owns this roadmap (must compare as strings — ObjectId !== ObjectId by reference)
    const user = req.user;
    const roadmapUserId = roadmap.userId?.toString();
    const requestUserId = (user._id || user.id)?.toString();
    if (roadmapUserId !== requestUserId) {
      return res.status(403).json({ message: "Not authorized to delete this roadmap" });
    }
    
    // Remove roadmap from dashboard
    const dashboard = await Dashboard.findOne({ userId: roadmap.userId });
    if (dashboard) {
      dashboard.savedRoadmaps = dashboard.savedRoadmaps.filter(
        saved => saved.roadmapId.toString() !== roadmap._id.toString()
      );
      await dashboard.save();
    }
    
    // Delete the roadmap
    await Roadmap.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: "Roadmap deleted successfully",
      deletedRoadmap: {
        id: roadmap._id,
        skill: roadmap.skill,
        level: roadmap.level
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
