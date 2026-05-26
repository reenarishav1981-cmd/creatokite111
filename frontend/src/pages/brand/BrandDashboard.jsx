import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campaignsAPI } from '../../api';
import { PageLoader, StatCard, WorkflowPipeline, StatusBadge, Btn, EmptyState } from '../../components/ui';
import { Target, TrendingUp, IndianRupee, Users, Plus, BarChart2, Eye } from 'lucide-react';

const WF = {
  brand_submitted:  { label:'Under Review',    icon:'⏳', color:'var(--gold)',  desc:'Admin reviewing your brief' },
  admin_review:     { label:'AI Analyzing',    icon:'🤖', color:'var(--p2)',   desc:'AI finding best creators' },
  ai_analyzing:     { label:'AI Analyzing',    icon:'🤖', color:'var(--p2)',   desc:'AI matching creators' },
  creators_assigned:{ label:'Creators Assigned',icon:'✅', color:'var(--acc2)', desc:'Team has selected creators' },
  in_progress:      { label:'In Progress',     icon:'🚀', color:'var(--acc)',  desc:'Creators making content' },
  revision:         { label:'In Revision',     icon:'✏️', color:'var(--coral)', desc:'Content under revision' },
  completed:        { label:'Completed',       icon:'🏆', color:'var(--gold)', desc:'Campaign delivered!' },
  cancelled:        { label:'Cancelled',       icon:'❌', color:'var(--t3)',   desc:'Campaign cancelled' },
};

export default function BrandDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');

  useEffect(() => {
    campaignsAPI.brandCampaigns().then(d => setCampaigns(d.campaigns||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const active    = campaigns.filter(c=>['in_progress','creators_assigned'].includes(c.workflowStatus));
  const pending   = campaigns.filter(c=>['brand_submitted','admin_review','ai_analyzing'].includes(c.workflowStatus));
  const completed = campaigns.filter(c=>c.workflowStatus==='completed');
  const totalSpent= campaigns.reduce((s,c)=>s+c.budget,0);

  const filtered = filter==='all' ? campaigns : campaigns.filter(c=>(c.workflowStatus||c.status)===filter);

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,rgba(108,99,255,0.08),rgba(0,217,255,0.04))',
        border:'1px solid rgba(108,99,255,0.15)', borderRadius:16, padding:'22px 24px',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <h2 style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:800 }}>{user?.companyName||user?.displayName}</h2>
            {user?.isVerified && <span className="badge badge-green">✓ Verified</span>}
          </div>
          <p style={{ color:'var(--t2)', fontSize:13 }}>Submit campaign goals — we assign the best creators automatically.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="primary"   onClick={()=>navigate('/brand/campaigns/create')}><Plus size={14}/> New Campaign</Btn>
          <Btn variant="secondary" onClick={()=>navigate('/brand/analytics')}><BarChart2 size={14}/> Analytics</Btn>
        </div>
      </div>

      <div className="grid-4">
        <StatCard label="Total Campaigns" value={campaigns.length}   icon={Target}       color="var(--p2)" />
        <StatCard label="Pending Review"  value={pending.length}     icon={Target}       color="var(--gold)"  sub="Being processed" />
        <StatCard label="In Progress"     value={active.length}      icon={TrendingUp}   color="var(--acc2)" />
        <StatCard label="Total Budget"    value={`₹${(totalSpent/1000).toFixed(0)}K`} icon={IndianRupee} color="var(--acc)" />
      </div>

      {/* How it works (first time) */}
      {campaigns.length < 2 && (
        <div style={{ padding:'18px 20px', background:'rgba(108,99,255,0.05)', border:'1px solid rgba(108,99,255,0.15)', borderRadius:12 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>💡 How Creatokite works for your brand</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
            {[
              ['1. You Submit','Tell us your goals & budget. No browsing creator lists.'],
              ['2. AI Matches','Our AI picks the best creators from 12,000+ profiles.'],
              ['3. Admin Assigns','Our team finalises and bulk-assigns creators.'],
              ['4. Track Results','Watch real-time performance — we handle creators.'],
            ].map(([t,d])=>(
              <div key={t}>
                <div style={{ fontSize:12, color:'var(--p2)', fontWeight:600, marginBottom:3 }}>{t}</div>
                <div style={{ fontSize:11, color:'var(--t2)' }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign list */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <h3 style={{ fontSize:13, fontWeight:700 }}>Your Campaigns</h3>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[['all','All'],['brand_submitted','Pending'],['creators_assigned','Assigned'],['in_progress','Active'],['completed','Done']].map(([k,l])=>(
              <button key={k} onClick={()=>setFilter(k)} className={`chip${filter===k?' active':''}`} style={{fontSize:11}}>{l}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="🚀" title="No campaigns yet"
            desc="Submit your first campaign brief and let our AI find the perfect creators!"
            action={<Btn variant="primary" onClick={()=>navigate('/brand/campaigns/create')}>Submit Campaign Brief</Btn>}
          />
        ) : (
          filtered.map((c, i) => {
            const ws    = c.workflowStatus || 'brand_submitted';
            const stage = WF[ws] || WF.brand_submitted;
            const assigned = c.assignedCreators?.length || 0;
            return (
              <div key={c._id} style={{ padding:'16px 18px', borderBottom: i<filtered.length-1?'1px solid var(--border)':'none',
                transition:'background .15s', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                onMouseLeave={e=>e.currentTarget.style.background=''}
                onClick={()=>navigate(`/brand/campaigns/${c._id}`)}>
                <div className="flex-between" style={{ flexWrap:'wrap', gap:10, marginBottom:10 }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span>{stage.icon}</span>
                      <span style={{ fontWeight:700, fontSize:13 }}>{c.title}</span>
                      {c.isPremium && <span className="badge badge-gold">⭐ Premium</span>}
                    </div>
                    <div style={{ fontSize:11, color:'var(--t2)' }}>
                      {c.niche} · <span style={{color:'var(--acc2)',fontWeight:600}}>₹{c.budget?.toLocaleString('en-IN')}</span>
                      {' · '}{c.daysLeft ?? '?'}d left · {assigned} creators assigned
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Btn variant="ghost" size="sm" onClick={e=>{e.stopPropagation();navigate(`/brand/campaigns/${c._id}`)}}><Eye size={12}/> View</Btn>
                  </div>
                </div>
                <WorkflowPipeline status={ws} />
                <div style={{ marginTop:8, fontSize:11, color:stage.color }}>● {stage.desc}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
