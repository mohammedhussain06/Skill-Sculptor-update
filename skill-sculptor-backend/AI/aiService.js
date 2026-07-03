import { OpenAI } from "openai";

const getGroqApiKey = () => process.env.GROQ_API_KEY || "";
const getGeminiApiKey = () => process.env.GEMINI_API_KEY || "";
const getOpenAiApiKey = () => process.env.OPENAI_API_KEY || "";

// Call Groq API via REST fetch (zero-dependency)
async function callGroqRest(prompt, isJson = false) {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error("Groq API key not configured");

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const requestBody = {
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    response_format: isJson ? { type: "json_object" } : undefined
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const textResponse = data.choices?.[0]?.message?.content;
  if (!textResponse) throw new Error("Empty response from Groq API");

  return textResponse;
}

// Call Gemini API via REST fetch (zero-dependency)
async function callGeminiRest(prompt, isJson = false) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API key not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: isJson ? { responseMimeType: "application/json" } : undefined
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) throw new Error("Empty response from Gemini API");

  return textResponse;
}

// Call OpenAI API via SDK
async function callOpenAi(prompt, isJson = false) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: isJson ? { type: "json_object" } : undefined
  });

  return response.choices[0]?.message?.content || "";
}

// Helper to route prompt to active provider
async function requestAiText(prompt, isJson = false) {
  if (getGroqApiKey()) {
    return callGroqRest(prompt, isJson);
  }
  if (getGeminiApiKey()) {
    return callGeminiRest(prompt, isJson);
  }
  if (getOpenAiApiKey()) {
    return callOpenAi(prompt, isJson);
  }
  throw new Error("No AI API keys found. Please configure GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in .env");
}

// Safely extracts a valid JSON array or wraps a JSON object containing an array from the AI text response
function extractJsonArray(text) {
  let cleaned = text.trim();
  
  // Clean markdown block wrappers
  if (cleaned.includes("```")) {
    const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      for (const key of ["steps", "roadmap", "levels", "flashcards", "questions", "quiz"]) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
    }
  } catch (e) {
    // Continue extraction
  }

  // Match array brackets [ ... ]
  const startIdx = cleaned.indexOf("[");
  const endIdx = cleaned.lastIndexOf("]");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const arrayPart = cleaned.substring(startIdx, endIdx + 1);
    try {
      const parsed = JSON.parse(arrayPart);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Continue to object
    }
  }

  // Match object brackets { ... }
  const startObj = cleaned.indexOf("{");
  const endObj = cleaned.lastIndexOf("}");
  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    const objPart = cleaned.substring(startObj, endObj + 1);
    try {
      const parsed = JSON.parse(objPart);
      for (const key of ["steps", "roadmap", "levels", "flashcards", "questions", "quiz"]) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
    } catch (e) {
      // Fallback failed
    }
  }

  throw new Error("Failed to parse AI response as JSON array");
}

