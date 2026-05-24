import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, analyticsAPI } from '../../api';
import { Btn, Input, Textarea } from '../../components/ui';
import toast from 'react-hot-toast';
import { Zap, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const NICHES = ['Tech','Beauty','Fashion','Fitness','Food','Travel','Gaming','Education','Finance','Lifestyle','Music','Art','Other'];

const STEPS = [
  { icon:'🔍', label:'Fetching social profile...'        },
  { icon:'📊', label:'Analyzing engagement metrics...'   },
  { icon:'👥', label:'Checking audience authenticity...' },
  { icon:'📈', label:'Calculating reach & growth...'     },
  { icon:'🛡️', label:'Running brand safety check...'    },
  { icon:'🤖', label:'Computing Creator Score...'        },
];

const SCORE_META = [
  { key:'engagement',    label:'Engagement Quality',  color:'var(--p2)'  },
  { key:'reach',         label:'Audience Reach',      color:'#a78bfa'    },
  { key:'authenticity',  label:'Authenticity',         color:'var(--acc2)'},
  { key:'consistency',   label:'Posting Consistency',  color:'var(--gold)'},
  { key:'growth',        label:'Growth Rate',          color:'#22d3ee'    },
  { key:'brandSafety',   label:'Brand Safety',         color:'var(--acc)' },
  { key:'conversion',    label:'Conversion Potential', color:'#fb923c'    },
  { key:'contentQuality',label:'Content Quality',      color:'#f472b6'    },
];

const BADGE_MAP = {
  ELITE:    { color:'#fbbf24',     bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.25)',  label:'⭐ ELITE'    },
  VERIFIED: { color:'var(--acc2)', bg:'rgba(52,211,153,0.08)',border:'rgba(52,211,153,0.2)',  label:'✔ VERIFIED'  },
  STANDARD: { color:'var(--p2)',   bg:'rgba(108,99,255,0.08)',border:'rgba(108,99,255,0.2)', label:'✦ STANDARD'  },
  REVIEW:   { color:'var(--gold)', bg:'rgba(245,166,35,0.08)',border:'rgba(245,166,35,0.2)', label:'⚠ REVIEW'   },
};
const RISK_CLR = { LOW:'var(--acc2)', MEDIUM:'var(--gold)', HIGH:'var(--rose)' };

function ScoreBar({ label, value=0, color }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:12 }}>
        <span style={{ color:'var(--t2)' }}>{label}</span>
        <span style={{ fontWeight:700 }}>{value}/100</span>
      </div>
      <div className="progress">
        <div className="progress-bar" style={{ width:`${value}%`, background:color, transition:'width 1.2s ease' }}/>
      </div>
    </div>
  );
}

