import React, { useState } from 'react';
import { AttachmentDropzone } from './AttachmentDropzone';
import { X, Save, AlertCircle, FileText, Trash2 } from 'lucide-react';
import apiClient from '../api/apiClient';

export const CreateEditRecordModal = ({ record = null, onClose, onSaveSuccess }) => {
  const isEdit = !!record;
  const [title, setTitle] = useState(record?.title || '');
  const [description, setDescription] = useState(record?.description || '');
  const [category, setCategory] = useState(record?.category || 'Feature Spec');
  const [status, setStatus] = useState(record?.status || 'active');
  const [existingAttachments, setExistingAttachments] = useState(record?.attachments || []);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const handleDeleteExistingAttachment = async (attachmentId, fileName) => {
    if (!window.confirm(`Are you sure you want to remove attachment "${fileName}" from this docket?`)) {
      return;
    }

    setDeletingId(attachmentId);
    try {
      await apiClient.delete(`/records/${record.id}/attachments/${attachmentId}`);
      setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove attachment file.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Project docket title is required.');
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        // Update record metadata
        await apiClient.put(`/records/${record.id}`, {
          title,
          description,
          category,
          status
        });

        // Upload new attachments if any
        if (newFiles.length > 0) {
          const formData = new FormData();
          newFiles.forEach(file => formData.append('files', file));
          await apiClient.post(`/records/${record.id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // Create new record with attachments
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('status', status);
        newFiles.forEach(file => formData.append('files', file));

        await apiClient.post('/records', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save project docket.');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-[#1e2a33]/45 flex items-center justify-center z-[1000] p-6">
      <div className="bg-cell border-[1.5px] border-double border-ink w-full max-w-[680px] max-h-[90vh] overflow-y-auto shadow-2xl p-8 rounded">
        <div className="flex items-center justify-between border-b border-hairline pb-3 mb-5">
          <div>
            <h2 className="font-serif text-[22px] font-medium text-ink">{isEdit ? 'Edit Record' : 'New Record'}</h2>
            <p className="text-xs text-secondary">
              {isEdit ? `Docket ID: ${record.id}` : 'Create a new record.'}
            </p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-stamp-red p-3 rounded mb-4 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">Title *</label>
            <input
              type="text"
              className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Microservices Event Bus Architecture Spec [#PRJ-1042]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-ink"> Category</label>
              <select
                className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="Architecture">Architecture</option>
                <option value="Feature Spec">Feature Spec</option>
                <option value="QA Test Suite">QA Test Suite</option>
                <option value="Bug Docket">Bug Docket</option>
                <option value="Release Build">Release Build</option>
                <option value="Security Audit">Security Audit</option>
                <option value="API Spec">API Spec</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-ink"> Status</label>
              <select
                className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="active">Active </option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">Description</label>
            <textarea
              className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter technical details, acceptance criteria, test scope, or build hash..."
            />
          </div>

          {/* Existing Uploaded Files Section for Edit Mode */}
          {isEdit && (
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">
                Currently Uploaded Attachments ({existingAttachments.length})
              </label>
              {existingAttachments.length === 0 ? (
                <p className="text-xs text-secondary italic">
                  No files currently attached to this docket.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {existingAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between bg-cell border border-hairline px-3 py-2 rounded"
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

                      <button
                        type="button"
                        onClick={() => handleDeleteExistingAttachment(att.id, att.file_name)}
                        className="bg-transparent text-stamp-red border-[1.5px] border-stamp-red hover:bg-stamp-red hover:text-white uppercase font-sans text-[11px] tracking-wider px-2 py-1 rounded cursor-pointer inline-flex items-center gap-1 transition-all disabled:opacity-50"
                        disabled={deletingId === att.id}
                      >
                        <Trash2 size={12} />
                        <span>{deletingId === att.id ? 'Deleting...' : 'Remove'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dropzone for Uploading New Attachments */}
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">
              {isEdit ? 'Upload Additional Files' : ' Attachments '}
            </label>
            <AttachmentDropzone files={newFiles} onFilesChange={setNewFiles} />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-hairline">
            <button type="button" onClick={onClose} className="font-sans text-xs font-semibold px-4 py-2 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer transition-all disabled:opacity-50" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="font-sans text-xs font-semibold px-4 py-2 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50" disabled={loading}>
              <Save size={14} />
              <span>{loading ? 'Saving...' : (isEdit ? 'Update Record' : 'Publish Record')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
