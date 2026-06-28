// In src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthModal } from '@/components/AuthModal';
import { Navigation } from '@/components/Navigation';
import HomePage from '@/pages/HomePage';
import SignupPage from '@/pages/SignupPage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import QueryFormPage from '@/pages/QueryFormPage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import QuizListPage from '@/pages/QuizListPage';
import QuizTakePage from '@/pages/QuizTakePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import RoadmapPage from '@/pages/RoadmapPage';
import RoadmapListPage from '@/pages/RoadmapListPage';
import LearnStepPage from '@/pages/LearnStepPage';
import FlashcardGeneratePage from '@/pages/FlashcardGeneratePage';
import QuizGeneratePage from '@/pages/QuizGeneratePage';
import UploadPage from '@/pages/UploadPage';
import { ThreeBackground } from '@/components/effects/ThreeBackground';
import { FocusWidget } from '@/components/FocusWidget';


const queryClient = new QueryClient();

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <div className="min-h-screen bg-background flex flex-col relative">
                <ThreeBackground opacity={0.16} />
                <Navigation />
                  <Routes>
                  {/* HomePage - full width, no container */}
                    <Route path="/" element={<HomePage />} />
                  
                  {/* Auth pages - full width */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                  
                  {/* Public generation routes - full width */}
                  <Route path="/flashcards/generate" element={<FlashcardGeneratePage />} />
                  <Route path="/quiz/generate" element={<QuizGeneratePage />} />
                  <Route path="/upload" element={<UploadPage />} />
                    
                    {/* Protected routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/query-form"
                      element={
                        <ProtectedRoute>
                          <QueryFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/flashcards"
                      element={
                        <ProtectedRoute>
                          <FlashcardsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/quiz"
                      element={
                        <ProtectedRoute>
                        <QuizListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/quiz/:id/take"
                      element={
                        <ProtectedRoute>
                        <QuizTakePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/progress"
                      element={
                        <ProtectedRoute>
                        <AnalyticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/roadmap/:id"
                    element={
                      <ProtectedRoute>
                        <RoadmapPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/roadmaps"
                    element={
                      <ProtectedRoute>
                        <RoadmapListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/learn/:roadmapId/:stepIndex"
                    element={
                      <ProtectedRoute>
                        <LearnStepPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Redirect any unknown routes to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                <AuthModal />
                <Toaster />
                <FocusWidget />
              </div>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;