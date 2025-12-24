
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QuizClient from "@/components/quiz/QuizClient";
import QuizSetup from "@/components/quiz/QuizSetup";
import { Quiz } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function GeneratedQuizPage() {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const router = useRouter();
    const [config, setConfig] = useState({
        questionCount: 0,
        timePerQuestion: 30, // seconds
        difficulty: 'All'
    });
    const [isSetupComplete, setIsSetupComplete] = useState(false);

    useEffect(() => {
        try {
            const storedData = sessionStorage.getItem('generatedQuiz');
            if (!storedData) {
                router.push('/quizzes');
                return;
            }
            const parsedQuiz = JSON.parse(storedData) as Quiz;
            setQuiz(parsedQuiz);
            setConfig(prev => ({ ...prev, questionCount: parsedQuiz.questions.length }));
        } catch (e) {
            console.error("Error loading generated quiz", e);
            router.push('/quizzes');
        }
    }, [router]);

    if (!quiz) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading your custom quiz...</span>
            </div>
        );
    }

    return <QuizSetup quiz={quiz} />;
}
