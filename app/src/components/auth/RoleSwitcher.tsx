import { useState } from 'react';
import { ChevronUp, UserCog } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Avatar } from '../ui/Avatar';

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const users = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const current = users.find((u) => u.id === currentUserId);

  if (!current) return null;
  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <ul role="menu" aria-label="Switch user" className="panel-raised mb-2 w-64 p-2 list-none m-0">
          <li role="presentation">
            <p className="label px-2 py-1.5" aria-hidden="true">Switch user (dev)</p>
          </li>
          {users.map((u) => (
            <li key={u.id} role="presentation">
              <button
                role="menuitemradio"
                aria-checked={u.id === currentUserId}
                onClick={() => { setCurrentUser(u.id); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-2 py-2 rounded-md text-left text-sm hover:bg-surface-hover ${u.id === currentUserId ? 'bg-surface-hover' : ''}`}
              >
                <Avatar name={u.name} color={u.avatarColor} size={24} />
                <span className="flex-1 text-text">{u.name}</span>
                {u.id === currentUserId && <span className="badge-primary">Active</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="panel-raised flex items-center gap-2 px-3 h-10 rounded-full hover:bg-surface-hover"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Switch user. Currently signed in as ${current.name}.`}
      >
        <UserCog size={16} className="text-primary" aria-hidden="true" />
        <span className="text-sm text-text">{current.name}</span>
        <ChevronUp size={14} className={`text-text-dim transition-transform ${open ? '' : 'rotate-180'}`} aria-hidden="true" />
      </button>
    </div>
  );
}
