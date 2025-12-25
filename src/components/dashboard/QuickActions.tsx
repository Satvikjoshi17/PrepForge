'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ClipboardCheck, MessageSquare } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { interviews } from '@/lib/data';
import { useRouter } from 'next/navigation';


export default function QuickActions() {
  const router = useRouter();

  const handleInterviewChange = (interviewId: string) => {
    if (interviewId) {
      router.push(interviewId === 'custom' ? '/interviews/custom' : `/interviews/${interviewId}`);
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 h-full">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <span>Take a Quiz</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Sharpen your skills with our targeted quizzes.
            </p>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Popular Topics</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                  <Link href="/quizzes/react-fundamentals">React</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                  <Link href="/quizzes/css-grid-layout">CSS Grid</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                  <Link href="/quizzes/javascript-es6">JavaScript</Link>
                </Button>
              </div>
            </div>
          </div>

          <Button asChild className="w-full mt-6">
            <Link href="/quizzes">
              Browse All Quizzes <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-accent" />
            <span>Mock Interview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Practice with our AI interviewer and get instant feedback.
            </p>
            <Select onValueChange={handleInterviewChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Quick Start Interview" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom" className="font-semibold text-primary">
                  + Create Custom Interview
                </SelectItem>
                {interviews.map((interview) => (
                  <SelectItem key={interview.id} value={interview.id}>
                    {interview.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">Want to focus on a specific topic?</p>
            <Button variant="secondary" className="w-full" onClick={() => router.push('/interviews/custom')}>
              Create Custom Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
