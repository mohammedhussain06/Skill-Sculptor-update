import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Video, Globe, GraduationCap, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import API from '../../api/axios';

export default function LearnStepPage() {
  const { roadmapId, stepIndex } = useParams();
  const [step, setStep] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedResources, setCompletedResources] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load completed resources from localStorage
  const loadCompletedResources = (roadmapId: string, stepIndex: string) => {
    const key = `completed_resources_${roadmapId}_${stepIndex}`;
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved)) : new Set<number>();
  };

  // Save completed resources to localStorage
  const saveCompletedResources = (roadmapId: string, stepIndex: string, resources: Set<number>) => {
    const key = `completed_resources_${roadmapId}_${stepIndex}`;
    localStorage.setItem(key, JSON.stringify([...resources]));
  };

  useEffect(() => {
    const run = async () => {
      try {
      const { data } = await API.get(`/roadmap/${roadmapId}`);
      const idx = Number(stepIndex || 0);
      setStep(data?.steps?.[idx] || null);
      
      // Load saved completed resources
      if (roadmapId && stepIndex !== undefined) {
        const savedResources = loadCompletedResources(roadmapId, stepIndex);
        setCompletedResources(savedResources);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load roadmap step",
          variant: "destructive",
        });
        navigate(`/roadmap/${roadmapId}`);
      }
    };
    run();
  }, [roadmapId, stepIndex, navigate, toast]);

  const handleCompleteStep = async () => {
    if (!roadmapId || stepIndex === undefined) return;
    
    setIsCompleting(true);
    try {
      await API.put(`/roadmap/${roadmapId}/step/${stepIndex}/complete`);
      toast({
        title: "Step Completed! 🎉",
        description: `Great job completing "${step?.title}"!`,
      });
      navigate(`/roadmap/${roadmapId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to complete step",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const toggleResourceCompletion = (resourceIndex: number) => {
    setCompletedResources(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(resourceIndex)) {
        // If unchecking, just remove this resource
        newSet.delete(resourceIndex);
      } else {
        // If checking, add this resource AND all resources above it
        for (let i = 0; i <= resourceIndex; i++) {
          newSet.add(i);
        }
      }
      
      // Save to localStorage
      if (roadmapId && stepIndex !== undefined) {
        saveCompletedResources(roadmapId, stepIndex, newSet);
      }
      
      return newSet;
    });
  };

  const getResourceProgress = () => {
    if (!step?.resources?.length) return 0;
    return Math.round((completedResources.size / step.resources.length) * 100);
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <Card className="border-0 shadow-card bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{step?.title || 'Learning'}</CardTitle>
            <CardDescription>Curated resources and quick tips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Resources</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Tip: Marking a resource complete will auto-complete all resources above it
                  </p>
                </div>
                {step?.resources?.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {completedResources.size === step.resources.length && step.resources.length > 0 ? (
                      <div className="flex items-center space-x-2 text-success">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">All resources completed! 🎉</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground">
                          {completedResources.size}/{step.resources.length} completed
                        </span>
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full resource-progress-bar"
                            style={{ width: `${getResourceProgress()}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {getResourceProgress()}%
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="grid gap-3">
                {step?.resources?.map((r: any, i: number) => {
                  const getResourceIcon = (url: string) => {
                    if (url.includes('youtube') || url.includes('video')) return Video;
                    if (url.includes('coursera') || url.includes('udemy') || url.includes('edx')) return GraduationCap;
                    if (url.includes('mdn') || url.includes('w3schools') || url.includes('freecodecamp')) return Globe;
                    return BookOpen;
                  };
                  
                  const ResourceIcon = getResourceIcon(r.url);
                  const displayTitle = r.title || r.url;
                  const isCompleted = completedResources.has(i);
                  
                  return (
                    <div key={i} className="relative">
                      <a 
                        href={r.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="group block"
                      >
                        <div className={`resource-link-card interactive-glow flex items-center p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                          isCompleted 
                            ? 'bg-success/10 border-success/30 hover:bg-success/20' 
                            : 'bg-card/50 hover:bg-card/80 hover:border-primary/30 border-border'
                        } hover:shadow-md`}>
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-200 ${
                            isCompleted ? 'bg-success' : 'bg-gradient-primary'
                          }`}>
                            <ResourceIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium transition-colors duration-200 truncate ${
                              isCompleted 
                                ? 'text-success line-through' 
                                : 'text-foreground group-hover:text-primary'
                            }`}>
                              {displayTitle}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {new URL(r.url).hostname}
                            </p>
                          </div>
                          <ExternalLink className={`w-4 h-4 transition-colors duration-200 flex-shrink-0 ${
                            isCompleted ? 'text-success' : 'text-muted-foreground group-hover:text-primary'
                          }`} />
                        </div>
                      </a>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleResourceCompletion(i);
                        }}
                        className={`resource-checkbox absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isCompleted
                            ? 'bg-success border-success text-white'
                            : 'bg-background border-border hover:border-primary'
                        }`}
                        title={
                          isCompleted 
                            ? 'Mark as incomplete' 
                            : `Mark as completed (will auto-complete resources 1-${i + 1})`
                        }
                      >
                        {isCompleted && <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                }) || (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No resources available for this step.</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Tips</h3>
              <div className="space-y-3">
                <div className="interactive-glow flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </div>
                  <p className="text-sm text-foreground">Skim once, then follow one resource deeply.</p>
                </div>
                <div className="interactive-glow flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </div>
                  <p className="text-sm text-foreground">Take short notes and save key links.</p>
                </div>
                <div className="interactive-glow flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-semibold text-primary">3</span>
                  </div>
                  <p className="text-sm text-foreground">Build a tiny project to practice immediately.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
              <Button variant="outline" onClick={goBack} className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Go Back</span>
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => navigate(`/roadmap/${roadmapId}`)} className="w-full sm:w-auto">
                  Return to Roadmap
                </Button>
                <Button 
                  onClick={handleCompleteStep}
                  disabled={isCompleting}
                  className="bg-gradient-primary hover:opacity-90 border-0 w-full sm:w-auto"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isCompleting ? "Completing..." : "Mark Step as Complete"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


