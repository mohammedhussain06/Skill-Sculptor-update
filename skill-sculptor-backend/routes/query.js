import express from "express";
import Roadmap from "../models/Roadmap.js";
import Dashboard from "../models/Dashboard.js";
import verifyToken from "../middleware/verifyToken.js";

// Simple providers using public search endpoints where possible
// Use Node's built-in global fetch (Node 18+)

const makeSearchLink = (base, queryParam, q) => `${base}${queryParam}${encodeURIComponent(q)}`;

const PROVIDERS = {
  youtube: async (skill, level) => {
    const levelTerm = level === 'advanced' ? 'advanced' : level === 'intermediate' ? 'intermediate' : 'beginner';
    const q = `${skill} ${levelTerm} tutorial`;
    // Prefer native YouTube Data API v3 if key provided
    if (process.env.YOUTUBE_API_KEY) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(q)}&key=${process.env.YOUTUBE_API_KEY}`;
      const res = await fetch(url).catch(() => null);
      const data = await res?.json().catch(() => null);
      const items = data?.items || [];
      return items.map((it) => ({ title: it.snippet?.title, url: `https://www.youtube.com/watch?v=${it.id?.videoId}` })).filter(r => r.url);
    }
    // Otherwise try RapidAPI
    if (process.env.RAPIDAPI_KEY) {
      const res = await fetch(`https://yt-api.p.rapidapi.com/search?query=${encodeURIComponent(q)}`, {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
        },
      }).catch(() => null);
      const data = await res?.json().catch(() => null);
      const items = data?.data?.slice(0, 6) || [];
      return items.map((it) => ({ title: it.title, url: `https://www.youtube.com/watch?v=${it.videoId}` }));
    }
    return [
      { title: `YouTube: ${q}`, url: makeSearchLink('https://www.youtube.com/results?search_query=', '', q) },
    ];
  },
  github: async (skill, level) => {
    const q = `${skill} ${level || ''} awesome list`;
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=6`).catch(() => null);
    const data = await res?.json().catch(() => null);
    const items = data?.items || [];
    return items.map((r) => ({ title: r.full_name, url: r.html_url }));
  },
  stackoverflow: async (skill, level) => {
    const q = `${skill} ${level || ''}`;
    const res = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=${encodeURIComponent(q)}&site=stackoverflow&pagesize=6`).catch(() => null);
    const data = await res?.json().catch(() => null);
    const items = data?.items || [];
    return items.map((x) => ({ title: x.title, url: x.link }));
  },
  // Static/search-based providers (no key needed)
  mdn: async (skill) => [{ title: 'MDN Web Docs', url: makeSearchLink('https://developer.mozilla.org/en-US/search?q=', '', skill) }],
  w3schools: async (skill) => [{ title: 'W3Schools', url: makeSearchLink('https://www.w3schools.com/howto/howto_css_searchbar.asp?q=', '', skill) }, { title: 'W3Schools Search', url: makeSearchLink('https://www.w3schools.com/search/?q=', '', skill) }],
  freecodecamp: async (skill) => [{ title: 'freeCodeCamp', url: makeSearchLink('https://www.freecodecamp.org/learn/#', '', '') }, { title: `freeCodeCamp: ${skill}`, url: makeSearchLink('https://www.freecodecamp.org/news/search/?query=', '', skill) }],
  coursera: async (skill, level) => [{ title: 'Coursera', url: makeSearchLink('https://www.coursera.org/search?query=', '', `${skill} ${level || ''}`) }],
  udemy: async (skill, level) => [{ title: 'Udemy', url: makeSearchLink('https://www.udemy.com/courses/search/?q=', '', `${skill} ${level || ''}`) }],
};

const router = express.Router();

// ✅ Create roadmap based on query form
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { userId, skill, steps, level } = req.body;
    if (!userId || !skill) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Aggregate resources
    const [yt, gh, so, mdn, w3, fcc, cou, ude] = await Promise.all([
      PROVIDERS.youtube(skill, level).catch(() => []),
      PROVIDERS.github(skill, level).catch(() => []),
      PROVIDERS.stackoverflow(skill, level).catch(() => []),
      PROVIDERS.mdn(skill).catch(() => []),
      PROVIDERS.w3schools(skill).catch(() => []),
      PROVIDERS.freecodecamp(skill).catch(() => []),
      PROVIDERS.coursera(skill, level).catch(() => []),
      PROVIDERS.udemy(skill, level).catch(() => []),
    ]);

    // Level-specific resource grouping
    const normalizedLevel = (level || 'beginner').toLowerCase();
    // Merge with simple de-duplication by URL
    const dedupe = (arr) => {
      const seen = new Set();
      return arr.filter(r => {
        const key = r.url || r.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const beginnerResources = dedupe([...
      yt.slice(0, 5), ...gh.slice(0, 4), ...so.slice(0, 3), ...mdn, ...w3, ...fcc, ...cou, ...ude
    ]);
    const intermediateResources = dedupe([...
      yt.slice(0, 4), ...gh.slice(0, 6), ...so.slice(0, 4), ...mdn, ...fcc, ...cou, ...ude
    ]);
    const advancedResources = dedupe([...
      yt.slice(0, 3), ...gh.slice(0, 8), ...so.slice(0, 6), ...mdn, ...cou, ...ude
    ]);

    const choose = normalizedLevel === 'advanced' ? advancedResources : normalizedLevel === 'intermediate' ? intermediateResources : beginnerResources;

    // Fallbacks if providers return nothing
    const fallback = [
      { title: 'freeCodeCamp', url: 'https://www.freecodecamp.org/' },
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
      { title: 'Coursera', url: 'https://www.coursera.org/' },
      { title: 'Udemy', url: 'https://www.udemy.com/' },
    ];

    const picked = (choose.length ? choose : fallback).slice(0, 15);

    const generatedSteps = [
      { title: `Introduction to ${skill}`, status: "current", difficulty: normalizedLevel === 'advanced' ? 'Advanced' : normalizedLevel === 'intermediate' ? 'Intermediate' : 'Beginner', resources: picked },
      { title: `${skill} Fundamentals`, status: "pending", difficulty: normalizedLevel, resources: picked },
      { title: `Build ${skill} Projects`, status: "pending", difficulty: normalizedLevel, resources: picked },
    ];

    const roadmap = await Roadmap.create({ userId, skill, level: level || "beginner", steps: generatedSteps });

    // 2️⃣ Create the dashboard immediately after roadmap creation
    let dashboard = await Dashboard.findOne({ userId });
    if (!dashboard) {
      dashboard = await Dashboard.create({
        userId,
        savedRoadmaps: [{ roadmapId: roadmap._id }],
        completedSteps: []
      });
    } else {
      dashboard.savedRoadmaps.push({ roadmapId: roadmap._id });
      await dashboard.save();
    }

    res.status(201).json({
      message: "Roadmap and dashboard ready",
      roadmap,
      dashboard
    });
  } catch (err) {
    next(err);
  }
});

export default router;
