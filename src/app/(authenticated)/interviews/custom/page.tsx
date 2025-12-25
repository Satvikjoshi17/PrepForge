'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneOff, Send, Loader2, Star, Award, RotateCcw, Home, Sparkles, User, BrainCircuit, AlertCircle, Briefcase, Settings2, Play } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from '@/components/ui/scroll-area';
import { conductMockInterviewAction, getInterviewFeedbackAction } from '@/app/actions';
import { useUser, useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type ConversationTurn = {
    speaker: 'ai' | 'user';
    text: string;
};

function CustomInterviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useUser();

    // Check if we have parameters to start the interview
    const hasJobTitle = searchParams.has('jobTitle');

    // -- Interview State --
    const jobTitle = searchParams.get('jobTitle') || 'Professional';
    const jobDescription = searchParams.get('jobDescription') || '';
    const interviewMode = (searchParams.get('interviewMode') || 'professional') as 'friendly' | 'professional' | 'technical' | 'behavioral' | 'stress';
    const experienceLevel = (searchParams.get('experienceLevel') || 'mid') as 'junior' | 'mid' | 'senior';

    const [userResponse, setUserResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversation, setConversation] = useState<ConversationTurn[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [feedbackData, setFeedbackData] = useState<{ score: number; summary: string; strengths?: string[]; weaknesses?: string[] } | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // -- Setup Form State --
    const [formData, setFormData] = useState({
        jobTitle: '',
        jobDescription: '',
        experienceLevel: 'mid',
        interviewMode: 'professional'
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const firestore = useFirestore();
    const { toast } = useToast();

    // Initialize interview if params exist
    useEffect(() => {
        if (hasJobTitle && !isInitialized) {
            const getInitialMessage = () => {
                if (interviewMode === 'friendly') return `Hi there! I'm looking forward to chatting about the ${jobTitle} role. To break the ice, could you tell me a bit about yourself?`;
                if (interviewMode === 'stress') return `We have a lot to cover for this ${jobTitle} position. Let's get straight to it. Walk me through your most complex technical challenge appropriately.`;
                return `Hello. I am the AI interviewer for the ${jobTitle} position. To begin, please briefly introduce yourself and your relevant experience.`;
            };

            setConversation([{ speaker: 'ai', text: getInitialMessage() }]);
            setIsInitialized(true);
        }
    }, [hasJobTitle, isInitialized, jobTitle, interviewMode]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation, isLoading]);

    // -- Setup Form Handler --
    const handleStartCustomInterview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.jobTitle.trim()) {
            toast({ variant: 'destructive', title: 'Job Title Required', description: 'Please enter a target job title.' });
            return;
        }

        const params = new URLSearchParams();
        params.set('jobTitle', formData.jobTitle);
        if (formData.jobDescription) params.set('jobDescription', formData.jobDescription);
        params.set('experienceLevel', formData.experienceLevel);
        params.set('interviewMode', formData.interviewMode);

        router.push(`/interviews/custom?${params.toString()}`);
    };

    // -- Chat Handlers --
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
                jobTitle: jobTitle,
                jobDescription: jobDescription,
                userResponse: userResponse,
                previousQuestions: previousQuestions,
                previousResponses: previousResponses,
                interviewMode: interviewMode,
                experienceLevel: experienceLevel,
            });

            setConversation(prev => [
                ...prev,
                { speaker: 'ai', text: aiResponse.question },
            ]);
        } catch (error: any) {
            console.error("Custom Interview Error:", error);
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
                jobDescription: jobDescription || `Standard ${jobTitle} role`,
                conversation: conversation,
            });

            const response = {
                userId: user?.uid,
                interviewId: 'custom-generated',
                interviewTitle: jobTitle,
                interviewMode,
                experienceLevel,
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
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save interview results.' });
        } finally {
            setIsFinishing(false);
        }
    };

    // -- Render: Feedback View --
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
                        <CardTitle className="text-3xl font-extrabold mt-6">{jobTitle} Feedback</CardTitle>
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
                            <Link href="/interviews"><Home className="mr-2 h-5 w-5" /> Back to Interviews</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        );
    }

    // -- Render: Setup Form View --
    if (!hasJobTitle) {
        return (
            <div className="container max-w-2xl mx-auto py-10">
                <Card className="border-none shadow-2xl glass">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                            <Settings2 className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-bold">Configure Interview</CardTitle>
                        <CardDescription className="text-lg">Set up your custom AI mock interview session.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleStartCustomInterview} className="space-y-8">

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="jobTitle" className="text-base font-semibold">Target Job Title</Label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="jobTitle"
                                            placeholder="e.g. Senior Frontend Developer"
                                            className="pl-9 h-11"
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="experienceLevel" className="text-base font-semibold">Experience Level</Label>
                                    <Select
                                        value={formData.experienceLevel}
                                        onValueChange={(val) => setFormData({ ...formData, experienceLevel: val })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                                            <SelectItem value="mid">Mid-Level (3-5 years)</SelectItem>
                                            <SelectItem value="senior">Senior (5+ years)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">Interview Mode</Label>
                                    <RadioGroup
                                        value={formData.interviewMode}
                                        onValueChange={(val) => setFormData({ ...formData, interviewMode: val })}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        <div>
                                            <RadioGroupItem value="professional" id="mode-pro" className="peer sr-only" />
                                            <Label
                                                htmlFor="mode-pro"
                                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                            >
                                                <Briefcase className="mb-2 h-6 w-6" />
                                                <div className="text-center">
                                                    <span className="font-semibold">Professional</span>
                                                    <p className="text-xs text-muted-foreground mt-1">Standard corporate style</p>
                                                </div>
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="friendly" id="mode-friendly" className="peer sr-only" />
                                            <Label
                                                htmlFor="mode-friendly"
                                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                            >
                                                <Sparkles className="mb-2 h-6 w-6" />
                                                <div className="text-center">
                                                    <span className="font-semibold">Casual</span>
                                                    <p className="text-xs text-muted-foreground mt-1">Chatty and relaxed</p>
                                                </div>
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="technical" id="mode-tech" className="peer sr-only" />
                                            <Label
                                                htmlFor="mode-tech"
                                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                            >
                                                <BrainCircuit className="mb-2 h-6 w-6" />
                                                <div className="text-center">
                                                    <span className="font-semibold">Technical</span>
                                                    <p className="text-xs text-muted-foreground mt-1">Deep dive into skills</p>
                                                </div>
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="stress" id="mode-stress" className="peer sr-only" />
                                            <Label
                                                htmlFor="mode-stress"
                                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                            >
                                                <AlertCircle className="mb-2 h-6 w-6" />
                                                <div className="text-center">
                                                    <span className="font-semibold">Stress Test</span>
                                                    <p className="text-xs text-muted-foreground mt-1">High pressure</p>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jobDesc" className="text-base font-semibold">Job Description (Optional)</Label>
                                    <Textarea
                                        id="jobDesc"
                                        placeholder="Paste the job description here for better context..."
                                        rows={4}
                                        value={formData.jobDescription}
                                        onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button type="submit" size="lg" className="w-full text-lg font-bold shadow-xl">
                                <Play className="mr-2 h-5 w-5" /> Start Interview
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // -- Render: Chat View --
    return (
        <div className="container max-w-5xl mx-auto py-6 h-[calc(100dvh-6rem)] flex flex-col gap-6">

            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/interviews/custom" className="hover:text-primary transition-colors">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                                {jobTitle}
                                <Settings2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </h1>
                        </Link>
                        <Badge variant="outline" className="uppercase text-[10px]">{interviewMode}</Badge>
                        <Badge variant="secondary" className="uppercase text-[10px]">{experienceLevel}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-md line-clamp-1">{jobDescription || 'Custom Mock Interview Session'}</p>
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
                    <ScrollArea className="h-full px-6 py-6">
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

export default function CustomInterviewPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <CustomInterviewContent />
        </Suspense>
    );
}
