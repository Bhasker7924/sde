'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const Copilot = () => {
  const { name, email, linkedin, aiIdea, updateForm } = useFormContext();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I’ll help you fill out the form. You can start by introducing yourself!' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const isFormComplete = name && email && linkedin && aiIdea;

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const formattedMessages = newMessages.map(m => ({
      role: m.role,
      parts: m.content,
    }));

    const extractedFields = await callGeminiAPI(formattedMessages);
    updateForm(extractedFields);

    let nextBotMessage = '';

    const stillMissing = [];
    if (!name && !extractedFields.name) stillMissing.push('name');
    if (!email && !extractedFields.email) stillMissing.push('email');
    if (!linkedin && !extractedFields.linkedin) stillMissing.push('LinkedIn profile');
    if (!aiIdea && !extractedFields.aiIdea) stillMissing.push('AI idea');

    if (stillMissing.length > 0) {
      nextBotMessage = `Thanks! Could you also provide your ${stillMissing.join(', ')}?`;
    } else {
      nextBotMessage = `Great! Here's what I got:
- Name: ${name || extractedFields.name}
- Email: ${email || extractedFields.email}
- LinkedIn: ${linkedin || extractedFields.linkedin}
- AI Idea: ${aiIdea || extractedFields.aiIdea}

If you'd like to update anything, just let me know!`;
    }

    setMessages(prev => [...prev, { role: 'assistant', content: nextBotMessage }]);
    setIsTyping(false);
  };

  return (
    <div className="p-4 bg-gray-50 text-black rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="h-96 overflow-y-auto space-y-3 border p-3 rounded bg-white">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-md ${
              m.role === 'assistant' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'
            }`}
          >
            {m.content}
          </div>
        ))}
        {isTyping && <div className="italic text-gray-500">Typing...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="flex mt-4 gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Copilot;
