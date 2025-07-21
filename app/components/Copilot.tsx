'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from '../context/FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

type ChatMessage = {
  role: 'user' | 'assistant';
  parts: string;
};

export default function Copilot() {
  const { name, email, linkedin, aiIdea, updateForm } = useFormContext();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allFieldsFilled = name && email && linkedin && aiIdea;

  const handleSend = async () => {
    if (!input.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', parts: input }];
    setChatHistory(newHistory);
    setInput('');
    setLoading(true);

    const extracted = await callGeminiAPI(newHistory);
    updateForm(extracted);

    const assistantMsg = generateAssistantResponse(extracted);
    setChatHistory([...newHistory, { role: 'assistant', parts: assistantMsg }]);
    setLoading(false);
  };

  const generateAssistantResponse = (extracted: Partial<typeof import('../context/FormContext').FormData>) => {
    if (Object.keys(extracted).length === 0) return "Sorry, I couldn't get that. Could you rephrase?";

    if (!allFieldsFilled) {
      const filled = Object.entries(extracted)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      return `Got it. You provided: ${filled}. Anything else you'd like to share?`;
    } else {
      setIsComplete(true);
      return `Thanks! Here's what I got:
- Name: ${name}
- Email: ${email}
- LinkedIn: ${linkedin}
- AI Idea: ${aiIdea}

Would you like to review or edit any field? Just let me know.`;
    }
  };

  const handleEdit = async () => {
    setIsComplete(false);
    const editPrompt = 'Sure! Which field would you like to update? (name, email, linkedin, aiIdea)';
    setChatHistory([...chatHistory, { role: 'assistant', parts: editPrompt }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([
        {
          role: 'assistant',
          parts: 'Hi! I’m your AI assistant. Tell me your name, email, LinkedIn, and AI idea. You can start naturally!',
        },
      ]);
    }
  }, []);

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-xl max-w-xl mx-auto mt-8 shadow-lg">
      <div className="space-y-2 h-96 overflow-y-auto mb-4 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${
              msg.role === 'user' ? 'text-right text-blue-600' : 'text-left text-green-600'
            }`}
          >
            <span className="block whitespace-pre-wrap">{msg.parts}</span>
          </div>
        ))}
        {loading && <div className="text-gray-400 italic">Assistant is typing...</div>}
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>

      {isComplete && (
        <div className="mt-4 text-sm text-center">
          <button
            onClick={handleEdit}
            className="text-blue-500 underline hover:text-blue-700"
          >
            Edit your details
          </button>
        </div>
      )}
    </div>
  );
}
