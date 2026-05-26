import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import { PageLoader, Avatar, Btn, EmptyState, StatCard } from '../../components/ui';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, RefreshCw, Users, Shield, AlertTriangle, Star } from 'lucide-react';

const BADGE_MAP = {
  ELITE:    { color:'#fbbf24', cls:'badge-gold'   },
  VERIFIED: { color:'var(--acc2)', cls:'badge-green' },
  STANDARD: { color:'var(--p2)',   cls:'badge-purple' },
  REVIEW:   { color:'var(--gold)', cls:'badge-gold'  },
};
const RISK_COLOR = { LOW:'var(--acc2)', MEDIUM:'var(--gold)', HIGH:'var(--rose)' };
const VS_MAP = {
  pending:  { label:'Pending',  cls:'badge-gold'   },
  approved: { label:'Approved', cls:'badge-green'  },
  rejected: { label:'Rejected', cls:'badge-red'    },
  none:     { label:'No Data',  cls:'badge-gray'   },
};

function CASMini({ score=0 }) {
  const color = score>=75?'var(--acc2)':score>=50?'var(--gold)':'var(--rose)';
  const r=16, circ=2*Math.PI*r;
  return (
    <div style={{ position:'relative', width:48, height:48, flexShrink:0 }}>
      <svg width={48} height={48} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 24 24)"/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:11, fontWeight:900, fontFamily:'var(--fd)', color }}>{score}</div>
    </div>
  );
}

