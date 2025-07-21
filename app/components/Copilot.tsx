'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from '../context/FormContext';
import { callGeminiAPI } from '../llmHandler';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

const Copilot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hi! I’m your AI copilot. Tell me about yourself, and I’ll help fill the form!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const {
    name,
    email,
    linkedin,
    aiIdea,
    updateForm,
  } = useFormContext();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const allFieldsFilled = name && email && linkedin && aiIdea;

  const generatePrompt = (input: string) => {
    return `
You are a friendly AI form assistant. A user will tell you things in any order. Your job is to extract:

- Name
- Email
- LinkedIn URL
- AI idea

Here is what the user said: "${input}"

Return only the updated values in JSON format. Example:
{ "name": "Alice", "email": "alice@example.com" }

If no new info, return {}.
`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const prompt = generatePrompt(input);
    const result = await callGeminiAPI(prompt);

    try {
      const extracted = JSON.parse(result || '{}');

      // Update form context if values exist
      if (extracted.name) updateForm('name', extracted.name);
      if (extracted.email) updateForm('email', extracted.email);
      if (extracted.linkedin) updateForm('linkedin', extracted.linkedin);
      if (extracted.aiIdea || extracted.idea) {
        updateForm('aiIdea', extracted.aiIdea || extracted.idea);
      }

      let botReply = '';

      if (Object.keys(extracted).length === 0) {
        if (allFieldsFilled) {
          // Check if user wants edits
          const lower = input.toLowerCase();
          if (lower.includes('change') || lower.includes('edit')) {
            botReply = 'Sure! Tell me what you want to update.';
          } else {
            botReply = 'All fields are already filled. Let me know if you’d like to make any changes.';
          }
        } else {
          botReply = 'Got it. Please share more details like your email, LinkedIn, or your AI idea.';
        }
      } else {
        botReply = 'Thanks! I’ve updated the form.';
      }

      // After all fields filled, show summary
      if (
        !Object.keys(extracted).length &&
        allFieldsFilled &&
        !messages.some(m => m.text.includes('Here’s what I have so far'))
      ) {
        botReply += `\n\nHere’s what I have so far:
- Name: ${name}
- Email: ${email}
- LinkedIn: ${linkedin}
- AI Idea: ${aiIdea}

Let me know if you’d like to update anything.`;
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    } catch (err) {
      console.error('Failed to parse LLM response', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Oops! Something went wrong while understanding your input.',
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white rounded-xl shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`rounded-xl px-4 py-2 max-w-[80%] text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-sm text-gray-400">Typing...</div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Say something..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            disabled={isLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Copilot;
