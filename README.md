# SkillSculptor - AI-Powered Gamified Learning Platform

SkillSculptor is a full-stack MERN application that provides a state-of-the-art personalized study experience. Enter any topic you want to learn, and the platform will generate custom learning roadmaps, weekly study plans, interactive AI chat tutor sessions, and adaptive quizzes and flashcards to help you master new skills, step by step.

---

## 🚀 Key Features

* 🗺️ **AI Roadmap Generator** - Input any custom skill (e.g. *Quantum Computing*, *Guitar Basics*) or select from 40+ chips to generate a tailored 5-7 step curriculum via Llama-3 (Groq).
* 📅 **AI Study Planner** - Generate a structured weekly schedule specifying focused study sessions (learn, practice, review, project) based on your custom hourly availability and target dates.
* 🧠 **AI Adaptive Learning Engine** - Post-quiz performance is analyzed in real-time. If you struggle, the engine dynamically modifies your roadmap step difficulty or inserts targeted remedial steps.
* 💬 **AI Chat Tutor** - A persistent context-aware tutor sidebar present on every step of your roadmap to answer doubts, provide code snippets, or explain concepts.
* 📚 **Per-Step Dynamic Resources** - Swaps static links for live API-driven recommendations matching the specific skill and step title using YouTube, GitHub, StackOverflow, Udemy, and Coursera.
* 🃏 **AI Flashcard & Quiz Generators** - Topic-based direct modal creators that build conceptual flashcard decks and multiple-choice quizzes that save directly to MongoDB.
* 🎮 **Gamification System** - Earn XP points, climb levels, maintain daily study streaks, and unlock 11 custom progress badges with a live user leaderboard.

---

## 📁 Project Structure

```
Skill-sculptor/
├── skill-sculptor-backend/
│   ├── AI/
│   │   └── aiService.js         # AI client wrapper (Groq/Gemini/OpenAI)
│   ├── models/                  # MongoDB schemas
│   │   ├── User.js
│   │   ├── Flashcard.js
│   │   ├── Quiz.js
│   │   ├── QuizAttempt.js
│   │   ├── UserProgress.js
│   │   ├── Roadmap.js
│   │   ├── Query.js
│   │   └── Dashboard.js
│   ├── routes/                  # API endpoints
│   │   ├── auth.js              # Login, signup, password reset
│   │   ├── ai.js                # AI Planner & Adaptive Engine routes
│   │   ├── flashcard.js         # Flashcard CRUD + generation
│   │   ├── quiz.js              # Quiz CRUD + generation + grading
│   │   ├── gamification.js      # XP, badges, leaderboard
│   │   ├── roadmap.js           # Roadmap CRUD + Resource enrichment
│   │   ├── query.js
│   │   ├── chatTutor.js         # Context-aware chat tutor routes
│   │   └── dashboard.js
│   ├── index.js                 # Server entry point
│   ├── db.js                    # MongoDB connection
│   └── package.json
│
└── skill-sculptor-ui-main/
    ├── src/
    │   ├── pages/               # React pages
    │   │   ├── HomePage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── SignupPage.tsx
    │   │   ├── FlashcardsPage.tsx        # Practice flashcards
    │   │   ├── QuizListPage.tsx          # View all quizzes
    │   │   ├── QuizTakePage.tsx          # Take quiz & review results
    │   │   ├── GamifiedDashboardPage.tsx # Leaderboard & Streaks
    │   │   ├── DashboardPage.tsx         # User landing page
    │   │   ├── QueryFormPage.tsx         # Roadmap generator form
    │   │   ├── RoadmapPage.tsx           # Active roadmap curriculum
    │   │   ├── LearnStepPage.tsx         # Detailed step learning center
    │   │   └── PlannerPage.tsx           # Study calendar & AI planner
    │   ├── components/
    │   │   ├── Navigation.tsx
    │   │   ├── AIChatTutorDrawer.tsx     # Tutoring assistant component
    │   │   ├── StudyNotepadDrawer.tsx    # Note taking sidebar
    │   │   └── ui/                       # Shadcn/ui components
    │   ├── contexts/
    │   │   └── ThemeContext.tsx          # Dark mode context (default dark)
    │   ├── App.tsx                       # Routes configuration
    │   └── main.tsx                      # Entry point
    ├── index.html
    └── vite.config.ts
```

