'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import type { QuizResponse, InterviewResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    Trophy,
    Target,
    History,
    Brain,
    BarChart2,
    Calendar,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    ExternalLink,
    Play
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

type ActivityItem = {
    id: string;
    type: 'quiz' | 'interview';
    title: string;
    score: number;
    date: Date;
    details: string;
    customParams?: {
        topic: string;
        difficulty: string;
        count: number;
        time: number;
    };
    originalQuizId?: string;
};

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [loading, setLoading] = useState(true);

    // Analytics State
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        totalInterviews: 0,
        averageScore: 0,
        totalQuestionsAnswered: 0,
    });

    const [strengths, setStrengths] = useState<string[]>([]);
    const [weaknesses, setWeaknesses] = useState<string[]>([]);
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [categoryPerformance, setCategoryPerformance] = useState<{ subject: string; A: number; fullMark: number }[]>([]);
    const [scoreHistory, setScoreHistory] = useState<{ date: string; score: number }[]>([]);

    useEffect(() => {
        async function fetchUserData() {
            if (!user || !firestore) return;

            try {
                setLoading(true);

                // Fetch User Data
                const quizzesRef = collection(firestore, `users/${user.uid}/quizResponses`);
                const interviewsRef = collection(firestore, `users/${user.uid}/mockInterviewResponses`);

                // Use separate try-catch blocks or Promise.allSettled to handle potential missing collections
                // But for simplicity in this assistant task, we assume regular flow or empty arrays
                const [quizSnaps, interviewSnaps] = await Promise.all([
                    getDocs(query(quizzesRef, orderBy('completedAt', 'desc'))),
                    getDocs(query(interviewsRef, orderBy('completedAt', 'desc')))
                ]);

                const quizzes: QuizResponse[] = [];
                const interviews: InterviewResponse[] = [];
                const allActivities: ActivityItem[] = [];

                let totalScoreSum = 0;
                let totalItems = 0;
                let totalQuestions = 0;

                // Process Quizzes
                quizSnaps.forEach(doc => {
                    const data = doc.data() as QuizResponse;
                    quizzes.push(data);
                    totalScoreSum += data.score;
                    totalItems++;
                    totalQuestions += data.totalQuestions;

                    allActivities.push({
                        id: doc.id, // Use doc.id for stable key
                        type: 'quiz',
                        title: data.quizTitle,
                        score: data.score,
                        date: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : new Date(),
                        details: `${Math.round(data.score)}% Score • ${data.totalQuestions} Questions`,
                        customParams: data.customParams,
                        originalQuizId: data.quizId
                    });
                });

                // Process Interviews
                interviewSnaps.forEach(doc => {
                    const data = doc.data() as InterviewResponse;
                    interviews.push(data);
                    // Interviews might separate scoring, but let's average it in if available
                    if (typeof data.score === 'number') {
                        totalScoreSum += data.score;
                        totalItems++;
                    }

                    allActivities.push({
                        id: doc.id, // Use doc.id for stable key
                        type: 'interview',
                        title: data.interviewTitle,
                        score: data.score,
                        date: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : new Date(),
                        details: `Interview Feedback Received`
                    });
                });

                // Sort combined activity
                allActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
                setRecentActivity(allActivities);

                // Calculate Stats
                setStats({
                    totalQuizzes: quizzes.length,
                    totalInterviews: interviews.length,
                    averageScore: totalItems > 0 ? Math.round(totalScoreSum / totalItems) : 0,
                    totalQuestionsAnswered: totalQuestions,
                });

                // Calculate Category Performance (Strengths/Weaknesses & Radar Chart)
                const categoryStats: Record<string, { correct: number; total: number }> = {};

                quizzes.forEach(q => {
                    if (q.answers && Array.isArray(q.answers)) {
                        q.answers.forEach(answer => {
                            let cat = 'General';

                            // 1. Use specific topic from question if available (High Precision)
                            if (answer.topic) {
                                cat = answer.topic;
                            }
                            // 2. Heuristics based on ID (Legacy/Fallback)
                            else if (answer.questionId.startsWith('react-')) cat = 'React';
                            else if (answer.questionId.startsWith('css-')) cat = 'CSS';
                            else if (answer.questionId.startsWith('js-')) cat = 'JavaScript';
                            else {
                                // 3. Fallback to quiz title heuristic
                                const titleFirstWord = q.quizTitle.split(' ')[0];
                                if (['React', 'CSS', 'JavaScript', 'HTML', 'Next.js'].includes(titleFirstWord)) {
                                    cat = titleFirstWord;
                                } else {
                                    // If we really can't find a category, try to use a meaningful part of the title
                                    // but avoid using the whole title if it's a generated one which might be long.
                                    // For generated quizzes, if topic is missing, we might perform a fallback.
                                    // But for now, leave 'General' or limit usage.
                                    // Actually, let's allow the title first word if it looks like a subject.
                                    cat = q.quizTitle.split(':')[0] || 'General';
                                }
                            }

                            if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 };
                            categoryStats[cat].total++;
                            if (answer.isCorrect) {
                                categoryStats[cat].correct++;
                            }
                        });
                    } else {
                        // Fallback for legacy data without answers array
                        const cat = q.quizTitle.split(':')[0] || q.quizTitle;
                        if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 };
                        // Estimate based on score
                        const estimatedCorrect = Math.round((q.score / 100) * q.totalQuestions);
                        categoryStats[cat].correct += estimatedCorrect;
                        categoryStats[cat].total += q.totalQuestions;
                    }
                });

                const performanceData: { subject: string; A: number; fullMark: number }[] = [];
                const newStrengths: string[] = [];
                const newWeaknesses: string[] = [];

                Object.entries(categoryStats).forEach(([cat, s]) => {
                    const avg = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                    performanceData.push({ subject: cat, A: avg, fullMark: 100 });

                    if (avg >= 80) newStrengths.push(cat);
                    if (avg < 60) newWeaknesses.push(cat);
                });

                // Limit radar chart nodes to avoid clutter
                setCategoryPerformance(performanceData.slice(0, 6));
                setStrengths(newStrengths);
                setWeaknesses(newWeaknesses);

                // Score History for Chart
                const historyData = quizzes
                    // .slice(0, 10) // Last 10
                    .sort((a, b) => (a.completedAt?.seconds || 0) - (b.completedAt?.seconds || 0))
                    .map(q => ({
                        date: new Date(q.completedAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        score: Math.round(q.score)
                    }));
                setScoreHistory(historyData);

            } catch (err) {
                console.error("Error fetching profile data:", err);
            } finally {
                setLoading(false);
            }
        }

        if (!isUserLoading) {
            fetchUserData();
        }
    }, [user, firestore, isUserLoading]);

    // Loading State
    if (loading || isUserLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 rounded-3xl border border-border/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {user?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                </Avatar>

                <div className="text-center md:text-left space-y-2 flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{user?.displayName}</h1>
                    <p className="text-muted-foreground text-lg">{user?.email}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                        <Badge variant="secondary" className="px-3 py-1">Student</Badge>
                        <Badge variant="outline" className="px-3 py-1">Member since {new Date(user?.metadata.creationTime || Date.now()).getFullYear()}</Badge>
                    </div>
                </div>

                <div className="hidden md:flex flex-col items-end justify-center min-h-[100px]">
                    {/* Could add a "Edit Profile" button here later */}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Trophy className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageScore}%</div>
                        <p className="text-xs text-muted-foreground">Across all quizzes</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
                        <Brain className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
                        <p className="text-xs text-muted-foreground">Total attempts</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
                        <Target className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalQuestionsAnswered}</div>
                        <p className="text-xs text-muted-foreground">Lifetime total</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                        <BarChart2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInterviews}</div>
                        <p className="text-xs text-muted-foreground">Completed sessions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Areas */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column: Analytics & Skills */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Analytics</CardTitle>
                            <CardDescription>Track your progress over time</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <Tabs defaultValue="history" className="space-y-4">
                                <TabsList>
                                    <TabsTrigger value="history">Score History</TabsTrigger>
                                    <TabsTrigger value="radar">Skill Radar</TabsTrigger>
                                </TabsList>

                                <TabsContent value="history" className="h-[300px] w-full mt-0">
                                    {scoreHistory.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={scoreHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 11 }}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    tick={{ fontSize: 11 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    cursor={{ fill: 'transparent' }}
                                                />
                                                <Bar
                                                    dataKey="score"
                                                    fill="hsl(var(--primary))"
                                                    radius={[4, 4, 0, 0]}
                                                    barSize={30}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                            No quiz data available yet.
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="radar" className="h-[300px] w-full mt-0">
                                    <div className="h-full w-full flex items-center justify-center">
                                        {categoryPerformance.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryPerformance}>
                                                    <PolarGrid opacity={0.3} />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar
                                                        name="Performance"
                                                        dataKey="A"
                                                        stroke="hsl(var(--primary))"
                                                        fill="hsl(var(--primary))"
                                                        fillOpacity={0.4}
                                                    />
                                                    <Tooltip />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-muted-foreground text-sm">Complete quizzes to see your skill radar.</div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* ... (Strengths/Weaknesses cards unchanged logic) ... */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400 text-base">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Strengths
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {strengths.length > 0 ? (
                                        strengths.map(s => (
                                            <Badge key={s} variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300">
                                                {s}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Keep practicing to identify your super powers!</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-base">
                                    <Target className="h-5 w-5" />
                                    Areas to Improve
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {weaknesses.length > 0 ? (
                                        weaknesses.map(w => (
                                            <Badge key={w} variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                                                {w}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">You're doing great! No specific weak spots found yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="space-y-6">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[400px] md:h-[520px] pr-4">
                                <div className="space-y-6 p-6">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0"
                                            >
                                                <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full ring-4 ring-background ${activity.type === 'quiz' ? 'bg-blue-500' : 'bg-purple-500'} transition-transform`} />
                                                <div className="flex flex-col space-y-3 p-3 -ml-2 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">

                                                    {/* Header */}
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold leading-none">{activity.title}</p>
                                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                                                    {activity.type === 'quiz' ? 'Quiz' : 'Interview'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {formatDistanceToNow(activity.date, { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                        {activity.type === 'quiz' && (
                                                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${activity.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                activity.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                }`}>
                                                                {Math.round(activity.score)}%
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                                                            <Link href={`/results/${activity.id}?type=${activity.type}`}>
                                                                <ExternalLink className="h-3 w-3 mr-1.5" />
                                                                View Result
                                                            </Link>
                                                        </Button>

                                                        {activity.type === 'quiz' && (
                                                            <Button size="sm" className="h-7 text-xs" asChild>
                                                                <Link
                                                                    href={
                                                                        activity.customParams
                                                                            ? `/quizzes/custom?topic=${activity.customParams.topic}&difficulty=${activity.customParams.difficulty}&count=${activity.customParams.count}&time=${activity.customParams.time}`
                                                                            : `/quizzes/${activity.originalQuizId}`
                                                                    }
                                                                >
                                                                    <RefreshCcw className="h-3 w-3 mr-1.5" />
                                                                    Re-attempt
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                <Calendar className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                No recent activity.<br />Start a quiz or interview to build your history!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
