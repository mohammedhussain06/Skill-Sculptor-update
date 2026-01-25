import express from "express";
import Roadmap from "../models/Roadmap.js";
import Dashboard from "../models/Dashboard.js";
import verifyToken from "../middleware/verifyToken.js";

// Simple providers using public search endpoints where possible
// Use Node's built-in global fetch (Node 18+)

const makeSearchLink = (base, queryParam, q) => `${base}${queryParam}${encodeURIComponent(q)}`;

// Helper function to normalize skill name (convert hyphens to spaces, capitalize)
const normalizeSkill = (skill) => {
  if (!skill) return '';
  // Convert hyphens to spaces and capitalize words
  return skill
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const PROVIDERS = {
  youtube: async (skill, level) => {
    const normalizedSkill = normalizeSkill(skill);
    const levelTerm = level === 'advanced' ? 'advanced' : level === 'intermediate' ? 'intermediate' : 'beginner';
    const q = `${normalizedSkill} ${levelTerm} tutorial`;
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
    const normalizedSkill = normalizeSkill(skill);
    const q = `${normalizedSkill} ${level || ''} awesome list`;
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=6`).catch(() => null);
    const data = await res?.json().catch(() => null);
    const items = data?.items || [];
    return items.map((r) => ({ title: r.full_name, url: r.html_url }));
  },
  stackoverflow: async (skill, level) => {
    const normalizedSkill = normalizeSkill(skill);
    const q = `${normalizedSkill} ${level || ''}`;
    const res = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=${encodeURIComponent(q)}&site=stackoverflow&pagesize=6`).catch(() => null);
    const data = await res?.json().catch(() => null);
    const items = data?.items || [];
    return items.map((x) => ({ title: x.title, url: x.link }));
  },
  // Static/search-based providers (no key needed) - now skill-specific
  mdn: async (skill) => {
    const normalizedSkill = normalizeSkill(skill);
    return [
      { title: `MDN Web Docs: ${normalizedSkill}`, url: makeSearchLink('https://developer.mozilla.org/en-US/search?q=', '', normalizedSkill) },
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/' }
    ];
  },
  w3schools: async (skill) => {
    const normalizedSkill = normalizeSkill(skill);
    return [
      { title: `W3Schools: ${normalizedSkill}`, url: makeSearchLink('https://www.w3schools.com/search/?q=', '', normalizedSkill) },
      { title: 'W3Schools', url: 'https://www.w3schools.com/' }
    ];
  },
  freecodecamp: async (skill) => {
    const normalizedSkill = normalizeSkill(skill);
    return [
      { title: `freeCodeCamp: ${normalizedSkill}`, url: makeSearchLink('https://www.freecodecamp.org/news/search/?query=', '', normalizedSkill) },
      { title: 'freeCodeCamp Curriculum', url: 'https://www.freecodecamp.org/learn/' },
      { title: 'freeCodeCamp YouTube', url: 'https://www.youtube.com/c/Freecodecamp' }
    ];
  },
  coursera: async (skill, level) => {
    const normalizedSkill = normalizeSkill(skill);
    const levelTerm = level || '';
    return [
      { title: `Coursera: ${normalizedSkill}`, url: makeSearchLink('https://www.coursera.org/search?query=', '', `${normalizedSkill} ${levelTerm}`) },
      { title: 'Coursera Specializations', url: 'https://www.coursera.org/browse' }
    ];
  },
  udemy: async (skill, level) => {
    const normalizedSkill = normalizeSkill(skill);
    const levelTerm = level || '';
    return [
      { title: `Udemy: ${normalizedSkill}`, url: makeSearchLink('https://www.udemy.com/courses/search/?q=', '', `${normalizedSkill} ${levelTerm}`) },
      { title: 'Udemy Best Sellers', url: 'https://www.udemy.com/courses/development/' }
    ];
  },
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

    // Normalize skill once at the top
    const normalizedSkill = normalizeSkill(skill);

    // Fallbacks if providers return nothing - skill-specific
    const fallback = [
      { title: `freeCodeCamp: ${normalizedSkill}`, url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(normalizedSkill)}` },
      { title: `MDN Web Docs: ${normalizedSkill}`, url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(normalizedSkill)}` },
      { title: `Coursera: ${normalizedSkill}`, url: `https://www.coursera.org/search?query=${encodeURIComponent(normalizedSkill)}` },
      { title: `Udemy: ${normalizedSkill}`, url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(normalizedSkill)}` },
    ];

    const picked = (choose.length ? choose : fallback).slice(0, 15);

    const generatedSteps = [
      { title: `Introduction to ${normalizedSkill}`, status: "current", difficulty: normalizedLevel === 'advanced' ? 'Advanced' : normalizedLevel === 'intermediate' ? 'Intermediate' : 'Beginner', resources: picked },
      { title: `${normalizedSkill} Fundamentals`, status: "pending", difficulty: normalizedLevel, resources: picked },
      { title: `Build ${normalizedSkill} Projects`, status: "pending", difficulty: normalizedLevel, resources: picked },
    ];

    const roadmap = await Roadmap.create({ userId, skill: normalizedSkill, level: level || "beginner", steps: generatedSteps });

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
