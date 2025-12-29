'use client';

import { useState } from 'react';

import { quizzes } from "@/lib/data";
import { useUser, useFirestore } from '@/firebase'; // Adding Firebase hooks
import { doc, setDoc, collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore'; // Adding Firestore functions
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Added Badge
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Layers, Zap, Brain, Sparkles, Flame, CheckCircle2, FileUp, Loader2, BookOpen, UploadCloud, FileText, AlignLeft } from "lucide-react";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Get unique categories
const CATEGORIES = ['All', ...Array.from(new Set(quizzes.map(q => q.category)))];
const DIFFICULTIES = ['Mixed', 'Easy', 'Medium', 'Hard'];
const TIMES = [
  { value: '15', label: 'Blitz (15s)' },
  { value: '30', label: 'Standard (30s)' },
  { value: '60', label: 'Relaxed (60s)' },
  { value: '120', label: 'Deep Work (2m)' },
];

export default function QuizzesPage() {
  const router = useRouter();


  // Builder State
  const [topic, setTopic] = useState('All');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [questionCount, setQuestionCount] = useState([5]);
  const [timeLimit, setTimeLimit] = useState('30');
  const [isHovering, setIsHovering] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sortByWeight, setSortByWeight] = useState(false); // New state for sorting

  const { user } = useUser();
  const firestore = useFirestore();
  const [generatedQuizzes, setGeneratedQuizzes] = useState<any[]>([]);
  const [quizHistory, setQuizHistory] = useState<Record<string, any>>({}); // Store latest result per quiz

  // Load generated quizzes and history
  useEffect(() => {
    if (!user || !firestore) return;

    const fetchData = async () => {
      try {
        // 1. Fetch Generated Quizzes
        const qRecs = query(collection(firestore, `users/${user.uid}/recs`));
        const snapRecs = await getDocs(qRecs);
        const genData = snapRecs.docs
          .map(d => d.data())
          .filter((doc: any) => doc.type === 'generated_quiz')
          .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        setGeneratedQuizzes(genData);

        // 2. Fetch Quiz History (Responses)
        const qHistory = query(collection(firestore, `users/${user.uid}/quizResponses`), orderBy('completedAt', 'desc'));
        const snapHistory = await getDocs(qHistory);

        const historyMap: Record<string, any> = {};
        snapHistory.forEach(doc => {
          const data = doc.data();
          const quizId = data.quizId;
          // Since we sort by desc, the first one we encounter is the latest
          if (!historyMap[quizId]) {
            historyMap[quizId] = {
              score: data.score,
              responseId: doc.id,
              completedAt: data.completedAt
            };
          }
        });
        setQuizHistory(historyMap);

      } catch (e) {
        console.error("Error fetching data", e);
      }
    };
    fetchData();
  }, [user, firestore]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    if (!user || !firestore) {
      alert('You must be logged in to generate quizzes.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('difficulty', difficulty);

    try {
      const response = await fetch('/api/quizzes/generate-from-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const quizData = await response.json();

      // Add timestamp and type
      quizData.createdAt = Timestamp.now();
      quizData.type = 'generated_quiz'; // Marker for filtering

      // Save to 'recs' collection in Firestore
      try {
        // Use the quiz ID as the document ID
        await setDoc(doc(firestore, 'users', user.uid, 'recs', quizData.id), quizData);
        setGeneratedQuizzes(prev => [quizData, ...prev]);
      } catch (saveError) {
        console.error("Failed to save quiz", saveError);
      }

      sessionStorage.setItem('generatedQuiz', JSON.stringify(quizData));
      router.push('/quizzes/generated');

    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error generating quiz. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartCustom = () => {
    const params = new URLSearchParams({
      topic,
      difficulty,
      count: questionCount[0].toString(),
      time: timeLimit,
    });
    router.push(`/quizzes/custom?${params.toString()}`);
  };

  return (
    <div className="space-y-12">
      {/* Hero / Header Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-purple-500 to-indigo-600 bg-clip-text text-transparent pb-2">
            Master Your Skills.
          </h1>
          <p className="text-xl text-muted-foreground">
            Challenge yourself with our premium quizzes designed to boost your technical knowledge.
          </p>
        </motion.div>
      </div>

      {/* Main Interface */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Builder (Sticky) */}
        <motion.div
          className="lg:col-span-5 lg:sticky lg:top-24 z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-2xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl ring-1 ring-white/20 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                Quick Play Generator
              </CardTitle>
              <CardDescription>
                Customize your perfect practice session in seconds.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">

              {/* Topic Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Select Topic
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTopic(cat)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border text-left flex items-center justify-between group/btn",
                        topic === cat
                          ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                          : "bg-secondary/50 hover:bg-secondary border-transparent hover:scale-[1.02]"
                      )}
                    >
                      {cat}
                      {topic === cat && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Brain className="h-4 w-4 text-orange-500" /> Difficulty
                  </Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="h-12 w-full rounded-xl bg-background/50 border-input/50 backdrop-blur-sm focus:ring-2 ring-primary/20">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" /> Time / Q
                  </Label>
                  <Select value={timeLimit} onValueChange={setTimeLimit}>
                    <SelectTrigger className="h-12 w-full rounded-xl bg-background/50 border-input/50 backdrop-blur-sm focus:ring-2 ring-primary/20">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Question Count Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" /> Question Count
                  </Label>
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-secondary text-primary">
                    {questionCount} Questions
                  </span>
                </div>
                <Slider
                  value={questionCount}
                  onValueChange={setQuestionCount}
                  max={20}
                  min={1}
                  step={1}
                  className="py-4"
                />
              </div>

            </CardContent>
            <CardFooter>
              <Button
                onClick={handleStartCustom}
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Start Custom Quiz <Zap className="ml-2 h-5 w-5 fill-current" />
              </Button>
            </CardFooter>
          </Card>

          {/* New Syllabus Upload Card */}
          {/* New Syllabus Upload Card */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />

              <Card className="relative border-none bg-background/90 backdrop-blur-xl h-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    <Sparkles className="h-6 w-6 text-blue-500" />
                    AI Quiz Generator
                  </CardTitle>
                  <CardDescription>
                    Create custom quizzes from your course materials.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Tabs defaultValue="pdf" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="pdf" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Upload PDF
                      </TabsTrigger>
                      <TabsTrigger value="text" className="flex items-center gap-2">
                        <AlignLeft className="h-4 w-4" /> Paste Text
                      </TabsTrigger>
                    </TabsList>

                    {/* PDF Upload Tab */}
                    <TabsContent value="pdf">
                      <div className="relative group/drop flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 hover:border-blue-500/50 rounded-xl bg-secondary/30 hover:bg-blue-500/5 transition-all cursor-pointer min-h-[250px]">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />

                        {isUploading ? (
                          <div className="flex flex-col items-center gap-3 py-2">
                            <div className="relative">
                              <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full animate-pulse" />
                              <Loader2 className="h-10 w-10 text-blue-500 animate-spin relative z-10" />
                            </div>
                            <span className="text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
                              Processing PDF Content...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-center py-2">
                            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover/drop:scale-110 transition-transform duration-300 ring-4 ring-blue-50 dark:ring-blue-900/10">
                              <UploadCloud className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground">
                                Drop PDF or Click to Upload
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Supports syllabus, notes (Max 10MB)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Text Input Tab */}
                    <TabsContent value="text">
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Paste your syllabus, notes, or topic description here..."
                          className="min-h-[200px] bg-secondary/30 resize-none border-muted-foreground/25 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all font-mono text-sm leading-relaxed"
                          id="text-input"
                        />
                        <Button
                          onClick={async () => {
                            const text = (document.getElementById('text-input') as HTMLTextAreaElement).value;
                            if (!text) return alert("Please enter some text.");

                            if (!user) return alert('You must be logged in.');

                            setIsUploading(true);
                            try {
                              const response = await fetch('/api/quizzes/generate-from-text', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  text,
                                  topic: topic === 'All' ? 'General' : topic,
                                  difficulty
                                }),
                              });

                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Failed to generate quiz');
                              }

                              const quizData = await response.json();
                              quizData.createdAt = Timestamp.now();
                              quizData.type = 'generated_quiz';

                              await setDoc(doc(firestore, 'users', user.uid, 'recs', quizData.id), quizData);
                              setGeneratedQuizzes(prev => [quizData, ...prev]);

                              sessionStorage.setItem('generatedQuiz', JSON.stringify(quizData));
                              router.push('/quizzes/generated');
                            } catch (e: any) {
                              console.error(e);
                              alert(e.message || "Error generating quiz");
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                          disabled={isUploading}
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-blue-500/20"
                        >
                          {isUploading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Text...</>
                          ) : (
                            <><Sparkles className="mr-2 h-5 w-5" /> Generate from Text</>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Featured Quizzes List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <h2 className="text-2xl font-bold tracking-tight">Featured Collections</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setSortByWeight(!sortByWeight)}
            >
              {sortByWeight ? "Reset Order" : "Sort by Weight"}
            </Button>
          </div>

          {/* User Generated Quizzes Section - Vertical List */}
          {generatedQuizzes.length > 0 && (
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 border border-blue-100 dark:border-blue-900/30">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Your Generated Quizzes
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {generatedQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    onClick={() => {
                      sessionStorage.setItem('generatedQuiz', JSON.stringify(quiz));
                      router.push('/quizzes/generated');
                    }}
                    className="group relative flex flex-col justify-between p-4 rounded-xl bg-background border border-border/50 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />

                    <div className="space-y-1 mb-3 relative z-10">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold line-clamp-1 group-hover:text-blue-600 transition-colors">{quiz.title}</h4>
                        <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          AI
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{quiz.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground relative z-10 w-full mt-2">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        {quiz.questions.length} Questions <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </span>

                      {/* History Check */}
                      {quizHistory[quiz.id] ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${quizHistory[quiz.id].score >= 80 ? 'text-green-600' :
                            quizHistory[quiz.id].score >= 60 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                            {Math.round(quizHistory[quiz.id].score)}%
                          </span>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/results/${quizHistory[quiz.id].responseId}?type=quiz`);
                          }}>
                            View Result
                          </Button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {quiz.createdAt ? new Date(quiz.createdAt.seconds * 1000).toLocaleDateString() : 'New'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <motion.div
            className="grid gap-6 sm:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, staggerChildren: 0.1 }}
          >
            {quizzes
              .sort((a, b) => {
                if (sortByWeight) {
                  // Calculate "Weight" based on difficulty
                  // Easy = 1, Medium = 2, Hard = 3
                  const getWeight = (q: any) => {
                    return q.questions.reduce((acc: number, curr: any) => {
                      if (curr.difficulty === 'Hard') return acc + 3;
                      if (curr.difficulty === 'Medium') return acc + 2;
                      return acc + 1;
                    }, 0);
                  };
                  return getWeight(b) - getWeight(a); // Descending (Hardest first)
                }
                return 0; // Default order
              })
              .map((quiz, i) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-card/50 hover:bg-card ring-1 ring-white/10 group">
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image
                        src={quiz.image}
                        alt={quiz.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        className="group-hover:scale-105 transition-transform duration-500"
                        data-ai-hint={quiz.imageHint}
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-xs font-medium text-white ring-1 ring-white/20">
                        {quiz.questions.length} Qs
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <p className="text-xs font-bold text-primary tracking-widest uppercase mb-1">{quiz.category}</p>
                      <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{quiz.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-xs">{quiz.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto pt-4 border-t border-border/50">
                      <Button asChild className="w-full" variant="secondary">
                        <Link href={`/quizzes/${quiz.id}`}>
                          Play Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
