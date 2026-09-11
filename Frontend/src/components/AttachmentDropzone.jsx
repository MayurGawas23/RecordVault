import React, { useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.sh', '.cmd', '.dll', '.msi', '.ps1', '.vbs', '.js'];

export const AttachmentDropzone = ({ files = [], onFilesChange, maxFiles = 10, maxSizeBytes = 10 * 1024 * 1024 }) => {
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndAddFiles = (newFiles) => {
    setError(null);
    const validFiles = [];

    if (files.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} attachments allowed per record.`);
      return;
    }

    for (const file of newFiles) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (DISALLOWED_EXTENSIONS.includes(ext)) {
        setError(`File extension '${ext}' is disallowed for security reasons.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setError(`File '${file.name}' exceeds the 10MB limit.`);
        return;
      }
      validFiles.push(file);
    }

    onFilesChange([...files, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`p-6 text-center rounded cursor-pointer transition-all border-2 border-dashed ${
          isDragOver ? 'border-primary-container bg-folio' : 'border-hairline bg-container-low'
        }`}
      >
        <UploadCloud size={32} className="mx-auto mb-2 text-primary-container" />
        <p className="font-semibold text-ink mb-1">
          Drag & Drop Archival Attachments Here
        </p>
        <p className="text-xs text-secondary mb-3">
          Supports PDF, Images, Office Docs, Text, Zip up to 10MB per file
        </p>
        
        <label className="font-sans text-xs font-semibold px-4 py-2 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all">
          <span>Browse Files</span>
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-stamp-red text-xs mt-2">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink mb-2">Selected Attachments ({files.length} / {maxFiles})</p>
          <div className="flex flex-col gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-cell border border-hairline px-3 py-2 rounded"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary-container" />
                  <div>
                    <div className="text-xs font-semibold text-ink">{file.name}</div>
                    <div className="font-tnum text-[11px] text-secondary">{formatSize(file.size)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded-sm font-sans text-[9px] font-bold uppercase tracking-wider text-primary-container bg-folio border border-primary-container">
                    READY
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="bg-transparent border-none cursor-pointer text-stamp-red"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
