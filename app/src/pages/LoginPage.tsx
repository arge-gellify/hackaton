import { useNavigate } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { Avatar } from '../components/ui/Avatar';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ROLE_LABEL } from '../domain/permissions';

export function LoginPage() {
  const users = useAppStore((s) => s.users);
  const projects = useAppStore((s) => s.projects);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const navigate = useNavigate();

  const primary = projects[0];

  const sign = (id: string) => {
    setCurrentUser(id);
    navigate('/projects');
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md panel p-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-primary" aria-hidden="true" />
          <span className="label">Retroflow</span>
        </div>
        <h1 className="text-xl font-semibold text-text mb-1">Welcome back</h1>
        <p className="text-sm text-text-muted mb-6">
          Choose a seeded user to sign in. Roles below reflect membership in <strong className="text-text">{primary?.name}</strong>.
        </p>

        <ul className="flex flex-col gap-2 list-none p-0" aria-label="Seeded users">
          {users.map((u) => {
            const role = primary?.members.find((m) => m.userId === u.id)?.role;
            const roleLabel = role ? ROLE_LABEL[role] : 'Not a member';
            return (
              <li key={u.id}>
                <button
                  onClick={() => sign(u.id)}
                  className="group w-full flex items-center gap-3 p-3 rounded-lg border border-surface-border bg-surface-raised hover:bg-surface-hover hover:border-primary/40 transition-colors"
                  aria-label={`Sign in as ${u.name} (${roleLabel})`}
                >
                  <Avatar name={u.name} color={u.avatarColor} size={36} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-text">{u.name}</div>
                    <div className="text-xs text-text-muted">{roleLabel}</div>
                  </div>
                  <LogIn size={16} className="text-text-dim group-hover:text-primary" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-text-dim mt-6 text-center">
          Mock auth — no password required. Use the role switcher in the corner to swap mid-demo.
        </p>
      </div>
    </div>
  );
}
