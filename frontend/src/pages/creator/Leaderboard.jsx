import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../api';
import { PageLoader, Avatar } from '../../components/ui';

const NICHES = ['','Tech','Beauty','Fashion','Fitness','Food','Travel','Gaming','Education','Finance','Lifestyle'];
const RANK_COLORS = { Bronze:'#cd7f32', Silver:'#c0c0c0', Gold:'var(--gold)', Platinum:'#a8d8ea', Diamond:'var(--p2)', Legend:'var(--acc)' };

export default function Leaderboard() {
  const { user } = useAuth();
  const [creators, setCreators] = useState([]);
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    usersAPI.leaderboard({ niche, limit:20 })
      .then(d => setCreators(d.creators||[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [niche]);

  if (loading) return <PageLoader />;

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="flex-between" style={{ flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>🏆 Creator Leaderboard</h2>
          <p style={{ color:'var(--t2)', fontSize:13 }}>Top creators by Creator Score. Higher rank = more campaign assignments.</p>
        </div>
        <select value={niche} onChange={e => setNiche(e.target.value)} className="form-input" style={{ width:160 }}>
          {NICHES.map(n => <option key={n} value={n}>{n || 'All Niches'}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {creators.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'var(--t2)', fontSize:13 }}>No creators found.</div>
        ) : creators.map((c, i) => {
          const isMe = c._id === user?._id;
          const rc   = RANK_COLORS[c.rank] || 'var(--p2)';
          return (
            <div key={c._id} style={{
              display:'flex', alignItems:'center', gap:14, padding:'13px 18px',
              borderBottom:'1px solid var(--border)',
              background: isMe ? 'rgba(108,99,255,0.06)' : '',
            }}>
              <div style={{ width:28, textAlign:'center', fontFamily:'var(--fd)', fontWeight:800, fontSize:14,
                color: i===0?'var(--gold)':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--t3)' }}>
                {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
              </div>
              <Avatar src={c.avatar} name={c.displayName} size={38} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>
                  {c.displayName}
                  {isMe && <span style={{ fontSize:10, color:'var(--p2)', marginLeft:6 }}>• You</span>}
                </div>
                <div style={{ fontSize:11, color:'var(--t2)' }}>{c.niche} · Level {c.level||1} · {c.completedCampaigns||0} campaigns done</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:16, color:rc }}>{c.creatorScore||0}</div>
                <div style={{ fontSize:10, color:'var(--t3)' }}>{c.rank}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
