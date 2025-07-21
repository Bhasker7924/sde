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
  const [reviewed, setReviewed] = useState(false);
  const [editingField, setEditingField] = useState<keyof FormData | null>(null);

  const { formData, updateForm } = useFormContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [conversation]);

  const allFilled = () =>
    formData.name && formData.email && formData.linkedin && formData.idea;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setConversation(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Editing flow
    if (editingField) {
      updateForm({ [editingField]: input });
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: `✅ Updated ${editingField}.` }
      ]);
      setEditingField(null);
      setIsLoading(false);
      return;
    }

    // Review mode – detect "edit name" etc.
    if (allFilled() && input.toLowerCase().startsWith('edit')) {
      const field = input.toLowerCase().split(' ')[1];
      const fieldMap: Record<string, keyof FormData> = {
        name: 'name',
        email: 'email',
        linkedin: 'linkedin',
        idea: 'idea'
      };
      const key = fieldMap[field];
      if (key) {
        setEditingField(key);
        setConversation(prev => [
          ...prev,
          { role: 'assistant', content: `Sure, what should I update the ${key} to?` }
        ]);
        setIsLoading(false);
        return;
      }
    }

    // Regular flow: send to Gemini
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

      if (Object.keys(updates).length > 0) updateForm(updates);

      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: data.message || 'Thanks!' }
      ]);

      if (allFilled() && !reviewed) {
        setTimeout(() => {
          setConversation(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `✅ Here's what I captured:\n\n• Name: ${formData.name || updates.name}\n• Email: ${formData.email || updates.email}\n• LinkedIn: ${formData.linkedin || updates.linkedin}\n• AI Idea: ${formData.idea || updates.idea}\n\nWould you like to edit anything?`
            }
          ]);
          setReviewed(true);
        }, 600);
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
    <div className="flex flex-col h-full bg-white shadow-xl rounded-2xl border border-gray-300 p-4">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">🤖 AI Copilot</h2>

      <div className="flex-grow overflow-y-auto space-y-4 px-2 py-2 bg-gray-50 rounded-lg border">
        {conversation.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            <div className={`p-3 rounded-xl max-w-[75%] whitespace-pre-wrap shadow-md
              ${msg.role === 'assistant' ? 'bg-indigo-600 text-white rounded-tl-none' : 'bg-gray-200 text-gray-800 rounded-tr-none'}
            `}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-800 text-sm animate-pulse shadow-md">
              Assistant is typing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex mt-4 gap-2">
        <input
          className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="text"
          placeholder={isLoading ? 'Please wait...' : 'Type your message'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
          }
                           
