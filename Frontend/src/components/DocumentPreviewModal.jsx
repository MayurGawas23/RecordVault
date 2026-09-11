import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Eye, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';

export const DocumentPreviewModal = ({ recordId, attachment, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  if (!attachment || !recordId) return null;

  const previewUrl = `/records/${recordId}/attachments/${attachment.id}/preview`;
  const downloadUrl = `/records/${recordId}/attachments/${attachment.id}/download`;

  const mime = (attachment.mime_type || '').toLowerCase();
  const ext = (attachment.file_name || '').split('.').pop().toLowerCase();

  const isPdf = mime.includes('pdf') || ext === 'pdf';
  const isImage = mime.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
  const isText = mime.includes('text') || mime.includes('json') || ['txt', 'json', 'md', 'csv', 'log', 'js', 'py'].includes(ext);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let createdUrl = null;

    if (isText) {
      apiClient.get(previewUrl, { responseType: 'text' })
        .then(res => setTextContent(res.data))
        .catch(err => setError(err.response?.data?.error || 'Could not load text document.'))
        .finally(() => setLoading(false));
    } else if (isPdf || isImage) {
      apiClient.get(previewUrl, { responseType: 'blob' })
        .then(res => {
          const contentType = attachment.mime_type || (isPdf ? 'application/pdf' : 'image/png');
          const blob = new Blob([res.data], { type: contentType });
          createdUrl = window.URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        })
        .catch(err => setError(err.response?.data?.error || 'Failed to load file preview.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => {
      if (createdUrl) {
        window.URL.revokeObjectURL(createdUrl);
      }
    };
  }, [attachment.id, isText, isPdf, isImage, previewUrl]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await apiClient.get(downloadUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to download attachment file.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1e2a33]/45 flex items-center justify-center z-[2000] p-6">
      <div className="bg-cell border-[1.5px] border-double border-ink w-full max-w-[920px] max-h-[92vh] flex flex-col shadow-2xl p-8 rounded">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-primary-container" />
            <div>
              <h3 className="font-serif text-[18px] font-semibold text-ink">
                Document Preview: {attachment.file_name}
              </h3>
              <p className="font-tnum text-[11px] text-secondary">
                MIME: {attachment.mime_type} • Size: {(attachment.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleDownload} className="font-sans text-xs font-semibold px-3 py-1.5 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50" disabled={downloading}>
              {downloading ? (
                <Loader2 size={14} className="animate-spin text-primary-container" />
              ) : (
                <Download size={14} />
              )}
              <span>{downloading ? 'Downloading File...' : 'Download File'}</span>
            </button>
            <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-ink">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 min-h-[480px] bg-desk border border-hairline rounded overflow-hidden flex items-center justify-center relative">
          {loading ? (
            <div className="p-8 text-center text-secondary">
              <Loader2 size={32} className="animate-spin text-primary-container mx-auto mb-3" />
              <p className="font-semibold text-ink">Decrypting & rendering document preview...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-stamp-red">
              <AlertCircle size={32} className="mx-auto mb-2" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : isPdf && blobUrl ? (
            <iframe
              src={blobUrl}
              title={attachment.file_name}
              className="w-full h-[650px] border-none"
            />
          ) : isImage && blobUrl ? (
            <div className="p-6 text-center overflow-auto max-h-[650px] w-full">
              <img
                src={blobUrl}
                alt={attachment.file_name}
                className="max-w-full max-h-[600px] object-contain border border-hairline shadow-md mx-auto"
              />
            </div>
          ) : isText ? (
            <div className="w-full h-full p-4 overflow-auto bg-cell">
              <pre className="font-tnum text-xs text-ink whitespace-pre-wrap break-words font-mono">
                {textContent}
              </pre>
            </div>
          ) : (
            <div className="text-center p-12 text-secondary">
              <FileText size={48} className="text-primary-container mx-auto mb-3" />
              <p className="font-semibold text-base text-ink mb-1">
                Inline Preview Not Available for this File Format
              </p>
              <p className="text-xs mb-4">
                Files with extension '.{ext}' can be downloaded and opened with your default desktop viewer.
              </p>
              <button onClick={handleDownload} className="font-sans text-xs font-semibold px-4 py-2 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50" disabled={downloading}>
                {downloading ? (
                  <Loader2 size={14} className="animate-spin text-white" />
                ) : (
                  <Download size={14} />
                )}
                <span>{downloading ? 'Downloading Attachment...' : 'Download Attachment'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
