import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Clock, Trophy, Award, TrendingUp } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";

const QuizTakePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [quiz, setQuiz] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<any[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [startTime, setStartTime] = useState(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    const fetchQuiz = async () => {
        try {
            const response = await API.get(`/quiz/${id}`);
            setQuiz(response.data.quiz);
        } catch (error) {
            toast.error("Failed to fetch quiz");
            navigate("/quiz");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (selectedAnswer === null) {
            toast.error("Please select an answer");
            return;
        }

        const timeSpent = (Date.now() - questionStartTime) / 1000;
        const newAnswers = [...answers, { selectedAnswer, timeSpent }];
        setAnswers(newAnswers);

        if (currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
            setQuestionStartTime(Date.now());
        } else {
            submitQuiz(newAnswers);
        }
    };

    const submitQuiz = async (finalAnswers: any[]) => {
        try {
            const totalTimeSpent = (Date.now() - startTime) / 1000;

            const response = await API.post(
                `/quiz/${id}/attempt`,
                { answers: finalAnswers, timeSpent: totalTimeSpent }
            );

            setResults(response.data);
            setShowResults(true);
            toast.success(`Quiz completed! +${response.data.xpEarned} XP`);
        } catch (error) {
            toast.error("Failed to submit quiz");
        }
    };

    if (loading || !quiz) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="flex items-center justify-center h-screen">
                    <p>Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (showResults && results) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
                    <div className="max-w-2xl mx-auto">
                        <Card className="mb-4 sm:mb-6">
                            <CardHeader className="text-center p-4 sm:p-6">
                                <Trophy className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 text-yellow-500" />
                                <CardTitle className="text-xl sm:text-2xl md:text-3xl">Quiz Completed!</CardTitle>
                                <CardDescription className="text-sm sm:text-base">Here are your results</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <Card>
                                        <CardContent className="pt-4 sm:pt-6 text-center">
                                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">
                                                {results.percentage.toFixed(1)}%
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">Score</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4 sm:pt-6 text-center">
                                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-1 sm:mb-2">
                                                +{results.xpEarned}
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">XP Earned</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                                        <span className="text-xs sm:text-sm text-muted-foreground">Correct Answers:</span>
                                        <Badge className="text-xs">{results.attempt.score} / {quiz.questions.length}</Badge>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                                        <span className="text-xs sm:text-sm text-muted-foreground">Adaptive Level:</span>
                                        <Badge variant="outline" className="text-xs">{results.adaptiveLevel}</Badge>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                                        <span className="text-xs sm:text-sm text-muted-foreground">New Level:</span>
                                        <Badge variant="outline" className="text-xs">Level {results.userProgress.level}</Badge>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                                        <span className="text-xs sm:text-sm text-muted-foreground">Total XP:</span>
                                        <Badge variant="outline" className="text-xs">{results.userProgress.xp}</Badge>
                                    </div>
                                </div>

                                {results.userProgress.newBadges?.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <Award className="w-5 h-5" />
                                            New Badges Earned!
                                        </h3>
                                        <div className="space-y-2">
                                            {results.userProgress.newBadges.map((badge: any, index: number) => (
                                                <Card key={index}>
                                                    <CardContent className="pt-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-3xl">🏆</span>
                                                            <div>
                                                                <div className="font-semibold">{badge.name}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {badge.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-semibold mb-3">Review Answers</h3>
                                    <div className="space-y-3 sm:space-y-4">
                                        {quiz.questions.map((q: any, index: number) => {
                                            const userAnswer = results.attempt.answers[index];
                                            const isCorrect = userAnswer.isCorrect;
                                            
                                            return (
                                                <Card key={index} className={isCorrect ? "border-green-500" : "border-red-500"}>
                                                    <CardContent className="p-3 sm:p-4 md:pt-4">
                                                        <div className="space-y-2">
                                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                                                <p className="font-medium text-sm sm:text-base break-words">Q{index + 1}: {q.question}</p>
                                                                <Badge variant={isCorrect ? "default" : "destructive"} className="text-xs shrink-0">
                                                                    {isCorrect ? "✓" : "✗"}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs sm:text-sm break-words">
                                                                <span className="text-muted-foreground">Your answer: </span>
                                                                <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                                                                    {q.options[userAnswer.selectedAnswer]}
                                                                </span>
                                                            </p>
                                                            {!isCorrect && (
                                                                <p className="text-xs sm:text-sm break-words">
                                                                    <span className="text-muted-foreground">Correct answer: </span>
                                                                    <span className="text-green-600">
                                                                        {q.options[q.correctAnswer]}
                                                                    </span>
                                                                </p>
                                                            )}
                                                            {q.explanation && (
                                                                <p className="text-xs sm:text-sm text-muted-foreground italic break-words">
                                                                    {q.explanation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <Button className="flex-1 text-sm sm:text-base" onClick={() => navigate("/quiz")}>
                                        Back to Quizzes
                                    </Button>
                                    <Button className="flex-1 text-sm sm:text-base" variant="outline" onClick={() => window.location.reload()}>
                                        Retake Quiz
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    const question = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-2">
                            <h1 className="text-xl sm:text-2xl font-bold break-words">{quiz.title}</h1>
                            <Badge variant="outline" className="text-xs sm:text-sm shrink-0">
                                Q{currentQuestion + 1} / {quiz.questions.length}
                            </Badge>
                        </div>
                        <Progress value={progress} className="h-1.5 sm:h-2" />
                    </div>

                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                <CardTitle className="text-base sm:text-lg md:text-xl break-words flex-1">{question.question}</CardTitle>
                                <Badge className="text-xs shrink-0">{question.difficulty}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            <RadioGroup value={selectedAnswer?.toString()} onValueChange={(v) => setSelectedAnswer(parseInt(v))}>
                                <div className="space-y-2 sm:space-y-3">
                                    {question.options.map((option: string, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center space-x-2 sm:space-x-3 border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent"
                                            onClick={() => setSelectedAnswer(index)}
                                        >
                                            <RadioGroupItem value={index.toString()} id={`option-${index}`} className="shrink-0" />
                                            <Label
                                                htmlFor={`option-${index}`}
                                                className="flex-1 cursor-pointer text-sm sm:text-base break-words"
                                            >
                                                {option}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>

                            <Button onClick={handleNext} className="w-full text-sm sm:text-base" disabled={selectedAnswer === null}>
                                {currentQuestion < quiz.questions.length - 1 ? "Next Question" : "Submit Quiz"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QuizTakePage;
