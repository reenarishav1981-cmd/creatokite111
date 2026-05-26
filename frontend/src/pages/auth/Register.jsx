import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Btn, Input } from '../../components/ui';
import toast from 'react-hot-toast';
import { Zap, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const NICHES = ['Tech','Beauty','Fashion','Fitness','Food','Travel','Gaming','Education','Finance','Lifestyle','Music','Art','Other'];

const STEPS = [
  { icon:'🔍', label:'Fetching your social profile...'   },
  { icon:'📊', label:'Analyzing engagement metrics...'   },
  { icon:'👥', label:'Checking audience authenticity...' },
  { icon:'📈', label:'Calculating reach & growth...'     },
  { icon:'🛡️', label:'Running brand safety check...'    },
  { icon:'🤖', label:'Computing Creator Score...'        },
];

const SCORE_COLORS = {
  ELITE:    '#fbbf24',
  VERIFIED: 'var(--acc2)',
  STANDARD: 'var(--p2)',
  REVIEW:   'var(--gold)',
};

function ScoreMini({ score, badge }) {
  const color = score>=75?'var(--acc2)':score>=50?'var(--gold)':'var(--rose)';
  const r=28, circ=2*Math.PI*r;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
        <svg width={72} height={72} viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6"/>
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 36 36)" style={{ transition:'stroke-dasharray 1.4s ease' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:17, fontWeight:900, fontFamily:'var(--fd)', color }}>{score}</span>
          <span style={{ fontSize:7, color:'var(--t3)', fontWeight:700, letterSpacing:0.5 }}>CAS</span>
        </div>
      </div>
      <div>
        <span style={{ display:'inline-block', fontSize:11, padding:'2px 10px', borderRadius:99, fontWeight:800,
          marginBottom:5, color:SCORE_COLORS[badge]||'var(--t2)',
          background:`${SCORE_COLORS[badge]||'gray'}15`, border:`1px solid ${SCORE_COLORS[badge]||'gray'}30` }}>
          {badge==='ELITE'?'⭐ ELITE':badge==='VERIFIED'?'✔ VERIFIED':badge==='STANDARD'?'✦ STANDARD':'⚠ REVIEW'}
        </span>
        <p style={{ fontSize:11, color:'var(--t2)', lineHeight:1.5, margin:0 }}>
          {score>=75
            ? '🎉 Auto-approved! You\'re ready to get assigned to campaigns.'
            : '⏳ Pending admin review — usually within 24h. You\'ll get a notification.'}
        </p>
      </div>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [params]     = useSearchParams();

  // step 1=basic, 2=social, 3=analyzing, 4=success
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [result,  setResult]  = useState(null); // { user, socialResult }

  const [form, setForm] = useState({
    displayName:'', email:'', password:'', role: params.get('role')||'creator',
    niche:'', companyName:'', handle:'',
    instagramUrl:'', youtubeUrl:'',
  });
  const upd = k => e => setForm(p=>({ ...p, [k]:e.target.value }));

  /* ── Step 1 submit ── */
  const handleStep1 = async e => {
    e.preventDefault();
    if (!form.displayName||!form.email||!form.password) return toast.error('Fill all required fields');
    if (form.password.length<6) return toast.error('Password min 6 characters');
    if (form.role==='brand') { await doRegister({}); } // brands skip social step
    else setStep(2);
  };

  /* ── Step 2 submit (with social URLs) ── */
  const handleStep2 = async e => {
    e.preventDefault();
    if (!form.instagramUrl && !form.youtubeUrl) {
      toast.error('Enter at least one social URL, or click "Skip".');
      return;
    }
    await doRegisterWithAnimation();
  };

  /* ── Register without social analysis ── */
  async function doRegister(extras={}) {
    setLoading(true);
    try {
      const { user } = await register({ ...form, ...extras });
      toast.success(`Welcome to Creatokite, ${user.displayName}! 🚀`);
      navigate(`/${user.role}/dashboard`, { replace:true });
    } catch(err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  /* ── Register WITH social analysis + animation ── */
  async function doRegisterWithAnimation() {
    setStep(3);
    setStepIdx(0);
    const interval = setInterval(() => {
      setStepIdx(p => p < STEPS.length-1 ? p+1 : p);
    }, 950);

    try {
      const data = await register(form); // { user, socialResult }
      clearInterval(interval);
      await new Promise(r => setTimeout(r, 500));
      setResult(data);
      setStep(4);
    } catch(err) {
      clearInterval(interval);
      setStep(2);
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  }

  const card = { background:'var(--s1)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:28 };

  /* ── STEP 1: Basic Info ─────────────────────────────────────── */
  if (step===1) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,var(--p),var(--acc))',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,margin:'0 auto 14px' }}>⚡</div>
          <h1 style={{ fontFamily:'var(--fd)', fontSize:22, fontWeight:800 }}>Create your account</h1>
          <p style={{ color:'var(--t2)', fontSize:13, marginTop:4 }}>Join India's AI-Powered Creator Campaign OS</p>
        </div>

        <div style={card}>
          {/* Role pills */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
            {[['creator','✨ Creator','Earn from brand campaigns'],['brand','🏢 Brand','Run AI-powered campaigns']].map(([r,label,sub])=>(
              <div key={r} onClick={()=>setForm(p=>({...p,role:r}))}
                style={{ padding:'12px', borderRadius:'var(--r)', cursor:'pointer', transition:'all 0.15s',
                  background:form.role===r?'rgba(108,99,255,0.12)':'rgba(255,255,255,0.03)',
                  border:form.role===r?'1px solid rgba(108,99,255,0.4)':'1px solid var(--border)' }}>
                <div style={{ fontSize:13, fontWeight:600, color:form.role===r?'var(--p2)':'var(--t1)', marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>{sub}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleStep1} style={{ display:'flex', flexDirection:'column', gap:13 }}>
            <Input label="Full Name *" value={form.displayName} onChange={upd('displayName')} placeholder="Priya Sharma" required />
            <Input label="Email *" type="email" value={form.email} onChange={upd('email')} placeholder="you@example.com" required />
            <Input label="Password *" type="password" value={form.password} onChange={upd('password')} placeholder="Min 6 characters" required />

            {form.role==='creator' && (
              <>
                <Input label="Username / Handle" value={form.handle} onChange={upd('handle')} placeholder="priyatech" hint="Optional — your public @handle" />
                <div className="form-group">
                  <label className="form-label">Creator Niche *</label>
                  <select className="form-input" value={form.niche} onChange={upd('niche')}>
                    <option value="">Select your niche</option>
                    {NICHES.map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </>
            )}
            {form.role==='brand' && (
              <Input label="Company Name" value={form.companyName} onChange={upd('companyName')} placeholder="Your Company Pvt Ltd" />
            )}

            <Btn variant="primary" className="w-full btn-lg" type="submit" disabled={loading}
              style={{ marginTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              {loading ? 'Creating…' :
                form.role==='creator'
                  ? <><span>Next: Connect Social Profile</span><ArrowRight size={14}/></>
                  : <><span>Create Brand Account</span><ArrowRight size={14}/></>
              }
            </Btn>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--t2)', marginTop:16 }}>
            Already have an account? <Link to="/login" style={{ color:'var(--p2)', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );

  /* ── STEP 2: Social Profiles ────────────────────────────────── */
  if (step===2) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:480 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,var(--p),var(--acc))',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,margin:'0 auto 14px' }}>⚡</div>
          <h1 style={{ fontFamily:'var(--fd)', fontSize:20, fontWeight:800 }}>Connect Your Social Profiles</h1>
          <p style={{ color:'var(--t2)', fontSize:13, marginTop:4 }}>
            AI auto-fetches your real followers, likes & engagement — no manual entry
          </p>
        </div>

        {/* Benefits row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[['📊','Auto CAS Score','AI scores your performance'],
            ['🛡️','Brand Verified','Get trust badge instantly'],
            ['🎯','Better Campaigns','Matched to best campaigns']].map(([icon,title,sub])=>(
            <div key={title} style={{ background:'rgba(108,99,255,0.07)', border:'1px solid rgba(108,99,255,0.15)',
              borderRadius:10, padding:'12px 8px', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--t1)' }}>{title}</div>
              <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={card}>
          <form onSubmit={handleStep2} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">
                📸 Instagram URL or @username
                <span style={{ color:'var(--rose)', marginLeft:4 }}>*</span>
              </label>
              <input className="form-input" value={form.instagramUrl} onChange={upd('instagramUrl')}
                placeholder="instagram.com/yourhandle  or  @yourhandle" />
              <span className="form-hint">e.g. instagram.com/priyabeauty</span>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              <span style={{ fontSize:11, color:'var(--t3)', whiteSpace:'nowrap' }}>AND / OR</span>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            </div>

            <div className="form-group">
              <label className="form-label">▶ YouTube Channel URL or @handle</label>
              <input className="form-input" value={form.youtubeUrl} onChange={upd('youtubeUrl')}
                placeholder="youtube.com/@yourchannel  or  @yourchannel" />
              <span className="form-hint">e.g. youtube.com/@priyatech</span>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button type="button" onClick={()=>setStep(1)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'10px 14px',
                  background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--r)',
                  color:'var(--t2)', cursor:'pointer', fontSize:13 }}>
                <ArrowLeft size={13}/> Back
              </button>
              <Btn variant="primary" type="submit"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                <Zap size={14}/> Analyze & Create Account
              </Btn>
            </div>

            <button type="button" onClick={()=>doRegister({})}
              style={{ background:'none', border:'none', color:'var(--t3)', fontSize:12,
                cursor:'pointer', textDecoration:'underline', textAlign:'center' }}>
              Skip — I'll add social profiles from Profile page later
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  /* ── STEP 3: Analyzing animation ────────────────────────────── */
  if (step===3) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:380, textAlign:'center' }}>
        <div style={{ width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,var(--p),var(--acc))',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,margin:'0 auto 20px' }}>⚡</div>
        <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:19, marginBottom:6 }}>Analyzing your profile…</h2>
        <p style={{ color:'var(--t2)', fontSize:13, marginBottom:28 }}>Creating account and computing your AI score</p>

        <div style={{ ...card, textAlign:'left' }}>
          {STEPS.map((s,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0',
              opacity:i<=stepIdx?1:0.2, transition:'opacity 0.4s ease' }}>
              <span style={{ fontSize:18, width:24, textAlign:'center' }}>{s.icon}</span>
              <span style={{ fontSize:13, fontWeight:i===stepIdx?700:400,
                color:i<stepIdx?'var(--acc2)':i===stepIdx?'var(--p2)':'var(--t3)', transition:'color 0.3s' }}>
                {i<stepIdx?'✓ ':i===stepIdx?'→ ':''}{s.label}
              </span>
              {i<stepIdx&&<CheckCircle size={13} style={{ color:'var(--acc2)', marginLeft:'auto', flexShrink:0 }}/>}
            </div>
          ))}
        </div>
        <p style={{ marginTop:18, fontSize:11, color:'var(--t3)' }}>
          Registering your account + fetching real social data simultaneously…
        </p>
      </div>
    </div>
  );

  /* ── STEP 4: Success ─────────────────────────────────────────── */
  const sr = result?.socialResult;
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:52, marginBottom:10 }}>🎉</div>
          <h1 style={{ fontFamily:'var(--fd)', fontSize:20, fontWeight:800 }}>
            Welcome, {result?.user?.displayName}!
          </h1>
          <p style={{ color:'var(--t2)', fontSize:13, marginTop:4 }}>Your CreatoKite creator profile is ready.</p>
        </div>

        <div style={card}>
          {sr ? (
            <>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--t3)', letterSpacing:0.5, marginBottom:14 }}>
                YOUR CREATOR AUTOMATION SCORE
              </p>
              <ScoreMini score={sr.cas} badge={sr.badge}/>

              {/* Quick platform stats */}
              {(sr.igData||sr.ytData) && (
                <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {[sr.igData,sr.ytData].filter(Boolean).flatMap(d=>[
                    { label:'Followers', val:(d.followers||0).toLocaleString('en-IN') },
                    { label:'Avg Likes', val:(d.avgLikes||0).toLocaleString('en-IN') },
                    { label:'Eng. Rate', val:`${d.er||0}%` },
                  ]).slice(0,3).map(({ label, val })=>(
                    <div key={label} style={{ background:'var(--s2)', border:'1px solid var(--border)',
                      borderRadius:8, padding:'9px', textAlign:'center' }}>
                      <div style={{ fontSize:14, fontWeight:800, color:'var(--t1)' }}>{val}</div>
                      <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop:14, padding:'11px 14px', borderRadius:10, fontSize:12, lineHeight:1.6,
                background:sr.autoApprove?'rgba(52,211,153,0.08)':'rgba(108,99,255,0.08)',
                border:`1px solid ${sr.autoApprove?'rgba(52,211,153,0.2)':'rgba(108,99,255,0.2)'}`,
                color:sr.autoApprove?'var(--acc2)':'var(--p2)' }}>
                {sr.autoApprove
                  ? '✔ Auto-approved! You can now be assigned to brand campaigns immediately.'
                  : '⏳ Admin will review and approve your profile. You\'ll get a notification within 24h.'}
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'10px 0', color:'var(--t2)', fontSize:13 }}>
              Account created! Go to Profile to connect your social accounts and get your CAS score.
            </div>
          )}

          <Btn variant="primary" onClick={()=>navigate('/creator/dashboard', { replace:true })}
            style={{ width:'100%', marginTop:20, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
            Go to Dashboard <ArrowRight size={14}/>
          </Btn>
        </div>
      </div>
    </div>
  );
}
