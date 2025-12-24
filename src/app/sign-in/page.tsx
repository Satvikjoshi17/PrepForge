'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is a compatibility redirect.
// The new auth page is at /login
export default function SignInRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
