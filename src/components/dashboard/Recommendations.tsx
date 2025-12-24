'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ArrowRight, Lightbulb, BookOpen, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { getRecommendationsAction } from '@/app/actions';
import { availableResources } from '@/lib/data';
import type { PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, getDocs, doc, getDoc, setDoc, serverTimestamp, getDocsFromServer, getDocFromServer } from 'firebase/firestore';
import type { QuizResponse, InterviewResponse } from '@/lib/types';

const iconMap = {
  quiz: <ClipboardCheck className="h-5 w-5 text-primary" />,
  article: <BookOpen className="h-5 w-5 text-primary" />,
  studyMaterial: <Lightbulb className="h-5 w-5 text-primary" />,
};

export default function Recommendations() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput['recommendations']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      if (!user || !firestore) return;
      setIsLoading(true);
      try {
        console.log(`[Diagnostic] User UID: ${user.uid}`);

        // 1. Fetch Quiz Responses
        let quizSnapshot;
        try {
          console.log(`[Diagnostic] Fetching quiz responses (SERVER)...`);
          const token = await user.getIdToken();
          console.log(`[Diagnostic] Token available: ${!!token}, length: ${token.length}`);
          quizSnapshot = await getDocsFromServer(collection(firestore, `users/${user.uid}/quizResponses`));
        } catch (e: any) {
          console.error("[Diagnostic] Failed to fetch quiz responses:", e);
          throw new Error(`Quiz Fetch Error: ${e.message}`);
        }

        // 2. Fetch Interview Responses
        let interviewSnapshot;
        try {
          console.log(`[Diagnostic] Fetching interview responses (SERVER)...`);
          interviewSnapshot = await getDocsFromServer(collection(firestore, `users/${user.uid}/mockInterviewResponses`));
        } catch (e: any) {
          console.error("[Diagnostic] Failed to fetch interview responses:", e);
          throw new Error(`Interview Fetch Error: ${e.message}`);
        }

        const quizResponses = quizSnapshot.docs.map(doc => {
          const data = doc.data() as QuizResponse;
          return { quizId: data.quizId, score: data.score, category: data.quizTitle.split(' ')[0] };
        });

        const interviewResponses = interviewSnapshot.docs.map(doc => {
          const data = doc.data() as InterviewResponse;
          return { interviewId: data.interviewId, score: data.score, category: 'General', feedback: data.feedback };
        });

        // 3. Check Cache
        const recRef = doc(firestore, `users/${user.uid}/recs`, 'current');
        let cachedDoc;
        try {
          console.log(`[Diagnostic] Checking cache (SERVER)... Path: ${recRef.path}`);
          cachedDoc = await getDocFromServer(recRef);
        } catch (e: any) {
          console.error("[Diagnostic] Failed to fetch cache:", e);
          throw new Error(`Cache Fetch Error: ${e.message}`);
        }

        const currentQuizCount = quizSnapshot.docs.length;
        const currentInterviewCount = interviewSnapshot.docs.length;

        if (cachedDoc.exists()) {
          const cachedData = cachedDoc.data();
          const lastQuizCount = cachedData.quizCount || 0;
          const lastInterviewCount = cachedData.interviewCount || 0;

          const quizDiff = Math.max(0, currentQuizCount - lastQuizCount);
          const interviewDiff = Math.max(0, currentInterviewCount - lastInterviewCount);
          const activityScore = (quizDiff * 0.2) + (interviewDiff * 0.5);

          if (activityScore < 1.0) {
            setRecommendations(cachedData.recommendations);
            setIsLoading(false);
            return;
          }
        }

        console.log("Generating new recommendations via Server Action...");
        const result = await getRecommendationsAction({
          userId: user.uid,
          quizResponses: quizResponses,
          mockInterviewResponses: interviewResponses,
          availableResources: availableResources,
        });

        if (result.recommendations && result.recommendations.length > 0) {
          setRecommendations(result.recommendations);

          try {
            console.log("Saving new recommendations to cache...");
            await setDoc(recRef, {
              userId: user.uid,
              recommendations: result.recommendations,
              quizCount: currentQuizCount,
              interviewCount: currentInterviewCount,
              updatedAt: serverTimestamp(),
            });
          } catch (e: any) {
            console.error("[Diagnostic] Failed to save cache:", e);
            // Non-critical error, don't block display
          }
        } else if (cachedDoc.exists()) {
          setRecommendations(cachedDoc.data().recommendations);
        } else {
          setRecommendations([]);
        }
      } catch (error: any) {
        console.error("[CRITICAL] Recommendations Flow Failed:", error);
        setErrorMessage(error?.message || "Permission Denied or Network Error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, [user, firestore]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span>For You</span>
        </CardTitle>
        <CardDescription>
          AI-powered recommendations based on your performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-mono">
            <strong>Diagnostic Error:</strong> {errorMessage}
            <div className="mt-1 opacity-70">UID: {user?.uid || 'Unknown'}</div>
          </div>
        )}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <ul className="space-y-4">
            {recommendations.map((rec) => (
              <li key={rec.resourceId}>
                <Button variant="ghost" className="h-auto w-full p-0" asChild>
                  <Link href={rec.url} className="flex items-start gap-4 text-left p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="mt-1 flex-shrink-0">
                      {iconMap[rec.type]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm leading-tight">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.reason}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-1" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">
            Complete some quizzes or interviews to get personalized learning paths!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
