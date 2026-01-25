import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Target, CheckCircle, ArrowRight } from 'lucide-react';
import API from '../../api/axios';

export default function QueryFormPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ skill: '', currentLevel: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const skillOptions = [
    "Web Development", "Mobile App Development", "Data Science", "Machine Learning",
    "UI/UX Design", "Digital Marketing", "Product Management", "Cloud Computing",
    "Cybersecurity", "Blockchain", "DevOps", "Game Development"
  ];

  const levelOptions = [
    { value: "beginner", label: "Beginner - No prior experience" },
    { value: "intermediate", label: "Intermediate - Some experience" },
    { value: "advanced", label: "Advanced - Significant experience" }
  ];

  // Check if user already has a roadmap (skip when creating a new one explicitly)
  useEffect(() => {
    const checkUserQuery = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const forceNew = params.get('new') === '1';
        if (forceNew) return; // stay on form to create another roadmap
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (!user._id && !user.id) return;

        const userId = user._id ?? user.id;
        // API will attach token automatically
        const res = await API.get(`/dashboard/${userId}`);

        if (res.data?.hasRoadmap) {
          navigate('/dashboard');
        }
      } catch (err) {
        // no dashboard or token => remain on query form
        console.log('No dashboard yet, stay on query form');
      }
    };
    checkUserQuery();
  }, [navigate, location.search]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => { if (currentStep < 2) setCurrentStep(currentStep + 1); };
  const handlePrevious = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  // Submit — create roadmap (correct route) then create dashboard
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

      // Create roadmap — backend expects POST /api/roadmap
      const roadmapRes = await API.post('/roadmap', {
        userId,
        skill: formData.skill,
        level: formData.currentLevel
      });

      if (!roadmapRes.data || !roadmapRes.data.roadmap) {
        throw new Error('Failed to create roadmap');
      }

      // Create or ensure dashboard exists AFTER roadmap creation and append the new roadmapId
      await API.post('/dashboard', { userId, roadmapId: roadmapRes.data.roadmap?._id });

      toast({ title: "Roadmap Generated! 🎯" });
      const roadmapId = roadmapRes.data.roadmap?._id;
      navigate(roadmapId ? `/roadmap/${roadmapId}` : '/roadmap');
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

  const isStepComplete = (stepNumber: number) => {
    if (stepNumber === 1) return !!formData.skill;
    if (stepNumber === 2) return !!formData.currentLevel;
    return false;
  };

  const steps = [
    { number: 1, title: "Goal", description: "What skill do you want to learn?", icon: Target },
    { number: 2, title: "Submit", description: "What's your current experience?", icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Let's Create Your Learning Roadmap</h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">Tell us about your goals and we'll generate a personalized learning path</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 sm:mb-12 flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                  currentStep >= step.number ? 'bg-primary border-primary text-primary-foreground' :
                  isStepComplete(step.number) ? 'bg-success border-success text-success-foreground' :
                  'border-muted-darker text-muted-foreground'
                }`}>
                  {isStepComplete(step.number) && currentStep > step.number ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs sm:text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && <div className={`h-0.5 flex-1 mx-2 sm:mx-4 ${currentStep > step.number ? 'bg-primary' : 'bg-muted-darker'}`}></div>}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl text-center">Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base md:text-lg mt-2">{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {currentStep === 1 && (
              <div className="space-y-3 sm:space-y-4">
                <Label className="text-sm sm:text-base">What skill would you like to learn?</Label>
                <Select value={formData.skill} onValueChange={(val) => handleInputChange('skill', val)}>
                  <SelectTrigger className="w-full focus-ring text-sm sm:text-base py-4 sm:py-6">
                    <SelectValue placeholder="Select a skill to learn" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillOptions.map(skill => <SelectItem key={skill} value={skill.toLowerCase().replace(/\s+/g,'-')}>{skill}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3 sm:space-y-4">
                <Label className="text-sm sm:text-base">What's your current experience level?</Label>
                <Select value={formData.currentLevel} onValueChange={(val) => handleInputChange('currentLevel', val)}>
                  <SelectTrigger className="w-full focus-ring text-sm sm:text-base py-4 sm:py-6">
                    <SelectValue placeholder="Select your current level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 sm:pt-6">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1} className="text-sm sm:text-base w-full sm:w-auto">Previous</Button>
              {currentStep < 2 ?
                <Button onClick={handleNext} disabled={!isStepComplete(currentStep)} className="bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base w-full sm:w-auto">
                  Next <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4"/>
                </Button> :
                <Button onClick={handleSubmit} disabled={isLoading || !formData.skill || !formData.currentLevel} className="bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base w-full sm:w-auto">
                  {isLoading ? "Generating Roadmap..." : "Generate Roadmap"} <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4"/>
                </Button>
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
