// In HomePage.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight, Target, Map, TrendingUp, Sparkles, BookOpen,
  Trophy, Users, Zap, Brain, FileText, Play, Star, CheckCircle,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { requireAuthNavigate } = useRequireAuth();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  const handleTryNow = (path: string) => {
    if (isAuthenticated) navigate(path);
    else requireAuthNavigate(path);
  };

  // Anime.js entry animations
  useEffect(() => {
    (async () => {
      try {
        const anime = (await import('animejs')).default;

        // Hero stagger
        anime({
          targets: '#hero-badge, #hero-title, #hero-sub, #hero-cta',
          translateY: [32, 0],
          opacity: [0, 1],
          delay: anime.stagger(120, { start: 200 }),
          duration: 800,
          easing: 'easeOutExpo',
        });
      } catch { /* anime not yet loaded */ }
    })();
  }, []);

  // Feature cards intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          try {
            const anime = (await import('animejs')).default;
            anime({
              targets: entry.target.querySelectorAll('.anim-card'),
              translateY: [40, 0],
              opacity: [0, 1],
              scale: [0.94, 1],
              delay: anime.stagger(100),
              duration: 700,
              easing: 'easeOutExpo',
            });
          } catch { /* skip */ }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (toolsRef.current) observer.observe(toolsRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Target,
      title: "Personalized Learning Goals",
      description: "Set your skill objectives and receive tailored learning paths designed specifically for your career aspirations.",
      color: 'from-violet-500 to-purple-600',
      glow: 'rgba(124,58,237,0.3)',
    },
    {
      icon: Map,
      title: "Interactive Roadmaps",
      description: "Visual step-by-step roadmaps that break down complex skills into manageable, actionable learning milestones.",
      color: 'from-cyan-500 to-teal-500',
      glow: 'rgba(6,182,212,0.3)',
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed analytics and celebrate achievements as you master new skills.",
      color: 'from-amber-500 to-orange-500',
      glow: 'rgba(245,158,11,0.3)',
    },
  ];

  const studentFeatures = [
    { icon: BookOpen, title: "Study Smarter", description: "AI-powered tools that adapt to your learning style", color: 'from-blue-500 to-violet-500' },
    { icon: Zap, title: "Quick Learning", description: "Master topics faster with spaced repetition", color: 'from-amber-400 to-orange-500' },
    { icon: Users, title: "Compete & Rise", description: "Climb the leaderboard and earn badges", color: 'from-green-400 to-cyan-500' },
    { icon: Trophy, title: "Achieve More", description: "Unlock achievements and track your progress", color: 'from-violet-500 to-pink-500' },
  ];

  const learningTools = [
    { icon: Brain, title: "Smart Flashcards", description: "Create and study with AI-powered flashcards", badge: "Flashcards", path: "/flashcards/generate", color: 'border-violet-500/30 hover:border-violet-500/60', iconColor: 'text-violet-400' },
    { icon: FileText, title: "Auto-Generated Quizzes", description: "Test your knowledge with custom quizzes", badge: "Quizzes", path: "/quiz/generate", color: 'border-cyan-500/30 hover:border-cyan-500/60', iconColor: 'text-cyan-400' },
    { icon: Trophy, title: "Track Progress", description: "Monitor your learning journey with gamification", badge: "Progress", path: "/dashboard", color: 'border-amber-500/30 hover:border-amber-500/60', iconColor: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full overflow-hidden">

      {/* ────────────────────────── HERO ────────────────────────── */}
      <section className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        {/* Aurora gradient overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl floating-bg" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl floating-bg-delayed" />
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-amber-500/6 rounded-full blur-3xl floating-bg" style={{ animationDelay: '-3s' }} />
        </div>

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center" ref={heroRef}>
          {/* Badge */}
          <div
            id="hero-badge"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6
                       bg-primary/10 border border-primary/20 text-foreground
                       backdrop-blur-sm"
            style={{ opacity: 0 }}
          >
            AI-Powered Learning Platform
          </div>

          {/* Title */}
          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] font-display text-foreground"
            style={{ opacity: 0 }}
          >
            Sculpt Your Skills,{' '}
            <span className="text-primary font-display">Step by Step</span>
          </h1>

          {/* Subtitle */}
          <p
            id="hero-sub"
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            style={{ opacity: 0 }}
          >
            Generate personalized AI learning roadmaps, master with smart flashcards and quizzes,
            and track your progress on a gamified journey to expertise.
          </p>

          {/* CTA buttons */}
          <div id="hero-cta" className="flex flex-col sm:flex-row gap-3 justify-center" style={{ opacity: 0 }}>
            <Button
              size="lg"
              asChild
              className="text-base px-8 py-3 bg-gradient-primary hover:opacity-90 border-0 font-bold transition-all duration-300"
            >
              <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
                Start for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="text-base px-8 py-3 border-white/15 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/25 transition-all duration-300"
            >
              <Link to="/login">I Have an Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ────────────────────────── FEATURES ────────────────────────── */}
      <section className="relative py-16 sm:py-24 w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Why Choose{' '}
              <span className="gradient-text">SkillSculptor</span>?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Our platform combines AI-powered personalization with proven learning methodologies
            </p>
          </div>

          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="anim-card group relative rounded-2xl p-6 sm:p-8 border border-white/8 bg-white/3 backdrop-blur-sm
                           hover:border-violet-500/30 hover:bg-white/5 transition-all duration-400 cursor-default"
                style={{ opacity: 0 }}
              >
                {/* Top glow */}
                <div
                  className="absolute top-0 inset-x-0 h-px rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${feature.glow.replace('0.3', '0.6')}, transparent)` }}
                />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-3.5 mb-5 shadow-lg constant-glow`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── STUDENTS SECTION ────────────────────────── */}
      <section className="relative py-16 sm:py-20 w-full overflow-hidden">
        <div className="absolute inset-0 aurora-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Perfect for{' '}
              <span className="gradient-text">Students</span>! 🎓
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Designed with students in mind — fun, engaging, and effective
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {studentFeatures.map((f, i) => (
              <div
                key={i}
                className={`anim-card group fun-card p-5 sm:p-6 flex flex-col items-center text-center stagger-${i + 1}`}
                style={{ opacity: 0 }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} p-3.5 mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 constant-glow`}>
                  <f.icon className="w-full h-full text-white" />
                </div>
                <h4 className="font-semibold text-base mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{f.title}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── TOOLS ────────────────────────── */}
      <section className="relative py-16 sm:py-24 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Learn with{' '}
              <span className="gradient-text">Flashcards & Quizzes</span> 🧠
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Upload a document once — SkillSculptor creates beautiful flashcards and quizzes for you.
            </p>
          </div>

          <div ref={toolsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learningTools.map((tool, i) => (
              <div
                key={i}
                className={`anim-card group relative rounded-2xl border bg-white/3 backdrop-blur-sm p-6 flex flex-col
                            transition-all duration-300 ${tool.color}`}
                style={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <tool.icon className={`w-6 h-6 ${tool.iconColor}`} />
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-white/8 border border-white/10 text-muted-foreground">
                    {tool.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{tool.title}</h3>
                <p className="text-muted-foreground text-sm mb-5 flex-1">{tool.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
                  onClick={() => handleTryNow(tool.path)}
                >
                  <Play className="w-3.5 h-3.5 mr-2" />
                  Try Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── CTA BANNER ────────────────────────── */}
      <section className="relative py-16 sm:py-24 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-900/20 via-background to-cyan-900/20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-tri opacity-30" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-tri opacity-30" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4 sm:px-6">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ready to <span className="gradient-text">Sculpt Your Future</span>?
          </h2>
          <p className="text-muted-foreground mb-8 text-base">
            Join thousands of students already accelerating their learning with SkillSculptor.
          </p>
          <Button
            size="lg"
            asChild
            className="px-10 py-3 bg-gradient-primary border-0 font-bold transition-all duration-300"
          >
            <Link to={isAuthenticated ? '/dashboard' : '/signup'}>
              Start Learning Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>No credit card required</span>
            <span className="mx-2">·</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Free forever plan</span>
          </div>
        </div>
      </section>

      {/* ────────────────────────── FOOTER ────────────────────────── */}
      <footer className="py-8 sm:py-10 border-t border-white/8 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-primary">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground font-display">
                SkillSculptor
              </span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm text-center md:text-right">
              © 2025 SkillSculptor · Sculpting skills, one step at a time. 🚀
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}