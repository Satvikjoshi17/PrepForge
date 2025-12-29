'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Quiz, QuizResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Loader2,
  Timer,
  RotateCcw,
  Home,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type QuizClientProps = {
  quiz: Quiz;
  timePerQuestion?: number;
  customParams?: {
    topic: string;
    difficulty: string;
    count: number;
    time: number;
  };
};

export default function QuizClient({ quiz, timePerQuestion = 30, customParams }: QuizClientProps) {
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">No Questions Available</h2>
        <p className="text-muted-foreground">This quiz has no questions associated with it.</p>
        <Button asChild variant="outline">
          <Link href="/quizzes">Back to Quizzes</Link>
        </Button>
      </div>
    );
  }

  // --- New State for Modes ---
  const [hasStarted, setHasStarted] = useState(false);
  const [quizMode, setQuizMode] = useState<'test' | 'practice'>('test');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false); // For practice mode

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Start Quiz Handler
  const startQuiz = (mode: 'test' | 'practice') => {
    setQuizMode(mode);
    setHasStarted(true);
    setTimeLeft(timePerQuestion);
  };

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);

      // Reset state for next question
      setTimeLeft(timePerQuestion);
      setIsTimeUp(false);
      setShowExplanation(false);
      setIsAnswerChecked(false);
    } else {
      setShowResults(true);
    }
  }, [currentQuestionIndex, quiz.questions.length, timePerQuestion]);

  const handleCheckAnswer = () => {
    if (!selectedAnswers[currentQuestion.id]) return;
    setIsAnswerChecked(true);
    setShowExplanation(true);
    setIsTimeUp(true); // Stop timer effectively
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      // Reset state or restore? For simplicity in practice mode, we reset.
      setIsTimeUp(false);
      // In practice mode, if going back, we might want to see the answer again if already answered?
      // For now, simple reset to allow navigation.
      setTimeLeft(timePerQuestion);
      setShowExplanation(false);
      setIsAnswerChecked(false);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setTimeLeft(timePerQuestion);
    setIsTimeUp(false);
    setShowExplanation(false);
    setIsAnswerChecked(false);
  };

  useEffect(() => {
    if (!hasStarted || showResults || isSubmitting) return; // Don't run timer if not started

    // In Practice Mode, stop timer if answer is checked
    if (quizMode === 'practice' && isAnswerChecked) return;

    if (timeLeft <= 0) {
      if (!selectedAnswers[currentQuestion.id]) {
        setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: 'TIME_EXPIRED' }));
      }
      setIsTimeUp(true);

      // Auto-advance logic varies by mode
      if (quizMode === 'test') {
        const timer = setTimeout(() => handleNext(), 1500);
        return () => clearTimeout(timer);
      }
      // In practice mode, maybe just show explanation or stop?
      // Let's stop and let user click Next.
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, showResults, isSubmitting, currentQuestion.id, selectedAnswers, handleNext, hasStarted, quizMode, isAnswerChecked]);

  const handleSelectAnswer = (option: string) => {
    if (isTimeUp || (quizMode === 'practice' && isAnswerChecked)) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleSubmit = async () => { /* ... existing handleSubmit logic ... */
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'You must be logged in to submit a quiz.' });
      return;
    }

    setIsSubmitting(true);

    let score = 0;
    const answers = quiz.questions.map(q => {
      const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
      if (isCorrect) score++;
      return {
        questionId: q.id,
        selected: selectedAnswers[q.id] || '',
        correct: q.correctAnswer,
        isCorrect: isCorrect,
        topic: q.topic || 'General',
      };
    });

    const quizResponse: Omit<QuizResponse, 'id' | 'completedAt'> & { completedAt: any } = {
      userId: user.uid,
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: (score / quiz.questions.length) * 100,
      totalQuestions: quiz.questions.length,
      answers,
      completedAt: serverTimestamp(),
      quizCategory: quiz.category,
      ...(customParams && { customParams }),
    };

    try {
      const responsesCollection = collection(firestore, `users/${user.uid}/quizResponses`);
      const docRef = await addDocumentNonBlocking(responsesCollection, quizResponse);
      toast({ title: 'Quiz submitted!', description: 'Your results have been saved.' });
      if (docRef) {
        router.push(`/results/${docRef.id}?type=quiz`);
      } else {
        throw new Error('Failed to get document reference');
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({ variant: 'destructive', title: 'Submission failed', description: 'Could not save your results. Please try again.' });
      setIsSubmitting(false);
    }
  };

  // --- Mode Selection View ---
  if (!hasStarted && !showResults) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-center"
        >
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {quiz.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose how you want to take this quiz.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
            <Card
              className="group cursor-pointer hover:border-primary transition-all hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden"
              onClick={() => startQuiz('test')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <Timer className="h-6 w-6" />
                  </div>
                  Test Mode
                </CardTitle>
                <CardDescription className="text-left pt-2 text-base">
                  Simulate a real exam environment.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-left space-y-2 text-sm text-muted-foreground">
                <p>• Timer enabled per question</p>
                <p>• No immediate feedback</p>
                <p>• Detailed review at the end</p>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer hover:border-green-500 transition-all hover:shadow-xl hover:shadow-green-500/10 relative overflow-hidden"
              onClick={() => startQuiz('practice')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
                    <Check className="h-6 w-6" />
                  </div>
                  Practice Mode
                </CardTitle>
                <CardDescription className="text-left pt-2 text-base">
                  Learn as you go with instant explanations.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-left space-y-2 text-sm text-muted-foreground">
                <p>• Immediate answer feedback</p>
                <p>• Explanations for every question</p>
                <p>• Learn from mistakes instantly</p>
              </CardContent>
            </Card>
          </div>

          <Button variant="ghost" asChild className="mt-8">
            <Link href="/quizzes">Cancel & Go Back</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // --- Results View (Existing) ---
  if (showResults) {
    // ... (Keep existing results view, but we'll inline it to be safe or just minimal changes)
    // Since I have to replace the whole file content to be clean or use replace_file_content carefully.
    // To avoid massive duplication in prompt, I will assume the user wants me to KEEP the results view logic basically same.
    // But strictly, replace_file_content replaces a chunk. I'll use the "StartLine: 57" approach to replace the component body.

    let score = 0;
    quiz.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) score++;
    })

    const scorePercentage = (score / quiz.questions.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto space-y-6 pb-12"
      >
        {/* ... Same Card Code ... */}
        <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-xl">
          <CardHeader className="text-center pb-8 border-b bg-card/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
            >
              <CardTitle className="text-4xl font-extrabold mb-2">Quiz Completed!</CardTitle>
              <div className="flex justify-center items-center gap-4 mt-4">
                <div className="text-5xl font-black text-primary">{Math.round(scorePercentage)}%</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Score</p>
                  <p className="text-lg font-bold">{score} / {quiz.questions.length} Correct</p>
                </div>
              </div>
            </motion.div>
          </CardHeader>
          <CardContent className="pt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Review Your Answers
            </h3>
            <div className="space-y-6">
              {quiz.questions.map((q, i) => {
                const userChoice = selectedAnswers[q.id];
                const isCorrect = userChoice === q.correctAnswer;
                const isTimedOut = userChoice === 'TIME_EXPIRED';

                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "p-5 border rounded-xl transition-all shadow-sm",
                      isCorrect
                        ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20'
                        : isTimedOut
                          ? 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20'
                          : 'border-red-500/30 bg-red-50/50 dark:bg-red-950/20'
                    )}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-semibold text-lg flex-1 leading-snug">
                        <span className="text-muted-foreground mr-2">{i + 1}.</span>
                        {q.text}
                      </p>
                      {isCorrect ? (
                        <Check className="h-6 w-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="h-6 w-6 text-red-600 flex-shrink-0" />
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-background/60 border border-white/10">
                        <span className="text-muted-foreground block mb-1 font-medium">Your Answer:</span>
                        <span className={cn("font-bold", isCorrect ? 'text-green-600' : 'text-red-600')}>
                          {isTimedOut ? '⏳ Time expired' : (userChoice || 'Not answered')}
                        </span>
                      </div>
                      {!isCorrect && q.correctAnswer && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <span className="text-muted-foreground block mb-1 font-medium">Correct Answer:</span>
                          <span className="text-green-600 font-bold">{q.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                    {/* Review Explanation */}
                    {q.explanation && (
                      <div className="mt-3 p-3 text-sm text-muted-foreground bg-background/50 rounded-lg">
                        <span className="font-semibold block mb-1">Explanation:</span>
                        {q.explanation}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 pt-8 bg-card/30">
            <Button onClick={handleSubmit} className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Results...</>
              ) : (
                "Save & View Detailed Results"
              )}
            </Button>
            <Button variant="outline" className="w-full h-12 text-lg" asChild>
              <Link href="/dashboard"><Home className="mr-2 h-5 w-5" /> Back to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  // --- Quiz Taking View ---
  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{quiz.title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span>{quiz.category}</span>
            <span>•</span>
            <span className="uppercase text-xs tracking-wider bg-secondary px-2 py-0.5 rounded">{quizMode === 'test' ? 'Test Mode' : 'Practice Mode'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-bold border transition-colors",
            timeLeft < 10 ? 'bg-red-500/10 border-red-500/50 text-red-600 animate-pulse' : 'bg-secondary border-transparent'
          )}>
            <Timer className="h-5 w-5" />
            <span className="tabular-nums">{timeLeft}s</span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="font-semibold text-muted-foreground hover:text-destructive">End Quiz</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to end the quiz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your current progress will be lost. You can't undo this action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Going</AlertDialogCancel>
                <AlertDialogAction onClick={() => setShowResults(true)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  End Quiz
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden shadow-2xl border-none ring-1 ring-white/10 glass">
            <Progress value={progress} className="h-2 rounded-none bg-secondary" />
            <CardHeader className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 text-xs uppercase tracking-widest font-black h-8">
                        <LayoutGrid className="h-3 w-3" />
                        Q {currentQuestionIndex + 1} / {quiz.questions.length}
                      </Button>
                    </PopoverTrigger>
                    {/* ... (Keep existing PopoverContent logic) ... */}
                    <PopoverContent className="w-80 p-4" align="start">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">Question Map</h4>
                          <p className="text-sm text-muted-foreground">Jump to any question instantly.</p>
                        </div>
                        <ScrollArea className="h-[200px] rounded-md border p-2">
                          <div className="grid grid-cols-5 gap-2">
                            {quiz.questions.map((_, i) => {
                              const isAnswered = !!selectedAnswers[quiz.questions[i].id];
                              const isCurrent = currentQuestionIndex === i;
                              // In practice mode, maybe show color for correct/incorrect if answered?
                              // For now, keep simple.
                              return (
                                <Button
                                  key={i}
                                  variant={isCurrent ? "default" : isAnswered ? "secondary" : "ghost"}
                                  size="sm"
                                  className={cn(
                                    "h-8 w-8 p-0 font-medium",
                                    isCurrent && "ring-2 ring-primary ring-offset-2",
                                    isAnswered && !isCurrent && "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                  )}
                                  onClick={() => handleJumpToQuestion(i)}
                                >
                                  {i + 1}
                                </Button>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    </PopoverContent>

                  </Popover>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <CardTitle className="text-2xl font-bold leading-tight text-foreground/90">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswers[currentQuestion.id] === option;
                const isCorrectOption = option === currentQuestion.correctAnswer;
                const showValidation = (quizMode === 'practice' && isAnswerChecked) || (showResults);
                // Wait, showResults is handled above. This is quiz taking view.
                // So showValidation is only for practice mode AND checked.

                let variantStyle = 'outline';
                let extraClasses = 'bg-card hover:bg-secondary/50 hover:text-primary hover:border-primary/30 border-white/10 transition-colors';

                if (isSelected) {
                  variantStyle = 'secondary';
                  extraClasses = 'bg-primary/10 border-primary ring-1 ring-primary text-primary';
                }

                // Practice Mode Validation Styles
                if (quizMode === 'practice' && isAnswerChecked) {
                  if (isSelected && isCorrectOption) {
                    extraClasses = 'bg-green-500/20 border-green-500 ring-1 ring-green-500 text-green-700 dark:text-green-300';
                  } else if (isSelected && !isCorrectOption) {
                    extraClasses = 'bg-red-500/20 border-red-500 ring-1 ring-red-500 text-red-700 dark:text-red-300';
                  } else if (isCorrectOption) {
                    extraClasses = 'bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400';
                  } else {
                    extraClasses = 'opacity-50';
                  }
                }

                return (
                  <Button
                    key={option}
                    variant={variantStyle as any} // Cast because we are using custom classes mainly
                    className={cn(
                      "w-full justify-start h-auto py-4 px-6 text-left text-lg font-medium transition-all duration-300",
                      extraClasses,
                      !showValidation && "hover:-translate-y-0.5 active:translate-y-0",
                      isTimeUp && !isSelected && !showValidation && 'opacity-50 grayscale'
                    )}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={isTimeUp || (quizMode === 'practice' && isAnswerChecked)}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors shrink-0",
                        isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30',
                        (quizMode === 'practice' && isAnswerChecked && isCorrectOption) && 'border-green-500 bg-green-500 text-white',
                        (quizMode === 'practice' && isAnswerChecked && isSelected && !isCorrectOption) && 'border-red-500 bg-red-500 text-white'
                      )}>
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                      <span className="flex-1">{option}</span>
                      {quizMode === 'practice' && isAnswerChecked && isCorrectOption && (
                        <Check className="h-5 w-5 text-green-600 animate-in zoom-in" />
                      )}
                      {quizMode === 'practice' && isAnswerChecked && isSelected && !isCorrectOption && (
                        <X className="h-5 w-5 text-red-600 animate-in zoom-in" />
                      )}
                    </div>
                  </Button>
                );
              })}

              {/* Practice Mode Explanation Box */}
              {quizMode === 'practice' && isAnswerChecked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 text-sm leading-relaxed"
                >
                  <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 mb-2">
                    <div className="p-1 rounded bg-blue-100 dark:bg-blue-800">💡</div>
                    Explanation
                  </div>
                  <p className="text-foreground/80">
                    {currentQuestion.explanation || "No explanation provided for this question."}
                  </p>
                </motion.div>
              )}

            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center mt-8">
        <div className="flex items-center gap-2">
          {/* Previous Button logic: Keep enabled but maybe reset check state if going back? */}
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="h-12 w-12 rounded-xl border-2 hover:bg-secondary hover:text-primary transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-sm font-medium text-muted-foreground hidden sm:block">
            {isTimeUp && quizMode === 'test' ? (
              <span className="text-red-500 flex items-center gap-2">
                <Timer className="h-4 w-4" /> Time's up!
              </span>
            ) : (
              <span>{quizMode === 'practice' ? 'Take your time to learn' : 'Pick best answer'}</span>
            )}
          </div>
        </div>

        {/* Action Button: Check Answer OR Next Question */}
        {quizMode === 'practice' && !isAnswerChecked ? (
          <Button
            onClick={handleCheckAnswer}
            disabled={!selectedAnswers[currentQuestion.id]}
            size="lg"
            className="h-12 px-8 font-bold shadow-lg shadow-primary/10"
          >
            Check Answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            // In test mode: disabled if no answer? OR allow skip? (Code was: disabled={!selectedAnswers...})
            // In practice mode (after check): Always enabled to go next.
            disabled={quizMode === 'test' ? (!selectedAnswers[currentQuestion.id] || isTimeUp) : false}
            size="lg"
            className="h-12 px-8 font-bold shadow-lg shadow-primary/10 group"
          >
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <>Next Question <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></>
            ) : (
              'Finish Quiz'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}