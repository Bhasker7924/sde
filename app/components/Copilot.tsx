'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

export default function Copilot() {
  const { formData, updateForm } = useFormContext();
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Hi! I’m your AI Copilot. Tell me about yourself and your AI idea.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allFieldsFilled = Object.values(formData).every((val) => val.trim() !== '');

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUserMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    const prompt = `
Given this message: "${userMessage}"
Extract or update any of the following fields if mentioned:
- Name
- Email
- LinkedIn
- AI Idea

Current values: 
Name: ${formData.name || 'N/A'}
Email: ${formData.email || 'N/A'}
LinkedIn: ${formData.linkedin || 'N/A'}
AI Idea: ${formData.aiIdea || 'N/A'}

Return only updated fields as JSON like:
{"name": "John", "email": "john@email.com"}
`;

    try {
      const response = await callGeminiAPI(prompt);

      const match = response.match(/```json([\s\S]*?)```/);
      const jsonString = match ? match[1] : response;

      const updates = JSON.parse(jsonString);
      updateForm(updates);

      const botMessage = getBotResponse({ ...formData, ...updates });
      setMessages((prev) => [...prev, { sender: 'bot', text: botMessage }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: 'bot', text: "Sorry, I couldn't process that." }]);
    }

    setIsLoading(false);
  };

  const getBotResponse = (data: typeof formData) => {
    if (!allFieldsFilled) {
      const missing = Object.entries(data)
        .filter(([, val]) => !val.trim())
        .map(([key]) => key)
        .join(', ');
      return `Thanks! Could you also tell me your ${missing}?`;
    } else {
      return `Thanks! Here's what I got:\n\n- Name: ${data.name}\n- Email: ${data.email}\n- LinkedIn: ${data.linkedin}\n- AI Idea: ${data.aiIdea}\n\nLet me know if you'd like to edit any field.`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleUserMessage();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-100 rounded-xl shadow-md text-black">
      <h2 className="text-xl font-bold mb-4">🤖 AI Copilot</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg whitespace-pre-line ${
              msg.sender === 'user' ? 'bg-blue-100 text-right ml-10' : 'bg-white mr-10'
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleUserMessage}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
      }
