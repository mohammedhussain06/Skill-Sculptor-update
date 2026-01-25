import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const QuizListPage = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                        <Button 
                            onClick={() => navigate("/upload")} 
                            className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Quiz
                        </Button>
                    </div>

                    {quizzes.length === 0 ? (
                        <Card className="fun-card border-0 shadow-card bg-card/80 backdrop-blur-sm">
                            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4">
                                <div className="achievement-badge p-4 sm:p-6 mb-4 sm:mb-6">
                                    <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                                </div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-center">No Quizzes Yet</h2>
                                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 text-center max-w-md">
                                    Upload a document to generate your first quiz and start your learning journey! 🚀
                                </p>
                                <Button 
                                    onClick={() => navigate("/upload")}
                                    className="bg-gradient-primary hover:opacity-90 border-0 text-sm sm:text-base"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Get Started
                                </Button>
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
        </div>
    );
};

export default QuizListPage;
