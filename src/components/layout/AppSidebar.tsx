'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardCheck,
  MessageSquare,
} from 'lucide-react';

export const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/quizzes', icon: ClipboardCheck, label: 'Quizzes' },
  { href: '/interviews', icon: MessageSquare, label: 'Interviews' },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Link href={item.href}>
                <item.icon className={cn('mr-3 h-5 w-5')} />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
      </div>
    </aside>
  );
}
