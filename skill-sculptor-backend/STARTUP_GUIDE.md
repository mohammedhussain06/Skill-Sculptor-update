# Backend Startup Guide

## Quick Start

1. **Navigate to backend directory:**
   ```bash
   cd skill-sculptor-backend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Create `.env` file** (if it doesn't exist):
   ```env
   PORT=8080
   MONGO_URI=mongodb://localhost:27017/skill-sculptor
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB** (if using local MongoDB):
   ```bash
   # Windows - Make sure MongoDB service is running
   # Or start manually:
   mongod
   
   # Mac/Linux:
   mongod
   ```

5. **Start the backend server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## Troubleshooting

### Server won't start

1. **Check if port 8080 is already in use:**
   ```bash
   # Windows:
   netstat -ano | findstr :8080
   taskkill /PID <PID> /F
   
   # Mac/Linux:
   lsof -ti:8080 | xargs kill -9
   ```

2. **Check MongoDB connection:**
   - Make sure MongoDB is running
   - Verify MONGO_URI in `.env` is correct
   - Check MongoDB logs for errors

3. **Check dependencies:**
   ```bash
   npm install
   ```

4. **Check for missing .env file:**
   - Make sure `.env` exists in `skill-sculptor-backend` directory
   - Verify all required variables are set

### Common Errors

#### "PDF parsing module could not be loaded"
- Reinstall pdf-parse: `npm install pdf-parse`
- Make sure Node.js version is 16+

#### "MongoDB connection failed"
- Check if MongoDB is running
- Verify MONGO_URI in `.env`
- Check MongoDB logs

#### "Port already in use"
- Kill process on port 8080 (see commands above)
- Or change PORT in `.env` to a different port

#### Module import errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 16+)

## Verify Server is Running

1. Open browser and go to: `http://localhost:8080`
2. You should see: "Skill Sculptor Backend is running 🚀"
3. Check console for: "✅ Server running on port 8080"
4. Check console for: "✅ MongoDB connected..."

