import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campaignsAPI, analyticsAPI } from '../../api';
import { PageLoader, StatCard, StatusBadge, ScoreRing, Btn, WorkflowPipeline } from '../../components/ui';
import { Target, TrendingUp, Wallet, Trophy, ArrowRight, Zap } from 'lucide-react';

const RANK_COLOR = { Bronze:'#cd7f32', Silver:'#c0c0c0', Gold:'var(--gold)', Platinum:'#a8d8ea', Diamond:'var(--p2)', Legend:'var(--acc)' };

export default function CreatorDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [data, setData]   = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsAPI.creator(), campaignsAPI.myAssigned()])
      .then(([a, c]) => { setData(a); setCampaigns((c.campaigns || []).slice(0, 4)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const rank = user?.rank || 'Bronze';
  const rankColor = RANK_COLOR[rank] || 'var(--p2)';

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Hero card */}
      <div style={{
        background:'linear-gradient(135deg,rgba(108,99,255,0.1),rgba(0,217,255,0.04))',
        border:'1px solid rgba(108,99,255,0.18)', borderRadius:16, padding:'22px 24px',
        display:'flex', gap:20, alignItems:'center', flexWrap:'wrap',
      }}>
        <ScoreRing score={user?.creatorScore || 0} size={76} color="var(--p2)" />
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
            <h2 style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:800 }}>{user?.displayName}</h2>
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:100, background:`${rankColor}18`, color:rankColor, border:`1px solid ${rankColor}40`, fontWeight:700 }}>
              {rank === 'Legend' ? '👑' : '⭐'} {rank}
            </span>
            {user?.isVerified && <span className="badge badge-green">✓ Verified</span>}
          </div>
          <div style={{ fontSize:12, color:'var(--t2)', marginBottom:10 }}>
            {user?.niche || 'Creator'} · Level {user?.level || 1} · {user?.streak || 0} day streak 🔥
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <div style={{ height:5, flex:1, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(user?.creatorScore || 0) / 10}%`, background:'linear-gradient(90deg,var(--p),var(--acc))', borderRadius:4, transition:'width 1s ease' }} />
            </div>
          </div>
          <div style={{ fontSize:11, color:'var(--t3)', marginTop:4 }}>{user?.creatorScore || 0} / 1000 Creator Score</div>
        </div>
        <Btn variant="primary" onClick={() => navigate('/creator/assigned')}>
          View My Campaigns <ArrowRight size={13} />
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <StatCard label="Total Campaigns" value={data?.stats?.total || 0}     icon={Target}     color="var(--p2)" />
        <StatCard label="Completed"        value={data?.stats?.completed || 0} icon={Trophy}     color="var(--acc2)" />
        <StatCard label="Total Earned"     value={`₹${((data?.stats?.earned || 0)/1000).toFixed(1)}K`} icon={Wallet} color="var(--gold)" />
        <StatCard label="Success Rate"     value={`${data?.stats?.successRate || 100}%`} icon={TrendingUp} color="var(--acc)" />
      </div>

      {/* DNA Bars */}
      {user?.dna && (
        <div className="card">
          <div className="flex-between mb-16">
            <h3 style={{ fontSize:13, fontWeight:700 }}>🧬 Creator DNA</h3>
            <span style={{ fontSize:11, color:'var(--t3)' }}>AI-calculated performance profile</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14 }}>
            {[
              { k:'reach',       label:'Reach',        color:'var(--p2)'   },
              { k:'engagement',  label:'Engagement',   color:'var(--acc)'  },
              { k:'reliability', label:'Reliability',  color:'var(--acc2)' },
              { k:'quality',     label:'Quality',      color:'var(--gold)' },
              { k:'growth',      label:'Growth',       color:'var(--coral)'},
              { k:'authenticity',label:'Authenticity', color:'var(--p2)'   },
            ].map(({ k, label, color }) => (
              <div key={k}>
                <div className="flex-between" style={{ marginBottom:5, fontSize:11 }}>
                  <span style={{ color:'var(--t2)' }}>{label}</span>
                  <span style={{ color, fontWeight:700 }}>{user.dna[k] || 0}</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width:`${user.dna[k] || 0}%`, background:color, boxShadow:`0 0 6px ${color}60` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent campaigns */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="flex-between" style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:13, fontWeight:700 }}>Recent Campaign Assignments</h3>
          <Btn variant="ghost" size="sm" onClick={() => navigate('/creator/assigned')}>See all →</Btn>
        </div>
        {campaigns.length === 0 ? (
          <div style={{ padding:36, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🎯</div>
            <p style={{ color:'var(--t2)', fontSize:13, marginBottom:14 }}>No campaigns yet. Keep your profile strong — admin assigns the best creators!</p>
            <Btn variant="secondary" size="sm" onClick={() => navigate('/creator/profile')}>Complete Profile →</Btn>
          </div>
        ) : (
          campaigns.map((c, i) => {
            const a = c.myAssignment;
            return (
              <div key={c._id} style={{ padding:'14px 18px', borderBottom: i < campaigns.length-1 ? '1px solid var(--border)':'none' }}>
                <div className="flex-between" style={{ flexWrap:'wrap', gap:8 }}>
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{c.title}</div>
                    <div style={{ fontSize:11, color:'var(--t2)' }}>{c.brandName} · ₹{(a?.paymentAlloc||0).toLocaleString('en-IN')}</div>
                  </div>
                  <StatusBadge status={a?.status || 'assigned'} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* XP Progress */}
      <div className="card" style={{ background:'linear-gradient(135deg,rgba(245,166,35,0.05),rgba(108,99,255,0.05))', border:'1px solid rgba(245,166,35,0.15)' }}>
        <div className="flex-between" style={{ flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:15, color:'var(--gold)', marginBottom:4 }}>
              ⚡ {user?.xp?.toLocaleString('en-IN') || 0} XP · Level {user?.level || 1}
            </div>
            <div style={{ fontSize:12, color:'var(--t2)' }}>Complete campaigns and submit on time to earn XP and climb ranks</div>
          </div>
          <div style={{ fontSize:12, color:'var(--t3)' }}>Next rank: {user?.rank==='Legend'?'Max rank!':'Keep earning →'}</div>
        </div>
      </div>
    </div>
  );
}
