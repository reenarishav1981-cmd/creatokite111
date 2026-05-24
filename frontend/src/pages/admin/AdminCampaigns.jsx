import { useState, useEffect } from 'react';
import { adminAPI, usersAPI } from '../../api';
import { PageLoader, StatusBadge, Avatar, Btn, Modal, WorkflowPipeline, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';
import { Zap, Users, CheckCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';

/* ── Creator Selector ──────────────────────────── */
function CreatorSelector({ campaign, onAssigned }) {
  const [loading,   setLoading]   = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(campaign.aiSuggestedCreators || []);
  const [allCreators, setAllCreators] = useState([]);
  const [selected,    setSelected]    = useState(new Set());
  const [allocs,      setAllocs]      = useState({});
  const [view,        setView]        = useState('ai'); // 'ai' | 'all'
  const [revNote,     setRevNote]     = useState('');
  const [adminNote,   setAdminNote]   = useState('');

  const alreadyIds = new Set((campaign.assignedCreators||[]).map(a=>a.creator?._id||a.creator));

  const runAI = async () => {
    setAnalyzing(true);
    try {
      const d = await adminAPI.analyzeAI(campaign._id);
      setSuggestions(d.suggestions || []);
      toast.success(`🤖 AI found ${d.suggestions?.length||0} matching creators!`);
    } catch(e) { toast.error(e.response?.data?.message||'AI analysis failed'); }
    finally { setAnalyzing(false); }
  };

  const loadAll = async () => {
    if (allCreators.length) { setView('all'); return; }
    const d = await usersAPI.creators({ limit:50 });
    setAllCreators(d.creators||[]);
    setView('all');
  };

  const toggle = id => setSelected(prev => { const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });

  const assign = async () => {
    if (!selected.size) return toast.error('Select at least one creator');
    setLoading(true);
    try {
      const perCreator = Math.floor(campaign.budget / (selected.size||1));
      const paymentAllocations = {};
      selected.forEach(id => { paymentAllocations[id] = allocs[id] || perCreator; });
      await adminAPI.assignCreators(campaign._id, {
        creatorIds: [...selected], paymentAllocations, adminNote,
      });
      toast.success(`✅ ${selected.size} creator(s) assigned! They've been notified.`);
      onAssigned();
    } catch(e) { toast.error(e.response?.data?.message||'Assignment failed'); }
    finally { setLoading(false); }
  };

  const displayList = view==='ai'
    ? suggestions.map(s=>({ ...(s.creator||s), _id:s.creator?._id||s.creator, matchScore:s.matchScore, reason:s.reason }))
    : allCreators;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* AI Analysis panel */}
      <div style={{ padding:'14px 16px', background:'rgba(108,99,255,0.06)', border:'1px solid rgba(108,99,255,0.2)', borderRadius:10 }}>
        <div className="flex-between" style={{ flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:13, color:'var(--p2)', marginBottom:3 }}>🤖 AI Creator Matching</div>
            <div style={{ fontSize:11, color:'var(--t2)' }}>
              {campaign.aiAnalysis?.analyzed
                ? `Analysis done · Predicted reach: ${(campaign.aiAnalysis.predictedReach/1000).toFixed(0)}K · Confidence: ${campaign.aiAnalysis.confidence}%`
                : 'Run AI to find best-matching creators from 12,000+ profiles'}
            </div>
          </div>
          <Btn variant="primary" size="sm" onClick={runAI} disabled={analyzing}>
            <Zap size={12}/> {analyzing?'Analyzing…':'Run AI Analysis'}
          </Btn>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={()=>setView('ai')} className={`chip${view==='ai'?' active':''}`} style={{fontSize:11}}>
          🤖 AI Suggestions ({suggestions.length})
        </button>
        <button onClick={loadAll} className={`chip${view==='all'?' active':''}`} style={{fontSize:11}}>
          👥 All Creators
        </button>
      </div>

      {/* Creator list */}
      <div style={{ maxHeight:380, overflow:'auto', display:'flex', flexDirection:'column', gap:8 }}>
        {displayList.length===0 ? (
          <div style={{ padding:24, textAlign:'center', color:'var(--t2)', fontSize:12 }}>
            {view==='ai' ? 'Run AI analysis to see creator suggestions' : 'No creators found'}
          </div>
        ) : displayList.map(c => {
          const cid = c._id;
          const isSelected  = selected.has(cid);
          const isAssigned   = alreadyIds.has(cid);
          const totalFol     = Object.values(c.platforms||{}).reduce((s,p)=>s+(p.followers||0),0);
          return (
            <div key={cid} onClick={()=>!isAssigned&&toggle(cid)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                borderRadius:10, border:'1px solid', cursor:isAssigned?'default':'pointer', transition:'all .15s',
                borderColor:isSelected?'rgba(108,99,255,0.5)':isAssigned?'rgba(0,255,163,0.3)':'var(--border)',
                background:isSelected?'rgba(108,99,255,0.08)':isAssigned?'rgba(0,255,163,0.04)':'rgba(255,255,255,0.02)' }}>
              <input type="checkbox" checked={isSelected||isAssigned} readOnly disabled={isAssigned}
                style={{accentColor:'var(--p)',cursor:isAssigned?'default':'pointer'}}/>
              <Avatar src={c.avatar} name={c.displayName} size={34}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600 }}>{c.displayName} {isAssigned&&<span style={{color:'var(--acc2)',fontSize:10}}>✓ Assigned</span>}</div>
                <div style={{ fontSize:11, color:'var(--t2)' }}>{c.niche} · {(totalFol/1000).toFixed(0)}K reach · Score {c.creatorScore||0}</div>
                {c.reason && <div style={{ fontSize:10, color:'var(--p2)', marginTop:2 }}>🤖 {c.reason}</div>}
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                {c.matchScore>0 && <div style={{ fontFamily:'var(--fd)',fontWeight:700,fontSize:13,color:c.matchScore>=80?'var(--acc2)':c.matchScore>=60?'var(--gold)':'var(--t2)'}}>{c.matchScore}%</div>}
                <div style={{ fontSize:10,color:'var(--t3)' }}>{c.rank||'Bronze'}</div>
              </div>
              {isSelected && (
                <input type="number" placeholder="₹" value={allocs[cid]||''}
                  onChange={e=>{ e.stopPropagation(); setAllocs(p=>({...p,[cid]:+e.target.value})); }}
                  onClick={e=>e.stopPropagation()}
                  style={{ width:80,padding:'4px 8px',background:'var(--s2)',border:'1px solid var(--border2)',borderRadius:6,color:'var(--t1)',fontSize:11,outline:'none' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Admin note */}
      <div className="form-group">
        <label className="form-label">Admin Note to Creators (optional)</label>
        <input value={adminNote} onChange={e=>setAdminNote(e.target.value)} className="form-input"
          placeholder="Any specific instructions for selected creators…" />
      </div>

      {/* Assign button */}
      <div className="flex-between" style={{ flexWrap:'wrap', gap:8 }}>
        <div style={{ fontSize:12, color:'var(--t2)' }}>
          {selected.size} creator{selected.size!==1?'s':''} selected · Budget: ₹{campaign.budget?.toLocaleString('en-IN')}
          {selected.size>0 && ` · ₹${Math.floor(campaign.budget/selected.size).toLocaleString('en-IN')} each`}
        </div>
        <Btn variant="primary" onClick={assign} disabled={loading||!selected.size}>
          <Users size={13}/> {loading?'Assigning…':`Assign ${selected.size} Creator(s)`}
        </Btn>
      </div>
    </div>
  );
}

/* ── Admin Campaigns Page ──────────────────────── */
export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [expanded,  setExpanded]  = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus,   setNewStatus]   = useState('');
  const [reviewNote,  setReviewNote]  = useState('');
  const [updBusy,     setUpdBusy]     = useState(false);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter!=='all') params.workflowStatus=filter;
    if (search) params.search=search;
    adminAPI.campaigns(params).then(d=>setCampaigns(d.campaigns||[])).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async () => {
    if (!newStatus) return;
    setUpdBusy(true);
    try {
      await adminAPI.updateCampaign(statusModal._id, { workflowStatus:newStatus, adminReviewNote:reviewNote });
      toast.success('Campaign status updated!');
      setStatusModal(null); load();
    } catch(e) { toast.error('Update failed'); }
    finally { setUpdBusy(false); }
  };

  if (loading) return <PageLoader />;

  const FILTERS = [
    ['all','All'],['brand_submitted','Pending'],['admin_review','AI Review'],
    ['creators_assigned','Assigned'],['in_progress','Active'],['completed','Done'],
  ];

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="flex-between" style={{ flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>Campaign Management</h2>
          <p style={{ color:'var(--t2)', fontSize:13 }}>Review briefs, run AI analysis, assign creators in bulk.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}
            placeholder="Search campaigns…" className="form-input" style={{width:200}}/>
          <Btn variant="secondary" size="sm" onClick={load}>Search</Btn>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {FILTERS.map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} className={`chip${filter===k?' active':''}`} style={{fontSize:11}}>{l}</button>
        ))}
      </div>

      {campaigns.length===0 ? (
        <EmptyState icon="📋" title="No campaigns found" desc="Try a different filter or wait for brands to submit." />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {campaigns.map(c => {
            const isExpanded = expanded===c._id;
            const ws = c.workflowStatus||'brand_submitted';
            return (
              <div key={c._id} style={{ background:'var(--s1)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', transition:'border-color .2s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>

                {/* Campaign header */}
                <div style={{ padding:'16px 18px' }}>
                  <div className="flex-between" style={{ flexWrap:'wrap', gap:10, marginBottom:10 }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{c.title}</div>
                      <div style={{ fontSize:11, color:'var(--t2)' }}>
                        {c.brand?.companyName||c.brandName} · ₹{c.budget?.toLocaleString('en-IN')} · {c.niche}
                        {' · '}{c.assignedCreators?.length||0}/{c.totalSlots} creators · {c.daysLeft}d left
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <StatusBadge status={ws} />
                      <Btn variant="secondary" size="sm" onClick={()=>setStatusModal(c)}><Eye size={11}/> Status</Btn>
                      <Btn variant="ghost" size="sm" onClick={()=>setExpanded(isExpanded?null:c._id)}>
                        {isExpanded?<ChevronUp size={13}/>:<ChevronDown size={13}/>} {isExpanded?'Close':'Manage'}
                      </Btn>
                    </div>
                  </div>
                  <WorkflowPipeline status={ws}/>
                  {c.aiAnalysis?.analyzed && (
                    <div style={{ marginTop:10, fontSize:11, color:'var(--p2)' }}>
                      🤖 AI: Predicted reach {(c.aiAnalysis.predictedReach/1000).toFixed(0)}K · {c.aiAnalysis.confidence}% confidence · {c.aiSuggestedCreators?.length||0} suggestions
                    </div>
                  )}
                </div>

                {/* Expanded: assignment panel */}
                {isExpanded && (
                  <div style={{ padding:'0 18px 18px', borderTop:'1px solid var(--border)' }}>
                    <div style={{ paddingTop:16 }}>
                      <h4 style={{ fontSize:13, fontWeight:700, marginBottom:12, color:'var(--p2)' }}>⚡ Creator Assignment</h4>
                      <CreatorSelector campaign={c} onAssigned={()=>{ setExpanded(null); load(); }}/>
                    </div>

                    {/* Already assigned */}
                    {c.assignedCreators?.length>0 && (
                      <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
                        <h4 style={{ fontSize:12, fontWeight:700, marginBottom:10, color:'var(--acc2)' }}>✅ Already Assigned ({c.assignedCreators.length})</h4>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {c.assignedCreators.map(a => (
                            <div key={a._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                              background:'rgba(0,255,163,0.04)', border:'1px solid rgba(0,255,163,0.12)', borderRadius:8 }}>
                              <Avatar src={a.creator?.avatar} name={a.creator?.displayName||'C'} size={28}/>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:12, fontWeight:600 }}>{a.creator?.displayName||'Creator'}</div>
                                <div style={{ fontSize:10, color:'var(--t2)' }}>₹{(a.paymentAlloc||0).toLocaleString('en-IN')}</div>
                              </div>
                              <StatusBadge status={a.status}/>
                              {a.submissionUrl && (
                                <Btn variant="ghost" size="sm" onClick={()=>window.open(a.submissionUrl,'_blank')}>
                                  <Eye size={10}/> View
                                </Btn>
                              )}
                              {a.status==='submitted' && (
                                <div style={{ display:'flex', gap:4 }}>
                                  <Btn variant="primary" size="sm" onClick={async()=>{
                                    await adminAPI.updateAssignment(c._id,a.creator?._id||a.creator,{status:'approved'});
                                    toast.success('Content approved!'); load();
                                  }}>✅ Approve</Btn>
                                  <Btn variant="danger" size="sm" onClick={async()=>{
                                    const note=prompt('Revision note:'); if(!note) return;
                                    await adminAPI.updateAssignment(c._id,a.creator?._id||a.creator,{status:'revision',revisionNote:note});
                                    toast.success('Revision requested'); load();
                                  }}>✏️ Revise</Btn>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status update modal */}
      <Modal open={!!statusModal} onClose={()=>setStatusModal(null)} title="Update Campaign Status">
        {statusModal && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>{statusModal.title}</div>
            <div className="form-group">
              <label className="form-label">New Workflow Status</label>
              <select className="form-input" value={newStatus} onChange={e=>setNewStatus(e.target.value)}>
                <option value="">Select status…</option>
                {['brand_submitted','admin_review','ai_analyzing','creators_assigned','in_progress','revision','completed','cancelled'].map(s=>(
                  <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Admin Note (optional)</label>
              <textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} className="form-input form-textarea"
                placeholder="Note for the brand…" style={{minHeight:70}}/>
            </div>
            <div className="flex-between">
              <Btn variant="ghost" onClick={()=>setStatusModal(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={updateStatus} disabled={updBusy||!newStatus}>{updBusy?'Updating…':'Update Status'}</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
