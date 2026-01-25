# SkillSculptor - AI-Powered Learning Platform

A full-stack MERN application with OCR text extraction, AI-generated flashcards, MCQ quizzes, and gamified learning experience.

## 🚀 Features

- **📄 PDF/Image Text Extraction (OCR)** - Upload PDFs or images and extract text using Tesseract.js and pdf-parse
- **🧠 Flashcard Generator** - Automatically generate flashcards from extracted text using cloze deletion algorithm
- **📝 MCQ Quiz Creator** - Generate multiple-choice questions with answers and explanations
- **🎮 Gamification System** - XP points, levels, badges, and daily streaks
- **📊 Adaptive Grading** - Performance-based difficulty adjustment (Beginner/Intermediate/Advanced)
- **🏆 Leaderboard** - Compete with other learners
- **💾 Progress Tracking** - Save flashcards, quizzes, scores, and achievements in MongoDB

## 🛠️ Tech Stack

### Frontend
- **React** 18.3.1 - UI library
- **Vite** 5.4.19 - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library (Radix UI)
- **React Router** - Routing
- **Axios** - HTTP client
- **React Query** - State management
- **react-dropzone** - File uploads

### Backend
- **Node.js** - Runtime
- **Express** 5.1.0 - Web framework
- **MongoDB** - Database
- **Mongoose** 8.19.1 - ODM
- **JWT** - Authentication
- **Passport.js** - Auth middleware
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **Tesseract.js** - OCR for images
- **bcrypt** - Password hashing

## 📁 Project Structure

```
Skill-sculptor/
├── skill-sculptor-backend/
│   ├── models/              # MongoDB schemas
│   │   ├── User.js
│   │   ├── Flashcard.js
│   │   ├── Quiz.js
│   │   ├── QuizAttempt.js
│   │   ├── UserProgress.js
│   │   ├── Roadmap.js
│   │   ├── Query.js
│   │   └── Dashboard.js
│   ├── routes/              # API endpoints
│   │   ├── auth.js          # Login, signup, password reset
│   │   ├── ocr.js           # PDF/image text extraction
│   │   ├── flashcard.js     # Flashcard CRUD + generation
│   │   ├── quiz.js          # Quiz CRUD + generation + grading
│   │   ├── gamification.js  # XP, badges, leaderboard
│   │   ├── roadmap.js
│   │   ├── query.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   ├── verifyToken.js   # JWT verification
│   │   └── errorHandler.js
│   ├── index.js             # Server entry point
│   ├── db.js                # MongoDB connection
│   ├── passport.js          # Passport configuration
│   ├── .env                 # Environment variables
│   └── package.json
│
└── skill-sculptor-ui-main/
    ├── src/
    │   ├── pages/           # React pages
    │   │   ├── HomePage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── SignupPage.tsx
    │   │   ├── UploadPage.tsx              # PDF/Image upload
    │   │   ├── FlashcardsPage.tsx          # Practice flashcards
    │   │   ├── FlashcardGeneratePage.tsx   # Generate flashcards
    │   │   ├── QuizListPage.tsx            # View all quizzes
    │   │   ├── QuizGeneratePage.tsx        # Generate quiz
    │   │   ├── QuizTakePage.tsx            # Take quiz
    │   │   ├── GamifiedDashboardPage.tsx   # XP, badges, leaderboard
    │   │   ├── DashboardPage.tsx
    │   │   ├── RoadmapPage.tsx
    │   │   └── ...
    │   ├── components/
    │   │   ├── Navigation.tsx
    │   │   ├── ThemeToggle.tsx
    │   │   └── ui/          # Shadcn components
    │   ├── contexts/
    │   │   └── ThemeContext.tsx
    │   ├── lib/
    │   │   └── utils.ts
    │   ├── App.tsx          # Routes configuration
    │   └── main.tsx         # Entry point
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── package.json
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** v18+ 
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

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

Create `.env` file:
```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/skill-sculptor
JWT_SECRET=your-super-secret-jwt-key-change-this
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd ../skill-sculptor-ui-main
npm install
```

### 4. Start MongoDB
```bash
# If using local MongoDB
mongod
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd skill-sculptor-backend
node index.js
# Server runs on http://localhost:8080
```

**Terminal 2 - Frontend:**
```bash
cd skill-sculptor-ui-main
npm run dev
# App runs on http://localhost:8081 (or 5173)
```

## 📖 Usage Guide

### 1. Sign Up / Login
- Navigate to `http://localhost:8081`
- Create an account or login

### 2. Upload Document
- Click **Upload** in navigation
- Drag & drop PDF or image (PNG, JPG, JPEG)
- Text is automatically extracted

### 3. Generate Flashcards
- After upload, click "Generate Flashcards"
- Choose quantity (5-50) and difficulty
- Edit generated cards if needed
- Click "Save All" to store in database
- **Earn**: +5 XP per flashcard created

### 4. Practice Flashcards
- Click **Flashcards** in navigation
- View cards, click to reveal answer
- Mark "Correct" or "Wrong"
- **Earn**: +3 XP for correct, +1 XP for wrong

### 5. Generate & Take Quizzes
- Upload document → "Generate Quiz"
- Choose question count (3-20) and difficulty
- Edit questions/options if needed
- Save quiz, then click "Take Quiz"
- Answer all questions and submit
- **Earn**: +20 XP for creation, +50-100 XP for completion

### 6. Track Progress
- Click **Progress** in navigation
- View XP, level, badges, and streak
- Check leaderboard ranking
- See detailed statistics

## 🎮 Gamification System

### XP & Levels
- **100 XP** = 1 level
- Level formula: `floor(XP / 100) + 1`

