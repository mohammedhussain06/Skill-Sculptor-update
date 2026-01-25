// In HomePage.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Target,
  Map,
  TrendingUp,
  Sparkles,
  BookOpen,
  Trophy,
  Users,
  Zap,
  Brain,
  FileText,
  Play,
} from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';
import { useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { requireAuthNavigate } = useRequireAuth();
  const navigate = useNavigate();
  
  const handleTryNow = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      requireAuthNavigate(path);
    }
  };

  const features = [
    {
      icon: Target,
      title: "🎯 Personalized Learning Goals",
      description: "Set your skill objectives and receive tailored learning paths designed specifically for your career aspirations.",
      emoji: "🎯"
    },
    {
      icon: Map,
      title: "🗺️ Interactive Roadmaps",
      description: "Visual step-by-step roadmaps that break down complex skills into manageable, actionable learning milestones.",
      emoji: "🗺️"
    },
    {
      icon: TrendingUp,
      title: "📈 Progress Tracking",
      description: "Monitor your learning journey with detailed analytics and celebrate achievements as you master new skills.",
      emoji: "📈"
    }
  ];

  const studentFeatures = [
    {
      icon: BookOpen,
      title: "Study Smarter",
      description: "AI-powered tools that adapt to your learning style",
      color: "bg-blue-500"
    },
    {
      icon: Zap,
      title: "Quick Learning",
      description: "Master topics faster with spaced repetition",
      color: "bg-yellow-500"
    },
    {
      icon: Users,
      title: "Collaborate",
      description: "Study with friends and share resources",
      color: "bg-green-500"
    },
    {
      icon: Trophy,
      title: "Achieve More",
      description: "Earn badges and track your progress",
      color: "bg-purple-500"
    }
  ];

  const learningTools = [
    {
      icon: Brain,
      title: "Smart Flashcards",
      description: "Create and study with AI-powered flashcards",
      badge: "Flashcards",
      path: "/flashcards/generate",
    },
    {
      icon: FileText,
      title: "Auto-Generated Quizzes",
      description: "Test your knowledge with custom quizzes",
      badge: "Quizzes",
      path: "/quiz/generate",
    },
    {
      icon: Trophy,
      title: "Track Progress",
      description: "Monitor your learning journey",
      badge: "Progress",
      path: "/dashboard",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full">
      <section className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-background">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroImage}
            alt="Background"
            className="w-full h-full object-cover opacity-10"
          />
          {/* Abstract gradient shapes - flowing arrows and circles */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20"></div>
          <div className="absolute bottom-0 left-0 w-full h-full">
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
          </div>
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Sculpt Your Skills, <span className="gradient-text">Step by Step</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-8 sm:mb-12">
            Generate personalized learning roadmaps tailored to your goals and skill level. Transform your ambitions into actionable learning paths with SkillSculptor.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" asChild className="text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-gradient-primary hover:opacity-90 border-0">
              <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                <span>Start Your Journey</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ml-2" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild className="text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-2.5 sm:py-3">
              <Link to="/login">I Already Have an Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 md:py-20 bg-background/80 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Why Choose <span className="gradient-text">SkillSculptor</span>? 🎯
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Our platform combines AI-powered personalization with proven learning methodologies
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="fun-card border-0 shadow-card bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="achievement-badge w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl break-words">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-center text-xs sm:text-sm md:text-base leading-relaxed break-words">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 md:py-20 bg-gradient-subtle w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Perfect for <span className="gradient-text">Students</span>! 🎓
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Designed with students in mind - fun, engaging, and effective learning experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {studentFeatures.map((feature, index) => (
              <Card key={index} className="fun-card border-0 shadow-card bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full ${feature.color} flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <CardTitle className="text-sm sm:text-base md:text-lg break-words">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 p-4 sm:p-6">
                  <CardDescription className="text-center text-xs sm:text-sm leading-relaxed break-words">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 md:py-20 bg-background/90 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Learn with <span className="gradient-text">Flashcards & Quizzes</span> 🧠
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Upload a document once and SkillSculptor creates beautiful flashcards and quizzes for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {learningTools.map((tool, index) => (
              <Card
                key={index}
                className="fun-card border-0 shadow-card bg-card/80 backdrop-blur-sm flex flex-col"
              >
                <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                      <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold mb-1">
                    {tool.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    {tool.description}
                  </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex-1 flex flex-col justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full flex items-center justify-center space-x-1"
                    onClick={() => handleTryNow(tool.path)}
                  >
                    <Play className="w-3 h-3" />
                    <span>Try Now</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-6 sm:py-8 md:py-12 bg-card border-t border-border w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-primary">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold gradient-text">SkillSculptor</span>
            </div>
            <p className="text-muted-foreground text-center md:text-right text-xs sm:text-sm md:text-base">
              © 2025 SkillSculptor. Sculpting skills, one step at a time. 🚀
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}