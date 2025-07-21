'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

type ChatMessage = {
  role: 'user' | 'assistant';
  parts: string;
};

const Copilot = () => {
  const { name, email, linkedin, aiIdea, updateForm } = useFormContext();
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allFilled = name && email && linkedin && aiIdea;

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { role: 'user', parts: input };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setInput('');
    setIsLoading(true);

    const fieldUpdates = await callGeminiAPI(newHistory);
    updateForm(fieldUpdates);

    const filledAfterUpdate =
      (fieldUpdates.name || name) &&
      (fieldUpdates.email || email) &&
      (fieldUpdates.linkedin || linkedin) &&
      (fieldUpdates.aiIdea || aiIdea);

    if (filledAfterUpdate) {
      setShowReview(true);
      setIsLoading(false);
      setChatHistory([
        ...newHistory,
        {
          role: 'assistant',
          parts:
            "Thanks! Here's what I’ve got:\n\n" +
            `👤 Name: ${fieldUpdates.name || name}\n` +
            `📧 Email: ${fieldUpdates.email || email}\n` +
            `🔗 LinkedIn: ${fieldUpdates.linkedin || linkedin}\n` +
            `💡 AI Idea: ${fieldUpdates.aiIdea || aiIdea}\n\n` +
            'Would you like to edit anything?',
        },
      ]);
    } else {
      const assistantMsg = generateFollowUpMessage(fieldUpdates);
      setChatHistory([
        ...newHistory,
        {
          role: 'assistant',
          parts: assistantMsg,
        },
      ]);
      setIsLoading(false);
    }
  };

  const generateFollowUpMessage = (fields: Partial<{ name: string; email: string; linkedin: string; aiIdea: string }>) => {

    const remaining = [];
    if (!(fields.name || name)) remaining.push('your name');
    if (!(fields.email || email)) remaining.push('your email');
    if (!(fields.linkedin || linkedin)) remaining.push('your LinkedIn profile');
    if (!(fields.aiIdea || aiIdea)) remaining.push('your AI idea');

    if (remaining.length === 0) return 'Got it!';
    return `Thanks! Can you also provide ${remaining.join(', ')}?`;
  };

  return (
    <div className="p-4 rounded-xl border bg-white shadow-xl max-w-xl mx-auto mt-6">
      <div
        ref={containerRef}
        className="h-[300px] overflow-y-auto mb-4 p-2 border rounded bg-gray-50 text-black"
      >
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 whitespace-pre-wrap ${
              msg.role === 'user' ? 'text-blue-700 font-semibold' : 'text-gray-800'
            }`}
          >
            <strong>{msg.role === 'user' ? 'You' : 'Copilot'}:</strong> {msg.parts}
          </div>
        ))}
        {isLoading && <div className="text-sm text-gray-500 italic">Copilot is typing...</div>}
      </div>

      <div className="flex space-x-2">
        <input
          className="flex-1 border px-3 py-2 rounded bg-white text-black"
          placeholder="Talk to your AI copilot..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleSend}
        >
          Send
        </button>
      </div>

      {showReview && allFilled && (
        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded text-black">
          <h2 className="text-lg font-semibold mb-2">✅ Review your submission</h2>
          <p><strong>👤 Name:</strong> {name}</p>
          <p><strong>📧 Email:</strong> {email}</p>
          <p><strong>🔗 LinkedIn:</strong> {linkedin}</p>
          <p><strong>💡 AI Idea:</strong> {aiIdea}</p>
          <p className="mt-2">If you'd like to edit anything, just say so!</p>
        </div>
      )}
    </div>
  );
};

export default Copilot;
        
