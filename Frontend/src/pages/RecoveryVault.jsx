import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { Folder, Archive, RotateCcw, AlertTriangle, Clock, FileText, Users } from 'lucide-react';

export const RecoveryVault = () => {
  const { isAdmin } = useAuth();

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    },
    enabled: isAdmin
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recovery-records'],
    queryFn: async () => {
      const res = await apiClient.get('/records?includeDeleted=true');
      return res.data;
    }
  });

  const handleRestore = async (recordId) => {
    try {
      await apiClient.post(`/records/${recordId}/restore`);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to restore record.');
    }
  };

  const getDaysRemaining = (deletedAt) => {
    if (!deletedAt) return 30;
    const deletedMs = new Date(deletedAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const expiresMs = deletedMs + thirtyDaysMs;
    const diffMs = expiresMs - Date.now();
    const days = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    return days;
  };

  return (
    <div className="max-w-[1440px] mx-auto min-h-screen flex flex-col bg-surface border-x border-hairline">
      <Header />

      {/* Archival Folder Index Tabs */}
      <div className="flex gap-1 justify-between border-b border-hairline px-6 pt-3 bg-desk overflow-x-auto">
        <div className="flex">
          {!isAdmin ? (
            <Link to="/?tab=mine" className="px-4 py-2 bg-folio border border-hairline border-b-0 hover:bg-container rounded-t text-xs font-semibold text-ink flex items-center gap-2 no-underline transition-colors">
              <FileText size={14} />
              <span>My Records</span>
            </Link>
          ) : (
            <>
              <Link to="/?tab=mine" className="px-4 py-2 bg-folio border border-hairline border-b-0 hover:bg-container rounded-t text-xs font-semibold text-ink flex items-center gap-2 no-underline transition-colors">
                <FileText size={14} />
                <span>My Records</span>
              </Link>
              <Link to="/" className="px-4 py-2 bg-folio border border-hairline border-b-0 hover:bg-container rounded-t text-xs font-semibold text-ink flex items-center gap-2 no-underline transition-colors">
                <Folder size={14} />
                <span>All Records</span>
              </Link>
              <Link to="/admin" className="px-4 py-2 bg-folio border border-hairline border-b-0 hover:bg-container rounded-t text-xs font-semibold text-ink flex items-center gap-2 no-underline transition-colors">
                <Users size={14} />
                <span>Employees ({usersData?.length || 0})</span>
              </Link>
            </>
          )}
        </div>
        <div>
          <Link to="/recovery-vault" className="px-4 py-2 bg-error-container border border-hairline border-b-0 border-t-2 border-t-stamp-red rounded-t text-xs font-semibold text-stamp-red flex items-center gap-2 no-underline -mb-[1px]">
            <Archive size={14} />
            <span>Vault</span>
          </Link>
        </div>
      </div>

      <main className="p-6 flex-1">
        <div className="mb-5">
          <h2 className="font-serif text-[28px] font-medium text-ink">30-Day Custodial Recovery Vault</h2>
          <p className="text-xs text-secondary">
            Soft-deleted record dockets pending permanent purge after the 30-day retention window.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="flex items-center gap-3 bg-amber-50/80 border-[1.5px] border-amber-200 text-amber-900 p-4 rounded mb-6">
          <AlertTriangle size={24} className="text-amber-600 flex-shrink-0" />
          <div>
            <div className="font-bold text-sm">Notice: Custodial Soft-Delete Recovery Window</div>
            <div className="text-xs mt-0.5">
              Items in the recovery vault are held for exactly 30 days from deletion. Records can be restored to the active register at any time during this window. Past 30 days, files are permanently purged.
            </div>
          </div>
        </div>

        {/* Soft-Deleted Records Table */}
        <div className="bg-cell border border-hairline overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-desk border-b border-hairline">
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Record Docket Title</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Category</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Deleted Timestamp</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Recovery Horizon</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-secondary">
                    Loading soft-deleted records...
                  </td>
                </tr>
              ) : !data?.records || data.records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-10 text-secondary">
                    <p className="font-semibold text-base text-ink mb-1">Recovery Vault Empty</p>
                    <p className="text-xs">No soft-deleted records currently pending recovery.</p>
                  </td>
                </tr>
              ) : (
                data.records.map((record) => {
                  const daysLeft = getDaysRemaining(record.deleted_at);
                  return (
                    <tr key={record.id} className="border-b border-hairline hover:bg-folio transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{record.title}</div>
                        <div className="font-tnum text-[11px] text-secondary">UUID: {record.id}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-primary-container bg-folio px-2 py-0.5 rounded-[2px] border border-hairline">
                          {record.category || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-tnum text-xs text-secondary">
                        {record.deleted_at ? new Date(record.deleted_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1 bg-amber-50/80 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-[2px] text-xs font-semibold">
                          <Clock size={12} />
                          <span className="font-tnum">{daysLeft} Days Remaining</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleRestore(record.id)}
                          className="font-sans text-xs font-semibold px-3 py-1.5 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center gap-1 transition-all"
                        >
                          <RotateCcw size={12} />
                          <span>Restore Record</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
