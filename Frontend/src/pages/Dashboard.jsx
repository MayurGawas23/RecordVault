import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { StampBadge } from '../components/StampBadge';
import { CreateEditRecordModal } from '../components/CreateEditRecordModal';
import { RecordDetailModal } from '../components/RecordDetailModal';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { Plus, Search, Folder, Archive, ChevronLeft, ChevronRight, FileText, Users } from 'lucide-react';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const activeTab = searchParams.get('tab') === 'mine' ? 'mine' : 'all';

  const setRecordTab = (tabVal) => {
    if (tabVal === 'mine') {
      setSearchParams({ tab: 'mine' });
    } else {
      setSearchParams({});
    }
  };

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    },
    enabled: isAdmin
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  // Fetch records via React Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['records', page, limit, search, category, status, sortBy, sortOrder, activeTab, user?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit,
        sortBy,
        sortOrder
      });
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (isAdmin && activeTab === 'mine' && user?.id) {
        params.append('targetOwnerId', user.id);
      }

      const res = await apiClient.get(`/records?${params.toString()}`);
      return res.data;
    }
  });

  return (
    <div className="max-w-[1440px] mx-auto min-h-screen flex flex-col bg-surface border-x border-hairline">
      <Header />

      {/* Archival Folder Index Tabs */}
      <div className="flex gap-1 justify-between border-b border-hairline px-6 pt-3 bg-desk overflow-x-auto">
        <div className="flex">
          {!isAdmin ? (
            <button
              className="px-4 py-2 bg-cell border border-hairline border-b-0 border-t-2 border-t-primary-container rounded-t text-xs font-semibold text-ink flex items-center gap-2 -mb-[1px]"
            >
              <FileText size={14} />
              <span>My Records</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => { setRecordTab('mine'); setPage(1); }}
                className={`px-4 py-2 border border-hairline border-b-0 rounded-t text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'mine'
                    ? 'bg-cell border-t-2 border-t-primary-container text-ink -mb-[1px]'
                    : 'bg-folio hover:bg-container text-secondary'
                }`}
              >
                <FileText size={14} />
                <span>My Records</span>
              </button>

              <button
                onClick={() => { setRecordTab('all'); setPage(1); }}
                className={`px-4 py-2 border border-hairline border-b-0 rounded-t text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'all'
                    ? 'bg-cell border-t-2 border-t-primary-container text-ink -mb-[1px]'
                    : 'bg-folio hover:bg-container text-secondary'
                }`}
              >
                <Folder size={14} />
                <span>All Records</span>
              </button>

              <Link to="/admin" className="px-4 py-2 bg-folio border border-hairline border-b-0 hover:bg-container rounded-t text-xs font-semibold text-ink flex items-center gap-2 no-underline transition-colors">
                <Users size={14} />
                <span>Employees ({usersData?.length || 0})</span>
              </Link>
            </>
          )}
        </div>
        <div>
          <Link to="/recovery-vault" className="px-4 py-2 bg-error-container/25 border border-hairline border-b-0 hover:bg-error-container rounded-t text-xs font-semibold text-stamp-red flex items-center gap-2 no-underline transition-colors">
            <Archive size={14} />
            <span>Vault</span>
          </Link>
        </div>
      </div>

      <main className="p-6 flex-1">
        {/* Top Action & Filter Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div>
          </div>

          <button onClick={() => setCreateModalOpen(true)} className="font-sans text-xs font-semibold px-4 py-2 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all">
            <Plus size={16} />
            <span> New Record</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-desk border border-hairline p-4 rounded mb-5 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
              placeholder="Search specs, bugs, test suites, or release builds..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="w-[160px]">
            <select className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              <option value="Architecture">Architecture</option>
              <option value="Feature Spec">Feature Spec</option>
              <option value="QA Test Suite">QA Test Suite</option>
              <option value="Bug Docket">Bug Docket</option>
              <option value="Release Build">Release Build</option>
              <option value="Security Audit">Security Audit</option>
              <option value="API Spec">API Spec</option>
            </select>
          </div>

          <div className="w-[140px]">
            <select className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="w-[150px]">
            <select className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink" value={`${sortBy}-${sortOrder}`} onChange={e => {
              const [sb, so] = e.target.value.split('-');
              setSortBy(sb);
              setSortOrder(so);
            }}>
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-cell border border-hairline overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-desk border-b border-hairline">
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Record Title</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Category</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Status</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Attachments</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Owner</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3">Filed Date</th>
                <th className="text-xs font-bold uppercase tracking-wider text-secondary px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-secondary">
                    Loading records...
                  </td>
                </tr>
              ) : !data?.records || data.records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-10 text-secondary">
                    <p className="font-semibold text-base text-ink mb-1">No Project Dockets Found</p>
                    <p className="text-xs">No project dockets match your search or category filter criteria.</p>
                  </td>
                </tr>
              ) : (
                data.records.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className="border-b border-hairline hover:bg-folio cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink">{record.title}</div>
                      {record.description && (
                        <div className="text-xs text-secondary truncate max-w-[320px]">
                          {record.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold text-primary-container bg-folio px-2 py-0.5 rounded-[2px] border border-hairline">
                        {record.category || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StampBadge status={record.status} text={record.status === 'active' ? 'ACTIVE' : 'ARCHIVED'} />
                    </td>
                    <td className="px-4 py-3.5 font-tnum">
                      <div className="flex items-center gap-1 text-xs">
                        <FileText size={14} className="text-primary-container" />
                        <span>{record.attachments?.length || 0} File(s)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-ink">{record.owner?.name || 'Developer'}</span>
                    </td>
                    <td className="px-4 py-3.5 font-tnum text-xs text-secondary">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="font-sans text-xs font-semibold px-2.5 py-1 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer transition-all"
                      >
                        View Record
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data?.pagination && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-hairline">
            <div className="font-tnum text-xs text-secondary">
              Showing {data.records.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} records
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="font-sans text-xs font-semibold px-3 py-1.5 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer inline-flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <span className="font-tnum text-xs font-semibold text-ink">
                Page {page} of {data.pagination.totalPages || 1}
              </span>

              <button
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="font-sans text-xs font-semibold px-3 py-1.5 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer inline-flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Create / Edit Record Modal */}
      {(createModalOpen || editingRecord) && (
        <CreateEditRecordModal
          record={editingRecord}
          onClose={() => { setCreateModalOpen(false); setEditingRecord(null); }}
          onSaveSuccess={() => refetch()}
        />
      )}

      {/* Record Detail Inspection Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onEdit={(rec) => setEditingRecord(rec)}
          onDeleteSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
