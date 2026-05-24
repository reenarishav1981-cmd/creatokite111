import { useState, useEffect } from 'react';
import { campaignsAPI } from '../../api';
import { PageLoader, StatusBadge, Btn, EmptyState, Modal, Input, Textarea } from '../../components/ui';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Upload, ExternalLink } from 'lucide-react';

const STATUS_ORDER = ['assigned','accepted','in_progress','submitted','revision','approved','completed','rejected'];

function CampaignCard({ c, onAction }) {
  const a = c.myAssignment || {};
  const [showSubmit, setShowSubmit] = useState(false);
  const [subUrl, setSubUrl]   = useState('');
  const [subNote, setSubNote] = useState('');
  const [busy, setBusy] = useState(false);

  const accept  = async () => { setBusy(true); await onAction(c._id,'accepted');  setBusy(false); };
  const decline = async () => { setBusy(true); await onAction(c._id,'rejected');  setBusy(false); };
  const submit  = async () => {
    if (!subUrl.trim()) return toast.error('Paste your content URL');
    setBusy(true);
    try {
      await campaignsAPI.submitWork(c._id, { submissionUrl:subUrl, submissionNote:subNote });
      toast.success('Content submitted! Admin will review soon.');
      setShowSubmit(false); onAction(c._id,'_refresh');
    } catch(e) { toast.error(e.response?.data?.message || 'Submit failed'); }
    finally { setBusy(false); }
  };

  const STATUS_BG = {
    assigned:   'rgba(245,166,35,0.07)',  accepted:  'rgba(0,255,163,0.05)',
    in_progress:'rgba(108,99,255,0.07)', submitted:  'rgba(0,217,255,0.07)',
    revision:   'rgba(244,63,94,0.07)',   approved:  'rgba(0,255,163,0.08)',
    completed:  'rgba(0,255,163,0.06)',   rejected:  'rgba(255,255,255,0.03)',
  };
  const bg = STATUS_BG[a.status] || 'rgba(255,255,255,0.02)';

  return (
    <>
      <div style={{ background:bg, border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', transition:'border-color .2s' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>

        <div className="flex-between" style={{ flexWrap:'wrap', gap:10, marginBottom:12 }}>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:14, marginBottom:4 }}>{c.title}</div>
            <div style={{ fontSize:12, color:'var(--t2)' }}>
              {c.brandName} · <span style={{ color:'var(--acc2)', fontWeight:600 }}>₹{(a.paymentAlloc||0).toLocaleString('en-IN')}</span>
              {c.deadline && ` · Due ${new Date(c.deadline).toLocaleDateString('en-IN')}`}
            </div>
          </div>
          <StatusBadge status={a.status || 'assigned'} />
        </div>

        {/* Niche & platforms */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          <span className="badge badge-purple">{c.niche}</span>
          {(c.platforms||[]).map(p => <span key={p} className="badge badge-gray">{p}</span>)}
          {a.aiMatchScore > 0 && <span className="badge badge-blue">🤖 {a.aiMatchScore}% match</span>}
        </div>

        {/* Deliverables */}
        {c.deliverables?.length > 0 && (
          <div style={{ fontSize:11, color:'var(--t2)', marginBottom:12 }}>
            📋 Deliverables: {c.deliverables.join(' · ')}
          </div>
        )}

        {/* Revision note */}
        {a.status === 'revision' && a.revisionNote && (
          <div style={{ padding:'10px 12px', background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:8, marginBottom:12, fontSize:12, color:'var(--rose)' }}>
            ✏️ <strong>Revision requested:</strong> {a.revisionNote}
          </div>
        )}

        {/* Submission link */}
        {a.submissionUrl && (
          <div style={{ padding:'8px 12px', background:'rgba(0,217,255,0.06)', border:'1px solid rgba(0,217,255,0.15)', borderRadius:8, marginBottom:12, fontSize:12 }}>
            📤 Submitted: <a href={a.submissionUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--acc)', textDecoration:'underline' }}>{a.submissionUrl.slice(0,60)}…</a>
          </div>
        )}

        {/* Admin note */}
        {a.adminNote && (
          <div style={{ fontSize:11, color:'var(--t3)', marginBottom:10 }}>💬 Admin: {a.adminNote}</div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {a.status === 'assigned' && (
            <>
              <Btn variant="primary" size="sm" onClick={accept} disabled={busy}><CheckCircle size={12}/> Accept Campaign</Btn>
              <Btn variant="danger"  size="sm" onClick={decline} disabled={busy}><XCircle size={12}/> Decline</Btn>
            </>
          )}
          {['accepted','in_progress','revision'].includes(a.status) && (
            <Btn variant="primary" size="sm" onClick={()=>setShowSubmit(true)} disabled={busy}><Upload size={12}/> Submit Content</Btn>
          )}
          {a.status === 'approved' && (
            <span style={{ fontSize:12, color:'var(--acc2)', fontWeight:600 }}>✅ Approved! Payment will be released soon.</span>
          )}
          {a.status === 'completed' && (
            <span style={{ fontSize:12, color:'var(--acc2)', fontWeight:600 }}>🏆 Completed & Paid!</span>
          )}
          {c.contentGuidelines && (
            <Btn variant="ghost" size="sm" onClick={()=>toast(`📋 ${c.contentGuidelines}`,{duration:6000})}>
              <ExternalLink size={11}/> Brief
            </Btn>
          )}
        </div>
      </div>

      <Modal open={showSubmit} onClose={()=>setShowSubmit(false)} title="Submit Your Content">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ padding:'10px 14px', background:'rgba(108,99,255,0.07)', border:'1px solid rgba(108,99,255,0.2)', borderRadius:8, fontSize:12, color:'var(--t2)' }}>
            📋 Campaign: <strong style={{color:'var(--t1)'}}>{c.title}</strong>
          </div>
          <Input label="Content URL *" value={subUrl} onChange={e=>setSubUrl(e.target.value)} placeholder="https://instagram.com/p/… or YouTube link" />
          <Textarea label="Note to Admin (optional)" value={subNote} onChange={e=>setSubNote(e.target.value)} placeholder="Any notes about your submission…" style={{minHeight:80}} />
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <Btn variant="ghost" onClick={()=>setShowSubmit(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={submit} disabled={busy||!subUrl.trim()}>{busy?'Submitting…':'Submit Content'}</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function AssignedCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter,  setFilter]      = useState('all');

  const load = () => {
    setLoading(true);
    campaignsAPI.myAssigned()
      .then(d => setCampaigns(d.campaigns || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAction = async (id, response) => {
    if (response === '_refresh') { load(); return; }
    try {
      await campaignsAPI.respond(id, response);
      toast.success(response === 'accepted' ? '✅ Campaign accepted!' : 'Campaign declined.');
      load();
    } catch(e) { toast.error(e.response?.data?.message || 'Action failed'); }
  };

  if (loading) return <PageLoader />;

  const filtered = filter === 'all' ? campaigns
    : campaigns.filter(c => c.myAssignment?.status === filter);

  const tabs = [
    { key:'all',       label:`All (${campaigns.length})` },
    { key:'assigned',  label:'New' },
    { key:'accepted',  label:'Accepted' },
    { key:'submitted', label:'Submitted' },
    { key:'revision',  label:'Revision' },
    { key:'approved',  label:'Approved' },
    { key:'completed', label:'Completed' },
  ];

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>My Campaign Assignments</h2>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Campaigns assigned to you by the Creatokite team. Accept, create content & submit.</p>
      </div>

      {/* Info banner */}
      <div style={{ padding:'12px 16px', background:'rgba(108,99,255,0.06)', border:'1px solid rgba(108,99,255,0.15)', borderRadius:10, fontSize:12, color:'var(--t2)' }}>
        💡 <strong style={{color:'var(--t1)'}}>How it works:</strong> Admin assigns you to campaigns based on your Creator Score & niche. Accept within 48h → Create content → Submit link → Admin reviews → You get paid.
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`chip${filter===t.key?' active':''}`} style={{fontSize:11}}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🎯" title="No campaigns here"
          desc={filter==='all'?"You haven't been assigned any campaigns yet. Keep your profile complete & score high!":"No campaigns in this status."}
        />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(c => <CampaignCard key={c._id} c={c} onAction={handleAction} />)}
        </div>
      )}
    </div>
  );
}
