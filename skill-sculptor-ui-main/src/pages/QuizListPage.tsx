import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const QuizListPage = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Manual Creation Modal states
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [quizTitle, setQuizTitle] = useState("");
    const [quizDescription, setQuizDescription] = useState("");
    const [quizQuestions, setQuizQuestions] = useState<any[]>([
        { question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }
    ]);

    // AI Generation Modal states
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [aiCount, setAiCount] = useState(5);
    const [aiDifficulty, setAiDifficulty] = useState("Intermediate");
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const handleGenerateAiQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiTopic.trim()) {
            toast.error("Please enter a topic");
            return;
        }

        setIsAiGenerating(true);
        try {
            // Generate using backend endpoint — returns { questions: [...] }
            const genRes = await API.post("/quiz/generate", {
                text: aiTopic,
                count: aiCount,
                difficulty: aiDifficulty.toLowerCase()
            });

            // Backend returns { questions } directly
            const generatedQuestions = genRes.data.questions || [];
            if (generatedQuestions.length === 0) {
                toast.error("AI couldn't generate questions for this topic. Try another prompt.");
                setIsAiGenerating(false);
                return;
            }

            // Save to database
            const saveRes = await API.post("/quiz", {
                title: `AI: ${aiTopic}`,
                description: `AI-generated ${aiDifficulty} quiz on "${aiTopic}".`,
                questions: generatedQuestions,
                tags: ["AI"]
            });

            const savedQuiz = saveRes.data.quiz;
            setQuizzes(prev => [savedQuiz, ...prev]);
            setIsAiModalOpen(false);
            setAiTopic("");
            
            toast.success(`✅ AI Quiz created with ${generatedQuestions.length} questions!`);
        } catch (error: any) {
            console.error("AI Quiz generation error:", error);
            const msg = error?.response?.data?.error || error?.message || "Unknown error";
            toast.error(`Failed to generate AI quiz: ${msg}`);
        } finally {
            setIsAiGenerating(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const response = await API.get("/quiz");
            setQuizzes(response.data.quizzes);
        } catch (error) {
            toast.error("Failed to fetch quizzes");
        } finally {
            setLoading(false);
        }
    };

    const addQuestionField = () => {
        setQuizQuestions(prev => [
            ...prev,
            { question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }
        ]);
    };

    const removeQuestionField = (idx: number) => {
        if (quizQuestions.length === 1) return;
        setQuizQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const updateQuestionText = (idx: number, val: string) => {
        setQuizQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question: val } : q));
    };

    const updateOptionText = (qIdx: number, oIdx: number, val: string) => {
        setQuizQuestions(prev => prev.map((q, i) => {
            if (i !== qIdx) return q;
            const updatedOpts = [...q.options];
            updatedOpts[oIdx] = val;
            return { ...q, options: updatedOpts };
        }));
    };

    const updateCorrectIndex = (qIdx: number, val: number) => {
        setQuizQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, correctAnswerIndex: val } : q));
    };

    const updateExplanation = (qIdx: number, val: string) => {
        setQuizQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, explanation: val } : q));
    };

    const handleCreateManualQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quizTitle.trim()) {
            toast.error("Quiz title is required");
            return;
        }

        // Validation
        for (let i = 0; i < quizQuestions.length; i++) {
            const q = quizQuestions[i];
            if (!q.question.trim()) {
                toast.error(`Question ${i + 1} has no text`);
                return;
            }
            if (q.options.some((o: string) => !o.trim())) {
                toast.error(`Question ${i + 1} requires all 4 options to be filled`);
                return;
            }
        }

        try {
            const response = await API.post("/quiz", {
                title: quizTitle,
                description: quizDescription,
                questions: quizQuestions,
                tags: ["Manual"]
            });
            
            const newQuiz = response.data.quiz;
            setQuizzes(prev => [newQuiz, ...prev]);
            setIsManualModalOpen(false);
            
            // Reset
            setQuizTitle("");
            setQuizDescription("");
            setQuizQuestions([{ question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]);
            
            toast.success("Quiz created successfully!");
        } catch (err) {
            toast.error("Failed to create quiz");
        }
    };

    const deleteQuiz = async (id: string) => {
        try {
            await API.delete(`/quiz/${id}`);
            toast.success("Quiz deleted");
            setQuizzes(quizzes.filter(q => q._id !== id));
        } catch (error) {
            toast.error("Failed to delete quiz");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex items-center justify-center h-screen">
                    <p>Loading quizzes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-12">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="achievement-badge p-2 sm:p-3">
                                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text">My Quizzes</h1>
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground">
                                Challenge yourself and track your progress 🎯
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                            <Button 
                                onClick={() => setIsAiModalOpen(true)} 
                                className="flex-1 sm:flex-initial bg-gradient-primary hover:opacity-90 border-0 text-xs sm:text-sm h-10 px-4"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Generate AI
                            </Button>
                            <Button 
                                onClick={() => navigate("/upload")} 
                                variant="outline"
                                className="flex-1 sm:flex-initial border-border bg-card text-foreground text-xs sm:text-sm h-10 px-4 font-bold"
                            >
                                Upload Document
                            </Button>
                            <Button 
                                onClick={() => setIsManualModalOpen(true)} 
                                variant="outline"
                                className="flex-1 sm:flex-initial border-border bg-card text-foreground text-xs sm:text-sm h-10 px-4 font-bold"
                            >
                                Create Manually
                            </Button>
                        </div>
                    </div>

                    {quizzes.length === 0 ? (
                        <Card className="fun-card border-0 shadow-card bg-card/80 backdrop-blur-sm">
                            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4">
                                <div className="achievement-badge p-4 sm:p-6 mb-4 sm:mb-6">
                                    <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                                </div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-center">No Quizzes Yet</h2>
                                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 text-center max-w-md">
                                    Upload a document to generate your first quiz via AI, or build a custom quiz manually! 🚀
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <Button 
                                        onClick={() => setIsAiModalOpen(true)}
                                        className="bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Generate with AI
                                    </Button>
                                    <Button 
                                        onClick={() => navigate("/upload")}
                                        variant="outline"
                                        className="border-border bg-card text-foreground text-sm sm:text-base font-bold"
                                    >
                                        Upload Document
                                    </Button>
                                    <Button 
                                        onClick={() => setIsManualModalOpen(true)}
                                        variant="outline"
                                        className="border-border bg-card text-foreground text-sm sm:text-base font-bold"
                                    >
                                        Create Manually
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {quizzes.map((quiz, index) => (
                                <Card 
                                    key={quiz._id} 
                                    className="fun-card border-0 shadow-card bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <CardHeader className="p-4 sm:p-6">
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="line-clamp-2 text-base sm:text-lg md:text-xl flex-1 min-w-0">{quiz.title}</CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteQuiz(quiz._id)}
                                                className="shrink-0 h-8 w-8 p-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        {quiz.description && (
                                            <CardDescription className="line-clamp-2 text-xs sm:text-sm mt-2">
                                                {quiz.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                                        <div className="flex justify-between items-center text-xs sm:text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <span>📝</span> Questions:
                                            </span>
                                            <Badge variant="outline" className="text-xs">{quiz.questions.length}</Badge>
                                        </div>
                                        {quiz.totalAttempts > 0 && (
                                            <>
                                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <span>🔄</span> Attempts:
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">{quiz.totalAttempts}</Badge>
                                                </div>
                                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <span>⭐</span> Avg Score:
                                                    </span>
                                                    <Badge className="text-xs bg-gradient-primary text-white">
                                                        {quiz.averageScore.toFixed(1)}%
                                                    </Badge>
                                                </div>
                                            </>
                                        )}
                                        <Button 
                                            className="w-full bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base mt-2" 
                                            onClick={() => navigate(`/quiz/${quiz._id}/take`)}
                                        >
                                            <Trophy className="w-4 h-4 mr-2" />
                                            Take Quiz
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Manual Quiz Builder Modal */}
            {isManualModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] p-6 shadow-2xl relative flex flex-col animate-fadeInUp">
                        <button 
                            onClick={() => setIsManualModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            <Trophy className="w-5 h-5 text-primary" />
                            Create Quiz Manually
                        </h3>
                        <form onSubmit={handleCreateManualQuiz} className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Quiz Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. JavaScript Arrays"
                                        value={quizTitle}
                                        onChange={(e) => setQuizTitle(e.target.value)}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Practice filters, maps, and scopes"
                                        value={quizDescription}
                                        onChange={(e) => setQuizDescription(e.target.value)}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-4">
                                <h4 className="text-xs font-black text-foreground uppercase tracking-wider mb-3">Questions list</h4>
                                <div className="space-y-6">
                                    {quizQuestions.map((q, qIdx) => (
                                        <div key={qIdx} className="p-4 rounded-xl bg-white/3 border border-white/5 space-y-3 relative">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-primary tracking-wider">Question {qIdx + 1}</span>
                                                {quizQuestions.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeQuestionField(qIdx)}
                                                        className="text-[10px] text-destructive hover:bg-destructive/10 h-7 px-2 rounded-lg font-bold"
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Question Text"
                                                    value={q.question}
                                                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                                                    className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                {q.options.map((opt: string, oIdx: number) => (
                                                    <input
                                                        key={oIdx}
                                                        type="text"
                                                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                        value={opt}
                                                        onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                                        required
                                                    />
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Correct Choice</label>
                                                    <select
                                                        value={q.correctAnswerIndex}
                                                        onChange={(e) => updateCorrectIndex(qIdx, parseInt(e.target.value))}
                                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                                                    >
                                                        <option value={0}>Option A</option>
                                                        <option value={1}>Option B</option>
                                                        <option value={2}>Option C</option>
                                                        <option value={3}>Option D</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Explanation (Optional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Why is this option correct?"
                                                        value={q.explanation}
                                                        onChange={(e) => updateExplanation(qIdx, e.target.value)}
                                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    onClick={addQuestionField}
                                    variant="outline"
                                    className="w-full border-dashed border-white/10 hover:border-primary/20 hover:bg-primary/5 text-xs font-bold h-10 mt-3"
                                >
                                    + Add Question Field
                                </Button>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-primary hover:opacity-90 border-0 text-white font-bold h-11 shadow-glow mt-4 shrink-0"
                            >
                                Save Quiz
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Quiz Generator Modal */}
            {isAiModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fadeInUp">
                        <button 
                            onClick={() => setIsAiModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            disabled={isAiGenerating}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            <Trophy className="w-5 h-5 text-primary animate-pulse" />
                            Generate AI Quiz
                        </h3>
                        <form onSubmit={handleGenerateAiQuiz} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Quiz Topic</label>
                                <input
                                    type="text"
                                    placeholder="e.g. React lifecycle, Python arrays, Git commands"
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                    required
                                    disabled={isAiGenerating}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Question Count</label>
                                    <select
                                        value={aiCount}
                                        onChange={(e) => setAiCount(parseInt(e.target.value))}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                                        disabled={isAiGenerating}
                                    >
                                        <option value={3}>3 Questions</option>
                                        <option value={5}>5 Questions</option>
                                        <option value={8}>8 Questions</option>
                                        <option value={10}>10 Questions</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Difficulty</label>
                                    <select
                                        value={aiDifficulty}
                                        onChange={(e) => setAiDifficulty(e.target.value)}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                                        disabled={isAiGenerating}
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-primary hover:opacity-90 border-0 text-white font-bold h-11 shadow-glow flex items-center justify-center gap-2"
                                disabled={isAiGenerating}
                            >
                                {isAiGenerating ? (
                                    <>
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                        Generating Quiz...
                                    </>
                                ) : (
                                    "Generate Quiz"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizListPage;
