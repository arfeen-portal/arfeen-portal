'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function AgentImportMultiFile() {
  const [batchId] = useState<string>(() => uuidv4());
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('batchId', batchId);

    const res = await fetch('/admin/api/agents/import/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Upload failed');
    }
  }

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        setLogs((prev) => [...prev, `Uploading: ${file.name}`]);
        await uploadFile(file);
        setLogs((prev) => [...prev, `Uploaded: ${file.name}`]);
      }
      setLogs((prev) => [...prev, `All files uploaded for batch ${batchId}`]);
    } catch (err: any) {
      console.error(err);
      setLogs((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAutoMatch() {
    const res = await fetch('/admin/api/agents/import/auto-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId }),
    });
    const data = await res.json();
    setLogs((prev) => [...prev, `Auto-match: ${data.matched}/${data.total}`]);
  }

  async function handleFinalize() {
    const res = await fetch('/admin/api/agents/import/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId }),
    });
    const data = await res.json();
    setLogs((prev) => [
      ...prev,
      `Finalize: inserted ${data.inserted}, updated ${data.updated}`,
    ]);
  }

  async function handleRollback() {
    const res = await fetch('/admin/api/agents/import/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId }),
    });
    const data = await res.json();
    setLogs((prev) => [
      ...prev,
      `Rollback: deleted agents ${data.deleted_agents ?? 0}`,
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="mb-2 text-sm text-gray-500">
          Batch ID (multi-file): <code>{batchId}</code>
        </div>

        <input
          type="file"
          multiple
          accept=".csv"
          onChange={handleFilesChange}
          disabled={isUploading}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleAutoMatch}
            className="rounded-md border px-3 py-1 text-sm"
          >
            🔍 AI Auto Match
          </button>
          <button
            onClick={handleFinalize}
            className="rounded-md border px-3 py-1 text-sm"
          >
            ✅ Final Import
          </button>
          <button
            onClick={handleRollback}
            className="rounded-md border px-3 py-1 text-sm"
          >
            ⏪ Rollback
          </button>
          <a
            href="/admin/api/agents/import/template"
            className="rounded-md border px-3 py-1 text-sm inline-flex items-center"
          >
            ⬇️ Download Template
          </a>
        </div>
      </div>

      <div className="rounded-lg border p-3 text-xs h-48 overflow-auto bg-gray-50">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
