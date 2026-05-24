import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Target, BarChart2, Wallet,
  Trophy, Megaphone, PlusCircle, Users, TrendingUp,
} from 'lucide-react';

const CREATOR_NAV = [
  { to: '/creator/dashboard',   icon: LayoutDashboard, label: 'Home'      },
  { to: '/creator/assigned',    icon: Target,          label: 'Campaigns' },
  { to: '/creator/analytics',   icon: BarChart2,       label: 'Analytics' },
  { to: '/creator/earnings',    icon: Wallet,          label: 'Earnings'  },
  { to: '/creator/leaderboard', icon: Trophy,          label: 'Ranks'     },
];

const BRAND_NAV = [
  { to: '/brand/dashboard',         icon: LayoutDashboard, label: 'Home'    },
  { to: '/brand/campaigns',         icon: Megaphone,       label: 'Campaigns'},
  { to: '/brand/campaigns/create',  icon: PlusCircle,      label: 'Create'  },
  { to: '/brand/analytics',         icon: BarChart2,       label: 'Analytics'},
];

const ADMIN_NAV = [
  { to: '/admin/dashboard',        icon: LayoutDashboard, label: 'Home'     },
  { to: '/admin/campaigns',        icon: Megaphone,       label: 'Campaigns'},
  { to: '/admin/users',            icon: Users,           label: 'Users'    },
  { to: '/admin/analytics',        icon: TrendingUp,      label: 'Analytics'},
];

export default function BottomNav() {
  const { user } = useAuth();
  if (!user) return null;

  const nav = user.role === 'creator' ? CREATOR_NAV
            : user.role === 'brand'   ? BRAND_NAV
            : ADMIN_NAV;

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation" role="navigation">
      <div className="bottom-nav-inner">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
                {isActive && <span className="bottom-nav-dot" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
