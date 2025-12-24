'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Target, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { QuizResponse } from '@/lib/types';

export default function StrengthsWeaknesses() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function calculateProfile() {
      if (!user || !firestore) return;
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(firestore, `users/${user.uid}/quizResponses`));
        const categoryStats: Record<string, { totalScore: number; count: number }> = {};

        querySnapshot.forEach(doc => {
          const response = doc.data() as QuizResponse;
          const category = response.quizTitle; // Using full title for now, could be improved
          if (!categoryStats[category]) {
            categoryStats[category] = { totalScore: 0, count: 0 };
          }
          categoryStats[category].totalScore += response.score;
          categoryStats[category].count += 1;
        });

        const newStrengths: string[] = [];
        const newWeaknesses: string[] = [];

        Object.entries(categoryStats).forEach(([category, stats]) => {
          const avgScore = stats.totalScore / stats.count;
          if (avgScore >= 80) {
            newStrengths.push(category);
          } else if (avgScore < 60) {
            newWeaknesses.push(category);
          }
        });

        setStrengths(newStrengths);
        setWeaknesses(newWeaknesses);
      } catch (error) {
        console.error("Error calculating strengths/weaknesses:", error);
      } finally {
        setIsLoading(false);
      }
    }

    calculateProfile();
  }, [user, firestore]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <span>Strengths & Weaknesses</span>
        </CardTitle>
        <CardDescription>
          Based on your recent quiz performances.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (strengths.length > 0 || weaknesses.length > 0) ? (
          <>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-green-700 dark:text-green-400">Strengths</h3>
              <div className="flex flex-wrap gap-2">
                {strengths.length > 0 ? (
                  strengths.map(s => (
                    <Badge key={s} variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Keep practicing to identify strengths!</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-amber-700 dark:text-amber-400">Areas to Improve</h3>
              <div className="flex flex-wrap gap-2">
                {weaknesses.length > 0 ? (
                  weaknesses.map(w => (
                    <Badge key={w} variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                      {w}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No specific weak areas identified yet. Great job!</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Complete more quizzes to build your skill profile.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
