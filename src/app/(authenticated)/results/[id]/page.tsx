'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import type { QuizResponse, InterviewResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Percent, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { quizzes } from '@/lib/data';
import { useMemo } from 'react';

export default function ResultsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);
  const rawType = unwrappedSearchParams.type;
  const type = (Array.isArray(rawType) ? rawType[0] : rawType) as 'quiz' | 'interview' | undefined;

  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const collectionName = type === 'interview' ? 'mockInterviewResponses' : 'quizResponses';

  const docPath = user ? `users/${user.uid}/${collectionName}/${unwrappedParams.id}` : null;

  const docRef = useMemo(() => {
    if (!user || !firestore || !docPath) return null;
    return doc(firestore, docPath);
  }, [user?.uid, firestore, docPath]);

  const { data: result, isLoading: loading, error } = useDoc<QuizResponse | InterviewResponse>(docRef);

  if (loading || isUserLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Error Loading Results</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  if (!result && !loading && !isUserLoading && user) {
    return notFound();
  }

  if (!result) {
    return null;
  }

  const completedDate = result.completedAt ? new Date(result.completedAt.seconds * 1000).toLocaleDateString() : 'N/A';

  if (type === 'interview' && 'feedback' in result) {
    const interviewResult = result as InterviewResponse;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback for {interviewResult.interviewTitle}</h1>
          <p className="text-muted-foreground">
            Completed on {completedDate}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center p-6 bg-secondary/20 rounded-xl">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Overall Score</p>
                <span className="text-5xl font-black text-primary">{Math.round(interviewResult.score)}%</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">AI Feedback</h3>
              <div className="p-4 rounded-lg bg-muted/50 border text-muted-foreground leading-relaxed">
                {interviewResult.feedback}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- QUIZ RENDERING ---
  const quizResult = result as QuizResponse;

  if (!('answers' in quizResult)) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold text-destructive">Invalid Result Data</h2>
        <p className="text-muted-foreground">The data found does not match the expected quiz format.</p>
      </div>
    );
  }

  const correctAnswers = quizResult.answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = quizResult.totalQuestions - correctAnswers;
  const pieData = [
    { name: 'Correct', value: correctAnswers, color: 'hsl(var(--primary))' },
    { name: 'Incorrect', value: incorrectAnswers, color: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results for {quizResult.quizTitle}</h1>
          <p className="text-muted-foreground">
            Completed on {completedDate}
          </p>
        </div>

        <Button onClick={async () => {
          if (quizResult.customParams) {
            router.push(`/quizzes/custom?topic=${quizResult.customParams.topic}&difficulty=${quizResult.customParams.difficulty}&count=${quizResult.customParams.count}&time=${quizResult.customParams.time}`);
          } else if (quizResult.quizId.startsWith('generated-')) {
            // Handle generated quiz re-attempt
            if (!firestore || !user) return;
            try {
              const docRef = doc(firestore, 'users', user.uid, 'recs', quizResult.quizId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const quizData = docSnap.data();
                sessionStorage.setItem('generatedQuiz', JSON.stringify(quizData));
                router.push('/quizzes/generated');
              } else {
                alert("Original quiz data not found. It might have been deleted.");
              }
            } catch (e) {
              console.error("Error fetching generated quiz:", e);
              alert("Failed to load quiz data.");
            }
          } else {
            // Standard quiz
            router.push(`/quizzes/${quizResult.quizId}`);
          }
        }}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Re-attempt Quiz
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 items-center">
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{Math.round(quizResult.score)}%</span>
                <span className="text-sm text-muted-foreground">Score</span>
              </div>
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-primary" /> Correct: {correctAnswers}</div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-destructive" /> Incorrect: {incorrectAnswers}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
              <div className="p-3 bg-primary/10 rounded-full"><Percent className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">{Math.round(quizResult.score)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
              <div className="p-3 bg-green-500/10 rounded-full"><Check className="h-6 w-6 text-green-500" /></div>
              <div>
                <p className="text-muted-foreground">Correct Answers</p>
                <p className="text-2xl font-bold">{correctAnswers} / {quizResult.totalQuestions}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
              <div className="p-3 bg-red-500/10 rounded-full"><X className="h-6 w-6 text-red-500" /></div>
              <div>
                <p className="text-muted-foreground">Incorrect Answers</p>
                <p className="text-2xl font-bold">{incorrectAnswers} / {quizResult.totalQuestions}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Answer Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quizResult.answers.map((answer, index) => (
            <div key={answer.questionId} className={cn("p-4 border rounded-lg", answer.isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5')}>
              <p className="font-semibold">{index + 1}. {quizzes.flatMap(q => q.questions).find(q => q.id === answer.questionId)?.text}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={answer.isCorrect ? 'default' : 'destructive'} className={cn(answer.isCorrect && 'bg-green-600')}>
                  {answer.isCorrect ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                  Your answer:
                </Badge>
                <span>{answer.selected || 'Not answered'}</span>
              </div>
              {!answer.isCorrect && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">Correct answer:</Badge>
                  <span>{answer.correct}</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div >
  );
}
