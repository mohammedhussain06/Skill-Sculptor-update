import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Target, CheckCircle, ArrowRight, Sparkles, X } from 'lucide-react';
import API from '../../api/axios';

// Popular skill suggestions grouped by category
const SKILL_SUGGESTIONS = [
  // Tech
  "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Vue.js", "Angular",
  "Flutter", "Swift", "Kotlin", "Go", "Rust", "Java", "C++", "C#",
  // Data & AI
  "Data Science", "Machine Learning", "Deep Learning", "AI / LLMs", "Data Engineering",
  "SQL", "Power BI", "Tableau",
  // Cloud & DevOps
  "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "DevOps", "Linux",
  // Design & Product
  "UI/UX Design", "Figma", "Product Management", "Digital Marketing",
  // Other
  "Cybersecurity", "Blockchain", "Game Development", "Web3", "Networking",
];

const levelOptions = [
  { value: "beginner", label: "🟢 Beginner — No prior experience" },
  { value: "intermediate", label: "🟡 Intermediate — Some experience" },
  { value: "advanced", label: "🔴 Advanced — Significant experience" },
];

export default function QueryFormPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ skill: '', currentLevel: '' });
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Sync custom input ↔ formData.skill
  const handleSkillInput = (val: string) => {
    setCustomSkillInput(val);
    setFormData(f => ({ ...f, skill: val.trim() }));
  };

  const handleChipClick = (skill: string) => {
    setCustomSkillInput(skill);
    setFormData(f => ({ ...f, skill }));
  };

  const clearSkill = () => {
    setCustomSkillInput('');
    setFormData(f => ({ ...f, skill: '' }));
  };

  useEffect(() => {
    const checkUserQuery = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const forceNew = params.get('new') === '1';
        if (forceNew) return;
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (!user._id && !user.id) return;
        const userId = user._id ?? user.id;
        const res = await API.get(`/dashboard/${userId}`);
        if (res.data?.hasRoadmap) navigate('/dashboard');
      } catch {
        console.log('No dashboard yet, stay on query form');
      }
    };
    checkUserQuery();
  }, [navigate, location.search]);

  const handleNext = () => { if (currentStep < 2) setCurrentStep(currentStep + 1); };
  const handlePrevious = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmit = async () => {
    if (!formData.skill || !formData.currentLevel) {
      toast({ title: "Please complete all fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const userId = user._id ?? user.id;
      if (!userId) throw new Error("User not logged in");

      const roadmapRes = await API.post('/roadmap', {
        userId,
        skill: formData.skill,
        level: formData.currentLevel
      });

      if (!roadmapRes.data?.roadmap) throw new Error('Failed to create roadmap');

      await API.post('/dashboard', { userId, roadmapId: roadmapRes.data.roadmap?._id });

      toast({ title: `Roadmap for "${formData.skill}" Generated! 🎯` });
      const roadmapId = roadmapRes.data.roadmap?._id;
      navigate(roadmapId ? `/roadmap/${roadmapId}` : '/roadmaps');
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message || 'Something went wrong',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isStepComplete = (step: number) => {
    if (step === 1) return !!formData.skill.trim();
    if (step === 2) return !!formData.currentLevel;
    return false;
  };

  const steps = [
    { number: 1, title: "Skill", description: "What do you want to learn?", icon: Target },
    { number: 2, title: "Level", description: "What's your experience?", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="py-6 sm:py-10 md:py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Personalized Roadmap
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 gradient-text">
            What Do You Want to Learn?
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base px-2">
            Type any skill — from cooking to quantum computing — and get a custom AI roadmap instantly.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 sm:mb-10 flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                  currentStep >= step.number
                    ? 'bg-primary border-primary text-primary-foreground shadow-glow'
                    : isStepComplete(step.number)
                    ? 'bg-success border-success text-success-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {isStepComplete(step.number) && currentStep > step.number
                    ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    : <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-3 sm:mx-5 transition-all duration-500 ${currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="shadow-card border border-white/5 bg-card/80 backdrop-blur-sm">
          <CardHeader className="p-5 sm:p-7">
            <CardTitle className="text-xl sm:text-2xl text-center">
              Step {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-center text-sm sm:text-base mt-1">
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-7 pt-0 space-y-5">

            {/* ── STEP 1: Free-text skill input + chip suggestions ── */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Label className="text-sm sm:text-base font-semibold">
                  Type any skill, topic, or subject
                </Label>

                {/* Free-text input */}
                <div className="relative">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={e => handleSkillInput(e.target.value)}
                    placeholder="e.g. Machine Learning, Guitar, Calculus, Spanish..."
                    className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3.5 pr-10 text-sm sm:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    autoFocus
                  />
                  {customSkillInput && (
                    <button
                      onClick={clearSkill}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Popular suggestions */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2.5 font-medium uppercase tracking-wider">
                    ✨ Popular Skills — click to pick
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                    {SKILL_SUGGESTIONS.map(skill => (
                      <button
                        key={skill}
                        onClick={() => handleChipClick(skill)}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-200 ${
                          formData.skill === skill
                            ? 'bg-primary text-white border-primary shadow-glow scale-105'
                            : 'bg-muted/30 text-muted-foreground border-border/40 hover:border-primary/60 hover:text-foreground hover:bg-primary/10'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected skill preview */}
                {formData.skill && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary font-medium animate-fadeInUp">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    AI will generate a custom roadmap for: <strong>{formData.skill}</strong>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Experience level ── */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Label className="text-sm sm:text-base font-semibold">
                  Your current experience in <span className="text-primary">{formData.skill}</span>
                </Label>
                <div className="grid gap-3">
                  {levelOptions.map(l => (
                    <button
                      key={l.value}
                      onClick={() => setFormData(f => ({ ...f, currentLevel: l.value }))}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 text-sm sm:text-base font-medium ${
                        formData.currentLevel === l.value
                          ? 'bg-primary/15 border-primary text-primary shadow-glow'
                          : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                {/* Summary */}
                {formData.currentLevel && (
                  <div className="px-4 py-3 rounded-xl bg-gradient-primary/10 border border-primary/20 text-xs sm:text-sm text-muted-foreground animate-fadeInUp">
                    🚀 Generating a <strong className="text-foreground">{formData.currentLevel}</strong>-level
                    roadmap for <strong className="text-primary">{formData.skill}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="text-sm sm:text-base w-full sm:w-auto order-2 sm:order-1"
              >
                ← Previous
              </Button>

              {currentStep < 2 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepComplete(currentStep)}
                  className="bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base w-full sm:w-auto order-1 sm:order-2"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !isStepComplete(1) || !isStepComplete(2)}
                  className="bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base w-full sm:w-auto order-1 sm:order-2 font-bold"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Roadmap...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generate My Roadmap
                    </span>
                  )}
                </Button>
              )}
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
