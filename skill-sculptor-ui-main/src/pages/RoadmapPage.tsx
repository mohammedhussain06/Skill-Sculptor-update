import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Circle, Clock, ArrowRight, BookOpen, ExternalLink, Video, Globe, GraduationCap, LayoutDashboard, Trash2 } from 'lucide-react';
import API from '../../api/axios';
import { useToast } from '@/hooks/use-toast';
import { DeleteRoadmapDialog } from '@/components/DeleteRoadmapDialog';
import { RoadmapMindMap } from '@/components/RoadmapMindMap';
import { cn } from '@/lib/utils';


export default function RoadmapPage() {
  const [roadmapSteps, setRoadmapSteps] = useState<any[]>([]);
  const [progress, setProgress] = useState({ percentage: 0, completed: 0, total: 0 });
  const [roadmapTitle, setRoadmapTitle] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'mindmap'>('list');
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
          
          {/* View Toggles */}
          <div className="flex justify-center gap-2.5 mt-8">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className={cn(
                "text-xs sm:text-sm font-bold h-10 px-4 rounded-xl border border-white/5",
                viewMode === 'list' && "bg-gradient-primary border-0 text-white"
              )}
            >
              List View
            </Button>
            <Button
              variant={viewMode === 'mindmap' ? 'default' : 'outline'}
              onClick={() => setViewMode('mindmap')}
              className={cn(
                "text-xs sm:text-sm font-bold h-10 px-4 rounded-xl border border-white/5",
                viewMode === 'mindmap' && "bg-gradient-primary border-0 text-white"
              )}
            >
              Mind Map View
            </Button>
          </div>
        </div>

        {viewMode === 'mindmap' ? (
          <div className="max-w-4xl mx-auto px-4 sm:px-0">
            <RoadmapMindMap steps={roadmapSteps} roadmapId={roadmapId || ''} />
          </div>
        ) : (
          <div className="relative max-w-4xl mx-auto px-4 sm:px-0 progress-stagger-item animate-fadeInUp">
            <div className="hidden sm:block absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-border"></div>
            <div className="space-y-6 sm:space-y-8">
              {roadmapSteps.map((step, index) => (
                <div key={index} className="relative flex items-start">
                  <div className="absolute left-2 sm:left-5 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-background border-2 border-current z-10">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="ml-10 sm:ml-16 w-full">
                    <Card className={cn("card-hover border-0 shadow-card", getStepCardStyle(step.status))}>
                      <CardHeader className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Step {step.step}</span>
                              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getDifficultyColor(step.difficulty))}>
                                {step.difficulty}
                              </span>
                            </div>
                            <CardTitle className="text-base sm:text-lg md:text-xl break-words">{step.title}</CardTitle>
                            <CardDescription className="text-sm sm:text-base mt-2 break-words text-muted-foreground">{step.description}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-1 text-muted-foreground shrink-0">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm whitespace-nowrap">{step.duration}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        {step.resources && step.resources.length > 0 && (
                          <div className="mb-4 sm:mb-6">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4 text-secondary" />
                              Study Resources
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {step.resources.map((resource: any, rIdx: number) => (
                                <a
                                  key={rIdx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all font-semibold text-xs sm:text-sm text-foreground/85 hover:text-foreground"
                                >
                                  <span className="truncate pr-2">{resource.title}</span>
                                  <span className="text-[10px] text-muted-foreground shrink-0 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                                    {resource.type}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                          <span className="text-xs text-muted-foreground font-semibold flex items-center">
                            <BookOpen className="w-4 h-4 mr-1 text-primary" />
                            {step.resources?.length || 0} Topics
                          </span>
                          <Button 
                            className="bg-gradient-primary border-0 text-white font-bold h-10 px-5 text-xs sm:text-sm hover:scale-102 transition-transform" 
                            disabled={step.status === 'locked'}
                            onClick={() => navigate(`/learn/${roadmapId || ''}/${index}`)}
                          >
                            <span className="hidden sm:inline">Continue Learning</span>
                            <span className="sm:hidden">Continue</span>
                            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
