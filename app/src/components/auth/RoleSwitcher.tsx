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
        <div className="panel-raised mb-2 w-64 p-2">
          <p className="label px-2 py-1.5">Switch user (dev)</p>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => { setCurrentUser(u.id); setOpen(false); }}
              className={`flex items-center gap-2.5 w-full px-2 py-2 rounded-md text-left text-sm hover:bg-surface-hover ${u.id === currentUserId ? 'bg-surface-hover' : ''}`}
            >
              <Avatar name={u.name} color={u.avatarColor} size={24} />
              <span className="flex-1 text-text">{u.name}</span>
              {u.id === currentUserId && <span className="badge-primary">Active</span>}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="panel-raised flex items-center gap-2 px-3 h-10 rounded-full hover:bg-surface-hover"
        aria-expanded={open}
      >
        <UserCog size={16} className="text-primary" />
        <span className="text-sm text-text">{current.name}</span>
        <ChevronUp size={14} className={`text-text-dim transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
}
