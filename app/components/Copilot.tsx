// app/components/Copilot.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext, FormData } from './FormContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type LLMResponse = {
  message: string;
  updates: Partial<FormData>;
  isSubmissionReady?: boolean;
};

// Function to clean markdown bolding (**) from text
const cleanMarkdownBold = (text: string): string => {
  return text.replace(/\*\*(.*?)\*\*/g, '$1'); // Removes ** surrounding text
};

export default function Copilot() {
  const [input, setInput] = useState<string>('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const { formData, updateForm } = useFormContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (conversation.length === 0 && !isLoading) {
      setConversation([{ role: 'assistant', content: "👋 Hello! I'm your AI Copilot for this form. Let's start with your name." }]); // Added emoji
    }
  }, [conversation, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isCompleted) return;

    const userMessage: Message = { role: 'user', content: input };
    setConversation((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...conversation, userMessage], formData: formData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API Error: ${errorData.message || res.statusText}`);
      }

      const data: LLMResponse = await res.json();

      if (data.updates && Object.keys(data.updates).length > 0) {
        updateForm(data.updates);
      }

      const cleanedAIMessage = cleanMarkdownBold(data.message || '...');

      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: cleanedAIMessage },
      ]);

      if (data.isSubmissionReady) {
        setIsCompleted(true);
        setTimeout(() => {
            const submitButton = document.getElementById('agent-form-submit-button') as HTMLButtonElement | null;
            if (submitButton) {
                submitButton.click();
            } else {
                console.error("Could not find the form's submit button.");
            }
        }, 1500);
      }

    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: `Oops! 😟 It looks like there was an issue. Could you please try that again?` }, // Added emoji
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-indigo-100 shadow-3xl rounded-3xl border border-purple-200 p-6 font-sans"> {/* Enhanced gradient, shadow, rounded, border */}
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center tracking-tight">Your AI Copilot 🤖</h2> {/* Increased font size, weight, tracking */}
      <div className="flex-grow overflow-y-auto pr-3 mb-6 space-y-5 custom-scrollbar"> {/* Increased spacing and padding */}
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[75%] px-5 py-3 rounded-2xl text-lg shadow-lg ${ // Adjusted max-width, padding, rounded, shadow, font size
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-br-none' // Gradient for user messages
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-100' // Lighter border for assistant
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4 p-4 bg-white rounded-2xl shadow-xl border border-purple-100 mt-auto"> {/* Adjusted gap, padding, rounded, shadow, border */}
        <input
          type="text"
          className="flex-grow px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-lg text-gray-800 placeholder:text-gray-500" // Adjusted padding, rounded, focus ring, font size
          placeholder={isCompleted ? "Form submitted! Thank you!" : isLoading ? "Copilot is thinking..." : "Type your message..."} // Improved placeholder text
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || isCompleted}
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-7 py-3 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-lg" // Advanced gradient button
          disabled={isLoading || isCompleted}
        >
          {isLoading ? (
            <svg
              className="animate-spin h-6 w-6 text-white" // Larger spinner
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <>
              Send
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.105 2.188A.5.5 0 002.5 3v11.905c0 .546.7 1.054 1.144.75l10.134-6.08a.5.5 0 000-.84L3.644 2.438a.5.5 0 00-.539-.25z" />
              </svg>
            </>
          )}
        </button>
      </form>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc; /* Lighter track matching theme */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d4a7f0; /* Purple-ish thumb matching theme */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b07cd2; /* Darker on hover */
        }
      `}</style>
    </div>
  );
}
