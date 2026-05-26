import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { PageLoader, StatCard, Btn } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Users, Megaphone, TrendingUp, IndianRupee, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'var(--t2)', marginBottom:4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color||p.fill, fontWeight:600 }}>{p.name||p.dataKey}: {p.value}</p>
      ))}
    </div>
  );
};

const PIE_COLORS = ['var(--p)', 'var(--acc)', 'var(--acc2)', 'var(--gold)', 'var(--coral)', 'var(--rose)', '#a78bfa', '#34d399'];

export default function AdminAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [bcastOpen, setBcastOpen] = useState(false);
  const [bcastForm, setBcastForm] = useState({ role:'', title:'', body:'' });
  const [sending,   setSending]   = useState(false);

  useEffect(() => {
    adminAPI.analytics().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sendBroadcast = async () => {
    if (!bcastForm.title || !bcastForm.body) return toast.error('Fill title and message');
    setSending(true);
    try {
      const d = await adminAPI.broadcast(bcastForm);
      toast.success(`📢 Broadcast sent to ${d.sent} users!`);
      setBcastOpen(false);
      setBcastForm({ role:'', title:'', body:'' });
    } catch(e) { toast.error('Broadcast failed'); }
    finally { setSending(false); }
  };

  if (loading) return <PageLoader />;
  const s = data?.stats || {};
  const niches = (data?.nicheBreakdown || []).slice(0, 8);

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="flex-between" style={{ flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>Platform Analytics</h2>
          <p style={{ color:'var(--t2)', fontSize:13 }}>Platform-wide performance, revenue and health metrics.</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setBcastOpen(true)}>
          📢 Broadcast Notification
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <StatCard label="Total Brands"    value={s.totalBrands||0}              icon={Users}       color="var(--acc)"  />
        <StatCard label="Total Creators"  value={s.totalCreators||0}            icon={Users}       color="var(--p2)"   />
        <StatCard label="Active Campaigns"value={s.activeCampaigns||0}          icon={Megaphone}   color="var(--acc2)" />
        <StatCard label="Platform Revenue"value={`₹${((s.revenue||0)/1000).toFixed(0)}K`} icon={IndianRupee} color="var(--gold)" />
      </div>

      <div className="grid-2" style={{ gap:16, alignItems:'start' }}>
        {/* Niche bar chart */}
        {niches.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:18 }}>Campaigns by Niche</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={niches} layout="vertical" margin={{ left:10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:10, fill:'var(--t3)' }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="_id" tick={{ fontSize:11, fill:'var(--t2)' }} axisLine={false} tickLine={false} width={70}/>
                <Tooltip content={<TT />}/>
                <Bar dataKey="count" fill="var(--p)" radius={[0,4,4,0]} name="Campaigns"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Niche pie */}
        {niches.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:18 }}>Budget Distribution by Niche</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={niches} dataKey="totalBudget" nameKey="_id" cx="50%" cy="50%" outerRadius={80} stroke="none">
                  {niches.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={(v) => `₹${(v/1000).toFixed(0)}K`} contentStyle={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:8 }}>
              {niches.slice(0,6).map((n,i) => (
                <div key={n._id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--t2)' }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:PIE_COLORS[i%PIE_COLORS.length] }}/>
                  {n._id}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Campaign status breakdown */}
      <div className="card">
        <h3 style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Platform Health</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
          {[
            { label:'Active Campaigns',    val:s.activeCampaigns||0,    max:s.totalCampaigns||1,  color:'var(--acc2)' },
            { label:'Completed',           val:s.completedCampaigns||0, max:s.totalCampaigns||1,  color:'var(--gold)' },
            { label:'Creator Pool',        val:s.totalCreators||0,      max:Math.max(s.totalCreators||1,500), color:'var(--p2)' },
            { label:'Brand Partners',      val:s.totalBrands||0,        max:Math.max(s.totalBrands||1,200),   color:'var(--acc)' },
          ].map(m => (
            <div key={m.label}>
              <div className="flex-between" style={{ marginBottom:8, fontSize:12 }}>
                <span style={{ color:'var(--t2)' }}>{m.label}</span>
                <span style={{ color:m.color, fontWeight:700 }}>{m.val}</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width:`${Math.min(100,(m.val/m.max)*100)}%`, background:m.color }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Broadcast modal */}
      {bcastOpen && (
        <div onClick={()=>setBcastOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16, backdropFilter:'blur(4px)' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:14, padding:24, width:'100%', maxWidth:460, animation:'fadeUp 0.2s ease' }}>
            <div className="flex-between mb-16">
              <h3 style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:15 }}>📢 Broadcast Notification</h3>
              <button onClick={()=>setBcastOpen(false)} className="btn btn-ghost btn-icon" style={{fontSize:18}}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Send To</label>
                <select className="form-input" value={bcastForm.role} onChange={e=>setBcastForm(p=>({...p,role:e.target.value}))}>
                  <option value="">All Users</option>
                  <option value="creator">All Creators</option>
                  <option value="brand">All Brands</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={bcastForm.title} onChange={e=>setBcastForm(p=>({...p,title:e.target.value}))} placeholder="Notification title…"/>
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea className="form-input form-textarea" value={bcastForm.body} onChange={e=>setBcastForm(p=>({...p,body:e.target.value}))} placeholder="Your message to users…" style={{minHeight:90}}/>
              </div>
              <div className="flex-between" style={{marginTop:4}}>
                <Btn variant="ghost" onClick={()=>setBcastOpen(false)}>Cancel</Btn>
                <Btn variant="primary" onClick={sendBroadcast} disabled={sending}>{sending?'Sending…':'Send Broadcast'}</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
