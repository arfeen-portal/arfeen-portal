import AgentImportMultiFile from './AgentImportMultiFile';

export default function Page() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold mb-4">Agent Data Import</h1>
      <AgentImportMultiFile />
    </div>
  );
}
