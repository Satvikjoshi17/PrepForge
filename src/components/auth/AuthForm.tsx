'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().optional(),
});

export function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>('signin');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { user, isUserLoading } = useUser();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isLoading && !isGoogleLoading && !isUserLoading) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.replace(redirectUrl);
    }
  }, [user, isLoading, isGoogleLoading, isUserLoading, router, searchParams]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (mode !== 'forgot-password' && (!values.password || values.password.length < 6)) {
      form.setError('password', { message: 'Password must be at least 6 characters.' });
      return;
    }
    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password!);
        const user = userCredential.user;
        const userDocRef = doc(firestore, 'users', user.uid);

        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          name: user.email?.split('@')[0] || 'New User',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password!);
      }
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.replace(redirectUrl);
    } catch (error) {
      let title = 'Authentication Failed';
      let description = 'An unexpected error occurred. Please try again.';

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            title = 'Sign-up Failed';
            description = 'An account with this email already exists. Please sign in.';
            break;
          case 'auth/wrong-password':
          case 'auth/user-not-found':
          case 'auth/invalid-email':
          case 'auth/invalid-credential':
            title = 'Sign-in Failed';
            description = 'Invalid email or password. Please check your credentials and try again.';
            break;
          case 'auth/weak-password':
            title = 'Sign-up Failed';
            description = 'The password is too weak. Please use at least 6 characters.';
            break;
          default:
            description = error.message;
            break;
        }
      }

      toast({
        variant: 'destructive',
        title: title,
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetPassword(values: { email: string }) {
    setIsLoading(true);
    try {
      const email = values.email.trim();
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Reset Email Sent',
        description: `A password reset link has been sent to ${email}. Please check your inbox and spam folder.`,
      });
      setMode('signin');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result) {
        const user = result.user;
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
        const redirectUrl = searchParams.get('redirect') || '/dashboard';
        router.replace(redirectUrl);
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: 'destructive',
          title: 'Google Sign-In Failed',
          description: error.message,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const toggleMode = (newMode: 'signin' | 'signup' | 'forgot-password') => {
    setMode(newMode);
    // form.reset(); // Removed to preserve email input between modes
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="w-full max-w-md border-black/5 bg-white/70 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[1px]">
        <CardHeader className="items-center text-center space-y-2 pb-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Logo className="mb-2" />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
                {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Join PrepForge' : 'Reset Password'}
              </CardTitle>
              <CardDescription className="text-slate-600 font-medium">
                {mode === 'signin' ? 'Sign in to your account' : mode === 'signup' ? 'Create a new account' : 'We\'ll send you a link to reset your password'}
              </CardDescription>
            </motion.div>
          </AnimatePresence>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <AnimatePresence mode="wait">
            {mode !== 'forgot-password' && (
              <motion.div
                key="social-auth"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <Button
                  variant="outline"
                  className="w-full bg-white hover:bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-900 transition-all duration-300 transform hover:-translate-y-0.5 font-semibold h-11 flex items-center justify-center gap-3 active:scale-[0.98] shadow-sm hover:text-slate-900 "
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="bg-white p-1.5 rounded-sm border border-slate-100 shadow-sm flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                      </svg>
                    </div>
                  )}
                  <span className="text-sm">Sign in with Google</span>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-transparent px-2">
                    OR CONTINUE WITH
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(mode === 'forgot-password' ? onResetPassword : onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Email</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                        <Input
                          placeholder="name@example.com"
                          {...field}
                          disabled={isLoading || isGoogleLoading}
                          className="bg-white border-slate-300 pl-10 h-11 focus:bg-white focus:border-primary/50 transition-all rounded-xl placeholder:text-slate-400 text-slate-900"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              {mode !== 'forgot-password' && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</FormLabel>
                        {mode === 'signin' && (
                          <button
                            type="button"
                            onClick={() => toggleMode('forgot-password')}
                            className="text-[10px] font-bold uppercase tracking-wider text-primary/80 hover:text-primary transition-colors hover:underline underline-offset-4"
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={isLoading || isGoogleLoading}
                            className="bg-white border-slate-300 pl-10 h-11 focus:bg-white focus:border-primary/50 transition-all rounded-xl placeholder:text-slate-400 text-slate-900"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              )}
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 font-bold rounded-xl"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading && !isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : mode === 'signup' ? (
                  'Create Account'
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-center pt-2 pb-6">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            {mode === 'signin' ? (
              <>
                New to PrepForge?
                <button
                  onClick={() => toggleMode('signup')}
                  className="font-bold text-slate-700 hover:text-slate-900 transition-colors hover:underline underline-offset-4"
                >
                  Create account
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                Already have an account?
                <button
                  onClick={() => toggleMode('signin')}
                  className="font-bold text-slate-700 hover:text-slate-900 transition-colors hover:underline underline-offset-4"
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                onClick={() => toggleMode('signin')}
                className="flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 transition-colors group"
              >
                <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                Back to Sign In
              </button>
            )}
          </div>
        </CardFooter>
      </Card>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors opacity-70 hover:opacity-100 group px-4 py-2 rounded-full hover:bg-white/40"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>
    </motion.div>
  );
}
