import express from "express";
import Roadmap from "../models/Roadmap.js";
import Dashboard from "../models/Dashboard.js";
import passport from "passport";

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

// Helper to build diversified, level-aware resources
async function buildResources(skill, levelTerm) {
  const ytPromise = (async () => {
    if (process.env.YOUTUBE_API_KEY) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(`${skill} ${levelTerm} tutorial`)}&key=${process.env.YOUTUBE_API_KEY}`;
      const res = await fetch(url).catch(() => null);
      return res?.json().catch(() => null);
    }
    if (process.env.RAPIDAPI_KEY) {
      const res = await fetch(`https://yt-api.p.rapidapi.com/search?query=${encodeURIComponent(`${skill} ${levelTerm} tutorial`)}`, {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
          "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
        },
      }).catch(() => null);
      return res?.json().catch(() => null);
    }
    return null;
  })();

  const ghPromise = fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(`${skill} ${levelTerm} awesome list`)}&sort=stars&order=desc&per_page=10`)
    .then(r => r.ok ? r.json() : null).catch(() => null);

  const soPromise = fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=${encodeURIComponent(`${skill} ${levelTerm}`)}&site=stackoverflow&pagesize=10`)
    .then(r => r.ok ? r.json() : null).catch(() => null);

  const mdn = [
    { title: 'MDN Web Docs', url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(skill)}` },
    { title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' },
    { title: 'MDN CSS Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' }
  ];
  const w3 = [
    { title: 'W3Schools', url: `https://www.w3schools.com/search/?q=${encodeURIComponent(skill)}` },
    { title: 'W3Schools Tutorials', url: 'https://www.w3schools.com/' },
    { title: 'W3Schools Examples', url: 'https://www.w3schools.com/html/html_examples.asp' }
  ];
  const fcc = [
    { title: 'freeCodeCamp', url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(skill)}` },
    { title: 'freeCodeCamp Curriculum', url: 'https://www.freecodecamp.org/learn/' },
    { title: 'freeCodeCamp YouTube', url: 'https://www.youtube.com/c/Freecodecamp' }
  ];
  const coursera = [
    { title: 'Coursera', url: `https://www.coursera.org/search?query=${encodeURIComponent(`${skill} ${levelTerm}`)}` },
    { title: 'Coursera Specializations', url: 'https://www.coursera.org/browse' },
    { title: 'Coursera Professional Certificates', url: 'https://www.coursera.org/professional-certificates' }
  ];
  const udemy = [
    { title: 'Udemy', url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(`${skill} ${levelTerm}`)}` },
    { title: 'Udemy Best Sellers', url: 'https://www.udemy.com/courses/development/' },
    { title: 'Udemy Free Courses', url: 'https://www.udemy.com/courses/free/' }
  ];
  
  // Additional resource sources
  const additionalResources = [
    { title: 'GitHub Learning Lab', url: 'https://lab.github.com/' },
    { title: 'Codecademy', url: `https://www.codecademy.com/search?query=${encodeURIComponent(skill)}` },
    { title: 'Khan Academy', url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(skill)}` },
    { title: 'edX', url: `https://www.edx.org/search?q=${encodeURIComponent(`${skill} ${levelTerm}`)}` },
    { title: 'MIT OpenCourseWare', url: `https://ocw.mit.edu/search/?d=Electrical%20Engineering%20and%20Computer%20Science&s=${encodeURIComponent(skill)}` },
    { title: 'Reddit Programming', url: 'https://www.reddit.com/r/programming/' },
    { title: 'Dev.to', url: `https://dev.to/search?q=${encodeURIComponent(skill)}` },
    { title: 'Medium Programming', url: `https://medium.com/search?q=${encodeURIComponent(skill)}` }
  ];

  const [ytData, ghData, soData] = await Promise.all([ytPromise, ghPromise, soPromise]);
  const yt = ytData?.items
    ? ytData.items.map((it) => ({ title: it.snippet?.title, url: `https://www.youtube.com/watch?v=${it.id?.videoId}` })).filter(r => r.url).slice(0,6)
    : (ytData?.data?.map((it) => ({ title: it.title, url: `https://www.youtube.com/watch?v=${it.videoId}` }))?.slice(0, 6) || []);
  const gh = ghData?.items?.map((r) => ({ title: r.full_name, url: r.html_url }))?.slice(0, 6) || [];
  const so = soData?.items?.map((q) => ({ title: q.title, url: q.link }))?.slice(0, 6) || [];

  const dedupe = (arr) => {
    const seen = new Set();
    return arr.filter(r => {
      const key = r.url || r.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const beginner = dedupe([ ...yt.slice(0,5), ...mdn, ...w3, ...fcc, ...gh.slice(0,3), ...so.slice(0,3), ...coursera, ...udemy, ...additionalResources.slice(0,4) ]).slice(0,25);
  const intermediate = dedupe([ ...yt.slice(0,4), ...gh.slice(0,8), ...so.slice(0,5), ...mdn, ...fcc, ...coursera, ...udemy, ...additionalResources.slice(0,6) ]).slice(0,25);
  const advanced = dedupe([ ...yt.slice(0,3), ...gh.slice(0,10), ...so.slice(0,7), ...mdn, ...coursera, ...udemy, ...additionalResources.slice(0,8) ]).slice(0,25);

  // Return a detailed pool so different steps can get different subsets
  const pool = levelTerm === 'advanced' ? advanced : levelTerm === 'intermediate' ? intermediate : beginner;

  const bySource = {
    yt,
    gh,
    so,
    docs: dedupe([...mdn, ...w3]),
    fcc,
    courses: dedupe([...coursera, ...udemy]),
    pool
  };

  return bySource;
}

// ✅ Create Roadmap (optional, mostly for admin/testing)
router.post("/", passport.authenticate("jwt", { session: false }), async (req, res, next) => {
  try {
    const { userId, skill, level, goal } = req.body;
    if (!userId || !skill || !level) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Allow multiple roadmaps per user; do not block on existing records

    const resolvedGoal = goal || `Learn ${skill}`;

    const levelTerm = level === 'advanced' ? 'advanced' : level === 'intermediate' ? 'intermediate' : 'beginner';
    const src = await buildResources(skill, levelTerm);
    const intro = dedupe([ ...src.yt.slice(0,4), ...src.docs.slice(0,3), ...src.fcc.slice(0,3), ...src.courses.slice(0,2), ...src.pool.slice(0,5) ]).slice(0,12);
    const fundamentals = dedupe([ ...src.docs.slice(0,4), ...src.so.slice(0,4), ...src.yt.slice(3,7), ...src.courses.slice(0,3), ...src.pool.slice(5,10) ]).slice(0,12);
    const projects = dedupe([ ...src.gh.slice(0,6), ...src.so.slice(3,7), ...src.docs.slice(0,2), ...src.pool.slice(10,15) ]).slice(0,12);

    const steps = [
      { title: levelTerm === 'advanced' ? `Advanced ${skill} Concepts` : levelTerm === 'intermediate' ? `${skill} Fundamentals` : `Introduction to ${skill}`, status: "current", difficulty: levelTerm === 'advanced' ? 'Advanced' : levelTerm === 'intermediate' ? 'Intermediate' : 'Beginner', resources: intro },
      { title: levelTerm === 'advanced' ? `Scalable ${skill} Architectures` : levelTerm === 'intermediate' ? `Intermediate ${skill} Projects` : `${skill} Basics Practice`, status: "pending", difficulty: levelTerm, resources: fundamentals },
      { title: levelTerm === 'advanced' ? `Performance & Optimization in ${skill}` : levelTerm === 'intermediate' ? `Apply ${skill} in Real Projects` : `First ${skill} Project`, status: "pending", difficulty: levelTerm, resources: projects },
    ];

    const roadmap = await Roadmap.create({ userId, skill, level, goal: resolvedGoal, steps });
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
      const levelTerm = roadmap.level === 'advanced' ? 'advanced' : roadmap.level === 'intermediate' ? 'intermediate' : 'beginner';
      const src = await buildResources(roadmap.skill, levelTerm);
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
    const needsEnrich = !roadmap.steps?.[0]?.resources?.[0]?.url;
    if (needsEnrich) {
      const levelTerm = roadmap.level === 'advanced' ? 'advanced' : roadmap.level === 'intermediate' ? 'intermediate' : 'beginner';
      const src = await buildResources(roadmap.skill, levelTerm);
      const intro = dedupe([ ...src.yt.slice(0,3), ...src.docs.slice(0,2), ...src.fcc.slice(0,2), ...src.courses.slice(0,1) ]).slice(0,8);
      const fundamentals = dedupe([ ...src.docs.slice(0,3), ...src.so.slice(0,3), ...src.yt.slice(2,5), ...src.courses.slice(0,2) ]).slice(0,8);
      const projects = dedupe([ ...src.gh.slice(0,5), ...src.so.slice(2,5), ...src.docs.slice(0,1) ]).slice(0,8);
      const perStep = [intro, fundamentals, projects];
      roadmap.steps = roadmap.steps.map((s, idx) => ({ ...s.toObject(), resources: perStep[idx % perStep.length] }));
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
    
    // Check if user owns this roadmap
    const user = req.user;
    if (roadmap.userId !== user._id && roadmap.userId !== user.id) {
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
