import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Brain, ChevronLeft, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FlashcardsPage = () => {
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);

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
                            Upload a document to generate flashcards automatically 🚀
                        </p>
                        <Button 
                            onClick={() => navigate("/upload")}
                            className="bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base"
                        >
                            Upload Document
                        </Button>
                    </div>
                </div>
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
                        <Badge variant="outline" className="text-xs sm:text-sm bg-gradient-primary text-white border-0">
                            {currentIndex + 1} / {flashcards.length}
                        </Badge>
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
        </div>
    );
};

export default FlashcardsPage;
