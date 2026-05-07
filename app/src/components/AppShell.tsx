import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Sparkles } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { Avatar } from './ui/Avatar';
import { RoleSwitcher } from './auth/RoleSwitcher';
import { Toaster } from './ui/Toaster';
import { ThemeToggle } from './ui/ThemeToggle';
import { SkipLink } from './ui/SkipLink';
import { LiveRegion } from './ui/LiveRegion';

export function AppShell() {
  const users = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const navigate = useNavigate();
  const me = users.find((u) => u.id === currentUserId);

  return (
    <div className="min-h-full flex flex-col">
      <SkipLink />
      <header className="sticky top-0 z-30 backdrop-blur bg-surface/70 border-b border-surface-border">
        <div className="mx-auto max-w-[1400px] px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="flex items-center gap-2" aria-label="Retroflow home">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/15 border border-primary/40" aria-hidden="true">
              <Sparkles size={14} className="text-primary" />
            </span>
            <span className="font-semibold tracking-tight">Retroflow</span>
            <span className="badge-neutral ml-1">MVP</span>
          </button>
          <div className="flex-1" />
          {me && (
            <div className="flex items-center gap-2.5 panel-raised pl-1.5 pr-3 h-9">
              <Avatar name={me.name} color={me.avatarColor} size={24} />
              <span className="text-sm">{me.name}</span>
            </div>
          )}
          <ThemeToggle />
          <button
            onClick={() => { setCurrentUser(null); navigate('/login'); }}
            className="btn-ghost"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <RoleSwitcher />
      <Toaster />
      <LiveRegion />
    </div>
  );
}
