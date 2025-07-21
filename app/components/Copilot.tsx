'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Copilot = () => {
  const { formData, updateForm } = useFormContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I’m your AI Copilot 🤖. I’ll help you fill this form. Tell me a bit about yourself.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if all 4 fields are filled
  const isFormComplete = () =>
    formData.name && formData.email && formData.linkedin && formData.aiIdea;

  // Format filled fields for review
  const formatReview = () => {
    return `Here's what I've got:
- 👤 Name: ${formData.name}
- 📧 Email: ${formData.email}
- 🔗 LinkedIn: ${formData.linkedin}
- 💡 AI Idea: ${formData.aiIdea}

Would you like to edit any of these?`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const llmMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        parts: msg.content,
      }));

      const updates = await callGeminiAPI(llmMessages);

      if (Object.keys(updates).length > 0) {
        updateForm(updates);
      }

      let botReply = '';

      if (!isFormComplete()) {
        const missing = [];
        if (!formData.name && !updates.name) missing.push('name');
        if (!formData.email && !updates.email) missing.push('email');
        if (!formData.linkedin && !updates.linkedin) missing.push('LinkedIn');
        if (!formData.aiIdea && !updates.aiIdea) missing.push('AI idea');

        if (missing.length) {
          botReply = `Thanks! Could you tell me your ${missing[0]}?`;
        } else {
          botReply = `Thanks!`;
        }
      } else {
        if (input.toLowerCase().includes('edit')) {
          botReply = `Sure! Let me know which field you'd like to update (name, email, LinkedIn, or AI idea).`;
        } else {
          botReply = formatReview();
        }
      }

      setMessages([...updatedMessages, { role: 'assistant', content: botReply }]);
    } catch (error) {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: 'Oops! Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-6 bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-bold mb-2 text-black">AI Copilot 🤖</h2>
      <div className="h-96 overflow-y-auto space-y-2 bg-gray-100 p-3 rounded">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-xl max-w-[80%] whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white self-end ml-auto'
                : 'bg-gray-300 text-black'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="p-2 bg-gray-300 text-black rounded-xl inline-block animate-pulse">
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <textarea
          className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={2}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Copilot;
          
