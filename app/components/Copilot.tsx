'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export default function CopilotUI() {
  const { form, updateForm } = useFormContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hi! I'm your AI Copilot 🤖. I'll help you fill this form. Tell me a bit about yourself.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const allFieldsFilled = form.name && form.email && form.linkedin && form.aiIdea;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUserInput = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await callGeminiAPI([...messages, userMessage]);
      const text = response.text;
      const extracted = response.fields;

      // Update form if new fields are found
      if (extracted.name) updateForm('name', extracted.name);
      if (extracted.email) updateForm('email', extracted.email);
      if (extracted.linkedin) updateForm('linkedin', extracted.linkedin);
      if (extracted.aiIdea) updateForm('aiIdea', extracted.aiIdea);

      // After all 4 fields are filled
      if (!isComplete && form.name && form.email && form.linkedin && form.aiIdea) {
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text },
          {
            sender: 'bot',
            text: `Here's what I got:\n\n👤 Name: ${form.name}\n📧 Email: ${form.email}\n🔗 LinkedIn: ${form.linkedin}\n💡 AI Idea: ${form.aiIdea}\n\nDo you want to edit anything?`,
          },
        ]);
        setIsComplete(true);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Oops! Something went wrong." }]);
    }

    setIsLoading(false);
  };

  const handleEditCommand = () => {
    setMessages(prev => [
      ...prev,
      { sender: 'bot', text: 'Sure! Tell me what to update (e.g., "Change my email to abc@xyz.com").' },
    ]);
    setIsComplete(false); // Allow edits
  };

  return (
    <div className="w-full p-4 border rounded-xl shadow-md bg-white text-black max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">AI Copilot 🤖</h2>
      <div className="space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg max-w-[80%] whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'bg-blue-500 text-white self-end ml-auto'
                : 'bg-gray-200 text-black self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="bg-gray-200 text-black p-2 rounded-lg inline-block">Typing...</div>
        )}
        <div ref={bottomRef}></div>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUserInput()}
          className="flex-1 border p-2 rounded bg-white text-black"
          placeholder="Type your message..."
        />
        <button
          onClick={handleUserInput}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
      {isComplete && (
        <div className="mt-2">
          <button
            onClick={handleEditCommand}
            className="text-sm text-blue-600 underline hover:text-blue-800"
          >
            Edit something
          </button>
        </div>
      )}
    </div>
  );
}
