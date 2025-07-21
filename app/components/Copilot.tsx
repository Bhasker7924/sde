'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

export default function Copilot() {
  const { formData, updateForm } = useFormContext();
  const [conversation, setConversation] = useState([
    { role: 'ai', content: 'Hi! I’m your AI Copilot. Tell me about yourself and your AI idea.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const allFieldsFilled = formData.name && formData.email && formData.linkedin && formData.idea;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Show user input
    setConversation((prev) => [...prev, { role: 'user', content: input }]);

    setIsLoading(true);
    const response = await callGeminiAPI(input, formData);
    setIsLoading(false);

    // Update form if fields found
    if (response?.updates) {
      updateForm(response.updates);
    }

    // Show AI response
    if (response?.message) {
      setConversation((prev) => [...prev, { role: 'ai', content: response.message }]);
    }

    setInput('');
  };

  useEffect(() => {
    if (allFieldsFilled) {
      const summary = `
✅ Here's what I’ve got:
- Name: ${formData.name}
- Email: ${formData.email}
- LinkedIn: ${formData.linkedin}
- AI Idea: ${formData.idea}

Would you like to edit anything?`;
      setConversation((prev) => {
        const alreadySummarized = prev.some((msg) =>
          msg.content?.includes("Here's what I’ve got")
        );
        if (!alreadySummarized) {
          return [...prev, { role: 'ai', content: summary }];
        }
        return prev;
      });
    }
  }, [formData]);

  return (
    <div className="bg-gray-100 p-4 rounded shadow max-w-xl mx-auto h-[80vh] flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-2">
        {conversation.map((msg, i) => (
          <div key={i} className={`p-3 rounded ${msg.role === 'ai' ? 'bg-white text-black' : 'bg-blue-600 text-white self-end'}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="p-3 bg-white rounded text-gray-600 italic">Typing...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex">
        <input
          className="flex-1 border rounded p-2 mr-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}