### XP Earning
| Action | XP Earned |
|--------|-----------|
| Create flashcard | +5 per card |
| Review flashcard (correct) | +3 |
| Review flashcard (wrong) | +1 |
| Create quiz | +20 |
| Complete quiz | 50 + bonus (0-50 based on %) |

### Badges (11 Total)
- 🎯 **First Quiz** - Complete your first quiz
- 🏆 **Quiz Master** - Complete 10 quizzes
- 👑 **Quiz Legend** - Complete 50 quizzes
- 💯 **Perfect Score** - Get 100% on a quiz
- ⭐ **Level 5** - Reach level 5
- 🌟 **Level 10** - Reach level 10
- ✨ **Level 20** - Reach level 20
- 📇 **Flashcard Creator** - Create 50 flashcards
- 📚 **Flashcard Master** - Review 100 flashcards
- 🔥 **Week Warrior** - 7 day streak
- 🔥🔥 **Month Master** - 30 day streak

### Adaptive Grading
Quiz performance determines difficulty level:
- **< 60%** → Beginner
- **60-89%** → Intermediate  
- **90%+** → Advanced

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token
```

### OCR
```
POST   /api/ocr/extract           # Extract text from PDF/image
POST   /api/ocr/extract-pdf       # PDF only
POST   /api/ocr/extract-image     # Image only
```

### Flashcards
```
POST   /api/flashcard/generate    # Generate flashcards from text
POST   /api/flashcard             # Create flashcards
GET    /api/flashcard             # Get all user flashcards
PUT    /api/flashcard/:id/review  # Record review
DELETE /api/flashcard/:id         # Delete flashcard
```

### Quiz
```
POST   /api/quiz/generate         # Generate quiz from text
POST   /api/quiz                  # Create quiz
GET    /api/quiz                  # Get all user quizzes
GET    /api/quiz/:id              # Get single quiz
POST   /api/quiz/:id/attempt      # Submit quiz attempt
GET    /api/quiz/:id/attempts     # Get quiz attempts
DELETE /api/quiz/:id              # Delete quiz
```

### Gamification
```
GET    /api/gamification/progress     # Get user progress (XP, level, streak)
GET    /api/gamification/leaderboard  # Get top 10 users
GET    /api/gamification/badges       # Get all badges with status
GET    /api/gamification/stats        # Get detailed stats
POST   /api/gamification/award-xp     # Manually award XP
```

## 🧮 Algorithm Details

### Flashcard Generation (Cloze Deletion)
```javascript
1. Split text into sentences
2. For each sentence:
   - Tokenize into words
   - Select random word (avoid first/last)
   - Replace with "_____"
   - Create flashcard: front = sentence with blank, back = word
```

### Quiz Generation (MCQ)
```javascript
1. Split text into sentences
2. For each sentence:
   - Select random key word
   - Generate 3 distractors (word variations)
   - Randomly position correct answer
   - Create question with 4 options
```

### Adaptive Grading
```javascript
score = correctAnswers / totalQuestions * 100
if (score >= 90) level = "advanced"
else if (score >= 60) level = "intermediate"
else level = "beginner"

baseXP = 50
bonusXP = floor(score / 10) * 5  // 0-50 bonus
totalXP = baseXP + bonusXP
```

### Streak Tracking
```javascript
today = current date (midnight)
lastActivity = user's last activity (midnight)
daysDiff = difference in days

if (daysDiff === 1) streak++ (continue)
else if (daysDiff > 1) streak = 1 (broken)
else no change (already counted today)
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  xp: Number,
  level: Number,
  streak: { current, longest, lastActivity },
  createdAt: Date
}
```

### Flashcards Collection
```javascript
{
  userId: ObjectId,
  title: String,
  front: String,
  back: String,
  difficulty: String,
  reviewCount: Number,
  correctCount: Number,
  lastReviewed: Date,
  nextReview: Date
}
```

### Quizzes Collection
```javascript
{
  userId: ObjectId,
  title: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
    difficulty: String
  }],
  totalAttempts: Number,
  averageScore: Number
}
```

### UserProgress Collection
```javascript
{
  userId: ObjectId,
  xp: Number,
  level: Number,
  badges: [{ id, name, icon, earnedAt }],
  streak: { current, longest, lastActivity },
  totalFlashcardsCreated: Number,
  totalFlashcardsReviewed: Number,
  totalQuizzesTaken: Number,
  totalQuizzesPassed: Number,
  averageQuizScore: Number
}
```

## 🔐 Authentication Flow

1. User signs up → Password hashed with bcrypt
2. User logs in → JWT token generated
3. Token stored in localStorage on frontend
4. Protected routes verify token via Passport.js
5. Token includes user ID → `req.user` populated

## 🚧 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod
```

### Port Already in Use
```bash
# Kill process on port 8080
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8080 | xargs kill -9
```

### PDF Parse Import Error
The project uses `createRequire` to import pdf-parse in ES modules:
```javascript
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `8080` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/skill-sculptor` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `EMAIL_USER` | Email for password reset | `your-email@gmail.com` |
| `EMAIL_PASS` | Email password | `your-password` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🎯 Future Enhancements

- [ ] OpenAI integration for better question generation
- [ ] Spaced repetition algorithm (SM-2)
- [ ] Audio flashcards
- [ ] Collaborative learning (share quizzes)
- [ ] Mobile app (React Native)
- [ ] Real-time multiplayer quizzes
- [ ] Study statistics and analytics
- [ ] Export flashcards to Anki

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 🙏 Acknowledgments

- **Tesseract.js** - OCR engine
- **pdf-parse** - PDF text extraction
- **Shadcn/ui** - Beautiful UI components
- **MongoDB** - Database
- **Express** - Backend framework

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using MERN Stack**
