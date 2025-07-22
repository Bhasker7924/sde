'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

export default function CopilotUI() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      parts: 'Hi! I’m your AI Copilot. Tell me about yourself and your AI idea.',
    },
  ]);

  const { formData, updateFormData } = useFormContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);

  const allFieldsFilled = formData.name && formData.email && formData.linkedin && formData.aiIdea;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', parts: input };
    const newHistory = [...history, userMessage];
    setHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const fieldUpdates = await callGeminiAPI(
        newHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: msg.parts,
        }))
      );

      if (fieldUpdates) updateFormData(fieldUpdates);

      let response = '';
      if (allFieldsFilled || (
        fieldUpdates.name &&
        fieldUpdates.email &&
        fieldUpdates.linkedin &&
        fieldUpdates.aiIdea
      )) {
        const summary = `Here's what I got:\n- Name: ${fieldUpdates.name || formData.name}\n- Email: ${fieldUpdates.email || formData.email}\n- LinkedIn: ${fieldUpdates.linkedin || formData.linkedin}\n- AI Idea: ${fieldUpdates.aiIdea || formData.aiIdea}\nWould you like to edit any field?`;
        response = summary;
      } else {
        response = fieldUpdates.response || "Thanks! Tell me more.";
      }

      setHistory([...newHistory, { role: 'assistant', parts: response }]);
    } catch (error) {
      console.error('LLM Error:', error);
      setHistory([
        ...newHistory,
        { role: 'assistant', parts: 'Sorry, something went wrong while processing your input.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white text-black p-4 rounded-2xl shadow-lg max-w-2xl mx-auto space-y-3">
      <div className="h-[400px] overflow-y-auto space-y-2 p-2 border rounded-lg bg-gray-50">
        {history.map((msg, i) => (
          <div key={i} className={`text-sm p-2 rounded-md ${msg.role === 'user' ? 'text-blue-800 bg-blue-100' : 'text-green-800 bg-green-100'}`}>
            <span className="font-bold">{msg.role === 'user' ? '🧑 You' : '🤖 Copilot'}:</span> {msg.parts}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 p-2 border rounded-lg"
          placeholder="Say something..."
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
