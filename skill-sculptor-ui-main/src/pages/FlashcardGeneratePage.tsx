import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const FlashcardGeneratePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { text } = location.state || {};
    
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [count, setCount] = useState([10]);
    const [difficulty, setDifficulty] = useState("medium");
    const [flashcards, setFlashcards] = useState<any[]>([]);
    const { requireAuth } = useRequireAuth();

    useEffect(() => {
        if (!text) {
            toast.error("No text provided. Please upload a document first.");
            navigate("/upload");
        } else {
            generateFlashcards();
        }
    }, []);

    const generateFlashcards = async () => {
        if (!text) {
            toast.error("No text provided");
            return;
        }

        setGenerating(true);
        try {
            const response = await API.post(
                "/flashcard/generate",
                { text, count: count[0], difficulty }
            );

            setFlashcards(response.data.flashcards);
            toast.success(`Generated ${response.data.flashcards.length} flashcards!`);
        } catch (error: any) {
            console.error("Generation error:", error);
            toast.error(error.response?.data?.error || "Failed to generate flashcards");
        } finally {
            setGenerating(false);
        }
    };

    const saveFlashcards = async () => {
        requireAuth(async () => {
        setSaving(true);
        try {
                await API.post(
                "/flashcard",
                { flashcards }
            );

            toast.success("Flashcards saved successfully! +5 XP per card");
            navigate("/flashcards");
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.response?.data?.error || "Failed to save flashcards");
        } finally {
            setSaving(false);
        }
        }, "/flashcards");
    };

    const removeFlashcard = (index: number) => {
        setFlashcards(flashcards.filter((_, i) => i !== index));
    };

    const updateFlashcard = (index: number, field: string, value: string) => {
        const updated = [...flashcards];
        updated[index][field] = value;
        setFlashcards(updated);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Generate Flashcards</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                        AI-generated flashcards from your text
                    </p>

                    {!flashcards.length && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Generation Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Number of Flashcards: {count[0]}</Label>
                                    <Slider
                                        value={count}
                                        onValueChange={setCount}
                                        min={5}
                                        max={50}
                                        step={5}
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
                                <Button onClick={generateFlashcards} disabled={generating} className="w-full">
                                    {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Generate Flashcards
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {flashcards.length > 0 && (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl font-semibold">
                                    {flashcards.length} Flashcards Generated
                                </h2>
                                <Button onClick={saveFlashcards} disabled={saving} className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 border-0">
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <Save className="w-4 h-4 mr-2" />
                                    Save All
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {flashcards.map((flashcard, index) => (
                                    <Card key={index}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">Flashcard {index + 1}</CardTitle>
                                                <div className="flex gap-2">
                                                    <Badge>{flashcard.difficulty}</Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFlashcard(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Front (Question)</Label>
                                                <Input
                                                    value={flashcard.front}
                                                    onChange={(e) =>
                                                        updateFlashcard(index, "front", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Back (Answer)</Label>
                                                <Input
                                                    value={flashcard.back}
                                                    onChange={(e) =>
                                                        updateFlashcard(index, "back", e.target.value)
                                                    }
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

export default FlashcardGeneratePage;