function CASRing({ cas=0, badge='REVIEW' }) {
  const bm  = BADGE_MAP[badge] || BADGE_MAP.REVIEW;
  const col = cas>=75?'var(--acc2)':cas>=50?'var(--gold)':'var(--rose)';
  const r=38, circ=2*Math.PI*r;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ position:'relative', width:110, height:110 }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
          <circle cx="55" cy="55" r={r} fill="none" stroke={col} strokeWidth="7"
            strokeDasharray={`${(cas/100)*circ} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 55 55)" style={{ transition:'stroke-dasharray 1.5s ease' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:26, fontWeight:900, fontFamily:'var(--fd)', color:col }}>{cas}</span>
          <span style={{ fontSize:9, color:'var(--t3)', fontWeight:600, letterSpacing:1 }}>CAS</span>
        </div>
      </div>
      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, fontWeight:800, letterSpacing:0.5,
        color:bm.color, background:bm.bg, border:`1px solid ${bm.border}` }}>{bm.label}</span>
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    displayName: user?.displayName||'',
    bio:         user?.bio||'',
    location:    user?.location||'',
    website:     user?.website||'',
    niche:       user?.niche||'',
    avatar:      user?.avatar||'',
  });

  const [igUrl, setIgUrl]     = useState(user?.socialUrls?.instagram||'');
  const [ytUrl, setYtUrl]     = useState(user?.socialUrls?.youtube||'');
  const [analyzing, setAnalyzing] = useState(false);
  const [stepIdx,   setStepIdx]   = useState(0);
  const [casData,   setCasData]   = useState(null);

  // Load existing CAS on mount
  useEffect(() => {
    if (user?.socialAnalyzed) {
      analyticsAPI.creatorCAS()
        .then(d => setCasData(d))
        .catch(() => {});
    }
  }, [user?.socialAnalyzed]);

  const upd = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await usersAPI.updateProfile(form);
      await refreshUser();
      toast.success('Profile saved!');
    } catch(e) { toast.error(e.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const analyzeProfile = async () => {
    if (!igUrl && !ytUrl) {
      toast.error('Enter at least one social URL (Instagram or YouTube).');
      return;
    }
    setAnalyzing(true);
    setStepIdx(0);
    setCasData(null);

    const interval = setInterval(() => {
      setStepIdx(p => p < STEPS.length-1 ? p+1 : p);
    }, 900);

    try {
      const data = await analyticsAPI.connectSocial({ instagramUrl:igUrl, youtubeUrl:ytUrl });
      clearInterval(interval);
      await new Promise(r => setTimeout(r, 400));
      setCasData(data);
      await refreshUser();
      toast.success(data.autoApprove ? '🎉 Auto-approved! Excellent score.' : '✅ Analysis done. Pending admin review.');
    } catch(e) {
      clearInterval(interval);
      toast.error(e.response?.data?.message || 'Analysis failed. Check your URLs and try again.');
    } finally { setAnalyzing(false); }
  };

  const complete = user?.profileComplete || 0;
  const vs       = user?.verificationStatus || 'none';
  const vstatus = {
    none:     { label:'Not submitted',  color:'var(--t3)',    Icon:null },
    pending:  { label:'Pending review', color:'var(--gold)',  Icon:Clock },
    approved: { label:'Verified ✔',    color:'var(--acc2)', Icon:CheckCircle },
    rejected: { label:'Not approved',  color:'var(--rose)', Icon:AlertTriangle },
  }[vs];

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>My Profile</h2>
          <p style={{ color:'var(--t2)', fontSize:13 }}>Keep your profile complete and social profiles fresh for better campaign matches.</p>
        </div>
        <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
      </div>

      {/* Completeness bar */}
      <div style={{ padding:'12px 16px', background:'rgba(108,99,255,0.06)', border:'1px solid rgba(108,99,255,0.15)', borderRadius:10 }}>
        <div className="flex-between" style={{ marginBottom:8, fontSize:12 }}>
          <span style={{ color:'var(--p2)', fontWeight:600 }}>Profile Completeness</span>
          <span style={{ fontWeight:700 }}>{complete}%</span>
        </div>
        <div className="progress">
          <div className="progress-bar" style={{ width:`${complete}%`, background:'linear-gradient(90deg,var(--p),var(--acc))' }}/>
        </div>
        {complete<80&&<div style={{ fontSize:11, color:'var(--t3)', marginTop:6 }}>Add bio, location and social profiles to increase score.</div>}
      </div>

      {/* ── SOCIAL INTELLIGENCE ───────────────────────────────── */}
      <div className="card" style={{ border:'1px solid rgba(108,99,255,0.2)', background:'rgba(108,99,255,0.03)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <Zap size={16} style={{ color:'var(--p2)' }}/>
          <h3 style={{ fontSize:14, fontWeight:800 }}>Creator Automation Score (CAS)</h3>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4,
            background:'rgba(108,99,255,0.15)', color:'var(--p2)', border:'1px solid rgba(108,99,255,0.25)', fontWeight:700 }}>AI-POWERED</span>
        </div>
        <p style={{ color:'var(--t2)', fontSize:12, marginBottom:14 }}>
          Paste your social URLs — AI fetches real followers, likes, engagement automatically. No manual entry needed.
        </p>

        {/* Verification status */}
        {vstatus && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px',
            borderRadius:99, fontSize:11, fontWeight:700, marginBottom:14,
            color:vstatus.color, background:`${vstatus.color}18`, border:`1px solid ${vstatus.color}30` }}>
            {vstatus.Icon && <vstatus.Icon size={12}/>}
            Verification: {vstatus.label}
            {user?.verificationNote && <span style={{ color:'var(--t3)', fontWeight:400 }}> — {user.verificationNote}</span>}
          </div>
        )}

        {/* URL inputs */}
        <div className="grid-2" style={{ gap:12, marginBottom:14 }}>
          <div className="form-group">
            <label className="form-label">📸 Instagram URL or @username</label>
            <input className="form-input" placeholder="instagram.com/yourhandle or @handle"
              value={igUrl} onChange={e=>setIgUrl(e.target.value)} disabled={analyzing}/>
          </div>
          <div className="form-group">
            <label className="form-label">▶ YouTube URL or @channel</label>
            <input className="form-input" placeholder="youtube.com/@yourchannel"
              value={ytUrl} onChange={e=>setYtUrl(e.target.value)} disabled={analyzing}/>
          </div>
        </div>

        <Btn variant="primary" onClick={analyzeProfile} disabled={analyzing}
          style={{ display:'flex', alignItems:'center', gap:7 }}>
          {analyzing
            ? <RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }}/>
            : <Zap size={13}/>}
          {analyzing ? 'Analyzing…' : user?.socialAnalyzed ? 'Re-fetch & Update' : 'Auto-Fetch & Submit for Approval'}
        </Btn>

        {/* Analysis steps animation */}
        {analyzing && (
          <div style={{ marginTop:16, padding:16, background:'var(--s2)', borderRadius:10, border:'1px solid var(--border)' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0',
                opacity:i<=stepIdx?1:0.2, transition:'opacity 0.4s' }}>
                <span style={{ fontSize:16 }}>{s.icon}</span>
                <span style={{ fontSize:12, fontWeight:i===stepIdx?700:400,
                  color:i<stepIdx?'var(--acc2)':i===stepIdx?'var(--p2)':'var(--t3)', transition:'color 0.3s' }}>
                  {i<stepIdx?'✓ ':i===stepIdx?'→ ':''}{s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CAS Result */}
        {casData && !analyzing && (
          <div style={{ marginTop:18 }}>
            <div style={{ padding:'11px 14px', borderRadius:10, marginBottom:16, fontSize:12, lineHeight:1.6,
              background:casData.autoApprove?'rgba(52,211,153,0.08)':'rgba(108,99,255,0.08)',
              border:`1px solid ${casData.autoApprove?'rgba(52,211,153,0.2)':'rgba(108,99,255,0.2)'}`,
              color:casData.autoApprove?'var(--acc2)':'var(--p2)' }}>
              {casData.message}
            </div>

            <div className="grid-2" style={{ gap:14, alignItems:'start' }}>
              {/* Ring */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                <CASRing cas={casData.cas} badge={casData.badge}/>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'var(--t3)', marginBottom:4 }}>Risk Level</div>
                  <span style={{ fontWeight:800, color:RISK_CLR[casData.riskLevel]||'var(--t2)',
                    background:`${RISK_CLR[casData.riskLevel]||'gray'}15`, padding:'2px 10px', borderRadius:99, fontSize:11 }}>
                    {casData.riskLevel}
                  </span>
                </div>

                {/* Fetched data cards */}
                {[casData.igData, casData.ytData].filter(Boolean).map((d,i)=>(
                  <div key={i} style={{ width:'100%', background:'var(--s2)', borderRadius:10,
                    padding:12, border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:11, color:'var(--p2)', fontWeight:700, marginBottom:8 }}>
                      {d.platform==='instagram'?'📸 Instagram':'▶ YouTube'}
                      {!d.isReal&&<span style={{ color:'var(--gold)', marginLeft:4, fontSize:10, fontWeight:400 }}>(estimated)</span>}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {[
                        ['Followers',    (d.followers||d.subscribers||0).toLocaleString('en-IN')],
                        ['Avg Likes',    (d.avgLikes||0).toLocaleString('en-IN')],
                        ['Avg Comments', (d.avgComments||0).toLocaleString('en-IN')],
                        ['Eng. Rate',    `${d.er||0}%`],
                      ].map(([lbl,val])=>(
                        <div key={lbl} style={{ background:'var(--bg)', borderRadius:7, padding:'7px 9px', textAlign:'center' }}>
                          <div style={{ fontSize:12, fontWeight:800, color:'var(--t1)' }}>{val}</div>
                          <div style={{ fontSize:10, color:'var(--t3)' }}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Score breakdown */}
              <div>
                <p style={{ fontSize:11, color:'var(--t3)', fontWeight:600, letterSpacing:0.5, marginBottom:12 }}>SCORE BREAKDOWN</p>
                {SCORE_META.map(m=>(
                  <ScoreBar key={m.key} label={m.label} value={casData.scores?.[m.key]||0} color={m.color}/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Already analyzed — show quick summary */}
        {user?.socialAnalyzed && !casData && !analyzing && (
          <div style={{ marginTop:14, padding:'12px 16px', background:'var(--s2)', borderRadius:10,
            border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--t3)', marginBottom:3 }}>Current CAS Score</div>
              <div style={{ fontSize:22, fontWeight:900, fontFamily:'var(--fd)',
                color:user.casScore>=75?'var(--acc2)':user.casScore>=50?'var(--gold)':'var(--rose)' }}>
                {user.casScore}/100
                <span style={{ fontSize:11, color:'var(--t3)', fontWeight:400, marginLeft:6 }}>({user.casBadge})</span>
              </div>
              <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>
                {user.analyzedAt ? `Last fetched: ${new Date(user.analyzedAt).toLocaleDateString('en-IN')}` : ''}
              </div>
            </div>
            <Btn variant="ghost" size="sm" onClick={analyzeProfile}
              style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
              <RefreshCw size={12}/> Refresh
            </Btn>
          </div>
        )}
      </div>

      {/* ── AUTO-FETCHED PLATFORM STATS (read-only display) ──── */}
      {(user?.platforms?.instagram?.followers > 0 || user?.platforms?.youtube?.followers > 0) && (
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h3 style={{ fontSize:13, fontWeight:700 }}>Platform Stats (Auto-fetched)</h3>
            <span style={{ fontSize:11, color:'var(--t3)', background:'var(--s2)',
              padding:'3px 10px', borderRadius:99, border:'1px solid var(--border)' }}>Read-only — updated by AI</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
            {[
              { platform:'instagram', icon:'📸', label:'Instagram', f:user.platforms?.instagram?.followers||0, e:user.platforms?.instagram?.engagement||0 },
              { platform:'youtube',   icon:'▶️', label:'YouTube',   f:user.platforms?.youtube?.followers||0,   e:user.platforms?.youtube?.engagement||0 },
            ].filter(p=>p.f>0).map(p=>(
              <div key={p.platform} style={{ background:'var(--s2)', borderRadius:'var(--r)', padding:14, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:12, fontWeight:700, marginBottom:10, color:'var(--t1)' }}>{p.icon} {p.label}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontSize:12, color:'var(--t2)' }}>
                    <span style={{ fontWeight:800, color:'var(--t1)', fontSize:15 }}>{p.f.toLocaleString('en-IN')}</span>
                    <span style={{ marginLeft:4 }}>followers</span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--t2)' }}>
                    <span style={{ fontWeight:800, color:'var(--acc2)', fontSize:15 }}>{p.e}%</span>
                    <span style={{ marginLeft:4 }}>engagement</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:11, color:'var(--t3)', marginTop:10 }}>
            These update automatically when you re-fetch your social profiles above.
          </p>
        </div>
      )}

      {/* ── BASIC INFO ────────────────────────────────────────── */}
      <div className="card" style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <h3 style={{ fontSize:13, fontWeight:700 }}>Basic Info</h3>
        <div className="grid-2" style={{ gap:12 }}>
          <Input label="Display Name" value={form.displayName} onChange={upd('displayName')} />
          <Input label="Avatar URL" value={form.avatar} onChange={upd('avatar')} placeholder="https://example.com/photo.jpg" hint="Paste a direct image URL" />
        </div>
        <Textarea label="Bio" value={form.bio} onChange={upd('bio')} placeholder="Tell brands about yourself, your audience and content style…" style={{ minHeight:80 }} />
        <div className="grid-2" style={{ gap:12 }}>
          <Input label="Location" value={form.location} onChange={upd('location')} placeholder="Mumbai, India" />
          <Input label="Website / Portfolio" value={form.website} onChange={upd('website')} placeholder="https://yoursite.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Primary Niche</label>
          <select className="form-input" value={form.niche} onChange={upd('niche')}>
            <option value="">Select niche…</option>
            {NICHES.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
