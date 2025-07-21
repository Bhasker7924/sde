'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

type ChatMessage = {
  role: 'user' | 'assistant';
  parts: string;
};

type UIMessage = {
  role: 'user' | 'bot';
  content: string;
};

const Copilot = () => {
  const { name, email, linkedin, aiIdea, updateForm } = useFormContext();
  const [messages, setMessages] = useState<UIMessage[]>([
    { role: 'bot', content: 'Hi! I’m your AI assistant. Tell me a bit about yourself to get started.' },
  ]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allFilled = name && email && linkedin && aiIdea;

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: UIMessage = { role: 'user', content: input };
    const botThinking: UIMessage = { role: 'bot', content: 'Thinking...' };
    setMessages(prev => [...prev, userMsg, botThinking]);
    setInput('');
    setIsLoading(true);

    const newChatHistory = [...chatHistory, { role: 'user', parts: input }];
    setChatHistory(newChatHistory);

    const replyFields = await callGeminiAPI(newChatHistory);
    const fieldSummary = Object.entries(replyFields)
      .filter(([_, val]) => val)
      .map(([key, val]) => `**${key}**: ${val}`)
      .join('\n');

    const botReply = fieldSummary
      ? `Got it! Here's what I found:\n${fieldSummary}`
      : `Thanks! Let me know more so I can fill in your details.`;

    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = { role: 'bot', content: botReply };
      return updated;
    });

    if (Object.keys(replyFields).length) {
      updateForm(replyFields);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
  }, [messages]);

  return (
    <div className="bg-gray-100 text-black h-full flex flex-col rounded-xl border border-gray-300 p-4 shadow-md">
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-md text-sm max-w-[80%] ${
              msg.role === 'user' ? 'bg-blue-100 self-end' : 'bg-white self-start'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="mt-4 flex">
        <input
          className="flex-1 border border-gray-400 rounded-l-md p-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-r-md"
          onClick={handleSend}
          disabled={isLoading}
        >
          Send
        </button>
      </div>

      {allFilled && (
        <div className="mt-4 bg-green-100 text-green-800 p-3 rounded-md text-sm">
          ✅ All fields filled! Review them below:
          <ul className="list-disc list-inside mt-2">
            <li><strong>Name:</strong> {name}</li>
            <li><strong>Email:</strong> {email}</li>
            <li><strong>LinkedIn:</strong> {linkedin}</li>
            <li><strong>AI Idea:</strong> {aiIdea}</li>
          </ul>
          You can edit any of these by typing a correction.
        </div>
      )}
    </div>
  );
};

export default Copilot;
