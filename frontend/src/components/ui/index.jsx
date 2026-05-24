import { useState, forwardRef } from 'react';

/* ── Spinner / Loader ──────────────────────────── */
export function Spinner({ size=32 }) {
  return <div className="spinner" style={{ width:size, height:size }} />;
}
export function PageLoader() {
  return <div className="page-loader"><Spinner size={40} /></div>;
}

/* ── Button ────────────────────────────────────── */
export function Btn({ variant='secondary', size='', className='', children, ...props }) {
  return (
    <button className={`btn btn-${variant}${size?` btn-${size}`:''} ${className}`} {...props}>
      {children}
    </button>
  );
}

/* ── Input ─────────────────────────────────────── */
export const Input = forwardRef(function Input({ label, hint, error, className='', ...props }, ref) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input ref={ref} className={`form-input ${className}`} {...props} />
      {hint  && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

/* ── Textarea ───────────────────────────────────── */
export const Textarea = forwardRef(function Textarea({ label, hint, error, className='', ...props }, ref) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea ref={ref} className={`form-input form-textarea ${className}`} {...props} />
      {hint  && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

/* ── Select ─────────────────────────────────────── */
export const Select = forwardRef(function Select({ label, hint, children, className='', ...props }, ref) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select ref={ref} className={`form-input ${className}`} style={{ cursor:'pointer' }} {...props}>
        {children}
      </select>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
});

/* ── Stat Card ──────────────────────────────────── */
export function StatCard({ label, value, icon: Icon, color='var(--p2)', sub, trend }) {
  return (
    <div className="stat-card">
      <div className="flex-between">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div style={{ width:34,height:34,borderRadius:10,background:`${color}18`,
            display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Icon size={16} style={{ color }} />
          </div>
        )}
      </div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize:11, color:'var(--t3)' }}>{sub}</div>}
      {trend && (
        <div style={{ fontSize:11, color:trend==='up'?'var(--acc2)':'var(--rose)', display:'flex', alignItems:'center', gap:3 }}>
          {trend==='up' ? '↑' : '↓'} {trend==='up' ? 'Growing' : 'Declining'}
        </div>
      )}
    </div>
  );
}

/* ── Avatar ─────────────────────────────────────── */
export function Avatar({ src, name='?', size=36, className='' }) {
  const [err, setErr] = useState(false);
  const initials = name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';
  return src&&!err ? (
    <img src={src} alt={name} onError={()=>setErr(true)}
      className={`avatar ${className}`} style={{ width:size,height:size,fontSize:size*0.35 }} />
  ) : (
    <div className={`avatar ${className}`}
      style={{ width:size,height:size,fontSize:size*0.35,flexShrink:0 }}>{initials}</div>
  );
}

/* ── Status Badge ───────────────────────────────── */
const STATUS_MAP = {
  brand_submitted:  { label:'Pending Review', cls:'badge-gold'  },
  admin_review:     { label:'AI Analyzing',   cls:'badge-blue'  },
  ai_analyzing:     { label:'AI Analyzing',   cls:'badge-blue'  },
  creators_assigned:{ label:'Creators Set',   cls:'badge-green' },
  in_progress:      { label:'In Progress',    cls:'badge-purple'},
  revision:         { label:'Revision',       cls:'badge-red'   },
  completed:        { label:'Completed',      cls:'badge-green' },
  cancelled:        { label:'Cancelled',      cls:'badge-gray'  },
  open:             { label:'Open',           cls:'badge-green' },
  draft:            { label:'Draft',          cls:'badge-gray'  },
  assigned:         { label:'Assigned',       cls:'badge-gold'  },
  accepted:         { label:'Accepted',       cls:'badge-green' },
  submitted:        { label:'Submitted',      cls:'badge-blue'  },
  approved:         { label:'Approved',       cls:'badge-green' },
  rejected:         { label:'Rejected',       cls:'badge-red'   },
  creator:          { label:'Creator',        cls:'badge-purple'},
  brand:            { label:'Brand',          cls:'badge-blue'  },
  admin:            { label:'Admin',          cls:'badge-gold'  },
  Bronze:           { label:'Bronze',         cls:'badge-gray'  },
  Silver:           { label:'Silver',         cls:'badge-gray'  },
  Gold:             { label:'Gold',           cls:'badge-gold'  },
  Platinum:         { label:'Platinum',       cls:'badge-blue'  },
  Diamond:          { label:'Diamond',        cls:'badge-purple'},
  Legend:           { label:'Legend 👑',      cls:'badge-gold'  },
};
export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label:status, cls:'badge-gray' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

