import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignsAPI } from '../../api';
import { PageLoader, StatusBadge, WorkflowPipeline, Avatar, Btn } from '../../components/ui';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function CampaignDetail() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    campaignsAPI.brandCampaigns()
      .then(d => { const c = (d.campaigns||[]).find(x=>x._id===id); setCampaign(c||null); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading)  return <PageLoader />;
  if (!campaign) return <div style={{padding:40,textAlign:'center',color:'var(--t2)'}}>Campaign not found. <button onClick={()=>nav(-1)} className="btn btn-ghost btn-sm">Go back</button></div>;

  const ws = campaign.workflowStatus || 'brand_submitted';

  return (
    <div className="page-enter" style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>
      <button className="btn btn-ghost btn-sm" onClick={()=>nav(-1)} style={{ alignSelf:'flex-start' }}><ArrowLeft size={13}/> Back</button>

      {/* Header */}
      <div className="card">
        <div className="flex-between" style={{ flexWrap:'wrap', gap:12, marginBottom:14 }}>
          <div>
            <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:6 }}>{campaign.title}</h2>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span className="badge badge-purple">{campaign.niche}</span>
              {campaign.isPremium && <span className="badge badge-gold">⭐ Premium</span>}
              <StatusBadge status={ws} />
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:22, color:'var(--acc2)' }}>₹{campaign.budget?.toLocaleString('en-IN')}</div>
            <div style={{ fontSize:11, color:'var(--t3)' }}>{campaign.daysLeft} days left</div>
          </div>
        </div>
        <WorkflowPipeline status={ws} />
        {campaign.aiAnalysis?.strategyBrief && (
          <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(108,99,255,0.06)', border:'1px solid rgba(108,99,255,0.15)', borderRadius:8, fontSize:12, color:'var(--t2)' }}>
            🤖 <strong style={{color:'var(--p2)'}}>AI Strategy:</strong> {campaign.aiAnalysis.strategyBrief}
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gap:16, alignItems:'start' }}>
        {/* Campaign info */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card">
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Campaign Details</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:12 }}>
              {[['Goal', campaign.campaignGoal],['Audience', campaign.targetAudience],['Budget Type', campaign.budgetType],
                ['Slots', `${campaign.assignedCreators?.length||0} / ${campaign.totalSlots}`],
                ['Platforms', (campaign.platforms||[]).join(', ')],
                ['Deadline', new Date(campaign.deadline).toLocaleDateString('en-IN')],
                ['Min Followers', campaign.minFollowers?.toLocaleString('en-IN')]].map(([k,v])=>(
                <div key={k} className="flex-between">
                  <span style={{color:'var(--t3)'}}>{k}</span>
                  <span style={{color:'var(--t1)',fontWeight:500}}>{v||'—'}</span>
                </div>
              ))}
            </div>
          </div>
          {campaign.description && (
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Description</h3>
              <p style={{ fontSize:12, color:'var(--t2)', lineHeight:1.7 }}>{campaign.description}</p>
            </div>
          )}
          {campaign.contentGuidelines && (
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Content Guidelines</h3>
              <p style={{ fontSize:12, color:'var(--t2)', lineHeight:1.7, whiteSpace:'pre-line' }}>{campaign.contentGuidelines}</p>
            </div>
          )}
        </div>

        {/* Assigned creators */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:700 }}>
            Assigned Creators ({campaign.assignedCreators?.length||0})
          </div>
          {!campaign.assignedCreators?.length ? (
            <div style={{ padding:28, textAlign:'center', color:'var(--t2)', fontSize:12 }}>
              ⏳ Admin will assign creators after reviewing your brief.
            </div>
          ) : campaign.assignedCreators.map(a => (
            <div key={a._id} style={{ padding:'13px 16px', borderBottom:'1px solid var(--border)' }}>
              <div className="flex-between" style={{ flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar src={a.creator?.avatar} name={a.creator?.displayName} size={34} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{a.creator?.displayName||'Creator'}</div>
                    <div style={{ fontSize:11, color:'var(--t2)' }}>{a.creator?.niche} · {a.creator?.rank}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <StatusBadge status={a.status} />
                  <div style={{ fontSize:11, color:'var(--acc2)', marginTop:4, fontWeight:600 }}>₹{(a.paymentAlloc||0).toLocaleString('en-IN')}</div>
                </div>
              </div>
              {a.submissionUrl && (
                <div style={{ marginTop:8, fontSize:11 }}>
                  📤 <a href={a.submissionUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color:'var(--acc)', textDecoration:'underline' }}>View Submission</a>
                </div>
              )}
              {a.status==='revision' && a.revisionNote && (
                <div style={{ marginTop:6, fontSize:11, color:'var(--rose)' }}>✏️ {a.revisionNote}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
