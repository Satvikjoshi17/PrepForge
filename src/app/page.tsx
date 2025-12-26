'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BrainCircuit, Trophy, Zap, Code2, Users, FileText, Sparkles, Layout } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Button asChild size="sm" className="font-semibold shadow-lg shadow-primary/20">
              <Link href="/login">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 md:pt-32 pb-24 border-b bg-gradient-to-b from-background to-secondary/20">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 max-w-4xl"
              >
                <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
                  <Sparkles className="mr-2 h-4 w-4" />
                  The Ultimate AI Interview Coach
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                  Crack Your Next <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Tech Interview</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed">
                  Turn your syllabus into quizzes, practice with adaptive AI personas, and get instant feedback. Your personalized path to Hired starts here.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 min-w-[200px]"
              >
                <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105">
                  <Link href="/login">
                    Start Practicing Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>


            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32 relative">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter md:text-5xl">Everything You Need to Succeed</h2>
              <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
                Stop guessing. Start preparing with intelligent tools designed for modern tech stacks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: "Custom AI Personas",
                  description: "Choose your interviewer: Friendly HR, Strict Senior Dev, or Stress Test. Replicates real-world pressure.",
                  color: "bg-blue-500/10 text-blue-500"
                },
                {
                  icon: FileText,
                  title: "Syllabus to Success",
                  description: "Upload your course syllabus or resume. The AI generates tailored questions relevant to YOUR specific goals.",
                  color: "bg-purple-500/10 text-purple-500"
                },
                {
                  icon: Code2,
                  title: "Adaptive Quizzes",
                  description: "Dynamic quizzes that test React, Node.js, and more. The difficulty updates based on your strengths and weaknesses.",
                  color: "bg-green-500/10 text-green-500"
                },
                {
                  icon: Zap,
                  title: "Instant Feedback",
                  description: "Get detailed analysis on every answer. 'Here's what you said right, and here's how to improve.'",
                  color: "bg-yellow-500/10 text-yellow-500"
                },
                {
                  icon: Trophy,
                  title: "Gamified Progress",
                  description: "Track your 'Hired Score'. Watch your analytics grow as you master more topics.",
                  color: "bg-orange-500/10 text-orange-500"
                },
                {
                  icon: Layout,
                  title: "Distraction-Free Dashboard",
                  description: "A clean, modern workspace focused purely on your preparation. No clutter, just code.",
                  color: "bg-pink-500/10 text-pink-500"
                }

              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group flex flex-col p-8 bg-card rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 hover:border-primary/20"
                >
                  <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Ace the Interview?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">Join thousands of students and developers who are leveling up their careers with PrepForge.</p>
            <Button asChild size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold rounded-full shadow-2xl">
              <Link href="/login">Get Started for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <p className="text-sm text-muted-foreground mt-2">
              Empowering developers to reach their full potential.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2025 PrepForge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
