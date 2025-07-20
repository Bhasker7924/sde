'use client';

import { useState, useContext, useRef, useEffect } from 'react';
import { useFormContext, FormData } from './FormContext';

// Type for individual messages in the conversation
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Define the shape of the LLM response we expect from the backend
type LLMResponse = {
  message: string;
  updates: Partial<{
    name?: string;
    email?: string;
    linkedin?: string;
    aiIdea?: string; // We expect 'aiIdea' from the AI, then map it to 'idea'
    LinkedIn?: string; // Fallback for AI occasionally sending 'LinkedIn'
  }>;
};

export default function Copilot() {
  const [input, setInput] = useState<string>('');
  const [conversation, setConversation] = useState<Message[]>([
    { role: 'assistant', content: '👋 Hi! I’m your AI assistant. Tell me a bit about yourself.' },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Use the custom useFormContext hook to manage form data
  const { formData, updateForm } = useFormContext();

  // Ref for auto-scrolling chat to the latest message
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the bottom of the chat when conversation updates
  useEffect(() => {
    // Only scroll if the user is near the bottom or it's a new message
    const chatContainer = chatEndRef.current?.parentElement;
    if (chatContainer) {
      const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 50; // Add a small buffer
      if (isScrolledToBottom || conversation.length <= 2) { // Auto-scroll for initial messages too
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user's message to conversation
    const userMessage: Message = { role: 'user', content: input };
    const newMessages: Message[] = [...conversation, userMessage];
    setConversation(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }), // Send the whole conversation history
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`LLM API failed: ${errorData.error || res.statusText}`);
      }

      const data: LLMResponse = await res.json();

      // --- Data Normalization and Form Update Logic ---
      if (data.updates && Object.keys(data.updates).length > 0) {
        const normalizedUpdates: Partial<FormData> = { ...data.updates };

        // Normalize 'aiIdea' from AI response to 'idea' for your formData
        if (normalizedUpdates.aiIdea !== undefined) {
          normalizedUpdates.idea = normalizedUpdates.aiIdea;
          delete normalizedUpdates.aiIdea; // Clean up the temporary key
        }
        // Normalize 'LinkedIn' from AI response to 'linkedin' for your formData
        if (normalizedUpdates.LinkedIn !== undefined) {
          normalizedUpdates.linkedin = normalizedUpdates.LinkedIn;
          delete normalizedUpdates.LinkedIn;
        }

        updateForm(normalizedUpdates);
      }
      // --- End Data Normalization ---

      // Add assistant's message to conversation
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: data.message || 'No message from assistant.' },
      ]);

    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Failed to get a response. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 shadow-2xl rounded-2xl border border-blue-200 mt-10 space-y-6">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6 flex items-center justify-center gap-2">
        <span role="img" aria-label="robot-head">🤖</span> AI Copilot
      </h2>

      {/* Chat messages display area */}
      <div className="space-y-4 mb-4 max-h-[500px] min-h-[200px] overflow-y-auto p-4 border border-blue-200 rounded-lg bg-white shadow-inner scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === 'assistant' ? 'justify-start' : 'justify-end'
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-[75%] break-words shadow-md
                ${msg.role === 'assistant'
                  ? 'bg-blue-600 text-white rounded-tl-none' // Assistant bubbles (blue, left)
                  : 'bg-gray-200 text-gray-800 rounded-tr-none' // User bubbles (gray, right)
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-800 text-sm animate-pulse max-w-[75%] shadow-md">
              Assistant is typing<span className="dot-animation">.</span><span className="dot-animation delay-1">.</span><span className="dot-animation delay-2">.</span>
            </div>
          </div>
        )}
        {/* Empty div for auto-scrolling */}
        <div ref={chatEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-3 p-2 bg-white rounded-lg shadow-inner border border-blue-100">
        <input
          type="text"
          className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800"
          placeholder={isLoading ? "Please wait..." : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              Send <span className="text-xl">🚀</span>
            </>
          )}
        </button>
      </form>

      {/* Display of extracted form data */}
      <div className="mt-6 text-sm text-gray-700 space-y-2 p-5 border border-blue-200 rounded-lg bg-white shadow-lg">
        <h3 className="font-extrabold text-xl text-gray-800 border-b pb-2 mb-3">📋 Form Data Collected</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <div className="col-span-1"><strong>Name:</strong> {formData.name || '—'}</div>
          <div className-="col-span-1"><strong>Email:</strong> {formData.email || '—'}</div>
          <div className="col-span-1"><strong>LinkedIn:</strong> {formData.linkedin || '—'}</div>
          <div className="col-span-1"><strong>AI Idea:</strong> {formData.idea || '—'}</div>
        </div>
      </div>
      {/* Basic global styles for dot animation (consider moving to global CSS) */}
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
        /* Custom scrollbar for better appearance */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #60a5fa #dbeafe; /* thumb color track color */
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #dbeafe;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #60a5fa;
          border-radius: 10px;
          border: 2px solid #dbeafe;
        }
      `}</style>
    </div>
  );
          }
