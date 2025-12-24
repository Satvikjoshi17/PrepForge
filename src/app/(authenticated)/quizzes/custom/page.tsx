
import QuizClient from "@/components/quiz/QuizClient";
import { quizzes } from "@/lib/data";
import { Quiz, Question } from "@/lib/types";
import { notFound, redirect } from "next/navigation";

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CustomQuizPage({ searchParams }: Props) {
    const params = await searchParams;
    const topic = params.topic as string; // 'React', 'CSS', 'JavaScript' or 'All'
    const count = parseInt((params.count as string) || "5", 10);
    const time = parseInt((params.time as string) || "30", 10);
    const difficulty = params.difficulty as string; // 'Easy', 'Medium', 'Hard', 'Mixed'

    if (!topic) {
        redirect("/quizzes");
    }

    // 1. Gather all potential questions based on topic
    let pool: Question[] = [];

    if (topic === "All") {
        pool = quizzes.flatMap((q) => q.questions);
    } else {
        // Find quizzes matching the category
        // Note: quizzes in data.ts are grouped by ID acting as category somewhat, 
        // but they have a 'category' field.
        const matchingQuizzes = quizzes.filter(
            (q) => q.category.toLowerCase() === topic.toLowerCase()
        );
        pool = matchingQuizzes.flatMap((q) => q.questions);
    }

    // 2. Filter by difficulty if not Mixed
    if (difficulty && difficulty !== "Mixed") {
        pool = pool.filter((q) => q.difficulty === difficulty);
    }

    // 3. Shuffle
    pool = shuffleArray(pool);

    // 4. Slice to count
    const selectedQuestions = pool.slice(0, count);

    // If no questions found (e.g., no Hard questions for React), handle gracefully
    // For now, we'll just show what we have, or redirect if 0
    if (selectedQuestions.length === 0) {
        // Ideally show an error state, but let's just redirect for safety or show empty
        // We'll create a dummy empty quiz that QuizClient handles or show a message
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <h2 className="text-2xl font-bold">No questions found!</h2>
                <p className="text-muted-foreground">We couldn't find enough questions matching your criteria.</p>
                <a href="/quizzes" className="text-primary hover:underline">Go back and try different settings</a>
            </div>
        )
    }

    const customQuiz: Quiz = {
        id: `custom-${Date.now()}`,
        title: `Custom ${topic} Quiz`,
        category: topic,
        description: `A custom generated quiz with ${selectedQuestions.length} questions.`,
        image: "https://picsum.photos/seed/custom/600/400", // generic image
        imageHint: "custom quiz",
        questions: selectedQuestions,
    };

    return (
        <QuizClient
            quiz={customQuiz}
            timePerQuestion={time}
            customParams={{ topic, difficulty, count, time }}
        />
    );
}
