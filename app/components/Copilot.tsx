'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

type ChatMessage = {
  role: 'user' | 'assistant';
  parts: string;
};

export default function CopilotUI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      parts: 'Hi! I’m your AI Copilot. Tell me about yourself and your AI idea.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { form, updateForm } = useFormContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', parts: input };
    const newHistory = [...messages, newUserMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const fieldUpdates = await callGeminiAPI(
  newHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: msg.parts, // msg.parts is already a string
  }))
);


      updateForm(fieldUpdates);

      const filledFields = Object.entries(fieldUpdates)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      const allFilled =
        fieldUpdates.name &&
        fieldUpdates.email &&
        fieldUpdates.linkedin &&
        fieldUpdates.aiIdea;

      const botReply = allFilled
        ? `Great! Here’s what I got:\n\n${filledFields}\n\nLet me know if you'd like to edit anything.`
        : 'Got it. Tell me more or continue filling in the details.';

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', parts: botReply },
      ]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          parts: 'Sorry, something went wrong while processing your input.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-gray-100 rounded-xl shadow p-4 max-w-xl w-full mx-auto mt-6">
      <div className="h-96 overflow-y-auto space-y-4 p-2 bg-white rounded-md border">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${
              msg.role === 'assistant' ? 'text-gray-900' : 'text-blue-700'
            } whitespace-pre-wrap`}
          >
            <strong>{msg.role === 'assistant' ? '🤖 Copilot' : '🧑 You'}:</strong>{' '}
            {msg.parts}
          </div>
        ))}
        {isLoading && (
          <div className="text-gray-500 italic animate-pulse">Typing...</div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="mt-4 flex">
        <textarea
          className="flex-1 rounded-md border p-2 resize-none"
          rows={2}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
