'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { History, Loader2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import type { QuizResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


export default function RecentActivity() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      if (!user || !firestore) return;
      setIsLoading(true);
      try {
        const q = query(
          collection(firestore, `users/${user.uid}/quizResponses`),
          orderBy('completedAt', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const fetchedData = querySnapshot.docs.map(doc => {
          const response = doc.data() as QuizResponse;
          return {
            name: format(response.completedAt.toDate(), 'MMM d'),
            score: Math.round(response.score),
            title: response.quizTitle,
          };
        }).reverse(); // Reverse to show chronological order (oldest -> newest)
        setData(fetchedData);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivities();
  }, [user, firestore]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          <span>Recent Activity</span>
        </CardTitle>
        <CardDescription>
          Your progress across the last {data.length} quizzes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <div className="text-center">
              <p className="font-medium">No activity recorded yet.</p>
              <p className="text-sm text-muted-foreground/80">Complete a quiz to see your progress!</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/quizzes">Start First Quiz</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
