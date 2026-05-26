import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { campaignsAPI } from '../../api';
import { Btn, Input, Textarea } from '../../components/ui';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';

const NICHES      = ['Tech','Beauty','Fashion','Fitness','Food','Travel','Gaming','Education','Finance','Lifestyle','Music','Art','Other'];
const PLATFORMS   = ['instagram','youtube','twitter','tiktok'];
const DELIVERABLES= ['Instagram Reel','Instagram Post','Instagram Story','YouTube Video','YouTube Shorts','Twitter Post','TikTok Video'];
const GOALS       = ['Brand Awareness','Product Launch','App Downloads','Website Traffic','Lead Generation','Sales Conversion','Community Growth','Event Promotion'];
const AUDIENCES   = ['Gen Z (18-24)','Millennials (25-34)','Adults (35-44)','Pan India','Metro Cities','Tier 2 Cities','Students','Working Professionals'];

const STEPS = ['Campaign Brief','Requirements','Budget & Timeline','Review'];

export default function CreateCampaign() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [step, setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [tag, setTag]     = useState('');
  const [form, setForm] = useState({
    title:'', description:'', niche:'', campaignGoal:'', targetAudience:'',
    platforms:[], deliverables:[], tags:[], contentGuidelines:'',
    budget:'', budgetType:'fixed', totalSlots:'5',
    minFollowers:'1000', minEngagement:'0', deadline:'',
    isPremium:false,
    kpiTargets:{ reach:'', impressions:'', engagement:'', conversions:'' },
  });

  const upd     = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const updKpi  = k => e => setForm(p=>({...p,kpiTargets:{...p.kpiTargets,[k]:e.target.value}}));
  const toggleArr = (k,v) => setForm(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));
  const addTag = () => { const t=tag.trim(); if(t&&!form.tags.includes(t)){setForm(p=>({...p,tags:[...p.tags,t]}));setTag('');} };

  const canNext = () => {
    if (step===0) return form.title&&form.description&&form.niche&&form.campaignGoal;
    if (step===1) return form.deliverables.length>0&&form.platforms.length>0;
    if (step===2) return form.budget&&form.deadline;
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await campaignsAPI.create({
        ...form, budget:+form.budget, totalSlots:+form.totalSlots,
        minFollowers:+form.minFollowers, minEngagement:+form.minEngagement,
        kpiTargets:{ reach:+form.kpiTargets.reach||0, impressions:+form.kpiTargets.impressions||0,
                     engagement:+form.kpiTargets.engagement||0, conversions:+form.kpiTargets.conversions||0 },
        workflowStatus:'brand_submitted',
      });
      toast.success('🚀 Campaign brief submitted! Our team will review and assign creators shortly.');
      navigate('/brand/dashboard');
    } catch(e) { toast.error(e.response?.data?.message||e.response?.data?.errors?.[0]?.msg||'Submission failed'); }
    finally { setSaving(false); }
  };

  const chip = active => ({
    display:'inline-flex', alignItems:'center', padding:'6px 13px', borderRadius:100,
    fontSize:12, cursor:'pointer', userSelect:'none', transition:'all .15s',
    background: active?'rgba(108,99,255,0.18)':'rgba(255,255,255,0.04)',
    border: active?'1px solid rgba(108,99,255,0.5)':'1px solid var(--border2)',
    color: active?'var(--p2)':'var(--t2)', fontWeight: active?600:400,
  });

  const minDate = new Date(Date.now()+86400000).toISOString().split('T')[0];

  return (
    <div className="page-enter" style={{ maxWidth:800, margin:'0 auto' }}>
      <button className="btn btn-ghost btn-sm mb-16" onClick={()=>navigate(-1)}><ArrowLeft size={13}/> Back</button>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontFamily:'var(--fd)', fontSize:20, fontWeight:800, marginBottom:6 }}>Submit Campaign Brief</h2>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Tell us your goals. Our AI + team finds and assigns the best creators — no browsing needed.</p>
      </div>

      {/* Steps */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:28, gap:0 }}>
        {STEPS.map((s,i)=>(
          <div key={s} style={{ display:'flex', alignItems:'center', flex:1 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex:1 }}>
              <div style={{ width:30,height:30,borderRadius:'50%',fontSize:12,fontWeight:700,
                display:'flex',alignItems:'center',justifyContent:'center',
                background:i<step?'var(--acc2)':i===step?'var(--p)':'rgba(255,255,255,0.06)',
                border:i===step?'2px solid var(--p2)':'1px solid rgba(255,255,255,0.1)',
                color:(i<=step)?'#fff':'var(--t3)', boxShadow:i===step?'0 0 12px rgba(108,99,255,0.4)':'',
                transition:'all .3s' }}>
                {i<step?'✓':i+1}
              </div>
              <span style={{ fontSize:10,color:i<=step?'var(--p2)':'var(--t3)',textAlign:'center',lineHeight:1.2,maxWidth:72 }}>{s}</span>
            </div>
            {i<STEPS.length-1&&<div style={{ flex:1,height:1,background:i<step?'var(--acc2)':'rgba(255,255,255,0.08)',margin:'0 4px',marginBottom:20,transition:'background .3s' }}/>}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {/* STEP 0 */}
        {step===0&&(
          <>
            <div className="card" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <h3 style={{ fontSize:13, fontWeight:700 }}>🎯 Campaign Identity</h3>
              <Input label="Campaign Title *" value={form.title} onChange={upd('title')} placeholder="e.g. OnePlus 13R Launch — Tech Unboxing" />
              <Textarea label="Campaign Description *" value={form.description} onChange={upd('description')} placeholder="Describe your brand, product, key messages and what you expect creators to do…" style={{minHeight:110}} />
              <div className="form-group">
                <label className="form-label">Primary Goal *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:4 }}>
                  {GOALS.map(g=><button key={g} onClick={()=>setForm(p=>({...p,campaignGoal:g}))} style={chip(form.campaignGoal===g)}>{g}</button>)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:4 }}>
                  {AUDIENCES.map(a=><button key={a} onClick={()=>setForm(p=>({...p,targetAudience:a}))} style={chip(form.targetAudience===a)}>{a}</button>)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Creator Niche *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:4 }}>
                  {NICHES.map(n=><button key={n} onClick={()=>setForm(p=>({...p,niche:n}))} style={chip(form.niche===n)}>{n}</button>)}
                </div>
              </div>
            </div>
            <div className="card" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <h3 style={{ fontSize:13, fontWeight:700 }}>📊 KPI Targets <span style={{fontSize:11,color:'var(--t3)',fontWeight:400}}>{' — Optional'}</span></h3>
              <div className="grid-2" style={{ gap:10 }}>
                <Input label="Target Reach" type="number" value={form.kpiTargets.reach} onChange={updKpi('reach')} placeholder="500000" />
                <Input label="Target Impressions" type="number" value={form.kpiTargets.impressions} onChange={updKpi('impressions')} placeholder="1000000" />
                <Input label="Target Engagement" type="number" value={form.kpiTargets.engagement} onChange={updKpi('engagement')} placeholder="50000" />
                <Input label="Target Conversions" type="number" value={form.kpiTargets.conversions} onChange={updKpi('conversions')} placeholder="1000" />
              </div>
            </div>
          </>
        )}

        {/* STEP 1 */}
        {step===1&&(
          <>
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Platforms *</h3>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {PLATFORMS.map(p=><button key={p} onClick={()=>toggleArr('platforms',p)} style={chip(form.platforms.includes(p))} className="capitalize">{p}</button>)}
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Deliverables *</h3>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {DELIVERABLES.map(d=><button key={d} onClick={()=>toggleArr('deliverables',d)} style={chip(form.deliverables.includes(d))}>{d}</button>)}
              </div>
            </div>
            <div className="card" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <h3 style={{ fontSize:13, fontWeight:700 }}>Creator Requirements</h3>
              <div className="grid-2" style={{ gap:10 }}>
                <Input label="Min Followers" type="number" value={form.minFollowers} onChange={upd('minFollowers')} />
                <Input label="Min Engagement %" type="number" step="0.1" value={form.minEngagement} onChange={upd('minEngagement')} />
                <Input label="Creator Slots" type="number" value={form.totalSlots} onChange={upd('totalSlots')} hint="How many creators to assign" />
              </div>
              <Textarea label="Content Guidelines" value={form.contentGuidelines} onChange={upd('contentGuidelines')} placeholder="Dos, don'ts, hashtags, tone, reference links…" style={{minHeight:90}} />
            </div>
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Tags</h3>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                {form.tags.map(t=>(
                  <span key={t} style={{ display:'flex',alignItems:'center',gap:4,padding:'3px 9px',background:'rgba(108,99,255,0.1)',border:'1px solid rgba(108,99,255,0.2)',borderRadius:6,fontSize:11 }}>
                    {t}<X size={9} style={{cursor:'pointer'}} onClick={()=>setForm(p=>({...p,tags:p.tags.filter(x=>x!==t)}))}/>
                  </span>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={tag} onChange={e=>setTag(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()} placeholder="Add a tag…" className="form-input" style={{flex:1}} />
                <Btn size="sm" variant="secondary" onClick={addTag}><Plus size={12}/></Btn>
              </div>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step===2&&(
          <div className="card" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <h3 style={{ fontSize:13, fontWeight:700 }}>💰 Budget & Timeline</h3>
            <div className="grid-2" style={{ gap:10 }}>
              <Input label="Total Budget (₹) *" type="number" value={form.budget} onChange={upd('budget')} placeholder="50000" min="500" />
              <div className="form-group">
                <label className="form-label">Budget Type</label>
                <select className="form-input" value={form.budgetType} onChange={upd('budgetType')}>
                  <option value="fixed">Fixed Total</option>
                  <option value="per_post">Per Post</option>
                  <option value="negotiable">Negotiable</option>
                </select>
              </div>
            </div>
            <Input label="Deadline *" type="date" value={form.deadline} onChange={upd('deadline')} min={minDate} />
            {form.budget&&form.totalSlots&&(
              <div style={{ padding:'12px 14px',background:'rgba(0,255,163,0.06)',border:'1px solid rgba(0,255,163,0.15)',borderRadius:8,fontSize:12,color:'var(--acc2)' }}>
                💰 ₹{Math.floor(+form.budget/+form.totalSlots).toLocaleString('en-IN')} per creator · {form.totalSlots} slots
              </div>
            )}
            <div onClick={()=>setForm(p=>({...p,isPremium:!p.isPremium}))}
              style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:'rgba(245,166,35,0.05)',border:'1px solid rgba(245,166,35,0.15)',borderRadius:8,cursor:'pointer' }}>
              <div>
                <div style={{ fontSize:13,color:'var(--gold)',fontWeight:600 }}>⭐ Premium Campaign</div>
                <div style={{ fontSize:11,color:'var(--t3)',marginTop:2 }}>Priority review, featured placement, dedicated account manager</div>
              </div>
              <div style={{ width:38,height:20,borderRadius:10,background:form.isPremium?'var(--gold)':'rgba(255,255,255,0.1)',position:'relative',transition:'background .2s',flexShrink:0 }}>
                <div style={{ position:'absolute',width:14,height:14,borderRadius:'50%',background:'white',top:3,left:form.isPremium?21:3,transition:'left .2s' }}/>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step===3&&(
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ padding:'18px 20px',background:'rgba(108,99,255,0.06)',border:'1px solid rgba(108,99,255,0.18)',borderRadius:12 }}>
              <div style={{ fontWeight:700,fontSize:13,marginBottom:14 }}>📋 Campaign Summary</div>
              <div className="grid-2" style={{ gap:8 }}>
                {[['Title',form.title],['Goal',form.campaignGoal],['Niche',form.niche],['Audience',form.targetAudience],['Budget',`₹${(+form.budget||0).toLocaleString('en-IN')}`],['Slots',form.totalSlots],['Platforms',form.platforms.join(', ')],['Deadline',form.deadline]].map(([k,v])=>(
                  <div key={k} style={{ fontSize:12 }}><span style={{color:'var(--t2)'}}>{k}: </span><span style={{color:'var(--t1)',fontWeight:600}}>{v||'—'}</span></div>
                ))}
              </div>
            </div>
            <div style={{ padding:'16px 18px',background:'rgba(0,255,163,0.04)',border:'1px solid rgba(0,255,163,0.15)',borderRadius:12 }}>
              <div style={{ fontSize:13,color:'var(--acc2)',fontWeight:700,marginBottom:8 }}>⚡ What happens next?</div>
              {['Admin team reviews your brief (4-6 hours)','AI analyzes 12,000+ creators for best match','Top creators are bulk-assigned to your campaign','Creators notified and begin creating content','Real-time progress tracked in your dashboard'].map((s,i)=>(
                <div key={i} style={{ fontSize:12,color:'var(--t2)',marginBottom:5,display:'flex',gap:8 }}><span style={{color:'var(--acc2)',flexShrink:0}}>{i+1}.</span>{s}</div>
              ))}
            </div>
            <p style={{ fontSize:11,color:'var(--t3)',textAlign:'center' }}>You will never need to contact creators directly. Our platform manages everything end-to-end.</p>
          </div>
        )}

        {/* Nav */}
        <div className="flex-between" style={{ paddingTop:6 }}>
          <Btn variant="ghost" onClick={()=>step===0?navigate(-1):setStep(s=>s-1)}><ArrowLeft size={13}/> {step===0?'Cancel':'Back'}</Btn>
          {step<3
            ? <Btn variant="primary" onClick={()=>setStep(s=>s+1)} disabled={!canNext()}>Next Step →</Btn>
            : <Btn variant="primary" onClick={handleSubmit} disabled={saving}>{saving?'Submitting…':'🚀 Submit Campaign Brief'}</Btn>
          }
        </div>
      </div>
    </div>
  );
}
