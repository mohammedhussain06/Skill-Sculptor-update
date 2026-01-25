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
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">My Quizzes</h1>
                            <p className="text-muted-foreground">
                                Challenge yourself and track your progress
                            </p>
                        </div>
                        <Button onClick={() => navigate("/upload")}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Quiz
                        </Button>
                    </div>

                    {quizzes.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                                <h2 className="text-2xl font-bold mb-2">No Quizzes Yet</h2>
                                <p className="text-muted-foreground mb-4">
                                    Upload a document to generate your first quiz
                                </p>
                                <Button onClick={() => navigate("/upload")}>
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {quizzes.map((quiz) => (
                                <Card key={quiz._id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteQuiz(quiz._id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        {quiz.description && (
                                            <CardDescription className="line-clamp-2">
                                                {quiz.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Questions:</span>
                                            <Badge variant="outline">{quiz.questions.length}</Badge>
                                        </div>
                                        {quiz.totalAttempts > 0 && (
                                            <>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Attempts:</span>
                                                    <Badge variant="outline">{quiz.totalAttempts}</Badge>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Avg Score:</span>
                                                    <Badge>{quiz.averageScore.toFixed(1)}%</Badge>
                                                </div>
                                            </>
                                        )}
                                        <Button 
                                            className="w-full" 
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
