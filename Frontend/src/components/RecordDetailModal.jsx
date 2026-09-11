import React, { useState } from 'react';
import { StampBadge } from './StampBadge';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { X, Download, Trash2, Edit, FileText, Calendar, User, Tag, Eye, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';

export const RecordDetailModal = ({ record, onClose, onEdit, onDeleteSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  if (!record) return null;

  const handleDownload = async (attachmentId, fileName) => {
    setDownloadingId(attachmentId);
    try {
      const response = await apiClient.get(`/records/${record.id}/attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to download attachment file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSoftDelete = async () => {
    if (!window.confirm(`Are you sure you want to send record "${record.title}" to the 30-Day Soft-Delete Recovery Vault?`)) {
      return;
    }

    setDeleting(true);
    try {
      await apiClient.delete(`/records/${record.id}`);
      onDeleteSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to soft delete record.');
    } finally {
      setDeleting(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#1e2a33]/45 flex items-center justify-center z-[1000] p-6">
        <div className="bg-cell border-[1.5px] border-double border-ink w-full max-w-[680px] max-h-[90vh] overflow-y-auto shadow-2xl p-8 rounded">
          <div className="flex items-center justify-between border-b border-hairline pb-3 mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="font-serif text-[22px] font-medium text-ink">{record.title}</h2>
                <StampBadge status={record.is_deleted ? 'void' : record.status} />
              </div>
              <p className="font-tnum text-[11px] text-secondary">
                Docket UUID: {record.id}
              </p>
            </div>
            <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink">
              <X size={20} />
            </button>
          </div>

          {/* Docket Metadata */}
          <div className="grid grid-cols-2 gap-3 bg-folio p-4 rounded border border-hairline mb-5">
            <div className="flex items-center gap-1.5 text-xs text-on-surface">
              <User size={14} className="text-primary-container" />
              <span className="font-semibold">Owner:</span> {record.owner?.name || record.owner_id}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface">
              <Tag size={14} className="text-primary-container" />
              <span className="font-semibold">Category:</span> {record.category || 'General'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface">
              <Calendar size={14} className="text-primary-container" />
              <span className="font-semibold">Filed Date:</span> <span className="font-tnum">{new Date(record.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface">
              <Calendar size={14} className="text-primary-container" />
              <span className="font-semibold">Last Updated:</span> <span className="font-tnum">{new Date(record.updated_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-1.5">Record Description</h4>
            <p className="text-sm text-on-surface bg-cell p-3 border border-hairline rounded">
              {record.description || 'No description entered for this record docket.'}
            </p>
          </div>

          {/* Attachments Section */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink mb-2">
              Archival Attachments ({record.attachments?.length || 0})
            </h4>
            {!record.attachments || record.attachments.length === 0 ? (
              <p className="text-xs text-secondary italic">No file attachments bound to this record.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {record.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between bg-cell border border-hairline px-3 py-2.5 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary-container" />
                      <div>
                        <div className="text-xs font-semibold text-ink">{att.file_name}</div>
                        <div className="font-tnum text-[11px] text-secondary">
                          {formatSize(att.file_size)} • {att.mime_type}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewAttachment(att)}
                        className="font-sans text-xs font-semibold px-2 py-1 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer inline-flex items-center justify-center gap-1 transition-all"
                      >
                        <Eye size={12} />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleDownload(att.id, att.file_name)}
                        className="font-sans text-xs font-semibold px-2 py-1 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer inline-flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                        disabled={downloadingId === att.id}
                      >
                        {downloadingId === att.id ? (
                          <Loader2 size={12} className="animate-spin text-primary-container" />
                        ) : (
                          <Download size={12} />
                        )}
                        <span>{downloadingId === att.id ? 'Downloading...' : 'Download'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-hairline">
            <button
              onClick={handleSoftDelete}
              className="bg-transparent text-stamp-red border-[1.5px] border-stamp-red hover:bg-stamp-red hover:text-white uppercase font-sans text-[11px] tracking-wider px-4 py-2 rounded cursor-pointer inline-flex items-center gap-2 transition-all disabled:opacity-50"
              disabled={deleting || record.is_deleted}
            >
              <Trash2 size={14} />
              <span>{deleting ? 'Moving to Vault...' : 'Soft Delete (30-Day Recovery)'}</span>
            </button>

            <div className="flex gap-3">
              <button onClick={onClose} className="font-sans text-xs font-semibold px-4 py-2 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer transition-all">
                Close
              </button>
              {!record.is_deleted && (
                <button
                  onClick={() => { onClose(); onEdit(record); }}
                  className="font-sans text-xs font-semibold px-4 py-2 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center gap-2 transition-all"
                >
                  <Edit size={14} />
                  <span>Edit Docket</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* In-Browser Document Preview Modal */}
      {previewAttachment && (
        <DocumentPreviewModal
          recordId={record.id}
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </>
  );
};
