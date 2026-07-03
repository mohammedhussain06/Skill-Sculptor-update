import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Brain, ChevronLeft, ChevronRight, RotateCcw, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FlashcardsPage = () => {
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);

    // Manual Creation Modal states
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState("");
    const [newCardFront, setNewCardFront] = useState("");
    const [newCardBack, setNewCardBack] = useState("");
    const [newCardDifficulty, setNewCardDifficulty] = useState("Beginner");

    // AI Generation Modal states
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [aiCount, setAiCount] = useState(8);
    const [aiDifficulty, setAiDifficulty] = useState("Intermediate");
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const handleGenerateAiCards = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiTopic.trim()) {
            toast.error("Please enter a topic");
            return;
        }

        setIsAiGenerating(true);
        try {
            // Step 1: Generate flashcards from topic via backend
            const genRes = await API.post("/flashcard/generate", {
                text: aiTopic,
                count: aiCount,
                difficulty: aiDifficulty.toLowerCase()
            });

            const cards = genRes.data.flashcards || [];
            if (cards.length === 0) {
                toast.error("AI couldn't generate cards for this topic. Try another prompt.");
                setIsAiGenerating(false);
                return;
            }

            // Enrich card titles with the topic name
            const enrichedCards = cards.map((c: any, idx: number) => ({
                ...c,
                title: c.front?.split(" ").slice(0, 4).join(" ") || `${aiTopic} – Card ${idx + 1}`,
                difficulty: aiDifficulty
            }));

            // Step 2: Save generated cards to database
            const saveRes = await API.post("/flashcard", {
                flashcards: enrichedCards
            });

            const saved = saveRes.data.flashcards || [];
            setFlashcards(prev => [...saved, ...prev]);
            setCurrentIndex(0);
            setIsAiModalOpen(false);
            setAiTopic("");
            
            toast.success(`✅ ${saved.length} AI flashcards generated and saved!`);
        } catch (error: any) {
            console.error("AI Generation error:", error);
            const msg = error?.response?.data?.error || error?.message || "Unknown error";
            toast.error(`AI Flashcard Generation failed: ${msg}`);
        } finally {
            setIsAiGenerating(false);
        }
    };

    useEffect(() => {
        fetchFlashcards();
    }, []);

    const fetchFlashcards = async () => {
        try {
            const response = await API.get("/flashcard");
            setFlashcards(response.data.flashcards);
        } catch (error) {
            toast.error("Failed to fetch flashcards");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateManualCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCardTitle.trim() || !newCardFront.trim() || !newCardBack.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            const response = await API.post("/flashcard", {
                flashcards: [{
                    title: newCardTitle,
                    front: newCardFront,
                    back: newCardBack,
                    difficulty: newCardDifficulty
                }]
            });
            
            const newCreated = response.data.flashcards || [];
            setFlashcards(prev => [...newCreated, ...prev]);
            setCurrentIndex(0);
            setIsManualModalOpen(false);
            
            // Clear fields
            setNewCardTitle("");
            setNewCardFront("");
            setNewCardBack("");
            setNewCardDifficulty("Beginner");
            
            toast.success("Flashcard created successfully!");
        } catch (error) {
            toast.error("Failed to create flashcard");
        }
    };

    const handleReview = async (correct: boolean) => {
        if (flashcards.length === 0) return;

        try {
            await API.put(
                `/flashcard/${flashcards[currentIndex]._id}/review`,
                { correct }
            );

            toast.success(correct ? "+3 XP for correct answer!" : "+1 XP for trying!");
            nextCard();
        } catch (error) {
            toast.error("Failed to record review");
        }
    };

    const nextCard = () => {
        setShowAnswer(false);
        setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    };

    const prevCard = () => {
        setShowAnswer(false);
        setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    };

    const deleteFlashcard = async () => {
        if (flashcards.length === 0) return;

        try {
            await API.delete(
                `/flashcard/${flashcards[currentIndex]._id}`
            );

            toast.success("Flashcard deleted");
            setFlashcards(flashcards.filter((_, i) => i !== currentIndex));
            if (currentIndex >= flashcards.length - 1) {
                setCurrentIndex(Math.max(0, currentIndex - 1));
            }
        } catch (error) {
            toast.error("Failed to delete flashcard");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading flashcards...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="max-w-2xl mx-auto text-center space-y-4 sm:space-y-6">
                        <div className="achievement-badge w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
                            <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">No Flashcards Yet</h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Generate cards with AI or create custom cards manually 🚀
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button 
                                onClick={() => setIsAiModalOpen(true)}
                                className="bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base"
                            >
                                Generate with AI
                            </Button>
                            <Button 
                                onClick={() => setIsManualModalOpen(true)}
                                variant="outline"
                                className="text-sm sm:text-base border-border bg-card text-foreground"
                            >
                                Create Manually
                            </Button>
                        </div>
                    </div>
                </div>

                {/* AI Generation Modal - Empty State */}
                {isAiModalOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fadeInUp">
                            <button 
                                onClick={() => setIsAiModalOpen(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-xl font-bold mb-1 text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                <Brain className="w-5 h-5 text-primary" />
                                Generate Flashcards with AI
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">Enter a topic and the AI will create smart flashcards instantly.</p>
                            <form onSubmit={handleGenerateAiCards} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Topic / Subject</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. React Hooks, Photosynthesis, World War 2"
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Number of Cards</label>
                                        <select
                                            value={aiCount}
                                            onChange={(e) => setAiCount(Number(e.target.value))}
                                            className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                                        >
                                            <option value={5}>5 cards</option>
                                            <option value={8}>8 cards</option>
                                            <option value={12}>12 cards</option>
                                            <option value={15}>15 cards</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Difficulty</label>
                                        <select
                                            value={aiDifficulty}
                                            onChange={(e) => setAiDifficulty(e.target.value)}
                                            className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isAiGenerating}
                                    className="w-full bg-gradient-primary hover:opacity-90 border-0 text-white font-bold h-11 shadow-glow"
                                >
                                    {isAiGenerating ? (
                                        <span className="flex items-center gap-2"><span className="animate-spin">⚙️</span> Generating...</span>
                                    ) : (
                                        <span className="flex items-center gap-2">✨ Generate {aiCount} Flashcards</span>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Manual Creation Modal - Empty State */}
                {isManualModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fadeInUp">
                            <button 
                                onClick={() => setIsManualModalOpen(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                <Brain className="w-5 h-5 text-primary" />
                                Create Flashcard Manually
                            </h3>
                            <form onSubmit={handleCreateManualCard} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Card Title / Concept</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Closure, Event Loop"
                                        value={newCardTitle}
                                        onChange={(e) => setNewCardTitle(e.target.value)}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Front (Question / Prompt)</label>
                                    <textarea
                                        placeholder="What does event loop do in JavaScript?"
                                        value={newCardFront}
                                        onChange={(e) => setNewCardFront(e.target.value)}
                                        rows={3}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Back (Answer / Definition)</label>
                                    <textarea
                                        placeholder="It monitors the Call Stack and the Callback Queue to execute asynchronous callbacks..."
                                        value={newCardBack}
                                        onChange={(e) => setNewCardBack(e.target.value)}
                                        rows={3}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Difficulty</label>
                                    <select
                                        value={newCardDifficulty}
                                        onChange={(e) => setNewCardDifficulty(e.target.value)}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                                <Button 
                                    type="submit" 
                                    className="w-full bg-gradient-primary hover:opacity-90 border-0 text-white font-bold h-11 shadow-glow"
                                >
                                    Save Flashcard
                                </Button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const currentCard = flashcards[currentIndex];

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-3">
                            <div className="achievement-badge p-2 sm:p-3">
                                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">Flashcards</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                size="sm"
                                onClick={() => setIsAiModalOpen(true)}
                                className="bg-gradient-primary hover:opacity-90 border-0 text-xs sm:text-sm font-bold"
                            >
                                Generate AI
                            </Button>
                            <Button 
                                size="sm"
                                onClick={() => setIsManualModalOpen(true)}
                                variant="outline"
                                className="border-border bg-card text-foreground text-xs sm:text-sm font-bold"
                            >
                                Add Card
                            </Button>
                            <Badge variant="outline" className="text-xs sm:text-sm bg-gradient-primary text-white border-0 py-1.5 px-2.5">
                                {currentIndex + 1} / {flashcards.length}
                            </Badge>
                        </div>
                    </div>

                    <Card className="fun-card border-0 shadow-card bg-card/80 backdrop-blur-sm mb-4 sm:mb-6 min-h-[300px] sm:min-h-[350px] md:min-h-[400px] flex flex-col justify-center transition-all duration-300">
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                <CardTitle className="text-base sm:text-lg md:text-xl break-words flex-1">{currentCard.title}</CardTitle>
                                <div className="flex gap-2 shrink-0">
                                    <Badge className="text-xs bg-gradient-primary text-white">{currentCard.difficulty}</Badge>
                                    <Button variant="ghost" size="sm" onClick={deleteFlashcard} className="p-2 hover:bg-destructive/10">
                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent
                            className="flex-1 flex flex-col items-center justify-center cursor-pointer p-4 sm:p-6 md:p-8"
                            onClick={() => setShowAnswer(!showAnswer)}
                        >
                            <div className="text-center space-y-3 sm:space-y-4 w-full">
                                <div className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground">
                                    {showAnswer ? "Answer" : "Question"}
                                </div>
                                <div className="text-lg sm:text-xl md:text-2xl font-semibold p-4 sm:p-6 md:p-8 break-words">
                                    {showAnswer ? currentCard.back : currentCard.front}
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground">
                                    Click to {showAnswer ? "hide" : "reveal"} answer
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {showAnswer && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6 animate-fadeInUp">
                            <Button
                                variant="outline"
                                className="flex-1 text-sm sm:text-base hover:bg-destructive/10 hover:border-destructive"
                                onClick={() => handleReview(false)}
                            >
                                ❌ Wrong
                            </Button>
                            <Button 
                                className="flex-1 text-sm sm:text-base bg-gradient-primary hover:opacity-90 border-0" 
                                onClick={() => handleReview(true)}
                            >
                                ✅ Correct
                            </Button>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3">
                        <Button variant="outline" onClick={prevCard} className="text-sm sm:text-base">
                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                        </Button>
                        <Button variant="outline" onClick={() => setShowAnswer(false)} className="text-sm sm:text-base">
                            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Reset
                        </Button>
                        <Button variant="outline" onClick={nextCard} className="text-sm sm:text-base">
                            <span className="hidden sm:inline">Next</span>
                            <span className="sm:hidden">Next</span>
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                        </Button>
                    </div>

                    <div className="mt-4 sm:mt-6 text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Reviews: {currentCard.reviewCount} | Correct:{" "}
                            {currentCard.correctCount}
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Generation Modal - Main View */}
            {isAiModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fadeInUp">
                        <button 
                            onClick={() => setIsAiModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold mb-1 text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            <Brain className="w-5 h-5 text-primary" />
                            Generate Flashcards with AI
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">Enter a topic and the AI will create smart flashcards instantly.</p>
                        <form onSubmit={handleGenerateAiCards} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Topic / Subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g. React Hooks, Photosynthesis, World War 2"
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Number of Cards</label>
                                    <select
                                        value={aiCount}
                                        onChange={(e) => setAiCount(Number(e.target.value))}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                                    >
                                        <option value={5}>5 cards</option>
                                        <option value={8}>8 cards</option>
                                        <option value={12}>12 cards</option>
                                        <option value={15}>15 cards</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Difficulty</label>
                                    <select
                                        value={aiDifficulty}
                                        onChange={(e) => setAiDifficulty(e.target.value)}
                                        className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                            <Button 
                                type="submit" 
                                disabled={isAiGenerating}
                                className="w-full bg-gradient-primary hover:opacity-90 border-0 text-white font-bold h-11 shadow-glow"
                            >
                                {isAiGenerating ? (
                                    <span className="flex items-center gap-2"><span className="animate-spin">⚙️</span> Generating...</span>
                                ) : (
                                    <span className="flex items-center gap-2">✨ Generate {aiCount} Flashcards</span>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Manual Creation Modal - Main View */}
            {isManualModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fadeInUp">
                        <button 
                            onClick={() => setIsManualModalOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            <Brain className="w-5 h-5 text-primary" />
                            Create Flashcard Manually
                        </h3>
                        <form onSubmit={handleCreateManualCard} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Card Title / Concept</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Closure, Event Loop"
                                    value={newCardTitle}
                                    onChange={(e) => setNewCardTitle(e.target.value)}
                                    className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Front (Question / Prompt)</label>
                                <textarea
                                    placeholder="What does event loop do in JavaScript?"
                                    value={newCardFront}
                                    onChange={(e) => setNewCardFront(e.target.value)}
                                    rows={3}
                                    className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Back (Answer / Definition)</label>
                                <textarea
                                    placeholder="It monitors the Call Stack and the Callback Queue to execute asynchronous callbacks..."
                                    value={newCardBack}
                                    onChange={(e) => setNewCardBack(e.target.value)}
                                    rows={3}
                                    className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Difficulty</label>
                                <select
                                    value={newCardDifficulty}
                                    onChange={(e) => setNewCardDifficulty(e.target.value)}
                                    className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-primary hover:opacity-90 border-0 text-white font-bold h-11 shadow-glow"
                            >
                                Save Flashcard
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashcardsPage;
