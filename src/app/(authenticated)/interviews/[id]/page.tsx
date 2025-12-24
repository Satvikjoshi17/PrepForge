'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { interviews } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PhoneOff, Send, Loader2, Star, Award, RotateCcw, Home, Sparkles, User, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from '@/components/ui/scroll-area';
import { conductMockInterviewAction, getInterviewFeedbackAction } from '@/app/actions';
import { useUser, useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


type ConversationTurn = {
  speaker: 'ai' | 'user';
  text: string;
};

export default function InterviewPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const interview = interviews.find((i) => i.id === id);
  const { user } = useUser();
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const initialMessage = interview?.category === 'General'
    ? "Hello! To get started, could you tell me a little bit about yourself and your background?"
    : `Hello! I'm ready to conduct your mock interview for the ${interview?.title} role. To begin, could you briefly describe your experience with ${interview?.category}?`;

  const [conversation, setConversation] = useState<ConversationTurn[]>([
    {
      speaker: 'ai',
      text: initialMessage,
    },
  ]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{ score: number; summary: string; strengths?: string[]; weaknesses?: string[] } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isLoading]);


  if (!interview) {
    notFound();
  }

  const handleSendMessage = async () => {
    if (!userResponse.trim() || isLoading) return;

    const newConversation: ConversationTurn[] = [
      ...conversation,
      { speaker: 'user', text: userResponse },
    ];
    setConversation(newConversation);
    setUserResponse('');
    setIsLoading(true);

    try {
      const previousQuestions = newConversation
        .filter(turn => turn.speaker === 'ai')
        .map(turn => turn.text);
      const previousResponses = newConversation
        .filter(turn => turn.speaker === 'user')
        .map(turn => turn.text);

      const aiResponse = await conductMockInterviewAction({
        jobTitle: interview.title,
        jobDescription: interview.description,
        userResponse: userResponse,
        previousQuestions: previousQuestions,
        previousResponses: previousResponses,
      });

      setConversation(prev => [
        ...prev,
        { speaker: 'ai', text: aiResponse.question },
      ]);
    } catch (error: any) {
      console.error("Frontend Interview Error:", error);
      setConversation(prev => [
        ...prev,
        { speaker: 'ai', text: `Error: ${error.message || "Something went wrong. Please try again."}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndInterview = async () => {
    if (conversation.length < 3) {
      toast({ variant: 'destructive', title: 'Interview too short', description: 'Please answer at least one more question before finishing.' });
      return;
    }

    setIsFinishing(true);
    try {
      const feedback = await getInterviewFeedbackAction({
        jobDescription: interview.description,
        conversation: conversation,
      });

      const response = {
        userId: user?.uid,
        interviewId: interview.id,
        interviewTitle: interview.title,
        score: feedback.score,
        feedback: feedback.summary,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        conversation: conversation,
        completedAt: serverTimestamp(),
      };

      if (user && firestore) {
        await addDoc(collection(firestore, `users/${user.uid}/mockInterviewResponses`), response);
      }

      setFeedbackData(feedback);
      setShowFeedback(true);
    } catch (error: any) {
      console.error("Error finishing interview:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to analyze interview results.' });
    } finally {
      setIsFinishing(false);
    }
  };

  if (showFeedback && feedbackData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto py-8"
      >
        <Card className="overflow-hidden border-none shadow-2xl glass pt-0">
          <div className="h-32 bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30">
              <Award className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardHeader className="text-center -mt-6">
            <div className="mx-auto bg-card rounded-2xl p-6 shadow-xl w-64 border flex flex-col items-center">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Interview Score</span>
              <span className="text-6xl font-black text-primary">{feedbackData.score}%</span>
              <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < Math.floor(feedbackData.score / 20) ? "fill-primary text-primary" : "text-muted-foreground/30")} />
                ))}
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold mt-6">{interview.title} Feedback</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-12 space-y-8">
            <div className="p-6 rounded-2xl bg-secondary/50 border space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Summary
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg italic">
                "{feedbackData.summary}"
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Key Observations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-green-500/5 border-green-500/20">
                  <p className="font-bold text-green-700 dark:text-green-400 mb-1">Strengths</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {feedbackData.strengths?.map((s, i) => <li key={i}>{s}</li>) || <li>Confident communication</li>}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20">
                  <p className="font-bold text-amber-700 dark:text-amber-400 mb-1">Opportunities</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {feedbackData.weaknesses?.map((w, i) => <li key={i}>{w}</li>) || <li>Structure responses better</li>}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-4 md:px-12 pb-12 pt-8 flex flex-col sm:flex-row gap-4">
            <Button onClick={() => window.location.reload()} className="h-12 flex-1 text-lg font-bold">
              <RotateCcw className="mr-2 h-5 w-5" /> Retake Interview
            </Button>
            <Button variant="outline" asChild className="h-12 flex-1 text-lg">
              <Link href="/dashboard"><Home className="mr-2 h-5 w-5" /> Back to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-6 h-[calc(100dvh-6rem)] md:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)] flex flex-col gap-6">

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">{interview.title}</h1>
          <p className="text-muted-foreground text-sm max-w-md line-clamp-1">{interview.description}</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="rounded-full shadow-lg shadow-destructive/20"
          onClick={handleEndInterview}
          disabled={isFinishing}
        >
          {isFinishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PhoneOff className="h-4 w-4 mr-2" />}
          End Interview
        </Button>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 min-h-0 overflow-hidden border-2 shadow-xl flex flex-col bg-card/50 backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent z-10" />

        <CardContent className="flex-1 p-0 relative overflow-hidden">

          <ScrollArea className="h-full px-4 md:px-6 py-6">
            <div className="space-y-8 max-w-3xl mx-auto pb-4">
              <AnimatePresence>
                {conversation.map((turn, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    key={index}
                    className={`flex gap-4 ${turn.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}
                  >
                    {turn.speaker === 'ai' && (
                      <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm mt-1">
                        <AvatarImage src="https://picsum.photos/seed/ai-avatar/200/200" />
                        <AvatarFallback><BrainCircuit className="h-5 w-5 text-primary" /></AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`p-5 rounded-2xl shadow-sm text-base leading-relaxed max-w-[80%] ${turn.speaker === 'ai'
                      ? 'bg-secondary/80 text-foreground rounded-tl-none border border-secondary'
                      : 'bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/20'
                      }`}>
                      {turn.text}
                    </div>

                    {turn.speaker === 'user' && (
                      <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm mt-1">
                        <AvatarImage src={user?.photoURL || ''} />
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-start"
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm mt-1">
                    <AvatarImage src="https://picsum.photos/seed/ai-avatar/200/200" />
                    <AvatarFallback><BrainCircuit className="h-5 w-5 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary/40 p-4 rounded-2xl rounded-tl-none border border-secondary/50 flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is thinking...
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
              {/* Spacer for bottom scrolling */}
              <div className="h-4" />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Input Area */}
        <div className="p-4 bg-background/50 border-t backdrop-blur-md">
          <div className="max-w-3xl mx-auto relative flex items-end gap-2">
            <Textarea
              placeholder="Type your answer here..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="resize-none min-h-[60px] max-h-[140px] pr-12 py-4 rounded-xl border-muted-foreground/20 focus-visible:ring-primary shadow-sm text-base"
              rows={2}
              disabled={isLoading}
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !userResponse.trim()}
              size="icon"
              className="absolute right-2 bottom-3 h-9 w-9 rounded-lg transition-all hover:scale-105 active:scale-95 bg-primary/90 hover:bg-primary shadow-md"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-muted-foreground">Press Enter to send</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
