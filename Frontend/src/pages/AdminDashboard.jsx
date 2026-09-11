import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { StampBadge } from '../components/StampBadge';
import { RecordDetailModal } from '../components/RecordDetailModal';
import { CreateEditRecordModal } from '../components/CreateEditRecordModal';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { Folder, Archive, Users, Edit3, Eye, Check, X, FileText, Lock } from 'lucide-react';

export const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState('users');
  const [editingUserRole, setEditingUserRole] = useState(null);
  const [selectedRoleOption, setSelectedRoleOption] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  const [inspectingUser, setInspectingUser] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    },
    enabled: tab === 'users'
  });

  const sortedUsersData = useMemo(() => {
    if (!usersData) return [];
    return [...usersData].sort((a, b) => {
      if (currentUser?.id && a.id === currentUser.id) return -1;
      if (currentUser?.id && b.id === currentUser.id) return 1;
      return 0;
    });
  }, [usersData, currentUser]);

  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery({
    queryKey: ['admin-records'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/records?limit=50');
      return res.data;
    },
    enabled: tab === 'records'
  });

  const { data: userRecordsData, isLoading: userRecordsLoading, refetch: refetchUserRecords } = useQuery({
    queryKey: ['admin-user-records', inspectingUser?.id],
    queryFn: async () => {
      if (!inspectingUser) return null;
      const res = await apiClient.get(`/admin/users/${inspectingUser.id}/records`);
      return res.data;
    },
    enabled: !!inspectingUser
  });

  const handleRefetchAll = () => {
    refetchUsers();
    refetchRecords();
    if (refetchUserRecords) refetchUserRecords();
  };

  const handleRoleChangeStart = (user) => {
    setEditingUserRole(user.id);
    setSelectedRoleOption(user.role || 'USER');
  };

  const handleSaveRole = async (userId) => {
    if (!selectedRoleOption) {
      alert('Role is required.');
      return;
    }

    setUpdatingRole(true);
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role: selectedRoleOption });
      refetchUsers();
      setEditingUserRole(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user role.');
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto min-h-screen flex flex-col bg-surface border-x border-hairline">
      <Header />

      {/* Archival Folder Index Tabs */}
      <div className="flex justify-between border-b border-hairline px-6 pt-3 bg-desk overflow-x-auto">
        <div className="flex">
          <Link to="/?tab=mine" className="px-4 py-2 bg-folio border border-hairline border-b-0 hover:bg-container rounded-t text-xs font-semibold text-ink flex items-center gap-2 no-underline transition-colors">
            <FileText size={14} />
            <span>My Records</span>
          </Link>
          <Link to="/" className="px-4 py-2 bg-folio border border-hairline border-b-0 hover:bg-container rounded-t text-xs font-semibold text-ink flex items-center gap-2 no-underline transition-colors">
            <Folder size={14} />
            <span>All Records</span>
          </Link>
          <Link to="/admin" className="px-4 py-2 bg-cell border border-hairline border-b-0 border-t-2 border-t-primary-container rounded-t text-xs font-semibold text-ink flex items-center gap-2 no-underline -mb-[1px]">
            <Users size={14} />
            <span>Employees ({usersData?.length || 0})</span>
          </Link>
        </div>
        <div>
          <Link to="/recovery-vault" className="px-4 py-2 bg-error-container/25 border border-hairline border-b-0 hover:bg-error-container rounded-t text-xs font-semibold text-stamp-red flex items-center gap-2 no-underline transition-colors">
            <Archive size={14} />
            <span>Vault</span>
          </Link>
        </div>
      </div>

      <main className="p-6 flex-1">
        <div className="mb-5">
          <h2 className="font-serif text-[28px] font-medium text-ink">System Administration & Role Assignment</h2>
          <p className="text-xs text-secondary">
            Manage team roles, custom permission labels, and inspect user-specific document dockets.
          </p>
        </div>



        {tab === 'users' ? (
          <div className="bg-cell border border-hairline overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-desk border-b border-hairline">
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">User / Employee Name</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Email Address</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Assigned Role & Color Pill</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Total Records</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Lockout Status</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={6} className="text-center p-8 text-secondary">Loading team members...</td></tr>
                ) : !sortedUsersData || sortedUsersData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-secondary">No users registered.</td></tr>
                ) : (
                  sortedUsersData.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-hairline transition-colors ${
                          isSelf
                            ? 'bg-primary-container/10 border-l-4 border-l-primary-container hover:bg-primary-container/15'
                            : 'hover:bg-folio'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-ink flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-container bg-primary-container/15 px-1.5 py-0.5 rounded border border-primary-container/30">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="font-tnum text-[11px] text-secondary">ID: {u.id}</div>
                        </td>
                        <td className="px-4 py-3.5 font-tnum text-xs">{u.email}</td>
                      <td className="px-4 py-3.5">
                        {editingUserRole === u.id ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <select
                                className="px-2 py-1 text-xs bg-cell border border-hairline rounded outline-none focus:border-ink"
                                value={selectedRoleOption}
                                onChange={(e) => setSelectedRoleOption(e.target.value)}
                              >
                                <option value="USER">USER (Standard User)</option>
                                <option value="ADMIN">ADMIN (Administrator)</option>
                              </select>

                              <button
                                onClick={() => handleSaveRole(u.id)}
                                className="font-sans text-[11px] font-semibold px-2 py-1 bg-primary-container text-white border border-primary-container rounded cursor-pointer inline-flex items-center gap-1 transition-all disabled:opacity-50"
                                disabled={updatingRole}
                              >
                                <Check size={12} />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => setEditingUserRole(null)}
                                className="font-sans text-[11px] font-semibold px-2 py-1 bg-cell text-ink border border-hairline hover:bg-folio rounded cursor-pointer transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <StampBadge role={u.role} />
                            <button
                              onClick={() => handleRoleChangeStart(u)}
                              className="bg-transparent border-none cursor-pointer text-secondary hover:text-ink"
                              title="Change User Role"
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-tnum font-semibold">{u._count?.records || 0} Dockets</td>
                      <td className="px-4 py-3.5">
                        {u.lockout_until && new Date(u.lockout_until) > new Date() ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] font-sans text-[11px] font-bold uppercase tracking-wider text-stamp-red bg-cell border-[1.5px] border-stamp-red">
                            <Lock size={10} />
                            <span>LOCKED OUT</span>
                          </span>
                        ) : (
                          <span className="text-xs text-primary-container font-semibold">CLEAR</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setInspectingUser(u)}
                          className="font-sans text-xs font-semibold px-2.5 py-1 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer inline-flex items-center gap-1 transition-all"
                        >
                          <Eye size={12} />
                          <span>Inspect User Records</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-cell border border-hairline overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-desk border-b border-hairline">
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Record Docket Title</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Category</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Status</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Owner / Custodian</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Attachments</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Filed Date</th>
                  <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recordsLoading ? (
                  <tr><td colSpan={7} className="text-center p-8 text-secondary">Loading system ledger...</td></tr>
                ) : !recordsData?.records || recordsData.records.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-8 text-secondary">No records found in global register.</td></tr>
                ) : (
                  recordsData.records.map((r) => (
                    <tr key={r.id} className="border-b border-hairline hover:bg-folio transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-ink">{r.title}</td>
                      <td className="px-4 py-3.5">{r.category || 'General'}</td>
                      <td className="px-4 py-3.5"><StampBadge status={r.status} /></td>
                      <td className="px-4 py-3.5">{r.owner?.name || r.owner?.email}</td>
                      <td className="px-4 py-3.5 font-tnum">{r.attachments?.length || 0} Files</td>
                      <td className="px-4 py-3.5 font-tnum text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="font-sans text-xs font-semibold px-2.5 py-1 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer transition-all"
                        >
                          Inspect Record
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* User Specific Records Docket Overlay Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 bg-[#1e2a33]/45 flex items-center justify-center z-[1000] p-6">
          <div className="bg-cell border-[1.5px] border-double border-ink w-full max-w-[800px] max-h-[90vh] overflow-y-auto shadow-2xl p-8 rounded">
            <div className="flex items-center justify-between border-b border-hairline pb-3 mb-5">
              <div>
                <h3 className="font-serif text-[22px] font-medium text-ink">User Dockets: {inspectingUser.name}</h3>
                <p className="text-xs text-secondary flex items-center gap-2 mt-0.5">
                  Email: {inspectingUser.email} • Role: <StampBadge role={inspectingUser.role} />
                </p>
              </div>
              <button onClick={() => setInspectingUser(null)} className="bg-transparent border-none cursor-pointer text-ink">
                <X size={20} />
              </button>
            </div>

            {userRecordsLoading ? (
              <p className="text-center p-6 text-secondary">Loading user documents...</p>
            ) : !userRecordsData?.records || userRecordsData.records.length === 0 ? (
              <p className="text-center p-6 text-secondary">No dockets uploaded by this user.</p>
            ) : (
              <div className="bg-cell border border-hairline overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-desk border-b border-hairline">
                      <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Title</th>
                      <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Category</th>
                      <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Attachments</th>
                      <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userRecordsData.records.map((r) => (
                      <tr key={r.id} className="border-b border-hairline hover:bg-folio transition-colors">
                        <td className="px-4 py-3 font-semibold text-ink">{r.title}</td>
                        <td className="px-4 py-3">{r.category || 'General'}</td>
                        <td className="px-4 py-3 font-tnum">{r.attachments?.length || 0} Files</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setInspectingUser(null); setSelectedRecord(r); }}
                            className="font-sans text-[11px] font-semibold px-2 py-1 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer transition-all"
                          >
                            Inspect & Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button onClick={() => setInspectingUser(null)} className="font-sans text-xs font-semibold px-4 py-2 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Inspection & Preview Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onEdit={(rec) => setEditingRecord(rec)}
          onDeleteSuccess={handleRefetchAll}
        />
      )}

      {/* Create / Edit Record Modal */}
      {editingRecord && (
        <CreateEditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaveSuccess={handleRefetchAll}
        />
      )}
    </div>
  );
};
