'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from './FormContext';
import { callGeminiAPI } from '../lib/llmHandler';

type Message = {
  role: 'user' | 'bot';
  content: string;
};

const Copilot = () => {
  const { formData, updateFormData } = useFormContext();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hi! I\'m your AI assistant. Tell me about yourself and your AI agent idea!' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [completed, setCompleted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const allFieldsFilled = () =>
    formData.name && formData.email && formData.linkedin && formData.aiIdea;

  const extractFields = (text: string) => {
    const nameMatch = text.match(/(?:my name is|i am|this is)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
    const linkedinMatch = text.match(/https?:\/\/(www\.)?linkedin\.com\/[^\s]+/i);
    const ideaMatch = text.match(/(?:idea|build|create|agent)[^.!?]{10,200}[.!?]/i);

    if (nameMatch) updateFormData('name', nameMatch[1].trim());
    if (emailMatch) updateFormData('email', emailMatch[0].trim());
    if (linkedinMatch) updateFormData('linkedin', linkedinMatch[0].trim());
    if (ideaMatch) updateFormData('aiIdea', ideaMatch[0].trim());
  };

  const handleUserInput = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    extractFields(input);

    if (!allFieldsFilled()) {
      const response = await callGeminiAPI(updatedMessages);
      const botMessage: Message = { role: 'bot', content: response };
      setMessages((prev) => [...prev, botMessage]);
    } else if (!completed) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: `Here's what I gathered:\n\n👤 Name: ${formData.name}\n📧 Email: ${formData.email}\n🔗 LinkedIn: ${formData.linkedin}\n💡 AI Idea: ${formData.aiIdea}\n\nWould you like to edit any of these?`,
        },
      ]);
      setCompleted(true);
    } else {
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('change') || lowerInput.includes('edit')) {
        const fieldMatch = lowerInput.match(/(name|email|linkedin|idea)/);
        if (fieldMatch) {
          const field = fieldMatch[1];
          setMessages((prev) => [
            ...prev,
            { role: 'bot', content: `Sure, what should be the new ${field}?` },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'bot', content: 'Which field would you like to edit? (name, email, LinkedIn, or idea)' },
          ]);
        }
      } else {
        const fieldUpdate = input.match(/(?:name|email|linkedin|idea):?\s(.+)/i);
        if (fieldUpdate) {
          const fieldText = input.toLowerCase();
          if (fieldText.includes('name')) updateFormData('name', fieldUpdate[1]);
          else if (fieldText.includes('email')) updateFormData('email', fieldUpdate[1]);
          else if (fieldText.includes('linkedin')) updateFormData('linkedin', fieldUpdate[1]);
          else if (fieldText.includes('idea')) updateFormData('aiIdea', fieldUpdate[1]);

          setMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              content: `✅ Updated! Here's the new info:\n\n👤 Name: ${formData.name}\n📧 Email: ${formData.email}\n🔗 LinkedIn: ${formData.linkedin}\n💡 AI Idea: ${formData.aiIdea}`,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'bot', content: 'Thanks! Let me know if you need anything else.' },
          ]);
        }
      }
    }

    setIsTyping(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="p-4 max-w-2xl mx-auto bg-white text-black rounded-xl shadow-md space-y-4">
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-md ${
              msg.role === 'user' ? 'bg-blue-100 text-right ml-10' : 'bg-gray-100 mr-10'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isTyping && <div className="text-gray-500 italic">Copilot is typing...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          className="flex-grow border rounded-md p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUserInput()}
          placeholder="Type your response..."
        />
        <button
          className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
          onClick={handleUserInput}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Copilot;
