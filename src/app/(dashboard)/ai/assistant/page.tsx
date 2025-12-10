'use client';

import { useState } from 'react';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AiAssistantPage() {
  const [role, setRole] = useState<'customer' | 'agent'>('customer');
  const [sessionId, setSessionId] = useState<number | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage() {
    if (!input.trim()) return;
    setError(null);
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          sessionId,
          message: userMessage.content
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed');
      }

      setSessionId(data.sessionId);
      setMessages((prev) => [...prev, ...data.messages.slice(1)]); // assistant only
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-semibold">AI Assistant</h1>
          <p className="text-xs text-gray-500">
            Quick help for Umrah planning, crowd tips, packages &amp; accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mode:</span>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as 'customer' | 'agent')
            }
          >
            <option value="customer">Customer</option>
            <option value="agent">Agent</option>
          </select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-3 space-y-2 text-sm">
          {messages.length === 0 && (
            <div className="text-xs text-gray-500">
              Start chat: e.g. “Best time for tawaf?”, “Show me ledger balance?”
            </div>
          )}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                m.role === 'user'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'mr-auto bg-gray-100'
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>

        <div className="border-t p-2 flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Type your question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!loading) sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
