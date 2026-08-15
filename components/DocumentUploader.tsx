import React, { useState } from 'react';

interface Props {
  entityId: string;
  onUploadSuccess?: () => void;
}

export const DocumentUploader: React.FC<Props> = ({ entityId, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('character_id', entityId);

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/rag/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      setUploadStatus('success');
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      console.error(err);
      setUploadStatus('error');
      setErrorMessage(err.message || 'Error uploading document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Knowledge Base (RAG)
      </h4>
      <p className="text-xs text-slate-400 mb-4">
        Upload PDF or TXT documents to give the AI long-term contextual knowledge about this entity.
      </p>
      
      <label className="relative flex items-center justify-center w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-slate-800 transition-all">
        {isUploading ? (
          <span className="text-sm text-slate-400">Processing Document...</span>
        ) : (
          <span className="text-sm font-medium text-slate-300">Choose File (PDF/TXT)</span>
        )}
        <input 
          type="file" 
          accept=".pdf,.txt" 
          className="hidden" 
          onChange={handleFileUpload}
          disabled={isUploading}
        />
      </label>

      {uploadStatus === 'success' && (
        <p className="mt-2 text-xs text-emerald-400 font-medium">Document embedded successfully!</p>
      )}
      {uploadStatus === 'error' && (
        <p className="mt-2 text-xs text-red-400 font-medium">{errorMessage}</p>
      )}
    </div>
  );
};