function RejectModal({ creator, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const handle = async () => {
    setSaving(true);
    await onConfirm(note||'Profile does not meet quality standards.');
    setSaving(false);
    onClose();
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--s)', borderRadius:16, padding:24, maxWidth:420, width:'100%',
        border:'1px solid var(--border2)' }}>
        <h3 style={{ fontSize:15, fontWeight:800, marginBottom:8 }}>Reject {creator?.displayName}?</h3>
        <p style={{ color:'var(--t2)', fontSize:12, marginBottom:14 }}>Provide a reason — the creator will be notified.</p>
        <textarea className="form-input" value={note} onChange={e=>setNote(e.target.value)}
          placeholder="e.g. Engagement too low, suspicious follower spikes…"
          style={{ minHeight:80, marginBottom:14, width:'100%', boxSizing:'border-box' }}/>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="secondary" onClick={onClose} style={{ flex:1 }}>Cancel</Btn>
          <Btn variant="danger" onClick={handle} disabled={saving} style={{ flex:1 }}>
            {saving?'Rejecting…':'Reject Creator'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export default function AdminCreatorApproval() {
  const [creators, setCreators]   = useState([]);
  const [stats,    setStats]      = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [tab,      setTab]        = useState('pending'); // pending | all
  const [riskFilter, setRiskFilter] = useState('');
  const [page,     setPage]       = useState(1);
  const [total,    setTotal]      = useState(0);
  const [acting,   setActing]     = useState({}); // { [id]: true }
  const [rejectTarget, setRejectTarget] = useState(null);
  const [expandedId,   setExpandedId]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit:15, riskLevel:riskFilter||undefined };
    const call = tab==='pending'
      ? adminAPI.creatorsPending(params)
      : adminAPI.creatorsAll({ ...params, verificationStatus:'' });
    call
      .then(d => { setCreators(d.creators||[]); setTotal(d.total||0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, page, riskFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminAPI.creatorsStats()
      .then(d => setStats(d.stats))
      .catch(() => {});
  }, []);

  const approve = async (id) => {
    setActing(p=>({...p,[id]:true}));
    try {
      await adminAPI.creatorApprove(id);
      toast.success('Creator approved & notified! ✔');
      load();
    } catch(e) { toast.error('Approve failed'); }
    finally { setActing(p=>({...p,[id]:false})); }
  };

  const reject = async (id, note) => {
    setActing(p=>({...p,[id]:true}));
    try {
      await adminAPI.creatorReject(id, { note });
      toast.success('Creator rejected & notified.');
      load();
    } catch(e) { toast.error('Reject failed'); }
    finally { setActing(p=>({...p,[id]:false})); }
  };

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,rgba(108,99,255,0.1),rgba(0,217,255,0.04))',
        border:'1px solid rgba(108,99,255,0.2)', borderRadius:16, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:20 }}>🤖</span>
          <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18 }}>Creator AI Approval Center</h2>
          {stats?.pending>0 && (
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4,
              background:'rgba(245,166,35,0.15)', color:'var(--gold)', border:'1px solid rgba(245,166,35,0.25)', fontWeight:700 }}>
              {stats.pending} PENDING
            </span>
          )}
        </div>
        <p style={{ color:'var(--t2)', fontSize:13 }}>
          AI auto-analyzes each creator's social profiles. You only approve or reject.
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid-4">
          <StatCard label="Pending Approval" value={stats.pending} icon={Shield} color="var(--gold)" sub="Need review" />
          <StatCard label="Approved"         value={stats.approved} icon={CheckCircle} color="var(--acc2)" />
          <StatCard label="High Risk"        value={stats.highRisk} icon={AlertTriangle} color="var(--rose)" sub="Flag for rejection" />
          <StatCard label="Avg CAS Score"    value={`${stats.avgCas}/100`} icon={Star} color="var(--p2)" sub="Platform average" />
        </div>
      )}

      {/* Tabs + filters */}
      <div className="flex-between" style={{ flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:4 }}>
          {['pending','all'].map(t=>(
            <button key={t} onClick={()=>{ setTab(t); setPage(1); }} className={`btn btn-${tab===t?'primary':'secondary'} btn-sm`}
              style={{ textTransform:'capitalize' }}>{t==='pending'?`⏳ Pending${stats?.pending?` (${stats.pending})`:''}`:'📋 All Creators'}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select className="form-input" style={{ width:140 }} value={riskFilter} onChange={e=>{ setRiskFilter(e.target.value); setPage(1); }}>
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
          <Btn variant="secondary" size="sm" onClick={load}><RefreshCw size={12}/></Btn>
        </div>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : creators.length===0 ? (
        <EmptyState icon={tab==='pending'?'🎉':'👥'}
          title={tab==='pending'?'All caught up!':'No creators found'}
          desc={tab==='pending'?'No creators waiting for approval.':'Try changing filters.'} />
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>CAS Score</th>
                  <th>Risk</th>
                  <th>Badge</th>
                  <th>Followers</th>
                  <th>Status</th>
                  <th>Analyzed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {creators.map(c => {
                  const bm = BADGE_MAP[c.casBadge]||BADGE_MAP.REVIEW;
                  const vs = VS_MAP[c.verificationStatus]||VS_MAP.none;
                  const igF = c.platforms?.instagram?.followers||0;
                  const ytF = c.platforms?.youtube?.followers||0;
                  const totalF = igF+ytF;
                  const isExpanded = expandedId===c._id;
                  return [
                    <tr key={c._id} style={{ cursor:'pointer' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      {/* Creator */}
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <Avatar src={c.avatar} name={c.displayName} size={32}/>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{c.displayName}</div>
                            <div style={{ fontSize:11, color:'var(--t3)' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* CAS Ring */}
                      <td><CASMini score={c.casScore||0}/></td>
                      {/* Risk */}
                      <td>
                        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12,
                          color:RISK_COLOR[c.casRisk]||'var(--t2)', fontWeight:700 }}>
                          <span style={{ width:7, height:7, borderRadius:'50%', background:RISK_COLOR[c.casRisk]||'gray', display:'inline-block' }}/>
                          {c.casRisk||'—'}
                        </span>
                      </td>
                      {/* Badge */}
                      <td><span className={`badge ${bm.cls}`}>{c.casBadge||'—'}</span></td>
                      {/* Followers */}
                      <td style={{ fontSize:12, color:'var(--t2)' }}>
                        {totalF>0 ? (
                          <div>
                            {igF>0&&<div>📸 {igF.toLocaleString('en-IN')}</div>}
                            {ytF>0&&<div>▶ {ytF.toLocaleString('en-IN')}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      {/* Status */}
                      <td><span className={`badge ${vs.cls}`}>{vs.label}</span></td>
                      {/* Date */}
                      <td style={{ fontSize:11, color:'var(--t3)' }}>
                        {c.analyzedAt ? new Date(c.analyzedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      {/* Actions */}
                      <td>
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <button title="See score breakdown"
                            onClick={()=>setExpandedId(isExpanded?null:c._id)}
                            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)',
                              borderRadius:6, padding:'5px 7px', cursor:'pointer', color:'var(--t2)', display:'flex' }}>
                            <Eye size={13}/>
                          </button>
                          {c.verificationStatus==='pending' && <>
                            <button title="Approve" disabled={acting[c._id]}
                              onClick={()=>approve(c._id)}
                              style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)',
                                borderRadius:6, padding:'5px 8px', cursor:'pointer', color:'var(--acc2)', display:'flex',
                                opacity:acting[c._id]?0.5:1 }}>
                              <CheckCircle size={13}/>
                            </button>
                            <button title="Reject" disabled={acting[c._id]}
                              onClick={()=>setRejectTarget(c)}
                              style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)',
                                borderRadius:6, padding:'5px 8px', cursor:'pointer', color:'var(--rose)', display:'flex',
                                opacity:acting[c._id]?0.5:1 }}>
                              <XCircle size={13}/>
                            </button>
                          </>}
                          {c.verificationStatus==='rejected' && (
                            <Btn variant="ghost" size="sm" onClick={()=>approve(c._id)} disabled={acting[c._id]}>
                              Re-approve
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>,
                    /* Expanded score breakdown row */
                    isExpanded && (
                      <tr key={`${c._id}-expand`}>
                        <td colSpan={8} style={{ background:'rgba(108,99,255,0.04)', padding:'14px 20px' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                            {[
                              ['Engagement',    c.casBreakdown?.engagement,    'var(--p2)'],
                              ['Reach',         c.casBreakdown?.reach,         '#a78bfa'],
                              ['Authenticity',  c.casBreakdown?.authenticity,  'var(--acc2)'],
                              ['Consistency',   c.casBreakdown?.consistency,   'var(--gold)'],
                              ['Growth',        c.casBreakdown?.growth,        '#22d3ee'],
                              ['Brand Safety',  c.casBreakdown?.brandSafety,   'var(--acc)'],
                              ['Conversion',    c.casBreakdown?.conversion,    '#fb923c'],
                              ['Content Qual.', c.casBreakdown?.contentQuality,'#f472b6'],
                            ].map(([lbl,val,col])=>(
                              <div key={lbl} style={{ background:'var(--s)', borderRadius:8, padding:'10px 12px',
                                border:'1px solid var(--border)' }}>
                                <div style={{ fontSize:10, color:'var(--t3)', marginBottom:5 }}>{lbl}</div>
                                <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:99, marginBottom:6 }}>
                                  <div style={{ height:'100%', width:`${val||0}%`, background:col, borderRadius:99 }}/>
                                </div>
                                <div style={{ fontSize:14, fontWeight:800, color:col }}>{val||0}/100</div>
                              </div>
                            ))}
                          </div>
                          {(c.socialUrls?.instagram||c.socialUrls?.youtube) && (
                            <div style={{ marginTop:10, fontSize:11, color:'var(--t3)', display:'flex', gap:14 }}>
                              {c.socialUrls?.instagram&&<span>📸 {c.socialUrls.instagram}</span>}
                              {c.socialUrls?.youtube&&<span>▶ {c.socialUrls.youtube}</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total>15 && (
        <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
          <Btn variant="secondary" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
          <span style={{ display:'flex', alignItems:'center', fontSize:12, color:'var(--t2)' }}>
            Page {page} of {Math.ceil(total/15)}
          </span>
          <Btn variant="secondary" size="sm" disabled={page>=Math.ceil(total/15)} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal creator={rejectTarget}
          onClose={()=>setRejectTarget(null)}
          onConfirm={note=>reject(rejectTarget._id, note)} />
      )}
    </div>
  );
}
