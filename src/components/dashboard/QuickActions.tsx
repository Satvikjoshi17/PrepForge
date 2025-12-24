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
      router.push(`/interviews/${interviewId}`);
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 h-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <span>Take a Quiz</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Sharpen your skills with our targeted quizzes.
          </p>
          <Button asChild>
            <Link href="/quizzes">
              Browse Quizzes <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-accent" />
            <span>Mock Interview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Practice with our AI interviewer and get instant feedback.
          </p>
          <Select onValueChange={handleInterviewChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Start Interview" />
            </SelectTrigger>
            <SelectContent>
              {interviews.map((interview) => (
                <SelectItem key={interview.id} value={interview.id}>
                  {interview.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
