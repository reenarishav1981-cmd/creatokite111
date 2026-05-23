import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usersAPI } from '../../api';
import { Avatar } from '../ui';

const PAGE_TITLE = {
  '/creator/dashboard':  'Dashboard',
  '/creator/assigned':   'My Campaigns',
  '/creator/analytics':  'Analytics',
  '/creator/earnings':   'Earnings',
  '/creator/leaderboard':'Leaderboard',
  '/creator/profile':    'Profile',
  '/brand/dashboard':    'Dashboard',
  '/brand/campaigns/create': 'New Campaign',
  '/brand/campaigns':    'My Campaigns',
  '/brand/analytics':    'Analytics',
  '/admin/dashboard':    'Dashboard',
  '/admin/campaigns':    'Campaigns',
  '/admin/users':        'Users',
  '/admin/analytics':    'Analytics',
  '/admin/creator-approval': 'Creator Approvals',
};

export default function Header({ onMenuToggle, sidebarOpen }) {
  const { user }              = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate              = useNavigate();
  const location              = useLocation();
  const [notifs,   setNotifs]   = useState([]);
  const [unread,   setUnread]   = useState(0);
  const [showN,    setShowN]    = useState(false);
  const [showUser, setShowUser] = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);

  const title = PAGE_TITLE[location.pathname] || 'Creatokite';

  useEffect(() => {
    usersAPI.notifications()
      .then(d => { setNotifs(d.notifications || []); setUnread(d.unread || 0); })
      .catch(() => {});
  }, [location.pathname]);

  /* Close dropdowns when clicking outside */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowN(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const openNotifs = async () => {
    setShowN(v => !v);
    setShowUser(false);
    if (unread > 0) {
      await usersAPI.readNotifs().catch(() => {});
      setUnread(0);
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const goProfile = () => {
    setShowUser(false);
    if (user?.role === 'creator') navigate('/creator/profile');
  };

  return (
    <header className="top-header glass-header" role="banner">
      {/* Hamburger */}
      <button
        className={`hamburger header-menu-toggle${sidebarOpen ? ' open' : ''}`}
        onClick={onMenuToggle}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={sidebarOpen}
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <span className="header-title" style={{
        fontFamily: 'var(--fd)',
        fontWeight: 700,
        fontSize: 'clamp(13px,3.5vw,15px)',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {title}
      </span>

      {/* Creator score chip */}
      {user?.role === 'creator' && (
        <div className="score-chip hide-mobile" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: 'rgba(255,107,87,0.10)',
          border: '1px solid rgba(255,107,87,0.20)',
          borderRadius: 100, fontSize: 12,
        }}>
          <span style={{ color: 'var(--p)', fontWeight: 700, fontFamily: 'var(--fd)' }}>
            ⚡{user.creatorScore || 0}
          </span>
          <span style={{ color: 'var(--t3)' }}>·</span>
          <span style={{ color: 'var(--gold)' }}>{user.rank || 'Bronze'}</span>
        </div>
      )}

      {/* Dark / Light toggle */}
      <button
        onClick={toggleTheme}
        className="btn btn-ghost btn-icon theme-toggle"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light'
          ? <Moon size={17} style={{ color: 'var(--t2)' }} />
          : <Sun  size={17} style={{ color: 'var(--gold)' }} />
        }
      </button>

      {/* ── Notifications ─────────────────────────────── */}
      <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={openNotifs}
          className="btn btn-ghost btn-icon"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          style={{ position: 'relative' }}
        >
          <Bell size={17} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--rose)',
              animation: 'pulse 2s infinite',
              border: '1.5px solid var(--s1)',
            }} />
          )}
        </button>

        {showN && (
          <>
            <div onClick={() => setShowN(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
            <div className="glass-modal notif-dropdown" role="dialog" aria-label="Notifications">
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>
                  Notifications {unread > 0 && <span style={{ color: 'var(--rose)', marginLeft: 4 }}>({unread})</span>}
                </span>
                <button onClick={() => setShowN(false)} className="btn btn-ghost btn-sm" aria-label="Close">×</button>
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--t2)', fontSize: 13 }}>
                  All caught up! 🎉
                </div>
              ) : notifs.slice(0, 12).map(n => (
                <div
                  key={n._id}
                  onClick={() => { setShowN(false); if (n.link) navigate(n.link); }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: n.link ? 'pointer' : 'default',
                    background: n.read ? '' : 'rgba(255,107,87,0.06)',
                    transition: 'background 0.15s',
                  }}
                  role={n.link ? 'button' : undefined}
                  tabIndex={n.link ? 0 : undefined}
                >
                  <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: 'var(--t1)', marginBottom: 3 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t2)' }}>{n.body}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Profile / Account ─────────────────────────── */}
      <div ref={userRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => { setShowUser(v => !v); setShowN(false); }}
          className="btn btn-ghost btn-icon"
          aria-label="Account menu"
          aria-expanded={showUser}
          style={{ padding: 4, borderRadius: '50%' }}
        >
          <Avatar src={user?.avatar} name={user?.displayName} size={30} />
        </button>

        {showUser && (
          <div className="glass-modal" style={{
            position: 'fixed',
            right: 12,
            top: 'calc(var(--header-h) + 8px)',
            width: 200,
            zIndex: 500,
            animation: 'fadeUp 0.15s ease',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{user?.displayName}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
              <span className={`badge badge-${user?.role === 'admin' ? 'gold' : user?.role === 'brand' ? 'blue' : 'purple'}`}
                style={{ marginTop: 6, fontSize: 10 }}>
                {user?.role}
              </span>
            </div>
            {user?.role === 'creator' && (
              <button onClick={goProfile} className="btn btn-ghost btn-sm w-full"
                style={{ justifyContent: 'flex-start', padding: '10px 14px', borderRadius: 0 }}>
                <User size={13} /> Profile
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
