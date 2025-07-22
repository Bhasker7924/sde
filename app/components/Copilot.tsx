'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

type Message = { role: 'user' | 'model'; content: string };

export default function CopilotUI() {
  const { form, updateForm } = useFormContext();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I’m your AI Copilot. Tell me about yourself and your AI idea." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const payload = {
      role: 'user',
      parts: input,
    };

    const response = await callGeminiAPI([payload], form);
    setMessages(prev => [...prev, { role: 'model', content: response }]);
    setLoading(false);

    updateForm(parseExtractedFields(response));
  };

  const parseExtractedFields = (text: string): Partial<typeof form> => {
    const updates: Partial<typeof form> = {};
    if (/name\s*[:\-]/i.test(text)) updates.name = extract(text, 'name');
    if (/email\s*[:\-]/i.test(text)) updates.email = extract(text, 'email');
    if (/linkedin\s*[:\-]/i.test(text)) updates.linkedin = extract(text, 'linkedin');
    if (/idea|ai idea\s*[:\-]/i.test(text)) updates.aiIdea = extract(text, 'ai idea') || extract(text, 'idea');
    return updates;
  };

  const extract = (text: string, key: string) => {
    const match = text.match(new RegExp(`${key}\\s*[:\\-]?\\s*(.+)`, 'i'));
    return match?.[1]?.split('\n')[0]?.trim() || '';
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-2">AI Copilot</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto mb-4 border p-3 rounded bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block px-3 py-2 rounded-lg"
              style={{
                background: msg.role === 'user' ? '#dcfce7' : '#e0f2fe',
                color: '#000',
                maxWidth: '90%',
              }}
            >
              {msg.role === 'user' ? '🧑 ' : '🤖 '}
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <div className="text-left text-gray-500">🤖 Typing...</div>}
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="flex-1 p-2 border rounded"
          placeholder="Type your response..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>

      {/* Display collected values */}
      <div className="mt-4 bg-gray-100 p-3 rounded text-sm">
        <p><strong>Name:</strong> {form.name}</p>
        <p><strong>Email:</strong> {form.email}</p>
        <p><strong>LinkedIn:</strong> {form.linkedin}</p>
        <p><strong>AI Idea:</strong> {form.aiIdea}</p>
      </div>
    </div>
  );
}
