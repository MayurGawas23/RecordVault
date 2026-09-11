import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { AttachmentDropzone } from '../components/AttachmentDropzone';

describe('AttachmentDropzone Component Tests', () => {
  test('renders dropzone prompt and browse button', () => {
    render(<AttachmentDropzone files={[]} onFilesChange={() => {}} />);
    expect(screen.getByText(/Drag & Drop Archival Attachments Here/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Files/i)).toBeInTheDocument();
  });

  test('displays file name and size for selected files', () => {
    const mockFile = new File(['hello content'], 'docket_report.pdf', { type: 'application/pdf' });
    render(<AttachmentDropzone files={[mockFile]} onFilesChange={() => {}} />);
    expect(screen.getByText('docket_report.pdf')).toBeInTheDocument();
    expect(screen.getByText('READY')).toBeInTheDocument();
  });

  test('rejects disallowed executable files (.exe)', () => {
    const handleFilesChange = vi.fn();
    const { container } = render(<AttachmentDropzone files={[]} onFilesChange={handleFilesChange} />);
    
    const fileInput = container.querySelector('input[type="file"]');
    const exeFile = new File(['binary content'], 'virus.exe', { type: 'application/x-msdownload' });
    
    fireEvent.change(fileInput, { target: { files: [exeFile] } });
    expect(screen.getByText(/disallowed for security reasons/i)).toBeInTheDocument();
    expect(handleFilesChange).not.toHaveBeenCalled();
  });
});
