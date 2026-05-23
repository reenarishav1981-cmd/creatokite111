import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api';
import { PageLoader, StatCard } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Target, Wallet, TrendingUp, Users } from 'lucide-react';

const TT = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:'var(--s2)',border:'1px solid var(--border2)',borderRadius:8,padding:'10px 14px',fontSize:12 }}>
      <p style={{color:'var(--t2)',marginBottom:4}}>{label}</p>
      {payload.map(p=><p key={p.name} style={{color:p.color,fontWeight:600}}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function BrandAnalytics() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { analyticsAPI.brand().then(d=>setData(d)).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  if (loading) return <PageLoader />;
  const s = data?.stats || {};
  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>Brand Analytics</h2>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Campaign performance and budget overview.</p>
      </div>
      <div className="grid-4">
        <StatCard label="Total Campaigns" value={s.totalCampaigns||0}    icon={Target}    color="var(--p2)"  />
        <StatCard label="Active"           value={s.active||0}            icon={TrendingUp} color="var(--acc2)" />
        <StatCard label="Completed"        value={s.completed||0}         icon={Users}     color="var(--gold)" />
        <StatCard label="Total Budget"     value={`₹${((s.totalSpent||0)/1000).toFixed(0)}K`} icon={Wallet} color="var(--acc)" />
      </div>
      {data?.trend?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:18 }}>Campaign Activity (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--t3)'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'var(--t3)'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="campaigns" fill="var(--p)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data?.nicheBreakdown?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Campaigns by Niche</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {data.nicheBreakdown.slice(0,6).map(n=>(
              <div key={n.niche}>
                <div className="flex-between" style={{ marginBottom:5, fontSize:12 }}>
                  <span style={{color:'var(--t2)'}}>{n.niche}</span>
                  <span style={{color:'var(--p2)',fontWeight:600}}>{n.count} campaigns</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width:`${(n.count/(data.nicheBreakdown[0]?.count||1))*100}%`, background:'var(--p)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
