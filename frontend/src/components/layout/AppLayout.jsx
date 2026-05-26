import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on ESC key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);
  const closeSidebar  = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="app-layout">
      {/* Sidebar overlay — mobile only */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="main-area">
        <Header onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="page-content page-enter">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
