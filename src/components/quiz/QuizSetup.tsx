
'use client';

import { useState } from 'react';
import { Quiz } from "@/lib/types";
import QuizClient from "@/components/quiz/QuizClient";
import { Loader2 } from "lucide-react";

type QuizSetupProps = {
    quiz: Quiz;
    onStart?: () => void;
};

export default function QuizSetup({ quiz }: QuizSetupProps) {
    const [config, setConfig] = useState({
        questionCount: quiz.questions.length,
        timePerQuestion: 30, // seconds
        difficulty: 'All'
    });
    const [isSetupComplete, setIsSetupComplete] = useState(false);

    // Filter questions based on difficulty
    const availableQuestions = quiz.questions.filter(q =>
        config.difficulty === 'All' || q.difficulty === config.difficulty
    );

    const maxQuestions = availableQuestions.length;

    const handleStartQuiz = () => {
        if (maxQuestions === 0) return;
        setIsSetupComplete(true);
    };

    if (!isSetupComplete) {
        return (
            <div className="max-w-xl mx-auto py-12 px-4">
                <div className="bg-card border rounded-3xl shadow-lg p-8 space-y-8 glass">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black tracking-tight">{quiz.title}</h1>
                        <p className="text-muted-foreground">{quiz.description}</p>
                    </div>

                    <div className="space-y-6">
                        {/* Difficulty */}
                        <div className="space-y-3">
                            <label className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Difficulty</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['All', 'Easy', 'Medium', 'Hard'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => {
                                            setConfig(prev => ({ ...prev, difficulty: level }));
                                        }}
                                        className={`py-2 px-3 rounded-xl text-sm font-bold transition-all ${config.difficulty === level
                                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                            : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center pt-1">
                                {maxQuestions} questions available for this difficulty
                            </p>
                        </div>

                        {/* Question Count */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <label className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Number of Questions</label>
                                <span className="font-bold text-primary">
                                    {Math.min(config.questionCount, maxQuestions)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max={maxQuestions || 1} // Prevent 0 max
                                value={Math.min(config.questionCount, maxQuestions)}
                                onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
                                disabled={maxQuestions === 0}
                                className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground px-1">
                                <span>1</span>
                                <span>{maxQuestions}</span>
                            </div>
                        </div>

                        {/* Time Per Question */}
                        <div className="space-y-3">
                            <label className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Time Per Question</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[15, 30, 60, 120].map(seconds => (
                                    <button
                                        key={seconds}
                                        onClick={() => setConfig({ ...config, timePerQuestion: seconds })}
                                        className={`py-2 px-3 rounded-xl text-sm font-bold transition-all ${config.timePerQuestion === seconds
                                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                            : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                                            }`}
                                    >
                                        {seconds}s
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleStartQuiz}
                        disabled={maxQuestions === 0}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {maxQuestions === 0 ? 'No Questions Available' : 'Start Quiz'}
                    </button>
                </div>
            </div>
        );
    }

    // Final slice for the client
    const finalQuestionCount = Math.min(config.questionCount, maxQuestions);
    const filteredQuiz = {
        ...quiz,
        questions: availableQuestions.slice(0, finalQuestionCount)
    };

    return (
        <QuizClient quiz={filteredQuiz} timePerQuestion={config.timePerQuestion} />
    );
}
