import { NavLink } from 'react-router-dom';
import { Home, ArrowDownToLine, ArrowUpFromLine, User } from 'lucide-react';

const items = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/depot', icon: ArrowDownToLine, label: 'Dépôt' },
  { to: '/retrait', icon: ArrowUpFromLine, label: 'Retrait' },
  { to: '/compte', icon: User, label: 'Compte' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-bg/95 backdrop-blur border-t border-zinc-900 z-30">
      <ul className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 h-16 transition-colors ${
                  isActive ? 'text-gold' : 'text-zinc-400'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
