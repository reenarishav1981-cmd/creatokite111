import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api';
import { PageLoader, StatCard } from '../../components/ui';
import { Wallet, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function Earnings() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.creator().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  const s = data?.stats || {};
  const campaigns = (data?.campaigns || []).filter(c => c.assignment?.paymentAlloc > 0);

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>Earnings</h2>
        <p style={{ color:'var(--t2)', fontSize:13 }}>Track your campaign income. Payments are released after admin approves your content.</p>
      </div>

      <div className="grid-4">
        <StatCard label="Total Earned"   value={`₹${((s.earned||0)/1000).toFixed(1)}K`}  icon={Wallet}       color="var(--gold)"  />
        <StatCard label="Campaigns Done" value={s.completed||0}                            icon={CheckCircle}  color="var(--acc2)"  />
        <StatCard label="Pending"        value={s.pending||0}                              icon={Clock}        color="var(--gold)"  sub="Awaiting approval" />
        <StatCard label="Success Rate"   value={`${s.successRate||100}%`}                  icon={TrendingUp}   color="var(--acc)"   />
      </div>

      <div style={{ padding:'13px 16px', background:'rgba(0,255,163,0.05)', border:'1px solid rgba(0,255,163,0.15)', borderRadius:10, fontSize:12, color:'var(--t2)' }}>
        💡 <strong style={{ color:'var(--acc2)' }}>Smart Escrow:</strong> Brands pay Creatokite upfront. Once admin approves your submitted content, payment auto-releases to you. Zero risk.
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:700 }}>Payment History</div>
        {campaigns.length === 0 ? (
          <div style={{ padding:36, textAlign:'center', color:'var(--t2)', fontSize:13 }}>
            No earnings yet. Accept campaign assignments and submit content to start earning!
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th><th>Niche</th><th>Status</th><th>Amount</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:500 }}>{c.title}</td>
                    <td><span className="badge badge-purple">{c.niche}</span></td>
                    <td>
                      <span className={`badge ${['approved','completed'].includes(c.assignment?.status) ? 'badge-green' : 'badge-gold'}`}>
                        {c.assignment?.status || '—'}
                      </span>
                    </td>
                    <td style={{ color:'var(--acc2)', fontWeight:700 }}>
                      ₹{(c.assignment?.paymentAlloc || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ color:'var(--t3)', fontSize:11 }}>
                      {c.assignment?.completedAt
                        ? new Date(c.assignment.completedAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
