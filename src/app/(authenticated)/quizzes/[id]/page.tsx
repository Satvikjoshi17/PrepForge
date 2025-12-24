
import QuizClient from "@/components/quiz/QuizClient";
import QuizSetup from "@/components/quiz/QuizSetup";
import { quizzes } from "@/lib/data";
import { notFound } from "next/navigation";

type QuizPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  return quizzes.map((quiz) => ({
    id: quiz.id,
  }));
}

export default async function QuizPage({ params }: QuizPageProps) {
  const unwrappedParams = await params;
  const quiz = quizzes.find((q) => q.id === unwrappedParams.id);

  if (!quiz) {
    notFound();
    return null; // Ensure we don't proceed with undefined quiz
  }

  return (
    <QuizSetup quiz={quiz} />
  );
}