export const aiService = {
  // 1. Generate Custom Roadmaps
  generateRoadmap: async (skill, level, goal) => {
    const prompt = `You are a world-class curriculum developer. Create a step-by-step learning roadmap for learning "${skill}" at "${level}" difficulty.
The learner's goal is: "${goal}".
Design a progressive learning journey consisting of 5 to 7 steps (levels).
For each step, specify:
1. "title": A clear, gamified name (e.g. "Level 1: Python Basics" or "Level 4: Advanced Web Scraping").
2. "description": A brief summary of what they will master.
3. "difficulty": Set to either "Beginner", "Intermediate", or "Advanced".

Return ONLY a valid JSON array of objects. Do not include markdown code block wrappers (like \`\`\`json) or extra text. Output exactly this format:
[
  {
    "title": "Level step title",
    "description": "Short description of mastery concepts",
    "difficulty": "Beginner|Intermediate|Advanced"
  }
]`;

    try {
      const responseText = await requestAiText(prompt, true);
      return extractJsonArray(responseText);
    } catch (err) {
      console.warn("AI Roadmap generation failed, using procedural fallback:", err.message);
      // Premium Fallback Generator if no API keys are present
      return [
        { title: `Level 1: Introduction to ${skill}`, description: `Establish core fundamentals and setup environment for ${skill}.`, difficulty: "Beginner" },
        { title: `Level 2: Core ${skill} Mechanics`, description: `Learn control flows, structures, and basic functions of ${skill}.`, difficulty: "Beginner" },
        { title: `Level 3: Intermediate ${skill} Patterns`, description: `Master asynchronous operations, modular code, and error handling in ${skill}.`, difficulty: "Intermediate" },
        { title: `Level 4: Building Real Projects`, description: `Apply concepts to create a solid console or light GUI application with ${skill}.`, difficulty: "Intermediate" },
        { title: `Level 5: Advanced Optimization`, description: `Profile performance, debug memory leaks, and deploy production configurations of ${skill}.`, difficulty: "Advanced" }
      ];
    }
  },

  // 2. Generate Interactive Quizzes
  generateQuiz: async (topic, count = 5, level = "Beginner") => {
    const prompt = `Generate a quiz containing exactly ${count} multiple-choice questions for the topic: "${topic}" at a "${level}" difficulty level.
For each question, provide:
1. "question": The question text.
2. "options": An array of exactly 4 choices.
3. "correctAnswerIndex": The 0-based index of the correct answer (0, 1, 2, or 3).
4. "explanation": A detailed, encouraging explanation of why that option is correct.

Return ONLY a valid JSON array matching this format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 1,
    "explanation": "Explanation of the correct choice."
  }
]`;

    try {
      const responseText = await requestAiText(prompt, true);
      return extractJsonArray(responseText);
    } catch (err) {
      console.warn("AI Quiz generation failed, using procedural fallback:", err.message);
      return Array.from({ length: count }).map((_, i) => ({
        question: `Question ${i + 1} regarding ${topic}?`,
        options: ["Correct Option", "Incorrect Option B", "Incorrect Option C", "Incorrect Option D"],
        correctAnswerIndex: 0,
        explanation: `This is a sample explanation for the topic: ${topic}. Please check your .env settings to activate real AI generation.`
      }));
    }
  },

  // 3. Generate Conceptual Flashcards
  generateFlashcards: async (topic, count = 8) => {
    const prompt = `Generate exactly ${count} educational flashcards for studying "${topic}".
Each card must test core concepts, definitions, or code syntax.
For each card, specify:
1. "front": A prompt, question, or term (e.g. "What is a Closure?").
2. "back": A clear, concise answer or definition.

Return ONLY a valid JSON array matching this format:
[
  {
    "front": "Front of the card",
    "back": "Back of the card"
  }
]`;

    try {
      const responseText = await requestAiText(prompt, true);
      return extractJsonArray(responseText);
    } catch (err) {
      console.warn("AI Flashcard generation failed, using procedural fallback:", err.message);
      return Array.from({ length: count }).map((_, i) => ({
        front: `Core concept ${i + 1} of ${topic}?`,
        back: `Detailed explanation of concept ${i + 1} for study. Add your GEMINI_API_KEY to activate full AI generators.`
      }));
    }
  },

  // 4. Interactive Chat Tutor
  generateChatResponse: async (chatHistory, message, context) => {
    const systemPrompt = `You are "SkillSculptor Tutor", a friendly, highly intelligent, and encouraging AI study companion.
The user is currently studying the following topic: "${context.roadmapTitle}".
They are currently on this step: "${context.stepTitle}".
Help them master this level by explaining concepts simply, writing code snippets, or answering doubts. Keep responses concise, clear, and structured in Markdown.

Here is the conversation history:
${chatHistory.map(h => `${h.sender === "user" ? "User" : "Tutor"}: ${h.text}`).join("\n")}

User: ${message}
Tutor:`;

    try {
      return await requestAiText(systemPrompt, false);
    } catch (err) {
      console.error("Tutor AI execution failed:", err);
      return `Hello! I am ready to help you learn about ${context.stepTitle}.\n\n(Tutor Error Details: "${err.message}". Make sure to restart your backend Node server after saving your .env file, and verify your API key value!)`;
    }
  },

  // 5. AI Adaptive Learning Engine
  // Analyzes quiz performance and returns recommendations for roadmap adjustment
  adaptRoadmap: async (skill, steps, quizScore, weakTopics) => {
    const stepSummary = steps.map((s, i) => `${i + 1}. ${s.title} (${s.difficulty})`).join("\n");
    const prompt = `You are an expert curriculum designer. A learner studying "${skill}" just scored ${quizScore}% on a quiz.
Their weak topics were: ${weakTopics.length > 0 ? weakTopics.join(", ") : "none identified"}.

Current roadmap steps:
${stepSummary}

Based on the performance (${quizScore}%):
- If score < 60%: recommend revisiting earlier steps and suggest inserting remedial steps
- If score 60–80%: suggest continuing but flagging weak topics for review
- If score > 80%: learner can advance, suggest accelerating or skipping beginner steps

Return ONLY a valid JSON object in this exact format:
{
  "verdict": "advance" | "review" | "remediate",
  "message": "Short encouraging message to the learner (1-2 sentences)",
  "stepAdjustments": [
    {
      "stepIndex": 0,
      "action": "keep" | "emphasize" | "skip" | "insert_before",
      "reason": "Why this adjustment is recommended",
      "newDifficulty": "Beginner" | "Intermediate" | "Advanced"
    }
  ],
  "insertSteps": [
    {
      "title": "Remedial step title",
      "description": "What this step covers",
      "difficulty": "Beginner",
      "insertBeforeIndex": 2
    }
  ]
}`;

    try {
      const responseText = await requestAiText(prompt, true);
      let cleaned = responseText.trim();
      if (cleaned.includes("```")) {
        const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
        if (match && match[1]) cleaned = match[1].trim();
      }
      const startObj = cleaned.indexOf("{");
      const endObj = cleaned.lastIndexOf("}");
      if (startObj !== -1 && endObj !== -1) {
        return JSON.parse(cleaned.substring(startObj, endObj + 1));
      }
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn("AI adaptive learning failed, using score-based fallback:", err.message);
      return {
        verdict: quizScore >= 80 ? "advance" : quizScore >= 60 ? "review" : "remediate",
        message: quizScore >= 80
          ? "Great work! You're ready to move ahead. Keep up the momentum!"
          : quizScore >= 60
          ? "Good effort! Review the weak topics before moving on."
          : "No worries — revisiting the basics will make you stronger. Take your time!",
        stepAdjustments: [],
        insertSteps: []
      };
    }
  },

  // 6. AI Study Planner
  // Generates a personalized weekly study plan
  generateStudyPlan: async (skills, hoursPerDay, daysPerWeek, startDate, goalDate) => {
    const prompt = `You are an expert study coach. Create a personalized weekly study plan for a learner.

Skills to learn: ${skills.join(", ")}
Available study time: ${hoursPerDay} hours per day, ${daysPerWeek} days per week
Start date: ${startDate}
Target completion date: ${goalDate || "flexible"}

Generate a structured ${daysPerWeek}-day weekly study schedule. For each day, provide 1-3 focused study sessions.

Return ONLY a valid JSON array in this exact format:
[
  {
    "day": "Monday",
    "date": "YYYY-MM-DD",
    "sessions": [
      {
        "time": "09:00 - 10:30",
        "skill": "Python",
        "topic": "Variables and Data Types",
        "type": "learn" | "practice" | "review" | "project",
        "duration": 90,
        "description": "Brief description of what to study"
      }
    ],
    "totalMinutes": 90,
    "focus": "Main theme for the day"
  }
]`;

    try {
      const responseText = await requestAiText(prompt, true);
      return extractJsonArray(responseText);
    } catch (err) {
      console.warn("AI study plan generation failed:", err.message);
      // Fallback: generate a basic plan
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const activeDays = days.slice(0, daysPerWeek);
      return activeDays.map((day, i) => ({
        day,
        date: "",
        sessions: skills.map((skill, si) => ({
          time: `${9 + si}:00 - ${9 + si}:00`.replace(/(\d+):00 - \1:00/, `${9 + si}:00 - ${9 + si + Math.floor(hoursPerDay / skills.length)}:00`),
          skill,
          topic: `${skill} — Session ${i + 1}`,
          type: i % 3 === 0 ? "learn" : i % 3 === 1 ? "practice" : "review",
          duration: Math.floor((hoursPerDay * 60) / skills.length),
          description: `Study core concepts of ${skill}`
        })),
        totalMinutes: hoursPerDay * 60,
        focus: `${skills[i % skills.length]} fundamentals`
      }));
    }
  }
};