---

## 🔧 Installation & Setup

### Prerequisites
* **Node.js** v18+ 
* **MongoDB** (local or Atlas)
* **npm** or **yarn**
* **Groq API Key** (Get a free key from the [Groq Console](https://console.groq.com/))

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Skill-sculptor
```

### 2. Backend Setup
```bash
cd skill-sculptor-backend
npm install
```

Create a `.env` file in the `skill-sculptor-backend/` root:
```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/skill-sculptor
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173

# AI Key (Groq is preferred and free)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional API Keys
# YOUTUBE_API_KEY=your_youtube_api_key
# GEMINI_API_KEY=your_gemini_api_key
```

### 3. Frontend Setup
```bash
cd ../skill-sculptor-ui-main
npm install
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd skill-sculptor-backend
npm run dev # Runs nodemon on http://localhost:8080
```

**Terminal 2 - Frontend:**
```bash
cd skill-sculptor-ui-main
npm run dev # Runs Vite dev server on http://localhost:5173
```

---

## 📖 Usage Guide

### 1. Generate Your Roadmap
* Go to the **Create** page, type in any skill (e.g. *Docker for Beginners*), choose your starting level, and hit **Generate**.
* The AI will build a personalized multi-level course complete with dynamic search results for YouTube, GitHub, StackOverflow, Udemy, and Coursera.

### 2. Study with the Chat Tutor
* Click on any step in your roadmap to open the **Learning Center**.
* Slide open the **AI Chat Tutor** drawer on the right to converse, clarify details, or ask for coding exercises about that specific level.

### 3. Plan Your Week
* Navigate to **Planner**, click **Generate AI Plan**, enter your target skills and study load.
* A custom study calendar will appear mapping out your weekly learning blocks.

### 4. Master Quizzes & Flashcards
* Click **Quiz** or **Flashcards** to generate decks from scratch based on any topic.
* Take a quiz: if your score is below 60%, the **Adaptive Learning Engine** will automatically flag weak topics and add remedial modules to your roadmap.

---

## 🔌 API Endpoints

### Authentication
* `POST /api/auth/signup` - Register a new account
* `POST /api/auth/login` - Authenticate and get JWT

### AI Services (`routes/ai.js`)
* `POST /api/ai/adapt-roadmap` - Recalculate roadmap steps based on quiz performance
* `POST /api/ai/generate-study-plan` - Formulate a weekly study calendar schedule

### Roadmap & Chat
* `POST /api/roadmap` - Generate new AI roadmap
* `GET /api/roadmap/:id` - Fetch roadmap details (auto-refreshes stale resources)
* `POST /api/chat-tutor` - Handle interactive context-aware tutor chat

### Flashcards
* `POST /api/flashcard/generate` - Generate cards from a topic
* `POST /api/flashcard` - Save flashcards to user profile
* `PUT /api/flashcard/:id/review` - Update card spaced repetition interval

### Quiz
* `POST /api/quiz/generate` - Generate MCQ questions on a topic
* `POST /api/quiz` - Create new quiz
* `POST /api/quiz/:id/attempt` - Grade attempt and trigger user progress update

---

## 🎮 Gamification System

### XP & Levels
* **100 XP** = 1 level
* Level formula: `floor(XP / 100) + 1`

### XP Earning
| Action | XP Earned |
|--------|-----------|
| Create flashcard | +5 per card |
| Review flashcard (correct) | +3 |
| Review flashcard (wrong) | +1 |
| Create quiz | +20 |
| Complete quiz | 50 + bonus (0-50 based on %) |

### Badges (11 Total)
* 🎯 **First Quiz** - Complete your first quiz
* 🏆 **Quiz Master** - Complete 10 quizzes
* 👑 **Quiz Legend** - Complete 50 quizzes
* 💯 **Perfect Score** - Get 100% on a quiz
* ⭐ **Level 5** - Reach level 5
* 🌟 **Level 10** - Reach level 10
* ✨ **Level 20** - Reach level 20
* 📇 **Flashcard Creator** - Create 50 flashcards
* 📚 **Flashcard Master** - Review 100 flashcards
* 🔥 **Week Warrior** - 7 day streak
* 🔥🔥 **Month Master** - 30 day streak

---

**Built with ❤️ using the MERN Stack**
