import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import { PageLoader, Avatar, StatusBadge, Btn, Modal, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Shield, Ban, CheckCircle } from 'lucide-react';

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [sort,    setSort]    = useState('newest');
  const [page,    setPage]    = useState(1);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.users({ search, role, sort, page, limit:15 })
      .then(d => { setUsers(d.users||[]); setTotal(d.total||0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, role, sort, page]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ isVerified:u.isVerified, isBanned:u.isBanned, banReason:u.banReason||'', role:u.role });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminAPI.updateUser(editUser._id, editForm);
      toast.success('User updated!');
      setEditUser(null);
      load();
    } catch(e) { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const recalc = async (id) => {
    try {
      const d = await adminAPI.recalcScore(id);
      toast.success(`Score recalculated: ${d.score} (${d.rank})`);
      load();
    } catch(e) { toast.error('Recalc failed'); }
  };

  const ROLE_COLOR = { creator:'var(--p2)', brand:'var(--acc)', admin:'var(--gold)' };

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <h2 style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:18, marginBottom:4 }}>User Management</h2>
        <p style={{ color:'var(--t2)', fontSize:13 }}>{total} total users</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}
            placeholder="Search by name or email…" className="form-input" style={{ paddingLeft:32 }}/>
        </div>
        <select value={role} onChange={e=>{ setRole(e.target.value); setPage(1); }} className="form-input" style={{ width:130 }}>
          <option value="">All Roles</option>
          <option value="creator">Creator</option>
          <option value="brand">Brand</option>
          <option value="admin">Admin</option>
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="form-input" style={{ width:140 }}>
          <option value="newest">Newest First</option>
          <option value="score">By Score</option>
          <option value="name">By Name</option>
        </select>
        <Btn variant="secondary" size="sm" onClick={load}><RefreshCw size={12}/></Btn>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : users.length === 0 ? (
        <EmptyState icon="👥" title="No users found" desc="Try a different search or filter." />
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Niche / Company</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar src={u.avatar} name={u.displayName} size={32}/>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{u.displayName}</div>
                          <div style={{ fontSize:11, color:'var(--t3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:600, color:ROLE_COLOR[u.role]||'var(--t2)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--t2)' }}>{u.niche||u.companyName||'—'}</td>
                    <td>
                      {u.role==='creator' ? (
                        <div>
                          <div style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:13, color:'var(--p2)' }}>{u.creatorScore||0}</div>
                          <div style={{ fontSize:10, color:'var(--t3)' }}>{u.rank||'Bronze'}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4, flexDirection:'column' }}>
                        {u.isVerified && <span className="badge badge-green" style={{fontSize:10}}>✓ Verified</span>}
                        {u.isBanned   && <span className="badge badge-red"   style={{fontSize:10}}>🚫 Banned</span>}
                        {!u.isVerified && !u.isBanned && <span className="badge badge-gray" style={{fontSize:10}}>Unverified</span>}
                      </div>
                    </td>
                    <td style={{ fontSize:11, color:'var(--t3)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <Btn variant="ghost" size="sm" onClick={()=>openEdit(u)}>Edit</Btn>
                        {u.role==='creator' && (
                          <Btn variant="ghost" size="sm" onClick={()=>recalc(u._id)} title="Recalculate score">
                            <RefreshCw size={10}/>
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 15 && (
            <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'center' }}>
              <Btn variant="ghost" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
              <span style={{ fontSize:12, color:'var(--t2)', alignSelf:'center' }}>Page {page} of {Math.ceil(total/15)}</span>
              <Btn variant="ghost" size="sm" disabled={page>=Math.ceil(total/15)} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={()=>setEditUser(null)} title={`Edit: ${editUser?.displayName}`}>
        {editUser && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <Avatar src={editUser.avatar} name={editUser.displayName} size={44}/>
              <div>
                <div style={{ fontWeight:700 }}>{editUser.displayName}</div>
                <div style={{ fontSize:12, color:'var(--t2)' }}>{editUser.email}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={editForm.role}
                onChange={e=>setEditForm(p=>({...p,role:e.target.value}))}>
                <option value="creator">Creator</option>
                <option value="brand">Brand</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display:'flex', gap:16 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={editForm.isVerified}
                  onChange={e=>setEditForm(p=>({...p,isVerified:e.target.checked}))}
                  style={{ accentColor:'var(--acc2)', width:16, height:16 }}/>
                <CheckCircle size={14} style={{ color:'var(--acc2)' }}/> Verified
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={editForm.isBanned}
                  onChange={e=>setEditForm(p=>({...p,isBanned:e.target.checked}))}
                  style={{ accentColor:'var(--rose)', width:16, height:16 }}/>
                <Ban size={14} style={{ color:'var(--rose)' }}/> Banned
              </label>
            </div>

            {editForm.isBanned && (
              <div className="form-group">
                <label className="form-label">Ban Reason</label>
                <input className="form-input" value={editForm.banReason}
                  onChange={e=>setEditForm(p=>({...p,banReason:e.target.value}))}
                  placeholder="Reason for ban…"/>
              </div>
            )}

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <Btn variant="ghost" onClick={()=>setEditUser(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
