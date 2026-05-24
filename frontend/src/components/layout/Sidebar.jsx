import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui';
import {
  LayoutDashboard, Megaphone, Users, BarChart2,
  Trophy, PlusCircle, LogOut, TrendingUp, Wallet,
  Target, UserCheck, Settings, X,
} from 'lucide-react';

const CREATOR_NAV = [
  { to: '/creator/dashboard',   icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/creator/assigned',    icon: Target,          label: 'My Campaigns' },
  { to: '/creator/analytics',   icon: BarChart2,       label: 'Analytics'    },
  { to: '/creator/earnings',    icon: Wallet,          label: 'Earnings'     },
  { to: '/creator/leaderboard', icon: Trophy,          label: 'Leaderboard'  },
  { to: '/creator/profile',     icon: Settings,        label: 'Profile'      },
];

const BRAND_NAV = [
  { to: '/brand/dashboard',         icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/brand/campaigns/create',  icon: PlusCircle,      label: 'New Campaign' },
  { to: '/brand/campaigns',         icon: Megaphone,       label: 'My Campaigns' },
  { to: '/brand/analytics',         icon: BarChart2,       label: 'Analytics'    },
];

const ADMIN_NAV = [
  { to: '/admin/dashboard',         icon: LayoutDashboard, label: 'Dashboard'         },
  { to: '/admin/campaigns',         icon: Megaphone,       label: 'Campaigns'         },
  { to: '/admin/users',             icon: Users,           label: 'Users'             },
  { to: '/admin/analytics',         icon: TrendingUp,      label: 'Analytics'         },
  { to: '/admin/creator-approval',  icon: UserCheck,       label: 'Creator Approvals' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const nav = user?.role === 'creator' ? CREATOR_NAV
            : user?.role === 'brand'   ? BRAND_NAV
            : ADMIN_NAV;

  const roleColor = user?.role === 'admin'   ? 'var(--gold)'
                  : user?.role === 'brand'   ? 'var(--acc)'
                  : 'var(--p2)';

  const roleLabel = user?.role === 'admin'   ? 'Control Center'
                  : user?.role === 'brand'   ? 'Brand Portal'
                  : 'Creator Studio';

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  return (
    <nav
      className={`sidebar${isOpen ? ' open' : ''}`}
      aria-label="Sidebar navigation"
      role="navigation"
    >
      {/* ── Logo ──────────────────────────────────────── */}
      <div className="sidebar-logo" style={{
        padding: '16px 14px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,var(--p),var(--acc))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>⚡</div>
          <div className="sidebar-logo-text">
            <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: 15, color: 'var(--t1)', lineHeight: 1 }}>
              Creatokite
            </div>
            <div className="sidebar-role-badge" style={{
              fontSize: 9, color: roleColor, marginTop: 2,
              textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="btn btn-ghost btn-icon show-mobile"
          aria-label="Close sidebar"
          style={{ marginLeft: 'auto' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <div style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={15} aria-hidden="true" />
            <span className="nav-item-label">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* ── User Card ─────────────────────────────────── */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div className="sidebar-user" style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: 8,
          borderRadius: 'var(--r)', background: 'rgba(255,255,255,0.03)', marginBottom: 6,
        }}>
          <Avatar src={user?.avatar} name={user?.displayName} size={30} />
          <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: 'var(--t1)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.displayName}
            </div>
            <div style={{
              fontSize: 10, color: 'var(--t3)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm w-full"
          style={{ justifyContent: 'flex-start', color: 'var(--rose)' }}
        >
          <LogOut size={13} aria-hidden="true" />
          <span className="nav-item-label">Logout</span>
        </button>
      </div>
    </nav>
  );
}