/* ── Score Ring ─────────────────────────────────── */
export function ScoreRing({ score=0, size=80, color='var(--p)' }) {
  const r=34, circ=2*Math.PI*r, fill=(score/1000)*circ;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border2)" strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" style={{ transition:'stroke-dasharray 0.8s ease' }}/>
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,
        fontFamily:'var(--fd)',color }}>
        {score}
      </div>
    </div>
  );
}

/* ── Empty State ────────────────────────────────── */
export function EmptyState({ icon='📭', title='Nothing here', desc='', action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
      {action}
    </div>
  );
}

/* ── Modal ──────────────────────────────────────── */
export function Modal({ open, onClose, title, children, maxWidth=520 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',
      display:'flex',alignItems:'center',justifyContent:'center',
      zIndex:2000,padding:16,backdropFilter:'blur(4px)',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'var(--s2)',border:'1px solid var(--border2)',borderRadius:'var(--r2)',
        width:'100%',maxWidth,padding:24,animation:'fadeUp 0.2s ease',maxHeight:'90vh',overflow:'auto',
      }}>
        {title && (
          <div className="flex-between mb-16">
            <h3 style={{ fontFamily:'var(--fd)',fontSize:16,fontWeight:700 }}>{title}</h3>
            <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ fontSize:18 }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Search Bar ─────────────────────────────────── */
export function SearchBar({ value, onChange, placeholder='Search…', style={} }) {
  return (
    <div style={{ position:'relative', ...style }}>
      <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',fontSize:14 }}>🔍</span>
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="form-input" style={{ paddingLeft:36 }} />
    </div>
  );
}

/* ── Workflow Pipeline ──────────────────────────── */
const WF_STEPS = [
  { key:'brand_submitted', label:'Brief Submitted' },
  { key:'admin_review',    label:'AI Analysis'     },
  { key:'creators_assigned',label:'Creators Set'   },
  { key:'in_progress',     label:'In Progress'     },
  { key:'completed',       label:'Completed'       },
];
export function WorkflowPipeline({ status }) {
  const normalised = status==='ai_analyzing'?'admin_review':status;
  const cur = WF_STEPS.findIndex(s=>s.key===normalised);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0 }}>
      {WF_STEPS.map((s,i)=>{
        const done=i<cur, active=i===cur;
        return (
          <div key={s.key} style={{ display:'flex', alignItems:'center', flex:1 }}>
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3,flex:1 }}>
              <div style={{
                width:24,height:24,borderRadius:'50%',fontSize:10,fontWeight:700,
                display:'flex',alignItems:'center',justifyContent:'center',
                background:done?'var(--acc2)':active?'var(--p)':'var(--border2)',
                border:active?'2px solid var(--p2)':'1px solid var(--border2)',
                color:done||active?'#fff':'var(--t3)',
                boxShadow:active?'0 0 10px rgba(255,107,87,0.5)':'none',
                transition:'all 0.3s',flexShrink:0,
              }}>{done?'✓':i+1}</div>
              <span style={{ fontSize:9,color:active?'var(--p2)':done?'var(--acc2)':'var(--t3)',textAlign:'center',lineHeight:1.2 }}>{s.label}</span>
            </div>
            {i<WF_STEPS.length-1&&<div style={{ height:1,width:12,background:done?'var(--acc2)':'var(--border2)',flexShrink:0,marginBottom:14,transition:'background 0.3s' }}/>}
          </div>
        );
      })}
    </div>
  );
}
