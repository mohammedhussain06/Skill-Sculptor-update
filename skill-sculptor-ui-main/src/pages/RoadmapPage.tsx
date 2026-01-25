import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Circle, Clock, ArrowRight, BookOpen, ExternalLink, Video, Globe, GraduationCap, LayoutDashboard, Trash2 } from 'lucide-react';
import API from '../../api/axios';
import { useToast } from '@/hooks/use-toast';
import { DeleteRoadmapDialog } from '@/components/DeleteRoadmapDialog';

export default function RoadmapPage() {
  const [roadmapSteps, setRoadmapSteps] = useState<any[]>([]);
  const [progress, setProgress] = useState({ percentage: 0, completed: 0, total: 0 });
  const [roadmapTitle, setRoadmapTitle] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { id: roadmapId } = useParams();
  const { toast } = useToast();

  // Calculate progress based on localStorage data
  const calculateProgress = (steps: any[], roadmapId: string) => {
    let totalResources = 0;
    let completedResources = 0;

    steps.forEach((step, stepIndex) => {
      if (step.resources && step.resources.length > 0) {
        totalResources += step.resources.length;
        
        // Load completed resources for this step from localStorage
        const key = `completed_resources_${roadmapId}_${stepIndex}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const completedSet = new Set(JSON.parse(saved));
          completedResources += completedSet.size;
        }
      }
    });

    return {
      percentage: totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0,
      completed: completedResources,
      total: totalResources
    };
  };

  const goBack = () => {
    navigate(-1);
  };

  const handleDeleteRoadmap = async () => {
    if (!roadmapId) return;
    
    setIsDeleting(true);
    try {
      await API.delete(`/roadmap/${roadmapId}`);
      
      // Clear localStorage data for this roadmap
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`completed_resources_${roadmapId}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Roadmap Deleted! 🗑️",
        description: `"${roadmapTitle}" has been permanently deleted.`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete roadmap",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const userId = user._id || user.id;

        const res = roadmapId
          ? await API.get(`/roadmap/${roadmapId}`)
          : userId ? await API.get(`/roadmap/user/${userId}`) : null;
        if (!res || !res.data || !res.data.steps) throw new Error('Roadmap missing');

        setRoadmapSteps(res.data.steps || []);
        setRoadmapTitle(res.data.skill || 'Learning Roadmap');
        // Calculate progress based on localStorage data instead of backend status
        const calculatedProgress = calculateProgress(res.data.steps || [], roadmapId || '');
        setProgress(calculatedProgress);
      } catch (err: any) {
        toast({
          title: 'No Roadmap Found',
          description: 'Redirecting to create your personalized roadmap...',
          variant: 'destructive',
        });
        navigate('/query-form', { replace: true });
      }
    };
    fetchRoadmap();
  }, [roadmapId]);

  // Refresh progress when returning to the page
  useEffect(() => {
    if (roadmapSteps.length > 0 && roadmapId) {
      const calculatedProgress = calculateProgress(roadmapSteps, roadmapId);
      setProgress(calculatedProgress);
    }
  }, [roadmapSteps, roadmapId]);

  const getStepIcon = (status: string) => status === 'completed' ? <CheckCircle className="w-6 h-6 text-success" /> : <Circle className="w-6 h-6 text-muted-foreground" />;
  const getStepCardStyle = (status: string) => status === 'completed' ? 'bg-success/5 border-success/20' : 'bg-muted/20 border-muted-darker';
  const getDifficultyColor = (difficulty: string) => difficulty === 'Beginner' ? 'text-success bg-success/10' : 'text-muted-foreground bg-muted';

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 mb-4 sm:mb-6">
            <Button variant="outline" onClick={goBack} className="flex items-center space-x-2 w-full sm:w-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Go Back</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')} 
                className="flex items-center justify-center space-x-2 bg-gradient-primary/10 hover:bg-gradient-primary/20 border-primary/30 text-xs sm:text-sm"
              >
                <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Go to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
              
              <DeleteRoadmapDialog
                roadmapTitle={roadmapTitle}
                onConfirm={handleDeleteRoadmap}
                isLoading={isDeleting}
              >
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center space-x-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5 text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Delete Roadmap</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              </DeleteRoadmapDialog>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12 px-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Your Learning Roadmap</h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-4 sm:mb-6">Follow this personalized learning path</p>
          <div className="max-w-md mx-auto mb-4 sm:mb-6">
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span className="break-words">{progress.completed}/{progress.total} ({progress.percentage}%)</span>
            </div>
            <Progress value={progress.percentage} className="h-2 sm:h-3" />
          </div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-0">
          <div className="hidden sm:block absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-border"></div>
          <div className="space-y-6 sm:space-y-8">
            {roadmapSteps.map((step, index) => (
              <div key={index} className="relative flex items-start">
                <div className="absolute left-2 sm:left-5 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-background border-2 border-current z-10">
                  {getStepIcon(step.status)}
                </div>
                <div className="ml-10 sm:ml-16 w-full">
                  <Card className={`card-hover border-0 shadow-card ${getStepCardStyle(step.status)}`}>
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Step {step.step}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(step.difficulty)}`}>
                              {step.difficulty}
                            </span>
                          </div>
                          <CardTitle className="text-base sm:text-lg md:text-xl break-words">{step.title}</CardTitle>
                          <CardDescription className="text-sm sm:text-base mt-2 break-words">{step.description}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground shrink-0">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm whitespace-nowrap">{step.duration}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center">
                            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Key Topics
                          </h4>
                          <div className="space-y-2">
                            {step.resources?.map((res: any, i: number) => {
                              if (res?.url) {
                                const getResourceIcon = (url: string) => {
                                  if (url.includes('youtube') || url.includes('video')) return Video;
                                  if (url.includes('coursera') || url.includes('udemy') || url.includes('edx')) return GraduationCap;
                                  if (url.includes('mdn') || url.includes('w3schools') || url.includes('freecodecamp')) return Globe;
                                  return BookOpen;
                                };
                                
                                const ResourceIcon = getResourceIcon(res.url);
                                const displayTitle = res.title || 'Resource';
                                
                                // Check if this resource is completed in localStorage
                                const key = `completed_resources_${roadmapId}_${index}`;
                                const saved = localStorage.getItem(key);
                                const completedSet = saved ? new Set(JSON.parse(saved)) : new Set<number>();
                                const isCompleted = completedSet.has(i);
                                
                                return (
                                  <a 
                                    key={i} 
                                    href={res.url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="group block"
                                  >
                                    <div className={`resource-link-card interactive-glow flex items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                                      isCompleted 
                                        ? 'bg-success/10 border-success/30 hover:bg-success/20' 
                                        : 'bg-card/30 hover:bg-card/60 hover:border-primary/30 border-border/50'
                                    } hover:shadow-sm`}>
                                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-200 ${
                                        isCompleted ? 'bg-success' : 'bg-gradient-primary'
                                      }`}>
                                        <ResourceIcon className="w-4 h-4 text-white" />
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
                                          {new URL(res.url).hostname}
                                        </p>
                                      </div>
                                      <ExternalLink className={`w-3 h-3 transition-colors duration-200 flex-shrink-0 ${
                                        isCompleted ? 'text-success' : 'text-muted-foreground group-hover:text-primary'
                                      }`} />
                                    </div>
                                  </a>
                                );
                              } else {
                                return (
                                  <div key={i} className="flex items-center p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center mr-3">
                                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {typeof res === 'string' ? res : (res?.title || 'Resource')}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </div>
                        <div className="pt-2 space-y-2">
                          {step.status === 'completed' && (
                            <div className="flex items-center text-success text-xs sm:text-sm">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Completed
                            </div>
                          )}
                          <Button 
                            className="bg-gradient-primary hover:opacity-90 border-0 w-full sm:w-auto text-sm sm:text-base" 
                            onClick={() => navigate(`/learn/${roadmapId || ''}/${index}`)}
                          >
                            <span className="hidden sm:inline">Continue Learning</span>
                            <span className="sm:hidden">Continue</span>
                            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
