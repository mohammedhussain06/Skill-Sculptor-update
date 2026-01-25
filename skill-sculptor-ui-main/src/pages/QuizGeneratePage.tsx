import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const QuizGeneratePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { text } = location.state || {};
    
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [count, setCount] = useState([5]);
    const [difficulty, setDifficulty] = useState("medium");
    const [title, setTitle] = useState("My Quiz");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<any[]>([]);
    const { requireAuth } = useRequireAuth();

    useEffect(() => {
        if (!text) {
            toast.error("No text provided. Please upload a document first.");
            navigate("/upload");
        } else {
            generateQuiz();
        }
    }, []);

    const generateQuiz = async () => {
        if (!text) {
            toast.error("No text provided");
            return;
        }

        setGenerating(true);
        try {
            const response = await API.post(
                "/quiz/generate",
                { text, count: count[0], difficulty }
            );

            setQuestions(response.data.questions);
            toast.success(`Generated ${response.data.questions.length} questions!`);
        } catch (error: any) {
            console.error("Generation error:", error);
            toast.error(error.response?.data?.error || "Failed to generate quiz");
        } finally {
            setGenerating(false);
        }
    };

    const saveQuiz = async () => {
        if (!title) {
            toast.error("Please enter a quiz title");
            return;
        }

        requireAuth(async () => {
        setSaving(true);
        try {
                await API.post(
                "/quiz",
                { title, description, questions, sourceText: text }
            );

            toast.success("Quiz saved successfully! +20 XP");
            navigate("/quiz");
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.response?.data?.error || "Failed to save quiz");
        } finally {
            setSaving(false);
        }
        }, "/quiz");
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-2">Generate Quiz</h1>
                    <p className="text-muted-foreground mb-8">
                        AI-generated MCQ quiz from your text
                    </p>

                    {!questions.length && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Generation Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Number of Questions: {count[0]}</Label>
                                    <Slider
                                        value={count}
                                        onValueChange={setCount}
                                        min={3}
                                        max={20}
                                        step={1}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Difficulty</Label>
                                    <div className="flex gap-2">
                                        {["easy", "medium", "hard"].map((diff) => (
                                            <Button
                                                key={diff}
                                                variant={difficulty === diff ? "default" : "outline"}
                                                onClick={() => setDifficulty(diff)}
                                            >
                                                {diff.charAt(0).toUpperCase() + diff.slice(1)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <Button onClick={generateQuiz} disabled={generating} className="w-full">
                                    {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Generate Quiz
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {questions.length > 0 && (
                        <>
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Quiz Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Quiz Title</Label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Enter quiz title"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description (Optional)</Label>
                                        <Input
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Enter quiz description"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold">
                                    {questions.length} Questions Generated
                                </h2>
                                <Button onClick={saveQuiz} disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Quiz
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {questions.map((question, qIndex) => (
                                    <Card key={qIndex}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                                                <div className="flex gap-2">
                                                    <Badge>{question.difficulty}</Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeQuestion(qIndex)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Question</Label>
                                                <Input
                                                    value={question.question}
                                                    onChange={(e) =>
                                                        updateQuestion(qIndex, "question", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Options</Label>
                                                {question.options.map((option: string, oIndex: number) => (
                                                    <div key={oIndex} className="flex gap-2">
                                                        <Badge variant={question.correctAnswer === oIndex ? "default" : "outline"}>
                                                            {oIndex === question.correctAnswer ? "✓" : oIndex + 1}
                                                        </Badge>
                                                        <Input
                                                            value={option}
                                                            onChange={(e) => {
                                                                const newOptions = [...question.options];
                                                                newOptions[oIndex] = e.target.value;
                                                                updateQuestion(qIndex, "options", newOptions);
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Explanation</Label>
                                                <Input
                                                    value={question.explanation}
                                                    onChange={(e) =>
                                                        updateQuestion(qIndex, "explanation", e.target.value)
                                                    }
                                                    placeholder="Optional explanation"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizGeneratePage;
