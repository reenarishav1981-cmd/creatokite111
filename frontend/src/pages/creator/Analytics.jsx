import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader, StatCard } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Target, Wallet, TrendingUp, Star, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'var(--t2)', marginBottom:4 }}>{label}</p>
      {payload.map(p=><p key={p.name} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const BADGE_MAP = {
  ELITE:    { color:'#fbbf24', label:'⭐ ELITE' },
  VERIFIED: { color:'var(--acc2)', label:'✔ VERIFIED' },
  STANDARD: { color:'var(--p2)',   label:'✦ STANDARD' },
  REVIEW:   { color:'var(--gold)', label:'⚠ REVIEW' },
};
const RISK_COLOR = { LOW:'var(--acc2)', MEDIUM:'var(--gold)', HIGH:'var(--rose)' };

const SCORE_META = [
  { key:'engagement',    label:'Engagement',  color:'var(--p2)'  },
  { key:'reach',         label:'Reach',       color:'#a78bfa'    },
  { key:'authenticity',  label:'Authenticity',color:'var(--acc2)'},
  { key:'consistency',   label:'Consistency', color:'var(--gold)'},
  { key:'growth',        label:'Growth',      color:'#22d3ee'    },
  { key:'brandSafety',   label:'Brand Safety',color:'var(--acc)' },
  { key:'conversion',    label:'Conversion',  color:'#fb923c'    },
  { key:'contentQuality',label:'Content',     color:'#f472b6'    },
];

function CASRingLarge({ score=0, badge='REVIEW' }) {
  const bm = BADGE_MAP[badge]||BADGE_MAP.REVIEW;
  const r=50, circ=2*Math.PI*r, fill=(score/100)*circ;
  const color = score>=75?'var(--acc2)':score>=50?'var(--gold)':'var(--rose)';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      <div style={{ position:'relative', width:140, height:140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9"/>
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 70 70)" style={{ transition:'stroke-dasharray 1.5s ease' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:34, fontWeight:900, fontFamily:'var(--fd)', color }}>{score}</span>
          <span style={{ fontSize:10, color:'var(--t3)', fontWeight:600, letterSpacing:1 }}>CAS SCORE</span>
        </div>
      </div>
      <span style={{ fontSize:11, padding:'3px 12px', borderRadius:99, fontWeight:800,
        color:bm.color, background:`${bm.color}15`, border:`1px solid ${bm.color}30` }}>{bm.label}</span>
    </div>
  );
}

export default function CreatorAnalytics() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData]     = useState(null);
  const [casData, setCasData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.creator(),
      user?.socialAnalyzed ? analyticsAPI.creatorCAS() : Promise.resolve(null),
    ]).then(([d, cas]) => {
      setData(d);
      if (cas) setCasData(cas);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [user?.socialAnalyzed]);

  if (loading) return <PageLoader />;
  const s = data?.stats || {};
  const trend = data?.trend || [];

  const radarData = casData ? SCORE_META.map(m=>({ subject:m.label, score:casData.casBreakdown?.[m.key]||0 })) : [];

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>My Analytics</h2>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Your campaign performance and Creator Automation Score.</p>
      </div>

      <div className="grid-4">
        <StatCard label="Total Campaigns" value={s.total||0}      icon={Target}    color="var(--p2)"  />
        <StatCard label="Completed"       value={s.completed||0}  icon={Star}      color="var(--acc2)"/>
        <StatCard label="Total Earned"    value={`₹${((s.earned||0)/1000).toFixed(1)}K`} icon={Wallet} color="var(--gold)"/>
        <StatCard label="Success Rate"    value={`${s.successRate||100}%`} icon={TrendingUp} color="var(--acc)"/>
      </div>

      {/* ── CAS SECTION ─────────────────────────────── */}
      {casData ? (
        <div className="card" style={{ border:'1px solid rgba(108,99,255,0.2)', background:'rgba(108,99,255,0.03)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <Zap size={16} style={{ color:'var(--p2)' }}/>
            <h3 style={{ fontSize:14, fontWeight:800 }}>Creator Automation Score</h3>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4,
              background:'rgba(108,99,255,0.15)', color:'var(--p2)',
              border:'1px solid rgba(108,99,255,0.25)', fontWeight:700 }}>AI-POWERED</span>
            {casData.verificationStatus && (
              <span style={{ marginLeft:'auto', fontSize:11, padding:'2px 10px', borderRadius:99, fontWeight:700,
                color:casData.verificationStatus==='approved'?'var(--acc2)':casData.verificationStatus==='pending'?'var(--gold)':'var(--rose)',
                background:casData.verificationStatus==='approved'?'rgba(52,211,153,0.1)':casData.verificationStatus==='pending'?'rgba(245,166,35,0.1)':'rgba(248,113,113,0.1)',
              }}>
                {casData.verificationStatus==='approved'?'✔ Verified':casData.verificationStatus==='pending'?'⏳ Pending Review':'✕ Not Approved'}
              </span>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'start' }}>
            {/* Ring + risk */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
              <CASRingLarge score={casData.casScore||0} badge={casData.casBadge} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--t3)', marginBottom:4 }}>Risk Level</div>
                <span style={{ fontWeight:800, fontSize:12, color:RISK_COLOR[casData.casRisk]||'var(--t2)',
                  background:`${RISK_COLOR[casData.casRisk]||'gray'}15`,
                  padding:'3px 12px', borderRadius:99 }}>{casData.casRisk||'—'}</span>
              </div>
              {casData.analyzedAt && (
                <div style={{ fontSize:10, color:'var(--t3)' }}>
                  Analyzed {new Date(casData.analyzedAt).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>

            {/* Radar + bar grid */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {radarData.length>0 && (
                <div style={{ height:220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.07)"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:'var(--t3)' }}/>
                      <Radar name="Score" dataKey="score" stroke="var(--p2)" fill="var(--p2)" fillOpacity={0.15}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {SCORE_META.map(m=>(
                  <div key={m.key} style={{ background:'var(--s2)', borderRadius:8, padding:'10px 12px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:10, color:'var(--t3)', marginBottom:5 }}>{m.label}</div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:99, marginBottom:6 }}>
                      <div style={{ height:'100%', width:`${casData.casBreakdown?.[m.key]||0}%`, background:m.color, borderRadius:99, transition:'width 1s' }}/>
                    </div>
                    <div style={{ fontSize:14, fontWeight:800, color:m.color }}>{casData.casBreakdown?.[m.key]||0}/100</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Not yet analyzed — prompt */
        <div style={{ padding:'24px', background:'rgba(108,99,255,0.05)', border:'1px dashed rgba(108,99,255,0.25)',
          borderRadius:12, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
          <h3 style={{ fontSize:15, fontWeight:800, marginBottom:6 }}>Get Your AI Creator Score</h3>
          <p style={{ color:'var(--t2)', fontSize:13, marginBottom:16, maxWidth:380, margin:'0 auto 16px' }}>
            Connect your Instagram or YouTube to get your Creator Automation Score and submit for brand verification.
          </p>
          <button className="btn btn-primary" onClick={()=>nav('/creator/profile')}>
            <Zap size={13}/> Connect Social Profile
          </button>
        </div>
      )}

      {/* Campaign trend chart */}
      {trend.length>0 && (
        <div className="card">
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:18 }}>Campaign Assignments Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--t3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--t3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="assignments" stroke="var(--p2)" strokeWidth={2.5} dot={{ fill:'var(--p2)', strokeWidth:0, r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaign history table */}
      {data?.campaigns?.length>0 && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:700 }}>Campaign History</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Campaign</th><th>Niche</th><th>Status</th><th>Earned</th></tr>
              </thead>
              <tbody>
                {data.campaigns.map((c,i)=>(
                  <tr key={i}>
                    <td style={{ fontWeight:500 }}>{c.title}</td>
                    <td><span className="badge badge-purple">{c.niche}</span></td>
                    <td><span className="badge" style={{ background:'rgba(255,255,255,0.05)', color:'var(--t2)' }}>{c.assignment?.status||'—'}</span></td>
                    <td style={{ color:'var(--acc2)', fontWeight:600 }}>₹{(c.assignment?.paymentAlloc||0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
