'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext, FormData } from './FormContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type LLMResponse = {
  message: string;
  updates: Partial<{
    name: string;
    email: string;
    linkedin: string;
    aiIdea: string;
    LinkedIn: string;
  }>;
};

export default function Copilot() {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([
    { role: 'assistant', content: '👋 Hi! I’m your AI assistant. Tell me a bit about yourself.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewed, setReviewed] = useState(false); // Flag for review stage

  const { formData, updateForm } = useFormContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [conversation]);

  const allFilled = () =>
    formData.name.trim() &&
    formData.email.trim() &&
    formData.linkedin.trim() &&
    formData.idea.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setConversation(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Intercept if form is filled and user types "edit ..."
    if (allFilled() && input.toLowerCase().startsWith('edit')) {
      const parts = input.toLowerCase().split(' ');
      const field = parts[1];
      const fieldMap: Record<string, keyof FormData> = {
        name: 'name',
        email: 'email',
        linkedin: 'linkedin',
        idea: 'idea'
      };
      const key = fieldMap[field];
      if (key) {
        setConversation(prev => [
          ...prev,
          { role: 'assistant', content: `Sure! What would you like to change ${key} to?` }
        ]);
        setReviewed(false); // Let user modify
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...conversation, userMsg] })
      });

      const data: LLMResponse = await res.json();

      const updates: Partial<FormData> = {};
      if (data.updates.name) updates.name = data.updates.name;
      if (data.updates.email) updates.email = data.updates.email;
      if (data.updates.linkedin) updates.linkedin = data.updates.linkedin;
      if (data.updates.LinkedIn) updates.linkedin = data.updates.LinkedIn;
      if (data.updates.aiIdea) updates.idea = data.updates.aiIdea;

      if (Object.keys(updates).length > 0) {
        updateForm(updates);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'Thanks!'
      };

      setConversation(prev => [...prev, assistantMessage]);

      // Trigger review once all filled and not yet reviewed
      if (allFilled() && !reviewed) {
        setTimeout(() => {
          const summary = `✅ All set! Here's what I got:\n\n• Name: ${formData.name || updates.name}\n• Email: ${formData.email || updates.email}\n• LinkedIn: ${formData.linkedin || updates.linkedin}\n• AI Idea: ${formData.idea || updates.idea}\n\nWould you like to edit anything? You can say "edit email", "change name", etc.`;
          setConversation(prev => [...prev, { role: 'assistant', content: summary }]);
          setReviewed(true);
        }, 500);
      }
    } catch (err) {
      console.error('LLM error:', err);
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Failed to get a response. Try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100 shadow-2xl rounded-2xl border border-blue-200 p-6">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6 flex items-center justify-center gap-2">
        🤖 AI Copilot
      </h2>

      <div className="flex-grow min-h-[200px] space-y-4 mb-4 overflow-y-auto p-4 border border-blue-200 rounded-lg bg-white shadow-inner scrollbar-thin">
        {conversation.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            <div className={`p-3 rounded-lg max-w-[75%] break-words shadow-md ${msg.role === 'assistant' ? 'bg-blue-600 text-white rounded-tl-none' : 'bg-gray-200 text-gray-800 rounded-tr-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-800 text-sm animate-pulse max-w-[75%] shadow-md">
              Assistant is typing<span className="dot-animation">.</span><span className="dot-animation delay-1">.</span><span className="dot-animation delay-2">.</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 p-2 bg-white rounded-lg shadow-inner border border-blue-100 mt-auto">
        <input
          type="text"
          className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800"
          placeholder={isLoading ? 'Please wait...' : 'Type your message...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? '...' : 'Send 🚀'}
        </button>
      </form>

      <style jsx>{`
        .dot-animation {
          display: inline-block;
          animation: dot-bounce 1.4s infinite ease-in-out both;
        }
        .dot-animation.delay-1 {
          animation-delay: 0.2s;
        }
        .dot-animation.delay-2 {
          animation-delay: 0.4s;
        }
        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
