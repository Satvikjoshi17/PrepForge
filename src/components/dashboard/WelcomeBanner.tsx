'use client';

import { useUser } from "@/firebase";
import type { User } from 'firebase/auth';

export default function WelcomeBanner() {
  const { user } = useUser();

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Welcome back, {user?.displayName || 'User'}!
      </h1>
      <p className="text-muted-foreground">
        Let's get you ready for your next interview.
      </p>
    </div>
  );
}
