'use client';

import { useState, useContext } from 'react';
import { FormContext } from './FormContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Copilot() {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([
    { role: 'assistant', content: '👋 Hi! I’m your AI assistant. Tell me a bit about yourself.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { formData, updateForm } = useContext(FormContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages: Message[] = [...conversation, { role: 'user', content: input }];
    setConversation(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LLM API failed: ${errText}`);
      }

      const data = await res.json();

      // Try to extract fields from the LLM reply
      const extracted = extractFields(data.reply);
      if (Object.keys(extracted).length > 0) {
        updateForm(extracted);
      }

      setConversation((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Failed to get a response.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractFields = (text: string) => {
    const updates: Partial<typeof formData> = {};
    const nameMatch = text.match(/name\s*[:\-–]\s*(.+)/i);
    const emailMatch = text.match(/\bemail\s*[:\-–]\s*([^\s]+)/i);
    const linkedinMatch = text.match(/\blinkedin\s*[:\-–]\s*(https?:\/\/[^\s]+)/i);
    const ideaMatch = text.match(/idea\s*[:\-–]\s*(.+)/i);

    if (nameMatch) updates.name = nameMatch[1].trim();
    if (emailMatch) updates.email = emailMatch[1].trim();
    if (linkedinMatch) updates.linkedin = linkedinMatch[1].trim();
    if (ideaMatch) updates.idea = ideaMatch[1].trim();

    return updates;
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow-md rounded-xl mt-8">
      <h2 className="text-xl font-bold mb-4">🤖 AI Copilot</h2>

      <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${
              msg.role === 'assistant'
                ? 'bg-blue-100 text-black'
                : 'bg-gray-200 text-gray-800 text-right'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="text-sm text-gray-500 animate-pulse">Assistant is typing...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
          disabled={isLoading}
        >
          Send
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-600 space-y-1">
        <div><strong>Name:</strong> {formData.name || '—'}</div>
        <div><strong>Email:</strong> {formData.email || '—'}</div>
        <div><strong>LinkedIn:</strong> {formData.linkedin || '—'}</div>
        <div><strong>Idea:</strong> {formData.idea || '—'}</div>
      </div>
    </div>
  );
}
