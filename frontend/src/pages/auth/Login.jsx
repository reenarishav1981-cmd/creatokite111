import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Btn, Input } from '../../components/ui';
import toast from 'react-hot-toast';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || null;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.displayName}!`);
      navigate(from || `/${user.role}/dashboard`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (email) => {
    setLoading(true);
    try {
      const user = await login(email, 'Demo@12345');
      toast.success(`Demo login: ${user.displayName}`);
      navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (e) {
      toast.error('Demo login failed — run: cd backend && npm run seed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(12px,4vw,24px)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg,var(--p),var(--acc))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, margin: '0 auto 14px',
            boxShadow: 'var(--shadow-p)',
          }}>⚡</div>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(20px,5vw,26px)', fontWeight: 800 }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 13, marginTop: 4 }}>
            Sign in to your Creatokite account
          </p>
        </div>

        <div style={{
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r2)',
          padding: 'clamp(18px,5vw,28px)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={upd('email')}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoCapitalize="none"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={upd('password')}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <Btn variant="primary" className="w-full btn-lg" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </Btn>
          </form>

          <div style={{ margin: '20px 0', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--t2)', textAlign: 'center', marginBottom: 10 }}>
              Quick demo access
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                ['👑 Admin',   'admin@creatokite.com'],
                ['🏢 Brand',   'brand@demo.com'],
                ['✨ Creator', 'creator1@demo.com'],
              ].map(([l, e]) => (
                <button
                  key={e}
                  onClick={() => loginDemo(e)}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '8px 4px', fontSize: 11, borderRadius: 'var(--r)',
                    cursor: 'pointer', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border)', color: 'var(--t2)',
                    transition: 'all 0.15s', fontFamily: 'var(--fb)',
                    minHeight: 36,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center', marginTop: 8 }}>
              Run <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 4 }}>npm run seed</code> in backend first
            </p>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--p2)', fontWeight: 600 }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
