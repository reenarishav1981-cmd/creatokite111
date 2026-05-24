import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api';
import { PageLoader, StatCard, Avatar, StatusBadge, Btn } from '../../components/ui';
import { Users, Megaphone, TrendingUp, IndianRupee, Clock, Zap, ArrowRight, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const nav = useNavigate();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatorStats, setCreatorStats] = useState(null);

  useEffect(() => {
    adminAPI.dashboard().then(d=>setData(d)).catch(()=>{}).finally(()=>setLoading(false));
    adminAPI.creatorsStats().then(d=>setCreatorStats(d.stats)).catch(()=>{});
  }, []);

  if (loading) return <PageLoader />;
  const s = data?.stats || {};

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Mission control header */}
      <div style={{ background:'linear-gradient(135deg,rgba(108,99,255,0.1),rgba(0,217,255,0.04))',
        border:'1px solid rgba(108,99,255,0.2)', borderRadius:16, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <span style={{ fontSize:20 }}>🛡️</span>
          <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18 }}>Admin Control Center</h2>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:'rgba(245,166,35,0.15)', color:'var(--gold)', border:'1px solid rgba(245,166,35,0.25)' }}>Super Admin</span>
        </div>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Manage campaigns, assign creators, monitor platform health.</p>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <StatCard label="Total Users"     value={s.totalUsers||0}      icon={Users}       color="var(--p2)"  />
        <StatCard label="Total Campaigns" value={s.totalCampaigns||0}  icon={Megaphone}   color="var(--acc)" />
        <StatCard label="Campaigns Pending" value={s.pendingCampaigns||0} icon={Clock}    color="var(--gold)" sub="Need assignment" />
        <StatCard label="Revenue"         value={`₹${((s.totalRevenue||0)/1000).toFixed(0)}K`} icon={IndianRupee} color="var(--acc2)" />
      </div>
      {creatorStats?.pending>0&&(
        <div style={{ padding:'12px 16px', background:'rgba(245,166,35,0.06)', border:'1px solid rgba(245,166,35,0.2)', borderRadius:10,
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <UserCheck size={16} style={{ color:'var(--gold)' }}/>
            <span style={{ fontSize:13, fontWeight:600 }}>
              <span style={{ color:'var(--gold)', fontWeight:800 }}>{creatorStats.pending}</span> creator{creatorStats.pending!==1?'s':''} waiting for approval
            </span>
          </div>
          <Btn variant="primary" size="sm" onClick={()=>nav('/admin/creator-approval')}>
            <Zap size={12}/> Review Now →
          </Btn>
        </div>
      )}

      <div className="grid-2" style={{ gap:16, alignItems:'start' }}>

        {/* Pending campaigns */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="flex-between" style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:13, fontWeight:700 }}>⏳ Pending Campaigns</h3>
            <Btn variant="ghost" size="sm" onClick={()=>nav('/admin/campaigns')}>Manage all →</Btn>
          </div>
          {!data?.recentCampaigns?.length ? (
            <div style={{ padding:24, textAlign:'center', color:'var(--t2)', fontSize:12 }}>All caught up! 🎉</div>
          ) : data.recentCampaigns.slice(0,6).map((c,i) => (
            <div key={c._id} onClick={()=>nav('/admin/campaigns')}
              style={{ padding:'12px 16px', borderBottom:i<5?'1px solid var(--border)':'none',
                cursor:'pointer', transition:'background .15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
              onMouseLeave={e=>e.currentTarget.style.background=''}>
              <div className="flex-between" style={{ gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:12, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize:11, color:'var(--t2)' }}>{c.brandName||c.brand?.companyName} · ₹{c.budget?.toLocaleString('en-IN')}</div>
                </div>
                <StatusBadge status={c.workflowStatus} />
              </div>
            </div>
          ))}
          {s.pendingCampaigns>0&&(
            <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', textAlign:'center' }}>
              <Btn variant="primary" size="sm" onClick={()=>nav('/admin/campaigns')}>
                <Zap size={12}/> Review {s.pendingCampaigns} pending →
              </Btn>
            </div>
          )}
        </div>

        {/* Recent users */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="flex-between" style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:13, fontWeight:700 }}>🆕 Recent Users</h3>
            <Btn variant="ghost" size="sm" onClick={()=>nav('/admin/users')}>All users →</Btn>
          </div>
          {(data?.recentUsers||[]).slice(0,7).map((u,i) => (
            <div key={u._id} style={{ padding:'10px 16px', borderBottom:i<6?'1px solid var(--border)':'none',
              display:'flex', alignItems:'center', gap:10 }}>
              <Avatar src={u.avatar} name={u.displayName} size={30} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.displayName}</div>
                <div style={{ fontSize:10, color:'var(--t2)' }}>{u.role} {u.niche?`· ${u.niche}`:''}</div>
              </div>
              <div style={{ fontSize:10, color:u.role==='creator'?'var(--p2)':u.role==='brand'?'var(--acc)':'var(--gold)', fontWeight:600 }}>
                {u.role==='creator'?`Score: ${u.creatorScore||0}`:'Brand'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
        {[
          { icon:'🤖', label:'AI Analyze Campaigns',    desc:'Run AI on pending briefs', to:'/admin/campaigns', color:'var(--p2)'  },
          { icon:'👥', label:'Manage Users',             desc:'View & edit all users',    to:'/admin/users',     color:'var(--acc)' },
          { icon:'📊', label:'Platform Analytics',       desc:'Revenue, trends, health',  to:'/admin/analytics', color:'var(--gold)'},
          { icon:'📢', label:'Broadcast Notification',   desc:'Send to all users',        to:'/admin/campaigns', color:'var(--acc2)'},
        ].map(a=>(
          <div key={a.label} onClick={()=>nav(a.to)}
            style={{ padding:'16px', background:'var(--s1)', border:'1px solid var(--border)', borderRadius:12,
              cursor:'pointer', transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='';}}>
            <div style={{ fontSize:22, marginBottom:8 }}>{a.icon}</div>
            <div style={{ fontSize:13, fontWeight:600, color:a.color, marginBottom:3 }}>{a.label}</div>
            <div style={{ fontSize:11, color:'var(--t3)' }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
