// BrandCampaigns.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsAPI } from '../../api';
import { PageLoader, StatusBadge, WorkflowPipeline, Btn, EmptyState } from '../../components/ui';
import { Plus, Eye } from 'lucide-react';

export default function BrandCampaigns() {
  const nav = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    campaignsAPI.brandCampaigns().then(d=>setCampaigns(d.campaigns||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  const filtered = filter==='all' ? campaigns : campaigns.filter(c=>(c.workflowStatus||c.status)===filter);

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="flex-between" style={{ flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>My Campaigns</h2>
          <p style={{ color:'var(--t2)', fontSize:13 }}>{campaigns.length} total campaigns</p>
        </div>
        <Btn variant="primary" onClick={()=>nav('/brand/campaigns/create')}><Plus size={14}/> New Campaign</Btn>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {[['all','All'],['brand_submitted','Pending'],['creators_assigned','Assigned'],['in_progress','Active'],['completed','Done'],['cancelled','Cancelled']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} className={`chip${filter===k?' active':''}`} style={{fontSize:11}}>{l}</button>
        ))}
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {filtered.length===0 ? (
          <EmptyState icon="📋" title="No campaigns" desc={filter==='all'?"Create your first campaign brief!":"No campaigns in this status."}
            action={filter==='all'&&<Btn variant="primary" onClick={()=>nav('/brand/campaigns/create')}>Create Campaign</Btn>}
          />
        ) : filtered.map((c,i) => (
          <div key={c._id} onClick={()=>nav(`/brand/campaigns/${c._id}`)}
            style={{ padding:'16px 18px', borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',
              cursor:'pointer', transition:'background .15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}>
            <div className="flex-between" style={{ flexWrap:'wrap', gap:10, marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{c.title}</div>
                <div style={{ fontSize:11, color:'var(--t2)' }}>
                  {c.niche} · ₹{c.budget?.toLocaleString('en-IN')} · {c.assignedCreators?.length||0} creators · {c.daysLeft??'?'}d left
                </div>
              </div>
              <StatusBadge status={c.workflowStatus||c.status} />
            </div>
            <WorkflowPipeline status={c.workflowStatus||'brand_submitted'} />
          </div>
        ))}
      </div>
    </div>
  );
}
